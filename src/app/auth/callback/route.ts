import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth (Google) va email tasdiqlash uchun callback.
 * Supabase code'ni session'ga almashtiradi, so'ng onboarding holatiga qarab yo'naltiradi.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/discovery";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarded, pin_code")
          .eq("id", user.id)
          .single();

        // Oxirgi kirish vaqtini yangilaymiz
        await supabase
          .from("profiles")
          .update({ last_login: new Date().toISOString() })
          .eq("id", user.id);

        const p = profile as
          | { onboarded: boolean; pin_code: string | null }
          | null;

        // 1) PIN o'rnatilmagan (yangi foydalanuvchi) → Welcome sahifasi
        // 2) Onboarding tugamagan → onboarding
        // 3) Aks holda → asl manzil
        let dest = next;
        if (!p || !p.pin_code) dest = "/welcome";
        else if (!p.onboarded) dest = "/onboarding";

        return NextResponse.redirect(`${origin}${dest}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
