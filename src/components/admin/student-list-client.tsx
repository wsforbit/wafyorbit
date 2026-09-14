"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  GraduationCap,
  School,
  Layers,
  MapPin,
  Phone,
  Eye,
  X,
  RotateCcw,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatStudentClass } from "@/lib/class-helper";
import type { Student, Orbit, College } from "@/types/database.types";

interface Props {
  initialStudents: Student[];
  orbits: Orbit[];
  colleges: College[];
}

type SortField = "cicno" | "student_name" | "class_name" | "place" | "orbit" | "college" | "role";

export function StudentListClient({ initialStudents, orbits, colleges }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCollege, setSelectedCollege] = useState<string>("ALL");
  const [selectedOrbit, setSelectedOrbit] = useState<string>("ALL");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");

  // Sorting State - Default: Ascending by cicno
  const [sortField, setSortField] = useState<SortField>("cicno");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Modal State for viewing student full details
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);

  // Reset to page 1 whenever filters or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCollege, selectedOrbit, selectedClass, pageSize, sortField, sortDirection]);

  // Extract unique Classes dynamically
  const uniqueClasses = useMemo(() => {
    const classes = Array.from(
      new Set(initialStudents.map((s) => s.class_name).filter(Boolean))
    );
    return classes.sort();
  }, [initialStudents]);

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

  // Filtered & Sorted Students Logic
  const processedStudents = useMemo(() => {
    const filtered = initialStudents.filter((student) => {
      const q = search.trim().toLowerCase();
      const cic = student.cicno || student.id || "";
      const sName = student.student_name || student.full_name || "";
      const formattedClass = formatStudentClass(student.class_name).toLowerCase();

      const matchesSearch =
        !q ||
        sName.toLowerCase().includes(q) ||
        cic.toLowerCase().includes(q) ||
        (student.place && student.place.toLowerCase().includes(q)) ||
        (student.panchayath && student.panchayath.toLowerCase().includes(q)) ||
        formattedClass.includes(q) ||
        (student.phone && student.phone.includes(q));

      const studentAff = student.affno || (student.college ? student.college.affno || student.college.id : "");
      const matchesCollege =
        selectedCollege === "ALL" || studentAff === selectedCollege;

      const studentOrbit = student.orbit_id || (student.orbit ? student.orbit.id : "");
      const matchesOrbit =
        selectedOrbit === "ALL" || studentOrbit === selectedOrbit;

      const matchesClass =
        selectedClass === "ALL" ||
        student.class_name === selectedClass ||
        formatStudentClass(student.class_name) === formatStudentClass(selectedClass);

      return (
        matchesSearch &&
        matchesCollege &&
        matchesOrbit &&
        matchesClass
      );
    });

    return filtered.sort((a, b) => {
      let valA = "";
      let valB = "";

      switch (sortField) {
        case "cicno":
          valA = a.cicno || a.id || "";
          valB = b.cicno || b.id || "";
          break;
        case "student_name":
          valA = a.student_name || a.full_name || "";
          valB = b.student_name || b.full_name || "";
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
        case "college":
          valA = a.college?.name || a.affno || "";
          valB = b.college?.name || b.affno || "";
          break;
        case "role":
          valA = a.role || "member";
          valB = b.role || "member";
          break;
      }

      const comparison = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [initialStudents, search, selectedCollege, selectedOrbit, selectedClass, sortField, sortDirection]);

  // Slice paginated dataset
  const totalPages = Math.max(1, Math.ceil(processedStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedStudents.slice(start, start + pageSize);
  }, [processedStudents, currentPage, pageSize]);

  const startRecord = processedStudents.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(currentPage * pageSize, processedStudents.length);

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCollege("ALL");
    setSelectedOrbit("ALL");
    setSelectedClass("ALL");
    setSortField("cicno");
    setSortDirection("asc");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* STICKY FLOATING FILTER CARD */}
      {/* ========================================================================= */}
      <div className="sticky top-16 z-30 pt-2 pb-3 bg-background/95 backdrop-blur-md transition-all">
        <Card className="shadow-md border-border/80 bg-card/95">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              
              {/* Search by Student Name or CIC No */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Scholar Name, CIC Number, Place..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs sm:text-sm"
                />
              </div>

              {/* Filter Controls (College, Orbit, Class) */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* 1. Filter by College */}
                <div className="flex items-center gap-1.5 min-w-[150px]">
                  <School className="size-3.5 text-muted-foreground shrink-0 hidden sm:block" />
                  <select
                    value={selectedCollege}
                    onChange={(e) => setSelectedCollege(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="ALL">All Colleges</option>
                    {colleges.map((c) => (
                      <option key={c.affno || c.id} value={c.affno || c.id}>
                        {c.short_name || c.name} ({c.affno || c.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Filter by Orbit */}
                <div className="flex items-center gap-1.5 min-w-[150px]">
                  <Layers className="size-3.5 text-muted-foreground shrink-0 hidden sm:block" />
                  <select
                    value={selectedOrbit}
                    onChange={(e) => setSelectedOrbit(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="ALL">All Orbits</option>
                    {orbits.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Filter by Class (with Human-Readable Stage Names) */}
                <div className="flex items-center gap-1.5 min-w-[150px]">
                  <GraduationCap className="size-3.5 text-muted-foreground shrink-0 hidden sm:block" />
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="ALL">All Classes / Stages</option>
                    {uniqueClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        {formatStudentClass(cls)} {cls !== formatStudentClass(cls) ? `(${cls})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reset Filter Button */}
                {(search ||
                  selectedCollege !== "ALL" ||
                  selectedOrbit !== "ALL" ||
                  selectedClass !== "ALL" ||
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

            {/* Results Count Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 mt-3 border-t border-border text-[11px] font-mono text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Filter className="size-3 text-primary" />
                <span>Showing <strong>{startRecord}–{endRecord}</strong> of <strong>{processedStudents.length}</strong> scholars (Sorted by <strong>{sortField}</strong> {sortDirection.toUpperCase()})</span>
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
                  <option value={250}>250</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* STUDENT TABLE LIST */}
      {/* ========================================================================= */}
      {processedStudents.length > 0 ? (
        <div className="space-y-4">
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
                    <span>Student Name</span>
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
                    <span>Place & Panchayath</span>
                    {renderSortIcon("place")}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("orbit")}>
                  <div className="flex items-center gap-1">
                    <span>Assigned Orbit</span>
                    {renderSortIcon("orbit")}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("college")}>
                  <div className="flex items-center gap-1">
                    <span>Affiliated College</span>
                    {renderSortIcon("college")}
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
              {paginatedStudents.map((student) => {
                const cic = student.cicno || student.id;
                const sName = student.student_name || student.full_name || "Scholar";
                const orbitName = student.orbit ? student.orbit.name : student.orbit_id || null;
                const collegeName = student.college ? student.college.name : student.affno || null;
                const formattedClass = formatStudentClass(student.class_name);

                return (
                  <TableRow key={cic} className="hover:bg-muted/30">
                    
                    {/* CIC No */}
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      {cic}
                    </TableCell>

                    {/* Student Name */}
                    <TableCell>
                      <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                        <GraduationCap className="size-4 text-muted-foreground shrink-0" />
                        <span>{sName}</span>
                      </div>
                    </TableCell>

                    {/* Class / Academic Stage */}
                    <TableCell>
                      <Badge variant="secondary" className="text-xs font-mono font-medium">
                        {formattedClass}
                      </Badge>
                    </TableCell>

                    {/* Place & Panchayath */}
                    <TableCell className="text-xs text-muted-foreground">
                      <span className="text-foreground font-medium">{student.place}</span>
                      {student.panchayath && <span> • {student.panchayath}</span>}
                    </TableCell>

                    {/* Derived Orbit Name */}
                    <TableCell>
                      {orbitName ? (
                        <span className="flex items-center gap-1 text-xs text-foreground font-medium">
                          <Layers className="size-3.5 text-primary shrink-0" />
                          <span className="truncate max-w-[140px]">{orbitName}</span>
                        </span>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground italic">
                          Unassigned
                        </Badge>
                      )}
                    </TableCell>

                    {/* Derived College Name */}
                    <TableCell>
                      {collegeName ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <School className="size-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[140px]">{collegeName}</span>
                        </span>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground italic">
                          Unassigned
                        </Badge>
                      )}
                    </TableCell>

                    {/* Role */}
                    <TableCell className="text-center font-mono text-xs">
                      <Badge
                        variant={student.role === "leader" ? "default" : "secondary"}
                        className="text-[10px] uppercase"
                      >
                        {student.role || "member"}
                      </Badge>
                    </TableCell>

                    {/* View Action Modal Trigger */}
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedStudentForModal(student)}
                        className="h-8 gap-1 text-xs hover:bg-secondary text-primary"
                      >
                        <Eye className="size-3.5" />
                        <span>View</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination Navigation Bar */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card">
              <div className="text-xs text-muted-foreground font-mono">
                Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({processedStudents.length} total scholars)
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  title="First Page"
                >
                  <ChevronsLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  title="Previous Page"
                >
                  <ChevronLeft className="size-4" />
                </Button>

                {/* Page Number Chips */}
                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = currentPage;
                    if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    if (pageNum < 1 || pageNum > totalPages) return null;

                    const isActive = pageNum === currentPage;
                    return (
                      <Button
                        key={pageNum}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className="size-8 text-xs font-mono p-0"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  title="Next Page"
                >
                  <ChevronRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  title="Last Page"
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
              No scholars found
            </div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No student records matched the search or filter criteria. Try adjusting your selections.
            </p>
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
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
                  {selectedStudentForModal.cicno || selectedStudentForModal.id}
                </Badge>
                <CardTitle className="text-xl font-serif">
                  {selectedStudentForModal.student_name || selectedStudentForModal.full_name}
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
              
              {/* Core Information */}
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

              {/* Geographic Data */}
              <div className="space-y-2">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary" />
                  <span>Residential Location</span>
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
                    <span className="text-[10px] block font-mono uppercase">Guardian Phone</span>
                    <span className="text-foreground font-mono">{selectedStudentForModal.g_phone || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Affiliation Assignments */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-md border border-border bg-card">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground block flex items-center gap-1">
                      <Layers className="size-3 text-primary" />
                      Assigned Orbit
                    </span>
                    <div className="font-medium text-foreground mt-0.5">
                      {selectedStudentForModal.orbit
                        ? selectedStudentForModal.orbit.name
                        : selectedStudentForModal.orbit_id || "Unassigned"}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-md border border-border bg-card">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground block flex items-center gap-1">
                      <School className="size-3 text-primary" />
                      Affiliated College
                    </span>
                    <div className="font-medium text-foreground mt-0.5">
                      {selectedStudentForModal.college
                        ? selectedStudentForModal.college.name
                        : selectedStudentForModal.affno || "Unassigned"}
                    </div>
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
