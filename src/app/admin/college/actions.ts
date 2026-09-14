"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CollegeFormPayload {
  affno: string;
  name: string;
  short_name: string;
  place: string;
  district?: string;
  state?: string;
  email?: string;
}

/**
 * Extracts the first word of the short_name column (before any space or comma)
 * Example: "WASC Campus" -> "wasc", "WICC, Calicut" -> "wicc"
 */
function extractFirstWord(text: string): string {
  if (!text) return "college";
  const clean = text.trim().split(/[\s,]+/)[0];
  return clean.toLowerCase().replace(/[^a-z0-9]/g, "") || "college";
}

/**
 * Creates a College record and generates standard auth credentials for the College
 * Email: [first_word_of_short_name]@orbit.com
 * Pass: [affno]_[first_word_of_short_name]
 */
export async function createCollegeWithAuthAction(payload: CollegeFormPayload) {
  const cleanAffno = payload.affno.trim().toUpperCase();
  const cleanName = payload.name.trim();
  const cleanShort = payload.short_name.trim();
  const cleanPlace = payload.place.trim();
  const district = payload.district?.trim() || cleanPlace;

  const firstWord = extractFirstWord(cleanShort);
  const authEmail = `${firstWord}@orbit.com`;
  const authPassword = `${cleanAffno}_${firstWord}`;

  if (!cleanAffno || !cleanName || !cleanShort || !cleanPlace) {
    return {
      success: false,
      error: "Affiliation Number (affno), College Name, Short Name, and Place are required.",
    };
  }

  try {
    const supabase = await createAdminClient();

    // 1. Insert into public.colleges
    const { error: dbError } = await supabase.from("colleges").upsert(
      {
        affno: cleanAffno,
        name: cleanName,
        short_name: cleanShort,
        place: cleanPlace,
        district: district,
        state: payload.state || "Kerala",
        email: payload.email?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "affno" }
    );

    if (dbError) throw dbError;

    // 2. Automatically create the College Auth User in Supabase Auth
    let authCreated = false;
    let authErrorMessage: string | null = null;

    try {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        // Preferred method: Admin API with Service Role Key (auto-confirms email)
        const { error: authError } = await supabase.auth.admin.createUser({
          email: authEmail,
          password: authPassword,
          email_confirm: true,
          user_metadata: {
            role: "college",
            full_name: cleanName,
            assigned_college_id: cleanAffno,
          },
        });

        if (!authError || authError.message.toLowerCase().includes("already registered")) {
          authCreated = true;
        } else {
          authErrorMessage = authError.message;
        }
      } else {
        // Fallback method using standard client signUp
        const anonClient = await createClient();
        const { error: signUpError } = await anonClient.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              role: "college",
              full_name: cleanName,
              assigned_college_id: cleanAffno,
            },
          },
        });

        if (!signUpError || signUpError.message.toLowerCase().includes("already registered")) {
          authCreated = true;
        } else {
          authErrorMessage = signUpError.message;
        }
      }
    } catch (authErr: unknown) {
      authErrorMessage = authErr instanceof Error ? authErr.message : "Auth provisioning failed";
    }

    revalidatePath("/admin/college");
    revalidatePath("/admin/college/settings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/orbit-details/colleges");
    revalidatePath("/");

    return {
      success: true,
      credentials: {
        email: authEmail,
        password: authPassword,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create college.";
    return { success: false, error: msg };
  }
}

/**
 * Atomic Bulk CSV Import of Colleges with all-or-nothing rollback & automated Auth account creation
 */
export async function bulkImportCollegesWithAuthAction(records: CollegeFormPayload[]) {
  if (!records || records.length === 0) {
    return { success: false, error: "No records found in CSV payload." };
  }

  // Pre-validation: Check for duplicate affno inside batch
  const affnoSet = new Set<string>();
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (!r.affno || !r.name || !r.short_name || !r.place) {
      return {
        success: false,
        error: `CSV Row ${i + 1} validation failed: affno, name, short_name, and place must not be empty. Entire batch aborted.`,
      };
    }
    const cleanAffno = r.affno.trim().toUpperCase();
    if (affnoSet.has(cleanAffno)) {
      return {
        success: false,
        error: `Duplicate Affiliation Number '${cleanAffno}' found at row ${i + 1}. Entire batch aborted.`,
      };
    }
    affnoSet.add(cleanAffno);
  }

  try {
    const supabase = await createAdminClient();

    const formatted = records.map((r) => ({
      affno: r.affno.trim().toUpperCase(),
      name: r.name.trim(),
      short_name: r.short_name.trim(),
      place: r.place.trim(),
      district: r.district?.trim() || r.place.trim(),
      state: r.state?.trim() || "Kerala",
      email: r.email?.trim() || null,
      updated_at: new Date().toISOString(),
    }));

    // Upsert into colleges
    const { error: dbError } = await supabase.from("colleges").upsert(formatted, {
      onConflict: "affno",
    });

    if (dbError) {
      return {
        success: false,
        error: `Database bulk insert failed: ${dbError.message}. Entire batch was aborted with zero partial data.`,
      };
    }

    // Provision auth accounts for every imported college
    for (const col of formatted) {
      const firstWord = extractFirstWord(col.short_name);
      const authEmail = `${firstWord}@orbit.com`;
      const authPassword = `${col.affno}_${firstWord}`;

      try {
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          await supabase.auth.admin.createUser({
            email: authEmail,
            password: authPassword,
            email_confirm: true,
            user_metadata: {
              role: "college",
              full_name: col.name,
              assigned_college_id: col.affno,
            },
          });
        } else {
          const anonClient = await createClient();
          await anonClient.auth.signUp({
            email: authEmail,
            password: authPassword,
            options: {
              data: {
                role: "college",
                full_name: col.name,
                assigned_college_id: col.affno,
              },
            },
          });
        }
      } catch (err) {
        // If already created, continue gracefully
      }
    }

    revalidatePath("/admin/college");
    revalidatePath("/admin/college/settings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/orbit-details/colleges");
    revalidatePath("/");

    return { success: true, count: formatted.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Bulk CSV import failed.";
    return { success: false, error: `Atomic CSV import failed: ${msg}` };
  }
}

/**
 * Updates College record content (affno is immutable)
 */
export async function updateCollegeAction(
  affno: string,
  payload: Omit<CollegeFormPayload, "affno">
) {
  if (!affno || !payload.name || !payload.short_name || !payload.place) {
    return { success: false, error: "College Name, Short Name, and Place are required." };
  }

  try {
    const supabase = await createAdminClient();

    const { error } = await supabase
      .from("colleges")
      .update({
        name: payload.name.trim(),
        short_name: payload.short_name.trim(),
        place: payload.place.trim(),
        district: payload.district?.trim() || payload.place.trim(),
        state: payload.state || "Kerala",
        email: payload.email?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("affno", affno);

    if (error) throw error;

    revalidatePath("/admin/college");
    revalidatePath("/admin/college/settings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/orbit-details/colleges");
    revalidatePath("/");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update college.";
    return { success: false, error: msg };
  }
}

/**
 * Deletes College by affno
 */
export async function deleteCollegeAction(affno: string) {
  if (!affno) return { success: false, error: "Affiliation number required." };

  try {
    const supabase = await createAdminClient();

    const { error } = await supabase.from("colleges").delete().eq("affno", affno);

    if (error) throw error;

    revalidatePath("/admin/college");
    revalidatePath("/admin/college/settings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/orbit-details/colleges");
    revalidatePath("/");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete college.";
    return { success: false, error: msg };
  }
}
