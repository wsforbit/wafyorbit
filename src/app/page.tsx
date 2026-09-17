import Link from "next/link";
import {
  Globe,
  ShieldCheck,
  Compass,
  School,
  ArrowRight,
  Users,
  GraduationCap,
  Sparkles,
  Layers,
  Award,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLiveMetrics } from "@/lib/supabase/data";

export const revalidate = 0; // Dynamic server rendering for live live count accuracy

export default async function HomePage() {
  const metrics = await getLiveMetrics();

  // Pure, professional English summary message reflecting dynamic counts
  const getMetricsNarrative = () => {
    if (metrics.orbitCount === 0 && metrics.collegeCount === 0 && metrics.studentCount === 0) {
      return (
        <span className="text-muted-foreground">
          Currently initializing system records with <strong className="text-foreground">0</strong> orbits, <strong className="text-foreground">0</strong> affiliated colleges, and <strong className="text-foreground">0</strong> enrolled students.
        </span>
      );
    }

    return (
      <span className="text-foreground/90 font-medium">
        Empowering a dynamic academic network connecting{" "}
        <strong className="text-primary font-semibold underline decoration-primary/30 underline-offset-4">
          {metrics.orbitCount.toLocaleString()} {metrics.orbitCount === 1 ? "specialized orbit" : "specialized orbits"}
        </strong>{" "}
        across{" "}
        <strong className="text-primary font-semibold underline decoration-primary/30 underline-offset-4">
          {metrics.collegeCount.toLocaleString()} {metrics.collegeCount === 1 ? "premier college" : "premier colleges"}
        </strong>
        , fostering excellence for{" "}
        <strong className="text-primary font-semibold underline decoration-primary/30 underline-offset-4">
          {metrics.studentCount.toLocaleString()} {metrics.studentCount === 1 ? "scholar" : "scholars"}
        </strong>{" "}
        in the Wafy academic continuum.
      </span>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20 selection:text-foreground">
      <Header />

      <main className="flex-1">
        {/* ========================================================================= */}
        {/* HERO SECTION */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-border/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
              
              {/* Badge Indicator */}
              <Badge variant="secondary" className="px-3.5 py-1 text-xs tracking-wide uppercase font-mono gap-1.5 border border-border">
                <Sparkles className="size-3.5 text-primary" />
                Official Wafy Orbit Platform
              </Badge>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-extrabold tracking-tight text-foreground leading-[1.1] text-balance">
                "Rooted in Knowledge, Linked in Unity: Welcome to Wafy Orbit."
              </h1>

              {/* Subtitle Description */}
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed font-sans">
                A unified digital sphere designed for the Wafy Institution to harmonize academic orbits, affiliated colleges, student cohorts, and leadership delegations.
              </p>

              {/* Primary Call to Action buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link href="/orbit-details">
                  <Button size="lg" className="h-12 px-7 text-base font-semibold shadow-md gap-2">
                    <Globe className="size-5" />
                    Enter Orbit Details
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline" className="h-12 px-6 text-base font-medium">
                    <ShieldCheck className="size-5 mr-1" />
                    Sign In
                  </Button>
                </Link>
              </div>

              {/* Live Count Narrative Message */}
              <div className="w-full mt-6 p-4 sm:p-5 rounded-lg border border-border bg-card/70 shadow-xs backdrop-blur-xs text-sm sm:text-base leading-relaxed max-w-3xl">
                {getMetricsNarrative()}
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* LIVE METRICS TILES */}
        {/* ========================================================================= */}
        <section className="py-12 bg-muted/25 border-b border-border/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Total Orbits Tile */}
              <Card className="hover:border-primary/40 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium font-sans text-muted-foreground">
                    Total Orbit
                  </CardTitle>
                  <div className="size-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <Layers className="size-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-foreground">
                    {metrics.orbitCount.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Specialized academic & skill domains
                  </p>
                </CardContent>
              </Card>

              {/* Total Colleges Tile */}
              <Card className="hover:border-primary/40 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium font-sans text-muted-foreground">
                    Affiliated Colleges
                  </CardTitle>
                  <div className="size-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <School className="size-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-foreground">
                    {metrics.collegeCount.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Campus centers and collegiate institutions
                  </p>
                </CardContent>
              </Card>

              {/* Total Students Tile */}
              <Card className="hover:border-primary/40 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium font-sans text-muted-foreground">
                    Total Enrolled Students
                  </CardTitle>
                  <div className="size-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <GraduationCap className="size-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-foreground">
                    {metrics.studentCount.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Scholars across all stages and orbits
                  </p>
                </CardContent>
              </Card>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* WHAT IS ORBIT - EXPLANATION & VALUE PROPOSITION */}
        {/* ========================================================================= */}
        <section className="py-16 md:py-24 border-b border-border/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <Badge variant="outline" className="font-mono text-xs uppercase tracking-wider">
                  Understanding Orbit
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground leading-snug">
                  What is the Wafy Orbit System?
                </h2>
                <p className="text-muted-foreground leading-relaxed text-base">
                  Wafy Orbit is an official student-led initiative established to connect, empower, and align Wafy scholars across their respective home regions. Functioning as a localized bridge between students, alumni, and the central institutional framework, Wafy Orbit channels academic energy and student leadership into regional engagement, community service, and public outreach.
                </p>
                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="size-2 rounded-full bg-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Inter-Collegiate Collaboration</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Connects students and faculties across diverse campuses within focused disciplines.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="size-2 rounded-full bg-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Empowered Leadership Circle</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Elected student leaders coordinate initiatives, symposiums, and developmental activities.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="size-2 rounded-full bg-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Transparent Institutional Records</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Live database synchronization ensuring verifiable student rosters and college affiliations.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Orbit Highlight Card */}
              <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between pb-6 border-b border-border">
                  <div>
                    <span className="text-xs font-mono uppercase text-muted-foreground">Public Hub</span>
                    <h3 className="font-serif text-xl font-bold text-foreground mt-0.5">
                      Orbit Details Directory
                    </h3>
                  </div>
                  <Badge variant="secondary">Open Access</Badge>
                </div>

                <p className="text-sm text-muted-foreground py-5 leading-relaxed">
                  Browse real-time records and explore affiliated colleges, registered students, orbits, and designated leadership councils.
                </p>

                <div className="grid grid-cols-2 gap-3 pb-6">
                  <Link href="/orbit-details/orbits" className="p-3 rounded-md bg-muted/40 hover:bg-muted transition-colors border border-border/50 text-left block">
                    <Layers className="size-4 text-primary mb-1.5" />
                    <div className="text-xs font-semibold text-foreground">1. Orbit List</div>
                    <div className="text-[11px] text-muted-foreground">Browse all domains</div>
                  </Link>
                  <Link href="/orbit-details/students" className="p-3 rounded-md bg-muted/40 hover:bg-muted transition-colors border border-border/50 text-left block">
                    <GraduationCap className="size-4 text-primary mb-1.5" />
                    <div className="text-xs font-semibold text-foreground">2. Student List</div>
                    <div className="text-[11px] text-muted-foreground">Enrolled scholars</div>
                  </Link>
                  <Link href="/orbit-details/colleges" className="p-3 rounded-md bg-muted/40 hover:bg-muted transition-colors border border-border/50 text-left block">
                    <School className="size-4 text-primary mb-1.5" />
                    <div className="text-xs font-semibold text-foreground">3. College List</div>
                    <div className="text-[11px] text-muted-foreground">Affiliated campuses</div>
                  </Link>
                  <Link href="/orbit-details/leaders" className="p-3 rounded-md bg-muted/40 hover:bg-muted transition-colors border border-border/50 text-left block">
                    <Award className="size-4 text-primary mb-1.5" />
                    <div className="text-xs font-semibold text-foreground">4. Orbit Leaders</div>
                    <div className="text-[11px] text-muted-foreground">Appointed councils</div>
                  </Link>
                </div>

                <Link href="/orbit-details" className="block w-full">
                  <Button variant="default" className="w-full justify-center">
                    Enter Public Directory Hub
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
