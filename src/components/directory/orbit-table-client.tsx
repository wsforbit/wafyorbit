"use client";

import { useState, useMemo } from "react";
import { Search, Layers, MapPin, Info, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Orbit } from "@/types/database.types";

type SortField = "id" | "name" | "district" | "taluk";

export function OrbitTableClient({ initialOrbits }: { initialOrbits: Orbit[] }) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("id");
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

  const processedOrbits = useMemo(() => {
    const q = search.toLowerCase().trim();
    let filtered = initialOrbits;

    if (q) {
      filtered = initialOrbits.filter((orbit) => {
        return (
          orbit.name.toLowerCase().includes(q) ||
          orbit.id.toLowerCase().includes(q) ||
          orbit.district.toLowerCase().includes(q) ||
          orbit.taluk.toLowerCase().includes(q) ||
          (orbit.panchayaths && orbit.panchayaths.toLowerCase().includes(q))
        );
      });
    }

    return [...filtered].sort((a, b) => {
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
  }, [initialOrbits, search, sortField, sortDirection]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by orbit name, ID, or district..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-xs text-muted-foreground font-mono self-start sm:self-center">
          Showing <strong>{processedOrbits.length}</strong> of <strong>{initialOrbits.length}</strong> orbits (Sorted by <strong>{sortField}</strong> {sortDirection.toUpperCase()})
        </div>
      </div>

      {/* Orbits Table */}
      {processedOrbits.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none w-32" onClick={() => handleSort("id")}>
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
                  <span>District & Taluk</span>
                  {renderSortIcon("district")}
                </div>
              </TableHead>
              <TableHead>Panchayaths / Jurisdiction</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedOrbits.map((orbit) => {
              const placeChips = (orbit.panchayaths || "")
                .split(",")
                .map((p) => p.trim())
                .filter(Boolean);

              return (
                <TableRow key={orbit.id}>
                  <TableCell className="font-mono font-semibold text-primary">
                    {orbit.id}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <Layers className="size-4 text-muted-foreground shrink-0" />
                      <span>{orbit.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="font-medium text-foreground">{orbit.district}</span> • {orbit.taluk}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                      {placeChips.map((place, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] px-2 py-0 font-normal">
                          {place}
                        </Badge>
                      ))}
                      {placeChips.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">—</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-12 text-center space-y-3">
          <div className="size-10 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <Info className="size-5" />
          </div>
          <h3 className="font-serif font-semibold text-base text-foreground">
            {initialOrbits.length === 0 ? "No Orbits Registered Yet" : "No matching orbits found"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {initialOrbits.length === 0
              ? "Orbits registered via the Admin Portal will automatically display here in real-time."
              : "Try adjusting your search query."}
          </p>
        </div>
      )}
    </div>
  );
}
