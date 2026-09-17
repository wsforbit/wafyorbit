"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface LeadershipAssignmentPayload {
  orbit_id: string;
  student_id: string; // cicno
  position: "Leader" | "Asst Leader";
  term_year?: string;
}

export interface DistrictLeadershipPayload {
  district: string;
  student_id: string; // cicno
  term_year?: string;
}

export interface ConstituencyLeadershipPayload {
  constituency: string;
  district?: string;
  student_id: string; // cicno
  term_year?: string;
}

/**
 * 1. Assigns or updates a Leader or Asst Leader for an Orbit
 */
export async function assignOrbitLeadershipAction(payload: LeadershipAssignmentPayload) {
  const { orbit_id, student_id, position, term_year = "2025-2026" } = payload;

  if (!orbit_id || !position) {
    return { success: false, error: "Orbit ID and Position are required." };
  }

  try {
    const supabase = await createAdminClient();

    // If student_id is 'none' or blank -> remove existing appointment
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

    // Remove any previous holder of this specific position in this orbit
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

    // Insert new appointment
    const { error: insErr } = await supabase.from("orbit_leaders").insert({
      student_id: student_id.trim().toUpperCase(),
      orbit_id: orbit_id.trim().toUpperCase(),
      position_title: position,
      term_year: term_year,
    });

    if (insErr) throw insErr;

    // Update student's role
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
 * 2. Assigns or updates a District Leader (1 Leader per Active District)
 */
export async function assignDistrictLeaderAction(payload: DistrictLeadershipPayload) {
  const { district, student_id, term_year = "2025-2026" } = payload;
  const cleanDistrict = (district || "").trim();
  const cleanCicno = (student_id || "").trim().toUpperCase();

  if (!cleanDistrict) {
    return { success: false, error: "District name is required." };
  }

  try {
    const supabase = await createAdminClient();

    // If removing appointment
    if (!cleanCicno || cleanCicno === "NONE") {
      try {
        const { data: existing } = await supabase
          .from("district_leaders")
          .select("student_id")
          .eq("district", cleanDistrict);

        if (existing && existing.length > 0) {
          for (const ex of existing) {
            await supabase.from("students").update({ role: "member" }).eq("cicno", ex.student_id);
          }
        }

        await supabase.from("district_leaders").delete().eq("district", cleanDistrict);
      } catch (tableErr) {
        // Fallback: update student role directly
        await supabase.from("students").update({ role: "member" }).eq("role", "district_leader");
      }

      revalidatePath("/admin/orbit-leaders");
      revalidatePath("/admin/orbit-leaders/settings");
      revalidatePath("/admin/dashboard");
      revalidatePath("/orbit-details/leaders");
      revalidatePath("/");

      return { success: true, message: `District Leader appointment cleared for ${cleanDistrict}.` };
    }

    // Try upserting into district_leaders table
    try {
      // Remove any previous appointment for this district
      await supabase.from("district_leaders").delete().eq("district", cleanDistrict);

      const { error: insErr } = await supabase.from("district_leaders").insert({
        district: cleanDistrict,
        student_id: cleanCicno,
        position_title: "District Leader",
        term_year: term_year,
      });

      if (insErr) {
        console.warn("district_leaders table insert warning (will update student role):", insErr.message);
      }
    } catch (tblErr) {
      console.warn("district_leaders table not present, updating student role directly:", tblErr);
    }

    // Update student's role in students table
    await supabase.from("students").update({ role: "district_leader" }).eq("cicno", cleanCicno);

    revalidatePath("/admin/orbit-leaders");
    revalidatePath("/admin/orbit-leaders/settings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/orbit-details/leaders");
    revalidatePath("/");

    return {
      success: true,
      message: `Scholar ${cleanCicno} successfully appointed as District Leader for ${cleanDistrict}!`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to assign District Leader.";
    return { success: false, error: msg };
  }
}

/**
 * 3. Assigns or updates a Constituency Leader (1 Leader per Malappuram Constituency)
 */
export async function assignConstituencyLeaderAction(payload: ConstituencyLeadershipPayload) {
  const { constituency, district = "Malappuram", student_id, term_year = "2025-2026" } = payload;
  const cleanConst = (constituency || "").trim();
  const cleanCicno = (student_id || "").trim().toUpperCase();

  if (!cleanConst) {
    return { success: false, error: "Constituency name is required." };
  }

  try {
    const supabase = await createAdminClient();

    // If removing appointment
    if (!cleanCicno || cleanCicno === "NONE") {
      try {
        const { data: existing } = await supabase
          .from("constituency_leaders")
          .select("student_id")
          .eq("constituency", cleanConst);

        if (existing && existing.length > 0) {
          for (const ex of existing) {
            await supabase.from("students").update({ role: "member" }).eq("cicno", ex.student_id);
          }
        }

        await supabase.from("constituency_leaders").delete().eq("constituency", cleanConst);
      } catch (tableErr) {
        await supabase.from("students").update({ role: "member" }).eq("role", "constituency_leader");
      }

      revalidatePath("/admin/orbit-leaders");
      revalidatePath("/admin/orbit-leaders/settings");
      revalidatePath("/admin/dashboard");
      revalidatePath("/orbit-details/leaders");
      revalidatePath("/");

      return { success: true, message: `Constituency Leader appointment cleared for ${cleanConst}.` };
    }

    // Try upserting into constituency_leaders table
    try {
      await supabase.from("constituency_leaders").delete().eq("constituency", cleanConst);

      const { error: insErr } = await supabase.from("constituency_leaders").insert({
        district: district,
        constituency: cleanConst,
        student_id: cleanCicno,
        position_title: "Constituency Leader",
        term_year: term_year,
      });

      if (insErr) {
        console.warn("constituency_leaders table insert warning (will update student role):", insErr.message);
      }
    } catch (tblErr) {
      console.warn("constituency_leaders table not present, updating student role directly:", tblErr);
    }

    // Update student's role in students table
    await supabase.from("students").update({ role: "constituency_leader" }).eq("cicno", cleanCicno);

    revalidatePath("/admin/orbit-leaders");
    revalidatePath("/admin/orbit-leaders/settings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/orbit-details/leaders");
    revalidatePath("/");

    return {
      success: true,
      message: `Scholar ${cleanCicno} successfully appointed as Constituency Leader for ${cleanConst}!`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to assign Constituency Leader.";
    return { success: false, error: msg };
  }
}

/**
 * Removes an Orbit leadership appointment
 */
export async function removeOrbitLeadershipAction(orbit_id: string, position: "Leader" | "Asst Leader") {
  return assignOrbitLeadershipAction({ orbit_id, student_id: "none", position });
}
