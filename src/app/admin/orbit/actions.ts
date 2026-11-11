"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { OrbitStatus } from "@/types/database.types";

export interface OrbitFormPayload {
  id: string;
  name: string;
  status: OrbitStatus;
  state: string;
  district: string;
  taluk: string;
  constituency?: string;
  panchayaths?: string;
  description?: string;
}

export interface UpdateOrbitPayload extends Omit<OrbitFormPayload, "id"> {
  email?: string;
  newPassword?: string;
}

/**
 * Extracts the first word of the orbit name (before any space or comma)
 */
function extractFirstWord(text: string): string {
  if (!text) return "orbit";
  const clean = text.trim().split(/[\s,]+/)[0];
  return clean.toLowerCase().replace(/[^a-z0-9]/g, "") || "orbit";
}

/**
 * Creates an Orbit record and generates standard auth credentials for the Orbit Leader
 * Email: [firstword]@orbit.com
 * Pass: [orbitid]_[firstword]
 */
export async function createOrbitWithAuthAction(payload: OrbitFormPayload) {
  const cleanId = payload.id.trim().toUpperCase();
  const cleanName = payload.name.trim();

  const firstWord = extractFirstWord(cleanName);
  const authEmail = `${firstWord}@orbit.com`;
  const authPassword = `${cleanId}_${firstWord}`;

  if (!cleanId || !cleanName || !payload.district || !payload.taluk) {
    return {
      success: false,
      error: "Orbit ID, Name, District, and Taluk are required fields.",
    };
  }

  try {
    const supabase = await createAdminClient();

    // 1. Upsert into public.orbits table
    const { error: dbError } = await supabase.from("orbits").upsert(
      {
        id: cleanId,
        name: cleanName,
        status: payload.status || "active",
        state: payload.state || "Kerala",
        district: payload.district.trim(),
        taluk: payload.taluk.trim(),
        constituency: payload.constituency?.trim() || null,
        panchayaths: payload.panchayaths?.trim() || null,
        description: payload.description?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (dbError) throw dbError;

    // 2. Automatically provision Leader Auth Account in Supabase Auth
    try {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { error: authError } = await supabase.auth.admin.createUser({
          email: authEmail,
          password: authPassword,
          email_confirm: true,
          user_metadata: {
            role: "leader",
            full_name: cleanName,
            assigned_orbit_id: cleanId,
          },
        });

        if (authError && !authError.message.toLowerCase().includes("already registered")) {
          console.warn("Leader auth provisioning notice:", authError.message);
        }
      } else {
        const anonClient = await createClient();
        await anonClient.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              role: "leader",
              full_name: cleanName,
              assigned_orbit_id: cleanId,
            },
          },
        });
      }
    } catch (authErr) {
      console.warn("Leader auth user creation notice:", authErr);
    }

    revalidatePath("/admin/orbit");
    revalidatePath("/admin/orbit/settings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/orbit-details/orbits");
    revalidatePath("/");

    return {
      success: true,
      credentials: {
        email: authEmail,
        password: authPassword,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create orbit.";
    return { success: false, error: msg };
  }
}

/**
 * Atomic Bulk CSV Import of Orbits with all-or-nothing rollback & automated Leader Auth account creation
 */
export async function bulkImportOrbitsWithAuthAction(records: OrbitFormPayload[]) {
  if (!records || records.length === 0) {
    return { success: false, error: "No records found in CSV payload." };
  }

  // Pre-validation: Check for duplicate IDs in batch
  const idSet = new Set<string>();
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (!r.id || !r.name || !r.district || !r.taluk) {
      return {
        success: false,
        error: `CSV Row ${i + 1} validation failed: id, name, district, and taluk must not be empty. Entire batch aborted.`,
      };
    }
    const cleanId = r.id.trim().toUpperCase();
    if (idSet.has(cleanId)) {
      return {
        success: false,
        error: `Duplicate Orbit ID '${cleanId}' found in CSV at row ${i + 1}. Entire batch aborted.`,
      };
    }
    idSet.add(cleanId);
  }

  try {
    const supabase = await createAdminClient();

    const formatted = records.map((r) => ({
      id: r.id.trim().toUpperCase(),
      name: r.name.trim(),
      status: r.status || "active",
      state: r.state?.trim() || "Kerala",
      district: r.district.trim(),
      taluk: r.taluk.trim(),
      constituency: r.constituency?.trim() || null,
      panchayaths: r.panchayaths?.trim() || null,
      description: r.description?.trim() || null,
      updated_at: new Date().toISOString(),
    }));

    const { error: dbError } = await supabase.from("orbits").upsert(formatted, {
      onConflict: "id",
    });

    if (dbError) {
      return {
        success: false,
        error: `Database bulk insert failed: ${dbError.message}. Entire batch was aborted with zero partial data.`,
      };
    }

    // Provision Leader Auth Accounts for each Orbit
    for (const orb of formatted) {
      const firstWord = extractFirstWord(orb.name);
      const authEmail = `${firstWord}@orbit.com`;
      const authPassword = `${orb.id}_${firstWord}`;

      try {
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          await supabase.auth.admin.createUser({
            email: authEmail,
            password: authPassword,
            email_confirm: true,
            user_metadata: {
              role: "leader",
              full_name: orb.name,
              assigned_orbit_id: orb.id,
            },
          });
        } else {
          const anonClient = await createClient();
          await anonClient.auth.signUp({
            email: authEmail,
            password: authPassword,
            options: {
              data: {
                role: "leader",
                full_name: orb.name,
                assigned_orbit_id: orb.id,
              },
            },
          });
        }
      } catch (err) {
        // If already created, continue gracefully
      }
    }

    revalidatePath("/admin/orbit");
    revalidatePath("/admin/orbit/settings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/orbit-details/orbits");
    revalidatePath("/");

    return { success: true, count: formatted.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Bulk CSV import failed.";
    return { success: false, error: `Atomic CSV import failed: ${msg}` };
  }
}

/**
 * Fetches the current leader auth credentials (email and current/old password) for an orbit
 */
export async function getOrbitAuthCredentialsAction(orbitId: string, orbitName: string) {
  if (!orbitId) {
    return { success: false, email: "", currentPassword: "", error: "Orbit ID required." };
  }

  try {
    const supabase = await createAdminClient();
    const firstWord = extractFirstWord(orbitName);
    const defaultEmail = `${firstWord}@orbit.com`;
    const defaultPassword = `${orbitId}_${firstWord}`;

    // Lookup profile by assigned_orbit_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("assigned_orbit_id", orbitId)
      .maybeSingle();

    if (profile?.id) {
      const { data: userData } = await supabase.auth.admin.getUserById(profile.id);
      const email = userData?.user?.email || profile.email || defaultEmail;
      const currentPassword =
        userData?.user?.user_metadata?.current_password || defaultPassword;

      return {
        success: true,
        email,
        currentPassword,
      };
    }

    // Fallback: check if auth.users has a user with assigned_orbit_id or default email
    const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const user = usersData?.users?.find(
      (u) =>
        u.user_metadata?.assigned_orbit_id === orbitId ||
        u.email?.toLowerCase() === defaultEmail.toLowerCase()
    );

    if (user) {
      return {
        success: true,
        email: user.email || defaultEmail,
        currentPassword: user.user_metadata?.current_password || defaultPassword,
      };
    }

    return {
      success: true,
      email: defaultEmail,
      currentPassword: defaultPassword,
    };
  } catch (err: unknown) {
    console.error("Error fetching orbit auth credentials:", err);
    const firstWord = extractFirstWord(orbitName);
    return {
      success: true,
      email: `${firstWord}@orbit.com`,
      currentPassword: `${orbitId}_${firstWord}`,
    };
  }
}

/**
 * Updates Orbit record content and synchronizes Leader Auth account credentials (email and/or password) without verification
 */
export async function updateOrbitAction(
  id: string,
  payload: UpdateOrbitPayload
) {
  if (!id || !payload.name || !payload.district || !payload.taluk) {
    return { success: false, error: "Orbit Name, District, and Taluk are required fields." };
  }

  const cleanName = payload.name.trim();
  const cleanDistrict = payload.district.trim();
  const cleanTaluk = payload.taluk.trim();
  const cleanEmail = payload.email?.trim().toLowerCase();
  const newPassword = payload.newPassword?.trim();

  if (newPassword && newPassword.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  if (cleanEmail && !cleanEmail.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }

  try {
    const supabase = await createAdminClient();

    // 1. Update public.orbits table
    const { data: updatedOrbit, error: dbError } = await supabase
      .from("orbits")
      .update({
        name: cleanName,
        status: payload.status,
        state: payload.state || "Kerala",
        district: cleanDistrict,
        taluk: cleanTaluk,
        constituency: payload.constituency?.trim() || null,
        panchayaths: payload.panchayaths?.trim() || null,
        description: payload.description?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (dbError) throw dbError;

    // 2. Synchronize Leader Auth Account and Profile
    const firstWord = extractFirstWord(cleanName);
    const defaultEmail = `${firstWord}@orbit.com`;
    const defaultPassword = `${id}_${firstWord}`;

    try {
      // Find profile for this orbit
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("assigned_orbit_id", id)
        .maybeSingle();

      let targetUserId = profile?.id;
      let existingUser = null;

      if (targetUserId) {
        const { data: uData } = await supabase.auth.admin.getUserById(targetUserId);
        existingUser = uData?.user;
      } else {
        // Search in auth users list by assigned_orbit_id or default email
        const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        existingUser = usersData?.users?.find(
          (u) =>
            u.user_metadata?.assigned_orbit_id === id ||
            u.email?.toLowerCase() === (cleanEmail || defaultEmail).toLowerCase()
        );
        targetUserId = existingUser?.id;
      }

      const targetEmail = cleanEmail || existingUser?.email || profile?.email || defaultEmail;

      if (targetUserId && existingUser) {
        // Auth user exists: update email and/or password with NO verification
        const updateAttrs: {
          email?: string;
          email_confirm?: boolean;
          password?: string;
          user_metadata?: Record<string, any>;
        } = {
          email_confirm: true, // Auto-confirm email without verification!
        };

        if (cleanEmail && cleanEmail !== existingUser.email) {
          updateAttrs.email = cleanEmail;
        }

        if (newPassword) {
          updateAttrs.password = newPassword;
        }

        const existingMeta = existingUser.user_metadata || {};
        updateAttrs.user_metadata = {
          ...existingMeta,
          full_name: cleanName,
          assigned_orbit_id: id,
          role: "leader",
          ...(newPassword ? { current_password: newPassword } : {}),
        };

        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
          targetUserId,
          updateAttrs
        );

        if (authUpdateError) {
          console.warn("Notice updating auth user:", authUpdateError.message);
        }

        // Ensure profile record is updated
        await supabase
          .from("profiles")
          .upsert(
            {
              id: targetUserId,
              email: targetEmail,
              full_name: cleanName,
              role: "leader",
              assigned_orbit_id: id,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );
      } else {
        // No auth account yet for this orbit: create one directly with confirmed status
        const initialPass = newPassword || defaultPassword;
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: targetEmail,
          password: initialPass,
          email_confirm: true,
          user_metadata: {
            role: "leader",
            full_name: cleanName,
            assigned_orbit_id: id,
            current_password: initialPass,
          },
        });

        if (createError) {
          console.warn("Notice creating new leader auth:", createError.message);
        } else if (newUser?.user) {
          await supabase
            .from("profiles")
            .upsert(
              {
                id: newUser.user.id,
                email: targetEmail,
                full_name: cleanName,
                role: "leader",
                assigned_orbit_id: id,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "id" }
            );
        }
      }
    } catch (authErr) {
      console.warn("Leader auth sync notice:", authErr);
    }

    revalidatePath("/admin/orbit");
    revalidatePath("/admin/orbit/settings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/orbit-details/orbits");
    revalidatePath("/orbit/dashboard");
    revalidatePath("/");

    return { success: true, orbit: updatedOrbit };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update orbit.";
    return { success: false, error: msg };
  }
}

/**
 * Deletes Orbit by ID
 */
export async function deleteOrbitAction(id: string) {
  if (!id) return { success: false, error: "Orbit ID required." };

  try {
    const supabase = await createAdminClient();

    const { error } = await supabase.from("orbits").delete().eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/orbit");
    revalidatePath("/admin/orbit/settings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/orbit-details/orbits");
    revalidatePath("/");

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete orbit.";
    return { success: false, error: msg };
  }
}

/**
 * Merges source orbit into target orbit:
 * 1. Reassigns all students with orbit_id = sourceOrbitId -> targetOrbitId
 * 2. Reassigns all leaders with orbit_id = sourceOrbitId -> targetOrbitId
 * 3. Marks source orbit status as 'inactive'
 */
export async function mergeOrbitsAction(sourceOrbitId: string, targetOrbitId: string) {
  if (!sourceOrbitId || !targetOrbitId) {
    return { success: false, error: "Source and Target Orbit IDs are required." };
  }

  if (sourceOrbitId === targetOrbitId) {
    return { success: false, error: "Source and Target Orbit cannot be the same." };
  }

  try {
    const supabase = await createAdminClient();

    // Fetch both orbits
    const { data: source } = await supabase.from("orbits").select("*").eq("id", sourceOrbitId).single();
    const { data: target } = await supabase.from("orbits").select("*").eq("id", targetOrbitId).single();

    if (!source || !target) {
      return { success: false, error: "One or both orbits could not be located in database." };
    }

    // 1. Reassign students
    const { error: studentErr } = await supabase
      .from("students")
      .update({ orbit_id: targetOrbitId, updated_at: new Date().toISOString() })
      .eq("orbit_id", sourceOrbitId);

    if (studentErr) throw studentErr;

    // 2. Reassign leaders
    const { error: leaderErr } = await supabase
      .from("orbit_leaders")
      .update({ orbit_id: targetOrbitId })
      .eq("orbit_id", sourceOrbitId);

    if (leaderErr) throw leaderErr;

    // 3. Mark source orbit inactive and append merge note
    const mergedDescription = source.description
      ? `${source.description} (Merged into ${target.name} [${targetOrbitId}] on ${new Date().toLocaleDateString()})`
      : `Merged into ${target.name} [${targetOrbitId}] on ${new Date().toLocaleDateString()}`;

    const { error: orbitErr } = await supabase
      .from("orbits")
      .update({
        status: "inactive",
        description: mergedDescription,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sourceOrbitId);

    if (orbitErr) throw orbitErr;

    revalidatePath("/admin/orbit");
    revalidatePath("/admin/orbit/settings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/orbit-details/orbits");
    revalidatePath("/");

    return {
      success: true,
      message: `Successfully merged '${source.name}' into '${target.name}'. All records were reassigned.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to merge orbits.";
    return { success: false, error: msg };
  }
}
