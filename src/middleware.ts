// ============================================================
// ZIKRA — MIDDLEWARE (BLOKLASH / BAN NAZORATI)
// ============================================================
// JOYLASHUV: `src/app/` ishlatilgani uchun bu fayl AYNAN `src/middleware.ts`
// da bo'lishi kerak (root'dagi middleware Next.js tomonidan e'tiborsiz qoladi).
//
// LOOP'NING OLDINI OLISH — 2 ta qoida:
//   1) YAGONA HOKIMIYAT: bloklangan/bloklanmagan qarorini FAQAT shu middleware
//      qabul qiladi. /banned sahifasi HECH QAYERGA redirect qilmaydi. Shunday
//      qilib "ikki tomon bir-birini otishi" (loop) butunlay yo'qoladi.
//   2) HAR DOIM FRESH: Supabase so'rovlari `no-store` bilan ketadi — middleware
//      hech qachon eski (keshlangan) is_banned'ni ko'rmaydi.
// ============================================================

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isUserBanned } from "@/lib/ban";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.log("[BAN] ENV topilmadi — middleware jim o'tadi");
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
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
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
    // MUHIM (loop fix #2): har doim yangi ma'lumot. Next.js data cache'ni
    // chetlab o'tamiz — aks holda eski is_banned=true keshlanib, loop bo'ladi.
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });

  // Cookie'dagi JWT tokenni Supabase serverida tekshiradi
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Ichki/xizmat yo'llari — tegmaymiz (logout, API, RSC data)
  if (
    path.startsWith("/api") ||
    path.startsWith("/auth") ||
    path.startsWith("/_next")
  ) {
    return response;
  }

  // Mehmon (tizimga kirmagan)
  if (!user) {
    // Bloklanmagan mehmon /banned'da qolib ketmasin
    if (path === "/banned") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  // --- FRESH profil holati (no-store tufayli har doim yangi) ---
  const { data: prof, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) console.log("[BAN] profiles so'rov xatosi:", error.message);

  const banned = isUserBanned(prof);
  console.log(`[BAN] path=${path} | user=${user.id} | banned=${banned}`);

  // ── YAGONA HOKIMIYAT: ikkala yo'nalish ham SHU yerda ──
  // 1) Bloklangan bo'lsa va /banned'da bo'lmasa -> qora ekranga
  if (banned && path !== "/banned") {
    console.log("[BAN] ➜ /banned (bloklangan)");
    return NextResponse.redirect(new URL("/banned", request.url));
  }
  // 2) Bloklanmagan bo'lsa va /banned'da bo'lsa -> bosh sahifaga (loop yo'q)
  if (!banned && path === "/banned") {
    console.log("[BAN] bloklanmagan — /banned'dan ➜ / ga");
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Aks holda: hamma narsa joyida, davom etadi
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
