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
  const { data: profiles, error } = await supabase.from("profiles").select("id, email, role").limit(10);
  console.log("Profiles sample:", profiles);
  if (error) console.error("Profiles error:", error);

  // Check auth users count
  const { data: usersData, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error("User list error:", userError);
  } else {
    console.log("Total auth users:", usersData.users.length);
    console.log("Sample users:", usersData.users.slice(0, 5).map(u => ({ email: u.email, meta: u.user_metadata })));
  }
}
run();
