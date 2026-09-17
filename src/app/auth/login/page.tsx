"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, Mail, ArrowLeft, Shield, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      if (returnUrl) {
        router.push(returnUrl);
        router.refresh();
        return;
      }

      // Check role in profiles table to route intelligently
      const user = data.user;
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "leader") {
          router.push("/orbit/dashboard");
        } else if (profile?.role === "college") {
          router.push("/college/dashboard");
        } else {
          router.push("/admin/dashboard");
        }
      } else {
        router.push("/admin/dashboard");
      }

      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected authentication error occurred.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-muted/20 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
        >
          <ArrowLeft className="size-3.5" />
          Back to Wafy Orbit Home
        </Link>

        {/* Login Card */}
        <Card className="shadow-lg border-border bg-card">
          <CardHeader className="space-y-2 text-center pb-4">
            <div className="size-16 rounded-xl overflow-hidden bg-background border border-border/80 shadow-xs flex items-center justify-center mx-auto p-1.5">
              <Image
                src="/orbitlogo.png"
                alt="Wafy Orbit Logo"
                width={56}
                height={56}
                className="size-full object-contain"
                priority
              />
            </div>
            <CardTitle className="text-2xl font-serif">Wafy Orbit Institutional Login</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Authorized access for Central Admin, Orbit Leaders, and College Administrators.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="admin@wafyorbit.edu or orbitname@orbit.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-xs sm:text-sm"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 text-xs sm:text-sm"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full font-medium h-10 gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Authenticating credentials...
                  </>
                ) : (
                  "Sign In to Dashboard"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 text-center text-xs text-muted-foreground border-t border-border pt-4">
            <div className="flex items-center gap-1.5 font-mono">
              <Badge variant="secondary" className="text-[10px]">Role-Aware Routing</Badge>
              <span>Admin, Orbit Leader & College Console</span>
            </div>
            <p className="text-[11px] text-muted-foreground/80">
              Accounts for Orbit Leaders are generated via the Admin Orbit Settings page.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
