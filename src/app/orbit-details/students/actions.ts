"use server";

import { createAdminClient } from "@/lib/supabase/server";

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
 * Robust Lookup: Matches exact numbers (e.g. 16828), prefixed (CIC16828), or case-insensitive.
 */
export async function findStudentOrbitByCicnoAction(
  cicnoQuery: string
): Promise<FindOrbitResponse> {
  const cleanCicno = (cicnoQuery || "").trim();

  if (!cleanCicno) {
    return {
      success: false,
      error: "Please enter your CIC Number.",
    };
  }

  try {
    const supabase = await createAdminClient();
    const digitsOnly = cleanCicno.replace(/\D/g, "");

    // 1. Primary Query: Try matching cicno with various flexible formats
    const searchConditions: string[] = [
      `cicno.eq.${cleanCicno}`,
      `cicno.ilike.${cleanCicno}`,
    ];

    if (digitsOnly && digitsOnly !== cleanCicno) {
      searchConditions.push(`cicno.eq.${digitsOnly}`);
    }
    if (digitsOnly) {
      searchConditions.push(`cicno.eq.CIC${digitsOnly}`);
      searchConditions.push(`cicno.ilike.%${digitsOnly}%`);
    }

    const orFilter = searchConditions.join(",");

    let { data: students, error } = await supabase
      .from("students")
      .select("cicno, student_name, class_name, place, panchayath, district, role, orbit_id, affno")
      .or(orFilter)
      .limit(10);

    // Fallback: If no match with OR filter, try simple direct query
    if ((!students || students.length === 0) && !error) {
      const fallbackQuery = await supabase
        .from("students")
        .select("cicno, student_name, class_name, place, panchayath, district, role, orbit_id, affno")
        .ilike("cicno", `%${cleanCicno}%`)
        .limit(5);

      if (fallbackQuery.data && fallbackQuery.data.length > 0) {
        students = fallbackQuery.data;
      }
    }

    if (error) {
      console.error("Error finding student orbit:", error);
      return {
        success: false,
        error: "Unable to complete search at this time. Please try again.",
      };
    }

    if (!students || students.length === 0) {
      return {
        success: false,
        error: `No registered scholar found with CIC Number "${cleanCicno}". Please verify your number or contact your college administration.`,
      };
    }

    // Select the best matching student (exact match preferred)
    const exactMatch =
      students.find(
        (s) =>
          s.cicno.toLowerCase() === cleanCicno.toLowerCase() ||
          (digitsOnly && s.cicno.replace(/\D/g, "") === digitsOnly)
      ) || students[0];

    // 2. Fetch Orbit Details independently to prevent foreign-key join errors
    let orbitData: StudentOrbitSearchResult["orbit"] = null;
    if (exactMatch.orbit_id) {
      const { data: orb } = await supabase
        .from("orbits")
        .select("id, name, district, taluk, constituency, panchayaths, status")
        .eq("id", exactMatch.orbit_id)
        .maybeSingle();

      if (orb) {
        orbitData = {
          id: orb.id,
          name: orb.name,
          district: orb.district,
          taluk: orb.taluk || "—",
          constituency: orb.constituency || null,
          panchayaths: orb.panchayaths || null,
          status: orb.status || "active",
        };
      }
    }

    // 3. Fetch College Details independently
    let collegeData: StudentOrbitSearchResult["college"] = null;
    if (exactMatch.affno) {
      const { data: col } = await supabase
        .from("colleges")
        .select("affno, name, short_name, place, district")
        .eq("affno", exactMatch.affno)
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
      cicno: exactMatch.cicno,
      student_name: exactMatch.student_name,
      class_name: exactMatch.class_name || "1",
      place: exactMatch.place || "—",
      panchayath: exactMatch.panchayath || null,
      district: exactMatch.district || null,
      role: exactMatch.role || "member",
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
      error: "An unexpected error occurred. Please try again.",
    };
  }
}
