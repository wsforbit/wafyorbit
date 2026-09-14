import Link from "next/link";
import { ArrowLeft, Layers, Settings, Shield } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { getAllOrbits } from "@/lib/supabase/data";
import { OrbitSettingsClient } from "@/components/admin/orbit-settings-client";

export const revalidate = 0;

export default async function AdminOrbitSettingsPage() {
  const allOrbits = await getAllOrbits();

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20 selection:text-foreground">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          
          {/* Header & Back Link to Orbit List */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <Link
                href="/admin/orbit"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono mb-2"
              >
                <ArrowLeft className="size-3.5" />
                Back to Orbit List
              </Link>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs font-mono uppercase">
                  Central Settings
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">Orbits Management</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-serif font-bold text-foreground mt-1">
                Orbit Configuration & Operations
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Add single/bulk orbits with automated leader auth accounts, edit jurisdictions, delete, or merge orbits.
              </p>
            </div>
          </div>

          {/* Interactive Settings Console */}
          <OrbitSettingsClient initialOrbits={allOrbits} />

        </div>
      </main>

      <Footer />
    </div>
  );
}
