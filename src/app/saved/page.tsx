import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import SavedClient, { type SavedItem } from "./SavedClient";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries";

export const metadata: Metadata = { title: "Saqlangan xabarlar" };
export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_messages")
    .select("id, content, message_type, created_at")
    .eq("user_id", me.id)
    .order("created_at", { ascending: true });

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-app max-w-2xl py-6">
        <SavedClient initial={(data as SavedItem[]) ?? []} />
      </main>
    </div>
  );
}
