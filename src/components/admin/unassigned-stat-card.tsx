"use client";

import { useState } from "react";
import { UserX, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CollegeUnassignedGroup } from "@/types/database.types";
import { UnassignedStudentsModal } from "./unassigned-students-modal";

interface Props {
  unassignedCount: number;
  initialGroups: CollegeUnassignedGroup[];
  initialTotalUnassigned: number;
  initialTotalColleges: number;
}

export function UnassignedStatCard({
  unassignedCount,
  initialGroups,
  initialTotalUnassigned,
  initialTotalColleges,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Card
        onClick={() => setIsModalOpen(true)}
        className="bg-card cursor-pointer border hover:border-amber-500/50 hover:shadow-md transition-all group relative overflow-hidden"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsModalOpen(true);
          }
        }}
        title="Click to view unassigned scholars broken down by college with PDF export"
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-mono uppercase text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1.5">
            <span>6. Not Yet Assigned</span>
          </CardTitle>
          <div className="size-8 rounded bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
            <UserX className="size-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-3xl font-serif font-bold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {unassignedCount.toLocaleString()}
            </div>
            <Badge
              variant="secondary"
              className="text-[10px] font-mono text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white transition-all gap-1"
            >
              <span>View Breakdown</span>
              <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 group-hover:text-foreground/80 transition-colors">
            Awaiting orbit placement • Click to view by college
          </p>
        </CardContent>
      </Card>

      <UnassignedStudentsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialGroups={initialGroups}
        initialTotalUnassigned={initialTotalUnassigned}
        initialTotalColleges={initialTotalColleges}
      />
    </>
  );
}
