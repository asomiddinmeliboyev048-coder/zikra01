"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
    setBusy(true);
    // optimistik
    const prev = following;
    setFollowing(!prev);
    setFollowers((c) => (prev ? Math.max(0, c - 1) : c + 1));
    const res = await toggleFollowAction(profileId);
    setBusy(false);
    if (res.error) {
      // qaytarish
      setFollowing(prev);
      setFollowers((c) => (prev ? c + 1 : Math.max(0, c - 1)));
      alert(res.error);
    } else {
      router.refresh();
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
