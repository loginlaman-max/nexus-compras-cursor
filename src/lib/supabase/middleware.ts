import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  AUTH_ROUTES,
  isAuthOnlyPath,
  isPublicPath,
  ORG_COOKIE,
  SETUP_ROUTE,
} from "@/lib/auth/constants";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseEnv, isDemoMode } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isDemoMode()) {
    return NextResponse.next();
  }

  const env = getSupabaseEnv();

  if (!env) {
    if (pathname === SETUP_ROUTE) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = SETUP_ROUTE;
    url.search = "";
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const orgId = request.cookies.get(ORG_COOKIE)?.value;

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = AUTH_ROUTES.login;
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === AUTH_ROUTES.login) {
    const url = request.nextUrl.clone();
    url.pathname = orgId ? "/dashboard" : AUTH_ROUTES.orgSelect;
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (
    user &&
    !orgId &&
    !isPublicPath(pathname) &&
    !isAuthOnlyPath(pathname)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = AUTH_ROUTES.orgSelect;
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
