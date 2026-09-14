import { createClient } from "./server";
import type {
  AdminDashboardStats,
  LiveMetrics,
  Orbit,
  Student,
  College,
  OrbitLeader,
  OrbitLeadershipRecord,
} from "@/types/database.types";

/**
 * Calculates the 7 required statistics for the Admin Dashboard
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  try {
    const supabase = await createClient();

    const [
      orbitTotalRes,
      orbitActiveRes,
      orbitInactiveRes,
      studentTotalRes,
      studentAssignedRes,
      collegeTotalRes,
    ] = await Promise.all([
      supabase.from("orbits").select("*", { count: "exact", head: true }),
      supabase.from("orbits").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("orbits").select("*", { count: "exact", head: true }).eq("status", "inactive"),
      supabase.from("students").select("*", { count: "exact", head: true }),
      supabase.from("students").select("*", { count: "exact", head: true }).not("orbit_id", "is", null),
      supabase.from("colleges").select("*", { count: "exact", head: true }),
    ]);

    const studentTotal = studentTotalRes.count ?? 0;
    const studentAssigned = studentAssignedRes.count ?? 0;
    const studentUnassigned = Math.max(0, studentTotal - studentAssigned);

    return {
      orbitTotalCount: orbitTotalRes.count ?? 0,
      orbitActiveCount: orbitActiveRes.count ?? 0,
      orbitInactiveCount: orbitInactiveRes.count ?? 0,
      studentTotalCount: studentTotal,
      studentAssignedCount: studentAssigned,
      studentUnassignedCount: studentUnassigned,
      collegeTotalCount: collegeTotalRes.count ?? 0,
    };
  } catch (error) {
    console.error("Error calculating admin dashboard stats:", error);
    return {
      orbitTotalCount: 0,
      orbitActiveCount: 0,
      orbitInactiveCount: 0,
      studentTotalCount: 0,
      studentAssignedCount: 0,
      studentUnassignedCount: 0,
      collegeTotalCount: 0,
    };
  }
}

/**
 * Fetches real-time counts for landing page
 */
export async function getLiveMetrics(): Promise<LiveMetrics> {
  try {
    const supabase = await createClient();
    const [orbitsRes, collegesRes, studentsRes] = await Promise.all([
      supabase.from("orbits").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("colleges").select("*", { count: "exact", head: true }),
      supabase.from("students").select("*", { count: "exact", head: true }),
    ]);

    return {
      orbitCount: orbitsRes.count ?? 0,
      collegeCount: collegesRes.count ?? 0,
      studentCount: studentsRes.count ?? 0,
    };
  } catch (error) {
    console.error("Error fetching live metrics:", error);
    return {
      orbitCount: 0,
      collegeCount: 0,
      studentCount: 0,
    };
  }
}

/**
 * Fetches ACTIVE orbits only (Ascending by Orbit ID)
 */
export async function getActiveOrbits(): Promise<Orbit[]> {
  try {
    const supabase = await createClient();

    const { data: orbits, error } = await supabase
      .from("orbits")
      .select("*")
      .eq("status", "active")
      .order("id", { ascending: true });

    if (error || !orbits) return [];

    const [studentsRes, leadersRes] = await Promise.all([
      supabase.from("students").select("orbit_id"),
      supabase.from("orbit_leaders").select("orbit_id"),
    ]);

    const studentCounts: Record<string, number> = {};
    studentsRes.data?.forEach((s) => {
      if (s.orbit_id) {
        studentCounts[s.orbit_id] = (studentCounts[s.orbit_id] || 0) + 1;
      }
    });

    const leaderCounts: Record<string, number> = {};
    leadersRes.data?.forEach((l) => {
      if (l.orbit_id) {
        leaderCounts[l.orbit_id] = (leaderCounts[l.orbit_id] || 0) + 1;
      }
    });

    return orbits.map((o) => ({
      ...o,
      member_count: studentCounts[o.id] || 0,
      leader_count: leaderCounts[o.id] || 0,
    })) as Orbit[];
  } catch (error) {
    console.error("Error fetching active orbits:", error);
    return [];
  }
}

/**
 * Fetches ALL orbits (Ascending by Orbit ID)
 */
export async function getAdminOrbits(): Promise<Orbit[]> {
  try {
    const supabase = await createClient();
    const { data: orbits, error } = await supabase
      .from("orbits")
      .select("*")
      .order("id", { ascending: true });

    if (error || !orbits) return [];

    const [studentsRes, leadersRes] = await Promise.all([
      supabase.from("students").select("orbit_id"),
      supabase.from("orbit_leaders").select("orbit_id"),
    ]);

    const studentCounts: Record<string, number> = {};
    studentsRes.data?.forEach((s) => {
      if (s.orbit_id) {
        studentCounts[s.orbit_id] = (studentCounts[s.orbit_id] || 0) + 1;
      }
    });

    const leaderCounts: Record<string, number> = {};
    leadersRes.data?.forEach((l) => {
      if (l.orbit_id) {
        leaderCounts[l.orbit_id] = (leaderCounts[l.orbit_id] || 0) + 1;
      }
    });

    return orbits.map((o) => ({
      ...o,
      member_count: studentCounts[o.id] || 0,
      leader_count: leaderCounts[o.id] || 0,
    })) as Orbit[];
  } catch (error) {
    console.error("Error fetching admin orbits:", error);
    return [];
  }
}

export async function getOrbits(): Promise<Orbit[]> {
  return getActiveOrbits();
}

export async function getAllOrbits(): Promise<Orbit[]> {
  return getAdminOrbits();
}

/**
 * Fetches ALL Colleges with computed Student and Leader Counts (Ascending by Affiliation Number)
 */
export async function getAdminColleges(): Promise<College[]> {
  try {
    const supabase = await createClient();
    const { data: colleges, error } = await supabase
      .from("colleges")
      .select("*")
      .order("affno", { ascending: true });

    if (error || !colleges) return [];

    const [studentsRes, leadersRes] = await Promise.all([
      supabase.from("students").select("affno"),
      supabase.from("orbit_leaders").select("student:students(affno)"),
    ]);

    const studentCounts: Record<string, number> = {};
    studentsRes.data?.forEach((s) => {
      if (s.affno) {
        studentCounts[s.affno] = (studentCounts[s.affno] || 0) + 1;
      }
    });

    const leaderCounts: Record<string, number> = {};
    leadersRes.data?.forEach((l) => {
      const studentData = l.student as unknown as { affno?: string } | null;
      const colId = studentData?.affno;
      if (colId) {
        leaderCounts[colId] = (leaderCounts[colId] || 0) + 1;
      }
    });

    return colleges.map((c) => ({
      ...c,
      affno: c.affno,
      student_count: studentCounts[c.affno] || 0,
      leader_count: leaderCounts[c.affno] || 0,
    })) as College[];
  } catch (error) {
    console.error("Error fetching admin colleges:", error);
    return [];
  }
}

export async function getColleges(): Promise<College[]> {
  return getAdminColleges();
}

/**
 * Fetches ALL Students with joined College and Orbit records (Ascending by CIC Number)
 */
export async function getAdminStudents(): Promise<Student[]> {
  try {
    const supabase = await createClient();
    const { data: rawStudents, error } = await supabase
      .from("students")
      .select("*, college:colleges(*), orbit:orbits(*)")
      .order("cicno", { ascending: true });

    if (error || !rawStudents) return [];

    return rawStudents.map((s) => ({
      ...s,
      cicno: s.cicno,
      student_name: s.student_name,
      class_name: s.class_name || "1",
      place: s.place || "—",
      role: s.role || "member",
    })) as Student[];
  } catch (error) {
    console.error("Error fetching admin students:", error);
    return [];
  }
}

export async function getStudents(limit: number = 100): Promise<Student[]> {
  return getAdminStudents();
}

/**
 * Fetches list of Orbit Leaders (Ascending by Orbit ID)
 */
export async function getOrbitLeaders(): Promise<OrbitLeader[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orbit_leaders")
      .select("*, student:students(*)")
      .order("orbit_id", { ascending: true });

    if (error || !data) return [];
    return data as OrbitLeader[];
  } catch (error) {
    console.error("Error fetching orbit leaders:", error);
    return [];
  }
}

/**
 * Fetches comprehensive leadership matrix for each Orbit (Leader & Asst Leader)
 * Attaches enrolled orbit members with college and class details for appointment dropdowns
 */
export async function getOrbitLeadershipData(): Promise<OrbitLeadershipRecord[]> {
  try {
    const supabase = await createClient();

    const [orbitsRes, studentsRes, leadersRes] = await Promise.all([
      supabase.from("orbits").select("*").eq("status", "active").order("id", { ascending: true }),
      supabase.from("students").select("*, college:colleges(*)").order("student_name", { ascending: true }),
      supabase.from("orbit_leaders").select("*, student:students(*, college:colleges(*))"),
    ]);

    const orbits = orbitsRes.data || [];
    const allStudents = (studentsRes.data || []) as (Student & { college?: College | null })[];
    const leaders = leadersRes.data || [];

    return orbits.map((orbit) => {
      const orbitStudents = allStudents.filter((s) => s.orbit_id === orbit.id);
      const orbitLeaders = leaders.filter((l) => l.orbit_id === orbit.id);

      const leaderRecord = orbitLeaders.find(
        (l) => l.position_title === "Leader" || l.position_title?.toLowerCase() === "leader"
      );
      const asstLeaderRecord = orbitLeaders.find(
        (l) => l.position_title === "Asst Leader" || l.position_title?.toLowerCase().includes("asst")
      );

      const leaderStudent = leaderRecord?.student as unknown as (Student & { college?: College | null }) | null;
      const asstStudent = asstLeaderRecord?.student as unknown as (Student & { college?: College | null }) | null;

      return {
        orbit_id: orbit.id,
        orbit_name: orbit.name,
        district: orbit.district,
        state: orbit.state,
        orbit_students: orbitStudents,
        leader: leaderStudent
          ? {
              cicno: leaderStudent.cicno,
              student_name: leaderStudent.student_name,
              affno: leaderStudent.affno || (leaderStudent.college ? leaderStudent.college.affno : null),
              college_name: leaderStudent.college ? leaderStudent.college.name : null,
              phone: leaderStudent.phone || null,
            }
          : null,
        asst_leader: asstStudent
          ? {
              cicno: asstStudent.cicno,
              student_name: asstStudent.student_name,
              affno: asstStudent.affno || (asstStudent.college ? asstStudent.college.affno : null),
              college_name: asstStudent.college ? asstStudent.college.name : null,
              phone: asstStudent.phone || null,
            }
          : null,
      };
    });
  } catch (error) {
    console.error("Error fetching leadership matrix:", error);
    return [];
  }
}
