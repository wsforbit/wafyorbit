"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Layers,
  GraduationCap,
  School,
  MapPin,
  Award,
  Shield,
  Search,
  Filter,
  Users,
  Compass,
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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatStudentClass, CLASS_OPTIONS } from "@/lib/class-helper";
import type { Orbit, Student, OrbitLeader, College } from "@/types/database.types";

interface Props {
  orbit: Orbit;
  members: Student[];
  leaders: (OrbitLeader & { student?: Student | null })[];
}

type SortField = "cicno" | "student_name" | "class_name" | "college" | "place" | "role";

export function OrbitDashboardClient({ orbit, members, leaders }: Props) {
  // Active Tab: 'members' | 'colleges' | 'classes' | 'panchayaths' | 'leaders'
  const [activeTab, setActiveTab] = useState<"members" | "colleges" | "classes" | "panchayaths" | "leaders">("members");

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState<string>("ALL");

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
  }, [search, selectedClass, selectedCollegeFilter, pageSize, sortField, sortDirection]);

  // Overall Orbit Metrics
  const totalMembers = members.length;
  
  // Panchayath chips from orbit definition
  const taggedPanchayaths = useMemo(() => {
    return (orbit.panchayaths || "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
  }, [orbit.panchayaths]);

  // Distinct Represented Colleges Map
  const representedCollegesMap = useMemo(() => {
    const map = new Map<string, { college: College | null; affno: string; student_count: number }>();

    members.forEach((m) => {
      const aff = m.affno || (m.college ? m.college.affno : null);
      if (aff) {
        const existing = map.get(aff) || {
          college: m.college || null,
          affno: aff,
          student_count: 0,
        };
        existing.student_count += 1;
        map.set(aff, existing);
      }
    });

    return Array.from(map.values());
  }, [members]);

  // Class / Academic Stage Distribution
  const classDistribution = useMemo(() => {
    const classMap: Record<string, number> = {};
    
    CLASS_OPTIONS.forEach((opt) => {
      classMap[opt.code] = 0;
    });

    members.forEach((m) => {
      const cls = m.class_name || "1";
      classMap[cls] = (classMap[cls] || 0) + 1;
    });

    return Object.entries(classMap)
      .map(([code, count]) => ({
        code,
        label: formatStudentClass(code),
        count,
        percentage: totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0,
      }))
      .filter((item) => item.count > 0);
  }, [members, totalMembers]);

  // Geographical Panchayath Distribution from student place/panchayath data
  const panchayathMemberMap = useMemo(() => {
    const map: Record<string, number> = {};

    members.forEach((m) => {
      const loc = m.panchayath || m.place || "Unspecified";
      map[loc] = (map[loc] || 0) + 1;
    });

    return Object.entries(map)
      .map(([place, count]) => ({
        place,
        count,
        percentage: totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [members, totalMembers]);

  // Filter & Sort Members
  const processedMembers = useMemo(() => {
    const filtered = members.filter((m) => {
      const q = search.trim().toLowerCase();
      const cic = (m.cicno || "").toLowerCase();
      const sName = (m.student_name || "").toLowerCase();
      const formattedClass = formatStudentClass(m.class_name).toLowerCase();
      const colName = (m.college?.name || m.affno || "").toLowerCase();
      const place = (m.place || "").toLowerCase();

      const matchesSearch =
        !q ||
        sName.includes(q) ||
        cic.includes(q) ||
        formattedClass.includes(q) ||
        colName.includes(q) ||
        place.includes(q);

      const matchesClass =
        selectedClass === "ALL" ||
        m.class_name === selectedClass ||
        formatStudentClass(m.class_name) === formatStudentClass(selectedClass);

      const studentAff = m.affno || (m.college ? m.college.affno : "");
      const matchesCollege =
        selectedCollegeFilter === "ALL" || studentAff === selectedCollegeFilter;

      return matchesSearch && matchesClass && matchesCollege;
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
          valA = a.college?.name || a.affno || "";
          valB = b.college?.name || b.affno || "";
          break;
        case "place":
          valA = a.place || "";
          valB = b.place || "";
          break;
        case "role":
          valA = a.role || "member";
          valB = b.role || "member";
          break;
      }

      const comparison = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [members, search, selectedClass, selectedCollegeFilter, sortField, sortDirection]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(processedMembers.length / pageSize));
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedMembers.slice(start, start + pageSize);
  }, [processedMembers, currentPage, pageSize]);

  const startRecord = processedMembers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(currentPage * pageSize, processedMembers.length);

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
    setSelectedCollegeFilter("ALL");
    setSortField("cicno");
    setSortDirection("asc");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8">
      
      {/* ========================================================================= */}
      {/* ORBIT DOMAIN HEADER CARD */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default" className="text-xs font-mono font-bold tracking-wider">
                {orbit.id}
              </Badge>
              <Badge
                variant={orbit.status === "active" ? "secondary" : "outline"}
                className="text-xs font-mono uppercase"
              >
                {orbit.status}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                Jurisdiction Leadership Workspace
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
              {orbit.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary shrink-0" />
                <span>{orbit.district}, {orbit.taluk} ({orbit.state || "Kerala"})</span>
              </div>
              {orbit.constituency && (
                <div className="flex items-center gap-1.5 font-mono">
                  <Compass className="size-3.5 text-primary shrink-0" />
                  <span>Constituency: {orbit.constituency}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics Summary Box */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-border">
            <div className="text-center">
              <div className="text-2xl font-serif font-bold text-primary">{totalMembers}</div>
              <div className="text-[10px] uppercase font-mono text-muted-foreground font-semibold">Scholars</div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-center">
              <div className="text-2xl font-serif font-bold text-foreground">{representedCollegesMap.length}</div>
              <div className="text-[10px] uppercase font-mono text-muted-foreground font-semibold">Campuses</div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-center">
              <div className="text-2xl font-serif font-bold text-secondary-foreground">{leaders.length}</div>
              <div className="text-[10px] uppercase font-mono text-muted-foreground font-semibold">Leaders</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4 CORE KPI CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Scholars */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground font-semibold">
              Enrolled Scholars
            </CardTitle>
            <GraduationCap className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-bold text-foreground">{totalMembers}</div>
            <p className="text-xs text-muted-foreground mt-1">Active in this orbit domain</p>
          </CardContent>
        </Card>

        {/* Campuses Represented */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground font-semibold">
              Campuses Represented
            </CardTitle>
            <School className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-bold text-foreground">{representedCollegesMap.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Colleges with active members</p>
          </CardContent>
        </Card>

        {/* Leadership Council */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground font-semibold">
              Leadership Delegation
            </CardTitle>
            <Award className="size-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-bold text-foreground">{leaders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Designated leaders & assistants</p>
          </CardContent>
        </Card>

        {/* Panchayaths Reach */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground font-semibold">
              Jurisdiction Reach
            </CardTitle>
            <Building className="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-bold text-emerald-600 dark:text-emerald-400">
              {taggedPanchayaths.length || panchayathMemberMap.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Local bodies & panchayaths</p>
          </CardContent>
        </Card>

      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE NAVIGATION TABS */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border pb-1">
        <button
          onClick={() => setActiveTab("members")}
          className={`px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "members"
              ? "bg-secondary text-secondary-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Users className="size-4" />
          <span>Orbit Scholars Roster ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("colleges")}
          className={`px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "colleges"
              ? "bg-secondary text-secondary-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <School className="size-4" />
          <span>Represented Campuses ({representedCollegesMap.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("classes")}
          className={`px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "classes"
              ? "bg-secondary text-secondary-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <GraduationCap className="size-4" />
          <span>Academic Stages ({classDistribution.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("panchayaths")}
          className={`px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "panchayaths"
              ? "bg-secondary text-secondary-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <MapPin className="size-4" />
          <span>Jurisdiction Panchayaths</span>
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
          <span>Orbit Council ({leaders.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SCHOLARS ROSTER */}
      {/* ========================================================================= */}
      {activeTab === "members" && (
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

                {/* College Filter */}
                <select
                  value={selectedCollegeFilter}
                  onChange={(e) => setSelectedCollegeFilter(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs"
                >
                  <option value="ALL">All Campuses</option>
                  {representedCollegesMap.map((item) => (
                    <option key={item.affno} value={item.affno}>
                      {item.college ? item.college.name : item.affno}
                    </option>
                  ))}
                </select>

                {/* Reset Button */}
                {(search ||
                  selectedClass !== "ALL" ||
                  selectedCollegeFilter !== "ALL" ||
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
                <span>Showing <strong>{startRecord}–{endRecord}</strong> of <strong>{processedMembers.length}</strong> matching scholars</span>
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

          {/* Members Table */}
          {processedMembers.length > 0 ? (
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
                    <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("college")}>
                      <div className="flex items-center gap-1">
                        <span>Affiliated College</span>
                        {renderSortIcon("college")}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("place")}>
                      <div className="flex items-center gap-1">
                        <span>Location / Panchayath</span>
                        {renderSortIcon("place")}
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
                  {paginatedMembers.map((m) => {
                    const formattedClass = formatStudentClass(m.class_name);
                    const collegeName = m.college ? m.college.name : m.affno || "Unassigned";

                    return (
                      <TableRow key={m.cicno} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs font-bold text-primary">
                          {m.cicno}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {m.student_name}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <Badge variant="secondary" className="text-[10px] font-medium">
                            {formattedClass}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="flex items-center gap-1 text-foreground font-medium truncate max-w-[160px]">
                            <School className="size-3 text-muted-foreground shrink-0" />
                            <span>{collegeName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {m.place} {m.panchayath ? `• ${m.panchayath}` : ""}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={m.role === "leader" ? "default" : "secondary"}
                            className="text-[10px] uppercase font-mono"
                          >
                            {m.role || "member"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedStudentForModal(m)}
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
                    Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({processedMembers.length} scholars)
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
                <Users className="size-10 text-muted-foreground mx-auto" />
                <div className="font-serif font-semibold text-lg text-foreground">
                  No scholars match selection
                </div>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Try clearing your search query or adjusting your filters.
                </p>
                <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
                  Reset Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REPRESENTED CAMPUSES */}
      {/* ========================================================================= */}
      {activeTab === "colleges" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Affiliated Campuses Represented</CardTitle>
              <CardDescription className="text-xs">
                Collegiate institutions whose scholars are enrolled in this Orbit domain.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {representedCollegesMap.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {representedCollegesMap.map((item) => (
                    <div
                      key={item.affno}
                      className="p-4 rounded-lg border border-border bg-card space-y-3 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-serif font-bold text-sm text-foreground">
                            {item.college ? item.college.name : item.affno}
                          </div>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {item.affno}
                          </Badge>
                        </div>
                        <Badge variant="default" className="text-xs font-mono">
                          {item.student_count} {item.student_count === 1 ? "Scholar" : "Scholars"}
                        </Badge>
                      </div>

                      {item.college && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="size-3 text-primary shrink-0" />
                          <span>{item.college.place}, {item.college.district}</span>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCollegeFilter(item.affno);
                          setActiveTab("members");
                        }}
                        className="w-full text-xs h-7 mt-1"
                      >
                        Filter Campus Scholars
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-xs italic">
                  No scholars are currently enrolled in this orbit.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ACADEMIC STAGES DISTRIBUTION */}
      {/* ========================================================================= */}
      {activeTab === "classes" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Academic Stage Matrix</CardTitle>
              <CardDescription className="text-xs">
                Distribution of scholars across academic stages within this Orbit domain.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classDistribution.map((item) => (
                  <div
                    key={item.code}
                    className="p-4 rounded-lg border border-border bg-card space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-serif font-bold text-sm text-foreground">
                          {item.label}
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          Code: {item.code}
                        </span>
                      </div>
                      <Badge variant="default" className="text-xs font-mono">
                        {item.count} Scholars
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                        <span>Share of Orbit:</span>
                        <span className="font-semibold text-foreground">{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedClass(item.code);
                        setActiveTab("members");
                      }}
                      className="w-full text-xs h-7"
                    >
                      Filter Stage Scholars
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: JURISDICTION PANCHAYATHS */}
      {/* ========================================================================= */}
      {activeTab === "panchayaths" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Jurisdiction Local Bodies & Panchayaths</CardTitle>
              <CardDescription className="text-xs">
                Administrative coverage and scholar residence density across local bodies.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Tagged Panchayaths */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground font-mono block">
                  Tagged Jurisdictional Bodies
                </span>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-secondary/30 border border-border">
                  {taggedPanchayaths.length > 0 ? (
                    taggedPanchayaths.map((p, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {p}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No official panchayaths tagged.</span>
                  )}
                </div>
              </div>

              {/* Scholar Residence Distribution Table */}
              <div className="space-y-2 pt-2 border-t border-border">
                <span className="text-xs font-semibold uppercase text-muted-foreground font-mono block">
                  Member Residential Distribution
                </span>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Place / Panchayath</TableHead>
                      <TableHead className="text-center">Residing Scholars</TableHead>
                      <TableHead className="text-right">Share %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {panchayathMemberMap.map((item) => (
                      <TableRow key={item.place}>
                        <TableCell className="font-medium text-foreground text-xs">
                          {item.place}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs font-semibold text-primary">
                          {item.count}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {item.percentage}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: LEADERSHIP COUNCIL */}
      {/* ========================================================================= */}
      {activeTab === "leaders" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Orbit Leadership Council</CardTitle>
              <CardDescription className="text-xs">
                Designated Primary Leaders and Assistant Leaders appointed to coordinate this Orbit.
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
                                {ldr.student?.student_name || "Scholar Leader"}
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
                            <span className="text-[10px] block font-mono uppercase">Academic Stage</span>
                            <span className="text-foreground font-medium">
                              {ldr.student ? formatStudentClass(ldr.student.class_name) : "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] block font-mono uppercase">College Affiliation</span>
                            <span className="text-foreground">
                              {ldr.student?.college ? ldr.student.college.name : ldr.student?.affno || "—"}
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
                  No leadership positions are currently appointed for this Orbit.
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
              
              {/* Academic Stage & Role */}
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
                    Institutional Role
                  </span>
                  <Badge variant="secondary" className="text-[10px] uppercase font-mono mt-0.5">
                    {selectedStudentForModal.role || "member"}
                  </Badge>
                </div>
              </div>

              {/* Affiliated College */}
              <div className="p-3 rounded-lg border border-border bg-card space-y-1">
                <span className="text-[10px] font-mono uppercase text-muted-foreground block flex items-center gap-1">
                  <School className="size-3 text-primary" />
                  Affiliated Campus Institution
                </span>
                <div className="font-medium text-foreground text-sm">
                  {selectedStudentForModal.college
                    ? selectedStudentForModal.college.name
                    : selectedStudentForModal.affno || "Unassigned"}
                </div>
              </div>

              {/* Residential Details */}
              <div className="space-y-2">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary" />
                  <span>Residential Details</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>
                    <span className="text-[10px] block font-mono uppercase">Place</span>
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

              {/* Contact Data */}
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
