"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Globe,
  Shield,
  Layers,
  School,
  GraduationCap,
  Award,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/layout/user-nav";

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAdminDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const adminSublinks = [
    { href: "/admin/dashboard", label: "Executive Dashboard", icon: LayoutDashboard, desc: "Live institutional metrics" },
    { href: "/admin/orbit", label: "Orbits & Bulk Upload", icon: Layers, desc: "List, single add & CSV import" },
    { href: "/admin/college", label: "Colleges & Bulk Upload", icon: School, desc: "Campuses, single add & CSV import" },
    { href: "/admin/students", label: "Students & Bulk Upload", icon: GraduationCap, desc: "Scholars, single add & CSV import" },
    { href: "/admin/orbit-leaders", label: "Orbit Leaders Matrix", icon: Award, desc: "Appoint Leaders & Asst Leaders" },
  ];

  const publicLinks = [
    { href: "/orbit-details", label: "Orbit Details", icon: Globe },
    { href: "/orbit/dashboard", label: "Orbit Portal", icon: Layers },
    { href: "/college/dashboard", label: "College Portal", icon: School },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-serif font-bold text-lg shadow-xs group-hover:scale-105 transition-transform">
            W
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-lg leading-tight tracking-tight text-foreground">
              Wafy Orbit
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">
              Institutional Sphere
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1.5">
          
          {/* Public Orbit Details */}
          <Link
            href="/orbit-details"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              pathname.startsWith("/orbit-details")
                ? "bg-secondary text-secondary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Globe className="size-3.5" />
            Orbit Details
          </Link>

          {/* Admin Suite Interactive Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                pathname.startsWith("/admin")
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Shield className="size-3.5" />
              <span>Admin Management</span>
              <ChevronDown className={`size-3 transition-transform ${adminDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {adminDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 rounded-lg border border-border bg-card p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-2 py-1 text-[10px] font-mono uppercase text-muted-foreground font-bold">
                  Central Administration
                </div>
                <div className="space-y-1 mt-1">
                  {adminSublinks.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setAdminDropdownOpen(false)}
                        className={`flex items-start gap-2.5 p-2 rounded-md transition-colors ${
                          isSubActive
                            ? "bg-secondary text-secondary-foreground font-semibold"
                            : "hover:bg-muted/60 text-foreground"
                        }`}
                      >
                        <SubIcon className="size-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-medium leading-tight">{sub.label}</div>
                          <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{sub.desc}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Orbit Portal */}
          <Link
            href="/orbit/dashboard"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              pathname.startsWith("/orbit/dashboard")
                ? "bg-secondary text-secondary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Layers className="size-3.5" />
            Orbit Portal
          </Link>

          {/* College Portal */}
          <Link
            href="/college/dashboard"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              pathname.startsWith("/college/dashboard")
                ? "bg-secondary text-secondary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <School className="size-3.5" />
            College Portal
          </Link>

        </nav>

        {/* Action Button & User Nav with Sign Out */}
        <div className="hidden lg:flex items-center gap-3">
          <UserNav />
        </div>

        {/* Mobile Hamburger Toggle & UserNav */}
        <div className="flex items-center gap-2 lg:hidden">
          <UserNav />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border bg-background px-4 pt-2 pb-6 space-y-4 shadow-md animate-in slide-in-from-top-2 duration-200">
          
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-mono uppercase text-muted-foreground font-bold">
              Admin Suite
            </div>
            {adminSublinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-secondary text-secondary-foreground font-semibold"
                      : "text-foreground hover:bg-muted/60"
                  }`}
                >
                  <Icon className="size-4 text-primary shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="border-t border-border pt-2 space-y-1">
            <div className="px-2 py-1 text-[10px] font-mono uppercase text-muted-foreground font-bold">
              Public & Portal Access
            </div>
            {publicLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-secondary text-secondary-foreground font-semibold"
                      : "text-foreground hover:bg-muted/60"
                  }`}
                >
                  <Icon className="size-4 text-primary shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
