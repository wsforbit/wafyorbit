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
    .select("id, name, district, status");

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
        password: `district${v.active}`,
        activeCount: v.active,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existingUsers = userList?.users || [];
  const existingMap = new Map();
  existingUsers.forEach((u) => existingMap.set(u.email?.toLowerCase(), u));

  const results = [];

  for (const acc of distAccounts) {
    const existing = existingMap.get(acc.email.toLowerCase());
    if (existing) {
      const { error: updErr } = await supabase.auth.admin.updateUserById(
        existing.id,
        {
          password: acc.password,
          user_metadata: {
            role: "leader",
            leader_type: "district",
            assigned_district: acc.name,
            full_name: `${acc.name} District Leader`,
          },
        }
      );
      results.push({ email: acc.email, password: acc.password, status: updErr ? updErr.message : "Updated" });
    } else {
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: {
          role: "leader",
          leader_type: "district",
          assigned_district: acc.name,
          full_name: `${acc.name} District Leader`,
        },
      });
      results.push({ email: acc.email, password: acc.password, status: createErr ? createErr.message : "Created" });
    }
  }

  console.log("=== DISTRICT PROVISIONING RESULTS ===");
  console.table(results);
}

run();
