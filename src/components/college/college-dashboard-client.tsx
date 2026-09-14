"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  School,
  GraduationCap,
  Layers,
  MapPin,
  Mail,
  Award,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
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
  Users,
  Compass,
  Sparkles,
  Phone,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatStudentClass, CLASS_OPTIONS } from "@/lib/class-helper";
import type { College, Student, Orbit, OrbitLeader } from "@/types/database.types";

interface Props {
  college: College;
  students: Student[];
  leaders: (OrbitLeader & { student?: Student | null; orbit?: Orbit | null })[];
}

type SortField = "cicno" | "student_name" | "class_name" | "place" | "orbit" | "role";

export function CollegeDashboardClient({ college, students, leaders }: Props) {
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<"students" | "classes" | "orbits" | "leaders">("students");

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [selectedOrbitFilter, setSelectedOrbitFilter] = useState<string>("ALL");
  const [assignmentFilter, setAssignmentFilter] = useState<"ALL" | "ASSIGNED" | "UNASSIGNED">("ALL");

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
  }, [search, selectedClass, selectedOrbitFilter, assignmentFilter, pageSize, sortField, sortDirection]);

  // Overall Campus Metrics
  const totalStudents = students.length;
  const assignedStudents = students.filter((s) => s.orbit_id && s.orbit_id !== "none");
  const assignedCount = assignedStudents.length;
  const unassignedCount = Math.max(0, totalStudents - assignedCount);
  const engagementPercentage = totalStudents > 0 ? Math.round((assignedCount / totalStudents) * 100) : 0;

  // Distinct Connected Orbits
  const connectedOrbitsMap = useMemo(() => {
    const map = new Map<string, { orbit: Orbit | null; orbit_id: string; student_count: number; leaders_count: number }>();
    
    students.forEach((s) => {
      if (s.orbit_id && s.orbit_id !== "none") {
        const existing = map.get(s.orbit_id) || {
          orbit: s.orbit || null,
          orbit_id: s.orbit_id,
          student_count: 0,
          leaders_count: 0,
        };
        existing.student_count += 1;
        map.set(s.orbit_id, existing);
      }
    });

    leaders.forEach((l) => {
      const orbId = l.orbit_id;
      if (orbId && map.has(orbId)) {
        const item = map.get(orbId)!;
        item.leaders_count += 1;
      } else if (orbId) {
        map.set(orbId, {
          orbit: l.orbit || null,
          orbit_id: orbId,
          student_count: 0,
          leaders_count: 1,
        });
      }
    });

    return Array.from(map.values());
  }, [students, leaders]);

  // Class Distribution Matrix
  const classDistribution = useMemo(() => {
    const classMap: Record<string, { total: number; assigned: number; unassigned: number }> = {};
    
    CLASS_OPTIONS.forEach((opt) => {
      classMap[opt.code] = { total: 0, assigned: 0, unassigned: 0 };
    });

    students.forEach((s) => {
      const cls = s.class_name || "1";
      if (!classMap[cls]) {
        classMap[cls] = { total: 0, assigned: 0, unassigned: 0 };
      }
      classMap[cls].total += 1;
      if (s.orbit_id && s.orbit_id !== "none") {
        classMap[cls].assigned += 1;
      } else {
        classMap[cls].unassigned += 1;
      }
    });

    return Object.entries(classMap)
      .map(([code, data]) => ({
        code,
        label: formatStudentClass(code),
        ...data,
        percentage: data.total > 0 ? Math.round((data.assigned / data.total) * 100) : 0,
      }))
      .filter((item) => item.total > 0);
  }, [students]);

  // Filter & Sort Students
  const processedStudents = useMemo(() => {
    const filtered = students.filter((s) => {
      const q = search.trim().toLowerCase();
      const cic = (s.cicno || "").toLowerCase();
      const sName = (s.student_name || "").toLowerCase();
      const formattedClass = formatStudentClass(s.class_name).toLowerCase();
      const orbName = (s.orbit?.name || s.orbit_id || "").toLowerCase();

      const matchesSearch =
        !q ||
        sName.includes(q) ||
        cic.includes(q) ||
        formattedClass.includes(q) ||
        (s.place && s.place.toLowerCase().includes(q)) ||
        orbName.includes(q);

      const matchesClass =
        selectedClass === "ALL" ||
        s.class_name === selectedClass ||
        formatStudentClass(s.class_name) === formatStudentClass(selectedClass);

      const matchesOrbit =
        selectedOrbitFilter === "ALL" || s.orbit_id === selectedOrbitFilter;

      const isAssigned = !!s.orbit_id && s.orbit_id !== "none";
      const matchesAssignment =
        assignmentFilter === "ALL" ||
        (assignmentFilter === "ASSIGNED" && isAssigned) ||
        (assignmentFilter === "UNASSIGNED" && !isAssigned);

      return matchesSearch && matchesClass && matchesOrbit && matchesAssignment;
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
        case "place":
          valA = a.place || "";
          valB = b.place || "";
          break;
        case "orbit":
          valA = a.orbit?.name || a.orbit_id || "";
          valB = b.orbit?.name || b.orbit_id || "";
          break;
        case "role":
          valA = a.role || "member";
          valB = b.role || "member";
          break;
      }

      const comparison = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [students, search, selectedClass, selectedOrbitFilter, assignmentFilter, sortField, sortDirection]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(processedStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedStudents.slice(start, start + pageSize);
  }, [processedStudents, currentPage, pageSize]);

  const startRecord = processedStudents.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(currentPage * pageSize, processedStudents.length);

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

  const handleResetFilters = () => {
    setSearch("");
    setSelectedClass("ALL");
    setSelectedOrbitFilter("ALL");
    setAssignmentFilter("ALL");
    setSortField("cicno");
    setSortDirection("asc");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8">
      
      {/* ========================================================================= */}
      {/* CAMPUS IDENTITY HEADER CARD */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default" className="text-xs font-mono font-bold tracking-wider">
                {college.affno}
              </Badge>
              {college.short_name && (
                <Badge variant="secondary" className="text-xs font-mono">
                  {college.short_name}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground font-mono">
                Official Campus Portal
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
              {college.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary shrink-0" />
                <span>{college.place}, {college.district} ({college.state || "Kerala"})</span>
              </div>
              {college.email && (
                <div className="flex items-center gap-1.5 font-mono">
                  <Mail className="size-3.5 text-primary shrink-0" />
                  <span>{college.email}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button asChild size="sm" className="h-8 text-xs gap-1.5 font-medium shadow-xs">
                <Link href="/college/update-orbit">
                  <Layers className="size-3.5" />
                  <span>Update Orbit Assignments</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick Progress Dial */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-border">
            <div className="text-center">
              <div className="text-2xl font-serif font-bold text-primary">{engagementPercentage}%</div>
              <div className="text-[10px] uppercase font-mono text-muted-foreground font-semibold">Orbit Coverage</div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-center">
              <div className="text-2xl font-serif font-bold text-foreground">{connectedOrbitsMap.length}</div>
              <div className="text-[10px] uppercase font-mono text-muted-foreground font-semibold">Active Orbits</div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-center">
              <div className="text-2xl font-serif font-bold text-secondary-foreground">{leaders.length}</div>
              <div className="text-[10px] uppercase font-mono text-muted-foreground font-semibold">Orbit Leaders</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4 CORE METRIC KPI CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Scholars */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground font-semibold">
              Total Enrolled Scholars
            </CardTitle>
            <GraduationCap className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-bold text-foreground">{totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered campus scholars</p>
          </CardContent>
        </Card>

        {/* Assigned to Orbits */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground font-semibold">
              Assigned to Orbits
            </CardTitle>
            <Layers className="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-serif font-bold text-emerald-600 dark:text-emerald-400">
                {assignedCount}
              </div>
              <span className="text-xs font-mono font-semibold text-muted-foreground">
                {engagementPercentage}% active
              </span>
            </div>
            {/* Mini Progress Bar */}
            <div className="w-full bg-secondary h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-600 dark:bg-emerald-400 h-full rounded-full transition-all"
                style={{ width: `${engagementPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Unassigned Scholars */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground font-semibold">
              Unassigned Scholars
            </CardTitle>
            <AlertCircle className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-serif font-bold text-foreground">{unassignedCount}</div>
              {unassignedCount > 0 && (
                <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs text-primary font-medium">
                  <Link href="/college/update-orbit">Assign Now &rarr;</Link>
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {unassignedCount === 0 ? "All scholars allocated!" : "Pending orbit jurisdiction allocation"}
            </p>
          </CardContent>
        </Card>

        {/* Appointed Leaders */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground font-semibold">
              Campus Orbit Leaders
            </CardTitle>
            <Award className="size-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-bold text-foreground">{leaders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Holding leadership designations</p>
          </CardContent>
        </Card>

      </div>

      {/* ========================================================================= */}
      {/* DASHBOARD TABBED NAVIGATION */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border pb-1">
        <button
          onClick={() => setActiveTab("students")}
          className={`px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "students"
              ? "bg-secondary text-secondary-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <GraduationCap className="size-4" />
          <span>Campus Scholars Roster ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("classes")}
          className={`px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "classes"
              ? "bg-secondary text-secondary-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <School className="size-4" />
          <span>Classes & Batches ({classDistribution.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("orbits")}
          className={`px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "orbits"
              ? "bg-secondary text-secondary-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Layers className="size-4" />
          <span>Connected Orbits ({connectedOrbitsMap.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("leaders")}
          className={`px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "leaders"
              ? "bg-secondary text-secondary-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Award className="size-4" />
          <span>Campus Leadership ({leaders.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CAMPUS SCHOLARS ROSTER */}
      {/* ========================================================================= */}
      {activeTab === "students" && (
        <div className="space-y-4">
          
          {/* Multi-Filter Bar */}
          <div className="p-4 rounded-lg border border-border bg-card shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Scholar Name, CIC Number, Place..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs sm:text-sm"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Academic Class Filter */}
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs font-mono"
                >
                  <option value="ALL">All Academic Stages</option>
                  {CLASS_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Orbit Filter */}
                <select
                  value={selectedOrbitFilter}
                  onChange={(e) => setSelectedOrbitFilter(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs"
                >
                  <option value="ALL">All Orbits</option>
                  {connectedOrbitsMap.map((item) => (
                    <option key={item.orbit_id} value={item.orbit_id}>
                      {item.orbit ? item.orbit.name : item.orbit_id}
                    </option>
                  ))}
                </select>

                {/* Assignment Status Filter */}
                <select
                  value={assignmentFilter}
                  onChange={(e) => setAssignmentFilter(e.target.value as any)}
                  className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs font-mono"
                >
                  <option value="ALL">Status: All</option>
                  <option value="ASSIGNED">Status: Assigned</option>
                  <option value="UNASSIGNED">Status: Unassigned</option>
                </select>

                {/* Reset Button */}
                {(search ||
                  selectedClass !== "ALL" ||
                  selectedOrbitFilter !== "ALL" ||
                  assignmentFilter !== "ALL" ||
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

            {/* Results Count & Sort Summary */}
            <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] font-mono text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Filter className="size-3 text-primary" />
                <span>Showing <strong>{startRecord}–{endRecord}</strong> of <strong>{processedStudents.length}</strong> matching scholars</span>
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
                    <TableHead className="w-28 cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("cicno")}>
                      <div className="flex items-center gap-1">
                        <span>CIC No</span>
                        {renderSortIcon("cicno")}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("student_name")}>
                      <div className="flex items-center gap-1">
                        <span>Scholar Name</span>
                        {renderSortIcon("student_name")}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("class_name")}>
                      <div className="flex items-center gap-1">
                        <span>Academic Stage</span>
                        {renderSortIcon("class_name")}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("place")}>
                      <div className="flex items-center gap-1">
                        <span>Location</span>
                        {renderSortIcon("place")}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("orbit")}>
                      <div className="flex items-center gap-1">
                        <span>Assigned Orbit</span>
                        {renderSortIcon("orbit")}
                      </div>
                    </TableHead>
                    <TableHead className="text-center cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("role")}>
                      <div className="flex items-center justify-center gap-1">
                        <span>Role</span>
                        {renderSortIcon("role")}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudents.map((s) => {
                    const formattedClass = formatStudentClass(s.class_name);
                    const orbitName = s.orbit ? s.orbit.name : s.orbit_id || null;

                    return (
                      <TableRow key={s.cicno} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs font-bold text-primary">
                          {s.cicno}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {s.student_name}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <Badge variant="secondary" className="text-[10px] font-medium">
                            {formattedClass}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {s.place} {s.panchayath ? `• ${s.panchayath}` : ""}
                        </TableCell>
                        <TableCell>
                          {orbitName ? (
                            <span className="flex items-center gap-1 text-xs text-foreground font-medium">
                              <Layers className="size-3.5 text-primary shrink-0" />
                              <span className="truncate max-w-[150px]">{orbitName}</span>
                            </span>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground italic">
                              Unassigned
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={s.role === "leader" ? "default" : "secondary"}
                            className="text-[10px] uppercase font-mono"
                          >
                            {s.role || "member"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedStudentForModal(s)}
                            className="h-8 gap-1 text-xs text-primary hover:bg-secondary"
                          >
                            <Eye className="size-3.5" />
                            <span>Details</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination Bar */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card text-xs">
                  <div className="text-muted-foreground font-mono">
                    Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({processedStudents.length} scholars)
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="px-2 font-mono text-xs">Page {currentPage}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card className="text-center py-12 border-dashed">
              <CardContent className="space-y-3">
                <GraduationCap className="size-10 text-muted-foreground mx-auto" />
                <div className="font-serif font-semibold text-lg text-foreground">
                  No scholars match your criteria
                </div>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Try clearing your search query or adjusting your filters.
                </p>
                <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
                  Reset All Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ACADEMIC CLASSES & BATCHES DISTRIBUTION */}
      {/* ========================================================================= */}
      {activeTab === "classes" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Academic Stage & Cohort Matrix</CardTitle>
              <CardDescription className="text-xs">
                Distribution of campus scholars across academic stages, showing enrollment and Orbit engagement rates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classDistribution.map((item) => (
                  <div
                    key={item.code}
                    className="p-4 rounded-lg border border-border bg-card space-y-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-serif font-bold text-sm text-foreground">
                          {item.label}
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          Stage Code: {item.code}
                        </span>
                      </div>
                      <Badge variant="default" className="text-xs font-mono">
                        {item.total} {item.total === 1 ? "Scholar" : "Scholars"}
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                        <span>Orbit Engagement:</span>
                        <span className="font-semibold text-foreground">{item.percentage}% ({item.assigned}/{item.total})</span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {item.assigned} Assigned
                      </span>
                      <span className="text-amber-500 font-medium">
                        {item.unassigned} Unassigned
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedClass(item.code);
                        setActiveTab("students");
                      }}
                      className="w-full text-xs h-7 mt-1"
                    >
                      View Class Scholars
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CONNECTED ORBITS & JURISDICTION REACH */}
      {/* ========================================================================= */}
      {activeTab === "orbits" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Connected Orbit Domains</CardTitle>
              <CardDescription className="text-xs">
                Geographical Orbits where students from this college are currently actively allocated and participating.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connectedOrbitsMap.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Orbit ID</TableHead>
                      <TableHead>Orbit Domain</TableHead>
                      <TableHead>Jurisdiction Region</TableHead>
                      <TableHead className="text-center">Enrolled Scholars</TableHead>
                      <TableHead className="text-center">Campus Leaders</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {connectedOrbitsMap.map((item) => (
                      <TableRow key={item.orbit_id}>
                        <TableCell className="font-mono text-xs font-bold text-primary">
                          {item.orbit_id}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          <div className="flex items-center gap-1.5">
                            <Layers className="size-4 text-muted-foreground shrink-0" />
                            <span>{item.orbit ? item.orbit.name : item.orbit_id}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {item.orbit ? (
                            <span>{item.orbit.district}, {item.orbit.taluk}</span>
                          ) : (
                            <span>Jurisdiction Active</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs font-semibold text-primary">
                          <Badge variant="secondary" className="font-mono">
                            {item.student_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs font-semibold">
                          <Badge variant="outline" className="font-mono">
                            {item.leaders_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrbitFilter(item.orbit_id);
                              setActiveTab("students");
                            }}
                            className="h-8 text-xs text-primary"
                          >
                            Filter Scholars
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-xs italic">
                  No scholars from this college are assigned to any orbit yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CAMPUS LEADERSHIP ROSTER */}
      {/* ========================================================================= */}
      {activeTab === "leaders" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Campus Orbit Leadership Delegation</CardTitle>
              <CardDescription className="text-xs">
                Scholars from this college currently serving as primary Orbit Leaders or Assistant Leaders across the state.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {leaders.map((ldr) => {
                    const isPrimary = ldr.position_title === "Leader" || ldr.position_title?.toLowerCase() === "leader";
                    return (
                      <div
                        key={ldr.id}
                        className="p-4 rounded-lg border border-border bg-card space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isPrimary ? (
                              <Award className="size-5 text-primary" />
                            ) : (
                              <Shield className="size-5 text-secondary-foreground" />
                            )}
                            <div>
                              <div className="font-serif font-bold text-foreground">
                                {ldr.student?.student_name || "Scholar"}
                              </div>
                              <span className="font-mono text-xs text-muted-foreground">
                                {ldr.student_id}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant={isPrimary ? "default" : "secondary"}
                            className="text-[10px] uppercase font-mono"
                          >
                            {ldr.position_title}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 border-t border-border">
                          <div>
                            <span className="text-[10px] block font-mono uppercase">Assigned Orbit</span>
                            <span className="text-foreground font-medium">
                              {ldr.orbit ? ldr.orbit.name : ldr.orbit_id}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] block font-mono uppercase">Academic Stage</span>
                            <span className="text-foreground">
                              {ldr.student ? formatStudentClass(ldr.student.class_name) : "—"}
                            </span>
                          </div>
                          {ldr.student?.phone && (
                            <div>
                              <span className="text-[10px] block font-mono uppercase">Phone</span>
                              <span className="font-mono text-foreground">{ldr.student.phone}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-[10px] block font-mono uppercase">Term</span>
                            <span className="font-mono text-foreground">{ldr.term_year}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-xs italic">
                  No scholars from this college are currently appointed to Orbit Leadership roles.
                </div>
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
                  {selectedStudentForModal.cicno}
                </Badge>
                <CardTitle className="text-xl font-serif">
                  {selectedStudentForModal.student_name}
                </CardTitle>
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

            <CardContent className="space-y-4 pt-4 text-xs">
              
              {/* Academic & Role */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
                <div>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                    Academic Stage
                  </span>
                  <span className="font-semibold text-foreground text-sm">
                    {formatStudentClass(selectedStudentForModal.class_name)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                    Role in Registry
                  </span>
                  <Badge variant="secondary" className="text-[10px] uppercase font-mono mt-0.5">
                    {selectedStudentForModal.role || "member"}
                  </Badge>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary" />
                  <span>Residential Details</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>
                    <span className="text-[10px] block font-mono uppercase">Place / Village</span>
                    <span className="text-foreground">{selectedStudentForModal.place}</span>
                  </div>
                  <div>
                    <span className="text-[10px] block font-mono uppercase">Panchayath</span>
                    <span className="text-foreground">{selectedStudentForModal.panchayath || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] block font-mono uppercase">PIN Code</span>
                    <span className="text-foreground">{selectedStudentForModal.pin_code || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-2">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Phone className="size-3.5 text-primary" />
                  <span>Contact Information</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-muted-foreground">
                  <div>
                    <span className="text-[10px] block font-mono uppercase">Phone</span>
                    <span className="text-foreground font-mono">{selectedStudentForModal.phone || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] block font-mono uppercase">WhatsApp</span>
                    <span className="text-foreground font-mono">{selectedStudentForModal.whatsapp || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] block font-mono uppercase">Guardian</span>
                    <span className="text-foreground font-mono">{selectedStudentForModal.g_phone || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Orbit Assignment */}
              <div className="p-3 rounded-lg border border-border bg-card">
                <span className="text-[10px] font-mono uppercase text-muted-foreground block flex items-center gap-1">
                  <Layers className="size-3 text-primary" />
                  Assigned Orbit Domain
                </span>
                <div className="font-medium text-foreground mt-0.5 text-sm">
                  {selectedStudentForModal.orbit
                    ? selectedStudentForModal.orbit.name
                    : selectedStudentForModal.orbit_id || "Unassigned"}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStudentForModal(null)}
                  className="text-xs"
                >
                  Close Profile
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
