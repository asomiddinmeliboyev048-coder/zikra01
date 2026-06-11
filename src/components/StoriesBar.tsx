import { getCurrentProfile, getStoriesFeed } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import StoriesRow from "./StoriesRow";
import type { Profile } from "@/lib/types";

/**
 * Stories qatori — discovery sahifasi tepasida.
 * Server komponent: feed va suhbatdoshlar ro'yxatini oladi.
 */
export default async function StoriesBar() {
  const me = await getCurrentProfile();
  if (!me) return null;

  const [{ groups }, supabase] = await Promise.all([
    getStoriesFeed(me.id),
    createClient(),
  ]);

  // Forward uchun suhbatdoshlar
  const { data: msgs } = await supabase
    .from("messages")
    .select("sender_id, receiver_id")
    .or(`sender_id.eq.${me.id},receiver_id.eq.${me.id}`);
  const partnerIds = new Set<string>();
  for (const m of msgs ?? []) {
    const other = m.sender_id === me.id ? m.receiver_id : m.sender_id;
    if (other) partnerIds.add(other);
  }
  let partners: Pick<Profile, "id" | "full_name" | "avatar_url">[] = [];
  if (partnerIds.size > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", Array.from(partnerIds));
    partners =
      (data as Pick<Profile, "id" | "full_name" | "avatar_url">[]) ?? [];
  }

  return (
    <StoriesRow
      me={{ id: me.id, full_name: me.full_name, avatar_url: me.avatar_url }}
      groups={groups}
      partners={partners}
    />
  );
}
