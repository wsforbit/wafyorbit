"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Mail,
  Send,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Layers,
  Settings2,
  FileText,
  School,
  MapPin,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  sendBulkCollegeEmailsAction,
  type BulkEmailMessage,
  type SendEmailResult,
} from "@/app/admin/college/actions";
import type { College } from "@/types/database.types";

interface Props {
  colleges: College[];
  isOpen: boolean;
  onClose: () => void;
  preSelectedAffnos?: string[];
}

interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
}

function extractFirstWord(text: string): string {
  if (!text) return "college";
  const clean = text.trim().split(/[\s,]+/)[0];
  return clean.toLowerCase().replace(/[^a-z0-9]/g, "") || "college";
}

const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: "portal_credentials",
    name: "🔑 Portal Login & Coordinator Credentials",
    description: "Send official portal access credentials and coordinator instructions.",
    subject: "Official Wafy Orbit Portal Access Credentials - {{name}} ({{affno}})",
    body: `Respected Principal / Institutional Coordinator,
{{name}} ({{place}}, {{district}})

We are pleased to inform you that your official institutional portal for the Wafy Orbit Academic & Regional Leadership System is now active.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTITUTIONAL LOGIN CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Campus Affiliation No: {{affno}}
• Campus Short Name: {{short_name}}
• Portal Login URL: https://wafyorbit.vercel.app/auth/login
• Authorized User ID / Email: {{portal_email}}
• Default Portal Password: {{portal_password}}
• Current Registered Scholars: {{student_count}}
• Assigned Orbit Leaders: {{leader_count}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMMEDIATE ACTION ITEMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Login to the portal using the credentials provided above.
2. Review your campus scholar enrollment roster.
3. Access the 'Update Student Orbit Assignments' console (https://wafyorbit.vercel.app/college/update-orbit) to assign unallocated scholars to their respective regional Orbits.
4. Ensure all Thamheediyya & Aliya batch records are accurately verified.

For technical assistance or institutional inquiries, please reach out to central administration.

Warm regards,
Central Administration
Wafy Orbit Governance System
Official Portal: https://wafyorbit.vercel.app`,
  },
  {
    id: "orbit_allocation_notice",
    name: "📋 Scholar Orbit Verification & Allocation Notice",
    description: "Request campus authorities to complete pending orbit assignments.",
    subject: "Urgent: Orbit Allocation & Scholar Verification Required - {{name}}",
    body: `Respected Authorities of {{name}} ({{affno}}),

This is a scheduled notification from the Wafy Orbit Directorate regarding the regional orbit delegation for {{name}} in {{district}}.

Currently, your institution has {{student_count}} registered scholars in the central registry. Please verify that each scholar from your campus is accurately mapped to their home regional Orbit.

Direct Link for Orbit Management:
https://wafyorbit.vercel.app/college/update-orbit

Please complete this verification at your earliest convenience to facilitate central academic coordination.

Sincerely,
Wafy Orbit Central Committee
https://wafyorbit.vercel.app`,
  },
  {
    id: "general_circular",
    name: "📢 Official Circular & Academic Directive",
    description: "General circular to all affiliated college principals and coordinators.",
    subject: "Official Directive for Affiliated Institutions - {{name}} ({{affno}})",
    body: `To,
The Principal / Campus Coordinator,
{{name}}
{{place}}, {{district}} (Affiliation No: {{affno}})

Subject: Official Academic Circular from Wafy Orbit Central Administration

Dear Sir/Madam,

Please find this official communication regarding upcoming regional academic and leadership programs for the current term.

Summary for {{name}}:
• Campus: {{short_name}} ({{affno}})
• Location: {{place}}, {{district}}
• Scholar Strength: {{student_count}} Enrolled Scholars
• Orbit Leadership Unit: {{leader_count}} Designated Leaders

Please ensure all department coordinators and students are informed of the latest central guidelines.

Warm regards,
General Secretary
Coordination of Islamic Colleges (CIC) - Wafy Orbit Directorate
https://wafyorbit.vercel.app`,
  },
  {
    id: "custom",
    name: "✏️ Custom Blank Template",
    description: "Draft your own customized message from scratch.",
    subject: "Notification from Wafy Orbit Central - {{name}}",
    body: `Dear Coordinator, {{name}} ({{affno}}),

Please write your message here.

You can include dynamic tags such as {{name}}, {{affno}}, {{place}}, {{district}}, {{student_count}}, and {{portal_email}}.

Warm regards,
Wafy Orbit Administration`,
  },
];

export function CollegeMailMergeModal({
  colleges,
  isOpen,
  onClose,
  preSelectedAffnos,
}: Props) {
  // Navigation tabs: 'compose' | 'recipients' | 'preview' | 'dispatch'
  const [activeTab, setActiveTab] = useState<"compose" | "recipients" | "preview" | "dispatch">("compose");

  // Selected Colleges Affnos
  const [selectedAffnos, setSelectedAffnos] = useState<Set<string>>(() => {
    if (preSelectedAffnos && preSelectedAffnos.length > 0) {
      return new Set(preSelectedAffnos);
    }
    // Default to all colleges that have an email address
    const initial = new Set<string>();
    colleges.forEach((c) => {
      const aff = c.affno || c.id;
      if (aff && c.email) {
        initial.add(aff);
      }
    });
    return initial;
  });

  // Template State
  const [selectedPresetId, setSelectedPresetId] = useState<string>("portal_credentials");
  const [subjectTemplate, setSubjectTemplate] = useState<string>(TEMPLATE_PRESETS[0].subject);
  const [bodyTemplate, setBodyTemplate] = useState<string>(TEMPLATE_PRESETS[0].body);

  // Sender Config
  const [senderName, setSenderName] = useState("Wafy Orbit Administration");
  const [senderEmail, setSenderEmail] = useState("");
  const [resendApiKey, setResendApiKey] = useState("");

  // Search & Filter in Recipients Tab
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientDistrict, setRecipientDistrict] = useState("ALL");
  const [emailFilter, setEmailFilter] = useState<"ALL" | "WITH_EMAIL" | "MISSING_EMAIL">("ALL");

  // Preview Carousel Index
  const [previewIndex, setPreviewIndex] = useState(0);

  // Dispatch & Execution State
  const [isPending, startTransition] = useTransition();
  const [dispatchResults, setDispatchResults] = useState<SendEmailResult[] | null>(null);
  const [dispatchSummary, setDispatchSummary] = useState<string | null>(null);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  // Districts for Filter
  const uniqueDistricts = useMemo(() => {
    return Array.from(
      new Set(colleges.map((c) => c.district || c.place).filter(Boolean))
    ).sort();
  }, [colleges]);

  // Handle Preset Change
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = TEMPLATE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSubjectTemplate(preset.subject);
      setBodyTemplate(preset.body);
    }
  };

  // Helper to replace variables for a single college
  const mergeVariables = (text: string, college: College): string => {
    const affno = college.affno || college.id || "";
    const name = college.name || "";
    const shortName = college.short_name || name;
    const place = college.place || "";
    const district = college.district || place;
    const email = college.email || "No email on record";
    const studentCount = String(college.student_count ?? 0);
    const leaderCount = String(college.leader_count ?? 0);

    const firstWord = extractFirstWord(shortName);
    const portalEmail = `${firstWord}@orbit.com`;
    const portalPassword = `${affno}_${firstWord}`;

    return text
      .replace(/{{name}}/g, name)
      .replace(/{{college_name}}/g, name)
      .replace(/{{short_name}}/g, shortName)
      .replace(/{{affno}}/g, affno)
      .replace(/{{place}}/g, place)
      .replace(/{{district}}/g, district)
      .replace(/{{email}}/g, email)
      .replace(/{{student_count}}/g, studentCount)
      .replace(/{{leader_count}}/g, leaderCount)
      .replace(/{{portal_email}}/g, portalEmail)
      .replace(/{{portal_password}}/g, portalPassword)
      .replace(/{{portal_url}}/g, "https://wafyorbit.vercel.app/auth/login");
  };

  // List of selected colleges
  const selectedCollegesList = useMemo(() => {
    return colleges.filter((c) => {
      const aff = c.affno || c.id || "";
      return aff ? selectedAffnos.has(aff) : false;
    });
  }, [colleges, selectedAffnos]);

  // List of selected colleges with valid email
  const selectedCollegesWithEmail = useMemo(() => {
    return selectedCollegesList.filter((c) => Boolean(c.email && c.email.includes("@")));
  }, [selectedCollegesList]);

  // Filtered Recipients for the selection table
  const filteredRecipients = useMemo(() => {
    const q = recipientSearch.trim().toLowerCase();
    return colleges.filter((college) => {
      const aff = (college.affno || college.id || "").toLowerCase();
      const name = (college.name || "").toLowerCase();
      const short = (college.short_name || "").toLowerCase();
      const place = (college.place || "").toLowerCase();
      const dist = (college.district || college.place || "").toLowerCase();
      const email = (college.email || "").toLowerCase();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        aff.includes(q) ||
        short.includes(q) ||
        place.includes(q) ||
        dist.includes(q) ||
        email.includes(q);

      const collegeDist = college.district || college.place;
      const matchesDistrict =
        recipientDistrict === "ALL" || collegeDist === recipientDistrict;

      const hasEmail = Boolean(college.email && college.email.includes("@"));
      const matchesEmail =
        emailFilter === "ALL" ||
        (emailFilter === "WITH_EMAIL" && hasEmail) ||
        (emailFilter === "MISSING_EMAIL" && !hasEmail);

      return matchesSearch && matchesDistrict && matchesEmail;
    });
  }, [colleges, recipientSearch, recipientDistrict, emailFilter]);

  // Recipient selection toggles
  const toggleSelectAllRecipients = () => {
    const filteredValidAffnos = filteredRecipients
      .filter((c) => Boolean(c.email))
      .map((c) => c.affno || c.id || "")
      .filter((aff): aff is string => Boolean(aff));

    const allFilteredAreSelected = filteredValidAffnos.every((aff) =>
      selectedAffnos.has(aff)
    );

    const nextSet = new Set(selectedAffnos);
    if (allFilteredAreSelected) {
      filteredValidAffnos.forEach((aff) => nextSet.delete(aff));
    } else {
      filteredValidAffnos.forEach((aff) => nextSet.add(aff));
    }
    setSelectedAffnos(nextSet);
  };

  const toggleSelectAffno = (affno: string) => {
    if (!affno) return;
    const nextSet = new Set(selectedAffnos);
    if (nextSet.has(affno)) {
      nextSet.delete(affno);
    } else {
      nextSet.add(affno);
    }
    setSelectedAffnos(nextSet);
  };

  // Insert Variable at cursor/end
  const insertVariable = (variableTag: string, targetField: "subject" | "body") => {
    if (targetField === "subject") {
      setSubjectTemplate((prev) => `${prev} ${variableTag}`);
    } else {
      setBodyTemplate((prev) => `${prev} ${variableTag}`);
    }
  };

  // Prepare Merged Messages
  const preparedMessages: BulkEmailMessage[] = useMemo(() => {
    return selectedCollegesWithEmail.map((college) => {
      const affno = college.affno || college.id || "";
      const toEmail = college.email || "";
      const collegeName = college.name || "";
      const mergedSubject = mergeVariables(subjectTemplate, college);
      const mergedBody = mergeVariables(bodyTemplate, college);

      return {
        affno,
        collegeName,
        toEmail,
        subject: mergedSubject,
        bodyText: mergedBody,
      };
    });
  }, [selectedCollegesWithEmail, subjectTemplate, bodyTemplate]);

  // Current preview college
  const currentPreviewCollege = selectedCollegesList[previewIndex] || selectedCollegesList[0] || colleges[0];
  const previewSubject = currentPreviewCollege ? mergeVariables(subjectTemplate, currentPreviewCollege) : "";
  const previewBody = currentPreviewCollege ? mergeVariables(bodyTemplate, currentPreviewCollege) : "";

  // 1-Click Bulk Send Action
  const handleBulkSend = () => {
    if (preparedMessages.length === 0) return;

    setDispatchResults(null);
    setDispatchSummary(null);

    startTransition(async () => {
      const res = await sendBulkCollegeEmailsAction({
        messages: preparedMessages,
        senderName,
        senderEmail: senderEmail || undefined,
        resendApiKey: resendApiKey || undefined,
      });

      setDispatchResults(res.results);
      setDispatchSummary(res.message);
      setActiveTab("dispatch");
    });
  };

  // Copy merged email for current preview
  const handleCopyPreview = () => {
    const fullText = `Subject: ${previewSubject}\nTo: ${currentPreviewCollege?.email || "N/A"}\n\n${previewBody}`;
    navigator.clipboard.writeText(fullText);
    setCopiedStatus("preview");
    setTimeout(() => setCopiedStatus(null), 2500);
  };

  // Download CSV of all merged emails
  const handleDownloadCsv = () => {
    const headers = ["Affiliation No", "College Name", "Recipient Email", "Merged Subject", "Merged Body"];
    const rows = preparedMessages.map((msg) => [
      `"${msg.affno}"`,
      `"${msg.collegeName.replace(/"/g, '""')}"`,
      `"${msg.toEmail}"`,
      `"${msg.subject.replace(/"/g, '""')}"`,
      `"${msg.bodyText.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `wafy_colleges_mail_merge_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-card border border-border shadow-2xl rounded-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* ========================================================================= */}
        {/* MODAL HEADER */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Mail className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-[10px] font-mono uppercase">
                  Mail Merge Engine
                </Badge>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {selectedCollegesWithEmail.length} / {colleges.length} Campuses Selected
                </Badge>
              </div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-foreground mt-0.5">
                Bulk Email Dispatch & Mail Merge Console
              </h2>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* ========================================================================= */}
        {/* SUB-TABS NAVIGATION BAR */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-1 sm:gap-2 px-4 py-2 border-b border-border bg-card/60 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("compose")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === "compose"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <FileText className="size-3.5" />
            <span>1. Compose & Template</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("recipients")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === "recipients"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Users className="size-3.5" />
            <span>2. Select Recipients ({selectedCollegesWithEmail.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === "preview"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Sparkles className="size-3.5" />
            <span>3. Live Merge Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("dispatch")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === "dispatch"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Send className="size-3.5" />
            <span>4. Dispatch & Send</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB CONTENT AREA */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* ----------------------------------------------------------------------- */}
          {/* TAB 1: COMPOSE & TEMPLATES */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === "compose" && (
            <div className="space-y-5">
              
              {/* Preset Selector */}
              <div className="space-y-2">
                <label className="text-xs font-serif font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  <span>Choose Template Preset</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {TEMPLATE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedPresetId === preset.id
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                          : "border-border bg-card hover:bg-muted/50"
                      }`}
                    >
                      <div className="font-semibold text-xs text-foreground truncate">
                        {preset.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-tight">
                        {preset.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Variable Chips Toolbar */}
              <div className="p-3 rounded-xl bg-secondary/40 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-foreground">
                    Available Mail Merge Variables (Click to append):
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Replaced automatically for each college
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { tag: "{{name}}", label: "College Name" },
                    { tag: "{{short_name}}", label: "Short Code" },
                    { tag: "{{affno}}", label: "Affiliation No" },
                    { tag: "{{place}}", label: "Place" },
                    { tag: "{{district}}", label: "District" },
                    { tag: "{{student_count}}", label: "Scholar Count" },
                    { tag: "{{leader_count}}", label: "Orbit Leaders" },
                    { tag: "{{portal_email}}", label: "Portal Login Email" },
                    { tag: "{{portal_password}}", label: "Portal Password" },
                  ].map((item) => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => insertVariable(item.tag, "body")}
                      className="px-2 py-1 rounded bg-background hover:bg-primary/20 hover:text-primary border border-border text-[11px] font-mono text-foreground transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span className="font-bold text-primary">+</span>
                      <span>{item.tag}</span>
                      <span className="text-muted-foreground text-[10px]">({item.label})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Template Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold font-mono uppercase text-foreground">
                    Email Subject (Mail Merge Supported) *
                  </label>
                  <button
                    type="button"
                    onClick={() => insertVariable("{{name}}", "subject")}
                    className="text-[11px] text-primary hover:underline font-mono"
                  >
                    + Add College Name
                  </button>
                </div>
                <Input
                  required
                  placeholder="e.g. Official Portal Access Credentials - {{name}} ({{affno}})"
                  value={subjectTemplate}
                  onChange={(e) => setSubjectTemplate(e.target.value)}
                  className="h-10 text-xs sm:text-sm font-medium"
                />
              </div>

              {/* Message Body Template */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-mono uppercase text-foreground">
                  Email Message Body Template *
                </label>
                <textarea
                  rows={12}
                  required
                  value={bodyTemplate}
                  onChange={(e) => setBodyTemplate(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-3 text-xs sm:text-sm font-mono leading-relaxed shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Draft your personalized message body using dynamic variables..."
                />
              </div>

              {/* Sender Details Collapsible Config */}
              <div className="p-3 rounded-xl border border-border bg-card/60 space-y-3">
                <div className="text-xs font-serif font-bold text-foreground flex items-center gap-1.5">
                  <Settings2 className="size-3.5 text-primary" />
                  <span>Sender & Delivery Configuration (Optional)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                      Sender Name
                    </label>
                    <Input
                      placeholder="e.g. Wafy Orbit Administration"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                      Sender Email (From)
                    </label>
                    <Input
                      placeholder="e.g. orbit@wafy.edu"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground block mb-1">
                      Resend API Key (Optional)
                    </label>
                    <Input
                      type="password"
                      placeholder="re_xxxxxxxxxxxx"
                      value={resendApiKey}
                      onChange={(e) => setResendApiKey(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Step Navigation Button */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                  Next: Select target colleges and preview your merged emails.
                </span>
                <Button
                  onClick={() => setActiveTab("recipients")}
                  className="gap-2 text-xs"
                >
                  <span>Select Recipients</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>

            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* TAB 2: RECIPIENTS SELECTION */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === "recipients" && (
            <div className="space-y-4">
              
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-secondary/30">
                <div className="relative flex-1 min-w-[200px]">
                  <Input
                    placeholder="Search recipients by name, affno, district..."
                    value={recipientSearch}
                    onChange={(e) => setRecipientSearch(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={recipientDistrict}
                    onChange={(e) => setRecipientDistrict(e.target.value)}
                    className="h-8 rounded border border-input bg-background px-2 text-xs font-mono"
                  >
                    <option value="ALL">All Districts ({uniqueDistricts.length})</option>
                    {uniqueDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>

                  <select
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value as any)}
                    className="h-8 rounded border border-input bg-background px-2 text-xs font-mono"
                  >
                    <option value="ALL">All Status</option>
                    <option value="WITH_EMAIL">Has Email</option>
                    <option value="MISSING_EMAIL">Missing Email</option>
                  </select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAllRecipients}
                    className="h-8 text-xs shrink-0"
                  >
                    Toggle Select All
                  </Button>
                </div>
              </div>

              {/* Status summary banner */}
              <div className="flex items-center justify-between px-2 text-xs font-mono text-muted-foreground">
                <span>
                  Selected <strong>{selectedCollegesWithEmail.length}</strong> of <strong>{colleges.length}</strong> colleges with valid emails.
                </span>
                {colleges.length - selectedCollegesWithEmail.length > 0 && (
                  <span className="text-amber-500 font-semibold">
                    ⚠ {colleges.filter((c) => !c.email).length} colleges have no email address on record
                  </span>
                )}
              </div>

              {/* Recipients Checklist Table */}
              <div className="max-h-[350px] overflow-y-auto border border-border rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="sticky top-0 bg-muted border-b border-border z-10 font-mono text-[11px] text-muted-foreground uppercase">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredRecipients.length > 0 &&
                            filteredRecipients
                              .filter((c) => Boolean(c.email))
                              .every((c) => selectedAffnos.has(c.affno || c.id || ""))
                          }
                          onChange={toggleSelectAllRecipients}
                          className="size-3.5 rounded text-primary"
                        />
                      </th>
                      <th className="p-3">Affiliation</th>
                      <th className="p-3">College Name</th>
                      <th className="p-3">Place / District</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3 text-center">Scholars</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredRecipients.map((c) => {
                      const aff = c.affno || c.id || "";
                      const isSelected = selectedAffnos.has(aff);
                      const hasEmail = Boolean(c.email && c.email.includes("@"));

                      return (
                        <tr
                          key={aff || c.name}
                          className={`hover:bg-muted/40 transition-colors ${
                            !hasEmail ? "opacity-60 bg-destructive/[0.02]" : isSelected ? "bg-primary/[0.04]" : ""
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              disabled={!hasEmail || !aff}
                              checked={isSelected && hasEmail}
                              onChange={() => toggleSelectAffno(aff)}
                              className="size-3.5 rounded text-primary"
                            />
                          </td>
                          <td className="p-3 font-mono font-bold text-primary">
                            {aff}
                          </td>
                          <td className="p-3 font-medium text-foreground">
                            {c.name}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {c.place} {c.district ? `(${c.district})` : ""}
                          </td>
                          <td className="p-3 font-mono">
                            {c.email ? (
                              <span className="text-foreground">{c.email}</span>
                            ) : (
                              <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600 bg-amber-500/10">
                                Missing Email
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-center font-mono font-semibold">
                            {c.student_count ?? 0}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("compose")}
                  className="gap-1 text-xs"
                >
                  <ChevronLeft className="size-3.5" />
                  <span>Back to Editor</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => setActiveTab("preview")}
                  disabled={selectedCollegesWithEmail.length === 0}
                  className="gap-1 text-xs"
                >
                  <span>Preview Merged Emails ({selectedCollegesWithEmail.length})</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>

            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* TAB 3: LIVE MERGE PREVIEW */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === "preview" && (
            <div className="space-y-4">
              
              {/* Stepper bar across selected colleges */}
              <div className="p-3 rounded-xl border border-border bg-secondary/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs font-mono font-bold">
                    Recipient {previewIndex + 1} of {selectedCollegesList.length}
                  </Badge>
                  <span className="text-xs font-medium text-foreground truncate max-w-[280px]">
                    {currentPreviewCollege?.name} ({currentPreviewCollege?.affno || currentPreviewCollege?.id})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewIndex((p) => Math.max(0, p - 1))}
                    disabled={previewIndex === 0}
                    className="h-8 text-xs"
                  >
                    <ChevronLeft className="size-3.5" />
                    Previous
                  </Button>

                  <select
                    value={previewIndex}
                    onChange={(e) => setPreviewIndex(Number(e.target.value))}
                    className="h-8 rounded border border-input bg-background px-2 text-xs font-mono max-w-[180px]"
                  >
                    {selectedCollegesList.map((col, idx) => (
                      <option key={col.affno || col.id} value={idx}>
                        {idx + 1}. {col.short_name || col.name}
                      </option>
                    ))}
                  </select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewIndex((p) => Math.min(selectedCollegesList.length - 1, p + 1))}
                    disabled={previewIndex >= selectedCollegesList.length - 1}
                    className="h-8 text-xs"
                  >
                    Next
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Rendered Email Preview Card */}
              <Card className="border border-border/90 shadow-sm bg-card">
                <CardHeader className="p-4 sm:p-5 border-b border-border bg-secondary/10 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground font-mono uppercase text-[10px] block">To:</span>
                      <span className="font-semibold text-foreground font-mono">
                        {currentPreviewCollege?.email || <span className="text-destructive">No email address on record</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-mono uppercase text-[10px] block">From:</span>
                      <span className="font-semibold text-foreground">
                        {senderName} &lt;{senderEmail || "orbit@wafy.edu"}&gt;
                      </span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <span className="text-muted-foreground font-mono uppercase text-[10px] block">Subject:</span>
                    <div className="font-serif font-bold text-sm sm:text-base text-foreground">
                      {previewSubject}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5">
                  <div className="rounded-lg bg-background p-4 border border-border/60 whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground">
                    {previewBody}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPreview}
                    className="h-8 text-xs gap-1.5"
                  >
                    {copiedStatus === "preview" ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    <span>{copiedStatus === "preview" ? "Copied Preview!" : "Copy Merged Email"}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadCsv}
                    className="h-8 text-xs gap-1.5"
                  >
                    <Download className="size-3.5" />
                    <span>Download All Merged (CSV)</span>
                  </Button>
                </div>

                <Button
                  onClick={() => setActiveTab("dispatch")}
                  className="h-8 text-xs gap-1.5"
                >
                  <span>Proceed to Dispatch ({selectedCollegesWithEmail.length} emails)</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>

            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* TAB 4: DISPATCH & SEND CONSOLE */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === "dispatch" && (
            <div className="space-y-5">
              
              {/* Dispatch Summary Box */}
              <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary text-primary-foreground">
                    <Send className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-foreground">
                      Ready to Dispatch Bulk Mail Merge
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Each college will receive a completely personalized email with their unique Affiliation No, login credentials, and scholar statistics.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-card border border-border">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground block">Recipients</span>
                    <div className="text-xl font-bold font-mono text-primary">{selectedCollegesWithEmail.length}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-card border border-border">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground block">Skipped (No Email)</span>
                    <div className="text-xl font-bold font-mono text-amber-500">{selectedCollegesList.length - selectedCollegesWithEmail.length}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-card border border-border">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground block">Sender</span>
                    <div className="text-xs font-semibold text-foreground truncate mt-1">{senderName}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-card border border-border">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground block">Template</span>
                    <div className="text-xs font-semibold text-foreground truncate mt-1">{selectedPresetId}</div>
                  </div>
                </div>
              </div>

              {/* 1-Click Launch Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card">
                <div>
                  <div className="font-bold text-sm text-foreground">
                    One-Click Mail Merge Dispatch
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Sends {selectedCollegesWithEmail.length} individualized emails simultaneously.
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    size="lg"
                    disabled={isPending || selectedCollegesWithEmail.length === 0}
                    onClick={handleBulkSend}
                    className="w-full sm:w-auto gap-2 font-bold shadow-md"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Sending {selectedCollegesWithEmail.length} Emails...</span>
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        <span>Send to {selectedCollegesWithEmail.length} Colleges Now</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Dispatch Feedback & Live Results Stream */}
              {dispatchSummary && (
                <div className="p-4 rounded-xl border border-border bg-card space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-serif font-bold text-sm text-foreground">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                      <span>Dispatch Execution Results</span>
                    </div>
                    <Badge variant="outline" className="text-[11px] font-mono">
                      {dispatchSummary}
                    </Badge>
                  </div>

                  {dispatchResults && dispatchResults.length > 0 && (
                    <div className="max-h-[220px] overflow-y-auto divide-y divide-border/60 border border-border rounded-lg text-xs font-mono">
                      {dispatchResults.map((r, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-muted/30">
                          <div className="flex items-center gap-2 truncate">
                            {r.status === "sent" ? (
                              <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                            ) : r.status === "simulated" ? (
                              <Sparkles className="size-3.5 text-primary shrink-0" />
                            ) : (
                              <AlertCircle className="size-3.5 text-destructive shrink-0" />
                            )}
                            <span className="font-bold text-primary">{r.affno}</span>
                            <span className="text-foreground truncate">{r.collegeName}</span>
                            <span className="text-muted-foreground">({r.toEmail})</span>
                          </div>

                          <div>
                            {r.status === "sent" && (
                              <Badge variant="secondary" className="text-[10px] text-emerald-600 bg-emerald-500/10">
                                Sent
                              </Badge>
                            )}
                            {r.status === "simulated" && (
                              <Badge variant="secondary" className="text-[10px] text-primary bg-primary/10">
                                Verified
                              </Badge>
                            )}
                            {r.status === "failed" && (
                              <Badge variant="destructive" className="text-[10px]">
                                {r.error || "Failed"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Client-side Fallbacks & Export Options */}
              <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-2">
                <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <Download className="size-3.5 text-primary" />
                  <span>Offline & External Mail Client Integration</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  You can also export all merged emails as a spreadsheet or copy individual messages to send via your desktop mail software (Gmail, Microsoft Outlook, Thunderbird).
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadCsv}
                    className="h-8 text-xs gap-1.5"
                  >
                    <Download className="size-3.5" />
                    <span>Download Merged CSV Spreadsheet</span>
                  </Button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER */}
        {/* ========================================================================= */}
        <div className="p-3 sm:p-4 border-t border-border bg-secondary/20 flex items-center justify-between text-xs">
          <div className="text-muted-foreground font-mono hidden sm:block">
            Wafy Orbit Mail Merge Engine • {colleges.length} Total Campuses in Registry
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs ml-auto"
          >
            Close Console
          </Button>
        </div>

      </div>
    </div>
  );
}
