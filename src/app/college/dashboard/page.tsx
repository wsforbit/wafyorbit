import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Info, School } from "lucide-react";
import { CollegeDashboardClient } from "@/components/college/college-dashboard-client";
import type { College, Student, OrbitLeader } from "@/types/database.types";

export const revalidate = 0;

export default async function CollegeDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 1. Resolve Profile and College Affiliation ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  let targetAffno: string | null = profile?.assigned_college_id || (user.user_metadata?.assigned_college_id as string | undefined) || null;

  // 2. If targetAffno is not in profile/metadata, resolve by user email
  if (!targetAffno && user.email) {
    const emailPrefix = user.email.split("@")[0]?.toLowerCase().trim();

    // Check if college has matching email
    const { data: directCol } = await supabase
      .from("colleges")
      .select("affno")
      .ilike("email", user.email)
      .maybeSingle();

    if (directCol) {
      targetAffno = directCol.affno;
    } else if (emailPrefix && emailPrefix !== "admin") {
      // Check if short_name or affno matches the email prefix (e.g. wasc@orbit.com -> short_name WASC or affno WASC01)
      const { data: matchedCols } = await supabase
        .from("colleges")
        .select("affno, short_name");

      if (matchedCols) {
        const found = matchedCols.find((c) => {
          const firstWord = (c.short_name || "").trim().split(/[\s,]+/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, "");
          return firstWord === emailPrefix || c.affno.toLowerCase().includes(emailPrefix);
        });
        if (found) {
          targetAffno = found.affno;
        }
      }
    }
  }

  let currentCollege: College | null = null;
  let collegeStudents: Student[] = [];
  let collegeLeaders: (OrbitLeader & { student?: Student | null })[] = [];

  if (targetAffno) {
    // Fetch target college using affno as primary key
    const { data: col } = await supabase
      .from("colleges")
      .select("*")
      .eq("affno", targetAffno)
      .maybeSingle();

    currentCollege = col;

    if (currentCollege) {
      // Fetch students belonging to this college
      const { data: stds } = await supabase
        .from("students")
        .select("*, orbit:orbits(*)")
        .eq("affno", currentCollege.affno)
        .order("cicno", { ascending: true });

      collegeStudents = (stds as Student[]) || [];

      // Fetch orbit leaders belonging to this college
      const { data: allLeaders } = await supabase
        .from("orbit_leaders")
        .select("*, student:students(*), orbit:orbits(*)")
        .order("appointed_at", { ascending: false });

      if (allLeaders) {
        collegeLeaders = allLeaders.filter((l) => {
          const studentAff = (l.student as unknown as { affno?: string })?.affno;
          return studentAff === currentCollege?.affno;
        }) as any;
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20 selection:text-foreground">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          
          {currentCollege ? (
            <CollegeDashboardClient
              college={currentCollege}
              students={collegeStudents}
              leaders={collegeLeaders}
            />
          ) : (
            <div className="p-12 text-center border border-dashed rounded-lg bg-card space-y-3">
              <School className="size-10 text-muted-foreground mx-auto" />
              <h3 className="font-serif font-bold text-xl text-foreground">
                No College Assigned to Your Account
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Your authenticated account (<strong>{user.email}</strong>) is currently not linked to a specific college affiliation number. Please contact central administration to link your institution.
              </p>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
