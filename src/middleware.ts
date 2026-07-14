// ============================================================
// ZIKRA — MIDDLEWARE (BLOKLASH / BAN NAZORATI)
// ============================================================
// JOYLASHUV MUHIM: bu fayl AYNAN `src/middleware.ts` da turishi kerak.
// Loyihada `src/app/` ishlatilgani uchun Next.js middleware'ni faqat `src/`
// ichidan topadi. Ildizdagi (root) middleware.ts E'TIBORSIZ qoldiriladi.
//
// Vazifasi (faqat bitta, chalg'imasdan):
//   - Har so'rovda @supabase/ssr orqali cookie'dagi session'ni o'qiydi.
//   - Foydalanuvchi bloklangan bo'lsa (is_banned=true YOKI status='banned'),
//     uni majburan /banned qora ekraniga yo'naltiradi.
//   - Har qadamda console.log yozadi -> terminalda (next dev) ko'rinadi.
// ============================================================

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  console.log("\n[BAN] ───────────────────────────────");
  console.log("[BAN] Middleware ishga tushdi. Yo'l:", path);

  // Supabase cookie'larni yangilash uchun javob obyekti
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // ENV o'zgaruvchilari yo'q bo'lsa — middleware jim o'tadi (ilovani buzmaydi)
  if (!supabaseUrl || !supabaseKey) {
    console.log("[BAN] XATO: NEXT_PUBLIC_SUPABASE_URL / ANON_KEY topilmadi!");
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
  });

  // MUHIM: getUser() cookie'dagi JWT tokenni Supabase serverida tekshiradi
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log(
    "[BAN] Foydalanuvchi:",
    user ? user.id : "yo'q (tizimga kirmagan)"
  );

  // Ban tekshiruvidan chetlab o'tiladigan yo'llar
  // (/banned -> loop bo'lmasligi uchun; /api, /auth -> logout va API ishlashi uchun)
  const skipBanCheck =
    path === "/banned" ||
    path.startsWith("/api") ||
    path.startsWith("/auth") ||
    path.startsWith("/_next");

  if (user && !skipBanCheck) {
    // "*" -> is_banned ustuni hali qo'shilmagan bo'lsa ham XATO bermaydi
    const { data: prof, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.log("[BAN] profiles so'rovida XATO:", error.message);
    }

    const p = (prof ?? {}) as {
      status?: string | null;
      is_banned?: boolean | null;
      banned_until?: string | null;
    };

    console.log("[BAN] Baza holati:", {
      status: p.status,
      is_banned: p.is_banned,
      banned_until: p.banned_until,
    });

    // Blok mantiqi:
    //   - banned_until kelajakda    -> bloklangan (vaqtinchalik davom etyapti)
    //   - is_banned=true YOKI status='banned', muddat o'tmagan bo'lsa -> bloklangan
    //   - banned_until o'tmishda     -> blok tugagan (avtomatik ochiladi)
    const now = Date.now();
    const until = p.banned_until ? new Date(p.banned_until).getTime() : null;
    const untilInFuture = until !== null && !Number.isNaN(until) && until > now;
    const untilInPast = until !== null && !Number.isNaN(until) && until <= now;
    const flagged = p.status === "banned" || p.is_banned === true;
    const isBanned = untilInFuture || (flagged && !untilInPast);

    console.log(
      "[BAN] Belgilangan(flagged):",
      flagged,
      "| Muddat o'tganmi:",
      untilInPast,
      "=> BLOKLANGANMI:",
      isBanned
    );

    if (isBanned) {
      console.log("[BAN] ➜ /banned qora ekraniga YO'NALTIRILMOQDA");
      const url = request.nextUrl.clone();
      url.pathname = "/banned";
      url.search = "";
      return NextResponse.redirect(url);
    }

    console.log("[BAN] Foydalanuvchi bloklanmagan — davom etadi.");
  } else {
    console.log("[BAN] Tekshiruv o'tkazib yuborildi (skip yoki mehmon).");
  }

  return response;
}

// Qaysi yo'llarda middleware ishlashi — statik fayllardan tashqari hammasi
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
