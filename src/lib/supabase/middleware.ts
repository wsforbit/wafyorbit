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
  const isConstituencyRoute = pathname.startsWith("/constituency/dashboard");
  const isDistrictRoute = pathname.startsWith("/district/dashboard");
  const isLoginPage = pathname === "/auth/login";

  const isProtectedRoute =
    isAdminRoute ||
    isLeaderRoute ||
    isCollegeRoute ||
    isConstituencyRoute ||
    isDistrictRoute;

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
    const email = (user.email || "").toLowerCase().trim();
    const leaderType = user.user_metadata?.leader_type as string | undefined;
    let role = user.user_metadata?.role as string | undefined;

    if (!role) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      role = profile?.role || "admin";
    }

    const isConstUser =
      email.startsWith("c_") ||
      leaderType === "constituency" ||
      role === "constituency";

    const isDistUser =
      email.startsWith("d_") ||
      leaderType === "district" ||
      role === "district";

    // A) If already logged in and visiting login page -> route to appropriate dashboard
    if (isLoginPage) {
      const url = request.nextUrl.clone();
      if (isConstUser) {
        url.pathname = "/constituency/dashboard";
      } else if (isDistUser) {
        url.pathname = "/district/dashboard";
      } else if (role === "leader") {
        url.pathname = "/orbit/dashboard";
      } else if (role === "college") {
        url.pathname = "/college/dashboard";
      } else {
        url.pathname = "/admin/dashboard";
      }
      return NextResponse.redirect(url);
    }

    // B) If Constituency Leader attempts to access Admin, College, or Orbit routes
    if (isConstUser && (isAdminRoute || isCollegeRoute || isLeaderRoute || isDistrictRoute)) {
      const url = request.nextUrl.clone();
      url.pathname = "/constituency/dashboard";
      return NextResponse.redirect(url);
    }

    // C) If District Leader attempts to access Admin, College, or Orbit routes
    if (isDistUser && (isAdminRoute || isCollegeRoute || isLeaderRoute || isConstituencyRoute)) {
      const url = request.nextUrl.clone();
      url.pathname = "/district/dashboard";
      return NextResponse.redirect(url);
    }

    // D) If Orbit Leader attempts to access Admin or College routes -> redirect to Orbit Dashboard
    if (role === "leader" && !isConstUser && !isDistUser && (isAdminRoute || isCollegeRoute || isConstituencyRoute || isDistrictRoute)) {
      const url = request.nextUrl.clone();
      url.pathname = "/orbit/dashboard";
      return NextResponse.redirect(url);
    }

    // E) If College Admin attempts to access Admin or Orbit routes -> redirect to College Dashboard
    if (role === "college" && (isAdminRoute || isLeaderRoute || isConstituencyRoute || isDistrictRoute)) {
      const url = request.nextUrl.clone();
      url.pathname = "/college/dashboard";
      return NextResponse.redirect(url);
    }

    // F) Admin has unrestricted access to /admin and supervisory views
  }

  return supabaseResponse;
}
