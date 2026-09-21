import Link from "next/link";
import Image from "next/image";
import { Globe, Lock } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card py-12 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Institutional Branding */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-md overflow-hidden bg-background border border-border/60 p-0.5 shadow-2xs">
                <Image
                  src="/orbitlogo.png"
                  alt="Wafy Orbit Logo"
                  width={32}
                  height={32}
                  className="size-full object-contain"
                />
              </div>
              <span className="font-serif font-bold text-base text-foreground">
                Wafy Orbit Platform
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              An institutional digital ecosystem synchronizing academic orbits, affiliated
              campuses, leadership circles, and enrolled scholars under the Wafy Institution.
            </p>
          </div>

          {/* Public Directories */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <Globe className="size-3.5 text-primary" />
              <span>Public Directories</span>
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/orbit-details/orbits" className="hover:text-foreground transition-colors">
                  Orbit Directory
                </Link>
              </li>
              <li>
                <Link href="/orbit-details/students" className="hover:text-foreground transition-colors">
                  Find Your Orbit
                </Link>
              </li>
              <li>
                <Link href="/orbit-details/colleges" className="hover:text-foreground transition-colors">
                  Affiliated Colleges
                </Link>
              </li>
              <li>
                <Link href="/orbit-details/leaders" className="hover:text-foreground transition-colors">
                  Orbit Leaders Matrix
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Footer Bottom Bar */}
        <div className="mt-10 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>© {new Date().getFullYear()} Wafy Orbit. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="flex items-center gap-1 text-[11px] font-mono hover:text-foreground transition-colors text-muted-foreground"
            >
              <Lock className="size-3" />
              <span>Portal Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
