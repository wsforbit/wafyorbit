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

async function testUserCreation() {
  const testEmail = "test_test_probe_user_1234@orbit.com";
  console.log("Testing user creation with role: leader...");
  const { data, error } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: "Password123!",
    email_confirm: true,
    user_metadata: {
      role: "leader",
      assigned_constituency: "Ponnani",
    },
  });

  if (error) {
    console.error("Create test user error:", error);
  } else {
    console.log("User created successfully! ID:", data.user.id);
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();
    console.log("Profile created:", prof, "Prof err:", profErr);
    // Clean up
    await supabase.auth.admin.deleteUser(data.user.id);
    console.log("Cleaned up test user.");
  }
}

testUserCreation();
