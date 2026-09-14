import Link from "next/link";
import { Layers, GraduationCap, School, Award, ArrowRight, Database } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLiveMetrics } from "@/lib/supabase/data";

export const revalidate = 0;

export default async function OrbitDetailsPage() {
  const metrics = await getLiveMetrics();

  const directories = [
    {
      title: "1. Orbit List",
      href: "/orbit-details/orbits",
      icon: Layers,
      count: metrics.orbitCount,
      countLabel: "Active Orbits",
      description: "Comprehensive registry of academic, research, creative, and technological orbits across the Wafy ecosystem.",
      badge: "Institutional Orbits",
    },
    {
      title: "2. Student List",
      href: "/orbit-details/students",
      icon: GraduationCap,
      count: metrics.studentCount,
      countLabel: "Registered Students",
      description: "Searchable directory of enrolled scholars categorized by admission number, assigned orbit, batch, and college.",
      badge: "Student Roster",
    },
    {
      title: "3. College List",
      href: "/orbit-details/colleges",
      icon: School,
      count: metrics.collegeCount,
      countLabel: "Affiliated Colleges",
      description: "Complete index of member collegiate institutions, geographical campus locations, and regional administrative nodes.",
      badge: "Colleges Index",
    },
    {
      title: "4. Orbit Leaders List",
      href: "/orbit-details/leaders",
      icon: Award,
      count: null,
      countLabel: "Leadership Council",
      description: "Appointed student coordinators, secretaries, and council officers governing respective institutional orbits.",
      badge: "Leadership Roster",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 py-10 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Header Description */}
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs uppercase">
                Public Database
              </Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Database className="size-3 text-primary" /> Live Supabase Synchronization
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-foreground">
              Orbit Details & Public Directory
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed font-sans">
              Welcome to the open institutional directory of Wafy Orbit. Select a section below to browse orbits, search student cohorts, inspect affiliated colleges, or review leadership appointments.
            </p>
          </div>

          {/* Directory Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {directories.map((dir) => {
              const Icon = dir.icon;
              return (
                <Card key={dir.href} className="flex flex-col justify-between hover:border-primary/50 hover:shadow-md transition-all duration-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="size-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                        <Icon className="size-5" />
                      </div>
                      <Badge variant="secondary">{dir.badge}</Badge>
                    </div>
                    <CardTitle className="text-xl pt-3">{dir.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed pt-1">
                      {dir.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <div className="text-xs text-muted-foreground font-mono">
                        {dir.count !== null ? (
                          <span>
                            <strong className="text-foreground font-sans font-semibold text-sm">{dir.count}</strong> {dir.countLabel}
                          </span>
                        ) : (
                          <span>Designated Representatives</span>
                        )}
                      </div>
                      <Link href={dir.href}>
                        <Button size="sm" variant="default" className="gap-1.5 font-medium">
                          <span>View Directory</span>
                          <ArrowRight className="size-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
