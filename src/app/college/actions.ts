"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Updates a single student's assigned orbit
 */
export async function updateStudentOrbitAction(cicno: string, orbitId: string | null) {
  const cleanCicno = (cicno || "").trim().toUpperCase();
  const cleanOrbitId = orbitId && orbitId !== "none" && orbitId !== "unassigned" ? orbitId.trim().toUpperCase() : null;

  if (!cleanCicno) {
    return { success: false, error: "Scholar CIC number is required." };
  }

  try {
    const supabase = await createAdminClient();

    const { error: updateError } = await supabase
      .from("students")
      .update({
        orbit_id: cleanOrbitId,
        updated_at: new Date().toISOString(),
      })
      .eq("cicno", cleanCicno);

    if (updateError) throw updateError;

    revalidatePath("/college/dashboard");
    revalidatePath("/college/update-orbit");
    revalidatePath("/admin/students");
    revalidatePath("/admin/students/settings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/orbit-details/students");
    revalidatePath("/orbit/dashboard");
    revalidatePath("/");

    return {
      success: true,
      message: cleanOrbitId
        ? `Scholar ${cleanCicno} assigned to Orbit ${cleanOrbitId}.`
        : `Scholar ${cleanCicno} orbit assignment removed.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update student orbit assignment.";
    return { success: false, error: msg };
  }
}

/**
 * Bulk updates multiple students' assigned orbits in one operation
 */
export async function bulkAssignStudentsOrbitAction(cicnos: string[], orbitId: string | null) {
  if (!cicnos || cicnos.length === 0) {
    return { success: false, error: "No scholars selected for orbit assignment." };
  }

  const cleanOrbitId = orbitId && orbitId !== "none" && orbitId !== "unassigned" ? orbitId.trim().toUpperCase() : null;
  const cleanCicnos = cicnos.map((c) => c.trim().toUpperCase()).filter(Boolean);

  try {
    const supabase = await createAdminClient();

    const { error: updateError } = await supabase
      .from("students")
      .update({
        orbit_id: cleanOrbitId,
        updated_at: new Date().toISOString(),
      })
      .in("cicno", cleanCicnos);

    if (updateError) throw updateError;

    revalidatePath("/college/dashboard");
    revalidatePath("/college/update-orbit");
    revalidatePath("/admin/students");
    revalidatePath("/admin/students/settings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/orbit-details/students");
    revalidatePath("/orbit/dashboard");
    revalidatePath("/");

    return {
      success: true,
      count: cleanCicnos.length,
      message: cleanOrbitId
        ? `Successfully assigned ${cleanCicnos.length} scholars to Orbit ${cleanOrbitId}.`
        : `Successfully unassigned ${cleanCicnos.length} scholars.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to perform bulk orbit assignment.";
    return { success: false, error: msg };
  }
}
