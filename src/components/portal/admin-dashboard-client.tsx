"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  School,
  GraduationCap,
  PlusCircle,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Table as TableIcon,
  Shield,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createCollegeAction, createOrbitAction, atomicBulkImportStudents, type StudentImportRow } from "@/app/portal/admin/actions";
import type { LiveMetrics, Orbit, College, Student } from "@/types/database.types";

interface Props {
  initialMetrics: LiveMetrics;
  initialOrbits: Orbit[];
  initialColleges: College[];
  initialStudents: Student[];
}

export function AdminDashboardClient({
  initialMetrics,
  initialOrbits,
  initialColleges,
  initialStudents,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "add-college" | "add-orbit" | "bulk-import" | "students">("overview");

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Bulk import json text state
  const [bulkInput, setBulkInput] = useState(`[
  {
    "admission_no": "WAFY2025001",
    "full_name": "Ahmad Rayan",
    "college_id": "${initialColleges[0]?.id || "college-uuid"}",
    "batch_year": 2025,
    "status": "Active"
  }
]`);

  // Handle Add College
  const handleAddCollege = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await createCollegeAction(formData);
      if (res.success) {
        setFeedback({ type: "success", message: "College created successfully!" });
        form.reset();
        router.refresh();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to create college." });
      }
    });
  };

  // Handle Add Orbit
  const handleAddOrbit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await createOrbitAction(formData);
      if (res.success) {
        setFeedback({ type: "success", message: "Orbit registered successfully!" });
        form.reset();
        router.refresh();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to register orbit." });
      }
    });
  };

  // Handle Atomic Bulk Import
  const handleBulkImport = async () => {
    setFeedback(null);
    try {
      let parsed: StudentImportRow[];
      try {
        parsed = JSON.parse(bulkInput);
      } catch {
        setFeedback({
          type: "error",
          message: "Invalid JSON format. Please verify your syntax before proceeding.",
        });
        return;
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        setFeedback({
          type: "error",
          message: "JSON must be a non-empty array of student objects.",
        });
        return;
      }

      startTransition(async () => {
        const res = await atomicBulkImportStudents(parsed);
        if (res.success) {
          setFeedback({
            type: "success",
            message: `Atomic upload complete! All ${res.count} student records were verified and inserted with zero errors.`,
          });
          router.refresh();
        } else {
          setFeedback({
            type: "error",
            message: res.error || "Bulk upload failed and was rolled back completely.",
          });
        }
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      setFeedback({ type: "error", message: msg });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs font-mono uppercase">
              Central Administration
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">Protected Portal</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-foreground mt-1">
            Wafy Orbit Administration
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            System control console for managing orbits, colleges, atomic bulk uploads, and student rosters.
          </p>
        </div>
      </div>

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

      {/* Metric Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground">
              Total Orbits
            </CardTitle>
            <Layers className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-bold text-foreground">
              {initialMetrics.orbitCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Active specialized domains</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground">
              Affiliated Colleges
            </CardTitle>
            <School className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-bold text-foreground">
              {initialMetrics.collegeCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Registered collegiate campuses</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground">
              Total Students
            </CardTitle>
            <GraduationCap className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-bold text-foreground">
              {initialMetrics.studentCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Enrolled across all institutions</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            activeTab === "overview" ? "bg-secondary text-secondary-foreground font-semibold" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          System Overview
        </button>
        <button
          onClick={() => setActiveTab("add-college")}
          className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            activeTab === "add-college" ? "bg-secondary text-secondary-foreground font-semibold" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Add College
        </button>
        <button
          onClick={() => setActiveTab("add-orbit")}
          className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            activeTab === "add-orbit" ? "bg-secondary text-secondary-foreground font-semibold" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Add Orbit
        </button>
        <button
          onClick={() => setActiveTab("bulk-import")}
          className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            activeTab === "bulk-import" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Atomic Bulk Upload
        </button>
        <button
          onClick={() => setActiveTab("students")}
          className={`px-3.5 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            activeTab === "students" ? "bg-secondary text-secondary-foreground font-semibold" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Student Roster ({initialStudents.length})
        </button>
      </div>

      {/* Tab 1: System Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registered Orbits Registry</CardTitle>
              <CardDescription className="text-xs">
                Real-time active orbits list from Supabase
              </CardDescription>
            </CardHeader>
            <CardContent>
              {initialOrbits.length > 0 ? (
                <div className="space-y-3">
                  {initialOrbits.slice(0, 5).map((orbit) => (
                    <div key={orbit.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border">
                      <div>
                        <div className="font-semibold text-sm text-foreground">{orbit.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{orbit.id} • {orbit.district}, {orbit.taluk}</div>
                      </div>
                      <Badge variant="secondary">{orbit.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic py-4">No orbits created yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Affiliated Colleges Registry</CardTitle>
              <CardDescription className="text-xs">
                Collegiate campuses connected to the central directory
              </CardDescription>
            </CardHeader>
            <CardContent>
              {initialColleges.length > 0 ? (
                <div className="space-y-3">
                  {initialColleges.slice(0, 5).map((col) => (
                    <div key={col.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border">
                      <div>
                        <div className="font-semibold text-sm text-foreground">{col.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{col.affno || col.id} • {col.place}</div>
                      </div>
                      <Badge variant="outline">{col.state || "Kerala"}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic py-4">No colleges registered yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Add College Form */}
      {activeTab === "add-college" && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-serif">Register New Affiliated College</CardTitle>
            <CardDescription className="text-xs">
              Add a verified campus to the Wafy Orbit institutional network.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCollege} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    College Name *
                  </label>
                  <Input name="name" required placeholder="e.g. Wafy Arts & Science College" disabled={isPending} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    College Code *
                  </label>
                  <Input name="code" required placeholder="e.g. WASC01" disabled={isPending} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    District *
                  </label>
                  <Input name="district" required placeholder="e.g. Malappuram" disabled={isPending} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    State
                  </label>
                  <Input name="state" defaultValue="Kerala" disabled={isPending} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Official Contact Email
                  </label>
                  <Input name="contact_email" type="email" placeholder="principal@college.edu" disabled={isPending} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Contact Phone
                  </label>
                  <Input name="contact_phone" placeholder="+91 98765 43210" disabled={isPending} />
                </div>
              </div>

              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <PlusCircle className="size-4" />}
                Save College to Database
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Add Orbit Form */}
      {activeTab === "add-orbit" && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-serif">Register New Orbit</CardTitle>
            <CardDescription className="text-xs">
              Establish a new specialized academic or extracurricular orbit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddOrbit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Orbit Name *
                  </label>
                  <Input name="name" required placeholder="e.g. Orbit of Literature & Discourse" disabled={isPending} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Orbit Code *
                  </label>
                  <Input name="code" required placeholder="e.g. ORB-LIT" disabled={isPending} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Category
                  </label>
                  <Input name="category" defaultValue="Academic" placeholder="Academic / Research / Tech / Arts" disabled={isPending} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Host College Affiliation
                  </label>
                  <select
                    name="college_id"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                    disabled={isPending}
                  >
                    <option value="none">Central (All Campuses)</option>
                    {initialColleges.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name} ({col.affno || col.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Description / Mission Statement
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Summarize the core objectives and scope of this orbit..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-2xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  disabled={isPending}
                />
              </div>

              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <PlusCircle className="size-4" />}
                Register Orbit
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Atomic Bulk Upload */}
      {activeTab === "bulk-import" && (
        <Card className="max-w-3xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-[10px]">Strictly Atomic</Badge>
              <Badge variant="secondary" className="text-[10px]">All-or-Nothing</Badge>
            </div>
            <CardTitle className="text-xl font-serif">Atomic Bulk Student Import</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Every record in the payload is pre-validated for duplicates and schema compliance. If any single error or conflict occurs, the <strong>entire process is aborted immediately</strong> to ensure zero partial or corrupted entries.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground font-mono">
                  JSON Records Array
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Available College UUID: <code className="bg-muted px-1 rounded text-primary">{initialColleges[0]?.id || "No colleges yet"}</code>
                </span>
              </div>
              <textarea
                rows={10}
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                className="w-full font-mono text-xs rounded-md border border-input bg-background p-3 text-foreground shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring leading-relaxed"
                disabled={isPending}
              />
            </div>

            <Button
              onClick={handleBulkImport}
              disabled={isPending || initialColleges.length === 0}
              className="gap-2 font-medium"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Executing Atomic Import...
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  Verify & Import All Records Atomically
                </>
              )}
            </Button>
            {initialColleges.length === 0 && (
              <p className="text-xs text-destructive">
                Please register at least one college first before importing students.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 5: Student Roster */}
      {activeTab === "students" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold">Enrolled Student Roster</h3>
            <span className="text-xs font-mono text-muted-foreground">{initialStudents.length} records</span>
          </div>

          {initialStudents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admission No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead>Assigned Orbit</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialStudents.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs text-primary font-semibold">
                      {s.admission_no}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{s.full_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.college?.name || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.orbit?.name || "Unassigned"}</TableCell>
                    <TableCell className="font-mono text-xs">{s.batch_year}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">{s.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-xs text-muted-foreground italic py-8 text-center border rounded-md">
              No students recorded in the database yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
