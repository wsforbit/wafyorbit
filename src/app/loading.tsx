import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Skeleton } from "@/components/ui/skeleton";

export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-4 max-w-2xl mx-auto text-center">
            <Skeleton className="h-6 w-36 mx-auto rounded-full" />
            <Skeleton className="h-12 w-full mx-auto" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
