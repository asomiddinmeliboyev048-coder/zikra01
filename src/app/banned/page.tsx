import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BannedScreen from "@/components/BannedScreen";
import { isUserBanned } from "@/lib/ban";

// Bu sahifa keshlanmasin — blok holati har doim yangi tekshirilsin
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Hisob bloklangan · Zikra",
};

/**
 * Bloklangan foydalanuvchi qora ekrani.
 * middleware bloklangan foydalanuvchini shu sahifaga yo'naltiradi.
 * Bu yerda qo'shimcha tekshiruv: bloklanmagan bo'lsa — normal joyga qaytaramiz.
 */
export default async function BannedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Tizimga kirmagan bo'lsa — login sahifasiga
  if (!user) redirect("/login");

  // "*" — middleware bilan bir xil ma'lumot (is_banned ustuni bo'lsa ham o'qiladi)
  const { data: prof } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // Middleware bilan AYNAN bir xil mantiq — aks holda redirect loop bo'ladi
  const isBanned = isUserBanned(prof);

  // Bloklanmagan (yoki muddat tugagan) bo'lsa — saytga qaytaramiz
  if (!isBanned) redirect("/discovery");

  return (
    <BannedScreen
      userId={user.id}
      bannedUntil={prof?.banned_until ?? null}
      reason={prof?.ban_reason ?? null}
    />
  );
}
