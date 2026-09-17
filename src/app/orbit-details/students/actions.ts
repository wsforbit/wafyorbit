"use server";

import { createClient } from "@/lib/supabase/server";

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
 */
export async function findStudentOrbitByCicnoAction(
  cicnoQuery: string
): Promise<FindOrbitResponse> {
  const cleanCicno = (cicnoQuery || "").trim();

  if (!cleanCicno) {
    return {
      success: false,
      error: "Please provide a valid CIC Number.",
    };
  }

  try {
    const supabase = await createClient();

    // Query student matching cicno (case-insensitive) with joined relations
    const { data: student, error } = await supabase
      .from("students")
      .select(`
        cicno,
        student_name,
        class_name,
        place,
        panchayath,
        district,
        role,
        orbit:orbits (
          id,
          name,
          district,
          taluk,
          constituency,
          panchayaths,
          status
        ),
        college:colleges (
          affno,
          name,
          short_name,
          place,
          district
        )
      `)
      .ilike("cicno", cleanCicno)
      .maybeSingle();

    if (error) {
      console.error("Error finding student orbit:", error);
      return {
        success: false,
        error: "Unable to complete search at this time. Please try again.",
      };
    }

    if (!student) {
      return {
        success: false,
        error: `No registered scholar found with CIC Number "${cleanCicno}". Please check the number or contact your college administration.`,
      };
    }

    const orbitData = student.orbit as unknown as StudentOrbitSearchResult["orbit"];
    const collegeData = student.college as unknown as StudentOrbitSearchResult["college"];

    const result: StudentOrbitSearchResult = {
      cicno: student.cicno,
      student_name: student.student_name,
      class_name: student.class_name || "1",
      place: student.place || "—",
      panchayath: student.panchayath || null,
      district: student.district || null,
      role: student.role || "member",
      orbit: orbitData || null,
      college: collegeData || null,
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
