import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card py-12 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded bg-primary text-primary-foreground font-serif font-bold text-sm">
                W
              </div>
              <span className="font-serif font-bold text-base text-foreground">
                Wafy Orbit
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              An institutional digital ecosystem synchronizing academic orbits, affiliated
              colleges, leadership circles, and students under the Wafy Institution.
            </p>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold text-foreground mb-3">
              Public Directories
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/orbit-details/orbits" className="hover:text-foreground transition-colors">
                  Orbit Directory
                </Link>
              </li>
              <li>
                <Link href="/orbit-details/students" className="hover:text-foreground transition-colors">
                  Student Directory
                </Link>
              </li>
              <li>
                <Link href="/orbit-details/colleges" className="hover:text-foreground transition-colors">
                  Affiliated Colleges
                </Link>
              </li>
              <li>
                <Link href="/orbit-details/leaders" className="hover:text-foreground transition-colors">
                  Orbit Leaders
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold text-foreground mb-3">
              Secure Portals
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/portal/admin" className="hover:text-foreground transition-colors">
                  Central Administration
                </Link>
              </li>
              <li>
                <Link href="/portal/orbit" className="hover:text-foreground transition-colors">
                  Orbit Coordination
                </Link>
              </li>
              <li>
                <Link href="/portal/college" className="hover:text-foreground transition-colors">
                  College Administration
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>© {new Date().getFullYear()} Wafy Institution. All rights reserved.</p>
          <p className="font-mono text-[11px]">Designed with Amber Minimal System</p>
        </div>
      </div>
    </footer>
  );
}
