"use client";

import { useState, useMemo } from "react";
import { Search, Award, Layers, Calendar, Info, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { OrbitLeader } from "@/types/database.types";

type SortField = "student_name" | "position_title" | "orbit" | "term_year";

export function LeaderTableClient({ initialLeaders }: { initialLeaders: OrbitLeader[] }) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("orbit");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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

  const processedLeaders = useMemo(() => {
    const q = search.toLowerCase().trim();
    let filtered = initialLeaders;

    if (q) {
      filtered = initialLeaders.filter((leader) => {
        const sName = leader.student?.student_name || leader.student?.full_name || "";
        return (
          sName.toLowerCase().includes(q) ||
          leader.position_title.toLowerCase().includes(q) ||
          (leader.orbit && leader.orbit.name.toLowerCase().includes(q)) ||
          leader.term_year.toLowerCase().includes(q)
        );
      });
    }

    return [...filtered].sort((a, b) => {
      let valA = "";
      let valB = "";

      switch (sortField) {
        case "student_name":
          valA = a.student?.student_name || a.student?.full_name || "";
          valB = b.student?.student_name || b.student?.full_name || "";
          break;
        case "position_title":
          valA = a.position_title || "";
          valB = b.position_title || "";
          break;
        case "orbit":
          valA = a.orbit?.name || a.orbit_id || "";
          valB = b.orbit?.name || b.orbit_id || "";
          break;
        case "term_year":
          valA = a.term_year || "";
          valB = b.term_year || "";
          break;
      }

      const comparison = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [initialLeaders, search, sortField, sortDirection]);

  return (
    <div className="space-y-4">
      {/* Search Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by leader name, position, or orbit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs sm:text-sm"
          />
        </div>
        <div className="text-xs text-muted-foreground font-mono self-start sm:self-center">
          Showing <strong>{processedLeaders.length}</strong> of <strong>{initialLeaders.length}</strong> leaders (Sorted by <strong>{sortField}</strong> {sortDirection.toUpperCase()})
        </div>
      </div>

      {/* Leaders Table */}
      {processedLeaders.length > 0 ? (
        <Table className="bg-card">
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("student_name")}>
                <div className="flex items-center gap-1">
                  <span>Leader Name</span>
                  {renderSortIcon("student_name")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("position_title")}>
                <div className="flex items-center gap-1">
                  <span>Position / Role</span>
                  {renderSortIcon("position_title")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("orbit")}>
                <div className="flex items-center gap-1">
                  <span>Assigned Orbit</span>
                  {renderSortIcon("orbit")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("term_year")}>
                <div className="flex items-center gap-1">
                  <span>Term Year</span>
                  {renderSortIcon("term_year")}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedLeaders.map((leader) => (
              <TableRow key={leader.id}>
                <TableCell className="font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <Award className="size-4 text-primary shrink-0" />
                    <span>{leader.student?.student_name || leader.student?.full_name || "Representative"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-medium text-xs">
                    {leader.position_title}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground text-xs">
                    <Layers className="size-3.5 text-muted-foreground shrink-0" />
                    {leader.orbit?.name || "All Orbits"}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="size-3 text-muted-foreground" />
                    {leader.term_year}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-12 text-center space-y-3 bg-card">
          <div className="size-10 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <Info className="size-5" />
          </div>
          <h3 className="font-serif font-semibold text-base text-foreground">
            {initialLeaders.length === 0 ? "No Orbit Leaders Appointed Yet" : "No matching leaders found"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {initialLeaders.length === 0
              ? "Appointed orbit leadership delegations will automatically synchronize here once designated."
              : "Try adjusting your search criteria."}
          </p>
        </div>
      )}
    </div>
  );
}
