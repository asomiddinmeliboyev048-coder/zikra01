"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toggleFollowAction } from "@/app/actions/social";
import { cn } from "@/lib/utils";

export default function FollowButton({
  profileId,
  initialFollowing,
  initialFollowers,
}: {
  profileId: string;
  initialFollowing: boolean;
  initialFollowers: number;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [followers, setFollowers] = useState(initialFollowers);
  const [busy, setBusy] = useState(false);

  // Real-time: obunachilar soni o'zgarsa yangilash
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`follows:${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "follows",
          filter: `following_id=eq.${profileId}`,
        },
        (payload) => {
          setFollowers((c) =>
            payload.eventType === "INSERT"
              ? c + 1
              : payload.eventType === "DELETE"
              ? Math.max(0, c - 1)
              : c
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const prev = following;
    // Faqat holatni optimistik o'zgartiramiz; obunachilar SONI realtime orqali.
    setFollowing(!prev);
    const res = await toggleFollowAction(profileId);
    setBusy(false);
    if (res.error) {
      setFollowing(prev);
      alert(res.error);
    } else if (typeof res.following === "boolean") {
      setFollowing(res.following);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={cn(
        "btn",
        following
          ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
          : "bg-success text-white hover:bg-success-600"
      )}
    >
      {following ? "Obunani bekor qilish" : "＋ Obuna bo'lish"}
      <span className="ml-1 rounded-full bg-black/10 px-1.5 text-xs">
        {followers}
      </span>
    </button>
  );
}
