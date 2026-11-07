import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries";
import LearningExperienceLab from "./experience-lab/LearningExperienceLab";

export const metadata: Metadata = { title: "Rivojlanish | Zikra" };
export const dynamic = "force-dynamic";

export default async function LessonsPage() {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");

  // Rivojlanish — mustaqil, to‘liq ekranli o‘quv muhiti.
  // Umumiy navbar, profil va bildirishnoma bu yerda takrorlanmaydi.
  return <main className="min-h-[100dvh] w-full"><LearningExperienceLab /></main>;
}
