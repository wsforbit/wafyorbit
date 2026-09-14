import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Layers } from "lucide-react";
import { OrbitDashboardClient } from "@/components/orbit/orbit-dashboard-client";
import type { Orbit, Student, OrbitLeader } from "@/types/database.types";

export const revalidate = 0;

export default async function OrbitDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 1. Resolve Profile and Assigned Orbit ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  let targetOrbitId: string | null = profile?.assigned_orbit_id || (user.user_metadata?.assigned_orbit_id as string | undefined) || null;

  // 2. If targetOrbitId not found in profile/metadata, resolve by email prefix
  if (!targetOrbitId && user.email) {
    const emailPrefix = user.email.split("@")[0]?.toLowerCase().trim();
    if (emailPrefix && emailPrefix !== "admin") {
      const { data: matchedOrbs } = await supabase
        .from("orbits")
        .select("id, name");

      if (matchedOrbs) {
        const found = matchedOrbs.find((o) => {
          const firstWord = (o.name || "").trim().split(/[\s,]+/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, "");
          return firstWord === emailPrefix || o.id.toLowerCase() === emailPrefix || o.id.toLowerCase().includes(emailPrefix);
        });
        if (found) {
          targetOrbitId = found.id;
        }
      }
    }
  }

  let currentOrbit: Orbit | null = null;
  let members: Student[] = [];
  let leaders: (OrbitLeader & { student?: Student | null })[] = [];

  if (targetOrbitId) {
    // Query Orbit by ID
    const { data: orb } = await supabase
      .from("orbits")
      .select("*")
      .eq("id", targetOrbitId)
      .maybeSingle();

    currentOrbit = orb;

    if (currentOrbit) {
      // Parallel fetch for enrolled students and appointed leaders
      const [memRes, leadRes] = await Promise.all([
        supabase
          .from("students")
          .select("*, college:colleges(*)")
          .eq("orbit_id", currentOrbit.id)
          .order("cicno", { ascending: true }),
        supabase
          .from("orbit_leaders")
          .select("*, student:students(*, college:colleges(*))")
          .eq("orbit_id", currentOrbit.id)
          .order("appointed_at", { ascending: false }),
      ]);

      members = (memRes.data as Student[]) || [];
      leaders = (leadRes.data as (OrbitLeader & { student?: Student | null })[]) || [];
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20 selection:text-foreground">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          
          {currentOrbit ? (
            <OrbitDashboardClient
              orbit={currentOrbit}
              members={members}
              leaders={leaders}
            />
          ) : (
            <div className="p-12 text-center border border-dashed rounded-lg bg-card space-y-3">
              <Layers className="size-10 text-muted-foreground mx-auto" />
              <h3 className="font-serif font-bold text-xl text-foreground">
                No Orbit Assigned to Your Account
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Your authenticated account (<strong>{user.email}</strong>) is currently not linked to a specific Orbit ID. Please contact central administration to assign your jurisdiction scope.
              </p>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
