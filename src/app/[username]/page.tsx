import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * @username orqali profil ochish: /@azizkarimov -> /profile/{id}
 * Faqat "@" bilan boshlanadigan yo'llar uchun. Boshqalar 404.
 */
export default async function UsernamePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  if (!username.startsWith("@")) notFound();

  const handle = decodeURIComponent(username).slice(1);
  if (!handle) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", handle)
    .maybeSingle();

  if (!data) notFound();
  redirect(`/profile/${data.id}`);
}
