"use client";

import { useState, useTransition, useRef, useEffect, useMemo } from "react";
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
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  Mail,
  Lock,
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
  getOrbitAuthCredentialsAction,
  type OrbitFormPayload,
} from "@/app/admin/orbit/actions";
import type { Orbit, OrbitStatus } from "@/types/database.types";

interface Props {
  initialOrbits: Orbit[];
}

export function OrbitSettingsClient({ initialOrbits }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [orbits, setOrbits] = useState<Orbit[]>(initialOrbits);

  // Sync state whenever initialOrbits prop changes from server
  useEffect(() => {
    setOrbits(initialOrbits);
  }, [initialOrbits]);

  const [activeTab, setActiveTab] = useState<"manage" | "single" | "bulk" | "merge">("manage");
  const [isPending, startTransition] = useTransition();

  // Search Query for Manage Tab Table
  const [searchQuery, setSearchQuery] = useState("");

  // Banner Feedback
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Auth Credentials Modal State (When Single Add creates new)
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
  const [editName, setEditName] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [editTaluk, setEditTaluk] = useState("");
  const [editState, setEditState] = useState("Kerala");
  const [editStatus, setEditStatus] = useState<OrbitStatus>("active");
  const [editConstituency, setEditConstituency] = useState("");
  const [editPanchayaths, setEditPanchayaths] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Leader Auth Edit State
  const [editEmail, setEditEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [copiedOldPass, setCopiedOldPass] = useState(false);

  // Delete Modal State
  const [deletingOrbit, setDeletingOrbit] = useState<Orbit | null>(null);

  // Merge State
  const [sourceOrbitId, setSourceOrbitId] = useState<string>("");
  const [targetOrbitId, setTargetOrbitId] = useState<string>("");
  const [showMergeConfirm, setShowMergeConfirm] = useState(false);

  // Filtered Orbits for Table Search
  const filteredOrbits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orbits;
    return orbits.filter((o) => {
      return (
        o.id.toLowerCase().includes(q) ||
        o.name.toLowerCase().includes(q) ||
        o.district.toLowerCase().includes(q) ||
        o.taluk.toLowerCase().includes(q) ||
        (o.constituency && o.constituency.toLowerCase().includes(q)) ||
        (o.panchayaths && o.panchayaths.toLowerCase().includes(q))
      );
    });
  }, [orbits, searchQuery]);

  // Active Orbits for Merge Selection
  const activeOrbits = useMemo(() => {
    return orbits.filter((o) => o.status === "active");
  }, [orbits]);

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

  // Open Edit Modal with Pre-populated details & fetch actual leader auth credentials
  const handleOpenEdit = (orbit: Orbit) => {
    setEditingOrbit(orbit);
    setEditName(orbit.name);
    setEditDistrict(orbit.district);
    setEditTaluk(orbit.taluk);
    setEditState(orbit.state || "Kerala");
    setEditStatus(orbit.status);
    setEditConstituency(orbit.constituency || "");
    setEditPanchayaths(orbit.panchayaths || "");
    setEditDescription(orbit.description || "");

    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setShowOldPassword(false);
    setCopiedOldPass(false);

    // Default formula fallback while fetching
    const firstWord = orbit.name.trim().split(/[\s,]+/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") || "orbit";
    setEditEmail(`${firstWord}@orbit.com`);
    setCurrentPassword(`${orbit.id}_${firstWord}`);
    setIsLoadingAuth(true);

    getOrbitAuthCredentialsAction(orbit.id, orbit.name)
      .then((res) => {
        if (res.success) {
          if (res.email) setEditEmail(res.email);
          if (res.currentPassword) setCurrentPassword(res.currentPassword);
        }
      })
      .finally(() => {
        setIsLoadingAuth(false);
      });
  };

  // Copy Old Password
  const handleCopyOldPassword = () => {
    if (!currentPassword) return;
    navigator.clipboard.writeText(currentPassword);
    setCopiedOldPass(true);
    setTimeout(() => setCopiedOldPass(false), 2000);
  };

  // 3. Edit Handler
  const handleUpdateOrbit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrbit) return;
    setFeedback(null);

    // Validate passwords if entered (password need to enter two times)
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setFeedback({
          type: "error",
          message: "New Password and Confirm New Password do not match. Please verify both password fields.",
        });
        return;
      }
      if (newPassword.length < 6) {
        setFeedback({
          type: "error",
          message: "New Password must be at least 6 characters long.",
        });
        return;
      }
    }

    startTransition(async () => {
      const res = await updateOrbitAction(editingOrbit.id, {
        name: editName,
        status: editStatus,
        state: editState,
        district: editDistrict,
        taluk: editTaluk,
        constituency: editConstituency || undefined,
        panchayaths: editPanchayaths || undefined,
        description: editDescription || undefined,
        email: editEmail,
        newPassword: newPassword || undefined,
      });

      if (res.success) {
        // Optimistically update local orbits state immediately
        setOrbits((prev) =>
          prev.map((o) =>
            o.id === editingOrbit.id
              ? {
                  ...o,
                  name: editName.trim(),
                  status: editStatus,
                  state: editState,
                  district: editDistrict.trim(),
                  taluk: editTaluk.trim(),
                  constituency: editConstituency.trim() || null,
                  panchayaths: editPanchayaths.trim() || null,
                  description: editDescription.trim() || null,
                }
              : o
          )
        );

        let successMsg = `Orbit '${editingOrbit.id}' (${editName}) updated successfully.`;
        if (newPassword) {
          successMsg += ` Leader password updated to '${newPassword}' without verification.`;
        }
        if (editEmail) {
          successMsg += ` Login email: ${editEmail}.`;
        }

        setFeedback({
          type: "success",
          message: successMsg,
        });
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
        setOrbits((prev) => prev.filter((o) => o.id !== deletingOrbit.id));
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
        setOrbits((prev) =>
          prev.map((o) => (o.id === sourceOrbitId ? { ...o, status: "inactive" } : o))
        );
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
          All Orbits ({orbits.length})
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">
                Orbit Directory & Governance
              </h3>
              <p className="text-xs text-muted-foreground">
                View, edit details, or toggle status of all registered institutional orbits.
              </p>
            </div>

            {/* Quick Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search orbits (name, ID, district)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs font-mono"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2 text-[10px] text-muted-foreground hover:text-foreground font-mono"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono px-1">
            <span>
              Showing <strong>{filteredOrbits.length}</strong> of <strong>{orbits.length}</strong> registered orbits
            </span>
          </div>

          {filteredOrbits.length > 0 ? (
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
                {filteredOrbits.map((orbit) => (
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
                        onClick={() => handleOpenEdit(orbit)}
                        className="h-8 px-2 text-xs gap-1 cursor-pointer"
                      >
                        <Edit2 className="size-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeletingOrbit(orbit)}
                        className="h-8 px-2 text-xs gap-1 cursor-pointer"
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
            <div className="text-xs text-muted-foreground italic py-10 text-center border rounded-md bg-card space-y-2">
              <p>No orbits match your query "{searchQuery}".</p>
              {searchQuery && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSearchQuery("")}
                  className="text-xs h-7"
                >
                  Reset Search
                </Button>
              )}
            </div>
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
      {/* MODAL: EDIT ORBIT & LEADER AUTH MODAL */}
      {/* ========================================================================= */}
      {editingOrbit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <Card className="w-full max-w-xl shadow-2xl border-border bg-card my-8 max-h-[92vh] flex flex-col overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border bg-muted/20 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-[10px] font-mono uppercase bg-primary">
                    ID: {editingOrbit.id}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground font-mono">Orbit Governance</span>
                </div>
                <CardTitle className="text-lg font-serif mt-1">Edit Orbit & Leader Login</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingOrbit(null)}
                className="cursor-pointer"
              >
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4 overflow-y-auto flex-1 space-y-4">
              <form id="edit-orbit-form" onSubmit={handleUpdateOrbit} className="space-y-4 text-xs sm:text-sm">
                
                {/* 1. Orbit Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-foreground">
                    Orbit Full Name *
                  </label>
                  <Input
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Calicut North Orbit"
                    disabled={isPending}
                  />
                </div>

                {/* 2. District & Taluk */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-foreground">
                      District *
                    </label>
                    <Input
                      required
                      value={editDistrict}
                      onChange={(e) => setEditDistrict(e.target.value)}
                      placeholder="e.g. Kozhikode"
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-foreground">
                      Taluk *
                    </label>
                    <Input
                      required
                      value={editTaluk}
                      onChange={(e) => setEditTaluk(e.target.value)}
                      placeholder="e.g. Kozhikode Taluk"
                      disabled={isPending}
                    />
                  </div>
                </div>

                {/* 3. Status & Constituency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-foreground">
                      Operational Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as OrbitStatus)}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground cursor-pointer"
                      disabled={isPending}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-foreground">
                      Assembly Constituency
                    </label>
                    <Input
                      value={editConstituency}
                      onChange={(e) => setEditConstituency(e.target.value)}
                      placeholder="e.g. Elathur"
                      disabled={isPending}
                    />
                  </div>
                </div>

                {/* 4. Panchayaths */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-foreground">
                    Panchayaths / Local Bodies
                  </label>
                  <Input
                    value={editPanchayaths}
                    onChange={(e) => setEditPanchayaths(e.target.value)}
                    placeholder="e.g. Kakkodi, Chelannur, Kakkur"
                    disabled={isPending}
                  />
                </div>

                {/* 5. Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-foreground">
                    Description / Operational Notes
                  </label>
                  <Input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Operational notes or collegiate cluster details"
                    disabled={isPending}
                  />
                </div>

                {/* ========================================================================= */}
                {/* SECTION: LEADER AUTH CREDENTIALS (EMAIL & PASSWORD) */}
                {/* ========================================================================= */}
                <div className="border-t border-border pt-4 mt-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded bg-primary/10 flex items-center justify-center text-primary">
                        <Key className="size-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-serif font-bold text-foreground">
                          Orbit Leader Login Credentials
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Directly update login email & password without verification.
                        </p>
                      </div>
                    </div>
                    {isLoadingAuth && (
                      <div className="flex items-center gap-1.5 text-[11px] text-primary font-mono">
                        <Loader2 className="size-3 animate-spin" />
                        <span>Fetching auth...</span>
                      </div>
                    )}
                  </div>

                  {/* Leader Email Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-foreground flex items-center gap-1.5">
                      <Mail className="size-3.5 text-primary" />
                      <span>Leader Login Email *</span>
                    </label>
                    <Input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="e.g. calicut@orbit.com"
                      className="font-mono text-xs"
                      disabled={isPending || isLoadingAuth}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      This is the email address used to log in at <code>/auth/login</code>. Changed immediately with auto-confirmation.
                    </p>
                  </div>

                  {/* Password Entering (Entered Two Times) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase text-foreground flex items-center gap-1.5">
                        <Lock className="size-3.5 text-primary" />
                        <span>Set New Password (Enter Two Times)</span>
                      </label>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Leave blank to keep existing
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Password Entry 1 */}
                      <div className="space-y-1">
                        <div className="relative">
                          <Input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="font-mono text-xs pr-8"
                            disabled={isPending || isLoadingAuth}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-2 top-2 text-muted-foreground hover:text-foreground p-0.5"
                            title={showNewPassword ? "Hide password" : "Show password"}
                          >
                            {showNewPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                          </button>
                        </div>
                        <span className="text-[10px] text-muted-foreground block">
                          Min. 6 characters
                        </span>
                      </div>

                      {/* Password Entry 2: Confirm */}
                      <div className="space-y-1">
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="font-mono text-xs pr-8"
                            disabled={isPending || isLoadingAuth}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2 top-2 text-muted-foreground hover:text-foreground p-0.5"
                            title={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                          </button>
                        </div>
                        {newPassword && confirmPassword && (
                          <span
                            className={`text-[10px] block font-mono ${
                              newPassword === confirmPassword
                                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                : "text-destructive font-semibold"
                            }`}
                          >
                            {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* DISPLAY OLD PASSWORD DIRECTLY BELOW PASSWORD ENTERING */}
                  <div className="p-3 rounded-lg bg-muted/60 border border-border/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Key className="size-3.5 text-primary" />
                        <span className="text-[11px] font-mono font-bold uppercase text-foreground">
                          Current / Old Active Password:
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-mono text-primary border-primary/30">
                        Active in System
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-background border border-border">
                      <span className="font-mono text-xs sm:text-sm font-bold text-foreground tracking-wide select-all">
                        {showOldPassword ? currentPassword || "—" : "••••••••••••"}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          {showOldPassword ? (
                            <>
                              <EyeOff className="size-3" />
                              <span>Hide</span>
                            </>
                          ) : (
                            <>
                              <Eye className="size-3" />
                              <span>Show</span>
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCopyOldPassword}
                          className="h-7 px-2 text-[11px] gap-1 cursor-pointer"
                        >
                          {copiedOldPass ? (
                            <>
                              <Check className="size-3 text-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="size-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      💡 <strong>Note:</strong> No need to enter this old password to set a new one. Enter a new password twice above only if you wish to change it.
                    </p>
                  </div>

                </div>

                {/* Modal Footer Actions */}
                <div className="flex justify-end gap-2 pt-3 border-t border-border shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingOrbit(null)}
                    disabled={isPending}
                    className="cursor-pointer text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending || (Boolean(newPassword) && newPassword !== confirmPassword)}
                    className="gap-2 text-xs cursor-pointer"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-3.5" />
                        Save Changes
                      </>
                    )}
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
