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
    <div className="min-h-screen bg-[#f7f9fc] dark:bg-[#0b1220]">
      <Navbar />
      <main className="container-app py-5 sm:py-8">
        <LearningExperienceLab />
      </main>
    </div>
  );
}
