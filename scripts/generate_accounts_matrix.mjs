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

async function generateMatrix() {
  const { data: orbits, error } = await supabase
    .from("orbits")
    .select("id, name, district, constituency, status");

  if (error) {
    console.error("Error:", error);
    return;
  }

  // 1. Malappuram Constituencies (16)
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

  const constList = mlpConstituencies.map((cName) => {
    const cOrbits = orbits.filter(
      (o) =>
        (o.district || "").toLowerCase().includes("malappuram") &&
        (o.constituency || "").trim().toLowerCase() === cName.toLowerCase()
    );
    const activeCount = cOrbits.filter((o) => o.status === "active").length;
    const slug = slugify(cName);
    return {
      name: cName,
      slug,
      email: `c_${slug}@orbit.com`,
      password: `const${activeCount}`,
      activeCount,
      totalCount: cOrbits.length,
    };
  });

  // 2. Active Districts (17)
  const distMap = {};
  orbits.forEach((o) => {
    const d = (o.district || "").trim();
    if (!d) return;
    if (!distMap[d]) distMap[d] = { active: 0, total: 0 };
    distMap[d].total++;
    if (o.status === "active") distMap[d].active++;
  });

  const distList = Object.entries(distMap)
    .filter(([_, v]) => v.active > 0)
    .map(([dName, v]) => {
      const slug = slugify(dName);
      return {
        name: dName,
        slug,
        email: `d_${slug}@orbit.com`,
        password: `dist${v.active}`,
        activeCount: v.active,
        totalCount: v.total,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  console.log("=== 16 CONSTITUENCIES ===");
  console.table(constList);

  console.log("\n=== 17 ACTIVE DISTRICTS ===");
  console.table(distList);
}

generateMatrix();
