import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Compass } from "lucide-react";
import { ConstituencyDashboardClient } from "@/components/constituency/constituency-dashboard-client";
import type { Orbit, Student, OrbitLeader } from "@/types/database.types";

export const revalidate = 0;

export default async function ConstituencyDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 1. Resolve Profile and Target Constituency Name
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  let targetConstituency: string | null =
    (user.user_metadata?.assigned_constituency as string | undefined) ||
    profile?.assigned_constituency ||
    null;

  // 2. If not found in metadata or profile, resolve by email slug (e.g. c_ponnani@orbit.com -> Ponnani)
  if (!targetConstituency && user.email) {
    const emailPrefix = user.email.split("@")[0]?.toLowerCase().trim();
    const cleanSlug = emailPrefix.replace(/^c_/, "").replace(/[^a-z0-9]/g, "");

    const { data: matchedOrbs } = await supabase
      .from("orbits")
      .select("constituency")
      .ilike("district", "%malappuram%")
      .not("constituency", "is", null);

    if (matchedOrbs) {
      const found = matchedOrbs.find((o) => {
        const c = (o.constituency || "").trim();
        const slug = c.toLowerCase().replace(/[^a-z0-9]/g, "");
        return slug === cleanSlug;
      });
      if (found?.constituency) {
        targetConstituency = found.constituency.trim();
      }
    }
  }

  let orbits: Orbit[] = [];
  let students: Student[] = [];
  let orbitLeaders: (OrbitLeader & { student?: Student | null; orbit?: Orbit | null })[] = [];
  let constituencyLeader: any = null;

  if (targetConstituency) {
    // 3. Parallel fetch Orbits, Constituency Leader
    const [orbitsRes, constLeaderRes] = await Promise.all([
      supabase
        .from("orbits")
        .select("*")
        .ilike("constituency", targetConstituency)
        .order("name", { ascending: true }),
      supabase
        .from("constituency_leaders")
        .select("*, student:students(*, college:colleges(*), orbit:orbits(*))")
        .ilike("constituency", targetConstituency)
        .maybeSingle(),
    ]);

    orbits = (orbitsRes.data as Orbit[]) || [];
    constituencyLeader = constLeaderRes.data || null;

    const orbitIds = orbits.map((o) => o.id);

    if (orbitIds.length > 0) {
      const [studentsRes, leadersRes] = await Promise.all([
        supabase
          .from("students")
          .select("*, college:colleges(*), orbit:orbits(*)")
          .in("orbit_id", orbitIds)
          .order("cicno", { ascending: true }),
        supabase
          .from("orbit_leaders")
          .select("*, student:students(*, college:colleges(*)), orbit:orbits(*)")
          .in("orbit_id", orbitIds)
          .order("appointed_at", { ascending: false }),
      ]);

      students = (studentsRes.data as Student[]) || [];
      orbitLeaders = (leadersRes.data as any[]) || [];
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20 selection:text-foreground">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          {targetConstituency ? (
            <ConstituencyDashboardClient
              constituencyName={targetConstituency}
              orbits={orbits}
              students={students}
              orbitLeaders={orbitLeaders}
              constituencyLeader={constituencyLeader}
            />
          ) : (
            <div className="p-12 text-center border border-dashed rounded-lg bg-card space-y-3">
              <Compass className="size-10 text-muted-foreground mx-auto" />
              <h3 className="font-serif font-bold text-xl text-foreground">
                No Constituency Assigned to Your Account
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Your account (<strong>{user.email}</strong>) is not linked to an active Malappuram Constituency. Please contact central administration.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
