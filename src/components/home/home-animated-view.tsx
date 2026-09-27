"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe,
  ShieldCheck,
  School,
  ArrowRight,
  GraduationCap,
  Layers,
  Award,
  CheckCircle2,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrbitPreloader } from "@/components/home/orbit-preloader";

interface HomeAnimatedViewProps {
  metrics: {
    orbitCount: number;
    collegeCount: number;
    studentCount: number;
  };
}

export function HomeAnimatedView({ metrics }: HomeAnimatedViewProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  // Safety fallback in case preloader timer is delayed
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setIsRevealed(true);
    }, 3200);
    return () => clearTimeout(fallbackTimer);
  }, []);

  const getMetricsNarrative = () => {
    if (metrics.orbitCount === 0 && metrics.collegeCount === 0 && metrics.studentCount === 0) {
      return (
        <span className="text-muted-foreground">
          Currently initializing system records with{" "}
          <strong className="text-foreground">0</strong> orbits,{" "}
          <strong className="text-foreground">0</strong> affiliated colleges, and{" "}
          <strong className="text-foreground">0</strong> enrolled students.
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
    <div className="relative min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-foreground overflow-x-hidden">
      {/* 3-Second Round Logo Preloader (Homepage only) */}
      <OrbitPreloader onComplete={() => setIsRevealed(true)} />

      {/* Floating Ambient Atmosphere Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 size-[500px] rounded-full bg-primary/8 blur-[120px] animate-float-slow" />
        <div className="absolute top-1/3 -right-40 size-[450px] rounded-full bg-amber-500/6 blur-[130px] animate-float-reverse" />
        <div className="absolute -bottom-32 left-1/4 size-[400px] rounded-full bg-primary/5 blur-[110px] animate-float-slow" />
      </div>

      {/* Main Page Layout with Critical Inline Style to Prevent Navbar/Footer FOUC on Reload */}
      <div
        style={{
          opacity: isRevealed ? 1 : 0,
          transform: isRevealed ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          pointerEvents: isRevealed ? "auto" : "none",
        }}
        className="relative z-10 flex min-h-screen flex-col"
      >
        <Header />

        <main className="flex-1">
          {/* ========================================================================= */}
          {/* HERO SECTION */}
          {/* ========================================================================= */}
          <section className="relative overflow-hidden pt-14 pb-16 md:pt-24 md:pb-24 border-b border-border/60">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
                
                {/* Main Headline */}
                <h1
                  className={`text-4xl sm:text-6xl lg:text-7xl font-serif font-extrabold tracking-tight text-foreground leading-[1.1] text-balance transition-all duration-800 delay-150 ${
                    isRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                >
                  "Rooted in Knowledge, Linked in Unity:{" "}
                  <span className="bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
                    Welcome to Wafy Orbit.
                  </span>
                  "
                </h1>

                {/* Subtitle Description */}
                <p
                  className={`text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed font-sans transition-all duration-800 delay-250 ${
                    isRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  }`}
                >
                  A unified digital sphere designed for the Wafy Institution to harmonize academic orbits, affiliated colleges, student cohorts, and leadership delegations.
                </p>

                {/* Primary Call to Action buttons */}
                <div
                  className={`flex flex-wrap items-center justify-center gap-3 pt-2 transition-all duration-800 delay-350 ${
                    isRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  }`}
                >
                  <Link href="/orbit-details" className="group">
                    <Button
                      size="lg"
                      className="h-12 px-7 text-base font-semibold shadow-md gap-2 relative overflow-hidden group hover:shadow-primary/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Globe className="size-5 transition-transform duration-300 group-hover:rotate-12" />
                      <span>Enter Orbit Details</span>
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-12 px-6 text-base font-medium hover:border-primary/50 hover:bg-muted/60 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <ShieldCheck className="size-5 mr-1 text-primary" />
                      Sign In
                    </Button>
                  </Link>
                </div>

                {/* Live Count Narrative Message */}
                <div
                  className={`w-full mt-6 p-4 sm:p-5 rounded-lg border border-border bg-card/75 shadow-xs backdrop-blur-md text-sm sm:text-base leading-relaxed max-w-3xl transition-all duration-800 delay-450 hover:border-primary/30 hover:shadow-md ${
                    isRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                >
                  {getMetricsNarrative()}
                </div>

              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* LIVE METRICS TILES */}
          {/* ========================================================================= */}
          <section className="py-12 bg-muted/25 border-b border-border/60 relative">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Total Orbits Tile */}
                <div
                  className={`transition-all duration-700 delay-500 ${
                    isRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                >
                  <Card className="group hover:border-primary/50 hover:-translate-y-1.5 hover:shadow-md transition-all duration-300 bg-card/90 backdrop-blur-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium font-sans text-muted-foreground group-hover:text-foreground transition-colors">
                        Total Orbit
                      </CardTitle>
                      <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 transition-all duration-300">
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
                </div>

                {/* Total Colleges Tile */}
                <div
                  className={`transition-all duration-700 delay-600 ${
                    isRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                >
                  <Card className="group hover:border-primary/50 hover:-translate-y-1.5 hover:shadow-md transition-all duration-300 bg-card/90 backdrop-blur-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium font-sans text-muted-foreground group-hover:text-foreground transition-colors">
                        Affiliated Colleges
                      </CardTitle>
                      <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 transition-all duration-300">
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
                </div>

                {/* Total Students Tile */}
                <div
                  className={`transition-all duration-700 delay-700 ${
                    isRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                >
                  <Card className="group hover:border-primary/50 hover:-translate-y-1.5 hover:shadow-md transition-all duration-300 bg-card/90 backdrop-blur-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium font-sans text-muted-foreground group-hover:text-foreground transition-colors">
                        Total Enrolled Students
                      </CardTitle>
                      <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 transition-all duration-300">
                        <GraduationCap className="size-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-foreground">
                        {metrics.studentCount.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Scholars across all orbits
                      </p>
                    </CardContent>
                  </Card>
                </div>

              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* WHAT IS ORBIT - EXPLANATION & VALUE PROPOSITION */}
          {/* ========================================================================= */}
          <section className="py-16 md:py-24 border-b border-border/60 relative">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                
                {/* Left Description Column */}
                <div
                  className={`space-y-6 transition-all duration-800 delay-600 ${
                    isRevealed ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                  }`}
                >
                  <Badge variant="outline" className="font-mono text-xs uppercase tracking-wider border-primary/40 text-primary">
                    Understanding Orbit
                  </Badge>
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground leading-snug">
                    What is the Wafy Orbit System?
                  </h2>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    Wafy Orbit is an official student-led initiative established to connect, empower, and align Wafy scholars across their respective home regions. Functioning as a localized bridge between students, alumni, and the central institutional framework, Wafy Orbit channels academic energy and student leadership into regional engagement, community service, and public outreach.
                  </p>
                  
                  {/* Three Value Pillars */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-start gap-3.5 group">
                      <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary/20 group-hover:scale-105 transition-all">
                        <CheckCircle2 className="size-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Inter-Collegiate Collaboration</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          Connects students and faculties across diverse campuses within focused disciplines.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5 group">
                      <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary/20 group-hover:scale-105 transition-all">
                        <CheckCircle2 className="size-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Empowered Leadership Circle</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          Elected student leaders coordinate initiatives, symposiums, and developmental activities.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5 group">
                      <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary/20 group-hover:scale-105 transition-all">
                        <CheckCircle2 className="size-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Transparent Institutional Records</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          Live database synchronization ensuring verifiable student rosters and college affiliations.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Interactive Orbit Highlight Card */}
                <div
                  className={`transition-all duration-800 delay-700 ${
                    isRevealed ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                  }`}
                >
                  <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300">
                    <div className="flex items-center justify-between pb-6 border-b border-border">
                      <div>
                        <span className="text-xs font-mono uppercase text-muted-foreground">Public Hub</span>
                        <h3 className="font-serif text-xl font-bold text-foreground mt-0.5">
                          Orbit Details Directory
                        </h3>
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        Open Access
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground py-5 leading-relaxed">
                      Browse real-time records and explore affiliated colleges, registered students, orbits, and designated leadership councils.
                    </p>

                    <div className="grid grid-cols-2 gap-3 pb-6">
                      <Link
                        href="/orbit-details/orbits"
                        className="group/link p-3 rounded-lg bg-muted/40 hover:bg-muted/90 transition-all duration-200 border border-border/50 hover:border-primary/40 text-left block hover:-translate-y-0.5"
                      >
                        <Layers className="size-4 text-primary mb-1.5 transition-transform duration-200 group-hover/link:scale-110" />
                        <div className="text-xs font-semibold text-foreground group-hover/link:text-primary transition-colors">
                          1. Orbit List
                        </div>
                        <div className="text-[11px] text-muted-foreground">Browse all orbits</div>
                      </Link>

                      <Link
                        href="/orbit-details/students"
                        className="group/link p-3 rounded-lg bg-muted/40 hover:bg-muted/90 transition-all duration-200 border border-border/50 hover:border-primary/40 text-left block hover:-translate-y-0.5"
                      >
                        <GraduationCap className="size-4 text-primary mb-1.5 transition-transform duration-200 group-hover/link:scale-110" />
                        <div className="text-xs font-semibold text-foreground group-hover/link:text-primary transition-colors">
                          2. Find My Orbit
                        </div>
                        <div className="text-[11px] text-muted-foreground">Look up your orbit</div>
                      </Link>

                      <Link
                        href="/orbit-details/colleges"
                        className="group/link p-3 rounded-lg bg-muted/40 hover:bg-muted/90 transition-all duration-200 border border-border/50 hover:border-primary/40 text-left block hover:-translate-y-0.5"
                      >
                        <School className="size-4 text-primary mb-1.5 transition-transform duration-200 group-hover/link:scale-110" />
                        <div className="text-xs font-semibold text-foreground group-hover/link:text-primary transition-colors">
                          3. College List
                        </div>
                        <div className="text-[11px] text-muted-foreground">Affiliated colleges</div>
                      </Link>

                      <Link
                        href="/orbit-details/leaders"
                        className="group/link p-3 rounded-lg bg-muted/40 hover:bg-muted/90 transition-all duration-200 border border-border/50 hover:border-primary/40 text-left block hover:-translate-y-0.5"
                      >
                        <Award className="size-4 text-primary mb-1.5 transition-transform duration-200 group-hover/link:scale-110" />
                        <div className="text-xs font-semibold text-foreground group-hover/link:text-primary transition-colors">
                          4. Orbit Leaders
                        </div>
                        <div className="text-[11px] text-muted-foreground">Appointed leaders</div>
                      </Link>
                    </div>

                    <Link href="/orbit-details" className="block w-full">
                      <Button variant="default" className="w-full justify-center gap-2 group hover:shadow-md transition-all">
                        <span>Enter Public Directory Hub</span>
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </div>

              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
