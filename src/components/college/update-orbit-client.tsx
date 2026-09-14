"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Layers,
  GraduationCap,
  School,
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Sparkles,
  UserCheck,
  UserX,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatStudentClass } from "@/lib/class-helper";
import { updateStudentOrbitAction, bulkAssignStudentsOrbitAction } from "@/app/college/actions";
import type { College, Student, Orbit } from "@/types/database.types";

interface Props {
  college: College;
  initialStudents: Student[];
  activeOrbits: Orbit[];
}

type SortField = "status" | "cicno" | "student_name" | "class_name" | "place" | "orbit";

export function UpdateOrbitClient({ college, initialStudents, activeOrbits }: Props) {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UNASSIGNED" | "ASSIGNED">("ALL");

  // Selected students for bulk update
  const [selectedCicnos, setSelectedCicnos] = useState<Set<string>>(new Set());
  const [bulkTargetOrbit, setBulkTargetOrbit] = useState<string>("");

  // Feedback notifications
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [updatingCicno, setUpdatingCicno] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Sorting State - Default: Status (Unassigned first), then cicno ASC
  const [sortField, setSortField] = useState<SortField>("status");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Dynamic College-Specific Classes (Only classes available in this college!)
  const availableClassesInCollege = useMemo(() => {
    const classSet = new Set<string>();
    initialStudents.forEach((s) => {
      if (s.class_name) {
        classSet.add(s.class_name);
      }
    });

    return Array.from(classSet).sort((a, b) => {
      return a.localeCompare(b, undefined, { numeric: true });
    });
  }, [initialStudents]);

  // Overall Counts
  const totalCount = students.length;
  const unassignedCount = students.filter((s) => !s.orbit_id || s.orbit_id === "none").length;
  const assignedCount = totalCount - unassignedCount;
  const completionPercentage = totalCount > 0 ? Math.round((assignedCount / totalCount) * 100) : 0;

  // Handle single student orbit update
  const handleOrbitChange = async (cicno: string, newOrbitId: string) => {
    setUpdatingCicno(cicno);
    setNotification(null);

    const orbitVal = newOrbitId === "none" || !newOrbitId ? null : newOrbitId;
    const targetOrbitObj = activeOrbits.find((o) => o.id === orbitVal) || null;

    // Optimistic state update
    setStudents((prev) =>
      prev.map((s) => {
        if (s.cicno === cicno) {
          return {
            ...s,
            orbit_id: orbitVal,
            orbit: targetOrbitObj,
          };
        }
        return s;
      })
    );

    startTransition(async () => {
      const res = await updateStudentOrbitAction(cicno, orbitVal);
      setUpdatingCicno(null);

      if (res.success) {
        setNotification({
          type: "success",
          text: res.message || "Orbit assignment saved.",
        });
      } else {
        setNotification({
          type: "error",
          text: res.error || "Failed to update orbit in database.",
        });
        // Revert on failure
        setStudents(initialStudents);
      }
    });
  };

  // Handle bulk orbit assignment
  const handleBulkAssign = async () => {
    if (selectedCicnos.size === 0) return;
    if (!bulkTargetOrbit) {
      setNotification({ type: "error", text: "Please select an active orbit from the dropdown." });
      return;
    }

    const cicnoList = Array.from(selectedCicnos);
    const orbitVal = bulkTargetOrbit === "none" ? null : bulkTargetOrbit;
    const targetOrbitObj = activeOrbits.find((o) => o.id === orbitVal) || null;

    // Optimistic update
    setStudents((prev) =>
      prev.map((s) => {
        if (selectedCicnos.has(s.cicno)) {
          return {
            ...s,
            orbit_id: orbitVal,
            orbit: targetOrbitObj,
          };
        }
        return s;
      })
    );

    startTransition(async () => {
      const res = await bulkAssignStudentsOrbitAction(cicnoList, orbitVal);
      if (res.success) {
        setNotification({
          type: "success",
          text: res.message || `Assigned ${cicnoList.length} scholars to Orbit.`,
        });
        setSelectedCicnos(new Set());
        setBulkTargetOrbit("");
      } else {
        setNotification({
          type: "error",
          text: res.error || "Failed to perform bulk assignment.",
        });
        setStudents(initialStudents);
      }
    });
  };

  // Select all / Deselect all
  const toggleSelectAll = (filteredCicnos: string[]) => {
    if (selectedCicnos.size === filteredCicnos.length) {
      setSelectedCicnos(new Set());
    } else {
      setSelectedCicnos(new Set(filteredCicnos));
    }
  };

  const toggleSelectCicno = (cicno: string) => {
    const updated = new Set(selectedCicnos);
    if (updated.has(cicno)) {
      updated.delete(cicno);
    } else {
      updated.add(cicno);
    }
    setSelectedCicnos(updated);
  };

  // Filter and Sort Students
  const processedStudents = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = students.filter((s) => {
      const cic = (s.cicno || "").toLowerCase();
      const sName = (s.student_name || "").toLowerCase();
      const formattedClass = formatStudentClass(s.class_name).toLowerCase();
      const place = (s.place || "").toLowerCase();
      const panchayath = (s.panchayath || "").toLowerCase();
      const orbName = (s.orbit?.name || s.orbit_id || "").toLowerCase();

      const matchesSearch =
        !q ||
        sName.includes(q) ||
        cic.includes(q) ||
        formattedClass.includes(q) ||
        place.includes(q) ||
        panchayath.includes(q) ||
        orbName.includes(q);

      const matchesClass =
        selectedClass === "ALL" ||
        s.class_name === selectedClass ||
        formatStudentClass(s.class_name) === formatStudentClass(selectedClass);

      const isUnassigned = !s.orbit_id || s.orbit_id === "none";
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "UNASSIGNED" && isUnassigned) ||
        (statusFilter === "ASSIGNED" && !isUnassigned);

      return matchesSearch && matchesClass && matchesStatus;
    });

    return filtered.sort((a, b) => {
      // Primary default sorting: UNASSIGNED FIRST, then cicno ASC
      if (sortField === "status") {
        const aUnassigned = !a.orbit_id || a.orbit_id === "none" ? 0 : 1;
        const bUnassigned = !b.orbit_id || b.orbit_id === "none" ? 0 : 1;

        if (aUnassigned !== bUnassigned) {
          return sortDirection === "asc" ? aUnassigned - bUnassigned : bUnassigned - aUnassigned;
        }

        // Secondary tie-breaker by cicno ASC
        return (a.cicno || "").localeCompare(b.cicno || "", undefined, { numeric: true, sensitivity: "base" });
      }

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
          valA = a.orbit?.name || a.orbit_id || "ZZZ";
          valB = b.orbit?.name || b.orbit_id || "ZZZ";
          break;
      }

      const comparison = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [students, search, selectedClass, statusFilter, sortField, sortDirection]);

  // Sliced Pagination
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
    setStatusFilter("ALL");
    setSortField("status");
    setSortDirection("asc");
    setCurrentPage(1);
    setSelectedCicnos(new Set());
  };

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* HEADER & ASSIGNMENT PROGRESS SUMMARY */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default" className="text-xs font-mono font-bold">
                {college.affno}
              </Badge>
              <Badge variant="secondary" className="text-xs font-mono">
                {college.short_name || college.name}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                Orbit Allocation Console
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
              Update Student Orbit Assignments
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground">
              Assign unallocated scholars or reassign active Orbits for <strong>{college.name}</strong>. Unassigned scholars are highlighted at the top.
            </p>
          </div>

          {/* KPI Indicators */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-border shrink-0">
            <div className="text-center">
              <div className="text-2xl font-serif font-bold text-foreground">{totalCount}</div>
              <div className="text-[10px] uppercase font-mono text-muted-foreground font-semibold">Total Scholars</div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-center">
              <div className="text-2xl font-serif font-bold text-amber-500">{unassignedCount}</div>
              <div className="text-[10px] uppercase font-mono text-muted-foreground font-semibold">Unassigned</div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-center">
              <div className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-400">{completionPercentage}%</div>
              <div className="text-[10px] uppercase font-mono text-muted-foreground font-semibold">Allocated</div>
            </div>
          </div>
        </div>

        {/* Real-time notification banner */}
        {notification && (
          <div
            className={`mt-4 p-3 rounded-lg border text-xs flex items-center justify-between animate-in fade-in duration-200 ${
              notification.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/10 border-destructive/30 text-destructive"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle2 className="size-4 shrink-0" />
              ) : (
                <AlertCircle className="size-4 shrink-0" />
              )}
              <span className="font-medium">{notification.text}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* BULK ASSIGNMENT CONTROL BAR (Active when items are selected) */}
      {/* ========================================================================= */}
      {selectedCicnos.size > 0 && (
        <div className="sticky top-16 z-40 p-4 rounded-xl border border-primary/40 bg-primary/5 backdrop-blur-md shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs font-mono font-bold">
              {selectedCicnos.size} Scholars Selected
            </Badge>
            <span className="text-xs text-muted-foreground">
              Choose an active Orbit to assign to all selected scholars:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={bulkTargetOrbit}
              onChange={(e) => setBulkTargetOrbit(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-2xs min-w-[220px]"
            >
              <option value="">-- Choose Active Orbit --</option>
              {activeOrbits.map((orb) => (
                <option key={orb.id} value={orb.id}>
                  {orb.name} ({orb.id}) • {orb.district}
                </option>
              ))}
              <option value="none">-- Set Unassigned (Remove Orbit) --</option>
            </select>

            <Button
              size="sm"
              onClick={handleBulkAssign}
              disabled={isPending || !bulkTargetOrbit}
              className="h-9 text-xs gap-1.5"
            >
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              Assign to {selectedCicnos.size} Scholars
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCicnos(new Set())}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FILTER & SEARCH CONTROL BAR */}
      {/* ========================================================================= */}
      <Card className="shadow-sm border-border">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by Scholar Name, CIC Number, Place, Current Orbit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs sm:text-sm"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* College-Only Class Filter Dropdown */}
              <div className="flex items-center gap-1.5 min-w-[170px]">
                <GraduationCap className="size-3.5 text-muted-foreground shrink-0 hidden sm:block" />
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs font-mono"
                >
                  <option value="ALL">All Classes in Campus ({availableClassesInCollege.length})</option>
                  {availableClassesInCollege.map((cls) => (
                    <option key={cls} value={cls}>
                      {formatStudentClass(cls)} {cls !== formatStudentClass(cls) ? `(${cls})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter Dropdown */}
              <div className="flex items-center gap-1.5 min-w-[150px]">
                <Layers className="size-3.5 text-muted-foreground shrink-0 hidden sm:block" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs font-mono"
                >
                  <option value="ALL">Status: All Scholars</option>
                  <option value="UNASSIGNED">Unassigned Only ({unassignedCount})</option>
                  <option value="ASSIGNED">Assigned Only ({assignedCount})</option>
                </select>
              </div>

              {/* Reset Filters */}
              {(search ||
                selectedClass !== "ALL" ||
                statusFilter !== "ALL" ||
                sortField !== "status" ||
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

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-border text-[11px] font-mono text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Filter className="size-3 text-primary" />
              <span>
                Showing <strong>{startRecord}–{endRecord}</strong> of <strong>{processedStudents.length}</strong> matching scholars 
                {sortField === "status" && (
                  <span className="text-amber-500 font-semibold ml-1">(Unassigned first)</span>
                )}
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
                <option value={250}>250</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* STUDENT ORBIT UPDATE TABLE */}
      {/* ========================================================================= */}
      {processedStudents.length > 0 ? (
        <div className="space-y-3">
          <Table className="bg-card">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      processedStudents.length > 0 &&
                      selectedCicnos.size === processedStudents.length
                    }
                    onChange={() => toggleSelectAll(processedStudents.map((s) => s.cicno))}
                    className="size-3.5 rounded border-border text-primary focus:ring-primary"
                    aria-label="Select all"
                  />
                </TableHead>
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
                    <span>Residential Location</span>
                    {renderSortIcon("place")}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none min-w-[260px]" onClick={() => handleSort("orbit")}>
                  <div className="flex items-center gap-1">
                    <span>Assign / Update Orbit Domain</span>
                    {renderSortIcon("orbit")}
                  </div>
                </TableHead>
                <TableHead className="text-center w-28">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.map((s) => {
                const isUnassigned = !s.orbit_id || s.orbit_id === "none";
                const isCurrentlyUpdating = updatingCicno === s.cicno;
                const formattedClass = formatStudentClass(s.class_name);
                const isSelected = selectedCicnos.has(s.cicno);

                return (
                  <TableRow
                    key={s.cicno}
                    className={`hover:bg-muted/30 transition-colors ${
                      isUnassigned ? "bg-amber-500/[0.03]" : ""
                    } ${isSelected ? "bg-primary/[0.06]" : ""}`}
                  >
                    
                    {/* Checkbox */}
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectCicno(s.cicno)}
                        className="size-3.5 rounded border-border text-primary focus:ring-primary"
                        aria-label={`Select ${s.student_name}`}
                      />
                    </TableCell>

                    {/* CIC No */}
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      {s.cicno}
                    </TableCell>

                    {/* Scholar Name */}
                    <TableCell>
                      <div className="font-semibold text-sm text-foreground">
                        {s.student_name}
                      </div>
                      {s.phone && (
                        <div className="text-[11px] text-muted-foreground font-mono">
                          Ph: {s.phone}
                        </div>
                      )}
                    </TableCell>

                    {/* Academic Stage */}
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs font-medium">
                        {formattedClass}
                      </Badge>
                    </TableCell>

                    {/* Location */}
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="text-foreground font-medium">{s.place}</div>
                      {s.panchayath && (
                        <div className="text-[11px] text-muted-foreground">
                          {s.panchayath} {s.pin_code ? `(${s.pin_code})` : ""}
                        </div>
                      )}
                    </TableCell>

                    {/* Active Orbit Selection Dropdown (Instant Live Update) */}
                    <TableCell>
                      <div className="relative">
                        <select
                          value={s.orbit_id || "none"}
                          disabled={isCurrentlyUpdating}
                          onChange={(e) => handleOrbitChange(s.cicno, e.target.value)}
                          className={`h-9 w-full rounded-md border px-2.5 py-1 text-xs shadow-2xs font-medium transition-all ${
                            isUnassigned
                              ? "border-amber-400 bg-amber-500/10 text-amber-700 dark:text-amber-400 focus:border-amber-500"
                              : "border-input bg-background text-foreground focus:border-primary"
                          }`}
                        >
                          <option value="none">-- Unassigned (No Orbit) --</option>
                          {activeOrbits.map((orb) => (
                            <option key={orb.id} value={orb.id}>
                              {orb.name} ({orb.id}) • {orb.district}
                            </option>
                          ))}
                        </select>

                        {isCurrentlyUpdating && (
                          <div className="absolute right-2 top-2.5">
                            <Loader2 className="size-4 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Allocation Status Indicator */}
                    <TableCell className="text-center">
                      {isUnassigned ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono border-amber-400 text-amber-600 dark:text-amber-400 bg-amber-500/10 gap-1 uppercase"
                        >
                          <AlertCircle className="size-3 text-amber-500" />
                          Unassigned
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 gap-1 uppercase"
                        >
                          <CheckCircle2 className="size-3 text-emerald-500" />
                          Assigned
                        </Badge>
                      )}
                    </TableCell>

                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination Navigation */}
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
            <Layers className="size-10 text-muted-foreground mx-auto" />
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

    </div>
  );
}
