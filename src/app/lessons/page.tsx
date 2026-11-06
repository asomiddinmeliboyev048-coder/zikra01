import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getCurrentProfile } from "@/lib/queries";
import LearningExperienceLab from "./experience-lab/LearningExperienceLab";

export const metadata: Metadata = { title: "Rivojlanish | Zikra" };
export const dynamic = "force-dynamic";

export default async function LessonsPage() {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");

  return (
    <div className="min-h-screen bg-[#f4f8f7] dark:bg-[#071513]">
      <Navbar />
      <main className="w-full px-0 py-0 sm:px-0 sm:py-0 xl:px-0">
        <LearningExperienceLab />
      </main>
    </div>
  );
}
