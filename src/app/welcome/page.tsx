import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WelcomeClient from "./WelcomeClient";

export const metadata: Metadata = { title: "Xush kelibsiz" };
export const dynamic = "force-dynamic";

/**
 * Welcome — Google (yoki email) orqali yangi ro'yxatdan o'tgan foydalanuvchi
 * uchun 6 xonali hisob PIN-kodini o'rnatish sahifasi.
 * PIN allaqachon o'rnatilgan bo'lsa — bu sahifa o'tkazib yuboriladi.
 */
export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("pin_code, onboarded, full_name")
    .eq("id", user.id)
    .single();

  const p = profile as
    | { pin_code: string | null; onboarded: boolean; full_name: string }
    | null;

  // PIN allaqachon bor — keyingi bosqichga
  if (p?.pin_code) {
    redirect(p.onboarded ? "/discovery" : "/onboarding");
  }

  return <WelcomeClient onboarded={!!p?.onboarded} name={p?.full_name ?? ""} />;
}
