import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Read .env.local manually
const envContent = fs.readFileSync(".env.local", "utf8");
let supabaseUrl = "";
let supabaseKey = "";

envContent.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  const val = v.join("=").trim().replace(/^["']|["']$/g, "");
  if (k.trim() === "NEXT_PUBLIC_SUPABASE_URL") supabaseUrl = val;
  if (k.trim() === "NEXT_PUBLIC_SUPABASE_ANON_KEY") supabaseKey = val;
  if (k.trim() === "SUPABASE_SERVICE_ROLE_KEY" && !supabaseKey) supabaseKey = val;
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: orbits, error } = await supabase
    .from("orbits")
    .select("id, name, district, constituency, status");

  if (error) {
    console.error("Error:", error);
    return;
  }

  const distMap = {};
  orbits.forEach((o) => {
    const d = (o.district || "Unknown").trim();
    if (!distMap[d]) distMap[d] = { total: 0, active: 0, orbits: [] };
    distMap[d].total++;
    if (o.status === "active") distMap[d].active++;
    distMap[d].orbits.push(o.id);
  });

  const constMap = {};
  orbits.forEach((o) => {
    const c = (o.constituency || "").trim();
    if (!c) return;
    if (!constMap[c]) constMap[c] = { total: 0, active: 0, orbits: [] };
    constMap[c].total++;
    if (o.status === "active") constMap[c].active++;
    constMap[c].orbits.push(o.id);
  });

  console.log("DISTRICTS COUNT:", Object.keys(distMap).length);
  Object.entries(distMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([k, v]) => {
      console.log(`District: "${k}" | active: ${v.active} | total: ${v.total}`);
    });

  console.log("\nCONSTITUENCIES COUNT:", Object.keys(constMap).length);
  Object.entries(constMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([k, v]) => {
      console.log(`Constituency: "${k}" | active: ${v.active} | total: ${v.total}`);
    });
}

check();
