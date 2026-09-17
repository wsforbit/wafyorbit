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
  LogIn,
  LogOut,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { signOutAction } from "@/app/auth/actions";

interface UserState {
  email?: string;
  role?: string;
}

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Load authenticated user and listen to auth changes
  useEffect(() => {
    const supabase = createClient();

    async function checkUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          let role = (authUser.user_metadata?.role as string) || "";
          if (!role) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", authUser.id)
              .maybeSingle();
            role = profile?.role || "admin";
          }
          setUser({ email: authUser.email, role });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Header auth check error:", err);
      } finally {
        setLoading(false);
      }
    }

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const role = (session.user.user_metadata?.role as string) || "admin";
        setUser({ email: session.user.email, role });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction();
    });
  };

  const adminSublinks = [
    { href: "/admin/dashboard", label: "Executive Dashboard", icon: LayoutDashboard, desc: "Live institutional metrics" },
    { href: "/admin/orbit", label: "Orbits & Bulk Upload", icon: Layers, desc: "List, single add & CSV import" },
    { href: "/admin/college", label: "Colleges & Bulk Upload", icon: School, desc: "Campuses, single add & CSV import" },
    { href: "/admin/students", label: "Students & Bulk Upload", icon: GraduationCap, desc: "Scholars, single add & CSV import" },
    { href: "/admin/orbit-leaders", label: "Leadership Delegation", icon: Award, desc: "Orbit, District & Constituency" },
  ];

  const roleLabel =
    user?.role === "leader"
      ? "Orbit Leader"
      : user?.role === "college"
      ? "College Admin"
      : user?.role === "admin"
      ? "Central Admin"
      : "";

  const RoleIcon =
    user?.role === "leader"
      ? Layers
      : user?.role === "college"
      ? School
      : Shield;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex size-9 items-center justify-center rounded-md overflow-hidden bg-background border border-border/60 shadow-xs group-hover:scale-105 transition-transform p-0.5">
            <Image
              src="/orbitlogo.png"
              alt="Wafy Orbit Logo"
              width={36}
              height={36}
              className="size-full object-contain"
              priority
            />
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
        <nav className="hidden lg:flex items-center gap-2">
          
          {/* Public Orbit Details (Visible to Everyone) */}
          <Link
            href="/orbit-details"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              pathname.startsWith("/orbit-details")
                ? "bg-secondary text-secondary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Globe className="size-3.5" />
            <span>Orbit Details</span>
          </Link>

          {/* 1. ADMIN LOGGED IN: Show Admin Suite Dropdown */}
          {user?.role === "admin" && (
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
          )}

          {/* 2. ORBIT LEADER LOGGED IN: Show Orbit Portal Link */}
          {user?.role === "leader" && (
            <Link
              href="/orbit/dashboard"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                pathname.startsWith("/orbit/dashboard")
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Layers className="size-3.5" />
              <span>Orbit Leadership Portal</span>
            </Link>
          )}

          {/* 3. COLLEGE ADMIN LOGGED IN: Show College Portal Links */}
          {user?.role === "college" && (
            <>
              <Link
                href="/college/dashboard"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pathname === "/college/dashboard"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <School className="size-3.5" />
                <span>College Dashboard</span>
              </Link>

              <Link
                href="/college/update-orbit"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pathname === "/college/update-orbit"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Layers className="size-3.5" />
                <span>Update Orbit</span>
              </Link>
            </>
          )}

        </nav>

        {/* Right Section: Sign In / User Profile */}
        <div className="hidden lg:flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-20 bg-muted/40 animate-pulse rounded-md" />
          ) : user ? (
            <div className="flex items-center gap-2">
              {/* Role & Email Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/40 border border-border text-xs">
                <RoleIcon className="size-3.5 text-primary shrink-0" />
                <span className="font-mono text-[11px] font-semibold text-foreground">{roleLabel}</span>
                {user.email && (
                  <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
                    ({user.email.split("@")[0]})
                  </span>
                )}
              </div>

              {/* Sign Out Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                disabled={isPending}
                className="gap-1.5 text-xs font-medium h-8 hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                {isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <LogOut className="size-3.5" />
                )}
                <span>Sign Out</span>
              </Button>
            </div>
          ) : (
            <Link href="/auth/login">
              <Button variant="default" size="sm" className="gap-1.5 text-xs font-medium h-8 shadow-xs">
                <LogIn className="size-3.5" />
                <span>Sign In</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile View Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          {user ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={isPending}
              className="h-8 text-xs px-2.5"
            >
              <LogOut className="size-3.5" />
            </Button>
          ) : (
            <Link href="/auth/login">
              <Button size="sm" className="h-8 text-xs gap-1 px-3">
                <LogIn className="size-3" />
                <span>Sign In</span>
              </Button>
            </Link>
          )}

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
          
          {/* Public Link */}
          <div className="space-y-1">
            <Link
              href="/orbit-details"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                pathname.startsWith("/orbit-details")
                  ? "bg-secondary text-secondary-foreground font-semibold"
                  : "text-foreground hover:bg-muted/60"
              }`}
            >
              <Globe className="size-4 text-primary shrink-0" />
              <span>Orbit Details Directory</span>
            </Link>
          </div>

          {/* ADMIN Logged In Mobile Links */}
          {user?.role === "admin" && (
            <div className="border-t border-border pt-2 space-y-1">
              <div className="px-2 py-1 text-[10px] font-mono uppercase text-muted-foreground font-bold">
                Admin Management Suite
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
          )}

          {/* ORBIT LEADER Logged In Mobile Links */}
          {user?.role === "leader" && (
            <div className="border-t border-border pt-2 space-y-1">
              <div className="px-2 py-1 text-[10px] font-mono uppercase text-muted-foreground font-bold">
                Orbit Leader Workspace
              </div>
              <Link
                href="/orbit/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  pathname.startsWith("/orbit/dashboard")
                    ? "bg-secondary text-secondary-foreground font-semibold"
                    : "text-foreground hover:bg-muted/60"
                }`}
              >
                <Layers className="size-4 text-primary shrink-0" />
                <span>Orbit Leadership Portal</span>
              </Link>
            </div>
          )}

          {/* COLLEGE ADMIN Logged In Mobile Links */}
          {user?.role === "college" && (
            <div className="border-t border-border pt-2 space-y-1">
              <div className="px-2 py-1 text-[10px] font-mono uppercase text-muted-foreground font-bold">
                College Administration
              </div>
              <Link
                href="/college/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  pathname === "/college/dashboard"
                    ? "bg-secondary text-secondary-foreground font-semibold"
                    : "text-foreground hover:bg-muted/60"
                }`}
              >
                <School className="size-4 text-primary shrink-0" />
                <span>College Dashboard</span>
              </Link>
              <Link
                href="/college/update-orbit"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  pathname === "/college/update-orbit"
                    ? "bg-secondary text-secondary-foreground font-semibold"
                    : "text-foreground hover:bg-muted/60"
                }`}
              >
                <Layers className="size-4 text-primary shrink-0" />
                <span>Update Orbit</span>
              </Link>
            </div>
          )}

          {/* User Sign In / Out Mobile Row */}
          <div className="border-t border-border pt-3 flex items-center justify-between">
            {user ? (
              <>
                <div className="text-xs">
                  <div className="font-semibold text-foreground font-mono">{roleLabel}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{user.email}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  disabled={isPending}
                  className="gap-1.5 text-xs text-destructive hover:text-destructive"
                >
                  <LogOut className="size-3.5" />
                  <span>Sign Out</span>
                </Button>
              </>
            ) : (
              <Link href="/auth/login" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full gap-2 text-xs">
                  <LogIn className="size-3.5" />
                  <span>Authorized Sign In</span>
                </Button>
              </Link>
            )}
          </div>

        </div>
      )}
    </header>
  );
}
