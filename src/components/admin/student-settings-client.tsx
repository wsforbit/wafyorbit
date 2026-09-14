"use client";

import { useState, useTransition, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  PlusCircle,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  Edit2,
  X,
  Search,
  School,
  Layers,
  GraduationCap,
  MapPin,
  FileDown,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseCsvContent } from "@/lib/csv-parser";
import { formatStudentClass, CLASS_OPTIONS } from "@/lib/class-helper";
import {
  createStudentAction,
  bulkImportStudentsAction,
  updateStudentAction,
  deleteStudentAction,
  assignOrbitOrCollegeAction,
  type StudentFormPayload,
} from "@/app/admin/students/actions";
import type { Student, Orbit, College } from "@/types/database.types";

interface Props {
  initialStudents: Student[];
  orbits: Orbit[];
  colleges: College[];
}

export function StudentSettingsClient({ initialStudents, orbits, colleges }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Tab: 'manage' | 'single' | 'bulk' | 'unassigned'
  const [activeTab, setActiveTab] = useState<"manage" | "single" | "bulk" | "unassigned">("manage");

  // Banner Feedback
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Single Add Form State
  const [singleForm, setSingleForm] = useState<StudentFormPayload>({
    cicno: "",
    student_name: "",
    class_name: "1",
    place: "",
    panchayath: "",
    pin_code: "",
    phone: "",
    whatsapp: "",
    g_phone: "",
    role: "member",
    orbit_id: "none",
    affno: "none",
  });

  // Bulk CSV Sample Data without district column
  const sampleCsvData = `cicno,student_name,class_name,place,panchayath,pin_code,phone,whatsapp,g_phone,role,orbit_id,affno
CIC2025001,Ahmad Rayan,1,Manjeri,Manjeri Municipality,676121,9876543210,9876543210,9876543211,,${orbits[0]?.id || ""},${colleges[0]?.affno || colleges[0]?.id || ""}
CIC2025002,Bilal Farooq,F1,Calicut,Kakkodi Panchayath,673611,9876543212,9876543212,9876543213,,,${colleges[0]?.affno || colleges[0]?.id || ""}
CIC2025003,Hassan Munir,7,Aluva,Aluva Municipality,683101,9876543214,9876543214,9876543215,,,`;

  // Bulk CSV Input State
  const [csvContent, setCsvContent] = useState(sampleCsvData);

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Delete Modal State
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // Unassigned Allocation Row Selection
  const [allocatingCic, setAllocatingCic] = useState<string | null>(null);
  const [allocatingOrbit, setAllocatingOrbit] = useState<string>("none");
  const [allocatingCollege, setAllocatingCollege] = useState<string>("none");

  // Registry Search & Pagination State
  const [registrySearch, setRegistrySearch] = useState("");
  const [registryPage, setRegistryPage] = useState<number>(1);
  const [registryPageSize, setRegistryPageSize] = useState<number>(50);

  // Unassigned Allocations Pagination State
  const [unassignedPage, setUnassignedPage] = useState<number>(1);
  const [unassignedPageSize, setUnassignedPageSize] = useState<number>(50);

  // Reset pagination on search change
  useEffect(() => {
    setRegistryPage(1);
  }, [registrySearch, registryPageSize]);

  // Compute Unassigned Students
  const unassignedStudents = useMemo(() => {
    return initialStudents.filter(
      (s) => !s.orbit_id || !s.affno || s.orbit_id === "none" || s.affno === "none"
    );
  }, [initialStudents]);

  const filteredRegistry = useMemo(() => {
    const q = registrySearch.trim().toLowerCase();
    return initialStudents.filter((s) => {
      const cic = s.cicno || s.id || "";
      const sName = s.student_name || s.full_name || "";
      const formattedClass = formatStudentClass(s.class_name).toLowerCase();
      return (
        !q ||
        sName.toLowerCase().includes(q) ||
        cic.toLowerCase().includes(q) ||
        formattedClass.includes(q) ||
        s.place.toLowerCase().includes(q)
      );
    });
  }, [initialStudents, registrySearch]);

  // Registry pagination slices
  const totalRegistryPages = Math.max(1, Math.ceil(filteredRegistry.length / registryPageSize));
  const paginatedRegistry = useMemo(() => {
    const start = (registryPage - 1) * registryPageSize;
    return filteredRegistry.slice(start, start + registryPageSize);
  }, [filteredRegistry, registryPage, registryPageSize]);

  // Unassigned pagination slices
  const totalUnassignedPages = Math.max(1, Math.ceil(unassignedStudents.length / unassignedPageSize));
  const paginatedUnassigned = useMemo(() => {
    const start = (unassignedPage - 1) * unassignedPageSize;
    return unassignedStudents.slice(start, start + unassignedPageSize);
  }, [unassignedStudents, unassignedPage, unassignedPageSize]);

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
          message: `Loaded ${file.name} successfully into preview. Click 'Process & Import Students Batch' to proceed.`,
        });
      }
    };
    reader.onerror = () => {
      setFeedback({ type: "error", message: "Failed to read CSV file." });
    };
    reader.readAsText(file);
  };

  // Download Sample Template
  const handleDownloadSample = () => {
    const blob = new Blob([sampleCsvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "students_bulk_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Single Submit Handler
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await createStudentAction(singleForm);
      if (res.success) {
        setFeedback({
          type: "success",
          message: `Scholar '${singleForm.student_name}' (${singleForm.cicno}) enrolled successfully!`,
        });
        setSingleForm({
          cicno: "",
          student_name: "",
          class_name: "1",
          place: "",
          panchayath: "",
          pin_code: "",
          phone: "",
          whatsapp: "",
          g_phone: "",
          role: "member",
          orbit_id: "none",
          affno: "none",
        });
        router.refresh();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to create student." });
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

      const records: StudentFormPayload[] = [];
      for (let i = 1; i < parsedRows.length; i++) {
        const cleanCols = parsedRows[i];

        if (cleanCols.length < 4) {
          setFeedback({
            type: "error",
            message: `Row ${i + 1} has insufficient columns. Minimum required: cicno, student_name, class_name, place`,
          });
          return;
        }

        if (cleanCols.length === 13) {
          // Legacy 13-column format (with district at column 6)
          records.push({
            cicno: cleanCols[0],
            student_name: cleanCols[1],
            class_name: cleanCols[2],
            place: cleanCols[3],
            panchayath: cleanCols[4] || "",
            pin_code: cleanCols[5] || "",
            district: cleanCols[6] || cleanCols[3],
            phone: cleanCols[7] || "",
            whatsapp: cleanCols[8] || "",
            g_phone: cleanCols[9] || "",
            role: cleanCols[10] || "member",
            orbit_id: cleanCols[11] || null,
            affno: cleanCols[12] || null,
          });
        } else {
          // Standard 12-column format (without district)
          records.push({
            cicno: cleanCols[0],
            student_name: cleanCols[1],
            class_name: cleanCols[2],
            place: cleanCols[3],
            panchayath: cleanCols[4] || "",
            pin_code: cleanCols[5] || "",
            phone: cleanCols[6] || "",
            whatsapp: cleanCols[7] || "",
            g_phone: cleanCols[8] || "",
            role: cleanCols[9] || "member",
            orbit_id: cleanCols[10] || null,
            affno: cleanCols[11] || null,
          });
        }
      }

      startTransition(async () => {
        const res = await bulkImportStudentsAction(records);
        if (res.success) {
          setFeedback({
            type: "success",
            message: `Atomic bulk import succeeded! All ${res.count} student records processed and updated with database synchronization.`,
          });
          setCsvContent("cicno,student_name,class_name,place,panchayath,pin_code,phone,whatsapp,g_phone,role,orbit_id,affno\n");
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
  const handleUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setFeedback(null);

    const cic = editingStudent.cicno || editingStudent.id || "";
    if (!cic) return;

    startTransition(async () => {
      const res = await updateStudentAction(cic, {
        student_name: editingStudent.student_name || editingStudent.full_name || "",
        class_name: editingStudent.class_name,
        place: editingStudent.place,
        panchayath: editingStudent.panchayath || "",
        pin_code: editingStudent.pin_code || "",
        phone: editingStudent.phone || "",
        whatsapp: editingStudent.whatsapp || "",
        g_phone: editingStudent.g_phone || "",
        role: editingStudent.role || "member",
        orbit_id: editingStudent.orbit_id || null,
        affno: editingStudent.affno || null,
      });

      if (res.success) {
        setFeedback({ type: "success", message: `Student '${cic}' updated successfully.` });
        setEditingStudent(null);
        router.refresh();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to update student." });
      }
    });
  };

  // 4. Delete Handler
  const handleDeleteStudent = () => {
    if (!deletingStudent) return;
    setFeedback(null);

    const cic = deletingStudent.cicno || deletingStudent.id || "";
    if (!cic) return;

    startTransition(async () => {
      const res = await deleteStudentAction(cic);
      if (res.success) {
        setFeedback({ type: "success", message: `Scholar '${cic}' removed from registry.` });
        setDeletingStudent(null);
        router.refresh();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to delete student." });
      }
    });
  };

  // 5. Allocation Handler
  const handleSaveAllocation = (cic: string) => {
    setFeedback(null);

    startTransition(async () => {
      const res = await assignOrbitOrCollegeAction(
        cic,
        allocatingOrbit !== "none" ? allocatingOrbit : null,
        allocatingCollege !== "none" ? allocatingCollege : null
      );

      if (res.success) {
        setFeedback({
          type: "success",
          message: `Scholar '${cic}' successfully allocated to assigned jurisdiction!`,
        });
        setAllocatingCic(null);
        router.refresh();
      } else {
        setFeedback({ type: "error", message: res.error || "Allocation failed." });
      }
    });
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
          Student Registry ({initialStudents.length})
        </button>
        <button
          onClick={() => setActiveTab("single")}
          className={`px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
            activeTab === "single"
              ? "bg-secondary text-secondary-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Add Single Student
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
          onClick={() => setActiveTab("unassigned")}
          className={`px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === "unassigned"
              ? "bg-secondary text-secondary-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <span>Unassigned Allocations</span>
          {unassignedStudents.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
              {unassignedStudents.length}
            </Badge>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STUDENT REGISTRY & MANAGEMENT TABLE */}
      {/* ========================================================================= */}
      {activeTab === "manage" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">
                Scholars Registry & Database Records
              </h3>
              <p className="text-xs text-muted-foreground">
                Edit student profiles, assign orbit/college IDs, or remove scholar records.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search registry..."
                  value={registrySearch}
                  onChange={(e) => setRegistrySearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
              <select
                value={registryPageSize}
                onChange={(e) => setRegistryPageSize(Number(e.target.value))}
                className="h-9 rounded border border-input bg-background px-2 text-xs font-mono"
              >
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          </div>

          {filteredRegistry.length > 0 ? (
            <div className="space-y-3">
              <Table className="bg-card">
                <TableHeader>
                  <TableRow>
                    <TableHead>CIC No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Academic Stage</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Orbit</TableHead>
                    <TableHead>College</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRegistry.map((student) => {
                    const cic = student.cicno || student.id;
                    const sName = student.student_name || student.full_name;

                    return (
                      <TableRow key={cic} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs font-bold text-primary">
                          {cic}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {sName}
                        </TableCell>
                        <TableCell className="text-xs font-mono font-medium">
                          <Badge variant="secondary" className="text-[11px]">
                            {formatStudentClass(student.class_name)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {student.place} {student.panchayath ? `• ${student.panchayath}` : ""}
                        </TableCell>
                        <TableCell className="text-xs">
                          {student.orbit ? (
                            <span className="font-medium text-foreground">{student.orbit.name}</span>
                          ) : student.orbit_id ? (
                            <span className="font-mono">{student.orbit_id}</span>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground italic">
                              Unassigned
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {student.college ? (
                            <span className="text-muted-foreground">{student.college.name}</span>
                          ) : student.affno ? (
                            <span className="font-mono">{student.affno}</span>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground italic">
                              Unassigned
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingStudent(student)}
                              className="size-7 text-muted-foreground hover:text-foreground"
                              title="Edit Student"
                            >
                              <Edit2 className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingStudent(student)}
                              className="size-7 text-muted-foreground hover:text-destructive"
                              title="Delete Student"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Registry Pagination Controls */}
              {totalRegistryPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card text-xs">
                  <div className="text-muted-foreground font-mono">
                    Showing Page <strong>{registryPage}</strong> of <strong>{totalRegistryPages}</strong> ({filteredRegistry.length} total scholars)
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      onClick={() => setRegistryPage(1)}
                      disabled={registryPage === 1}
                    >
                      <ChevronsLeft className="size-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      onClick={() => setRegistryPage((p) => Math.max(1, p - 1))}
                      disabled={registryPage === 1}
                    >
                      <ChevronLeft className="size-3.5" />
                    </Button>
                    <span className="px-2 font-mono text-xs">Page {registryPage}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      onClick={() => setRegistryPage((p) => Math.min(totalRegistryPages, p + 1))}
                      disabled={registryPage === totalRegistryPages}
                    >
                      <ChevronRight className="size-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      onClick={() => setRegistryPage(totalRegistryPages)}
                      disabled={registryPage === totalRegistryPages}
                    >
                      <ChevronsRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card className="text-center py-10 border-dashed">
              <CardContent className="space-y-2">
                <GraduationCap className="size-8 text-muted-foreground mx-auto" />
                <div className="font-medium text-sm text-foreground">No students in registry</div>
                <p className="text-xs text-muted-foreground">
                  Use the 'Add Single Student' or 'Bulk CSV Import' tabs above to populate scholars.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ADD SINGLE STUDENT FORM */}
      {/* ========================================================================= */}
      {activeTab === "single" && (
        <Card className="max-w-3xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-[10px]">Auto Role: Member</Badge>
              <Badge variant="secondary" className="text-[10px]">Flexible ID Links</Badge>
            </div>
            <CardTitle className="text-xl font-serif">Enroll New Scholar</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Register a student into the institutional database. Orbit and College affiliations can be assigned now or left blank for future allocation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground font-mono">
                    CIC Number (Unique ID) *
                  </label>
                  <Input
                    required
                    placeholder="e.g. CIC2025001"
                    value={singleForm.cicno}
                    onChange={(e) => setSingleForm({ ...singleForm, cicno: e.target.value })}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Student Full Name *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Ahmad Rayan"
                    value={singleForm.student_name}
                    onChange={(e) => setSingleForm({ ...singleForm, student_name: e.target.value })}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Academic Class / Stage *
                  </label>
                  <select
                    value={singleForm.class_name}
                    onChange={(e) => setSingleForm({ ...singleForm, class_name: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring font-mono"
                    disabled={isPending}
                  >
                    {CLASS_OPTIONS.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Place / Village *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Manjeri"
                    value={singleForm.place}
                    onChange={(e) => setSingleForm({ ...singleForm, place: e.target.value })}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Panchayath / Local Body
                  </label>
                  <Input
                    placeholder="e.g. Manjeri Municipality"
                    value={singleForm.panchayath || ""}
                    onChange={(e) => setSingleForm({ ...singleForm, panchayath: e.target.value })}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    PIN Code
                  </label>
                  <Input
                    placeholder="e.g. 676121"
                    value={singleForm.pin_code || ""}
                    onChange={(e) => setSingleForm({ ...singleForm, pin_code: e.target.value })}
                    disabled={isPending}
                  />
                </div>
              </div>

              {/* Affiliation Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-lg bg-secondary/30 border border-border">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Affiliated College (Optional)
                  </label>
                  <select
                    value={singleForm.affno || "none"}
                    onChange={(e) => setSingleForm({ ...singleForm, affno: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                    disabled={isPending}
                  >
                    <option value="none">-- Select College (Optional) --</option>
                    {colleges.map((c) => (
                      <option key={c.affno || c.id} value={c.affno || c.id}>
                        {c.name} ({c.affno || c.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Assigned Orbit (Optional)
                  </label>
                  <select
                    value={singleForm.orbit_id || "none"}
                    onChange={(e) => setSingleForm({ ...singleForm, orbit_id: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                    disabled={isPending}
                  >
                    <option value="none">-- Select Orbit (Optional) --</option>
                    {orbits.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Phone Number
                  </label>
                  <Input
                    placeholder="e.g. 9876543210"
                    value={singleForm.phone || ""}
                    onChange={(e) => setSingleForm({ ...singleForm, phone: e.target.value })}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    WhatsApp Number
                  </label>
                  <Input
                    placeholder="e.g. 9876543210"
                    value={singleForm.whatsapp || ""}
                    onChange={(e) => setSingleForm({ ...singleForm, whatsapp: e.target.value })}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Guardian Phone
                  </label>
                  <Input
                    placeholder="e.g. 9876543211"
                    value={singleForm.g_phone || ""}
                    onChange={(e) => setSingleForm({ ...singleForm, g_phone: e.target.value })}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={isPending} className="gap-2 text-xs">
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : <PlusCircle className="size-4" />}
                  Register & Save Scholar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BULK CSV IMPORT */}
      {/* ========================================================================= */}
      {activeTab === "bulk" && (
        <Card className="max-w-4xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-[10px]">Upsert Sync Active</Badge>
              <Badge variant="secondary" className="text-[10px]">Auto 'Member' Role</Badge>
            </div>
            <CardTitle className="text-xl font-serif">Bulk Scholars Import (CSV / TSV)</CardTitle>
            <CardDescription className="text-xs leading-relaxed space-y-1">
              <div>
                Upload CSV or paste rows directly. In-batch duplicate CIC numbers abort the batch. Existing CIC records in the database are updated with new values.
              </div>
              <div className="font-mono text-[11px] text-foreground font-semibold pt-1">
                Class values: 1 to 8 (Thamheediyya & Aliya / PG) or F1, F2, F3 (8th-10th Standard). Role can be left blank.
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* File Upload Bar & Sample Download */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-secondary/40 border border-border">
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv,.tsv,text/tab-separated-values"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="student-csv-file-input"
                />
                <label htmlFor="student-csv-file-input">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="size-3.5" />
                    <span>Choose .CSV File</span>
                  </Button>
                </label>
                <span className="text-xs text-muted-foreground">or copy-paste spreadsheet rows below</span>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDownloadSample}
                className="gap-1.5 text-xs text-primary hover:bg-secondary"
              >
                <FileDown className="size-3.5" />
                <span>Download Sample Template</span>
              </Button>
            </div>

            {/* CSV Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span>CSV / Spreadsheet Payload (Header required)</span>
                <span>{csvContent.trim().split("\n").length - 1} data rows detected</span>
              </div>
              <textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                rows={10}
                className="w-full rounded-md border border-input bg-card px-3 py-2 text-xs font-mono shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring leading-relaxed"
                placeholder="cicno,student_name,class_name,place,panchayath,pin_code,phone,whatsapp,g_phone,role,orbit_id,affno"
                disabled={isPending}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCsvContent(sampleCsvData)}
                className="text-xs"
              >
                Reset to Sample
              </Button>

              <Button
                onClick={handleCsvImport}
                disabled={isPending}
                className="gap-2 text-xs"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Processing and synchronizing scholars...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="size-4" />
                    Process & Import Students Batch
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: UNASSIGNED SCHOLARS ALLOCATION CONSOLE */}
      {/* ========================================================================= */}
      {activeTab === "unassigned" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">
                Unassigned Scholars Allocation Console
              </h3>
              <p className="text-xs text-muted-foreground">
                Scholars with missing Orbit or College affiliations. Assign them directly to their jurisdictional units.
              </p>
            </div>
            {unassignedStudents.length > 0 && (
              <select
                value={unassignedPageSize}
                onChange={(e) => setUnassignedPageSize(Number(e.target.value))}
                className="h-8 rounded border border-input bg-background px-2 text-xs font-mono"
              >
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            )}
          </div>

          {unassignedStudents.length > 0 ? (
            <div className="space-y-3">
              <Table className="bg-card">
                <TableHeader>
                  <TableRow>
                    <TableHead>CIC No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Academic Stage</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Assign Orbit</TableHead>
                    <TableHead>Assign College</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUnassigned.map((s) => {
                    const cic = s.cicno || s.id;
                    const isEditingThis = allocatingCic === cic;

                    return (
                      <TableRow key={cic} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs font-bold text-primary">
                          {cic}
                        </TableCell>
                        <TableCell className="font-medium text-foreground text-xs">
                          {s.student_name || s.full_name}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          <Badge variant="secondary" className="text-[10px]">
                            {formatStudentClass(s.class_name)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {s.place} {s.panchayath ? `• ${s.panchayath}` : ""}
                        </TableCell>
                        
                        {/* Orbit Selection */}
                        <TableCell>
                          {isEditingThis ? (
                            <select
                              value={allocatingOrbit}
                              onChange={(e) => setAllocatingOrbit(e.target.value)}
                              className="h-8 rounded border border-input bg-background px-2 text-xs"
                            >
                              <option value="none">-- Select Orbit --</option>
                              {orbits.map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.name} ({o.id})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs">
                              {s.orbit ? s.orbit.name : s.orbit_id || <span className="italic text-muted-foreground">None</span>}
                            </span>
                          )}
                        </TableCell>

                        {/* College Selection */}
                        <TableCell>
                          {isEditingThis ? (
                            <select
                              value={allocatingCollege}
                              onChange={(e) => setAllocatingCollege(e.target.value)}
                              className="h-8 rounded border border-input bg-background px-2 text-xs"
                            >
                              <option value="none">-- Select College --</option>
                              {colleges.map((c) => (
                                <option key={c.affno || c.id} value={c.affno || c.id}>
                                  {c.short_name || c.name} ({c.affno || c.id})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs">
                              {s.college ? s.college.name : s.affno || <span className="italic text-muted-foreground">None</span>}
                            </span>
                          )}
                        </TableCell>

                        {/* Allocation Action Buttons */}
                        <TableCell className="text-right">
                          {isEditingThis ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                onClick={() => handleSaveAllocation(cic)}
                                disabled={isPending}
                                className="h-7 text-xs px-2.5"
                              >
                                Save
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setAllocatingCic(null)}
                                className="h-7 text-xs px-2"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setAllocatingCic(cic || null);
                                setAllocatingOrbit(s.orbit_id || "none");
                                setAllocatingCollege(s.affno || "none");
                              }}
                              className="h-7 text-xs gap-1"
                            >
                              <Sparkles className="size-3" />
                              <span>Allocate</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Unassigned Pagination Controls */}
              {totalUnassignedPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card text-xs">
                  <div className="text-muted-foreground font-mono">
                    Showing Page <strong>{unassignedPage}</strong> of <strong>{totalUnassignedPages}</strong> ({unassignedStudents.length} unassigned scholars)
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      onClick={() => setUnassignedPage(1)}
                      disabled={unassignedPage === 1}
                    >
                      <ChevronsLeft className="size-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      onClick={() => setUnassignedPage((p) => Math.max(1, p - 1))}
                      disabled={unassignedPage === 1}
                    >
                      <ChevronLeft className="size-3.5" />
                    </Button>
                    <span className="px-2 font-mono text-xs">Page {unassignedPage}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      onClick={() => setUnassignedPage((p) => Math.min(totalUnassignedPages, p + 1))}
                      disabled={unassignedPage === totalUnassignedPages}
                    >
                      <ChevronRight className="size-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      onClick={() => setUnassignedPage(totalUnassignedPages)}
                      disabled={unassignedPage === totalUnassignedPages}
                    >
                      <ChevronsRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card className="text-center py-10 border-dashed bg-card/60">
              <CardContent className="space-y-2">
                <CheckCircle2 className="size-9 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <div className="font-serif font-bold text-foreground">
                  All Scholars Successfully Allocated!
                </div>
                <p className="text-xs text-muted-foreground">
                  Every student in the database is currently connected to both an Orbit and an Affiliated College.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT MODAL */}
      {/* ========================================================================= */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <Card className="w-full max-w-xl shadow-2xl border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
              <div className="space-y-0.5">
                <Badge variant="default" className="text-[10px] font-mono">
                  {editingStudent.cicno || editingStudent.id}
                </Badge>
                <CardTitle className="text-lg font-serif">Edit Scholar Details</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingStudent(null)}
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleUpdateStudent} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Student Name</label>
                    <Input
                      required
                      value={editingStudent.student_name || editingStudent.full_name || ""}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, student_name: e.target.value })
                      }
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Academic Stage</label>
                    <select
                      value={editingStudent.class_name}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, class_name: e.target.value })
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-2xs font-mono"
                      disabled={isPending}
                    >
                      {CLASS_OPTIONS.map((opt) => (
                        <option key={opt.code} value={opt.code}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Place / Village</label>
                    <Input
                      required
                      value={editingStudent.place}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, place: e.target.value })
                      }
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Panchayath</label>
                    <Input
                      value={editingStudent.panchayath || ""}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, panchayath: e.target.value })
                      }
                      disabled={isPending}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Assigned Orbit</label>
                    <select
                      value={editingStudent.orbit_id || "none"}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, orbit_id: e.target.value })
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                      disabled={isPending}
                    >
                      <option value="none">-- None / Unassigned --</option>
                      {orbits.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name} ({o.id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Affiliated College</label>
                    <select
                      value={editingStudent.affno || "none"}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, affno: e.target.value })
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                      disabled={isPending}
                    >
                      <option value="none">-- None / Unassigned --</option>
                      {colleges.map((c) => (
                        <option key={c.affno || c.id} value={c.affno || c.id}>
                          {c.short_name || c.name} ({c.affno || c.id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Phone</label>
                    <Input
                      value={editingStudent.phone || ""}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, phone: e.target.value })
                      }
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">WhatsApp</label>
                    <Input
                      value={editingStudent.whatsapp || ""}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, whatsapp: e.target.value })
                      }
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Guardian Phone</label>
                    <Input
                      value={editingStudent.g_phone || ""}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, g_phone: e.target.value })
                      }
                      disabled={isPending}
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingStudent(null)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending} className="text-xs">
                    {isPending ? <Loader2 className="size-3.5 animate-spin" /> : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE MODAL */}
      {/* ========================================================================= */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <Card className="w-full max-w-md shadow-2xl border-destructive/30 bg-card">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg font-serif text-destructive flex items-center gap-2">
                <Trash2 className="size-5" />
                Confirm Scholar Removal
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Are you sure you want to delete{" "}
                <strong>{deletingStudent.student_name || deletingStudent.full_name}</strong> (
                {deletingStudent.cicno || deletingStudent.id})? This action is permanent.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingStudent(null)}
                disabled={isPending}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteStudent}
                disabled={isPending}
                className="text-xs gap-1.5"
              >
                {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                Delete Record
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
