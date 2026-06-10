import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import NotificationsList from "./NotificationsList";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries";
import type { AppNotification } from "@/lib/types";

export const metadata: Metadata = { title: "Bildirishnomalar" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", me.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications = (data as AppNotification[]) ?? [];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-app max-w-2xl py-8">
        <NotificationsList
          userId={me.id}
          initial={notifications}
        />
      </main>
    </div>
  );
}
