"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface StudentFormPayload {
  cicno: string;
  student_name: string;
  class_name: string;
  place: string;
  panchayath?: string;
  pin_code?: string;
  phone?: string;
  whatsapp?: string;
  g_phone?: string;
  role?: string; // default: 'member'
  orbit_id?: string | null;
  affno?: string | null;
  // Compatibility parameter if legacy CSV includes it
  district?: string;
}

/**
 * Creates a single Student with automatic role: 'member'
 */
export async function createStudentAction(payload: StudentFormPayload) {
  const cleanCic = payload.cicno.trim().toUpperCase();
  const cleanName = payload.student_name.trim();
  const cleanClass = payload.class_name.trim();
  const cleanPlace = payload.place.trim();

  if (!cleanCic || !cleanName || !cleanClass || !cleanPlace) {
    return {
      success: false,
      error: "CIC Number, Student Name, Class, and Place are required.",
    };
  }

  try {
    const supabase = await createAdminClient();

    const rawAff = payload.affno && payload.affno !== "none" ? payload.affno.trim().toUpperCase() : null;
    const rawOrb = payload.orbit_id && payload.orbit_id !== "none" ? payload.orbit_id.trim().toUpperCase() : null;

    let cleanAffno: string | null = null;
    if (rawAff) {
      const { data: col } = await supabase.from("colleges").select("affno").eq("affno", rawAff).maybeSingle();
      if (col) cleanAffno = rawAff;
    }

    let cleanOrbitId: string | null = null;
    if (rawOrb) {
      const { data: orb } = await supabase.from("orbits").select("id").eq("id", rawOrb).maybeSingle();
      if (orb) cleanOrbitId = rawOrb;
    }

    const { error } = await supabase.from("students").upsert(
      {
        cicno: cleanCic,
        student_name: cleanName,
        class_name: cleanClass,
        place: cleanPlace,
        panchayath: payload.panchayath?.trim() || null,
        pin_code: payload.pin_code?.trim() || null,
        phone: payload.phone?.trim() || null,
        whatsapp: payload.whatsapp?.trim() || null,
        g_phone: payload.g_phone?.trim() || null,
        role: payload.role?.trim() || "member",
        orbit_id: cleanOrbitId,
        affno: cleanAffno,
        status: "Active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "cicno" }
    );

    if (error) throw error;

    revalidatePath("/admin/students");
    revalidatePath("/admin/students/settings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/orbit-details/students");
    revalidatePath("/");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create student.";
    return { success: false, error: msg };
  }
}

/**
 * Atomic Bulk CSV Import of Students
 * Header format: cicno,student_name,class_name,place,panchayath,pin_code,phone,whatsapp,g_phone,role,orbit_id,affno
 * 
 * Rules:
 * 1. Role can be left completely blank/empty and automatically defaults to 'member'.
 * 2. In-batch duplicate cicno aborts the whole process.
 * 3. Existing cicno in DB updates all fields with new values (upsert sync).
 * 4. affno and orbit_id can be left blank for future allocation.
 */
export async function bulkImportStudentsAction(records: StudentFormPayload[]) {
  if (!records || records.length === 0) {
    return { success: false, error: "No student records found in CSV." };
  }

  // Pre-validation: Check mandatory fields and in-batch duplicate cicno
  const batchCicSet = new Set<string>();
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (!r.cicno || !r.student_name || !r.class_name || !r.place) {
      return {
        success: false,
        error: `CSV Row ${i + 1} validation failed: cicno, student_name, class_name, and place are mandatory. Entire batch stopped.`,
      };
    }
    const cleanCic = r.cicno.trim().toUpperCase();
    if (batchCicSet.has(cleanCic)) {
      return {
        success: false,
        error: `Duplicate CIC Number '${cleanCic}' detected inside this upload batch at row ${i + 1}. Entire batch stopped.`,
      };
    }
    batchCicSet.add(cleanCic);
  }

  try {
    const supabase = await createAdminClient();

    // Fetch existing valid colleges and orbits to safely avoid foreign key constraint violations
    const [{ data: existingColleges }, { data: existingOrbits }] = await Promise.all([
      supabase.from("colleges").select("affno"),
      supabase.from("orbits").select("id"),
    ]);

    const validCollegesSet = new Set((existingColleges || []).map((c) => c.affno.trim().toUpperCase()));
    const validOrbitsSet = new Set((existingOrbits || []).map((o) => o.id.trim().toUpperCase()));

    const formattedRecords = records.map((r) => {
      const rawAffno = r.affno ? r.affno.trim().toUpperCase() : "";
      const rawOrbit = r.orbit_id ? r.orbit_id.trim().toUpperCase() : "";

      // Only assign affno / orbit_id if they actually exist in the database; otherwise leave as null for future allocation
      const cleanAffno = rawAffno && rawAffno !== "NONE" && validCollegesSet.has(rawAffno) ? rawAffno : null;
      const cleanOrbitId = rawOrbit && rawOrbit !== "NONE" && validOrbitsSet.has(rawOrbit) ? rawOrbit : null;

      return {
        cicno: r.cicno.trim().toUpperCase(),
        student_name: r.student_name.trim(),
        class_name: r.class_name.trim(),
        place: r.place.trim(),
        panchayath: r.panchayath?.trim() || null,
        pin_code: r.pin_code?.trim() || null,
        phone: r.phone?.trim() || null,
        whatsapp: r.whatsapp?.trim() || null,
        g_phone: r.g_phone?.trim() || null,
        role: r.role && r.role.trim() !== "" ? r.role.trim().toLowerCase() : "member",
        orbit_id: cleanOrbitId,
        affno: cleanAffno,
        status: "Active",
        updated_at: new Date().toISOString(),
      };
    });

    // Upsert into Supabase: new ones inserted, existing cicno rows updated
    const { error } = await supabase.from("students").upsert(formattedRecords, {
      onConflict: "cicno",
    });

    if (error) {
      return {
        success: false,
        error: `Database bulk import failed: ${error.message}. Entire batch was aborted without partial data.`,
      };
    }

    revalidatePath("/admin/students");
    revalidatePath("/admin/students/settings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/orbit-details/students");
    revalidatePath("/");

    return { success: true, count: formattedRecords.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Bulk student import failed.";
    return { success: false, error: `Atomic bulk upload failed: ${msg}` };
  }
}

/**
 * Updates an existing student record (cicno is immutable)
 */
export async function updateStudentAction(
  cicno: string,
  payload: Omit<StudentFormPayload, "cicno">
) {
  if (!cicno || !payload.student_name || !payload.class_name || !payload.place) {
    return { success: false, error: "Student Name, Class, and Place are required." };
  }

  try {
    const supabase = await createAdminClient();

    const { error } = await supabase
      .from("students")
      .update({
        student_name: payload.student_name.trim(),
        class_name: payload.class_name.trim(),
        place: payload.place.trim(),
        panchayath: payload.panchayath?.trim() || null,
        pin_code: payload.pin_code?.trim() || null,
        phone: payload.phone?.trim() || null,
        whatsapp: payload.whatsapp?.trim() || null,
        g_phone: payload.g_phone?.trim() || null,
        role: payload.role?.trim() || "member",
        orbit_id: payload.orbit_id && payload.orbit_id !== "none" ? payload.orbit_id.trim() : null,
        affno: payload.affno && payload.affno !== "none" ? payload.affno.trim() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("cicno", cicno);

    if (error) throw error;

    revalidatePath("/admin/students");
    revalidatePath("/admin/students/settings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/orbit-details/students");
    revalidatePath("/");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update student.";
    return { success: false, error: msg };
  }
}

/**
 * Assigns Orbit or College to an unassigned student
 */
export async function assignOrbitOrCollegeAction(
  cicno: string,
  orbit_id?: string | null,
  affno?: string | null
) {
  if (!cicno) return { success: false, error: "Student CIC Number is required." };

  try {
    const supabase = await createAdminClient();

    const updateObj: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (orbit_id !== undefined) {
      updateObj.orbit_id = orbit_id && orbit_id !== "none" ? orbit_id : null;
    }
    if (affno !== undefined) {
      updateObj.affno = affno && affno !== "none" ? affno : null;
    }

    const { error } = await supabase.from("students").update(updateObj).eq("cicno", cicno);

    if (error) throw error;

    revalidatePath("/admin/students");
    revalidatePath("/admin/students/settings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/orbit-details/students");
    revalidatePath("/");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to allocate orbit/college.";
    return { success: false, error: msg };
  }
}

/**
 * Deletes a Student record
 */
export async function deleteStudentAction(cicno: string) {
  if (!cicno) return { success: false, error: "CIC number required." };

  try {
    const supabase = await createAdminClient();

    const { error } = await supabase.from("students").delete().eq("cicno", cicno);

    if (error) throw error;

    revalidatePath("/admin/students");
    revalidatePath("/admin/students/settings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/orbit-details/students");
    revalidatePath("/");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete student.";
    return { success: false, error: msg };
  }
}
