import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import Navbar from "@/components/Navbar";

import { createClient } from "@/lib/supabase/server";
import { getProfileWithSkills } from "@/lib/queries";
import { avatarFallback } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Obunalar",
};

type ConnectionsPageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    tab?: string;
  }>;
};

type ConnectionProfile = {
  id: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  is_verified?: boolean | null;
};

type FollowerRow = {
  follower: ConnectionProfile | null;
};

type FollowingRow = {
  following: ConnectionProfile | null;
};

export default async function ConnectionsPage({
  params,
  searchParams,
}: ConnectionsPageProps) {
  const { id: profileId } = await params;
  const { tab } = await searchParams;

  /* ============================================================
     TAB
  ============================================================ */

  const activeTab =
    tab === "following"
      ? "following"
      : "followers";

  /* ============================================================
     PROFILE
  ============================================================ */

  const profile =
    await getProfileWithSkills(profileId);

  if (!profile) {
    notFound();
  }

  const supabase =
    await createClient();

  /* ============================================================
     FOLLOWERS
     
     following_id = profileId
     
     Natija:
     profileId ga obuna bo'lgan userlar
     ============================================================ */

  const followersResult =
    await supabase
      .from("follows")
      .select(
        `
          follower:profiles!follows_follower_id_fkey(
            id,
            full_name,
            username,
            avatar_url,
            is_verified
          )
        `
      )
      .eq(
        "following_id",
        profileId
      );

  /* ============================================================
     FOLLOWING
     
     follower_id = profileId
     
     Natija:
     profileId obuna bo'lgan userlar
     ============================================================ */

  const followingResult =
    await supabase
      .from("follows")
      .select(
        `
          following:profiles!follows_following_id_fkey(
            id,
            full_name,
            username,
            avatar_url,
            is_verified
          )
        `
      )
      .eq(
        "follower_id",
        profileId
      );

  /* ============================================================
     ERROR CHECK
  ============================================================ */

  if (followersResult.error) {
    console.error(
      "Followers query error:",
      followersResult.error
    );
  }

  if (followingResult.error) {
    console.error(
      "Following query error:",
      followingResult.error
    );
  }

  /* ============================================================
     DATA
  ============================================================ */

  const followers =
    (
      (followersResult.data ??
        []) as unknown as FollowerRow[]
    )
      .map(
        (row) => row.follower
      )
      .filter(
        (
          user
        ): user is ConnectionProfile =>
          Boolean(user)
      );

  const following =
    (
      (followingResult.data ??
        []) as unknown as FollowingRow[]
    )
      .map(
        (row) => row.following
      )
      .filter(
        (
          user
        ): user is ConnectionProfile =>
          Boolean(user)
      );

  const users =
    activeTab === "followers"
      ? followers
      : following;

  /* ============================================================
     PAGE
  ============================================================ */

  return (
    <div className="min-h-screen bg-gray-50">

      <Navbar />

      <main className="container-app py-4 sm:py-8">

        <section className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

          {/* ======================================================
             HEADER
          ====================================================== */}

          <div className="border-b border-gray-100 px-4 py-4 sm:px-6 sm:py-5">

            <div className="flex items-center gap-3">

              {/* BACK */}

              <Link
                href={`/profile/${profile.id}`}
                aria-label="Profilga qaytish"
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-gray-200
                  bg-white
                  text-lg
                  text-gray-700
                  transition
                  hover:bg-gray-50
                "
              >
                ←
              </Link>

              {/* PROFILE INFO */}

              <div className="min-w-0 flex-1">

                <h1 className="truncate text-lg font-bold text-gray-950">
                  {profile.full_name}
                </h1>

                {profile.username && (
                  <p className="mt-0.5 truncate text-xs text-gray-400">
                    @{profile.username}
                  </p>
                )}

              </div>

            </div>

          </div>

          {/* ======================================================
             TABS
          ====================================================== */}

          <div className="grid grid-cols-2 border-b border-gray-100">

            {/* FOLLOWERS TAB */}

            <Link
              href={`/profile/${profile.id}/connections?tab=followers`}
              className={`
                relative
                flex
                min-h-[52px]
                items-center
                justify-center
                px-3
                py-3
                text-sm
                font-semibold
                transition
                ${
                  activeTab === "followers"
                    ? "text-brand"
                    : "text-gray-500 hover:text-gray-900"
                }
              `}
            >

              <span className="flex items-center gap-1.5">

                <span>
                  👥
                </span>

                <span>
                  Obunachilar
                </span>

                <span className="text-xs text-gray-400">
                  {followers.length}
                </span>

              </span>

              {activeTab === "followers" && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-brand" />
              )}

            </Link>

            {/* FOLLOWING TAB */}

            <Link
              href={`/profile/${profile.id}/connections?tab=following`}
              className={`
                relative
                flex
                min-h-[52px]
                items-center
                justify-center
                px-3
                py-3
                text-sm
                font-semibold
                transition
                ${
                  activeTab === "following"
                    ? "text-brand"
                    : "text-gray-500 hover:text-gray-900"
                }
              `}
            >

              <span className="flex items-center gap-1.5">

                <span>
                  ➕
                </span>

                <span>
                  Obunalar
                </span>

                <span className="text-xs text-gray-400">
                  {following.length}
                </span>

              </span>

              {activeTab === "following" && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-brand" />
              )}

            </Link>

          </div>

          {/* ======================================================
             USER LIST
          ====================================================== */}

          <div className="p-3 sm:p-5">

            {users.length > 0 ? (

              <div className="space-y-1">

                {users.map((user) => (

                  <div
                    key={user.id}
                    className="
                      flex
                      min-w-0
                      items-center
                      gap-3
                      rounded-2xl
                      px-2
                      py-3
                      transition
                      hover:bg-gray-50
                    "
                  >

                    {/* AVATAR */}

                    <Link
                      href={`/profile/${user.id}`}
                      className="shrink-0"
                      aria-label={`${user.full_name} profilini ochish`}
                    >

                      <Image
                        src={
                          user.avatar_url ||
                          avatarFallback(
                            user.full_name
                          )
                        }
                        alt={
                          user.full_name
                        }
                        width={56}
                        height={56}
                        className="
                          h-12
                          w-12
                          rounded-full
                          object-cover
                          ring-1
                          ring-gray-100
                        "
                        unoptimized
                      />

                    </Link>

                    {/* USER INFO */}

                    <Link
                      href={`/profile/${user.id}`}
                      className="min-w-0 flex-1"
                    >

                      <div className="flex min-w-0 items-center gap-1">

                        <p className="truncate text-sm font-bold text-gray-900">
                          {user.full_name}
                        </p>

                        {user.is_verified && (
                          <span
                            className="
                              shrink-0
                              text-xs
                              font-bold
                              text-brand
                            "
                            title="Tasdiqlangan profil"
                          >
                            ✓
                          </span>
                        )}

                      </div>

                      {user.username && (
                        <p className="mt-0.5 truncate text-xs text-gray-400">
                          @{user.username}
                        </p>
                      )}

                    </Link>

                    {/* PROFILE BUTTON */}

                    <Link
                      href={`/profile/${user.id}`}
                      className="
                        flex
                        h-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-gray-200
                        bg-white
                        px-3
                        text-xs
                        font-semibold
                        text-gray-700
                        transition
                        hover:bg-gray-50
                        hover:text-brand
                        sm:px-4
                      "
                    >
                      Profil
                    </Link>

                  </div>

                ))}

              </div>

            ) : (

              /* ==================================================
                 EMPTY
              ================================================== */

              <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">

                <div className="mb-4 text-5xl">
                  {activeTab === "followers"
                    ? "👥"
                    : "➕"}
                </div>

                <h2 className="text-base font-bold text-gray-900">

                  {activeTab === "followers"
                    ? "Obunachilar yo'q"
                    : "Obunalar yo'q"}

                </h2>

                <p className="mt-2 max-w-sm text-sm leading-6 text-gray-400">

                  {activeTab === "followers"
                    ? "Bu foydalanuvchiga hali hech kim obuna bo'lmagan."
                    : "Bu foydalanuvchi hali hech kimga obuna bo'lmagan."}

                </p>

                <Link
                  href={`/profile/${profile.id}`}
                  className="
                    mt-5
                    flex
                    h-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-brand
                    px-5
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-brand-700
                  "
                >
                  Profilga qaytish
                </Link>

              </div>

            )}

          </div>

        </section>

      </main>

    </div>
  );
}
