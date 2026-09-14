"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  Upload,
  GitMerge,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Key,
  Shield,
  Layers,
  X,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  FileText,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseCsvContent } from "@/lib/csv-parser";
import {
  createOrbitWithAuthAction,
  bulkImportOrbitsWithAuthAction,
  updateOrbitAction,
  deleteOrbitAction,
  mergeOrbitsAction,
  type OrbitFormPayload,
} from "@/app/admin/orbit/actions";
import type { Orbit, OrbitStatus } from "@/types/database.types";

interface Props {
  initialOrbits: Orbit[];
}

export function OrbitSettingsClient({ initialOrbits }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"manage" | "single" | "bulk" | "merge">("manage");
  const [isPending, startTransition] = useTransition();

  // Banner Feedback
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Auth Credentials Modal State
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; pass: string } | null>(null);

  // Single Add Form State (Exact database schema match)
  const [singleForm, setSingleForm] = useState<OrbitFormPayload>({
    id: "",
    name: "",
    status: "active",
    state: "Kerala",
    district: "",
    taluk: "",
    constituency: "",
    panchayaths: "",
    description: "",
  });

  // Bulk CSV Input State
  const sampleCsvData = `id,name,status,state,district,taluk,constituency,panchayaths,description
ORB-CALICUT,Calicut North Orbit,active,Kerala,Kozhikode,Kozhikode,Elathur,"Kakkodi, Chelannur, Kakkur",Central academic node
ORB-MALAPPURAM,Malappuram Central Orbit,active,Kerala,Malappuram,Eranad,Manjeri,"Manjeri, Anakkayam, Pandikkad",Collegiate research center
ORB-ERNAKULAM,Cochin Coastal Orbit,active,Kerala,Ernakulam,Kochi,Aluva,"Aluva, Kalamassery, Angamaly",Southern regional hub`;

  const [csvContent, setCsvContent] = useState(sampleCsvData);

  // Edit Modal State
  const [editingOrbit, setEditingOrbit] = useState<Orbit | null>(null);

  // Delete Modal State
  const [deletingOrbit, setDeletingOrbit] = useState<Orbit | null>(null);

  // Merge State
  const [sourceOrbitId, setSourceOrbitId] = useState<string>("");
  const [targetOrbitId, setTargetOrbitId] = useState<string>("");
  const [showMergeConfirm, setShowMergeConfirm] = useState(false);

  // Active Orbits for Merge Selection
  const activeOrbits = initialOrbits.filter((o) => o.status === "active");

  // Handle CSV File Upload via File Picker
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      setFeedback({ type: "error", message: "Please select a valid .csv file." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvContent(text);
        setFeedback({
          type: "success",
          message: `Loaded CSV file '${file.name}' (${file.size} bytes). Ready to import.`,
        });
      }
    };
    reader.onerror = () => {
      setFeedback({ type: "error", message: "Failed to read the selected file." });
    };
    reader.readAsText(file);
  };

  // Download Sample CSV
  const downloadSampleCsv = () => {
    const blob = new Blob([sampleCsvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "wafy_orbits_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Single Add Handler
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await createOrbitWithAuthAction(singleForm);
      if (res.success && res.credentials) {
        setCreatedCredentials({
          email: res.credentials.email,
          pass: res.credentials.password,
        });
        setFeedback({
          type: "success",
          message: `Orbit '${singleForm.name}' established successfully with automated leader authentication!`,
        });
        setSingleForm({
          id: "",
          name: "",
          status: "active",
          state: "Kerala",
          district: "",
          taluk: "",
          constituency: "",
          panchayaths: "",
          description: "",
        });
        router.refresh();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to create orbit." });
      }
    });
  };

  // 2. CSV Bulk Import Handler
  const handleCsvImport = () => {
    setFeedback(null);

    try {
      const parsedRows = parseCsvContent(csvContent);
      if (parsedRows.length <= 1) {
        setFeedback({ type: "error", message: "CSV content must contain a header and at least one data row." });
        return;
      }

      const records: OrbitFormPayload[] = [];
      for (let i = 1; i < parsedRows.length; i++) {
        const cleanCols = parsedRows[i];

        if (cleanCols.length < 5) {
          setFeedback({
            type: "error",
            message: `Row ${i + 1} has insufficient columns. Required format: id,name,status,state,district,taluk,constituency,panchayaths,description`,
          });
          return;
        }

        records.push({
          id: cleanCols[0],
          name: cleanCols[1],
          status: (cleanCols[2]?.toLowerCase() === "inactive" ? "inactive" : "active") as OrbitStatus,
          state: cleanCols[3] || "Kerala",
          district: cleanCols[4],
          taluk: cleanCols[5] || cleanCols[4],
          constituency: cleanCols[6] || undefined,
          panchayaths: cleanCols[7] || undefined,
          description: cleanCols[8] || undefined,
        });
      }

      startTransition(async () => {
        const res = await bulkImportOrbitsWithAuthAction(records);
        if (res.success) {
          setFeedback({
            type: "success",
            message: `Atomic bulk import succeeded! All ${res.count} orbits were verified and imported with automated leader accounts.`,
          });
          setCsvContent("id,name,status,state,district,taluk,constituency,panchayaths,description\n");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          router.refresh();
        } else {
          setFeedback({
            type: "error",
            message: res.error || "Bulk import failed and was rolled back.",
          });
        }
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "CSV parsing failed.";
      setFeedback({ type: "error", message: msg });
    }
  };

  // 3. Edit Handler
  const handleUpdateOrbit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrbit) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await updateOrbitAction(editingOrbit.id, {
        name: editingOrbit.name,
        status: editingOrbit.status,
        state: editingOrbit.state,
        district: editingOrbit.district,
        taluk: editingOrbit.taluk,
        constituency: editingOrbit.constituency || undefined,
        panchayaths: editingOrbit.panchayaths || undefined,
        description: editingOrbit.description || undefined,
      });

      if (res.success) {
        setFeedback({ type: "success", message: `Orbit '${editingOrbit.id}' updated successfully.` });
        setEditingOrbit(null);
        router.refresh();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to update orbit." });
      }
    });
  };

  // 4. Delete Handler
  const handleDeleteConfirm = () => {
    if (!deletingOrbit) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await deleteOrbitAction(deletingOrbit.id);
      if (res.success) {
        setFeedback({ type: "success", message: `Orbit '${deletingOrbit.name}' was deleted.` });
        setDeletingOrbit(null);
        router.refresh();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to delete orbit." });
      }
    });
  };

  // 5. Merge Handler
  const handleMergeExecute = () => {
    if (!sourceOrbitId || !targetOrbitId) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await mergeOrbitsAction(sourceOrbitId, targetOrbitId);
      setShowMergeConfirm(false);

      if (res.success) {
        setFeedback({
          type: "success",
          message: res.message || `Successfully merged '${sourceOrbitId}' into '${targetOrbitId}'.`,
        });
        setSourceOrbitId("");
        setTargetOrbitId("");
        router.refresh();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to merge orbits." });
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Global Feedback Alert */}
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

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border">
        <button
          onClick={() => setActiveTab("manage")}
          className={`px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            activeTab === "manage"
              ? "bg-secondary text-secondary-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          All Orbits ({initialOrbits.length})
        </button>
        <button
          onClick={() => setActiveTab("single")}
          className={`px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            activeTab === "single"
              ? "bg-secondary text-secondary-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Add Single Orbit
        </button>
        <button
          onClick={() => setActiveTab("bulk")}
          className={`px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            activeTab === "bulk"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Bulk CSV Import
        </button>
        <button
          onClick={() => setActiveTab("merge")}
          className={`px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "merge"
              ? "bg-secondary text-secondary-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <GitMerge className="size-3.5" />
          Merge Orbits
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MANAGE ALL ORBITS TABLE */}
      {/* ========================================================================= */}
      {activeTab === "manage" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">
                Orbit Directory & Governance
              </h3>
              <p className="text-xs text-muted-foreground">
                View, edit details, or toggle status of all registered institutional orbits.
              </p>
            </div>
          </div>

          {initialOrbits.length > 0 ? (
            <Table className="bg-card">
              <TableHeader>
                <TableRow>
                  <TableHead>Orbit ID</TableHead>
                  <TableHead>Orbit Name</TableHead>
                  <TableHead>District & Taluk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Panchayaths</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialOrbits.map((orbit) => (
                  <TableRow key={orbit.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      {orbit.id}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {orbit.name}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <span className="text-foreground font-medium">{orbit.district}</span> • {orbit.taluk}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={orbit.status === "active" ? "default" : "secondary"}
                        className="text-[10px] uppercase font-mono"
                      >
                        {orbit.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {orbit.panchayaths || "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingOrbit(orbit)}
                        className="h-8 px-2 text-xs gap-1"
                      >
                        <Edit2 className="size-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeletingOrbit(orbit)}
                        className="h-8 px-2 text-xs gap-1"
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-xs text-muted-foreground italic py-8 text-center border rounded-md">
              No orbits registered in database yet.
            </p>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ADD SINGLE ORBIT FORM (FULL 1-TO-1 SCHEMA FIELDS) */}
      {/* ========================================================================= */}
      {activeTab === "single" && (
        <Card className="max-w-3xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-[10px]">Auto Credential Generation</Badge>
              <Badge variant="secondary" className="text-[10px]">Leader Account Sync</Badge>
            </div>
            <CardTitle className="text-xl font-serif">Establish New Institutional Orbit</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Adding an orbit automatically creates the Orbit Leader login credentials:
              <br />
              <code className="text-primary font-mono text-[11px]">
                Email: [orbitname]@orbit.com | Pass: [orbitid]_[orbitname]
              </code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground font-mono">
                    Orbit ID (Unique Key) *
                  </label>
                  <Input
                    required
                    placeholder="e.g. ORB-CALICUT, ORB101"
                    value={singleForm.id}
                    onChange={(e) => setSingleForm({ ...singleForm, id: e.target.value })}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Orbit Full Name *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Calicut North Orbit"
                    value={singleForm.name}
                    onChange={(e) => setSingleForm({ ...singleForm, name: e.target.value })}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    District *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Kozhikode"
                    value={singleForm.district}
                    onChange={(e) => setSingleForm({ ...singleForm, district: e.target.value })}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Taluk *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Kozhikode Taluk"
                    value={singleForm.taluk}
                    onChange={(e) => setSingleForm({ ...singleForm, taluk: e.target.value })}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    State
                  </label>
                  <Input
                    value={singleForm.state}
                    onChange={(e) => setSingleForm({ ...singleForm, state: e.target.value })}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Assembly Constituency (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Elathur"
                    value={singleForm.constituency || ""}
                    onChange={(e) => setSingleForm({ ...singleForm, constituency: e.target.value })}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Initial Status
                  </label>
                  <select
                    value={singleForm.status}
                    onChange={(e) => setSingleForm({ ...singleForm, status: e.target.value as OrbitStatus })}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                    disabled={isPending}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Panchayaths / Local Bodies (Comma Separated)
                </label>
                <Input
                  placeholder="e.g. Kakkodi, Chelannur, Kakkur, Nanminda"
                  value={singleForm.panchayaths || ""}
                  onChange={(e) => setSingleForm({ ...singleForm, panchayaths: e.target.value })}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Description / Operational Notes (Optional)
                </label>
                <Input
                  placeholder="e.g. Regional collegiate cluster for North Calicut institutions"
                  value={singleForm.description || ""}
                  onChange={(e) => setSingleForm({ ...singleForm, description: e.target.value })}
                  disabled={isPending}
                />
              </div>

              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <PlusCircle className="size-4" />}
                Establish Orbit & Provision Leader Auth
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BULK CSV IMPORT (FILE UPLOAD & TEXT EDITOR) */}
      {/* ========================================================================= */}
      {activeTab === "bulk" && (
        <Card className="max-w-3xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-[10px]">Strictly Atomic</Badge>
                <Badge variant="secondary" className="text-[10px]">Leader Account Sync</Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadSampleCsv}
                className="text-xs gap-1.5 h-8"
              >
                <Download className="size-3.5 text-primary" />
                Download Sample CSV
              </Button>
            </div>
            <CardTitle className="text-xl font-serif mt-2">Bulk CSV Orbit Import</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Upload a <code>.csv</code> file or paste CSV content below. Pre-validates every row and creates Leader login accounts automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* File Upload Selector */}
            <div className="p-4 rounded-lg border border-dashed border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FileText className="size-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Upload CSV Spreadsheet File</div>
                  <div className="text-[11px] text-muted-foreground">Select a .csv file from your device to auto-fill the editor</div>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs gap-1.5 shrink-0"
              >
                <Upload className="size-3.5" />
                Choose .CSV File
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground font-mono">
                  CSV Payload (Header Required)
                </label>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Header: id,name,status,state,district,taluk,constituency,panchayaths,description
                </span>
              </div>
              <textarea
                rows={10}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                className="w-full font-mono text-xs rounded-md border border-input bg-background p-3 text-foreground shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring leading-relaxed"
                disabled={isPending}
              />
            </div>

            <Button onClick={handleCsvImport} disabled={isPending} className="gap-2 font-medium">
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Verifying & Importing CSV Batch...
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  Execute Atomic Bulk CSV Import
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MERGE ORBITS UTILITY */}
      {/* ========================================================================= */}
      {activeTab === "merge" && (
        <Card className="max-w-2xl border-amber-500/20">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <GitMerge className="size-5" />
              <CardTitle className="text-xl font-serif">Dual Orbit Consolidation</CardTitle>
            </div>
            <CardDescription className="text-xs leading-relaxed">
              Consolidate two active orbits into one. All student enrollments and designated leadership assignments in the source orbit will be reallocated to the target orbit. The source orbit will then be set to inactive.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-foreground">
                  Source Orbit (To be merged & retired) *
                </label>
                <select
                  value={sourceOrbitId}
                  onChange={(e) => setSourceOrbitId(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground"
                  disabled={isPending}
                >
                  <option value="">-- Select Source Orbit --</option>
                  {activeOrbits.map((o) => (
                    <option key={o.id} value={o.id} disabled={o.id === targetOrbitId}>
                      {o.name} ({o.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-foreground">
                  Target Orbit (To receive all scholars) *
                </label>
                <select
                  value={targetOrbitId}
                  onChange={(e) => setTargetOrbitId(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground"
                  disabled={isPending}
                >
                  <option value="">-- Select Target Orbit --</option>
                  {activeOrbits.map((o) => (
                    <option key={o.id} value={o.id} disabled={o.id === sourceOrbitId}>
                      {o.name} ({o.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              type="button"
              variant="default"
              disabled={!sourceOrbitId || !targetOrbitId || isPending}
              onClick={() => setShowMergeConfirm(true)}
              className="gap-2 font-medium"
            >
              <GitMerge className="size-4" />
              Review & Execute Orbit Merge
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AUTH CREDENTIALS GENERATED DISPLAY */}
      {/* ========================================================================= */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <Card className="w-full max-w-md shadow-2xl border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                  <Key className="size-4" />
                </div>
                <CardTitle className="text-lg font-serif">Leader Auth Credentials</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setCreatedCredentials(null)}>
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                The Orbit Leader account has been created in the database. Share these credentials with the designated leader:
              </p>
              <div className="p-3 rounded-md bg-muted/50 border border-border font-mono space-y-2">
                <div>
                  <span className="text-muted-foreground block text-[10px]">LOGIN EMAIL:</span>
                  <span className="font-bold text-foreground text-sm">{createdCredentials.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">DEFAULT PASSWORD:</span>
                  <span className="font-bold text-primary text-sm">{createdCredentials.pass}</span>
                </div>
              </div>
              <Button className="w-full" onClick={() => setCreatedCredentials(null)}>
                Dismiss & Copy Complete
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT ORBIT CONTENT MODAL */}
      {/* ========================================================================= */}
      {editingOrbit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <Card className="w-full max-w-xl shadow-2xl border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <div>
                <Badge variant="default" className="text-[10px] font-mono">{editingOrbit.id}</Badge>
                <CardTitle className="text-lg font-serif mt-1">Edit Orbit Details</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditingOrbit(null)}>
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleUpdateOrbit} className="space-y-4 text-xs sm:text-sm">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-foreground">Orbit Name *</label>
                  <Input
                    required
                    value={editingOrbit.name}
                    onChange={(e) => setEditingOrbit({ ...editingOrbit, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-foreground">District *</label>
                    <Input
                      required
                      value={editingOrbit.district}
                      onChange={(e) => setEditingOrbit({ ...editingOrbit, district: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-foreground">Taluk *</label>
                    <Input
                      required
                      value={editingOrbit.taluk}
                      onChange={(e) => setEditingOrbit({ ...editingOrbit, taluk: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-foreground">Status</label>
                    <select
                      value={editingOrbit.status}
                      onChange={(e) => setEditingOrbit({ ...editingOrbit, status: e.target.value as OrbitStatus })}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-foreground">Constituency</label>
                    <Input
                      value={editingOrbit.constituency || ""}
                      onChange={(e) => setEditingOrbit({ ...editingOrbit, constituency: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-foreground">Panchayaths</label>
                  <Input
                    value={editingOrbit.panchayaths || ""}
                    onChange={(e) => setEditingOrbit({ ...editingOrbit, panchayaths: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-foreground">Description</label>
                  <Input
                    value={editingOrbit.description || ""}
                    onChange={(e) => setEditingOrbit({ ...editingOrbit, description: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setEditingOrbit(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE ORBIT CONFIRMATION */}
      {/* ========================================================================= */}
      {deletingOrbit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <Card className="w-full max-w-md shadow-2xl border-destructive/30 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="size-5" />
                <CardTitle className="text-lg font-serif">Confirm Orbit Deletion</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setDeletingOrbit(null)}>
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs">
              <p className="text-foreground leading-relaxed">
                Are you sure you want to permanently delete Orbit <strong>{deletingOrbit.name}</strong> (<code>{deletingOrbit.id}</code>)?
              </p>
              <p className="text-destructive leading-relaxed">
                This action cannot be undone. Associated student records under this orbit will become unassigned.
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" onClick={() => setDeletingOrbit(null)} disabled={isPending}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isPending}>
                  {isPending ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                  Permanently Delete Orbit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MERGE CONFIRMATION */}
      {/* ========================================================================= */}
      {showMergeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <Card className="w-full max-w-md shadow-2xl border-amber-500/30 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-primary">
                <GitMerge className="size-5" />
                <CardTitle className="text-lg font-serif">Confirm Orbit Consolidation</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowMergeConfirm(false)}>
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs">
              <p className="text-foreground leading-relaxed">
                You are about to reassign all students and leaders from Orbit <strong>{sourceOrbitId}</strong> into Orbit <strong>{targetOrbitId}</strong>.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Orbit <strong>{sourceOrbitId}</strong> will be marked inactive.
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" onClick={() => setShowMergeConfirm(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button variant="default" onClick={handleMergeExecute} disabled={isPending}>
                  {isPending ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                  Execute Orbit Merge
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
