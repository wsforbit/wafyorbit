"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";

export interface StudentOrbitSearchResult {
  cicno: string;
  student_name: string;
  class_name: string;
  place: string;
  panchayath?: string | null;
  district?: string | null;
  role: string;
  orbit?: {
    id: string;
    name: string;
    district: string;
    taluk: string;
    constituency?: string | null;
    panchayaths?: string | null;
    status: string;
  } | null;
  college?: {
    affno: string;
    name: string;
    short_name: string;
    place: string;
    district: string;
  } | null;
}

export interface FindOrbitResponse {
  success: boolean;
  student?: StudentOrbitSearchResult | null;
  error?: string | null;
}

/**
 * Server action to securely query student and assigned orbit by CIC Number.
 * Strict Privacy: Omits all phone numbers, emails, guardian contacts.
 * Robust Lookup: Matches direct numeric IDs (e.g. 16828), case-insensitive, or substring.
 */
export async function findStudentOrbitByCicnoAction(
  cicnoQuery: string
): Promise<FindOrbitResponse> {
  const rawInput = (cicnoQuery || "").trim();

  if (!rawInput) {
    return {
      success: false,
      error: "Please enter your CIC Number.",
    };
  }

  try {
    let supabase = await createAdminClient();

    const cleanCicno = rawInput.trim();
    const digitsOnly = cleanCicno.replace(/\D/g, "");

    let studentRecord: any = null;

    // 1. Direct exact match on cicno (Only query existing columns on students table)
    const { data: s1, error: err1 } = await supabase
      .from("students")
      .select("cicno, student_name, class_name, place, panchayath, pin_code, role, orbit_id, affno")
      .eq("cicno", cleanCicno)
      .maybeSingle();

    if (s1) {
      studentRecord = s1;
    } else if (err1) {
      console.warn("Direct eq query error, trying standard client fallback:", err1);
      const fallbackClient = await createClient();
      const res = await fallbackClient
        .from("students")
        .select("cicno, student_name, class_name, place, panchayath, pin_code, role, orbit_id, affno")
        .eq("cicno", cleanCicno)
        .maybeSingle();
      if (res.data) {
        studentRecord = res.data;
        supabase = fallbackClient;
      }
    }

    // 2. Case-insensitive ilike match if not found
    if (!studentRecord) {
      const { data: s2 } = await supabase
        .from("students")
        .select("cicno, student_name, class_name, place, panchayath, pin_code, role, orbit_id, affno")
        .ilike("cicno", cleanCicno)
        .maybeSingle();

      if (s2) studentRecord = s2;
    }

    // 3. Digits-only match (e.g. user entered "16828" or "CIC 16828")
    if (!studentRecord && digitsOnly && digitsOnly !== cleanCicno) {
      const { data: s3 } = await supabase
        .from("students")
        .select("cicno, student_name, class_name, place, panchayath, pin_code, role, orbit_id, affno")
        .eq("cicno", digitsOnly)
        .maybeSingle();

      if (s3) studentRecord = s3;
    }

    // 4. Substring pattern match (e.g. contains 16828)
    if (!studentRecord && digitsOnly) {
      const { data: s4List } = await supabase
        .from("students")
        .select("cicno, student_name, class_name, place, panchayath, pin_code, role, orbit_id, affno")
        .ilike("cicno", `%${digitsOnly}%`)
        .limit(5);

      if (s4List && s4List.length > 0) {
        studentRecord = s4List[0];
      }
    }

    // If still not found
    if (!studentRecord) {
      return {
        success: false,
        error: `No registered scholar found with CIC Number "${cleanCicno}". Please verify your number or contact your college administration.`,
      };
    }

    // 5. Fetch Orbit Details
    let orbitData: StudentOrbitSearchResult["orbit"] = null;
    if (studentRecord.orbit_id) {
      const { data: orb } = await supabase
        .from("orbits")
        .select("id, name, district, taluk, constituency, panchayaths, status")
        .eq("id", studentRecord.orbit_id)
        .maybeSingle();

      if (orb) {
        orbitData = {
          id: orb.id,
          name: orb.name,
          district: orb.district || "—",
          taluk: orb.taluk || "—",
          constituency: orb.constituency || null,
          panchayaths: orb.panchayaths || null,
          status: orb.status || "active",
        };
      }
    }

    // 6. Fetch College Details
    let collegeData: StudentOrbitSearchResult["college"] = null;
    if (studentRecord.affno) {
      const { data: col } = await supabase
        .from("colleges")
        .select("affno, name, short_name, place, district")
        .eq("affno", studentRecord.affno)
        .maybeSingle();

      if (col) {
        collegeData = {
          affno: col.affno,
          name: col.name,
          short_name: col.short_name || col.name,
          place: col.place || "—",
          district: col.district || "—",
        };
      }
    }

    const result: StudentOrbitSearchResult = {
      cicno: studentRecord.cicno,
      student_name: studentRecord.student_name,
      class_name: studentRecord.class_name || "1",
      place: studentRecord.place || "—",
      panchayath: studentRecord.panchayath || null,
      district: orbitData?.district || collegeData?.district || null,
      role: studentRecord.role || "member",
      orbit: orbitData,
      college: collegeData,
    };

    return {
      success: true,
      student: result,
    };
  } catch (err: unknown) {
    console.error("findStudentOrbitByCicnoAction exception:", err);
    return {
      success: false,
      error: "An unexpected error occurred while searching. Please try again.",
    };
  }
}
