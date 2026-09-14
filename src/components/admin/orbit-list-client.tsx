"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Layers,
  MapPin,
  Users,
  Award,
  Eye,
  X,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { Orbit } from "@/types/database.types";

interface Props {
  initialOrbits: Orbit[];
}

type SortField = "id" | "name" | "district" | "taluk" | "member_count" | "leader_count";

export function OrbitListClient({ initialOrbits }: Props) {
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [selectedTaluk, setSelectedTaluk] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Modal State for viewing orbit full details
  const [selectedOrbitForModal, setSelectedOrbitForModal] = useState<Orbit | null>(null);

  // Extract unique States and Districts dynamically from dataset
  const uniqueStates = useMemo(() => {
    const states = Array.from(new Set(initialOrbits.map((o) => o.state || "Kerala")));
    return states.sort();
  }, [initialOrbits]);

  const uniqueDistricts = useMemo(() => {
    let list = initialOrbits;
    if (selectedState !== "ALL") {
      list = list.filter((o) => (o.state || "Kerala") === selectedState);
    }
    const districts = Array.from(new Set(list.map((o) => o.district).filter(Boolean)));
    return districts.sort();
  }, [initialOrbits, selectedState]);

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

  // Filtered & Sorted Orbits Logic
  const processedOrbits = useMemo(() => {
    const filtered = initialOrbits.filter((orbit) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        orbit.name.toLowerCase().includes(q) ||
        orbit.id.toLowerCase().includes(q) ||
        (orbit.panchayaths && orbit.panchayaths.toLowerCase().includes(q));

      const matchesState =
        selectedState === "ALL" || (orbit.state || "Kerala") === selectedState;

      const matchesDistrict =
        selectedDistrict === "ALL" || orbit.district === selectedDistrict;

      const matchesTaluk =
        !selectedTaluk.trim() ||
        orbit.taluk.toLowerCase().includes(selectedTaluk.trim().toLowerCase());

      return matchesSearch && matchesState && matchesDistrict && matchesTaluk;
    });

    return filtered.sort((a, b) => {
      if (sortField === "member_count") {
        const numA = a.member_count ?? 0;
        const numB = b.member_count ?? 0;
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
        case "id":
          valA = a.id || "";
          valB = b.id || "";
          break;
        case "name":
          valA = a.name || "";
          valB = b.name || "";
          break;
        case "district":
          valA = a.district || "";
          valB = b.district || "";
          break;
        case "taluk":
          valA = a.taluk || "";
          valB = b.taluk || "";
          break;
      }

      const comparison = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [initialOrbits, search, selectedState, selectedDistrict, selectedTaluk, sortField, sortDirection]);

  const handleResetFilters = () => {
    setSearch("");
    setSelectedState("ALL");
    setSelectedDistrict("ALL");
    setSelectedTaluk("");
    setSortField("id");
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
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              
              {/* Search by Name or ID */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Orbit Name, ID, or Panchayaths..."
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

              {/* Multi-Filters Row */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* State Filter */}
                <div className="w-32">
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value);
                      setSelectedDistrict("ALL");
                    }}
                    className="h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="ALL">All States</option>
                    {uniqueStates.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* District Filter */}
                <div className="w-40">
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="ALL">All Districts ({uniqueDistricts.length})</option>
                    {uniqueDistricts.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Taluk Search Field */}
                <div className="w-36">
                  <Input
                    placeholder="Filter Taluk..."
                    value={selectedTaluk}
                    onChange={(e) => setSelectedTaluk(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                {/* Reset Filter Button */}
                {(search ||
                  selectedState !== "ALL" ||
                  selectedDistrict !== "ALL" ||
                  selectedTaluk ||
                  sortField !== "id" ||
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
                <span>Showing <strong>{processedOrbits.length}</strong> of <strong>{initialOrbits.length}</strong> active orbits (Sorted by <strong>{sortField}</strong> {sortDirection.toUpperCase()})</span>
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                ● Live Active Scope
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* ORBIT TABLE LIST */}
      {/* ========================================================================= */}
      {processedOrbits.length > 0 ? (
        <Table className="bg-card">
          <TableHeader>
            <TableRow>
              <TableHead className="w-28 cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("id")}>
                <div className="flex items-center gap-1">
                  <span>Orbit ID</span>
                  {renderSortIcon("id")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("name")}>
                <div className="flex items-center gap-1">
                  <span>Orbit Name</span>
                  {renderSortIcon("name")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("district")}>
                <div className="flex items-center gap-1">
                  <span>Location Details</span>
                  {renderSortIcon("district")}
                </div>
              </TableHead>
              <TableHead className="min-w-[200px] max-w-sm">Panchayaths / Jurisdiction Places</TableHead>
              <TableHead className="text-center cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("member_count")}>
                <div className="flex items-center justify-center gap-1">
                  <span>Members</span>
                  {renderSortIcon("member_count")}
                </div>
              </TableHead>
              <TableHead className="text-center cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("leader_count")}>
                <div className="flex items-center justify-center gap-1">
                  <span>Leaders</span>
                  {renderSortIcon("leader_count")}
                </div>
              </TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedOrbits.map((orbit) => {
              const placeChips = (orbit.panchayaths || "")
                .split(",")
                .map((p) => p.trim())
                .filter(Boolean);

              return (
                <TableRow key={orbit.id} className="hover:bg-muted/30">
                  
                  {/* Orbit ID */}
                  <TableCell className="font-mono text-xs font-bold text-primary">
                    {orbit.id}
                  </TableCell>

                  {/* Orbit Name & Status */}
                  <TableCell>
                    <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <Layers className="size-4 text-muted-foreground shrink-0" />
                      <span>{orbit.name}</span>
                    </div>
                    {orbit.constituency && (
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        Constituency: {orbit.constituency}
                      </div>
                    )}
                  </TableCell>

                  {/* Location Details */}
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-1 text-foreground font-medium">
                      <MapPin className="size-3 text-primary shrink-0" />
                      <span>{orbit.district}</span>
                    </div>
                    <div className="text-muted-foreground mt-0.5 text-[11px]">
                      Taluk: {orbit.taluk} • {orbit.state}
                    </div>
                  </TableCell>

                  {/* Panchayaths / Municipalities Chips */}
                  <TableCell>
                    {placeChips.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto py-0.5 scrollbar-none">
                        {placeChips.map((place, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-[10px] px-2 py-0 font-normal bg-secondary/80 text-secondary-foreground"
                          >
                            {place}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No panchayaths tagged</span>
                    )}
                  </TableCell>

                  {/* Total Members Count */}
                  <TableCell className="text-center font-mono text-xs">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted/60 text-foreground font-semibold">
                      <Users className="size-3 text-primary" />
                      <span>{orbit.member_count ?? 0}</span>
                    </div>
                  </TableCell>

                  {/* Leaders Count */}
                  <TableCell className="text-center font-mono text-xs">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted/60 text-foreground font-semibold">
                      <Award className="size-3 text-secondary-foreground" />
                      <span>{orbit.leader_count ?? 0}</span>
                    </div>
                  </TableCell>

                  {/* View Details Action Trigger */}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOrbitForModal(orbit)}
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
              No orbits found
            </div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No orbits matched your search or location filters. Try clearing filters.
            </p>
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* ORBIT DETAIL MODAL */}
      {/* ========================================================================= */}
      {selectedOrbitForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg shadow-2xl border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <div className="space-y-1">
                <Badge variant="default" className="text-[10px] font-mono">
                  {selectedOrbitForModal.id}
                </Badge>
                <CardTitle className="text-xl font-serif">
                  {selectedOrbitForModal.name}
                </CardTitle>
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
              
              {/* Jurisdiction Grid */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-secondary/30 border border-border">
                <div>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                    District
                  </span>
                  <span className="font-semibold text-foreground text-sm">
                    {selectedOrbitForModal.district}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                    Taluk
                  </span>
                  <span className="font-semibold text-foreground text-sm">
                    {selectedOrbitForModal.taluk}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                    State
                  </span>
                  <span className="font-semibold text-foreground text-sm">
                    {selectedOrbitForModal.state}
                  </span>
                </div>
              </div>

              {/* Tagged Panchayaths */}
              <div className="space-y-1.5">
                <span className="font-semibold text-foreground block">Tagged Panchayaths & Municipalities</span>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-md bg-muted/20 border border-border max-h-32 overflow-y-auto">
                  {selectedOrbitForModal.panchayaths ? (
                    selectedOrbitForModal.panchayaths
                      .split(",")
                      .map((p) => p.trim())
                      .filter(Boolean)
                      .map((place, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] px-2 py-0.5">
                          {place}
                        </Badge>
                      ))
                  ) : (
                    <span className="text-muted-foreground italic text-xs">No specific panchayaths tagged.</span>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                <div className="p-2.5 rounded-md border border-border bg-card">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                    Assigned Scholars
                  </span>
                  <div className="text-xl font-bold font-mono text-primary mt-0.5">
                    {selectedOrbitForModal.member_count ?? 0}
                  </div>
                </div>
                <div className="p-2.5 rounded-md border border-border bg-card">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                    Active Leaders
                  </span>
                  <div className="text-xl font-bold font-mono text-secondary-foreground mt-0.5">
                    {selectedOrbitForModal.leader_count ?? 0}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOrbitForModal(null)}
                  className="text-xs"
                >
                  Close Orbit Profile
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
