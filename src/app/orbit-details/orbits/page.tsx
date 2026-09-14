import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { DirectoryNav } from "@/components/directory/directory-nav";
import { getOrbits } from "@/lib/supabase/data";
import { OrbitTableClient } from "@/components/directory/orbit-table-client";

export const revalidate = 0;

export default async function OrbitListPage() {
  const orbits = await getOrbits();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <DirectoryNav />

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight text-foreground">
              Orbit List
            </h1>
            <p className="text-sm text-muted-foreground">
              Explore specialized institutional orbits, categories, and affiliated colleges.
            </p>
          </div>

          <OrbitTableClient initialOrbits={orbits} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
