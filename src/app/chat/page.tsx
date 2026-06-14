import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import ChatClient, { type Conversation } from "./ChatClient";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getUserSkills } from "@/lib/queries";
import { conversationId } from "@/lib/utils";
import { computeMatchScore } from "@/lib/matching";
import type { Message, Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Suhbatlar" };
export const dynamic = "force-dynamic";

/** Suhbatlar ro'yxatidagi qisqa ko'rinish uchun media xabarlarni belgilash */
function previewText(content: string): string {
  const c = content.trim();
  if (c.startsWith("voice:")) return "🎤 Ovozli xabar";
  if (/^https?:\/\/\S+$/.test(c)) {
    if (/\.(jpe?g|png|gif|webp)(\?.*)?$/i.test(c)) return "🖼 Rasm";
    if (/\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(c)) return "🎬 Video";
    return "🔗 Havola";
  }
  return content;
}

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");

  const { with: withId } = await searchParams;
  const supabase = await createClient();

  // Mening barcha xabarlarim
  const { data: msgs } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${me.id},receiver_id.eq.${me.id}`)
    .order("created_at", { ascending: false });

  const messages = (msgs as Message[]) ?? [];

  // Suhbatlarni hamkor bo'yicha guruhlash (eng so'nggi xabar)
  const partnerLast = new Map<string, Message>();
  for (const m of messages) {
    const partner = m.sender_id === me.id ? m.receiver_id : m.sender_id;
    if (!partner) continue;
    if (!partnerLast.has(partner)) partnerLast.set(partner, m);
  }

  // `with` orqali kelgan yangi hamkorni qo'shamiz
  const partnerIds = new Set(partnerLast.keys());
  if (withId && withId !== me.id) partnerIds.add(withId);

  // Hamkor profillari
  const profilesById = new Map<string, Profile>();
  if (partnerIds.size > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("*")
      .in("id", Array.from(partnerIds));
    for (const p of (profs as Profile[]) ?? []) profilesById.set(p.id, p);
  }

  // Suhbatlar ro'yxati
  const conversations: Conversation[] = Array.from(partnerIds)
    .map((pid) => {
      const partner = profilesById.get(pid);
      if (!partner) return null;
      const last = partnerLast.get(pid);
      return {
        partner: {
          id: partner.id,
          full_name: partner.full_name,
          avatar_url: partner.avatar_url,
          username: partner.username,
        },
        conversation_id: conversationId(me.id, pid),
        last_message: last ? previewText(last.content) : null,
        last_at: last?.created_at ?? null,
      };
    })
    .filter(Boolean) as Conversation[];

  // Tartiblash: eng so'nggi xabar yuqorida
  conversations.sort((a, b) => {
    if (!a.last_at) return -1;
    if (!b.last_at) return 1;
    return new Date(b.last_at).getTime() - new Date(a.last_at).getTime();
  });

  // Aktiv hamkor — faqat `with` orqali kelganda tanlanadi.
  // Aks holda null (mobil va desktopda avval suhbatlar ro'yxati ko'rinadi).
  const activeId =
    withId && partnerIds.has(withId) ? withId : null;

  // Aktiv suhbat xabarlari + moslik
  let activeMessages: Message[] = [];
  let matchScore = 0;
  if (activeId) {
    const convId = conversationId(me.id, activeId);
    const { data: cm } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    activeMessages = (cm as Message[]) ?? [];

    const [mine, theirs] = await Promise.all([
      getUserSkills(me.id),
      getUserSkills(activeId),
    ]);
    matchScore = computeMatchScore(
      { teach: mine.teach, learn: mine.learn },
      { teach: theirs.teach, learn: theirs.learn }
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <main className="flex min-h-0 flex-1 px-0 py-0 sm:container-app sm:py-6">
        <ChatClient
          meId={me.id}
          conversations={conversations}
          activeId={activeId}
          initialMessages={activeMessages}
          matchScore={matchScore}
        />
      </main>
    </div>
  );
}
