import Link from "next/link";
import { ArrowRight, Settings, Award } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOrbitLeadershipData, getAdminColleges } from "@/lib/supabase/data";
import { OrbitLeadersListClient } from "@/components/admin/orbit-leaders-list-client";

export const revalidate = 0;

export default async function AdminOrbitLeadersPage() {
  const [leadershipRecords, colleges] = await Promise.all([
    getOrbitLeadershipData(),
    getAdminColleges(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20 selection:text-foreground">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          
          {/* Top Bar with Redirection to Leaders Settings */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs font-mono uppercase">
                  Admin Console
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">Leadership Governance</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-serif font-bold text-foreground mt-1">
                Orbit Leaders & Assistant Leaders
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Official delegation registry of appointed student leaders and assistant coordinators across all active institutional orbits.
              </p>
            </div>

            {/* Leaders Settings Redirection Link with Arrow */}
            <Link href="/admin/orbit-leaders/settings">
              <Button size="default" variant="default" className="gap-2 font-medium shadow-sm hover:opacity-95">
                <Settings className="size-4" />
                <span>Leaders Settings</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>

          {/* Interactive Client Component with Sticky Filter Card */}
          <OrbitLeadersListClient
            initialRecords={leadershipRecords}
            colleges={colleges}
          />

        </div>
      </main>

      <Footer />
    </div>
  );
}
