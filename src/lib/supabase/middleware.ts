import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { parseUserAgent } from "@/lib/utils";
import { isUserBanned } from "@/lib/ban";

/** So'rov sarlavhalaridan foydalanuvchi IP manzilini olish */
function getClientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

/**
 * Har bir so'rovda Supabase session'ni yangilab turadi (cookie refresh).
 * Himoyalangan sahifalarga kirishni nazorat qiladi.
 * Bloklangan foydalanuvchini qora ekranga (/banned) yo'naltiradi.
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

  const path = request.nextUrl.pathname;

  // ============================================================
  // BLOKLASH TEKSHIRUVI + KIRISH MA'LUMOTLARINI YOZIB OLISH
  // ============================================================
  // /banned, /api, /auth yo'llarini tekshiruvdan chetlab o'tamiz
  // (support xabari, chiqish (logout) va API chaqiruvlari ishlashi uchun).
  const skipBanCheck =
    path === "/banned" ||
    path.startsWith("/api") ||
    path.startsWith("/auth");

  if (user && !skipBanCheck) {
    // "*" ni tanlaymiz: shunda status/banned_until dan tashqari, agar admin
    // panel `is_banned` boolean ustunidan foydalansa, u ham o'qiladi. Mavjud
    // bo'lmagan ustunni nom bilan tanlash xato berardi — "*" esa xavfsiz.
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    // Mustahkam tekshiruv (status='banned' YOKI is_banned=true, muddat hisobga
    // olingan holda). /banned sahifasi ham AYNAN shu funksiyadan foydalanadi.
    const isBanned = isUserBanned(prof);

    if (isBanned) {
      // Qaysi sahifaga kirmasin — qora ekranga yo'naltiramiz
      const url = request.nextUrl.clone();
      url.pathname = "/banned";
      url.search = "";
      return NextResponse.redirect(url);
    }

    // --- Kirish ma'lumotlarini (IP + qurilma) yozib olish ---
    // Har so'rovda emas, cookie belgisi orqali ~6 soatda bir marta yozamiz.
    const alreadyLogged = request.cookies.get("zk_seen")?.value;
    if (!alreadyLogged) {
      const ip = getClientIp(request);
      const ua = request.headers.get("user-agent") ?? "";

      // profiles_update_own RLS foydalanuvchiga o'z yozuvini yangilashga ruxsat beradi.
      await supabase
        .from("profiles")
        .update({
          last_ip: ip,
          last_device: parseUserAgent(ua),
          last_user_agent: ua,
          last_login_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      // 6 soatlik belgi — keyingi yozuvgacha bazaga tegmaymiz
      supabaseResponse.cookies.set("zk_seen", "1", {
        maxAge: 60 * 60 * 6,
        httpOnly: true,
        sameSite: "lax",
      });
    }
  }

  // Bloklanmagan foydalanuvchi (yoki mehmon) /banned da bo'lsa — normal joyga qaytaramiz
  if (path === "/banned" && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

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
