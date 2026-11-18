import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
let url = "";
let key = "";
env.split("\n").forEach((l) => {
  const [k, ...v] = l.split("=");
  const val = v.join("=").trim().replace(/^['"]|['"]$/g, "");
  if (k.trim() === "NEXT_PUBLIC_SUPABASE_URL") url = val;
  if (k.trim() === "SUPABASE_SERVICE_ROLE_KEY") key = val;
});

const supabase = createClient(url, key);

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function run() {
  const { data: orbits, error } = await supabase
    .from("orbits")
    .select("id, name, district, constituency, status");

  if (error) {
    console.error("Error querying orbits:", error);
    return;
  }

  // 1. 16 Malappuram Constituencies
  const mlpConstituencies = [
    "Kondotty",
    "Eranad",
    "Nilambur",
    "Wandoor",
    "Manjeri",
    "Perinthalmanna",
    "Mankada",
    "Malappuram",
    "Vengara",
    "Vallikkunnu",
    "Tirurangadi",
    "Tanur",
    "Tirur",
    "Kottakkal",
    "Thavanur",
    "Ponnani",
  ];

  const constAccounts = mlpConstituencies.map((cName) => {
    const cOrbits = orbits.filter(
      (o) =>
        (o.district || "").toLowerCase().includes("malappuram") &&
        (o.constituency || "").trim().toLowerCase() === cName.toLowerCase()
    );
    const activeCount = cOrbits.filter((o) => o.status === "active").length;
    const slug = slugify(cName);
    return {
      type: "constituency",
      name: cName,
      slug,
      email: `c_${slug}@orbit.com`,
      password: `const${activeCount}`,
      activeCount,
    };
  });

  // 2. 17 Active Districts
  const distMap = {};
  orbits.forEach((o) => {
    const d = (o.district || "").trim();
    if (!d) return;
    if (!distMap[d]) distMap[d] = { active: 0, total: 0 };
    distMap[d].total++;
    if (o.status === "active") distMap[d].active++;
  });

  const distAccounts = Object.entries(distMap)
    .filter(([_, v]) => v.active > 0)
    .map(([dName, v]) => {
      const slug = slugify(dName);
      return {
        type: "district",
        name: dName,
        slug,
        email: `d_${slug}@orbit.com`,
        password: `dist${v.active}`,
        activeCount: v.active,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const allAccounts = [...constAccounts, ...distAccounts];

  console.log(`Starting provisioning for ${allAccounts.length} accounts...`);

  // Fetch existing users to avoid duplicates or update passwords
  const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existingUsers = userList?.users || [];
  const existingMap = new Map();
  existingUsers.forEach((u) => existingMap.set(u.email?.toLowerCase(), u));

  const results = [];

  for (const acc of allAccounts) {
    const existing = existingMap.get(acc.email.toLowerCase());
    if (existing) {
      // Update password & metadata
      const { error: updErr } = await supabase.auth.admin.updateUserById(
        existing.id,
        {
          password: acc.password,
          user_metadata: {
            role: "leader",
            leader_type: acc.type,
            assigned_constituency: acc.type === "constituency" ? acc.name : null,
            assigned_district: acc.type === "district" ? acc.name : null,
            full_name: `${acc.name} ${acc.type === "constituency" ? "Constituency" : "District"} Leader`,
          },
        }
      );
      if (updErr) {
        results.push({ email: acc.email, status: `Update Failed: ${updErr.message}` });
      } else {
        results.push({ email: acc.email, password: acc.password, status: "Updated" });
      }
    } else {
      // Create new user
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: {
          role: "leader",
          leader_type: acc.type,
          assigned_constituency: acc.type === "constituency" ? acc.name : null,
          assigned_district: acc.type === "district" ? acc.name : null,
          full_name: `${acc.name} ${acc.type === "constituency" ? "Constituency" : "District"} Leader`,
        },
      });

      if (createErr) {
        results.push({ email: acc.email, status: `Create Failed: ${createErr.message}` });
      } else {
        results.push({ email: acc.email, password: acc.password, status: "Created" });
      }
    }
  }

  console.log("=== PROVISIONING RESULTS ===");
  console.table(results);

  // Generate SQL file
  let sql = `-- ==============================================================================
-- WAFY ORBIT: 16 CONSTITUENCY & 17 DISTRICT AUTH ACCOUNTS MIGRATION
-- Run this in the Supabase SQL Editor if you prefer direct SQL execution.
-- ==============================================================================

-- 1. Ensure user_role enum supports 'district' and 'constituency' (optional for profiles table)
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'district';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'constituency';

-- 2. Ensure profiles table has assigned_district and assigned_constituency columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assigned_district TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assigned_constituency TEXT;

-- 3. SQL Insert / Provisioning helper
DO $$
DECLARE
    uid uuid;
BEGIN
`;

  allAccounts.forEach((acc) => {
    const isConst = acc.type === "constituency";
    sql += `
    -- ${acc.name} (${acc.type.toUpperCase()})
    -- Email: ${acc.email} | Password: ${acc.password}
    uid := gen_random_uuid();
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = '${acc.email}') THEN
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
        ) VALUES (
            uid, '00000000-0000-0000-0000-000000000000', '${acc.email}',
            crypt('${acc.password}', gen_salt('bf')), now(),
            '{"provider":"email","providers":["email"]}',
            jsonb_build_object(
                'role', 'leader',
                'leader_type', '${acc.type}',
                '${isConst ? "assigned_constituency" : "assigned_district"}', '${acc.name.replace(/'/g, "''")}',
                'full_name', '${acc.name.replace(/'/g, "''")} ${isConst ? "Constituency" : "District"} Leader'
            ),
            now(), now(), 'authenticated', 'authenticated'
        );
    ELSE
        UPDATE auth.users
        SET encrypted_password = crypt('${acc.password}', gen_salt('bf')),
            raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
                'role', 'leader',
                'leader_type', '${acc.type}',
                '${isConst ? "assigned_constituency" : "assigned_district"}', '${acc.name.replace(/'/g, "''")}',
                'full_name', '${acc.name.replace(/'/g, "''")} ${isConst ? "Constituency" : "District"} Leader'
            ),
            updated_at = now()
        WHERE email = '${acc.email}';
    END IF;
`;
  });

  sql += `
END $$;
`;

  fs.writeFileSync("supabase/provision_district_constituency.sql", sql);
  console.log("\nGenerated SQL script at supabase/provision_district_constituency.sql");
}

run();
