"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  UserX,
  FileDown,
  Printer,
  Search,
  School,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  ChevronsUpDown,
  GraduationCap,
  MapPin,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { CollegeUnassignedGroup } from "@/types/database.types";
import { formatStudentClass } from "@/lib/class-helper";
import { downloadUnassignedStudentsPDF } from "@/lib/pdf/unassigned-students-pdf";
import { getUnassignedStudentsAction } from "@/app/admin/dashboard/actions";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialGroups: CollegeUnassignedGroup[];
  initialTotalUnassigned: number;
  initialTotalColleges: number;
}

export function UnassignedStudentsModal({
  isOpen,
  onClose,
  initialGroups,
  initialTotalUnassigned,
  initialTotalColleges,
}: Props) {
  const [groups, setGroups] = useState<CollegeUnassignedGroup[]>(initialGroups);
  const [totalUnassigned, setTotalUnassigned] = useState<number>(initialTotalUnassigned);
  const [totalColleges, setTotalColleges] = useState<number>(initialTotalColleges);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState<string>("ALL");
  const [collapsedColleges, setCollapsedColleges] = useState<Set<string>>(new Set());

  const [isDownloading, setIsDownloading] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();

  // Reset or reload when refreshed
  const handleRefresh = () => {
    startRefresh(async () => {
      const res = await getUnassignedStudentsAction();
      if (res.success) {
        setGroups(res.groups);
        setTotalUnassigned(res.totalUnassigned);
        setTotalColleges(res.totalColleges);
      }
    });
  };

  // Toggle Collapse for a single college
  const toggleCollapse = (affno: string) => {
    setCollapsedColleges((prev) => {
      const next = new Set(prev);
      if (next.has(affno)) {
        next.delete(affno);
      } else {
        next.add(affno);
      }
      return next;
    });
  };

  // Collapse All / Expand All
  const collapseAll = () => {
    setCollapsedColleges(new Set(groups.map((g) => g.affno)));
  };

  const expandAll = () => {
    setCollapsedColleges(new Set());
  };

  // Filter groups and students according to search query and college filter
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return groups
      .filter((grp) => {
        if (selectedCollegeFilter === "ALL") return true;
        return grp.affno === selectedCollegeFilter;
      })
      .map((grp) => {
        const matchingStudents = grp.students.filter((s) => {
          if (!q) return true;
          const name = (s.student_name || "").toLowerCase();
          const cic = (s.cicno || "").toLowerCase();
          const cls = formatStudentClass(s.class_name).toLowerCase();
          const place = (s.place || "").toLowerCase();
          const colName = grp.collegeName.toLowerCase();
          const aff = grp.affno.toLowerCase();

          return (
            name.includes(q) ||
            cic.includes(q) ||
            cls.includes(q) ||
            place.includes(q) ||
            colName.includes(q) ||
            aff.includes(q)
          );
        });

        return {
          ...grp,
          students: matchingStudents,
          studentCount: matchingStudents.length,
        };
      })
      .filter((grp) => grp.students.length > 0);
  }, [groups, searchQuery, selectedCollegeFilter]);

  const currentlyShowingCount = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.students.length, 0);
  }, [filteredGroups]);

  // Handle PDF Download
  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      // Use currently filtered groups if search active, or full groups if no filter
      const targetGroups = searchQuery || selectedCollegeFilter !== "ALL" ? filteredGroups : groups;
      const targetUnassigned =
        searchQuery || selectedCollegeFilter !== "ALL" ? currentlyShowingCount : totalUnassigned;
      const targetColleges = targetGroups.length;

      await downloadUnassignedStudentsPDF({
        groups: targetGroups,
        totalUnassigned: targetUnassigned,
        totalColleges: targetColleges,
      });
    } catch (err) {
      console.error("Error generating PDF:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Native Print Trigger
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-card border border-border shadow-2xl rounded-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* ========================================================================= */}
        {/* MODAL HEADER */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <UserX className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-[10px] font-mono uppercase bg-amber-500 text-white">
                  Awaiting Orbit Placement
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">College Directory Order</span>
              </div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-foreground mt-0.5">
                Unassigned Scholars Directory
              </h2>
              <p className="text-xs text-muted-foreground">
                Scholars currently without an active Orbit allocation, organized alphabetically by campus.
              </p>
            </div>
          </div>

          {/* Action Buttons: Download PDF, Print, Refresh & Close */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Prominent PDF Download Button */}
            <Button
              onClick={handleDownloadPDF}
              disabled={isDownloading || groups.length === 0}
              variant="default"
              size="sm"
              className="gap-2 font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs text-xs h-9 cursor-pointer"
            >
              <FileDown className="size-4" />
              <span>{isDownloading ? "Generating PDF..." : "Download PDF"}</span>
            </Button>

            {/* Quick Print Button */}
            <Button
              onClick={handlePrint}
              variant="outline"
              size="icon"
              title="Print Document"
              className="size-9 shrink-0 cursor-pointer"
            >
              <Printer className="size-4" />
            </Button>

            {/* Live Refresh Button */}
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="icon"
              title="Refresh Roster Data"
              className="size-9 shrink-0 cursor-pointer"
            >
              <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>

            {/* Close Modal Button */}
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KPI OVERVIEW & SEARCH CONTROLS */}
        {/* ========================================================================= */}
        <div className="p-3 sm:p-4 border-b border-border bg-muted/20 space-y-3">
          
          {/* 3 Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-lg bg-card border border-border">
              <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                Total Unassigned
              </span>
              <div className="text-xl font-serif font-bold text-amber-600 dark:text-amber-400">
                {totalUnassigned.toLocaleString()}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border">
              <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                Colleges Affected
              </span>
              <div className="text-xl font-serif font-bold text-foreground">
                {totalColleges.toLocaleString()}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border">
              <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                Currently Filtered
              </span>
              <div className="text-xl font-serif font-bold text-primary">
                {currentlyShowingCount.toLocaleString()}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border">
              <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                Average / College
              </span>
              <div className="text-xl font-serif font-bold text-foreground">
                {totalColleges > 0 ? (totalUnassigned / totalColleges).toFixed(1) : "0"}
              </div>
            </div>
          </div>

          {/* Search Bar & College Filter & Toggle Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by scholar name, CIC number, place, or college..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* College Filter Select */}
              <select
                value={selectedCollegeFilter}
                onChange={(e) => setSelectedCollegeFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-xs font-mono shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="ALL">All Colleges ({groups.length})</option>
                {groups.map((grp) => (
                  <option key={grp.affno} value={grp.affno}>
                    {grp.collegeName.slice(0, 32)} ({grp.studentCount})
                  </option>
                ))}
              </select>

              {/* Expand / Collapse All */}
              <div className="flex items-center gap-1 border border-border rounded-md p-0.5 bg-background">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={expandAll}
                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  title="Expand All Colleges"
                >
                  Expand All
                </Button>
                <span className="text-muted-foreground/30">|</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={collapseAll}
                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  title="Collapse All Colleges"
                >
                  Collapse All
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLLEGE ORDER LIST BODY */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredGroups.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border rounded-xl space-y-3">
              <div className="size-12 rounded-full bg-muted mx-auto flex items-center justify-center text-muted-foreground">
                <CheckCircle2 className="size-6 text-emerald-500" />
              </div>
              <h3 className="font-serif font-bold text-foreground text-base">
                {totalUnassigned === 0
                  ? "All scholars are allocated to an Orbit!"
                  : "No unassigned scholars match your search."}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {totalUnassigned === 0
                  ? "Every enrolled scholar in the registry has been assigned to an active institutional orbit jurisdiction."
                  : "Try clearing your search query or switching your college filter to view all records."}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCollegeFilter("ALL");
                  }}
                  className="text-xs"
                >
                  Reset Search Filter
                </Button>
              )}
            </div>
          ) : (
            filteredGroups.map((group, gIdx) => {
              const isCollapsed = collapsedColleges.has(group.affno);

              return (
                <div
                  key={group.affno}
                  className="border border-border rounded-xl overflow-hidden bg-card shadow-xs transition-colors hover:border-primary/30"
                >
                  {/* College Header Banner */}
                  <div
                    onClick={() => toggleCollapse(group.affno)}
                    className="p-3 sm:p-3.5 bg-secondary/40 hover:bg-secondary/60 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                        <School className="size-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {gIdx + 1}. {group.collegeName}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            AFF: {group.affno}
                          </Badge>
                        </div>
                        {(group.place || group.district) && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                            <MapPin className="size-3" />
                            <span>
                              {[group.place, group.district].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-center">
                      <Badge
                        variant="secondary"
                        className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-mono font-semibold"
                      >
                        {group.studentCount} Unassigned
                      </Badge>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground p-1"
                        aria-label={isCollapsed ? "Expand" : "Collapse"}
                      >
                        {isCollapsed ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronUp className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Table with Students */}
                  {!isCollapsed && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted/50 border-b border-border text-muted-foreground font-mono uppercase text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3 w-12 text-center">#</th>
                            <th className="py-2.5 px-3 w-28">CIC No</th>
                            <th className="py-2.5 px-3">Scholar Name</th>
                            <th className="py-2.5 px-3">Class / Stage</th>
                            <th className="py-2.5 px-3">Place / Hometown</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {group.students.map((student, sIdx) => (
                            <tr
                              key={student.cicno || sIdx}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <td className="py-2.5 px-3 text-center text-muted-foreground font-mono text-[11px]">
                                {sIdx + 1}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-semibold text-foreground">
                                <Badge variant="outline" className="font-mono text-[11px]">
                                  {student.cicno}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-3 font-medium text-foreground">
                                {student.student_name}
                              </td>
                              <td className="py-2.5 px-3 text-muted-foreground">
                                <Badge variant="secondary" className="text-[10px]">
                                  {formatStudentClass(student.class_name)}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-3 text-muted-foreground">
                                {student.place || group.place || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER */}
        {/* ========================================================================= */}
        <div className="p-3 sm:p-4 border-t border-border bg-secondary/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground text-center sm:text-left">
            Showing <strong className="text-foreground">{currentlyShowingCount}</strong> of{" "}
            <strong className="text-foreground">{totalUnassigned}</strong> unassigned scholars across{" "}
            <strong className="text-foreground">{filteredGroups.length}</strong> colleges.
          </div>

          <div className="flex items-center gap-2">
            <Link href="/admin/students/settings">
              <Button size="sm" variant="outline" className="text-xs gap-1.5 h-8">
                <span>Allocate Scholars in Settings</span>
                <ExternalLink className="size-3" />
              </Button>
            </Link>
            <Button
              size="sm"
              variant="default"
              onClick={handleDownloadPDF}
              disabled={isDownloading || groups.length === 0}
              className="text-xs gap-1.5 h-8 bg-primary hover:bg-primary/90 cursor-pointer"
            >
              <FileDown className="size-3.5" />
              <span>{isDownloading ? "Generating..." : "Download PDF"}</span>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
