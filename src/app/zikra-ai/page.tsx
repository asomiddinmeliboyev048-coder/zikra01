import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getCurrentProfile } from "@/lib/queries";
import ZikraAIChat from "./ZikraAIChat";

export const metadata: Metadata = { title: "Zikra AI — Platforma yordamchisi" };
export const dynamic = "force-dynamic";

export default async function ZikraAIPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <>
      <Navbar />
      <main className="flex h-[calc(100dvh-4rem)] min-h-0 w-full flex-col overflow-hidden">
        <ZikraAIChat userName={profile.full_name} />
      </main>
    </>
  );
}
