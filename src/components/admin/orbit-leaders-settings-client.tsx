"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  Shield,
  School,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Filter,
  UserCheck,
  UserX,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatStudentClass } from "@/lib/class-helper";
import {
  assignOrbitLeadershipAction,
  removeOrbitLeadershipAction,
} from "@/app/admin/orbit-leaders/actions";
import type { OrbitLeadershipRecord, Student } from "@/types/database.types";

interface Props {
  initialRecords: OrbitLeadershipRecord[];
}

type SortField = "orbit_id" | "orbit_name" | "leader" | "asst_leader";

export function OrbitLeadersSettingsClient({ initialRecords }: Props) {
  const router = useRouter();
  const [filterMode, setFilterMode] = useState<"ALL" | "BLANK_ANY" | "FILLED_BOTH">("ALL");
  const [isPending, startTransition] = useTransition();

  // Sorting State - Default: Ascending by orbit_id
  const [sortField, setSortField] = useState<SortField>("orbit_id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Banner Feedback
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Active Orbit Being Modified
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter & Sort Records
  const sortedAndFilteredRecords = useMemo(() => {
    const filtered = initialRecords.filter((rec) => {
      const hasLeader = !!rec.leader;
      const hasAsst = !!rec.asst_leader;

      if (filterMode === "BLANK_ANY") {
        return !hasLeader || !hasAsst;
      }
      if (filterMode === "FILLED_BOTH") {
        return hasLeader && hasAsst;
      }
      return true;
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
  }, [initialRecords, filterMode, sortField, sortDirection]);

  // Handle Leader Change
  const handleLeaderChange = (
    orbitId: string,
    studentCic: string,
    position: "Leader" | "Asst Leader"
  ) => {
    setFeedback(null);
    setUpdatingKey(`${orbitId}-${position}`);

    startTransition(async () => {
      const res = await assignOrbitLeadershipAction({
        orbit_id: orbitId,
        student_id: studentCic,
        position: position,
      });

      if (res.success) {
        setFeedback({
          type: "success",
          message: res.message || `${position} updated for Orbit ${orbitId}.`,
        });
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          message: res.error || `Failed to update ${position}.`,
        });
      }
      setUpdatingKey(null);
    });
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

  return (
    <div className="space-y-6">
      
      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 text-xs sm:text-sm border transition-all ${
            feedback.type === "success"
              ? "bg-primary/10 border-primary/30 text-foreground"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
          )}
          <div className="leading-relaxed">{feedback.message}</div>
        </div>
      )}

      {/* Top Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setFilterMode("ALL")}
            className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              filterMode === "ALL"
                ? "bg-secondary text-secondary-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            All Orbits ({initialRecords.length})
          </button>
          <button
            onClick={() => setFilterMode("BLANK_ANY")}
            className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
              filterMode === "BLANK_ANY"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <span>Blank Leaders / Asst-Leaders</span>
            <Badge variant="secondary" className="text-[10px] px-1 py-0 font-mono">
              {initialRecords.filter((r) => !r.leader || !r.asst_leader).length}
            </Badge>
          </button>
          <button
            onClick={() => setFilterMode("FILLED_BOTH")}
            className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              filterMode === "FILLED_BOTH"
                ? "bg-secondary text-secondary-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Fully Appointed ({initialRecords.filter((r) => r.leader && r.asst_leader).length})
          </button>
        </div>

        <div className="text-xs text-muted-foreground font-mono self-start sm:self-center">
          Showing <strong>{sortedAndFilteredRecords.length}</strong> orbits in matrix (Sorted by {sortField} {sortDirection.toUpperCase()})
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LEADERSHIP APPOINTMENTS MATRIX TABLE */}
      {/* ========================================================================= */}
      {sortedAndFilteredRecords.length > 0 ? (
        <Table className="bg-card">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead className="w-32 cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("orbit_id")}>
                <div className="flex items-center gap-1">
                  <span>Orbit ID</span>
                  {renderSortIcon("orbit_id")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("orbit_name")}>
                <div className="flex items-center gap-1">
                  <span>Orbit Domain</span>
                  {renderSortIcon("orbit_name")}
                </div>
              </TableHead>
              <TableHead className="min-w-[300px] cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("leader")}>
                <div className="flex items-center gap-1">
                  <span>Orbit Leader Appointment</span>
                  {renderSortIcon("leader")}
                </div>
              </TableHead>
              <TableHead className="min-w-[300px] cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("asst_leader")}>
                <div className="flex items-center gap-1">
                  <span>Assistant Leader Appointment</span>
                  {renderSortIcon("asst_leader")}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredRecords.map((rec, idx) => {
              const orbId = rec.orbit_id;
              const orbName = rec.orbit_name;
              const leader = rec.leader;
              const asst = rec.asst_leader;
              const orbitStudents = rec.orbit_students || [];

              const isUpdatingLeader = updatingKey === `${orbId}-Leader`;
              const isUpdatingAsst = updatingKey === `${orbId}-Asst Leader`;

              // Find currently selected student objects for display
              const currentLeaderCic = leader?.cicno || "none";
              const currentAsstCic = asst?.cicno || "none";

              return (
                <TableRow key={orbId} className="hover:bg-muted/30">
                  
                  {/* Sl No */}
                  <TableCell className="text-center font-mono text-xs text-muted-foreground">
                    {idx + 1}
                  </TableCell>

                  {/* Orbit ID */}
                  <TableCell className="font-mono text-xs font-bold text-primary">
                    {orbId}
                  </TableCell>

                  {/* Orbit Name */}
                  <TableCell>
                    <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <Layers className="size-4 text-muted-foreground shrink-0" />
                      <span>{orbName}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      {orbitStudents.length} registered {orbitStudents.length === 1 ? "member" : "members"}
                    </div>
                  </TableCell>

                  {/* Leader Appointment Column */}
                  <TableCell>
                    <div className="space-y-2 p-2.5 rounded-md bg-muted/20 border border-border/60">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase font-mono text-foreground font-bold flex items-center gap-1">
                          <Award className="size-3 text-primary" />
                          Select Leader:
                        </label>
                        {isUpdatingLeader && <Loader2 className="size-3 animate-spin text-primary" />}
                      </div>

                      <select
                        value={currentLeaderCic}
                        onChange={(e) => handleLeaderChange(orbId, e.target.value, "Leader")}
                        disabled={isPending || orbitStudents.length === 0}
                        className="h-9 w-full rounded border border-input bg-background px-2 text-xs text-foreground shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring font-mono"
                      >
                        <option value="none">-- Vacant (Select Orbit Member) --</option>
                        {orbitStudents.map((s: Student) => {
                          const colAff = s.affno || (s.college ? s.college.short_name || s.college.name : "");
                          const classLabel = formatStudentClass(s.class_name);
                          return (
                            <option key={s.cicno} value={s.cicno}>
                              {s.student_name} ({s.cicno}) • {classLabel} {colAff ? `[${colAff}]` : ""}
                            </option>
                          );
                        })}
                      </select>

                      {/* Auto-filled College Info for Leader */}
                      {leader ? (
                        <div className="p-2 rounded bg-secondary/40 border border-border/50 text-[11px] space-y-0.5 animate-in fade-in">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <School className="size-3 text-primary shrink-0" />
                            <span className="font-mono text-[10px] text-muted-foreground font-bold">COLLEGE ID:</span>
                            <span className="font-mono text-foreground font-semibold">
                              {leader.affno || "—"}
                            </span>
                          </div>
                          <div className="text-foreground font-medium pl-4 truncate max-w-[280px]">
                            {leader.college_name || "College Connected"}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground italic pl-1">
                          {orbitStudents.length === 0
                            ? "No students assigned to this orbit."
                            : "No Leader selected yet."}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Asst Leader Appointment Column */}
                  <TableCell>
                    <div className="space-y-2 p-2.5 rounded-md bg-muted/20 border border-border/60">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase font-mono text-foreground font-bold flex items-center gap-1">
                          <Shield className="size-3 text-secondary-foreground" />
                          Select Asst Leader:
                        </label>
                        {isUpdatingAsst && <Loader2 className="size-3 animate-spin text-primary" />}
                      </div>

                      <select
                        value={currentAsstCic}
                        onChange={(e) => handleLeaderChange(orbId, e.target.value, "Asst Leader")}
                        disabled={isPending || orbitStudents.length === 0}
                        className="h-9 w-full rounded border border-input bg-background px-2 text-xs text-foreground shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring font-mono"
                      >
                        <option value="none">-- Vacant (Select Orbit Member) --</option>
                        {orbitStudents.map((s: Student) => {
                          const colAff = s.affno || (s.college ? s.college.short_name || s.college.name : "");
                          const classLabel = formatStudentClass(s.class_name);
                          return (
                            <option key={s.cicno} value={s.cicno}>
                              {s.student_name} ({s.cicno}) • {classLabel} {colAff ? `[${colAff}]` : ""}
                            </option>
                          );
                        })}
                      </select>

                      {/* Auto-filled College Info for Asst Leader */}
                      {asst ? (
                        <div className="p-2 rounded bg-secondary/40 border border-border/50 text-[11px] space-y-0.5 animate-in fade-in">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <School className="size-3 text-secondary-foreground shrink-0" />
                            <span className="font-mono text-[10px] text-muted-foreground font-bold">COLLEGE ID:</span>
                            <span className="font-mono text-foreground font-semibold">
                              {asst.affno || "—"}
                            </span>
                          </div>
                          <div className="text-foreground font-medium pl-4 truncate max-w-[280px]">
                            {asst.college_name || "College Connected"}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground italic pl-1">
                          {orbitStudents.length === 0
                            ? "No students assigned to this orbit."
                            : "No Assistant Leader selected yet."}
                        </div>
                      )}
                    </div>
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
              No Orbits Match Selected Filter
            </div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Change the filter mode above to view active orbits.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterMode("ALL")}
              className="text-xs"
            >
              Show All Orbits
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
