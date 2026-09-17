"use client";

import { useState, useTransition } from "react";
import {
  Search,
  GraduationCap,
  Layers,
  School,
  MapPin,
  Compass,
  ShieldCheck,
  AlertCircle,
  Loader2,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatStudentClass } from "@/lib/class-helper";
import {
  findStudentOrbitByCicnoAction,
  type StudentOrbitSearchResult,
} from "@/app/orbit-details/students/actions";

export function FindOrbitClient() {
  const [cicnoInput, setCicnoInput] = useState("");
  const [searchedCicno, setSearchedCicno] = useState("");
  const [result, setResult] = useState<StudentOrbitSearchResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = cicnoInput.trim();
    if (!query) return;

    setErrorMessage(null);
    setResult(null);
    setSearchedCicno(query);

    startTransition(async () => {
      const res = await findStudentOrbitByCicnoAction(query);
      if (res.success && res.student) {
        setResult(res.student);
        setErrorMessage(null);
      } else {
        setResult(null);
        setErrorMessage(res.error || "No scholar record found matching that CIC Number.");
      }
    });
  };

  const handleClear = () => {
    setCicnoInput("");
    setSearchedCicno("");
    setResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* Search Console Card */}
      <Card className="border-border shadow-md bg-card">
        <CardHeader className="text-center pb-4">
          <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-2">
            <Search className="size-6" />
          </div>
          <CardTitle className="text-2xl font-serif font-bold text-foreground">
            Find Your Orbit Allocation
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            Enter your unique <strong>CIC Number</strong> below to look up your designated orbit, campus affiliation, and academic records.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 pb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter CIC Number (e.g. 16828 or CIC16828)..."
                value={cicnoInput}
                onChange={(e) => setCicnoInput(e.target.value)}
                disabled={isPending}
                className="pl-10 pr-9 h-11 text-sm font-mono tracking-wider"
                autoFocus
              />
              {cicnoInput && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <Button
              type="submit"
              disabled={isPending || !cicnoInput.trim()}
              className="h-11 px-6 text-sm font-medium gap-2 shadow-xs shrink-0"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>Search Orbit</span>
                </>
              )}
            </Button>
          </form>

          {/* Privacy Disclaimer */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground font-mono pt-1">
            <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Data Privacy Protected • Personal contacts & phone numbers are never displayed</span>
          </div>
        </CardContent>
      </Card>

      {/* Error / Not Found Message */}
      {errorMessage && (
        <Card className="border-destructive/30 bg-destructive/5 text-destructive p-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-sm">Scholar Record Not Found</h4>
              <p className="text-xs leading-relaxed text-destructive/90">
                {errorMessage}
              </p>
              <div className="text-[11px] text-muted-foreground pt-2 space-y-1">
                <p>• Make sure you entered your official CIC Number (e.g. <code className="font-mono font-semibold text-foreground">16828</code>).</p>
                <p>• If your admission was recently completed, check with your college coordinator to confirm your batch enrollment.</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Search Result Card */}
      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          
          {/* Top Scholar Header Card */}
          <Card className="border-border bg-card shadow-sm overflow-hidden">
            <div className="bg-primary/5 border-b border-border p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <GraduationCap className="size-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
                        {result.student_name}
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="default" className="font-mono text-xs">
                        CIC: {result.cicno}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-mono">
                        Stage: {formatStudentClass(result.class_name)}
                      </Badge>
                      {result.role && result.role !== "member" && (
                        <Badge variant="secondary" className="text-xs font-mono uppercase bg-primary/10 text-primary">
                          Role: {result.role.replace("_", " ")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right text-xs text-muted-foreground font-mono">
                  <div>Verification Status</div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center sm:justify-end gap-1 mt-0.5">
                    <CheckCircle2 className="size-3.5" />
                    <span>Active Wafy Scholar</span>
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* 1. Orbit Allocation Card */}
              <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-serif font-bold text-sm text-foreground flex items-center gap-2">
                    <Layers className="size-4 text-primary" />
                    <span>Assigned Orbit Domain</span>
                  </div>
                  {result.orbit ? (
                    <Badge variant="default" className="text-[10px] font-mono">
                      {result.orbit.id}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30 bg-amber-500/10">
                      Pending
                    </Badge>
                  )}
                </div>

                {result.orbit ? (
                  <div className="space-y-2 pt-1">
                    <div className="text-lg font-serif font-bold text-foreground">
                      {result.orbit.name}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                      <div>
                        <span className="text-[10px] block font-mono uppercase text-muted-foreground/80">District</span>
                        <span className="font-medium text-foreground">{result.orbit.district}</span>
                      </div>
                      <div>
                        <span className="text-[10px] block font-mono uppercase text-muted-foreground/80">Taluk</span>
                        <span className="font-medium text-foreground">{result.orbit.taluk || "—"}</span>
                      </div>
                      {result.orbit.constituency && (
                        <div>
                          <span className="text-[10px] block font-mono uppercase text-muted-foreground/80">Constituency</span>
                          <span className="font-medium text-foreground">{result.orbit.constituency}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] block font-mono uppercase text-muted-foreground/80">Orbit Status</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                          {result.orbit.status}
                        </span>
                      </div>
                    </div>

                    {result.orbit.panchayaths && (
                      <div className="pt-2 border-t border-border/60 text-xs">
                        <span className="text-[10px] block font-mono uppercase text-muted-foreground/80 mb-0.5">Covered Panchayaths / Municipalities</span>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">
                          {result.orbit.panchayaths}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 py-2">
                    <div className="flex items-center gap-2 text-amber-500 font-medium text-xs">
                      <Clock className="size-4 shrink-0" />
                      <span>Orbit Assignment In Progress</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      You are currently registered in the database, but your college coordinator has not yet assigned you to a specific geographical Orbit. Please contact your college administration.
                    </p>
                  </div>
                )}
              </div>

              {/* 2. Affiliated College Card */}
              <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-serif font-bold text-sm text-foreground flex items-center gap-2">
                    <School className="size-4 text-primary" />
                    <span>Affiliated College Campus</span>
                  </div>
                  {result.college?.affno && (
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {result.college.affno}
                    </Badge>
                  )}
                </div>

                {result.college ? (
                  <div className="space-y-2 pt-1">
                    <div className="text-base font-serif font-bold text-foreground">
                      {result.college.name}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                      <div>
                        <span className="text-[10px] block font-mono uppercase text-muted-foreground/80">Campus Code</span>
                        <span className="font-medium text-foreground font-mono">{result.college.short_name || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] block font-mono uppercase text-muted-foreground/80">Affiliation No</span>
                        <span className="font-medium text-foreground font-mono">{result.college.affno}</span>
                      </div>
                      <div>
                        <span className="text-[10px] block font-mono uppercase text-muted-foreground/80">Campus Location</span>
                        <span className="font-medium text-foreground">{result.college.place}</span>
                      </div>
                      <div>
                        <span className="text-[10px] block font-mono uppercase text-muted-foreground/80">District</span>
                        <span className="font-medium text-foreground">{result.college.district || "—"}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 py-2">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      No campus affiliation record linked.
                    </p>
                  </div>
                )}
              </div>

              {/* 3. Home Location Details */}
              <div className="md:col-span-2 p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="font-serif font-bold text-xs text-foreground flex items-center gap-1.5 uppercase font-mono tracking-wider">
                  <MapPin className="size-3.5 text-primary" />
                  <span>Scholar Residence Location</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <div>
                    <span className="font-mono text-[10px] uppercase text-muted-foreground/80 mr-1">Place:</span>
                    <strong className="text-foreground">{result.place}</strong>
                  </div>
                  {result.panchayath && (
                    <>
                      <span>•</span>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-muted-foreground/80 mr-1">Panchayath:</span>
                        <strong className="text-foreground">{result.panchayath}</strong>
                      </div>
                    </>
                  )}
                  {result.district && (
                    <>
                      <span>•</span>
                      <div>
                        <span className="font-mono text-[10px] uppercase text-muted-foreground/80 mr-1">District:</span>
                        <strong className="text-foreground">{result.district}</strong>
                      </div>
                    </>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>

        </div>
      )}

      {/* Initial Guidance Notice (When no search has been done yet) */}
      {!result && !errorMessage && (
        <Card className="border-dashed bg-muted/10 p-6 sm:p-8 text-center space-y-3">
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
            <Info className="size-5" />
          </div>
          <h3 className="font-serif font-semibold text-base text-foreground">
            How to Look Up Your Orbit
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            1. Obtain your official <strong>CIC Number</strong> from your affiliated college identity card or registration documents.
            <br />
            2. Enter your CIC Number in the search bar above and click <strong>Search Orbit</strong>.
            <br />
            3. Your assigned Orbit domain, campus center, and regional student coordinator links will be displayed instantly.
          </p>
        </Card>
      )}

    </div>
  );
}
