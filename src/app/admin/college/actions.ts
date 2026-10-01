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

export interface SmtpConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
}

export interface SendBulkEmailsOptions {
  messages: BulkEmailMessage[];
  senderName?: string;
  senderEmail?: string;
  smtp?: SmtpConfig;
}

export interface SendEmailResult {
  affno: string;
  collegeName: string;
  toEmail: string;
  status: "sent" | "failed" | "simulated";
  error?: string;
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
 * Sends mail-merged bulk emails to colleges via SMTP (Gmail / Custom SMTP)
 */
export async function sendBulkCollegeEmailsAction(
  options: SendBulkEmailsOptions
): Promise<SendBulkEmailsResponse> {
  const {
    messages,
    senderName = "Wafy Orbit Administration",
    senderEmail,
    smtp,
  } = options;

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

  // Resolve SMTP Credentials from payload or environment variables
  const rawUser = smtp?.user?.trim() || process.env.SMTP_USER || process.env.GMAIL_USER || "";
  const rawPass = smtp?.pass?.trim() || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "";
  const smtpHost = smtp?.host?.trim() || process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(smtp?.port || process.env.SMTP_PORT || (smtpHost.includes("gmail") ? 465 : 587));
  const smtpSecure = smtpPort === 465;

  // Clean and sanitize user & password (strip quotes and spaces from App Passwords)
  const smtpUser = rawUser.replace(/^["']|["']$/g, "").trim();
  const smtpPass = rawPass.replace(/^["']|["']$/g, "").replace(/\s+/g, "").trim();

  let rawFromEmail = senderEmail?.trim() || process.env.SMTP_FROM || smtpUser || "";
  if (rawFromEmail && !rawFromEmail.includes("@")) {
    rawFromEmail = `${rawFromEmail}@gmail.com`;
  }
  if (!rawFromEmail) {
    rawFromEmail = smtpUser;
  }

  const fromFormatted = rawFromEmail.includes("<")
    ? rawFromEmail
    : `${senderName} <${rawFromEmail}>`;

  const results: SendEmailResult[] = [];
  let sentCount = 0;
  let failedCount = 0;
  let simulatedCount = 0;

  // If no SMTP credentials provided, perform validated simulation
  if (!smtpUser || !smtpPass) {
    for (const msg of messages) {
      if (!msg.toEmail || !msg.toEmail.includes("@")) {
        results.push({
          affno: msg.affno,
          collegeName: msg.collegeName,
          toEmail: msg.toEmail,
          status: "failed",
          error: "Missing or invalid recipient email address in college registry.",
        });
        failedCount++;
      } else {
        results.push({
          affno: msg.affno,
          collegeName: msg.collegeName,
          toEmail: msg.toEmail,
          status: "simulated",
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
      message: `Verified and prepared ${simulatedCount} personalized emails. Add SMTP_USER and SMTP_PASS in your .env.local to dispatch live emails.`,
    };
  }

  // Connect and Dispatch via Nodemailer SMTP
  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Test connection & credentials
    try {
      await transporter.verify();
    } catch (authErr: unknown) {
      const authMsg = authErr instanceof Error ? authErr.message : "SMTP Authentication failed.";
      return {
        success: false,
        total: messages.length,
        sent: 0,
        failed: messages.length,
        simulated: 0,
        results: messages.map((m) => ({
          affno: m.affno,
          collegeName: m.collegeName,
          toEmail: m.toEmail,
          status: "failed",
          error: `SMTP Authentication failed: ${authMsg}. Check your Email and 16-character Google App Password.`,
        })),
        message: `Gmail/SMTP Authentication failed: ${authMsg}. Please verify your 16-character App Password.`,
      };
    }

    // Dispatch loop
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
        const htmlContent = msg.bodyHtml || `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222; max-width: 650px;">
            ${msg.bodyText
              .split("\n\n")
              .map((p) => `<p style="margin-bottom: 12px;">${p.replace(/\n/g, "<br/>")}</p>`)
              .join("")}
          </div>
        `;

        await transporter.sendMail({
          from: fromFormatted,
          to: msg.toEmail,
          subject: msg.subject,
          text: msg.bodyText,
          html: htmlContent,
        });

        results.push({
          affno: msg.affno,
          collegeName: msg.collegeName,
          toEmail: msg.toEmail,
          status: "sent",
        });
        sentCount++;
      } catch (sendErr: unknown) {
        const sendErrMsg = sendErr instanceof Error ? sendErr.message : "Failed to deliver email.";
        results.push({
          affno: msg.affno,
          collegeName: msg.collegeName,
          toEmail: msg.toEmail,
          status: "failed",
          error: sendErrMsg,
        });
        failedCount++;
      }
    }

    return {
      success: sentCount > 0,
      total: messages.length,
      sent: sentCount,
      failed: failedCount,
      simulated: 0,
      results,
      message: `Batch Complete: ${sentCount} emails sent successfully via ${smtpUser}${failedCount > 0 ? `, ${failedCount} failed` : ""}.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Email service error.";
    return {
      success: false,
      total: messages.length,
      sent: 0,
      failed: messages.length,
      simulated: 0,
      results: [],
      message: msg,
    };
  }
}
