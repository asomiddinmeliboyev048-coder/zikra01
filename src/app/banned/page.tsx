import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BannedScreen from "@/components/BannedScreen";

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

  const { data: prof } = await supabase
    .from("profiles")
    .select("status, banned_until, ban_reason")
    .eq("id", user.id)
    .maybeSingle();

  const isBanned =
    prof?.status === "banned" &&
    (!prof.banned_until || new Date(prof.banned_until) > new Date());

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
