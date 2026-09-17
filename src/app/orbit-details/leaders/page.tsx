import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { DirectoryNav } from "@/components/directory/directory-nav";
import {
  getOrbitLeadershipData,
  getDistrictLeadershipData,
  getConstituencyLeadershipData,
} from "@/lib/supabase/data";
import { LeaderTableClient } from "@/components/directory/leader-table-client";

export const revalidate = 0;

export default async function OrbitLeadersPage() {
  const [orbitRecords, districtRecords, constituencyRecords] = await Promise.all([
    getOrbitLeadershipData(),
    getDistrictLeadershipData(),
    getConstituencyLeadershipData(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20 selection:text-foreground">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <DirectoryNav />

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight text-foreground">
              Leadership Delegation Directory
            </h1>
            <p className="text-sm text-muted-foreground">
              Designated student coordinators, district leaders, and constituency leadership officers across active Orbits.
            </p>
          </div>

          <LeaderTableClient
            initialOrbitRecords={orbitRecords}
            initialDistrictRecords={districtRecords}
            initialConstituencyRecords={constituencyRecords}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
