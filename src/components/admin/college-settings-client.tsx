"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  Upload,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Key,
  School,
  X,
  AlertTriangle,
  Mail,
  MapPin,
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
  createCollegeWithAuthAction,
  bulkImportCollegesWithAuthAction,
  updateCollegeAction,
  deleteCollegeAction,
  type CollegeFormPayload,
} from "@/app/admin/college/actions";
import type { College } from "@/types/database.types";

interface Props {
  initialColleges: College[];
}

export function CollegeSettingsClient({ initialColleges }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"manage" | "single" | "bulk">("manage");
  const [isPending, startTransition] = useTransition();

  // Banner Feedback
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Auth Credentials Modal State
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; pass: string } | null>(null);

  // Single Add Form State (Exact schema match: affno, name, short_name, place, district, state, email)
  const [singleForm, setSingleForm] = useState<CollegeFormPayload>({
    affno: "",
    name: "",
    short_name: "",
    place: "",
    district: "",
    state: "Kerala",
    email: "",
  });

  // Bulk CSV Sample Data
  const sampleCsvData = `affno,name,short_name,place,district,state,email
WASC01,Wafy Arts and Science College,WASC,Malappuram,Malappuram,Kerala,principal@wasc.edu
WICC02,Wafy Islamic and Cultural Center,WICC,Kozhikode,Kozhikode,Kerala,admin@wicc.edu
WTAC03,Wafy Training Academy Campus,WTAC,Ernakulam,Ernakulam,Kerala,contact@wtac.edu`;

  // Bulk CSV Input State
  const [csvContent, setCsvContent] = useState(sampleCsvData);

  // Edit Modal State
  const [editingCollege, setEditingCollege] = useState<College | null>(null);

  // Delete Modal State
  const [deletingCollege, setDeletingCollege] = useState<College | null>(null);

  // Handle CSV File Upload
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
    link.setAttribute("download", "wafy_colleges_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Single Add Handler
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await createCollegeWithAuthAction(singleForm);
      if (res.success && res.credentials) {
        setCreatedCredentials({
          email: res.credentials.email,
          pass: res.credentials.password,
        });
        setFeedback({
          type: "success",
          message: `College '${singleForm.name}' established successfully with automated college login credentials!`,
        });
        setSingleForm({
          affno: "",
          name: "",
          short_name: "",
          place: "",
          district: "",
          state: "Kerala",
          email: "",
        });
        router.refresh();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to create college." });
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

      const records: CollegeFormPayload[] = [];
      for (let i = 1; i < parsedRows.length; i++) {
        const cleanCols = parsedRows[i];

        if (cleanCols.length < 4) {
          setFeedback({
            type: "error",
            message: `Row ${i + 1} has insufficient columns. Required format: affno,name,short_name,place,district,state,email`,
          });
          return;
        }

        records.push({
          affno: cleanCols[0],
          name: cleanCols[1],
          short_name: cleanCols[2],
          place: cleanCols[3],
          district: cleanCols[4] || cleanCols[3],
          state: cleanCols[5] || "Kerala",
          email: cleanCols[6] || undefined,
        });
      }

      startTransition(async () => {
        const res = await bulkImportCollegesWithAuthAction(records);
        if (res.success) {
          setFeedback({
            type: "success",
            message: `Atomic bulk import succeeded! All ${res.count} colleges were verified and imported with automated auth accounts.`,
          });
          setCsvContent("affno,name,short_name,place,district,state,email\n");
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
  const handleUpdateCollege = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollege) return;
    setFeedback(null);

    const aff = editingCollege.affno || editingCollege.id || "";
    if (!aff) return;

    startTransition(async () => {
      const res = await updateCollegeAction(aff, {
        name: editingCollege.name,
        short_name: editingCollege.short_name,
        place: editingCollege.place,
        district: editingCollege.district || editingCollege.place,
        state: editingCollege.state || "Kerala",
        email: editingCollege.email || undefined,
      });

      if (res.success) {
        setFeedback({ type: "success", message: `College '${aff}' updated successfully.` });
        setEditingCollege(null);
        router.refresh();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to update college." });
      }
    });
  };

  // 4. Delete Handler
  const handleDeleteConfirm = () => {
    if (!deletingCollege) return;
    setFeedback(null);

    const aff = deletingCollege.affno || deletingCollege.id || "";
    if (!aff) return;

    startTransition(async () => {
      const res = await deleteCollegeAction(aff);
      if (res.success) {
        setFeedback({ type: "success", message: `College '${deletingCollege.name}' was deleted.` });
        setDeletingCollege(null);
        router.refresh();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to delete college." });
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
          College Registry ({initialColleges.length})
        </button>
        <button
          onClick={() => setActiveTab("single")}
          className={`px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            activeTab === "single"
              ? "bg-secondary text-secondary-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Add Single College
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
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: COLLEGE REGISTRY TABLE */}
      {/* ========================================================================= */}
      {activeTab === "manage" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">
                Affiliated Colleges Roster
              </h3>
              <p className="text-xs text-muted-foreground">
                Manage campus records, edit contacts, or delete institutional profiles.
              </p>
            </div>
          </div>

          {initialColleges.length > 0 ? (
            <Table className="bg-card">
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliation No</TableHead>
                  <TableHead>College Name</TableHead>
                  <TableHead>Short Code</TableHead>
                  <TableHead>Place & District</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialColleges.map((college) => {
                  const aff = college.affno || college.id;

                  return (
                    <TableRow key={aff} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs font-bold text-primary">
                        {aff}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {college.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs font-medium">
                          {college.short_name || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <span className="text-foreground font-medium">{college.place}</span>
                        {college.district && college.district !== college.place && (
                          <span> ({college.district})</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {college.email || "—"}
                      </TableCell>
                      <TableCell className="text-right space-x-1 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingCollege(college)}
                          className="h-8 px-2 text-xs gap-1"
                        >
                          <Edit2 className="size-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeletingCollege(college)}
                          className="h-8 px-2 text-xs gap-1"
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-xs text-muted-foreground italic py-8 text-center border rounded-md">
              No colleges registered in database yet.
            </p>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ADD SINGLE COLLEGE FORM (FULL SCHEMA FIELDS) */}
      {/* ========================================================================= */}
      {activeTab === "single" && (
        <Card className="max-w-3xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-[10px]">Auto Credential Generation</Badge>
              <Badge variant="secondary" className="text-[10px]">College Account Sync</Badge>
            </div>
            <CardTitle className="text-xl font-serif">Register Affiliated College</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Adding a college automatically creates the College Admin login credentials:
              <br />
              <code className="text-primary font-mono text-[11px]">
                Email: [collegename]@orbit.com | Pass: [affno]_[collegename]
              </code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground font-mono">
                    Affiliation Number (affno) * (Permanent)
                  </label>
                  <Input
                    required
                    placeholder="e.g. WASC01, AFF-MALAPPURAM"
                    value={singleForm.affno}
                    onChange={(e) => setSingleForm({ ...singleForm, affno: e.target.value })}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    College Short Code *
                  </label>
                  <Input
                    required
                    placeholder="e.g. WASC"
                    value={singleForm.short_name}
                    onChange={(e) => setSingleForm({ ...singleForm, short_name: e.target.value })}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  College Full Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Wafy Arts and Science College"
                  value={singleForm.name}
                  onChange={(e) => setSingleForm({ ...singleForm, name: e.target.value })}
                  disabled={isPending}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Place / Campus Location *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Manjeri, Malappuram"
                    value={singleForm.place}
                    onChange={(e) => setSingleForm({ ...singleForm, place: e.target.value })}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    District *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Malappuram"
                    value={singleForm.district || ""}
                    onChange={(e) => setSingleForm({ ...singleForm, district: e.target.value })}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    State
                  </label>
                  <Input
                    value={singleForm.state || "Kerala"}
                    onChange={(e) => setSingleForm({ ...singleForm, state: e.target.value })}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Official Email Address (Optional)
                </label>
                <Input
                  type="email"
                  placeholder="principal@wasc.edu"
                  value={singleForm.email || ""}
                  onChange={(e) => setSingleForm({ ...singleForm, email: e.target.value })}
                  disabled={isPending}
                />
              </div>

              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <PlusCircle className="size-4" />}
                Register College & Provision Auth
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
                <Badge variant="secondary" className="text-[10px]">College Auth Sync</Badge>
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
            <CardTitle className="text-xl font-serif mt-2">Bulk CSV College Import</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Upload a <code>.csv</code> spreadsheet or paste content below. Pre-validates each row, prevents duplicate affiliation numbers, and provisions login credentials automatically.
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
                  Header: affno,name,short_name,place,district,state,email
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
                <CardTitle className="text-lg font-serif">College Auth Credentials</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setCreatedCredentials(null)}>
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                The College Admin account has been established. Provide these login details to the campus administration:
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
      {/* MODAL: EDIT COLLEGE CONTENT MODAL */}
      {/* ========================================================================= */}
      {editingCollege && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <Card className="w-full max-w-xl shadow-2xl border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <div>
                <Badge variant="default" className="text-[10px] font-mono">{editingCollege.affno || editingCollege.id}</Badge>
                <CardTitle className="text-lg font-serif mt-1">Edit College Information</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditingCollege(null)}>
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleUpdateCollege} className="space-y-4 text-xs sm:text-sm">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-foreground">College Name *</label>
                  <Input
                    required
                    value={editingCollege.name}
                    onChange={(e) => setEditingCollege({ ...editingCollege, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-foreground">Short Code *</label>
                    <Input
                      required
                      value={editingCollege.short_name || ""}
                      onChange={(e) => setEditingCollege({ ...editingCollege, short_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-foreground">Place *</label>
                    <Input
                      required
                      value={editingCollege.place}
                      onChange={(e) => setEditingCollege({ ...editingCollege, place: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-foreground">District *</label>
                    <Input
                      required
                      value={editingCollege.district || ""}
                      onChange={(e) => setEditingCollege({ ...editingCollege, district: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-foreground">State</label>
                    <Input
                      value={editingCollege.state || "Kerala"}
                      onChange={(e) => setEditingCollege({ ...editingCollege, state: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-foreground">Email Address</label>
                  <Input
                    type="email"
                    value={editingCollege.email || ""}
                    onChange={(e) => setEditingCollege({ ...editingCollege, email: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setEditingCollege(null)}>
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
      {/* MODAL: DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deletingCollege && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <Card className="w-full max-w-md shadow-2xl border-destructive/30 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="size-5" />
                <CardTitle className="text-lg font-serif">Confirm Deletion</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setDeletingCollege(null)}>
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs">
              <p className="text-foreground leading-relaxed">
                Are you sure you want to permanently delete College <strong>{deletingCollege.name}</strong> (<code>{deletingCollege.affno || deletingCollege.id}</code>)?
              </p>
              <p className="text-destructive leading-relaxed">
                This action cannot be undone. Associated student records under this college will need to be reassigned.
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" onClick={() => setDeletingCollege(null)} disabled={isPending}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isPending}>
                  {isPending ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                  Permanently Delete College
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
