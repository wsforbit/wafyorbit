"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  School,
  MapPin,
  Mail,
  Users,
  Award,
  Eye,
  X,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { College } from "@/types/database.types";

interface Props {
  initialColleges: College[];
}

type SortField = "affno" | "name" | "short_name" | "place" | "student_count" | "leader_count";

export function CollegeListClient({ initialColleges }: Props) {
  const [search, setSearch] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [sortField, setSortField] = useState<SortField>("affno");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Modal State for viewing college full details
  const [selectedCollegeForModal, setSelectedCollegeForModal] = useState<College | null>(null);

  // Extract unique Districts dynamically
  const uniqueDistricts = useMemo(() => {
    const districts = Array.from(
      new Set(initialColleges.map((c) => c.district || c.place).filter(Boolean))
    );
    return districts.sort();
  }, [initialColleges]);

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

  // Filtered & Sorted Colleges Logic
  const processedColleges = useMemo(() => {
    const filtered = initialColleges.filter((college) => {
      const q = search.trim().toLowerCase();
      const aff = college.affno || college.id || "";
      const matchesSearch =
        !q ||
        college.name.toLowerCase().includes(q) ||
        aff.toLowerCase().includes(q) ||
        (college.short_name && college.short_name.toLowerCase().includes(q)) ||
        college.place.toLowerCase().includes(q);

      const collegeDist = college.district || college.place;
      const matchesDistrict =
        selectedDistrict === "ALL" || collegeDist === selectedDistrict;

      return matchesSearch && matchesDistrict;
    });

    return filtered.sort((a, b) => {
      if (sortField === "student_count") {
        const numA = a.student_count ?? 0;
        const numB = b.student_count ?? 0;
        return sortDirection === "asc" ? numA - numB : numB - numA;
      }
      if (sortField === "leader_count") {
        const numA = a.leader_count ?? 0;
        const numB = b.leader_count ?? 0;
        return sortDirection === "asc" ? numA - numB : numB - numA;
      }

      let valA = "";
      let valB = "";

      switch (sortField) {
        case "affno":
          valA = a.affno || a.id || "";
          valB = b.affno || b.id || "";
          break;
        case "name":
          valA = a.name || "";
          valB = b.name || "";
          break;
        case "short_name":
          valA = a.short_name || "";
          valB = b.short_name || "";
          break;
        case "place":
          valA = a.place || "";
          valB = b.place || "";
          break;
      }

      const comparison = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [initialColleges, search, selectedDistrict, sortField, sortDirection]);

  const handleResetFilters = () => {
    setSearch("");
    setSelectedDistrict("ALL");
    setSortField("affno");
    setSortDirection("asc");
  };

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* STICKY FLOATING FILTER CARD */}
      {/* ========================================================================= */}
      <div className="sticky top-16 z-30 pt-2 pb-3 bg-background/95 backdrop-blur-md transition-all">
        <Card className="shadow-md border-border/80 bg-card/95">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              
              {/* Search by College Name or Affiliation No */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by College Name, Short Code, or Affiliation No..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs sm:text-sm"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              {/* District Filter Dropdown */}
              <div className="w-full sm:w-64 shrink-0">
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="ALL">All Districts ({uniqueDistricts.length})</option>
                  {uniqueDistricts.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Filter Button */}
              {(search || selectedDistrict !== "ALL" || sortField !== "affno" || sortDirection !== "asc") && (
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

            {/* Results Count Bar */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border text-[11px] font-mono text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Filter className="size-3 text-primary" />
                <span>Showing <strong>{processedColleges.length}</strong> of <strong>{initialColleges.length}</strong> colleges (Sorted by <strong>{sortField}</strong> {sortDirection.toUpperCase()})</span>
              </div>
              <span className="text-[10px] text-primary font-semibold uppercase">
                ● Live Campus Directory
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* COLLEGE TABLE LIST */}
      {/* ========================================================================= */}
      {processedColleges.length > 0 ? (
        <Table className="bg-card">
          <TableHeader>
            <TableRow>
              <TableHead className="w-28 cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("affno")}>
                <div className="flex items-center gap-1">
                  <span>Affiliation No</span>
                  {renderSortIcon("affno")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("name")}>
                <div className="flex items-center gap-1">
                  <span>College Name</span>
                  {renderSortIcon("name")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none w-28" onClick={() => handleSort("short_name")}>
                <div className="flex items-center gap-1">
                  <span>Short Code</span>
                  {renderSortIcon("short_name")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("place")}>
                <div className="flex items-center gap-1">
                  <span>Place / District</span>
                  {renderSortIcon("place")}
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="text-center cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("student_count")}>
                <div className="flex items-center justify-center gap-1">
                  <span>Students</span>
                  {renderSortIcon("student_count")}
                </div>
              </TableHead>
              <TableHead className="text-center cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("leader_count")}>
                <div className="flex items-center justify-center gap-1">
                  <span>Orbit Leaders</span>
                  {renderSortIcon("leader_count")}
                </div>
              </TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedColleges.map((college) => {
              const aff = college.affno || college.id;

              return (
                <TableRow key={aff} className="hover:bg-muted/30">
                  
                  {/* Affiliation No */}
                  <TableCell className="font-mono text-xs font-bold text-primary">
                    {aff}
                  </TableCell>

                  {/* College Name */}
                  <TableCell>
                    <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <School className="size-4 text-muted-foreground shrink-0" />
                      <span>{college.name}</span>
                    </div>
                  </TableCell>

                  {/* College Short */}
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs font-medium">
                      {college.short_name || "—"}
                    </Badge>
                  </TableCell>

                  {/* Place / District */}
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-1 text-foreground font-medium">
                      <MapPin className="size-3 text-primary shrink-0" />
                      <span>{college.place}</span>
                    </div>
                    {college.district && college.district !== college.place && (
                      <div className="text-muted-foreground text-[11px] mt-0.5">
                        District: {college.district}
                      </div>
                    )}
                  </TableCell>

                  {/* Email */}
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground font-mono">
                    {college.email ? (
                      <div className="flex items-center gap-1">
                        <Mail className="size-3 text-muted-foreground" />
                        <span className="truncate max-w-[160px]">{college.email}</span>
                      </div>
                    ) : (
                      <span className="italic">—</span>
                    )}
                  </TableCell>

                  {/* Number of Students */}
                  <TableCell className="text-center font-mono text-xs">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted/60 text-foreground font-semibold">
                      <Users className="size-3 text-primary" />
                      <span>{college.student_count ?? 0}</span>
                    </div>
                  </TableCell>

                  {/* Orbit Leaders Count */}
                  <TableCell className="text-center font-mono text-xs">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted/60 text-foreground font-semibold">
                      <Award className="size-3 text-secondary-foreground" />
                      <span>{college.leader_count ?? 0}</span>
                    </div>
                  </TableCell>

                  {/* View Details Action Trigger */}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCollegeForModal(college)}
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
            <School className="size-10 text-muted-foreground mx-auto" />
            <div className="font-serif font-semibold text-lg text-foreground">
              No colleges found
            </div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No colleges matched your search or district selection. Try resetting filters.
            </p>
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* COLLEGE DETAIL MODAL */}
      {/* ========================================================================= */}
      {selectedCollegeForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg shadow-2xl border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <div className="space-y-1">
                <Badge variant="default" className="text-[10px] font-mono">
                  {selectedCollegeForModal.affno || selectedCollegeForModal.id}
                </Badge>
                <CardTitle className="text-xl font-serif">
                  {selectedCollegeForModal.name}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedCollegeForModal(null)}
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-4 pt-4 text-xs">
              
              {/* Short code & Location */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
                <div>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                    Institutional Code
                  </span>
                  <span className="font-semibold text-foreground text-sm font-mono">
                    {selectedCollegeForModal.short_name || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                    District / Region
                  </span>
                  <span className="font-semibold text-foreground text-sm">
                    {selectedCollegeForModal.district || selectedCollegeForModal.place}
                  </span>
                </div>
              </div>

              {/* Geographic Info */}
              <div className="space-y-2">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary" />
                  <span>Campus Location</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>
                    <span className="text-[10px] block font-mono uppercase">Place</span>
                    <span className="text-foreground">{selectedCollegeForModal.place}</span>
                  </div>
                  <div>
                    <span className="text-[10px] block font-mono uppercase">State</span>
                    <span className="text-foreground">{selectedCollegeForModal.state || "Kerala"}</span>
                  </div>
                </div>
              </div>

              {/* Contact Email */}
              {selectedCollegeForModal.email && (
                <div className="space-y-1 pt-2 border-t border-border">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                    Authorized Contact
                  </span>
                  <div className="flex items-center gap-2 font-mono text-foreground">
                    <Mail className="size-3.5 text-primary" />
                    <span>{selectedCollegeForModal.email}</span>
                  </div>
                </div>
              )}

              {/* Campus Statistics */}
              <div className="space-y-2 pt-2 border-t border-border">
                <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                  Institutional Metrics
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-md border border-border bg-card">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                      Enrolled Scholars
                    </span>
                    <div className="text-xl font-bold font-mono text-primary mt-0.5">
                      {selectedCollegeForModal.student_count ?? 0}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-md border border-border bg-card">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                      Orbit Leaders
                    </span>
                    <div className="text-xl font-bold font-mono text-secondary-foreground mt-0.5">
                      {selectedCollegeForModal.leader_count ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCollegeForModal(null)}
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
