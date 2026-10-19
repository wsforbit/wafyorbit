"use server";

import { getUnassignedStudentsGroupedByCollege } from "@/lib/supabase/data";
import type { CollegeUnassignedGroup } from "@/types/database.types";

export interface GetUnassignedStudentsResponse {
  success: boolean;
  totalUnassigned: number;
  totalColleges: number;
  groups: CollegeUnassignedGroup[];
  error?: string;
}

/**
 * Server action to fetch unassigned students grouped by college
 */
export async function getUnassignedStudentsAction(): Promise<GetUnassignedStudentsResponse> {
  try {
    const data = await getUnassignedStudentsGroupedByCollege();
    return {
      success: true,
      totalUnassigned: data.totalUnassigned,
      totalColleges: data.totalColleges,
      groups: data.groups,
    };
  } catch (error) {
    console.error("Error in getUnassignedStudentsAction:", error);
    return {
      success: false,
      totalUnassigned: 0,
      totalColleges: 0,
      groups: [],
      error: error instanceof Error ? error.message : "Failed to load unassigned students.",
    };
  }
}
