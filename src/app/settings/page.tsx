import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import SecuritySettings from "./SecuritySettings";
import { getCurrentProfile } from "@/lib/queries";

export const metadata: Metadata = { title: "Sozlamalar" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-app max-w-2xl py-6">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Sozlamalar</h1>
        <p className="mb-6 text-sm text-gray-500">
          Hisobingiz xavfsizligi va kirish usullarini boshqaring.
        </p>
        <SecuritySettings userId={me.id} userName={me.full_name} />
      </main>
    </div>
  );
}
