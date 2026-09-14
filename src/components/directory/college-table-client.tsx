"use client";

import { useState, useMemo } from "react";
import { Search, School, MapPin, Mail, Info, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { College } from "@/types/database.types";

type SortField = "affno" | "name" | "short_name" | "place" | "email";

export function CollegeTableClient({ initialColleges }: { initialColleges: College[] }) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("affno");
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

  const processedColleges = useMemo(() => {
    const q = search.toLowerCase().trim();
    let filtered = initialColleges;

    if (q) {
      filtered = initialColleges.filter((college) => {
        const aff = college.affno || college.id || "";
        return (
          college.name.toLowerCase().includes(q) ||
          aff.toLowerCase().includes(q) ||
          (college.short_name && college.short_name.toLowerCase().includes(q)) ||
          college.place.toLowerCase().includes(q) ||
          (college.district && college.district.toLowerCase().includes(q))
        );
      });
    }

    return [...filtered].sort((a, b) => {
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
        case "email":
          valA = a.email || "";
          valB = b.email || "";
          break;
      }

      const comparison = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [initialColleges, search, sortField, sortDirection]);

  return (
    <div className="space-y-4">
      {/* Search Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by college name, short code, or affiliation no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs sm:text-sm"
          />
        </div>
        <div className="text-xs text-muted-foreground font-mono self-start sm:self-center">
          Showing <strong>{processedColleges.length}</strong> of <strong>{initialColleges.length}</strong> colleges (Sorted by <strong>{sortField}</strong> {sortDirection.toUpperCase()})
        </div>
      </div>

      {/* College Table */}
      {processedColleges.length > 0 ? (
        <Table className="bg-card">
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none w-36" onClick={() => handleSort("affno")}>
                <div className="flex items-center gap-1">
                  <span>Affiliation No</span>
                  {renderSortIcon("affno")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("name")}>
                <div className="flex items-center gap-1">
                  <span>Institution Name</span>
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
              <TableHead className="hidden md:table-cell cursor-pointer hover:bg-muted/50 transition-colors select-none" onClick={() => handleSort("email")}>
                <div className="flex items-center gap-1">
                  <span>Contact Email</span>
                  {renderSortIcon("email")}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedColleges.map((college) => {
              const aff = college.affno || college.id;

              return (
                <TableRow key={aff}>
                  <TableCell className="font-mono text-xs font-semibold text-primary">
                    {aff}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <School className="size-4 text-muted-foreground shrink-0" />
                      <span>{college.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {college.short_name || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <span className="text-foreground font-medium">{college.place}</span>
                    {college.district && college.district !== college.place && (
                      <span> ({college.district})</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground font-mono">
                    {college.email ? (
                      <div className="flex items-center gap-1">
                        <Mail className="size-3 text-muted-foreground" />
                        <span>{college.email}</span>
                      </div>
                    ) : (
                      <span>—</span>
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
            {initialColleges.length === 0 ? "No Colleges Registered Yet" : "No matching colleges found"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {initialColleges.length === 0
              ? "Affiliated colleges added to the institutional database will show here automatically."
              : "Try adjusting your search criteria."}
          </p>
        </div>
      )}
    </div>
  );
}
