"use client";

import { useState, useTransition } from "react";
import {
  Layers,
  Award,
  Shield,
  MapPin,
  Compass,
  Check,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { formatStudentClass } from "@/lib/class-helper";
import {
  assignOrbitLeadershipAction,
  assignDistrictLeaderAction,
  assignConstituencyLeaderAction,
} from "@/app/admin/orbit-leaders/actions";
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

export function OrbitLeadersSettingsClient({
  initialOrbitRecords,
  initialDistrictRecords,
  initialConstituencyRecords,
}: Props) {
  // Navigation Tabs: 'orbit' | 'district' | 'constituency'
  const [activeTab, setActiveTab] = useState<"orbit" | "district" | "constituency">("orbit");

  // State for Orbit Leaders
  const [orbitRecords, setOrbitRecords] = useState<OrbitLeadershipRecord[]>(initialOrbitRecords);
  const [orbitSelections, setOrbitSelections] = useState<
    Record<string, { leader_id: string; asst_id: string; term_year: string }>
  >(() => {
    const initial: Record<string, { leader_id: string; asst_id: string; term_year: string }> = {};
    initialOrbitRecords.forEach((rec) => {
      initial[rec.orbit_id] = {
        leader_id: rec.leader?.cicno || "none",
        asst_id: rec.asst_leader?.cicno || "none",
        term_year: "2025-2026",
      };
    });
    return initial;
  });

  // State for District Leaders
  const [districtRecords, setDistrictRecords] = useState<DistrictLeadershipRecord[]>(initialDistrictRecords);
  const [districtSelections, setDistrictSelections] = useState<
    Record<string, { student_id: string; term_year: string }>
  >(() => {
    const initial: Record<string, { student_id: string; term_year: string }> = {};
    initialDistrictRecords.forEach((rec) => {
      initial[rec.district] = {
        student_id: rec.leader?.cicno || "none",
        term_year: "2025-2026",
      };
    });
    return initial;
  });

  // State for Constituency Leaders
  const [constituencyRecords, setConstituencyRecords] = useState<ConstituencyLeadershipRecord[]>(initialConstituencyRecords);
  const [constituencySelections, setConstituencySelections] = useState<
    Record<string, { student_id: string; term_year: string }>
  >(() => {
    const initial: Record<string, { student_id: string; term_year: string }> = {};
    initialConstituencyRecords.forEach((rec) => {
      initial[rec.constituency] = {
        student_id: rec.leader?.cicno || "none",
        term_year: "2025-2026",
      };
    });
    return initial;
  });

  // Common Search & UI Status
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Orbit Sorting
  const [orbitSortField, setOrbitSortField] = useState<"id" | "name" | "district">("id");
  const [orbitSortDirection, setOrbitSortDirection] = useState<"asc" | "desc">("asc");

  // 1. SAVE ORBIT LEADER
  const handleSaveOrbitLeadership = async (orbit_id: string) => {
    const sel = orbitSelections[orbit_id];
    if (!sel) return;

    setSavingId(orbit_id);
    setNotification(null);

    startTransition(async () => {
      const leaderPromise = assignOrbitLeadershipAction({
        orbit_id,
        student_id: sel.leader_id,
        position: "Leader",
        term_year: sel.term_year,
      });

      const asstPromise = assignOrbitLeadershipAction({
        orbit_id,
        student_id: sel.asst_id,
        position: "Asst Leader",
        term_year: sel.term_year,
      });

      const [res1, res2] = await Promise.all([leaderPromise, asstPromise]);
      setSavingId(null);

      if (res1.success && res2.success) {
        setNotification({
          type: "success",
          text: `Orbit Leaders for ${orbit_id} successfully saved!`,
        });
      } else {
        setNotification({
          type: "error",
          text: res1.error || res2.error || "Failed to update leadership.",
        });
      }
    });
  };

  // 2. SAVE DISTRICT LEADER
  const handleSaveDistrictLeader = async (district: string) => {
    const sel = districtSelections[district];
    if (!sel) return;

    setSavingId(district);
    setNotification(null);

    startTransition(async () => {
      const res = await assignDistrictLeaderAction({
        district,
        student_id: sel.student_id,
        term_year: sel.term_year,
      });
      setSavingId(null);

      if (res.success) {
        setNotification({
          type: "success",
          text: res.message || `District Leader for ${district} saved!`,
        });
      } else {
        setNotification({
          type: "error",
          text: res.error || "Failed to assign District Leader.",
        });
      }
    });
  };

  // 3. SAVE CONSTITUENCY LEADER
  const handleSaveConstituencyLeader = async (constituency: string) => {
    const sel = constituencySelections[constituency];
    if (!sel) return;

    setSavingId(constituency);
    setNotification(null);

    startTransition(async () => {
      const res = await assignConstituencyLeaderAction({
        constituency,
        district: "Malappuram",
        student_id: sel.student_id,
        term_year: sel.term_year,
      });
      setSavingId(null);

      if (res.success) {
        setNotification({
          type: "success",
          text: res.message || `Constituency Leader for ${constituency} saved!`,
        });
      } else {
        setNotification({
          type: "error",
          text: res.error || "Failed to assign Constituency Leader.",
        });
      }
    });
  };

  // Filtered Datasets
  const filteredOrbitRecords = orbitRecords.filter((r) => {
    const q = search.trim().toLowerCase();
    return !q || r.orbit_name.toLowerCase().includes(q) || r.orbit_id.toLowerCase().includes(q) || r.district.toLowerCase().includes(q);
  });

  const filteredDistrictRecords = districtRecords.filter((r) => {
    const q = search.trim().toLowerCase();
    return !q || r.district.toLowerCase().includes(q);
  });

  const filteredConstituencyRecords = constituencyRecords.filter((r) => {
    const q = search.trim().toLowerCase();
    return !q || r.constituency.toLowerCase().includes(q) || r.orbit_name.toLowerCase().includes(q);
  });

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
          <span>1. Orbit Leaders ({orbitRecords.length} Orbits)</span>
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
          <span>2. District Leaders ({districtRecords.length} Districts)</span>
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
          <span>3. Constituency Leaders ({constituencyRecords.length} Malappuram)</span>
        </button>
      </div>

      {/* Notification Alert Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between animate-in fade-in duration-200 ${
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
          <button onClick={() => setNotification(null)} className="text-muted-foreground hover:text-foreground text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder={
            activeTab === "orbit"
              ? "Search by Orbit Name, ID, or District..."
              : activeTab === "district"
              ? "Search Active District..."
              : "Search Malappuram Constituency..."
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-xs sm:text-sm"
        />
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ORBIT LEADERS (Leader & Asst Leader) */}
      {/* ========================================================================= */}
      {activeTab === "orbit" && (
        <Card className="border-border">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-serif flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <span>Orbit Leadership Delegation (Leader & Assistant Leader)</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Dropdown candidate lists display <strong>only registered scholars of that specific Orbit</strong> with stage and campus affiliation.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Orbit Domain</TableHead>
                  <TableHead className="min-w-[260px]">Orbit Leader (Primary)</TableHead>
                  <TableHead className="min-w-[260px]">Assistant Orbit Leader</TableHead>
                  <TableHead className="text-right w-24">Save</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrbitRecords.map((rec) => {
                  const sel = orbitSelections[rec.orbit_id] || {
                    leader_id: "none",
                    asst_id: "none",
                    term_year: "2025-2026",
                  };
                  const isSaving = savingId === rec.orbit_id && isPending;
                  const candidateStudents = rec.orbit_students || [];

                  return (
                    <TableRow key={rec.orbit_id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                            <Layers className="size-3.5 text-primary shrink-0" />
                            <span>{rec.orbit_name}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                            <Badge variant="outline" className="text-[9px] font-mono px-1 py-0">
                              {rec.orbit_id}
                            </Badge>
                            <span>{rec.district}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {candidateStudents.length} members
                          </div>
                        </div>
                      </TableCell>

                      {/* Primary Leader Dropdown */}
                      <TableCell>
                        <select
                          value={sel.leader_id}
                          disabled={isSaving}
                          onChange={(e) =>
                            setOrbitSelections((prev) => ({
                              ...prev,
                              [rec.orbit_id]: { ...sel, leader_id: e.target.value },
                            }))
                          }
                          className="h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-2xs"
                        >
                          <option value="none">-- Select Leader (Vacant) --</option>
                          {candidateStudents.map((s) => {
                            const formattedClass = formatStudentClass(s.class_name);
                            const colName = s.college?.short_name || s.college?.name || s.affno || "";
                            return (
                              <option key={s.cicno} value={s.cicno}>
                                {s.student_name} ({s.cicno}) • {formattedClass} {colName ? `[${colName}]` : ""}
                              </option>
                            );
                          })}
                        </select>
                      </TableCell>

                      {/* Assistant Leader Dropdown */}
                      <TableCell>
                        <select
                          value={sel.asst_id}
                          disabled={isSaving}
                          onChange={(e) =>
                            setOrbitSelections((prev) => ({
                              ...prev,
                              [rec.orbit_id]: { ...sel, asst_id: e.target.value },
                            }))
                          }
                          className="h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-2xs"
                        >
                          <option value="none">-- Select Asst Leader (Vacant) --</option>
                          {candidateStudents.map((s) => {
                            const formattedClass = formatStudentClass(s.class_name);
                            const colName = s.college?.short_name || s.college?.name || s.affno || "";
                            return (
                              <option key={s.cicno} value={s.cicno}>
                                {s.student_name} ({s.cicno}) • {formattedClass} {colName ? `[${colName}]` : ""}
                              </option>
                            );
                          })}
                        </select>
                      </TableCell>

                      {/* Save Action */}
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleSaveOrbitLeadership(rec.orbit_id)}
                          disabled={isSaving}
                          className="h-8 text-xs gap-1"
                        >
                          {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                          <span>Save</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DISTRICT LEADERS (1 Leader per Active District) */}
      {/* ========================================================================= */}
      {activeTab === "district" && (
        <Card className="border-border">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-serif flex items-center gap-2">
              <MapPin className="size-4 text-primary" />
              <span>District Leaders Delegation (1 Designated Scholar per Active District)</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Candidate dropdown lists <strong>all scholars enrolled across active Orbits in that District</strong>. Role will be updated to <code>district_leader</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">District</TableHead>
                  <TableHead className="w-32 text-center">Active Orbits</TableHead>
                  <TableHead className="min-w-[320px]">Designated District Leader</TableHead>
                  <TableHead className="text-right w-24">Save</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDistrictRecords.map((rec) => {
                  const sel = districtSelections[rec.district] || {
                    student_id: "none",
                    term_year: "2025-2026",
                  };
                  const isSaving = savingId === rec.district && isPending;
                  const candidateStudents = rec.eligible_students || [];

                  return (
                    <TableRow key={rec.district} className="hover:bg-muted/20">
                      
                      {/* District Info */}
                      <TableCell>
                        <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                          <MapPin className="size-4 text-primary shrink-0" />
                          <span>{rec.district}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {rec.state} • {candidateStudents.length} Scholars
                        </span>
                      </TableCell>

                      {/* Orbits Count */}
                      <TableCell className="text-center font-mono text-xs">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {rec.orbit_count} {rec.orbit_count === 1 ? "Orbit" : "Orbits"}
                        </Badge>
                      </TableCell>

                      {/* District Leader Dropdown */}
                      <TableCell>
                        <select
                          value={sel.student_id}
                          disabled={isSaving}
                          onChange={(e) =>
                            setDistrictSelections((prev) => ({
                              ...prev,
                              [rec.district]: { ...sel, student_id: e.target.value },
                            }))
                          }
                          className="h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-2xs font-medium"
                        >
                          <option value="none">-- Select District Leader (Vacant) --</option>
                          {candidateStudents.map((s) => {
                            const formattedClass = formatStudentClass(s.class_name);
                            const colName = s.college?.short_name || s.college?.name || s.affno || "";
                            const orbName = s.orbit ? s.orbit.name : s.orbit_id || "";
                            return (
                              <option key={s.cicno} value={s.cicno}>
                                {s.student_name} ({s.cicno}) • {formattedClass} {orbName ? `[${orbName}]` : ""} {colName ? `(${colName})` : ""}
                              </option>
                            );
                          })}
                        </select>
                      </TableCell>

                      {/* Save Action */}
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleSaveDistrictLeader(rec.district)}
                          disabled={isSaving}
                          className="h-8 text-xs gap-1"
                        >
                          {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                          <span>Save</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CONSTITUENCY LEADERS (1 Leader per Malappuram Constituency) */}
      {/* ========================================================================= */}
      {activeTab === "constituency" && (
        <Card className="border-border">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-serif flex items-center gap-2">
              <Compass className="size-4 text-primary" />
              <span>Malappuram Constituency Leaders Delegation (1 Leader per Constituency)</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Candidate dropdown lists <strong>scholars belonging to Orbits within that specific Constituency</strong>. Role will be updated to <code>constituency_leader</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-56">Constituency & Orbit</TableHead>
                  <TableHead className="min-w-[320px]">Designated Constituency Leader</TableHead>
                  <TableHead className="text-right w-24">Save</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConstituencyRecords.map((rec) => {
                  const sel = constituencySelections[rec.constituency] || {
                    student_id: "none",
                    term_year: "2025-2026",
                  };
                  const isSaving = savingId === rec.constituency && isPending;
                  const candidateStudents = rec.eligible_students || [];

                  return (
                    <TableRow key={rec.constituency} className="hover:bg-muted/20">
                      
                      {/* Constituency & Orbit Info */}
                      <TableCell>
                        <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                          <Compass className="size-4 text-primary shrink-0" />
                          <span>{rec.constituency}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                          <Layers className="size-3" />
                          <span>Orbit: {rec.orbit_name}</span>
                          <Badge variant="outline" className="text-[9px] font-mono px-1 py-0">
                            {rec.orbit_id}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {candidateStudents.length} candidate scholars
                        </span>
                      </TableCell>

                      {/* Constituency Leader Dropdown */}
                      <TableCell>
                        <select
                          value={sel.student_id}
                          disabled={isSaving}
                          onChange={(e) =>
                            setConstituencySelections((prev) => ({
                              ...prev,
                              [rec.constituency]: { ...sel, student_id: e.target.value },
                            }))
                          }
                          className="h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-2xs font-medium"
                        >
                          <option value="none">-- Select Constituency Leader (Vacant) --</option>
                          {candidateStudents.map((s) => {
                            const formattedClass = formatStudentClass(s.class_name);
                            const colName = s.college?.short_name || s.college?.name || s.affno || "";
                            return (
                              <option key={s.cicno} value={s.cicno}>
                                {s.student_name} ({s.cicno}) • {formattedClass} {colName ? `[${colName}]` : ""}
                              </option>
                            );
                          })}
                        </select>
                      </TableCell>

                      {/* Save Action */}
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleSaveConstituencyLeader(rec.constituency)}
                          disabled={isSaving}
                          className="h-8 text-xs gap-1"
                        >
                          {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                          <span>Save</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
