import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MapPin } from "lucide-react";
import { DistrictDashboardClient } from "@/components/district/district-dashboard-client";
import type { Orbit, Student, OrbitLeader } from "@/types/database.types";

export const revalidate = 0;

export default async function DistrictDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 1. Resolve Profile and Target District
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  let targetDistrict: string | null =
    (user.user_metadata?.assigned_district as string | undefined) ||
    profile?.assigned_district ||
    null;

  // 2. Fallback: resolve from email slug (e.g. d_kannur@orbit.com -> Kannur)
  if (!targetDistrict && user.email) {
    const emailPrefix = user.email.split("@")[0]?.toLowerCase().trim();
    const cleanSlug = emailPrefix.replace(/^d_/, "").replace(/[^a-z0-9]/g, "");

    const { data: matchedOrbs } = await supabase
      .from("orbits")
      .select("district")
      .not("district", "is", null);

    if (matchedOrbs) {
      const found = matchedOrbs.find((o) => {
        const d = (o.district || "").trim();
        const slug = d.toLowerCase().replace(/[^a-z0-9]/g, "");
        return slug === cleanSlug;
      });
      if (found?.district) {
        targetDistrict = found.district.trim();
      }
    }
  }

  let orbits: Orbit[] = [];
  let students: Student[] = [];
  let orbitLeaders: (OrbitLeader & { student?: Student | null; orbit?: Orbit | null })[] = [];
  let districtLeader: any = null;
  let constituencyLeaders: any[] = [];

  if (targetDistrict) {
    // 3. Parallel fetch Orbits and Leaders
    const [orbitsRes, distLeaderRes] = await Promise.all([
      supabase
        .from("orbits")
        .select("*")
        .ilike("district", targetDistrict)
        .order("name", { ascending: true }),
      supabase
        .from("district_leaders")
        .select("*, student:students(*, college:colleges(*), orbit:orbits(*))")
        .ilike("district", targetDistrict)
        .maybeSingle(),
    ]);

    orbits = (orbitsRes.data as Orbit[]) || [];
    districtLeader = distLeaderRes.data || null;

    const orbitIds = orbits.map((o) => o.id);

    // If Malappuram, fetch constituency leaders
    if (targetDistrict.toLowerCase().includes("malappuram")) {
      const { data: constLeads } = await supabase
        .from("constituency_leaders")
        .select("*, student:students(*, college:colleges(*), orbit:orbits(*))")
        .order("constituency", { ascending: true });
      constituencyLeaders = constLeads || [];
    }

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
          {targetDistrict ? (
            <DistrictDashboardClient
              districtName={targetDistrict}
              orbits={orbits}
              students={students}
              orbitLeaders={orbitLeaders}
              districtLeader={districtLeader}
              constituencyLeaders={constituencyLeaders}
            />
          ) : (
            <div className="p-12 text-center border border-dashed rounded-lg bg-card space-y-3">
              <MapPin className="size-10 text-muted-foreground mx-auto" />
              <h3 className="font-serif font-bold text-xl text-foreground">
                No District Assigned to Your Account
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Your account (<strong>{user.email}</strong>) is not linked to an active District jurisdiction. Please contact central administration.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
