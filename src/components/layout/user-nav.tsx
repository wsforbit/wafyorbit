"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { LogOut, User, Shield, Layers, School, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { signOutAction } from "@/app/auth/actions";

export function UserNav() {
  const [user, setUser] = useState<{ email?: string; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          let role = (user.user_metadata?.role as string) || "";
          if (!role) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", user.id)
              .maybeSingle();
            role = profile?.role || "admin";
          }
          setUser({ email: user.email, role });
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error("UserNav load error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction();
    });
  };

  if (loading) {
    return <div className="h-8 w-20 bg-muted/40 animate-pulse rounded-md" />;
  }

  if (!user) {
    return (
      <Link href="/auth/login">
        <Button variant="default" size="sm" className="gap-1.5 text-xs font-medium h-8">
          <LogIn className="size-3.5" />
          <span>Sign In</span>
        </Button>
      </Link>
    );
  }

  const roleLabel =
    user.role === "leader"
      ? "Orbit Leader"
      : user.role === "college"
      ? "College Admin"
      : "Central Admin";

  const RoleIcon =
    user.role === "leader"
      ? Layers
      : user.role === "college"
      ? School
      : Shield;

  return (
    <div className="flex items-center gap-2">
      {/* Role & Email Info Badge */}
      <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/40 border border-border text-xs">
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
        <span className="hidden xs:inline">Sign Out</span>
      </Button>
    </div>
  );
}
