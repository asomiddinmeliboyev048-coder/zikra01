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
      <main className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-7xl flex-col px-3 py-4 sm:px-6 lg:px-8">
        <ZikraAIChat userName={profile.full_name} />
      </main>
    </>
  );
}
