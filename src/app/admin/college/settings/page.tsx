import Link from "next/link";
import { ArrowLeft, School, Settings } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { getAdminColleges } from "@/lib/supabase/data";
import { CollegeSettingsClient } from "@/components/admin/college-settings-client";

export const revalidate = 0;

export default async function AdminCollegeSettingsPage() {
  const colleges = await getAdminColleges();

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20 selection:text-foreground">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          
          {/* Header & Back Link to College List */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <Link
                href="/admin/college"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono mb-2"
              >
                <ArrowLeft className="size-3.5" />
                Back to College List
              </Link>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs font-mono uppercase">
                  Central Settings
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">College Management</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-serif font-bold text-foreground mt-1">
                College Configuration & Provisioning
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Register campuses with automated college auth accounts, import CSV records, or update institutional details.
              </p>
            </div>
          </div>

          {/* Interactive Settings Console */}
          <CollegeSettingsClient initialColleges={colleges} />

        </div>
      </main>

      <Footer />
    </div>
  );
}
