import Link from "next/link";
import {
  Layers,
  CheckCircle2,
  XCircle,
  GraduationCap,
  UserCheck,
  UserX,
  School,
  ArrowRight,
  Settings,
  ShieldCheck,
  TrendingUp,
  Award,
  Upload,
  PlusCircle,
  FileSpreadsheet,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminDashboardStats, getActiveOrbits, getColleges } from "@/lib/supabase/data";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const [stats, activeOrbits, colleges] = await Promise.all([
    getAdminDashboardStats(),
    getActiveOrbits(),
    getColleges(),
  ]);

  const assignedPercentage =
    stats.studentTotalCount > 0
      ? Math.round((stats.studentAssignedCount / stats.studentTotalCount) * 100)
      : 0;

  const activeOrbitPercentage =
    stats.orbitTotalCount > 0
      ? Math.round((stats.orbitActiveCount / stats.orbitTotalCount) * 100)
      : 0;

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20 selection:text-foreground">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Header & Direct Access Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs font-mono uppercase">
                  Central Administration
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">Live Institutional Sync</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-serif font-bold text-foreground mt-1">
                Executive Overview Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Real-time institutional metrics, student distribution ratios, and centralized management portals.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link href="/admin/students/settings">
                <Button variant="default" size="sm" className="gap-1.5 font-medium text-xs">
                  <Upload className="size-3.5" />
                  Bulk Import Students
                </Button>
              </Link>
              <Link href="/admin/orbit/settings">
                <Button variant="outline" size="sm" className="gap-1.5 font-medium text-xs">
                  <PlusCircle className="size-3.5" />
                  Add Orbit
                </Button>
              </Link>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 7 KEY METRICS STATISTICAL GRID */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Orbit Total Count */}
            <Card className="hover:border-primary/40 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-mono uppercase text-muted-foreground">
                  1. Total Orbits
                </CardTitle>
                <div className="size-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                  <Layers className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-foreground">
                  {stats.orbitTotalCount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total registered domains</p>
              </CardContent>
            </Card>

            {/* 2. Orbit Active Count */}
            <Card className="hover:border-primary/40 transition-colors border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-mono uppercase text-muted-foreground">
                  2. Active Orbits
                </CardTitle>
                <div className="size-8 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-foreground">
                  {stats.orbitActiveCount.toLocaleString()}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 font-mono">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{activeOrbitPercentage}%</span> active operational rate
                </div>
              </CardContent>
            </Card>

            {/* 3. Orbit Inactive Count */}
            <Card className="hover:border-primary/40 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-mono uppercase text-muted-foreground">
                  3. Inactive Orbits
                </CardTitle>
                <div className="size-8 rounded bg-muted flex items-center justify-center text-muted-foreground">
                  <XCircle className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-foreground">
                  {stats.orbitInactiveCount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Merged or decommissioned</p>
              </CardContent>
            </Card>

            {/* 7. Total College Count */}
            <Card className="hover:border-primary/40 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-mono uppercase text-muted-foreground">
                  7. Total Colleges
                </CardTitle>
                <div className="size-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                  <School className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-foreground">
                  {stats.collegeTotalCount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Affiliated campus centers</p>
              </CardContent>
            </Card>

          </div>

          {/* Student Ratios & Assignment Breakdown (Stats 4, 5, 6) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 4. Total Student Count */}
            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-mono uppercase text-muted-foreground">
                  4. Total Student Count
                </CardTitle>
                <GraduationCap className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-foreground">
                  {stats.studentTotalCount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">All enrolled scholars across batches</p>
              </CardContent>
            </Card>

            {/* 5. Assigned to Orbit Count */}
            <Card className="bg-card border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-mono uppercase text-muted-foreground">
                  5. Students Assigned to Orbit
                </CardTitle>
                <UserCheck className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-foreground">
                  {stats.studentAssignedCount.toLocaleString()}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${assignedPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-semibold text-primary">{assignedPercentage}%</span>
                </div>
              </CardContent>
            </Card>

            {/* 6. Not Yet Assigned to Orbit Count */}
            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-mono uppercase text-muted-foreground">
                  6. Not Yet Assigned
                </CardTitle>
                <UserX className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-foreground">
                  {stats.studentUnassignedCount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting orbit placement</p>
              </CardContent>
            </Card>

          </div>

          {/* ========================================================================= */}
          {/* 4 CORE ADMINISTRATIVE CONTROL CENTERS */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            <h2 className="text-lg font-serif font-bold text-foreground">
              Institutional Control Hubs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* 1. Orbit Management */}
              <Card className="p-4 flex flex-col justify-between hover:border-primary/50 transition-colors bg-card">
                <div className="space-y-2">
                  <div className="size-9 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                    <Layers className="size-5" />
                  </div>
                  <div className="font-serif font-bold text-base text-foreground">Orbits & Geography</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Filter by district & taluk, single form entry, and bulk CSV import with auto leader auth.
                  </p>
                </div>
                <div className="pt-4 flex flex-col gap-1.5">
                  <Link href="/admin/orbit">
                    <Button variant="default" size="sm" className="w-full justify-between text-xs h-8">
                      <span>View Orbit List</span>
                      <ArrowRight className="size-3" />
                    </Button>
                  </Link>
                  <Link href="/admin/orbit/settings">
                    <Button variant="outline" size="sm" className="w-full justify-between text-xs h-8">
                      <span>Bulk Upload & Settings</span>
                      <Settings className="size-3" />
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* 2. College Management */}
              <Card className="p-4 flex flex-col justify-between hover:border-primary/50 transition-colors bg-card">
                <div className="space-y-2">
                  <div className="size-9 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                    <School className="size-5" />
                  </div>
                  <div className="font-serif font-bold text-base text-foreground">Colleges & Campuses</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Affiliation numbers, student counts, single form entry, and bulk CSV import with college logins.
                  </p>
                </div>
                <div className="pt-4 flex flex-col gap-1.5">
                  <Link href="/admin/college">
                    <Button variant="default" size="sm" className="w-full justify-between text-xs h-8">
                      <span>View College List</span>
                      <ArrowRight className="size-3" />
                    </Button>
                  </Link>
                  <Link href="/admin/college/settings">
                    <Button variant="outline" size="sm" className="w-full justify-between text-xs h-8">
                      <span>Bulk Upload & Settings</span>
                      <Settings className="size-3" />
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* 3. Student Management */}
              <Card className="p-4 flex flex-col justify-between hover:border-primary/50 transition-colors bg-card">
                <div className="space-y-2">
                  <div className="size-9 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                    <GraduationCap className="size-5" />
                  </div>
                  <div className="font-serif font-bold text-base text-foreground">Scholars & Students</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    CIC registry, 5-point floating filter, bulk CSV upsert sync, and unassigned allocations console.
                  </p>
                </div>
                <div className="pt-4 flex flex-col gap-1.5">
                  <Link href="/admin/students">
                    <Button variant="default" size="sm" className="w-full justify-between text-xs h-8">
                      <span>View Student List</span>
                      <ArrowRight className="size-3" />
                    </Button>
                  </Link>
                  <Link href="/admin/students/settings">
                    <Button variant="outline" size="sm" className="w-full justify-between text-xs h-8">
                      <span>Bulk Upload & Allocations</span>
                      <Settings className="size-3" />
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* 4. Leadership Delegation Management */}
              <Card className="p-4 flex flex-col justify-between hover:border-primary/50 transition-colors bg-card">
                <div className="space-y-2">
                  <div className="size-9 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                    <Award className="size-5" />
                  </div>
                  <div className="font-serif font-bold text-base text-foreground">Leadership Delegation Matrix</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Designate Orbit Leaders, District Leaders, and Malappuram Constituency Leaders with multi-tier sync.
                  </p>
                </div>
                <div className="pt-4 flex flex-col gap-1.5">
                  <Link href="/admin/orbit-leaders">
                    <Button variant="default" size="sm" className="w-full justify-between text-xs h-8">
                      <span>View Leaders Roster</span>
                      <ArrowRight className="size-3" />
                    </Button>
                  </Link>
                  <Link href="/admin/orbit-leaders/settings">
                    <Button variant="outline" size="sm" className="w-full justify-between text-xs h-8">
                      <span>Appoint & Configure Leaders</span>
                      <Settings className="size-3" />
                    </Button>
                  </Link>
                </div>
              </Card>

            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
