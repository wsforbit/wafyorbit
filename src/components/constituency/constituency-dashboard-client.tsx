"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Compass,
  Layers,
  GraduationCap,
  School,
  MapPin,
  Award,
  Shield,
  Search,
  Filter,
  Users,
  Eye,
  X,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Phone,
  Building,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  UserX,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatStudentClass, CLASS_OPTIONS } from "@/lib/class-helper";
import type { Orbit, Student, OrbitLeader, College } from "@/types/database.types";

interface Props {
  constituencyName: string;
  orbits: Orbit[];
  students: Student[];
  orbitLeaders: (OrbitLeader & { student?: Student | null; orbit?: Orbit | null })[];
  constituencyLeader: any | null;
}

type SortField = "cicno" | "student_name" | "class_name" | "college" | "place" | "orbit" | "role";

export function ConstituencyDashboardClient({
  constituencyName,
  orbits,
  students,
  orbitLeaders,
  constituencyLeader,
}: Props) {
  // Navigation Tabs: 'students' | 'orbits' | 'colleges' | 'classes' | 'leaders'
  const [activeTab, setActiveTab] = useState<"students" | "orbits" | "colleges" | "classes" | "leaders">("students");

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [selectedOrbit, setSelectedOrbit] = useState<string>("ALL");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [selectedCollege, setSelectedCollege] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "LEADERS" | "MEMBERS">("ALL");

  // Sorting State - Default: Ascending by cicno
  const [sortField, setSortField] = useState<SortField>("cicno");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Student Detail Modal
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);

  // Reset pagination on filter or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedOrbit, selectedClass, selectedCollege, roleFilter, pageSize, sortField, sortDirection]);

  // Overall Metrics
  const totalStudents = students.length;
  const activeOrbits = orbits.filter((o) => o.status === "active");

  // Map of Orbit ID to Orbit details
  const orbitMap = useMemo(() => {
    const map = new Map<string, Orbit>();
    orbits.forEach((o) => map.set(o.id, o));
    return map;
  }, [orbits]);

  // Represented Colleges
  const representedColleges = useMemo(() => {
    const map = new Map<string, { college: College | null; affno: string; student_count: number }>();
    students.forEach((s) => {
      const aff = s.affno || s.college?.affno;
      if (aff) {
        const existing = map.get(aff) || {
          college: s.college || null,
          affno: aff,
          student_count: 0,
        };
        existing.student_count += 1;
        map.set(aff, existing);
      }
    });
    return Array.from(map.values()).sort((a, b) => b.student_count - a.student_count);
  }, [students]);

  // Class Distribution
  const classDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    students.forEach((s) => {
      const cls = s.class_name || "1";
      map[cls] = (map[cls] || 0) + 1;
    });
    return Object.entries(map)
      .map(([code, count]) => ({
        code,
        label: formatStudentClass(code),
        count,
        percentage: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [students, totalStudents]);

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="size-3 text-muted-foreground/50 shrink-0" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="size-3 text-primary shrink-0" />
    ) : (
      <ArrowDown className="size-3 text-primary shrink-0" />
    );
  };

  // Filter & Sort Students
  const processedStudents = useMemo(() => {
    const filtered = students.filter((s) => {
      const q = search.trim().toLowerCase();
      const cic = (s.cicno || "").toLowerCase();
      const name = (s.student_name || "").toLowerCase();
      const place = (s.place || "").toLowerCase();
      const colName = (s.college?.name || s.college?.short_name || "").toLowerCase();
      const orbName = (s.orbit?.name || "").toLowerCase();
      const clsFormatted = formatStudentClass(s.class_name).toLowerCase();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        cic.includes(q) ||
        place.includes(q) ||
        colName.includes(q) ||
        orbName.includes(q) ||
        clsFormatted.includes(q);

      const matchesOrbit = selectedOrbit === "ALL" || s.orbit_id === selectedOrbit;
      const matchesClass = selectedClass === "ALL" || s.class_name === selectedClass;
      const matchesCollege =
        selectedCollege === "ALL" || (s.affno || s.college?.affno) === selectedCollege;

      let matchesRole = true;
      const r = (s.role || "").toLowerCase();
      if (roleFilter === "LEADERS") {
        matchesRole = r.includes("leader");
      } else if (roleFilter === "MEMBERS") {
        matchesRole = !r.includes("leader");
      }

      return matchesSearch && matchesOrbit && matchesClass && matchesCollege && matchesRole;
    });

    return filtered.sort((a, b) => {
      let valA = "";
      let valB = "";

      switch (sortField) {
        case "cicno":
          valA = a.cicno || "";
          valB = b.cicno || "";
          break;
        case "student_name":
          valA = a.student_name || "";
          valB = b.student_name || "";
          break;
        case "class_name":
          valA = a.class_name || "";
          valB = b.class_name || "";
          break;
        case "college":
          valA = a.college?.short_name || a.college?.name || a.affno || "";
          valB = b.college?.short_name || b.college?.name || b.affno || "";
          break;
        case "place":
          valA = a.place || "";
          valB = b.place || "";
          break;
        case "orbit":
          valA = a.orbit?.name || a.orbit_id || "";
          valB = b.orbit?.name || b.orbit_id || "";
          break;
        case "role":
          valA = a.role || "";
          valB = b.role || "";
          break;
      }

      const cmp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [students, search, selectedOrbit, selectedClass, selectedCollege, roleFilter, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.ceil(processedStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedStudents.slice(start, start + pageSize);
  }, [processedStudents, currentPage, pageSize]);

  const startRecord = processedStudents.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(currentPage * pageSize, processedStudents.length);

  const handleResetFilters = () => {
    setSearch("");
    setSelectedOrbit("ALL");
    setSelectedClass("ALL");
    setSelectedCollege("ALL");
    setRoleFilter("ALL");
    setSortField("cicno");
    setSortDirection("asc");
  };

  const constLeaderStudent = constituencyLeader?.student || null;

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HERO CARD & METRICS */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-card via-card to-primary/5 p-6 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs font-mono uppercase bg-primary text-primary-foreground">
                Constituency Domain
              </Badge>
              <Badge variant="outline" className="text-xs font-mono">
                Malappuram District
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-foreground">
              {constituencyName} Constituency
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Legislative constituency governance jurisdiction comprising {orbits.length} orbit domains and {totalStudents} enrolled Wafy scholars.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 rounded-lg bg-card border border-border text-center min-w-[90px] shadow-2xs">
              <div className="text-xl sm:text-2xl font-bold font-mono text-primary">
                {activeOrbits.length}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase">
                Active Orbits
              </div>
            </div>

            <div className="p-3 rounded-lg bg-card border border-border text-center min-w-[90px] shadow-2xs">
              <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
                {totalStudents}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase">
                Scholars
              </div>
            </div>

            <div className="p-3 rounded-lg bg-card border border-border text-center min-w-[90px] shadow-2xs">
              <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
                {representedColleges.length}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase">
                Colleges
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CONSTITUENCY LEADER SPOTLIGHT */}
        {/* ========================================================================= */}
        <div className="rounded-lg border border-border/80 bg-background/80 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Award className="size-6" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <span>Constituency Leader</span>
                  {constLeaderStudent ? (
                    <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-emerald-600">
                      Appointed
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 text-amber-600">
                      Vacant
                    </Badge>
                  )}
                </div>
                {constLeaderStudent ? (
                  <div className="font-serif font-bold text-base sm:text-lg text-foreground">
                    {constLeaderStudent.student_name}{" "}
                    <span className="text-xs font-mono font-normal text-muted-foreground">
                      (CIC: {constLeaderStudent.cicno})
                    </span>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    No designated Constituency Leader appointed for {constituencyName} yet.
                  </div>
                )}
              </div>
            </div>

            {constLeaderStudent && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
                {constLeaderStudent.college && (
                  <span className="flex items-center gap-1">
                    <School className="size-3.5 text-primary" />
                    <span>{constLeaderStudent.college.short_name || constLeaderStudent.college.name}</span>
                  </span>
                )}
                {constLeaderStudent.phone && (
                  <span className="flex items-center gap-1 text-foreground">
                    <Phone className="size-3.5 text-primary" />
                    <span>{constLeaderStudent.phone}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. NAVIGATION TABS */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border pb-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("students")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === "students"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <GraduationCap className="size-4" />
          <span>Scholars Roster ({totalStudents})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("orbits")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === "orbits"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Layers className="size-4" />
          <span>Orbit Domains ({orbits.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("colleges")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === "colleges"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <School className="size-4" />
          <span>Campus Colleges ({representedColleges.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("classes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === "classes"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Building className="size-4" />
          <span>Academic Stages ({classDistribution.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("leaders")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === "leaders"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Shield className="size-4" />
          <span>Leadership Matrix</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SCHOLARS ROSTER */}
      {/* ========================================================================= */}
      {activeTab === "students" && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="rounded-lg border border-border bg-card p-4 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Scholar Name, CIC No, Place, College, Orbit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs sm:text-sm"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Orbit Filter */}
                <select
                  value={selectedOrbit}
                  onChange={(e) => setSelectedOrbit(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs font-mono"
                >
                  <option value="ALL">All Orbits ({orbits.length})</option>
                  {orbits.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.id})
                    </option>
                  ))}
                </select>

                {/* Academic Stage Filter */}
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs font-mono"
                >
                  <option value="ALL">All Stages</option>
                  {CLASS_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* College Filter */}
                <select
                  value={selectedCollege}
                  onChange={(e) => setSelectedCollege(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs font-mono max-w-[170px]"
                >
                  <option value="ALL">All Colleges</option>
                  {representedColleges.map((col) => (
                    <option key={col.affno} value={col.affno}>
                      {col.college?.short_name || col.affno} ({col.student_count})
                    </option>
                  ))}
                </select>

                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs"
                >
                  <option value="ALL">Role: All</option>
                  <option value="LEADERS">Leaders Only</option>
                  <option value="MEMBERS">Members Only</option>
                </select>

                {/* Reset Filters */}
                {(search ||
                  selectedOrbit !== "ALL" ||
                  selectedClass !== "ALL" ||
                  selectedCollege !== "ALL" ||
                  roleFilter !== "ALL" ||
                  sortField !== "cicno" ||
                  sortDirection !== "asc") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilters}
                    className="h-9 text-xs gap-1.5 shrink-0"
                  >
                    <RotateCcw className="size-3.5" />
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Results Count & Page Size */}
            <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] font-mono text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Filter className="size-3 text-primary" />
                <span>
                  Showing <strong>{startRecord}–{endRecord}</strong> of{" "}
                  <strong>{processedStudents.length}</strong> matching scholars
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-6 rounded border border-input bg-background px-1.5 text-[11px] font-mono"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Student Roster Table */}
          {processedStudents.length > 0 ? (
            <div className="space-y-3">
              <Table className="bg-card">
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="w-28 cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("cicno")}
                    >
                      <div className="flex items-center gap-1">
                        <span>CIC No</span>
                        {renderSortIcon("cicno")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("student_name")}
                    >
                      <div className="flex items-center gap-1">
                        <span>Scholar Name</span>
                        {renderSortIcon("student_name")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("class_name")}
                    >
                      <div className="flex items-center gap-1">
                        <span>Academic Stage</span>
                        {renderSortIcon("class_name")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("college")}
                    >
                      <div className="flex items-center gap-1">
                        <span>College</span>
                        {renderSortIcon("college")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("place")}
                    >
                      <div className="flex items-center gap-1">
                        <span>Hometown</span>
                        {renderSortIcon("place")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("orbit")}
                    >
                      <div className="flex items-center gap-1">
                        <span>Orbit Domain</span>
                        {renderSortIcon("orbit")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("role")}
                    >
                      <div className="flex items-center gap-1">
                        <span>Role</span>
                        {renderSortIcon("role")}
                      </div>
                    </TableHead>
                    <TableHead className="text-right w-20">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudents.map((student) => {
                    const isLeader = (student.role || "").toLowerCase().includes("leader");

                    return (
                      <TableRow key={student.cicno} className="hover:bg-muted/30">
                        <TableCell className="font-mono font-semibold text-xs text-primary">
                          {student.cicno}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {student.student_name}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {formatStudentClass(student.class_name)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {student.college ? (
                            <span title={student.college.name}>
                              {student.college.short_name || student.college.name}
                            </span>
                          ) : (
                            student.affno || "—"
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {student.place || "—"}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {student.orbit ? (
                            <div className="flex items-center gap-1">
                              <Layers className="size-3 text-primary shrink-0" />
                              <span>{student.orbit.name}</span>
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {isLeader ? (
                            <Badge variant="default" className="text-[9px] font-mono uppercase bg-primary">
                              {student.role}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground capitalize">
                              {student.role || "Member"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedStudentForModal(student)}
                            className="h-7 px-2 text-xs text-primary hover:bg-secondary"
                          >
                            <Eye className="size-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 text-xs font-mono text-muted-foreground">
                  <div>
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                      className="size-7"
                    >
                      <ChevronsLeft className="size-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="size-7"
                    >
                      <ChevronLeft className="size-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="size-7"
                    >
                      <ChevronRight className="size-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      className="size-7"
                    >
                      <ChevronsRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card className="text-center py-12 border-dashed">
              <CardContent className="space-y-3">
                <Users className="size-10 text-muted-foreground mx-auto" />
                <div className="font-serif font-semibold text-lg text-foreground">
                  No Scholars Found
                </div>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  No scholars match the selected filters in {constituencyName} constituency.
                </p>
                <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ACTIVE ORBITS */}
      {/* ========================================================================= */}
      {activeTab === "orbits" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Constituency Orbit Domains</CardTitle>
              <CardDescription className="text-xs">
                All territorial orbits defined within {constituencyName} Legislative Assembly Constituency.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orbits.map((orb) => {
                  const orbStudents = students.filter((s) => s.orbit_id === orb.id);
                  const orbLead = orbitLeaders.find((l) => l.orbit_id === orb.id && l.position_title === "Leader");

                  return (
                    <div
                      key={orb.id}
                      className="p-4 rounded-lg border border-border bg-card space-y-3 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-serif font-bold text-sm text-foreground flex items-center gap-1.5">
                            <Layers className="size-4 text-primary" />
                            <span>{orb.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            Orbit ID: {orb.id} • Taluk: {orb.taluk || "—"}
                          </span>
                        </div>
                        <Badge
                          variant={orb.status === "active" ? "default" : "secondary"}
                          className="text-[10px] font-mono"
                        >
                          {orb.status}
                        </Badge>
                      </div>

                      {orb.panchayaths && (
                        <div className="text-[11px] text-muted-foreground">
                          <span className="font-semibold text-foreground">Jurisdiction: </span>
                          <span className="line-clamp-2">{orb.panchayaths}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                        <span className="font-mono text-primary font-bold">
                          {orbStudents.length} Scholars
                        </span>
                        {orbLead ? (
                          <span className="text-[11px] text-muted-foreground truncate max-w-[140px]" title={orbLead.student?.student_name}>
                            Leader: {orbLead.student?.student_name || "Appointed"}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">
                            Leader Vacant
                          </span>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrbit(orb.id);
                          setActiveTab("students");
                        }}
                        className="w-full text-xs h-7"
                      >
                        View Orbit Scholars
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CAMPUS COLLEGES */}
      {/* ========================================================================= */}
      {activeTab === "colleges" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">Colleges Represented</CardTitle>
            <CardDescription className="text-xs">
              Affiliated Wafy and Wafiyya colleges attended by scholars belonging to {constituencyName} Constituency.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {representedColleges.map((item) => (
                <div
                  key={item.affno}
                  className="p-3.5 rounded-lg border border-border bg-card space-y-2 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      AFF: {item.affno}
                    </Badge>
                    <span className="font-mono text-xs font-bold text-primary">
                      {item.student_count} Scholars
                    </span>
                  </div>
                  <div className="font-serif font-bold text-sm text-foreground">
                    {item.college?.name || item.affno}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {item.college?.place ? `${item.college.place}, ${item.college.district || ""}` : "Campus Roster"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ACADEMIC STAGES */}
      {/* ========================================================================= */}
      {activeTab === "classes" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">Academic Stage Distribution</CardTitle>
            <CardDescription className="text-xs">
              Scholars breakdown across Thamheediyya, Aliyya, and Advanced Degree stages in {constituencyName}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classDistribution.map((item) => (
                <div key={item.code} className="p-4 rounded-lg border border-border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-sm text-foreground">{item.label}</span>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {item.count} Scholars
                    </Badge>
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground">
                    Stage Code: {item.code} • {item.percentage}% of constituency
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: LEADERSHIP MATRIX */}
      {/* ========================================================================= */}
      {activeTab === "leaders" && (
        <div className="space-y-6">
          {/* Designated Constituency Leader Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <Compass className="size-5 text-primary" />
                <span>Constituency Leader Profile</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Designated representative for {constituencyName} Legislative Assembly Jurisdiction.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {constLeaderStudent ? (
                <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-serif font-bold text-lg text-foreground">
                      {constLeaderStudent.student_name}
                    </div>
                    <Badge variant="default" className="font-mono text-xs">
                      CIC: {constLeaderStudent.cicno}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground pt-1">
                    <div>
                      <span className="text-[10px] block font-mono uppercase">Academic Stage</span>
                      <span className="text-foreground font-medium">
                        {formatStudentClass(constLeaderStudent.class_name)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] block font-mono uppercase">Campus College</span>
                      <span className="text-foreground font-medium">
                        {constLeaderStudent.college?.name || constLeaderStudent.affno || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] block font-mono uppercase">Contact</span>
                      <span className="text-foreground font-medium font-mono">
                        {constLeaderStudent.phone || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed rounded-lg space-y-2">
                  <UserX className="size-8 text-muted-foreground mx-auto" />
                  <div className="font-serif font-semibold text-sm text-foreground">Position Vacant</div>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Central administration has not yet designated a student as the leader for {constituencyName}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Orbit Leaders Roster */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <Layers className="size-5 text-primary" />
                <span>Orbit Leaders in {constituencyName}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Appointed primary leaders and assistant leaders for each orbit domain in this constituency.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orbits.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Orbit Domain</TableHead>
                      <TableHead>Orbit Leader</TableHead>
                      <TableHead>Assistant Leader</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orbits.map((orb) => {
                      const lead = orbitLeaders.find((l) => l.orbit_id === orb.id && l.position_title === "Leader");
                      const asst = orbitLeaders.find(
                        (l) => l.orbit_id === orb.id && l.position_title.toLowerCase().includes("asst")
                      );

                      return (
                        <TableRow key={orb.id}>
                          <TableCell className="font-medium text-foreground">
                            <div>{orb.name}</div>
                            <span className="font-mono text-[10px] text-muted-foreground">ID: {orb.id}</span>
                          </TableCell>
                          <TableCell>
                            {lead?.student ? (
                              <div className="space-y-0.5">
                                <div className="font-semibold text-xs text-foreground flex items-center gap-1">
                                  <Award className="size-3 text-primary shrink-0" />
                                  <span>{lead.student.student_name}</span>
                                </div>
                                <div className="text-[10px] font-mono text-muted-foreground">
                                  CIC: {lead.student.cicno} • {lead.student.phone || "No phone"}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Vacant</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {asst?.student ? (
                              <div className="space-y-0.5">
                                <div className="font-semibold text-xs text-foreground flex items-center gap-1">
                                  <Shield className="size-3 text-muted-foreground shrink-0" />
                                  <span>{asst.student.student_name}</span>
                                </div>
                                <div className="text-[10px] font-mono text-muted-foreground">
                                  CIC: {asst.student.cicno} • {asst.student.phone || "No phone"}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Vacant</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-xs text-muted-foreground">No orbits found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STUDENT DETAIL MODAL */}
      {/* ========================================================================= */}
      {selectedStudentForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg shadow-2xl border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <div className="space-y-1">
                <Badge variant="default" className="text-[10px] font-mono">
                  CIC: {selectedStudentForModal.cicno}
                </Badge>
                <CardTitle className="text-xl font-serif">
                  {selectedStudentForModal.student_name}
                </CardTitle>
                <CardDescription className="text-xs">
                  Stage: {formatStudentClass(selectedStudentForModal.class_name)}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedStudentForModal(null)}
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-md bg-secondary/30 border border-border">
                  <span className="text-[10px] block font-mono uppercase text-muted-foreground">College</span>
                  <span className="font-semibold text-foreground">
                    {selectedStudentForModal.college?.name || selectedStudentForModal.affno || "—"}
                  </span>
                </div>
                <div className="p-2.5 rounded-md bg-secondary/30 border border-border">
                  <span className="text-[10px] block font-mono uppercase text-muted-foreground">Orbit</span>
                  <span className="font-semibold text-foreground">
                    {selectedStudentForModal.orbit?.name || selectedStudentForModal.orbit_id || "—"}
                  </span>
                </div>
                <div className="p-2.5 rounded-md bg-secondary/30 border border-border">
                  <span className="text-[10px] block font-mono uppercase text-muted-foreground">Hometown / Place</span>
                  <span className="font-semibold text-foreground">{selectedStudentForModal.place || "—"}</span>
                </div>
                <div className="p-2.5 rounded-md bg-secondary/30 border border-border">
                  <span className="text-[10px] block font-mono uppercase text-muted-foreground">Contact</span>
                  <span className="font-semibold text-foreground font-mono">
                    {selectedStudentForModal.phone || "—"}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setSelectedStudentForModal(null)} className="text-xs">
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
