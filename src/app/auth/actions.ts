"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Signs out the currently authenticated user
 */
export async function signOutAction() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Sign out error:", err);
  }

  revalidatePath("/", "layout");
  redirect("/auth/login");
}

/**
 * Fetches the current logged in user & profile
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    return {
      user,
      profile: profile || {
        id: user.id,
        email: user.email || "",
        role: (user.user_metadata?.role as string) || "admin",
      },
    };
  } catch (err) {
    console.error("Error fetching current user:", err);
    return null;
  }
}
