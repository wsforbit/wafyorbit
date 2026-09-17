import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { DirectoryNav } from "@/components/directory/directory-nav";
import { FindOrbitClient } from "@/components/directory/find-orbit-client";

export const revalidate = 0;

export default function FindOrbitPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20 selection:text-foreground">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <DirectoryNav />

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight text-foreground">
              Find Your Orbit
            </h1>
            <p className="text-sm text-muted-foreground">
              Look up your assigned Orbit domain, affiliated campus center, and academic standing by entering your CIC Number.
            </p>
          </div>

          <FindOrbitClient />
        </div>
      </main>

      <Footer />
    </div>
  );
}
