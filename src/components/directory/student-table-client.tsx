"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  GraduationCap,
  School,
  Info,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatStudentClass } from "@/lib/class-helper";
import type { Student } from "@/types/database.types";

type SortField = "cicno" | "student_name" | "class_name" | "place" | "orbit" | "college" | "role";

export function StudentTableClient({ initialStudents }: { initialStudents: Student[] }) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("cicno");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize, sortField, sortDirection]);

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

  const processedStudents = useMemo(() => {
    const q = search.toLowerCase().trim();
    let filtered = initialStudents;

    if (q) {
      filtered = initialStudents.filter((student) => {
        const cic = student.cicno || student.id || student.admission_no || "";
        const sName = student.student_name || student.full_name || "";
        const formattedClass = formatStudentClass(student.class_name).toLowerCase();
        return (
          sName.toLowerCase().includes(q) ||
          cic.toLowerCase().includes(q) ||
          formattedClass.includes(q) ||
          (student.place && student.place.toLowerCase().includes(q)) ||
          (student.panchayath && student.panchayath.toLowerCase().includes(q)) ||
          (student.college && student.college.name.toLowerCase().includes(q)) ||
          (student.orbit && student.orbit.name.toLowerCase().includes(q))
        );
      });
    }

    return [...filtered].sort((a, b) => {
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
  }, [initialStudents, search, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(processedStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedStudents.slice(start, start + pageSize);
  }, [processedStudents, currentPage, pageSize]);

  const startRecord = processedStudents.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(currentPage * pageSize, processedStudents.length);

  return (
    <div className="space-y-4">
      {/* Search Filter & Page Size Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by scholar name, CIC number, or place..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs sm:text-sm"
          />
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-muted-foreground font-mono">
          <span>Showing <strong>{startRecord}–{endRecord}</strong> of <strong>{processedStudents.length}</strong> (Sorted by <strong>{sortField}</strong> {sortDirection.toUpperCase()})</span>
          <div className="flex items-center gap-1.5">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-7 rounded border border-input bg-background px-2 text-xs font-mono"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student Table */}
      {processedStudents.length > 0 ? (
        <div className="space-y-3">
          <Table className="bg-card">
            <TableHeader>
              <TableRow>
                <TableHead className="w-28 cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("cicno")}>
                  <div className="flex items-center gap-1">
                    <span>CIC Number</span>
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
                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("college")}>
                  <div className="flex items-center gap-1">
                    <span>Affiliated College</span>
                    {renderSortIcon("college")}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none text-center" onClick={() => handleSort("role")}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Role</span>
                    {renderSortIcon("role")}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.map((student) => {
                const cic = student.cicno || student.id || student.admission_no;
                const sName = student.student_name || student.full_name;

                return (
                  <TableRow key={cic}>
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {cic}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="size-4 text-muted-foreground shrink-0" />
                        <span>{sName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <Badge variant="secondary" className="font-normal text-xs">
                        {formatStudentClass(student.class_name)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {student.place} {student.panchayath ? `• ${student.panchayath}` : ""}
                    </TableCell>
                    <TableCell>
                      {student.orbit ? (
                        <Badge variant="secondary" className="font-normal text-xs gap-1">
                          <Layers className="size-3 text-primary" />
                          {student.orbit.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {student.college ? (
                        <span className="flex items-center gap-1 text-muted-foreground text-xs">
                          <School className="size-3.5 text-muted-foreground shrink-0" />
                          {student.college.name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                        {student.role || "member"}
                      </Badge>
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
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
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
        <div className="p-8 text-center bg-card rounded-lg border border-border">
          <Info className="size-8 text-muted-foreground mx-auto mb-2" />
          <div className="text-sm font-semibold">No students match your search</div>
          <div className="text-xs text-muted-foreground mt-1">Try clearing your search query.</div>
        </div>
      )}
    </div>
  );
}
