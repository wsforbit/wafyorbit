export type UserRole = "admin" | "leader" | "college";

export type OrbitStatus = "active" | "inactive";

export interface College {
  affno: string; // Unique Affiliation Number (e.g. WASC01, AFF101) - Primary Key
  id?: string; // Compatibility alias
  name: string;
  short_name: string; // College Short Name
  place: string; // Place / Location
  district: string;
  state?: string;
  email?: string | null;
  created_at?: string;
  updated_at?: string;
  student_count?: number;
  leader_count?: number;
}

export interface Orbit {
  id: string; // Unique Orbit ID (e.g. ORB101, ORB-CALICUT) - Primary Key
  name: string;
  status: OrbitStatus;
  state: string;
  district: string;
  taluk: string;
  constituency?: string | null;
  panchayaths?: string | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  member_count?: number;
  leader_count?: number;
}

export interface Student {
  cicno: string; // Unique Student Identifier (e.g. CIC2025001) - Primary Key
  id?: string; // Compatibility alias
  admission_no?: string; // Compatibility alias
  student_name: string;
  full_name?: string; // Compatibility alias
  class_name: string;
  place: string;
  panchayath?: string | null;
  pin_code?: string | null;
  district?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  g_phone?: string | null; // Guardian Phone
  role: string; // 'member' | 'leader' | 'asst_leader' | 'district_leader' | 'constituency_leader'
  orbit_id?: string | null;
  affno?: string | null; // Connected College ID
  batch_year?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
  // Joined Relations
  college?: College | null;
  orbit?: Orbit | null;
}

export interface OrbitLeader {
  id: string;
  student_id: string; // References students.cicno
  orbit_id: string; // References orbits.id
  position_title: "Leader" | "Asst Leader" | string;
  term_year: string;
  appointed_at: string;
  student?: Student | null;
  orbit?: Orbit | null;
}

export interface DistrictLeader {
  id: string;
  district: string;
  student_id: string;
  position_title?: string;
  term_year: string;
  appointed_at: string;
  student?: Student | null;
}

export interface ConstituencyLeader {
  id: string;
  district: string;
  constituency: string;
  student_id: string;
  position_title?: string;
  term_year: string;
  appointed_at: string;
  student?: Student | null;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  role: UserRole;
  assigned_orbit_id?: string | null;
  assigned_college_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LiveMetrics {
  orbitCount: number;
  collegeCount: number;
  studentCount: number;
}

export interface AdminDashboardStats {
  orbitTotalCount: number;
  orbitActiveCount: number;
  orbitInactiveCount: number;
  studentTotalCount: number;
  studentAssignedCount: number;
  studentUnassignedCount: number;
  collegeTotalCount: number;
}

export interface DashboardMetrics {
  totalOrbits: number;
  activeOrbits: number;
  inactiveOrbits: number;
  totalStudents: number;
  assignedStudents: number;
  unassignedStudents: number;
  totalColleges: number;
}

export interface OrbitLeadershipRecord {
  orbit_id: string;
  orbit_name: string;
  district: string;
  state: string;
  orbit?: {
    id: string;
    name: string;
    district: string;
    state: string;
  };
  orbit_students?: Student[];
  leader: {
    cicno: string;
    student_name: string;
    affno: string | null;
    college_name: string | null;
    phone: string | null;
    student?: Student | null;
    college?: College | null;
  } | null;
  asst_leader: {
    cicno: string;
    student_name: string;
    affno: string | null;
    college_name: string | null;
    phone: string | null;
    student?: Student | null;
    college?: College | null;
  } | null;
}

export interface DistrictLeadershipRecord {
  district: string;
  state: string;
  orbit_count: number;
  student_count: number;
  eligible_students: Student[];
  leader: {
    cicno: string;
    student_name: string;
    affno: string | null;
    college_name: string | null;
    orbit_id: string | null;
    orbit_name: string | null;
    class_name: string | null;
    phone: string | null;
    student?: Student | null;
    college?: College | null;
  } | null;
}

export interface ConstituencyLeadershipRecord {
  constituency: string;
  district: string;
  orbit_id: string;
  orbit_name: string;
  student_count: number;
  eligible_students: Student[];
  leader: {
    cicno: string;
    student_name: string;
    affno: string | null;
    college_name: string | null;
    orbit_id: string | null;
    orbit_name: string | null;
    class_name: string | null;
    phone: string | null;
    student?: Student | null;
    college?: College | null;
  } | null;
}
