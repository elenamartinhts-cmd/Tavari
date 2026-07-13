import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");

  const isPortalRoute = request.nextUrl.pathname.startsWith("/portal");
  const isSetupRoute = request.nextUrl.pathname.startsWith("/tenant/setup");
  const isJoinRoute = request.nextUrl.pathname.startsWith("/tenant/join");
  const isUpdatePasswordRoute = request.nextUrl.pathname.startsWith("/update-password");

  const role = user?.user_metadata?.role as string | undefined;
  const isTenant = role === "tenant";

  // Unauthenticated: redirect to login (except portal, setup, join, and update-password)
  if (!user && !isAuthRoute && !isPortalRoute && !isSetupRoute && !isJoinRoute && !isUpdatePasswordRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Tenant finishing setup, joining, or updating password — let them through
  if (user && (isSetupRoute || isJoinRoute || isUpdatePasswordRoute)) {
    return supabaseResponse;
  }

  // Logged-in user on auth page → redirect to their home
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    if (isTenant) {
      const tenantId = user.user_metadata?.tenant_id as string | undefined;
      url.pathname = tenantId ? `/portal/${tenantId}` : "/tenant/setup";
    } else {
      url.pathname = "/dashboard";
    }
    return NextResponse.redirect(url);
  }

  // Tenant trying to access landlord routes → redirect to portal
  if (user && isTenant && !isPortalRoute && !isSetupRoute && !isUpdatePasswordRoute) {
    const tenantId = user.user_metadata?.tenant_id as string | undefined;
    const url = request.nextUrl.clone();
    url.pathname = tenantId ? `/portal/${tenantId}` : "/tenant/setup";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
