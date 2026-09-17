"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Award,
  Shield,
  Layers,
  MapPin,
  Compass,
  School,
  Info,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserX,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatStudentClass } from "@/lib/class-helper";
import type {
  OrbitLeadershipRecord,
  DistrictLeadershipRecord,
  ConstituencyLeadershipRecord,
} from "@/types/database.types";

interface Props {
  initialOrbitRecords: OrbitLeadershipRecord[];
  initialDistrictRecords: DistrictLeadershipRecord[];
  initialConstituencyRecords: ConstituencyLeadershipRecord[];
}

type OrbitSortField = "orbit_id" | "orbit_name" | "district" | "leader" | "asst_leader";
type DistrictSortField = "district" | "orbit_count" | "student_count" | "leader";
type ConstSortField = "constituency" | "orbit_name" | "student_count" | "leader";

export function LeaderTableClient({
  initialOrbitRecords,
  initialDistrictRecords,
  initialConstituencyRecords,
}: Props) {
  const [activeTab, setActiveTab] = useState<"orbit" | "district" | "constituency">("orbit");
  const [search, setSearch] = useState("");

  // Sorting States
  const [orbitSortField, setOrbitSortField] = useState<OrbitSortField>("orbit_id");
  const [orbitSortDirection, setOrbitSortDirection] = useState<"asc" | "desc">("asc");

  const [distSortField, setDistSortField] = useState<DistrictSortField>("district");
  const [distSortDirection, setDistSortDirection] = useState<"asc" | "desc">("asc");

  const [constSortField, setConstSortField] = useState<ConstSortField>("constituency");
  const [constSortDirection, setConstSortDirection] = useState<"asc" | "desc">("asc");

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

  // 1. Orbit Records
  const processedOrbitRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = initialOrbitRecords.filter((rec) => {
      const orbId = (rec.orbit_id || "").toLowerCase();
      const orbName = (rec.orbit_name || "").toLowerCase();
      const dist = (rec.district || "").toLowerCase();
      const lName = (rec.leader?.student_name || "").toLowerCase();
      const lCic = (rec.leader?.cicno || "").toLowerCase();
      const alName = (rec.asst_leader?.student_name || "").toLowerCase();
      const alCic = (rec.asst_leader?.cicno || "").toLowerCase();

      return (
        !q ||
        orbName.includes(q) ||
        orbId.includes(q) ||
        dist.includes(q) ||
        lName.includes(q) ||
        lCic.includes(q) ||
        alName.includes(q) ||
        alCic.includes(q)
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
  }, [initialOrbitRecords, search, orbitSortField, orbitSortDirection]);

  // 2. District Records
  const processedDistrictRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = initialDistrictRecords.filter((rec) => {
      const dist = (rec.district || "").toLowerCase();
      const lName = (rec.leader?.student_name || "").toLowerCase();
      const lCic = (rec.leader?.cicno || "").toLowerCase();
      return !q || dist.includes(q) || lName.includes(q) || lCic.includes(q);
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
  }, [initialDistrictRecords, search, distSortField, distSortDirection]);

  // 3. Constituency Records
  const processedConstituencyRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = initialConstituencyRecords.filter((rec) => {
      const constName = (rec.constituency || "").toLowerCase();
      const orbName = (rec.orbit_name || "").toLowerCase();
      const lName = (rec.leader?.student_name || "").toLowerCase();
      const lCic = (rec.leader?.cicno || "").toLowerCase();

      return (
        !q ||
        constName.includes(q) ||
        orbName.includes(q) ||
        lName.includes(q) ||
        lCic.includes(q)
      );
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
  }, [initialConstituencyRecords, search, constSortField, constSortDirection]);

  return (
    <div className="space-y-6">
      
      {/* 3-Tier Public Navigation Tabs */}
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
          <span>Orbit Leaders ({initialOrbitRecords.length})</span>
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
          <span>District Leaders ({initialDistrictRecords.length})</span>
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

      {/* Search Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder={
              activeTab === "orbit"
                ? "Search by Leader Name, CIC, Orbit..."
                : activeTab === "district"
                ? "Search by District, Leader Name..."
                : "Search by Constituency, Orbit..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs sm:text-sm"
          />
        </div>
        <div className="text-xs text-muted-foreground font-mono self-start sm:self-center">
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
          leaders
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ORBIT LEADERS */}
      {/* ========================================================================= */}
      {activeTab === "orbit" && (
        <>
          {processedOrbitRecords.length > 0 ? (
            <Table className="bg-card">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead className="w-52 cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleOrbitSort("orbit_id")}>
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

                      {/* Primary Leader */}
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
                              <span className="truncate">{leader.college_name || "Affiliated Campus"}</span>
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
                              <span className="truncate">{asst.college_name || "Affiliated Campus"}</span>
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-12 text-center space-y-3 bg-card">
              <div className="size-10 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                <Info className="size-5" />
              </div>
              <h3 className="font-serif font-semibold text-base text-foreground">
                No Orbit Leaders Match Selection
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Try adjusting your search criteria.
              </p>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DISTRICT LEADERS */}
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
                            {record.state} • {record.student_count} Enrolled Scholars
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-12 text-center space-y-3 bg-card">
              <div className="size-10 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                <Info className="size-5" />
              </div>
              <h3 className="font-serif font-semibold text-base text-foreground">
                No District Leaders Match Selection
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Try adjusting your search criteria.
              </p>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CONSTITUENCY LEADERS */}
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-12 text-center space-y-3 bg-card">
              <div className="size-10 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                <Info className="size-5" />
              </div>
              <h3 className="font-serif font-semibold text-base text-foreground">
                No Constituency Leaders Match Selection
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Try adjusting your search criteria.
              </p>
            </div>
          )}
        </>
      )}

    </div>
  );
}
