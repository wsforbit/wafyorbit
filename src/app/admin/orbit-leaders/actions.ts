"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface LeadershipAssignmentPayload {
  orbit_id: string;
  student_id: string; // cicno
  position: "Leader" | "Asst Leader";
  term_year?: string;
}

/**
 * Assigns or updates a Leader or Asst Leader for an Orbit
 */
export async function assignOrbitLeadershipAction(payload: LeadershipAssignmentPayload) {
  const { orbit_id, student_id, position, term_year = "2025-2026" } = payload;

  if (!orbit_id || !position) {
    return { success: false, error: "Orbit ID and Position are required." };
  }

  try {
    const supabase = await createAdminClient();

    // 1. If student_id is 'none' or blank -> remove existing appointment for this position
    if (!student_id || student_id === "none") {
      const { data: existing } = await supabase
        .from("orbit_leaders")
        .select("student_id")
        .eq("orbit_id", orbit_id)
        .eq("position_title", position);

      if (existing && existing.length > 0) {
        for (const ex of existing) {
          await supabase.from("students").update({ role: "member" }).eq("cicno", ex.student_id);
        }
      }

      await supabase
        .from("orbit_leaders")
        .delete()
        .eq("orbit_id", orbit_id)
        .eq("position_title", position);

      revalidatePath("/admin/orbit-leaders");
      revalidatePath("/admin/orbit-leaders/settings");
      revalidatePath("/admin/dashboard");
      revalidatePath("/orbit-details/leaders");
      revalidatePath("/");

      return { success: true, message: `${position} appointment cleared.` };
    }

    // 2. Remove any previous holder of this specific position in this orbit
    const { data: prevLeaders } = await supabase
      .from("orbit_leaders")
      .select("student_id")
      .eq("orbit_id", orbit_id)
      .eq("position_title", position);

    if (prevLeaders && prevLeaders.length > 0) {
      for (const pl of prevLeaders) {
        if (pl.student_id !== student_id) {
          await supabase.from("students").update({ role: "member" }).eq("cicno", pl.student_id);
        }
      }
      await supabase
        .from("orbit_leaders")
        .delete()
        .eq("orbit_id", orbit_id)
        .eq("position_title", position);
    }

    // 3. Insert new appointment
    const { error: insErr } = await supabase.from("orbit_leaders").insert({
      student_id: student_id.trim().toUpperCase(),
      orbit_id: orbit_id.trim().toUpperCase(),
      position_title: position,
      term_year: term_year,
    });

    if (insErr) throw insErr;

    // 4. Update student's role to leader/asst_leader
    const newRole = position === "Leader" ? "leader" : "asst_leader";
    await supabase.from("students").update({ role: newRole }).eq("cicno", student_id);

    revalidatePath("/admin/orbit-leaders");
    revalidatePath("/admin/orbit-leaders/settings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/orbit-details/leaders");
    revalidatePath("/");

    return { success: true, message: `Successfully appointed ${position} for Orbit ${orbit_id}!` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to assign leadership.";
    return { success: false, error: msg };
  }
}

/**
 * Removes an Orbit leadership appointment
 */
export async function removeOrbitLeadershipAction(orbit_id: string, position: "Leader" | "Asst Leader") {
  if (!orbit_id || !position) return { success: false, error: "Invalid parameters." };

  try {
    const supabase = await createAdminClient();

    const { data: prev } = await supabase
      .from("orbit_leaders")
      .select("student_id")
      .eq("orbit_id", orbit_id)
      .eq("position_title", position);

    if (prev && prev.length > 0) {
      for (const p of prev) {
        await supabase.from("students").update({ role: "member" }).eq("cicno", p.student_id);
      }
    }

    const { error } = await supabase
      .from("orbit_leaders")
      .delete()
      .eq("orbit_id", orbit_id)
      .eq("position_title", position);

    if (error) throw error;

    revalidatePath("/admin/orbit-leaders");
    revalidatePath("/admin/orbit-leaders/settings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/orbit-details/leaders");
    revalidatePath("/");

    return { success: true, message: `Leadership position removed.` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to remove leadership.";
    return { success: false, error: msg };
  }
}
