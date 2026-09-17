"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, GraduationCap, School, Award, ChevronRight } from "lucide-react";

export function DirectoryNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/orbit-details/orbits", label: "1. Orbit List", icon: Layers },
    { href: "/orbit-details/students", label: "2. Find Your Orbit", icon: GraduationCap },
    { href: "/orbit-details/colleges", label: "3. College List", icon: School },
    { href: "/orbit-details/leaders", label: "4. Orbit Leaders", icon: Award },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="size-3" />
        <Link href="/orbit-details" className="hover:text-foreground transition-colors">
          Orbit Details
        </Link>
        {pathname !== "/orbit-details" && (
          <>
            <ChevronRight className="size-3" />
            <span className="text-foreground capitalize font-semibold">
              {pathname.split("/").pop()}
            </span>
          </>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border/70 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="size-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
