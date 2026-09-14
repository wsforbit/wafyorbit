import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Get authenticated user securely from Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. Determine Protected Route Categories
  const isAdminRoute = pathname.startsWith("/admin");
  const isLeaderRoute = pathname.startsWith("/orbit/dashboard");
  const isCollegeRoute = pathname.startsWith("/college/dashboard");
  const isLoginPage = pathname === "/auth/login";

  const isProtectedRoute = isAdminRoute || isLeaderRoute || isCollegeRoute;

  // 2. Unauthenticated user handling
  if (isProtectedRoute && !user) {
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  // 3. Authenticated user Role-Based Access Control (RBAC)
  if (user) {
    // Resolve user role
    let role = user.user_metadata?.role as string | undefined;

    if (!role) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      role = profile?.role || "admin";
    }

    // A) If already logged in and visiting login page -> route to appropriate dashboard
    if (isLoginPage) {
      const url = request.nextUrl.clone();
      if (role === "leader") {
        url.pathname = "/orbit/dashboard";
      } else if (role === "college") {
        url.pathname = "/college/dashboard";
      } else {
        url.pathname = "/admin/dashboard";
      }
      return NextResponse.redirect(url);
    }

    // B) If Leader attempts to access Admin or College routes -> redirect to Orbit Dashboard
    if (role === "leader" && (isAdminRoute || isCollegeRoute)) {
      const url = request.nextUrl.clone();
      url.pathname = "/orbit/dashboard";
      return NextResponse.redirect(url);
    }

    // C) If College Admin attempts to access Admin or Orbit routes -> redirect to College Dashboard
    if (role === "college" && (isAdminRoute || isLeaderRoute)) {
      const url = request.nextUrl.clone();
      url.pathname = "/college/dashboard";
      return NextResponse.redirect(url);
    }

    // D) Admin has unrestricted access to /admin and supervisory views
  }

  return supabaseResponse;
}
