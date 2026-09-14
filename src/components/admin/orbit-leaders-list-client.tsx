"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Award,
  Shield,
  School,
  MapPin,
  Eye,
  X,
  RotateCcw,
  UserCheck,
  UserX,
  Phone,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { OrbitLeadershipRecord, College } from "@/types/database.types";

interface Props {
  initialRecords: OrbitLeadershipRecord[];
  colleges: College[];
}

type SortField = "orbit_id" | "orbit_name" | "district" | "leader" | "asst_leader";

export function OrbitLeadersListClient({ initialRecords, colleges }: Props) {
  const [search, setSearch] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [selectedCollege, setSelectedCollege] = useState<string>("ALL");
  const [leaderFilter, setLeaderFilter] = useState<"ALL" | "ASSIGNED" | "VACANT">("ALL");
  const [asstLeaderFilter, setAsstLeaderFilter] = useState<"ALL" | "ASSIGNED" | "VACANT">("ALL");

  // Sorting State - Default: Ascending by orbit_id
  const [sortField, setSortField] = useState<SortField>("orbit_id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Modal State for viewing orbit leadership details
  const [selectedRecordForModal, setSelectedRecordForModal] = useState<OrbitLeadershipRecord | null>(null);

  // Extract unique Districts from orbits
  const uniqueDistricts = useMemo(() => {
    const districts = Array.from(
      new Set(initialRecords.map((r) => r.district).filter(Boolean))
    );
    return districts.sort();
  }, [initialRecords]);

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

  // Filtered & Sorted Records Logic
  const processedRecords = useMemo(() => {
    const filtered = initialRecords.filter((rec) => {
      const q = search.trim().toLowerCase();
      const orbId = (rec.orbit_id || "").toLowerCase();
      const orbName = (rec.orbit_name || "").toLowerCase();
      const lName = (rec.leader?.student_name || "").toLowerCase();
      const lCic = (rec.leader?.cicno || "").toLowerCase();
      const alName = (rec.asst_leader?.student_name || "").toLowerCase();
      const alCic = (rec.asst_leader?.cicno || "").toLowerCase();

      // 1. Search filter
      const matchesSearch =
        !q ||
        orbName.includes(q) ||
        orbId.includes(q) ||
        lName.includes(q) ||
        lCic.includes(q) ||
        alName.includes(q) ||
        alCic.includes(q);

      // 2. District filter
      const matchesDistrict =
        selectedDistrict === "ALL" || rec.district === selectedDistrict;

      // 3. College filter (if Leader's college OR Asst Leader's college matches)
      const leaderAff = rec.leader?.affno || "";
      const asstAff = rec.asst_leader?.affno || "";
      const matchesCollege =
        selectedCollege === "ALL" ||
        leaderAff === selectedCollege ||
        asstAff === selectedCollege;

      // 4. Leader Status
      const hasLeader = !!rec.leader;
      const matchesLeader =
        leaderFilter === "ALL" ||
        (leaderFilter === "ASSIGNED" && hasLeader) ||
        (leaderFilter === "VACANT" && !hasLeader);

      // 5. Asst Leader Status
      const hasAsstLeader = !!rec.asst_leader;
      const matchesAsstLeader =
        asstLeaderFilter === "ALL" ||
        (asstLeaderFilter === "ASSIGNED" && hasAsstLeader) ||
        (asstLeaderFilter === "VACANT" && !hasAsstLeader);

      return (
        matchesSearch &&
        matchesDistrict &&
        matchesCollege &&
        matchesLeader &&
        matchesAsstLeader
      );
    });

    return filtered.sort((a, b) => {
      let valA = "";
      let valB = "";

      switch (sortField) {
        case "orbit_id":
          valA = a.orbit_id || "";
          valB = b.orbit_id || "";
          break;
        case "orbit_name":
          valA = a.orbit_name || "";
          valB = b.orbit_name || "";
          break;
        case "district":
          valA = a.district || "";
          valB = b.district || "";
          break;
        case "leader":
          valA = a.leader?.student_name || "";
          valB = b.leader?.student_name || "";
          break;
        case "asst_leader":
          valA = a.asst_leader?.student_name || "";
          valB = b.asst_leader?.student_name || "";
          break;
      }

      const comparison = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [initialRecords, search, selectedDistrict, selectedCollege, leaderFilter, asstLeaderFilter, sortField, sortDirection]);

  const handleResetFilters = () => {
    setSearch("");
    setSelectedDistrict("ALL");
    setSelectedCollege("ALL");
    setLeaderFilter("ALL");
    setAsstLeaderFilter("ALL");
    setSortField("orbit_id");
    setSortDirection("asc");
  };

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* STICKY FLOATING MULTI-FILTER CONTROL BAR */}
      {/* ========================================================================= */}
      <div className="sticky top-16 z-30 pt-2 pb-3 bg-background/95 backdrop-blur-md transition-all">
        <Card className="shadow-md border-border/80 bg-card/95">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Leader Name, CIC No, Orbit Name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs sm:text-sm"
                />
              </div>

              {/* Multi-Filters Row */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* District Filter */}
                <div className="flex items-center gap-1.5 min-w-[130px]">
                  <MapPin className="size-3.5 text-muted-foreground shrink-0 hidden sm:block" />
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="ALL">All Districts</option>
                    {uniqueDistricts.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>

                {/* College Affiliation Filter */}
                <div className="flex items-center gap-1.5 min-w-[140px]">
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

                {/* Leader Vacancy Filter */}
                <select
                  value={leaderFilter}
                  onChange={(e) => setLeaderFilter(e.target.value as any)}
                  className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="ALL">Leaders: All</option>
                  <option value="ASSIGNED">Leaders: Assigned</option>
                  <option value="VACANT">Leaders: Vacant</option>
                </select>

                {/* Asst Leader Vacancy Filter */}
                <select
                  value={asstLeaderFilter}
                  onChange={(e) => setAsstLeaderFilter(e.target.value as any)}
                  className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="ALL">Asst: All</option>
                  <option value="ASSIGNED">Asst: Assigned</option>
                  <option value="VACANT">Asst: Vacant</option>
                </select>

                {/* Reset Button */}
                {(search ||
                  selectedDistrict !== "ALL" ||
                  selectedCollege !== "ALL" ||
                  leaderFilter !== "ALL" ||
                  asstLeaderFilter !== "ALL" ||
                  sortField !== "orbit_id" ||
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
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border text-[11px] font-mono text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Filter className="size-3 text-primary" />
                <span>Showing <strong>{processedRecords.length}</strong> of <strong>{initialRecords.length}</strong> Orbit domains (Sorted by <strong>{sortField}</strong> {sortDirection.toUpperCase()})</span>
              </div>
              <span className="text-[10px] text-primary font-semibold uppercase">
                ● Live Leadership Delegation Roster
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* ORBIT LEADERS COMPARATIVE ROSTER TABLE */}
      {/* ========================================================================= */}
      {processedRecords.length > 0 ? (
        <Table className="bg-card">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead className="w-48 cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("orbit_id")}>
                <div className="flex items-center gap-1">
                  <span>Orbit Domain</span>
                  {renderSortIcon("orbit_id")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("leader")}>
                <div className="flex items-center gap-1">
                  <span>Orbit Leader (Primary)</span>
                  {renderSortIcon("leader")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("asst_leader")}>
                <div className="flex items-center gap-1">
                  <span>Assistant Leader</span>
                  {renderSortIcon("asst_leader")}
                </div>
              </TableHead>
              <TableHead className="text-right w-24">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedRecords.map((record, index) => {
              const leader = record.leader;
              const asst = record.asst_leader;

              return (
                <TableRow key={record.orbit_id} className="hover:bg-muted/30">
                  
                  {/* Sl No */}
                  <TableCell className="font-mono text-xs text-muted-foreground text-center">
                    {index + 1}
                  </TableCell>

                  {/* Orbit Domain Info */}
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <Layers className="size-4 text-primary shrink-0" />
                        <span>{record.orbit_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {record.orbit_id}
                        </Badge>
                        <span>{record.district}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* 1. Orbit Leader (Primary) */}
                  <TableCell>
                    {leader ? (
                      <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/80 space-y-1.5 max-w-sm">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                            <Award className="size-3.5 text-primary shrink-0" />
                            <span>{leader.student_name}</span>
                          </div>
                          <Badge variant="default" className="text-[9px] font-mono">
                            {leader.cicno}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <School className="size-3 shrink-0" />
                          <span className="truncate">{leader.college_name || "College Connected"}</span>
                          {leader.affno && (
                            <span className="font-mono text-[10px]">({leader.affno})</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg border border-dashed border-border/60 bg-muted/10 text-muted-foreground text-xs flex items-center gap-1.5">
                        <UserX className="size-3.5 text-muted-foreground/60" />
                        <span className="italic">Position Vacant</span>
                      </div>
                    )}
                  </TableCell>

                  {/* 2. Assistant Leader */}
                  <TableCell>
                    {asst ? (
                      <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/80 space-y-1.5 max-w-sm">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                            <Shield className="size-3.5 text-secondary-foreground shrink-0" />
                            <span>{asst.student_name}</span>
                          </div>
                          <Badge variant="secondary" className="text-[9px] font-mono">
                            {asst.cicno}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <School className="size-3 shrink-0" />
                          <span className="truncate">{asst.college_name || "College Connected"}</span>
                          {asst.affno && (
                            <span className="font-mono text-[10px]">({asst.affno})</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg border border-dashed border-border/60 bg-muted/10 text-muted-foreground text-xs flex items-center gap-1.5">
                        <UserX className="size-3.5 text-muted-foreground/60" />
                        <span className="italic">Position Vacant</span>
                      </div>
                    )}
                  </TableCell>

                  {/* View Modal Trigger */}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRecordForModal(record)}
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
      ) : (
        <Card className="text-center py-12 border-dashed">
          <CardContent className="space-y-3">
            <Award className="size-10 text-muted-foreground mx-auto" />
            <div className="font-serif font-semibold text-lg text-foreground">
              No Orbit Leaders Match Selection
            </div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No leadership records matched your search or filters. Try adjusting your query.
            </p>
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* ORBIT LEADERS DETAIL MODAL */}
      {/* ========================================================================= */}
      {selectedRecordForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-xl shadow-2xl border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <div className="space-y-1">
                <Badge variant="default" className="text-[10px] font-mono">
                  {selectedRecordForModal.orbit_id}
                </Badge>
                <CardTitle className="text-xl font-serif">
                  {selectedRecordForModal.orbit_name} Leadership Roster
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedRecordForModal.district}, {selectedRecordForModal.state}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedRecordForModal(null)}
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-4 pt-4 text-xs">
              
              {/* Orbit Leader Card */}
              <div className="p-3.5 rounded-lg bg-secondary/30 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-serif font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Award className="size-4 text-primary" />
                    <span>Orbit Leader (Primary Officer)</span>
                  </div>
                  {selectedRecordForModal.leader ? (
                    <Badge variant="default" className="text-[10px] font-mono">
                      {selectedRecordForModal.leader.cicno}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Vacant</Badge>
                  )}
                </div>

                {selectedRecordForModal.leader ? (
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-1">
                    <div>
                      <span className="text-[10px] block font-mono uppercase">Full Name</span>
                      <span className="font-semibold text-foreground text-sm">
                        {selectedRecordForModal.leader.student_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] block font-mono uppercase">College Affiliation</span>
                      <span className="text-foreground">
                        {selectedRecordForModal.leader.college_name || "College Connected"}
                        {selectedRecordForModal.leader.affno && ` (${selectedRecordForModal.leader.affno})`}
                      </span>
                    </div>
                    {selectedRecordForModal.leader.phone && (
                      <div>
                        <span className="text-[10px] block font-mono uppercase">Phone</span>
                        <span className="text-foreground font-mono">{selectedRecordForModal.leader.phone}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No student designated as Orbit Leader yet.</p>
                )}
              </div>

              {/* Assistant Leader Card */}
              <div className="p-3.5 rounded-lg bg-secondary/30 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-serif font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Shield className="size-4 text-secondary-foreground" />
                    <span>Assistant Orbit Leader</span>
                  </div>
                  {selectedRecordForModal.asst_leader ? (
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {selectedRecordForModal.asst_leader.cicno}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Vacant</Badge>
                  )}
                </div>

                {selectedRecordForModal.asst_leader ? (
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-1">
                    <div>
                      <span className="text-[10px] block font-mono uppercase">Full Name</span>
                      <span className="font-semibold text-foreground text-sm">
                        {selectedRecordForModal.asst_leader.student_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] block font-mono uppercase">College Affiliation</span>
                      <span className="text-foreground">
                        {selectedRecordForModal.asst_leader.college_name || "College Connected"}
                        {selectedRecordForModal.asst_leader.affno && ` (${selectedRecordForModal.asst_leader.affno})`}
                      </span>
                    </div>
                    {selectedRecordForModal.asst_leader.phone && (
                      <div>
                        <span className="text-[10px] block font-mono uppercase">Phone</span>
                        <span className="text-foreground font-mono">{selectedRecordForModal.asst_leader.phone}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No student designated as Assistant Leader yet.</p>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRecordForModal(null)}
                  className="text-xs"
                >
                  Close Roster
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
