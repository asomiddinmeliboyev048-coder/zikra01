import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Har bir so'rovda Supabase session'ni yangilab turadi (cookie refresh).
 * Himoyalangan sahifalarga kirishni nazorat qiladi.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Himoyalangan yo'llar — login talab qiladi
  const protectedPaths = [
    "/welcome",
    "/onboarding",
    "/discovery",
    "/chat",
    "/videos",
    "/lessons",
    "/notifications",
    "/settings",
  ];
  const path = request.nextUrl.pathname;
  const isProtected = protectedPaths.some((p) => path.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  // Auto-login: kirgan foydalanuvchini landing/login/register'dan discovery'ga yo'naltirish
  if (user && (path === "/" || path === "/login" || path === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/discovery";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
