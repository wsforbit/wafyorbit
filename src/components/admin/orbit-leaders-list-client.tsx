"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Award,
  Shield,
  School,
  MapPin,
  Compass,
  Eye,
  X,
  RotateCcw,
  UserX,
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
import { formatStudentClass } from "@/lib/class-helper";
import type {
  OrbitLeadershipRecord,
  DistrictLeadershipRecord,
  ConstituencyLeadershipRecord,
  College,
} from "@/types/database.types";

interface Props {
  initialOrbitRecords: OrbitLeadershipRecord[];
  initialDistrictRecords: DistrictLeadershipRecord[];
  initialConstituencyRecords: ConstituencyLeadershipRecord[];
  colleges: College[];
}

type OrbitSortField = "orbit_id" | "orbit_name" | "district" | "leader" | "asst_leader";
type DistrictSortField = "district" | "orbit_count" | "student_count" | "leader";
type ConstSortField = "constituency" | "orbit_name" | "student_count" | "leader";

export function OrbitLeadersListClient({
  initialOrbitRecords,
  initialDistrictRecords,
  initialConstituencyRecords,
  colleges,
}: Props) {
  // Tab State: "orbit" | "district" | "constituency"
  const [activeTab, setActiveTab] = useState<"orbit" | "district" | "constituency">("orbit");

  // Common Search
  const [search, setSearch] = useState("");

  // Filters for Orbit Tab
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [selectedCollege, setSelectedCollege] = useState<string>("ALL");
  const [leaderFilter, setLeaderFilter] = useState<"ALL" | "ASSIGNED" | "VACANT">("ALL");
  const [asstLeaderFilter, setAsstLeaderFilter] = useState<"ALL" | "ASSIGNED" | "VACANT">("ALL");

  // Filter for District / Constituency Tab
  const [vacancyFilter, setVacancyFilter] = useState<"ALL" | "ASSIGNED" | "VACANT">("ALL");

  // Sorting States
  const [orbitSortField, setOrbitSortField] = useState<OrbitSortField>("orbit_id");
  const [orbitSortDirection, setOrbitSortDirection] = useState<"asc" | "desc">("asc");

  const [distSortField, setDistSortField] = useState<DistrictSortField>("district");
  const [distSortDirection, setDistSortDirection] = useState<"asc" | "desc">("asc");

  const [constSortField, setConstSortField] = useState<ConstSortField>("constituency");
  const [constSortDirection, setConstSortDirection] = useState<"asc" | "desc">("asc");

  // Modal State
  const [selectedOrbitForModal, setSelectedOrbitForModal] = useState<OrbitLeadershipRecord | null>(null);
  const [selectedDistrictForModal, setSelectedDistrictForModal] = useState<DistrictLeadershipRecord | null>(null);
  const [selectedConstForModal, setSelectedConstForModal] = useState<ConstituencyLeadershipRecord | null>(null);

  // Unique Districts from Orbit records
  const uniqueDistricts = useMemo(() => {
    const districts = Array.from(
      new Set(initialOrbitRecords.map((r) => r.district).filter(Boolean))
    );
    return districts.sort();
  }, [initialOrbitRecords]);

  // Orbit Sorting Handler
  const handleOrbitSort = (field: OrbitSortField) => {
    if (orbitSortField === field) {
      setOrbitSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setOrbitSortField(field);
      setOrbitSortDirection("asc");
    }
  };

  const handleDistSort = (field: DistrictSortField) => {
    if (distSortField === field) {
      setDistSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setDistSortField(field);
      setDistSortDirection("asc");
    }
  };

  const handleConstSort = (field: ConstSortField) => {
    if (constSortField === field) {
      setConstSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setConstSortField(field);
      setConstSortDirection("asc");
    }
  };

  const renderSortIcon = (currentField: string, targetField: string, direction: "asc" | "desc") => {
    if (currentField !== targetField) {
      return <ArrowUpDown className="size-3 text-muted-foreground/50 shrink-0" />;
    }
    return direction === "asc" ? (
      <ArrowUp className="size-3 text-primary shrink-0" />
    ) : (
      <ArrowDown className="size-3 text-primary shrink-0" />
    );
  };

  // 1. Filtered & Sorted Orbit Records
  const processedOrbitRecords = useMemo(() => {
    const filtered = initialOrbitRecords.filter((rec) => {
      const q = search.trim().toLowerCase();
      const orbId = (rec.orbit_id || "").toLowerCase();
      const orbName = (rec.orbit_name || "").toLowerCase();
      const lName = (rec.leader?.student_name || "").toLowerCase();
      const lCic = (rec.leader?.cicno || "").toLowerCase();
      const alName = (rec.asst_leader?.student_name || "").toLowerCase();
      const alCic = (rec.asst_leader?.cicno || "").toLowerCase();

      const matchesSearch =
        !q ||
        orbName.includes(q) ||
        orbId.includes(q) ||
        lName.includes(q) ||
        lCic.includes(q) ||
        alName.includes(q) ||
        alCic.includes(q);

      const matchesDistrict =
        selectedDistrict === "ALL" || rec.district === selectedDistrict;

      const leaderAff = rec.leader?.affno || "";
      const asstAff = rec.asst_leader?.affno || "";
      const matchesCollege =
        selectedCollege === "ALL" ||
        leaderAff === selectedCollege ||
        asstAff === selectedCollege;

      const hasLeader = !!rec.leader;
      const matchesLeader =
        leaderFilter === "ALL" ||
        (leaderFilter === "ASSIGNED" && hasLeader) ||
        (leaderFilter === "VACANT" && !hasLeader);

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

      switch (orbitSortField) {
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
      return orbitSortDirection === "asc" ? comparison : -comparison;
    });
  }, [initialOrbitRecords, search, selectedDistrict, selectedCollege, leaderFilter, asstLeaderFilter, orbitSortField, orbitSortDirection]);

  // 2. Filtered & Sorted District Records
  const processedDistrictRecords = useMemo(() => {
    const filtered = initialDistrictRecords.filter((rec) => {
      const q = search.trim().toLowerCase();
      const dist = (rec.district || "").toLowerCase();
      const lName = (rec.leader?.student_name || "").toLowerCase();
      const lCic = (rec.leader?.cicno || "").toLowerCase();

      const matchesSearch = !q || dist.includes(q) || lName.includes(q) || lCic.includes(q);

      const hasLeader = !!rec.leader;
      const matchesVacancy =
        vacancyFilter === "ALL" ||
        (vacancyFilter === "ASSIGNED" && hasLeader) ||
        (vacancyFilter === "VACANT" && !hasLeader);

      return matchesSearch && matchesVacancy;
    });

    return filtered.sort((a, b) => {
      if (distSortField === "orbit_count") {
        return distSortDirection === "asc" ? a.orbit_count - b.orbit_count : b.orbit_count - a.orbit_count;
      }
      if (distSortField === "student_count") {
        return distSortDirection === "asc" ? a.student_count - b.student_count : b.student_count - a.student_count;
      }

      let valA = "";
      let valB = "";
      switch (distSortField) {
        case "district":
          valA = a.district || "";
          valB = b.district || "";
          break;
        case "leader":
          valA = a.leader?.student_name || "";
          valB = b.leader?.student_name || "";
          break;
      }

      const comparison = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
      return distSortDirection === "asc" ? comparison : -comparison;
    });
  }, [initialDistrictRecords, search, vacancyFilter, distSortField, distSortDirection]);

  // 3. Filtered & Sorted Constituency Records
  const processedConstituencyRecords = useMemo(() => {
    const filtered = initialConstituencyRecords.filter((rec) => {
      const q = search.trim().toLowerCase();
      const constName = (rec.constituency || "").toLowerCase();
      const orbName = (rec.orbit_name || "").toLowerCase();
      const lName = (rec.leader?.student_name || "").toLowerCase();
      const lCic = (rec.leader?.cicno || "").toLowerCase();

      const matchesSearch =
        !q ||
        constName.includes(q) ||
        orbName.includes(q) ||
        lName.includes(q) ||
        lCic.includes(q);

      const hasLeader = !!rec.leader;
      const matchesVacancy =
        vacancyFilter === "ALL" ||
        (vacancyFilter === "ASSIGNED" && hasLeader) ||
        (vacancyFilter === "VACANT" && !hasLeader);

      return matchesSearch && matchesVacancy;
    });

    return filtered.sort((a, b) => {
      if (constSortField === "student_count") {
        return constSortDirection === "asc" ? a.student_count - b.student_count : b.student_count - a.student_count;
      }

      let valA = "";
      let valB = "";
      switch (constSortField) {
        case "constituency":
          valA = a.constituency || "";
          valB = b.constituency || "";
          break;
        case "orbit_name":
          valA = a.orbit_name || "";
          valB = b.orbit_name || "";
          break;
        case "leader":
          valA = a.leader?.student_name || "";
          valB = b.leader?.student_name || "";
          break;
      }

      const comparison = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
      return constSortDirection === "asc" ? comparison : -comparison;
    });
  }, [initialConstituencyRecords, search, vacancyFilter, constSortField, constSortDirection]);

  const handleResetFilters = () => {
    setSearch("");
    setSelectedDistrict("ALL");
    setSelectedCollege("ALL");
    setLeaderFilter("ALL");
    setAsstLeaderFilter("ALL");
    setVacancyFilter("ALL");
  };

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* 3-TIER NAVIGATION TABS */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border pb-1">
        <button
          onClick={() => {
            setActiveTab("orbit");
            setSearch("");
          }}
          className={`px-4 py-2.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "orbit"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Layers className="size-4" />
          <span>Orbit Leaders ({initialOrbitRecords.length} Orbits)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("district");
            setSearch("");
          }}
          className={`px-4 py-2.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "district"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <MapPin className="size-4" />
          <span>District Leaders ({initialDistrictRecords.length} Districts)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("constituency");
            setSearch("");
          }}
          className={`px-4 py-2.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "constituency"
              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Compass className="size-4" />
          <span>Constituency Leaders ({initialConstituencyRecords.length} Malappuram)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* STICKY FLOATING MULTI-FILTER CONTROL BAR */}
      {/* ========================================================================= */}
      <div className="sticky top-16 z-30 pt-1 pb-2 bg-background/95 backdrop-blur-md transition-all">
        <Card className="shadow-md border-border/80 bg-card/95">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder={
                    activeTab === "orbit"
                      ? "Search by Leader Name, CIC No, Orbit Name or ID..."
                      : activeTab === "district"
                      ? "Search by District Name, Leader Name, or CIC..."
                      : "Search by Constituency, Orbit, Leader Name..."
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs sm:text-sm"
                />
              </div>

              {/* Multi-Filters Row */}
              <div className="flex flex-wrap items-center gap-2">
                
                {activeTab === "orbit" ? (
                  <>
                    {/* District Filter */}
                    <div className="flex items-center gap-1.5 min-w-[130px]">
                      <MapPin className="size-3.5 text-muted-foreground shrink-0 hidden sm:block" />
                      <select
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs focus-visible:ring-1 focus-visible:ring-ring"
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
                        className="h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs focus-visible:ring-1 focus-visible:ring-ring"
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
                      className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs"
                    >
                      <option value="ALL">Leaders: All</option>
                      <option value="ASSIGNED">Leaders: Assigned</option>
                      <option value="VACANT">Leaders: Vacant</option>
                    </select>

                    {/* Asst Leader Vacancy Filter */}
                    <select
                      value={asstLeaderFilter}
                      onChange={(e) => setAsstLeaderFilter(e.target.value as any)}
                      className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs"
                    >
                      <option value="ALL">Asst: All</option>
                      <option value="ASSIGNED">Asst: Assigned</option>
                      <option value="VACANT">Asst: Vacant</option>
                    </select>
                  </>
                ) : (
                  <>
                    {/* Vacancy Filter for District & Constituency Tabs */}
                    <select
                      value={vacancyFilter}
                      onChange={(e) => setVacancyFilter(e.target.value as any)}
                      className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs"
                    >
                      <option value="ALL">Status: All</option>
                      <option value="ASSIGNED">Status: Assigned</option>
                      <option value="VACANT">Status: Vacant</option>
                    </select>
                  </>
                )}

                {/* Reset Button */}
                {(search ||
                  selectedDistrict !== "ALL" ||
                  selectedCollege !== "ALL" ||
                  leaderFilter !== "ALL" ||
                  asstLeaderFilter !== "ALL" ||
                  vacancyFilter !== "ALL") && (
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
                <span>
                  Showing{" "}
                  <strong>
                    {activeTab === "orbit"
                      ? processedOrbitRecords.length
                      : activeTab === "district"
                      ? processedDistrictRecords.length
                      : processedConstituencyRecords.length}
                  </strong>{" "}
                  of{" "}
                  <strong>
                    {activeTab === "orbit"
                      ? initialOrbitRecords.length
                      : activeTab === "district"
                      ? initialDistrictRecords.length
                      : initialConstituencyRecords.length}
                  </strong>{" "}
                  delegation units
                </span>
              </div>
              <span className="text-[10px] text-primary font-semibold uppercase">
                ● Live Multi-Tier Leadership Roster
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ORBIT LEADERS TABLE */}
      {/* ========================================================================= */}
      {activeTab === "orbit" && (
        <>
          {processedOrbitRecords.length > 0 ? (
            <Table className="bg-card">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead className="w-48 cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleOrbitSort("orbit_id")}>
                    <div className="flex items-center gap-1">
                      <span>Orbit Domain</span>
                      {renderSortIcon(orbitSortField, "orbit_id", orbitSortDirection)}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleOrbitSort("leader")}>
                    <div className="flex items-center gap-1">
                      <span>Orbit Leader (Primary)</span>
                      {renderSortIcon(orbitSortField, "leader", orbitSortDirection)}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleOrbitSort("asst_leader")}>
                    <div className="flex items-center gap-1">
                      <span>Assistant Leader</span>
                      {renderSortIcon(orbitSortField, "asst_leader", orbitSortDirection)}
                    </div>
                  </TableHead>
                  <TableHead className="text-right w-24">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedOrbitRecords.map((record, index) => {
                  const leader = record.leader;
                  const asst = record.asst_leader;

                  return (
                    <TableRow key={record.orbit_id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs text-muted-foreground text-center">
                        {index + 1}
                      </TableCell>

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

                      {/* Leader */}
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

                      {/* Assistant Leader */}
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

                      {/* View Action */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrbitForModal(record)}
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
                <Layers className="size-10 text-muted-foreground mx-auto" />
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
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DISTRICT LEADERS TABLE */}
      {/* ========================================================================= */}
      {activeTab === "district" && (
        <>
          {processedDistrictRecords.length > 0 ? (
            <Table className="bg-card">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead className="w-56 cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleDistSort("district")}>
                    <div className="flex items-center gap-1">
                      <span>District Domain</span>
                      {renderSortIcon(distSortField, "district", distSortDirection)}
                    </div>
                  </TableHead>
                  <TableHead className="w-36 text-center cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleDistSort("orbit_count")}>
                    <div className="flex items-center justify-center gap-1">
                      <span>Active Orbits</span>
                      {renderSortIcon(distSortField, "orbit_count", distSortDirection)}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleDistSort("leader")}>
                    <div className="flex items-center gap-1">
                      <span>Designated District Leader</span>
                      {renderSortIcon(distSortField, "leader", distSortDirection)}
                    </div>
                  </TableHead>
                  <TableHead className="text-right w-24">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedDistrictRecords.map((record, index) => {
                  const leader = record.leader;

                  return (
                    <TableRow key={record.district} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs text-muted-foreground text-center">
                        {index + 1}
                      </TableCell>

                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                            <MapPin className="size-4 text-primary shrink-0" />
                            <span>{record.district}</span>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {record.state} • {record.student_count} Scholars
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-center font-mono text-xs">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {record.orbit_count} {record.orbit_count === 1 ? "Orbit" : "Orbits"}
                        </Badge>
                      </TableCell>

                      {/* District Leader */}
                      <TableCell>
                        {leader ? (
                          <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/80 space-y-1.5 max-w-md">
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                                <Award className="size-3.5 text-primary shrink-0" />
                                <span>{leader.student_name}</span>
                              </div>
                              <Badge variant="default" className="text-[9px] font-mono">
                                {leader.cicno}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              {leader.orbit_name && (
                                <span className="flex items-center gap-1">
                                  <Layers className="size-3 shrink-0 text-primary" />
                                  <span>{leader.orbit_name}</span>
                                </span>
                              )}
                              {leader.college_name && (
                                <span className="flex items-center gap-1 truncate">
                                  <School className="size-3 shrink-0" />
                                  <span className="truncate">{leader.college_name}</span>
                                </span>
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

                      {/* View Action */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDistrictForModal(record)}
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
                <MapPin className="size-10 text-muted-foreground mx-auto" />
                <div className="font-serif font-semibold text-lg text-foreground">
                  No District Leaders Match Selection
                </div>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  No district leadership records matched your search.
                </p>
                <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CONSTITUENCY LEADERS TABLE */}
      {/* ========================================================================= */}
      {activeTab === "constituency" && (
        <>
          {processedConstituencyRecords.length > 0 ? (
            <Table className="bg-card">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead className="w-56 cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleConstSort("constituency")}>
                    <div className="flex items-center gap-1">
                      <span>Constituency</span>
                      {renderSortIcon(constSortField, "constituency", constSortDirection)}
                    </div>
                  </TableHead>
                  <TableHead className="w-48 cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleConstSort("orbit_name")}>
                    <div className="flex items-center gap-1">
                      <span>Orbit Domain</span>
                      {renderSortIcon(constSortField, "orbit_name", constSortDirection)}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleConstSort("leader")}>
                    <div className="flex items-center gap-1">
                      <span>Designated Constituency Leader</span>
                      {renderSortIcon(constSortField, "leader", constSortDirection)}
                    </div>
                  </TableHead>
                  <TableHead className="text-right w-24">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedConstituencyRecords.map((record, index) => {
                  const leader = record.leader;

                  return (
                    <TableRow key={record.constituency} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs text-muted-foreground text-center">
                        {index + 1}
                      </TableCell>

                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                            <Compass className="size-4 text-primary shrink-0" />
                            <span>{record.constituency}</span>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            Malappuram • {record.student_count} Scholars
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-medium text-xs text-foreground flex items-center gap-1">
                            <Layers className="size-3 text-muted-foreground" />
                            <span>{record.orbit_name}</span>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-mono px-1 py-0">
                            {record.orbit_id}
                          </Badge>
                        </div>
                      </TableCell>

                      {/* Constituency Leader */}
                      <TableCell>
                        {leader ? (
                          <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/80 space-y-1.5 max-w-md">
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                                <Award className="size-3.5 text-primary shrink-0" />
                                <span>{leader.student_name}</span>
                              </div>
                              <Badge variant="default" className="text-[9px] font-mono">
                                {leader.cicno}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              {leader.college_name && (
                                <span className="flex items-center gap-1 truncate">
                                  <School className="size-3 shrink-0" />
                                  <span className="truncate">{leader.college_name}</span>
                                </span>
                              )}
                              {leader.class_name && (
                                <span className="font-mono text-[10px]">
                                  Stage: {formatStudentClass(leader.class_name)}
                                </span>
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

                      {/* View Action */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedConstForModal(record)}
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
                <Compass className="size-10 text-muted-foreground mx-auto" />
                <div className="font-serif font-semibold text-lg text-foreground">
                  No Constituency Leaders Match Selection
                </div>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  No constituency leadership records matched your search.
                </p>
                <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 1. ORBIT LEADERS DETAIL MODAL */}
      {/* ========================================================================= */}
      {selectedOrbitForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-xl shadow-2xl border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <div className="space-y-1">
                <Badge variant="default" className="text-[10px] font-mono">
                  {selectedOrbitForModal.orbit_id}
                </Badge>
                <CardTitle className="text-xl font-serif">
                  {selectedOrbitForModal.orbit_name} Leadership Roster
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedOrbitForModal.district}, {selectedOrbitForModal.state}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedOrbitForModal(null)}
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-4 pt-4 text-xs">
              {/* Leader */}
              <div className="p-3.5 rounded-lg bg-secondary/30 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-serif font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Award className="size-4 text-primary" />
                    <span>Orbit Leader (Primary Officer)</span>
                  </div>
                  {selectedOrbitForModal.leader ? (
                    <Badge variant="default" className="text-[10px] font-mono">
                      {selectedOrbitForModal.leader.cicno}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Vacant</Badge>
                  )}
                </div>

                {selectedOrbitForModal.leader ? (
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-1">
                    <div>
                      <span className="text-[10px] block font-mono uppercase">Full Name</span>
                      <span className="font-semibold text-foreground text-sm">
                        {selectedOrbitForModal.leader.student_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] block font-mono uppercase">College Affiliation</span>
                      <span className="text-foreground">
                        {selectedOrbitForModal.leader.college_name || "College Connected"}
                        {selectedOrbitForModal.leader.affno && ` (${selectedOrbitForModal.leader.affno})`}
                      </span>
                    </div>
                    {selectedOrbitForModal.leader.phone && (
                      <div>
                        <span className="text-[10px] block font-mono uppercase">Phone</span>
                        <span className="text-foreground font-mono">{selectedOrbitForModal.leader.phone}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No student designated as Orbit Leader yet.</p>
                )}
              </div>

              {/* Assistant Leader */}
              <div className="p-3.5 rounded-lg bg-secondary/30 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-serif font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Shield className="size-4 text-secondary-foreground" />
                    <span>Assistant Orbit Leader</span>
                  </div>
                  {selectedOrbitForModal.asst_leader ? (
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {selectedOrbitForModal.asst_leader.cicno}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Vacant</Badge>
                  )}
                </div>

                {selectedOrbitForModal.asst_leader ? (
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-1">
                    <div>
                      <span className="text-[10px] block font-mono uppercase">Full Name</span>
                      <span className="font-semibold text-foreground text-sm">
                        {selectedOrbitForModal.asst_leader.student_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] block font-mono uppercase">College Affiliation</span>
                      <span className="text-foreground">
                        {selectedOrbitForModal.asst_leader.college_name || "College Connected"}
                        {selectedOrbitForModal.asst_leader.affno && ` (${selectedOrbitForModal.asst_leader.affno})`}
                      </span>
                    </div>
                    {selectedOrbitForModal.asst_leader.phone && (
                      <div>
                        <span className="text-[10px] block font-mono uppercase">Phone</span>
                        <span className="text-foreground font-mono">{selectedOrbitForModal.asst_leader.phone}</span>
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
                  onClick={() => setSelectedOrbitForModal(null)}
                  className="text-xs"
                >
                  Close Roster
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DISTRICT LEADER DETAIL MODAL */}
      {/* ========================================================================= */}
      {selectedDistrictForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-xl shadow-2xl border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <div className="space-y-1">
                <Badge variant="default" className="text-[10px] font-mono">
                  {selectedDistrictForModal.district} District
                </Badge>
                <CardTitle className="text-xl font-serif">
                  District Leadership Delegation
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedDistrictForModal.state} • {selectedDistrictForModal.orbit_count} Active Orbits • {selectedDistrictForModal.student_count} Enrolled Scholars
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedDistrictForModal(null)}
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-4 pt-4 text-xs">
              <div className="p-3.5 rounded-lg bg-secondary/30 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-serif font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Award className="size-4 text-primary" />
                    <span>Designated District Leader</span>
                  </div>
                  {selectedDistrictForModal.leader ? (
                    <Badge variant="default" className="text-[10px] font-mono">
                      {selectedDistrictForModal.leader.cicno}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Vacant</Badge>
                  )}
                </div>

                {selectedDistrictForModal.leader ? (
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-1">
                    <div>
                      <span className="text-[10px] block font-mono uppercase">Leader Name</span>
                      <span className="font-semibold text-foreground text-sm">
                        {selectedDistrictForModal.leader.student_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] block font-mono uppercase">Academic Stage</span>
                      <span className="text-foreground">
                        {formatStudentClass(selectedDistrictForModal.leader.class_name || "1")}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] block font-mono uppercase">Orbit Affiliation</span>
                      <span className="text-foreground">
                        {selectedDistrictForModal.leader.orbit_name || selectedDistrictForModal.leader.orbit_id || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] block font-mono uppercase">College Campus</span>
                      <span className="text-foreground">
                        {selectedDistrictForModal.leader.college_name || "—"}
                      </span>
                    </div>
                    {selectedDistrictForModal.leader.phone && (
                      <div>
                        <span className="text-[10px] block font-mono uppercase">Contact</span>
                        <span className="text-foreground font-mono">{selectedDistrictForModal.leader.phone}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No student designated as District Leader yet.</p>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDistrictForModal(null)}
                  className="text-xs"
                >
                  Close Roster
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CONSTITUENCY LEADER DETAIL MODAL */}
      {/* ========================================================================= */}
      {selectedConstForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-xl shadow-2xl border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <div className="space-y-1">
                <Badge variant="default" className="text-[10px] font-mono">
                  {selectedConstForModal.constituency} Constituency
                </Badge>
                <CardTitle className="text-xl font-serif">
                  Malappuram Constituency Leadership
                </CardTitle>
                <CardDescription className="text-xs">
                  Orbit: {selectedConstForModal.orbit_name} ({selectedConstForModal.orbit_id}) • {selectedConstForModal.student_count} Scholars
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedConstForModal(null)}
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-4 pt-4 text-xs">
              <div className="p-3.5 rounded-lg bg-secondary/30 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-serif font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Award className="size-4 text-primary" />
                    <span>Designated Constituency Leader</span>
                  </div>
                  {selectedConstForModal.leader ? (
                    <Badge variant="default" className="text-[10px] font-mono">
                      {selectedConstForModal.leader.cicno}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Vacant</Badge>
                  )}
                </div>

                {selectedConstForModal.leader ? (
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-1">
                    <div>
                      <span className="text-[10px] block font-mono uppercase">Leader Name</span>
                      <span className="font-semibold text-foreground text-sm">
                        {selectedConstForModal.leader.student_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] block font-mono uppercase">Academic Stage</span>
                      <span className="text-foreground">
                        {formatStudentClass(selectedConstForModal.leader.class_name || "1")}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] block font-mono uppercase">Orbit Affiliation</span>
                      <span className="text-foreground">
                        {selectedConstForModal.leader.orbit_name || selectedConstForModal.leader.orbit_id || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] block font-mono uppercase">College Campus</span>
                      <span className="text-foreground">
                        {selectedConstForModal.leader.college_name || "—"}
                      </span>
                    </div>
                    {selectedConstForModal.leader.phone && (
                      <div>
                        <span className="text-[10px] block font-mono uppercase">Contact</span>
                        <span className="text-foreground font-mono">{selectedConstForModal.leader.phone}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No student designated as Constituency Leader yet.</p>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedConstForModal(null)}
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
