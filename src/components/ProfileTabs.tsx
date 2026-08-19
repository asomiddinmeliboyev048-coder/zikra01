"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  initialTab: "followers" | "following";
  followers: User[];
  following: User[];
};

export default function FollowersFollowingModal({
  open,
  onClose,
  initialTab,
  followers,
  following,
}: Props) {
  const [tab, setTab] = useState<"followers" | "following">(initialTab);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setSearch("");
    }
  }, [open, initialTab]);

  if (!open) return null;

  const users = tab === "followers" ? followers : following;

  const filteredUsers = users.filter((user) => {
    const value = `${user.full_name ?? ""} ${user.username ?? ""}`
      .toLowerCase();

    return value.includes(search.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-[9999] bg-white">

      {/* HEADER */}
      <div className="flex h-14 items-center border-b border-gray-200 px-4">

        <button
          onClick={onClose}
          className="mr-4 text-2xl text-gray-900"
          aria-label="Orqaga"
        >
          ←
        </button>

        <h2 className="text-lg font-semibold">
          {tab === "followers" ? "Obunachilar" : "Obunalar"}
        </h2>

      </div>

      {/* TABS */}
      <div className="grid grid-cols-2 border-b border-gray-200">

        <button
          onClick={() => setTab("followers")}
          className={`py-3 text-sm font-semibold ${
            tab === "followers"
              ? "border-b-2 border-black text-black"
              : "text-gray-400"
          }`}
        >
          Obunachilar {followers.length}
        </button>

        <button
          onClick={() => setTab("following")}
          className={`py-3 text-sm font-semibold ${
            tab === "following"
              ? "border-b-2 border-black text-black"
              : "text-gray-400"
          }`}
        >
          Obunalar {following.length}
        </button>

      </div>

      {/* SEARCH */}
      <div className="px-4 py-3">

        <div className="flex items-center rounded-xl bg-gray-100 px-3">

          <span className="mr-2 text-gray-400">
            🔎
          </span>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Qidirish"
            className="w-full bg-transparent py-2.5 text-sm outline-none"
          />

        </div>

      </div>

      {/* USERS */}
      <div className="px-4">

        {filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            Foydalanuvchilar topilmadi
          </div>
        ) : (
          <div className="space-y-1">

            {filteredUsers.map((user) => (

              <div
                key={user.id}
                className="flex items-center justify-between py-3"
              >

                <div className="flex min-w-0 items-center">

                  <div className="mr-3 h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100">

                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username ?? "User"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg">
                        👤
                      </div>
                    )}

                  </div>

                  <div className="min-w-0">

                    <div className="truncate text-sm font-semibold">
                      {user.username ?? "username"}
                    </div>

                    <div className="truncate text-sm text-gray-500">
                      {user.full_name ?? ""}
                    </div>

                  </div>

                </div>

                <button
                  className="ml-3 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold"
                >
                  {tab === "following" ? "Obuna" : "Kuzatish"}
                </button>

              </div>

            ))}

          </div>
        )}

      </div>

    </div>
  );
}
