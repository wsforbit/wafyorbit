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

async function run() {
  const { data, error } = await supabase.from("profiles").select("*").limit(1);
  if (data && data[0]) {
    console.log("Profiles columns:", Object.keys(data[0]));
  }
}
run();
