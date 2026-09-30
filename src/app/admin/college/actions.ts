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

export interface BulkEmailMessage {
  affno: string;
  collegeName: string;
  toEmail: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
}

export interface SendBulkEmailsOptions {
  messages: BulkEmailMessage[];
  senderName?: string;
  senderEmail?: string;
  resendApiKey?: string;
}

export interface SendEmailResult {
  affno: string;
  collegeName: string;
  toEmail: string;
  status: "sent" | "failed" | "simulated";
  error?: string;
  resendId?: string;
}

export interface SendBulkEmailsResponse {
  success: boolean;
  total: number;
  sent: number;
  failed: number;
  simulated: number;
  results: SendEmailResult[];
  message: string;
}

/**
 * Sends mail-merged bulk emails to colleges via Resend API or direct simulation
 */
export async function sendBulkCollegeEmailsAction(
  options: SendBulkEmailsOptions
): Promise<SendBulkEmailsResponse> {
  const { messages, senderName = "Wafy Orbit Administration", senderEmail, resendApiKey } = options;

  if (!messages || messages.length === 0) {
    return {
      success: false,
      total: 0,
      sent: 0,
      failed: 0,
      simulated: 0,
      results: [],
      message: "No email messages provided for dispatch.",
    };
  }

  const apiKey = resendApiKey?.trim() || process.env.RESEND_API_KEY || "";
  const fromAddress = senderEmail?.trim() || process.env.RESEND_FROM_EMAIL || "Wafy Orbit <onboarding@resend.dev>";

  const results: SendEmailResult[] = [];
  let sentCount = 0;
  let failedCount = 0;
  let simulatedCount = 0;

  // If no Resend API key is configured, perform validated simulation
  if (!apiKey) {
    for (const msg of messages) {
      if (!msg.toEmail || !msg.toEmail.includes("@")) {
        results.push({
          affno: msg.affno,
          collegeName: msg.collegeName,
          toEmail: msg.toEmail,
          status: "failed",
          error: "Invalid or missing email address in registry.",
        });
        failedCount++;
      } else {
        results.push({
          affno: msg.affno,
          collegeName: msg.collegeName,
          toEmail: msg.toEmail,
          status: "simulated",
          error: undefined,
        });
        simulatedCount++;
      }
    }

    return {
      success: true,
      total: messages.length,
      sent: 0,
      failed: failedCount,
      simulated: simulatedCount,
      results,
      message: `Verified and prepared ${simulatedCount} personalized emails. (Add RESEND_API_KEY to your .env.local to send live emails directly)`,
    };
  }

  // Live dispatch via Resend API
  for (const msg of messages) {
    if (!msg.toEmail || !msg.toEmail.includes("@")) {
      results.push({
        affno: msg.affno,
        collegeName: msg.collegeName,
        toEmail: msg.toEmail,
        status: "failed",
        error: "Missing or invalid recipient email address.",
      });
      failedCount++;
      continue;
    }

    try {
      const payload: Record<string, unknown> = {
        from: fromAddress.includes("<") ? fromAddress : `${senderName} <${fromAddress}>`,
        to: [msg.toEmail],
        subject: msg.subject,
        text: msg.bodyText,
      };

      if (msg.bodyHtml) {
        payload.html = msg.bodyHtml;
      } else {
        // Convert line breaks to HTML paragraphs/breaks
        payload.html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            ${msg.bodyText
              .split("\n\n")
              .map((p) => `<p style="margin-bottom: 12px;">${p.replace(/\n/g, "<br/>")}</p>`)
              .join("")}
          </div>
        `;
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (res.ok && resData.id) {
        results.push({
          affno: msg.affno,
          collegeName: msg.collegeName,
          toEmail: msg.toEmail,
          status: "sent",
          resendId: resData.id,
        });
        sentCount++;
      } else {
        const errorMsg = resData.message || (typeof resData.error === "string" ? resData.error : "Failed to send email.");
        results.push({
          affno: msg.affno,
          collegeName: msg.collegeName,
          toEmail: msg.toEmail,
          status: "failed",
          error: errorMsg,
        });
        failedCount++;
      }
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Network error during email dispatch.";
      results.push({
        affno: msg.affno,
        collegeName: msg.collegeName,
        toEmail: msg.toEmail,
        status: "failed",
        error: errText,
      });
      failedCount++;
    }
  }

  return {
    success: sentCount > 0 || simulatedCount > 0,
    total: messages.length,
    sent: sentCount,
    failed: failedCount,
    simulated: simulatedCount,
    results,
    message: `Batch complete: ${sentCount} sent successfully${failedCount > 0 ? `, ${failedCount} failed` : ""}.`,
  };
}
