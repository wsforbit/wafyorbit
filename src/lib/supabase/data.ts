import { createClient } from "./server";
import type {
  AdminDashboardStats,
  LiveMetrics,
  Orbit,
  Student,
  College,
  OrbitLeader,
  OrbitLeadershipRecord,
  DistrictLeadershipRecord,
  ConstituencyLeadershipRecord,
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

/**
 * Fetches District Leadership matrix (1 Leader per Active District)
 * Highly optimized with in-memory district indexing to eliminate slow page loads
 */
export async function getDistrictLeadershipData(): Promise<DistrictLeadershipRecord[]> {
  try {
    const supabase = await createClient();

    // 1. Parallel fetch active orbits, all students with relations, and district leaders
    const [orbitsRes, studentsRes, distLeadersRes] = await Promise.all([
      supabase.from("orbits").select("*").eq("status", "active").order("district", { ascending: true }),
      supabase.from("students").select("*, college:colleges(*), orbit:orbits(*)").order("student_name", { ascending: true }),
      supabase.from("district_leaders").select("*, student:students(*, college:colleges(*), orbit:orbits(*))"),
    ]);

    const activeOrbits = (orbitsRes.data || []) as Orbit[];
    const allStudents = (studentsRes.data || []) as Student[];
    const distLeaders = (distLeadersRes.data || []) as any[];

    // 2. Index active orbits by district
    const districtOrbitMap = new Map<string, Orbit[]>();
    const districtStateMap = new Map<string, string>();

    activeOrbits.forEach((orb) => {
      const dist = (orb.district || "").trim();
      if (!dist) return;

      if (!districtOrbitMap.has(dist)) {
        districtOrbitMap.set(dist, []);
        districtStateMap.set(dist, orb.state || "Kerala");
      }
      districtOrbitMap.get(dist)!.push(orb);
    });

    // 3. Index eligible students by district (students assigned to orbits in that district)
    const districtStudentsMap = new Map<string, Student[]>();
    // Pre-create entries
    districtOrbitMap.forEach((_, dist) => {
      districtStudentsMap.set(dist, []);
    });

    allStudents.forEach((student) => {
      if (student.orbit?.district && districtStudentsMap.has(student.orbit.district)) {
        districtStudentsMap.get(student.orbit.district)!.push(student);
      }
    });

    // 4. Index appointed district leaders by district
    const districtLeaderMap = new Map<string, any>();
    distLeaders.forEach((dl) => {
      if (dl.district) {
        districtLeaderMap.set(dl.district, dl);
      }
    });

    // Fallback: If no record in district_leaders table, check students with role === 'district_leader'
    allStudents.forEach((s) => {
      if (s.role === "district_leader" && s.orbit?.district && !districtLeaderMap.has(s.orbit.district)) {
        districtLeaderMap.set(s.orbit.district, {
          student_id: s.cicno,
          district: s.orbit.district,
          student: s,
        });
      }
    });

    // 5. Construct District Leadership Records
    const records: DistrictLeadershipRecord[] = [];
    const sortedDistricts = Array.from(districtOrbitMap.keys()).sort((a, b) => a.localeCompare(b));

    sortedDistricts.forEach((dist) => {
      const orbitsInDist = districtOrbitMap.get(dist) || [];
      const eligibleStudents = districtStudentsMap.get(dist) || [];
      const leaderRecord = districtLeaderMap.get(dist);

      let leaderInfo = null;
      if (leaderRecord?.student) {
        const s = leaderRecord.student;
        leaderInfo = {
          cicno: s.cicno,
          student_name: s.student_name,
          affno: s.affno || (s.college ? s.college.affno : null),
          college_name: s.college ? s.college.name : null,
          orbit_id: s.orbit_id || (s.orbit ? s.orbit.id : null),
          orbit_name: s.orbit ? s.orbit.name : null,
          class_name: s.class_name,
          phone: s.phone || null,
        };
      }

      records.push({
        district: dist,
        state: districtStateMap.get(dist) || "Kerala",
        orbit_count: orbitsInDist.length,
        student_count: eligibleStudents.length,
        eligible_students: eligibleStudents,
        leader: leaderInfo,
      });
    });

    return records;
  } catch (error) {
    console.error("Error fetching district leadership data:", error);
    return [];
  }
}

/**
 * Fetches Constituency Leadership matrix (1 Leader per Malappuram Constituency)
 * Highly optimized with in-memory constituency indexing
 */
export async function getConstituencyLeadershipData(): Promise<ConstituencyLeadershipRecord[]> {
  try {
    const supabase = await createClient();

    // 1. Parallel fetch active Malappuram orbits, students, and constituency leaders
    const [orbitsRes, studentsRes, constLeadersRes] = await Promise.all([
      supabase
        .from("orbits")
        .select("*")
        .eq("status", "active")
        .ilike("district", "%malappuram%")
        .not("constituency", "is", null)
        .order("constituency", { ascending: true }),
      supabase.from("students").select("*, college:colleges(*), orbit:orbits(*)").order("student_name", { ascending: true }),
      supabase.from("constituency_leaders").select("*, student:students(*, college:colleges(*), orbit:orbits(*))"),
    ]);

    const mlpOrbits = (orbitsRes.data || []) as Orbit[];
    const allStudents = (studentsRes.data || []) as Student[];
    const constLeaders = (constLeadersRes.data || []) as any[];

    // 2. Index active orbits by constituency
    const constOrbitMap = new Map<string, Orbit[]>();

    mlpOrbits.forEach((orb) => {
      const constName = (orb.constituency || "").trim();
      if (!constName) return;

      if (!constOrbitMap.has(constName)) {
        const constOrbitMapEntry: Orbit[] = [];
        constOrbitMap.set(constName, constOrbitMapEntry);
      }
      constOrbitMap.get(constName)!.push(orb);
    });

    // 3. Index eligible students by constituency
    const constStudentsMap = new Map<string, Student[]>();
    constOrbitMap.forEach((_, cName) => {
      constStudentsMap.set(cName, []);
    });

    allStudents.forEach((student) => {
      const studentConst = student.orbit?.constituency?.trim();
      if (studentConst && constStudentsMap.has(studentConst)) {
        constStudentsMap.get(studentConst)!.push(student);
      }
    });

    // 4. Index appointed constituency leaders by constituency
    const constLeaderMap = new Map<string, any>();
    constLeaders.forEach((cl) => {
      if (cl.constituency) {
        constLeaderMap.set(cl.constituency, cl);
      }
    });

    // Fallback: If not found in table, check students with role === 'constituency_leader'
    allStudents.forEach((s) => {
      const sConst = s.orbit?.constituency?.trim();
      if (s.role === "constituency_leader" && sConst && !constLeaderMap.has(sConst)) {
        constLeaderMap.set(sConst, {
          student_id: s.cicno,
          constituency: sConst,
          student: s,
        });
      }
    });

    // 5. Construct Constituency Leadership Records
    const records: ConstituencyLeadershipRecord[] = [];
    const sortedConstituencies = Array.from(constOrbitMap.keys()).sort((a, b) => a.localeCompare(b));

    sortedConstituencies.forEach((cName) => {
      const orbitsInConst = constOrbitMap.get(cName) || [];
      const primaryOrbit = orbitsInConst[0];
      const eligibleStudents = constStudentsMap.get(cName) || [];
      const leaderRecord = constLeaderMap.get(cName);

      let leaderInfo = null;
      if (leaderRecord?.student) {
        const s = leaderRecord.student;
        leaderInfo = {
          cicno: s.cicno,
          student_name: s.student_name,
          affno: s.affno || (s.college ? s.college.affno : null),
          college_name: s.college ? s.college.name : null,
          orbit_id: s.orbit_id || (s.orbit ? s.orbit.id : null),
          orbit_name: s.orbit ? s.orbit.name : null,
          class_name: s.class_name,
          phone: s.phone || null,
        };
      }

      records.push({
        constituency: cName,
        district: "Malappuram",
        orbit_id: primaryOrbit ? primaryOrbit.id : "—",
        orbit_name: primaryOrbit ? primaryOrbit.name : "—",
        student_count: eligibleStudents.length,
        eligible_students: eligibleStudents,
        leader: leaderInfo,
      });
    });

    return records;
  } catch (error) {
    console.error("Error fetching constituency leadership data:", error);
    return [];
  }
}
