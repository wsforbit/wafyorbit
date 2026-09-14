"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCollegeAction(formData: FormData) {
  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const district = formData.get("district") as string;
  const state = (formData.get("state") as string) || "Kerala";
  const contact_email = formData.get("contact_email") as string;
  const contact_phone = formData.get("contact_phone") as string;

  if (!name || !code || !district) {
    return { success: false, error: "College name, unique code, and district are required." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("colleges").insert({
      name,
      code: code.toUpperCase().trim(),
      district,
      state,
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
    });

    if (error) throw error;

    revalidatePath("/orbit-details/colleges");
    revalidatePath("/orbit-details");
    revalidatePath("/");
    revalidatePath("/portal/admin");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create college.";
    return { success: false, error: msg };
  }
}

export async function createOrbitAction(formData: FormData) {
  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const category = (formData.get("category") as string) || "Academic";
  const description = formData.get("description") as string;
  const college_id = formData.get("college_id") as string;

  if (!name || !code) {
    return { success: false, error: "Orbit name and unique code are required." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("orbits").insert({
      name,
      code: code.toUpperCase().trim(),
      category,
      description: description || null,
      college_id: college_id && college_id !== "none" ? college_id : null,
    });

    if (error) throw error;

    revalidatePath("/orbit-details/orbits");
    revalidatePath("/orbit-details");
    revalidatePath("/");
    revalidatePath("/portal/admin");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create orbit.";
    return { success: false, error: msg };
  }
}

export interface StudentImportRow {
  admission_no: string;
  full_name: string;
  college_id: string;
  orbit_id?: string | null;
  batch_year: number;
  status: "Active" | "Graduated" | "Suspended";
}

/**
 * Atomic Bulk Upload: Validates all items strictly before insertion.
 * If any single record is malformed or duplicate, the entire batch is halted
 * to prevent partial or corrupted state.
 */
export async function atomicBulkImportStudents(students: StudentImportRow[]) {
  if (!students || students.length === 0) {
    return { success: false, error: "No student records provided." };
  }

  // Pre-validation: check for duplicate admission numbers within payload
  const admissionSet = new Set<string>();
  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    if (!s.admission_no || !s.full_name || !s.college_id || !s.batch_year) {
      return {
        success: false,
        error: `Validation error at row ${i + 1}: Missing required fields (admission_no, full_name, college_id, batch_year). Entire batch stopped.`,
      };
    }
    const cleanAdm = s.admission_no.trim();
    if (admissionSet.has(cleanAdm)) {
      return {
        success: false,
        error: `Duplicate admission number '${cleanAdm}' found inside upload payload at row ${i + 1}. Entire batch stopped.`,
      };
    }
    admissionSet.add(cleanAdm);
  }

  try {
    const supabase = await createClient();

    // Call atomic RPC if available, or execute atomic single-batch insert
    const formattedRecords = students.map((s) => ({
      admission_no: s.admission_no.trim(),
      full_name: s.full_name.trim(),
      college_id: s.college_id,
      orbit_id: s.orbit_id || null,
      batch_year: Number(s.batch_year),
      status: s.status || "Active",
    }));

    const { error } = await supabase.from("students").insert(formattedRecords);

    if (error) {
      return {
        success: false,
        error: `Database insertion failed: ${error.message}. Entire batch was aborted without partial data.`,
      };
    }

    revalidatePath("/orbit-details/students");
    revalidatePath("/orbit-details");
    revalidatePath("/");
    revalidatePath("/portal/admin");

    return { success: true, count: formattedRecords.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Bulk insertion failed.";
    return {
      success: false,
      error: `Transactional bulk import failed: ${msg}. No partial data was added.`,
    };
  }
}
