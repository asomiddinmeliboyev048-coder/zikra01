import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BannedScreen from "@/components/BannedScreen";

// Blok holati har doim yangi tekshirilsin (kesh yo'q)
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Hisob bloklangan · Zikra",
};

/**
 * Bloklangan foydalanuvchi qora ekrani.
 *
 * MUHIM (loop fix): bu sahifa "bloklanganmi?" degan qarorni QABUL QILMAYDI va
 * (login bundan mustasno) HECH QAYERGA redirect qilmaydi. Ban qarori FAQAT
 * middleware'da (yagona hokimiyat) — shuning uchun middleware bilan zid
 * kelib, cheksiz loop (redirect siklidan) yuzaga kelmaydi.
 *
 * - Bloklangan foydalanuvchini middleware shu sahifaga yuboradi (qora ekran).
 * - Bloklanmagan foydalanuvchini middleware bu sahifadan "/" ga otib yuboradi,
 *   demak u bu yergacha yetib kelmaydi.
 */
export default async function BannedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Tizimga kirmagan bo'lsa — login sahifasiga (bu redirect loop bermaydi)
  if (!user) redirect("/login");

  // Faqat KO'RSATISH uchun: blok sababi va muddati
  const { data: prof } = await supabase
    .from("profiles")
    .select("banned_until, ban_reason")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <BannedScreen
      userId={user.id}
      bannedUntil={prof?.banned_until ?? null}
      reason={prof?.ban_reason ?? null}
    />
  );
}
