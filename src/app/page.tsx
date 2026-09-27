import { getLiveMetrics } from "@/lib/supabase/data";
import { HomeAnimatedView } from "@/components/home/home-animated-view";

export const revalidate = 0; // Dynamic server rendering for live count accuracy

export default async function HomePage() {
  const metrics = await getLiveMetrics();

  return <HomeAnimatedView metrics={metrics} />;
}
