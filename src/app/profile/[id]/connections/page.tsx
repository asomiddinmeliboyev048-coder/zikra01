import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { getProfileWithSkills } from "@/lib/queries";
import { avatarFallback, cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Obunalar" };
export const dynamic = "force-dynamic";

export default async function ConnectionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const active = tab === "following" ? "following" : "followers";

  const profile = await getProfileWithSkills(id);
  if (!profile) notFound();

  const supabase = await createClient();

  // followers: kimlar shu profilga obuna => follower_id larni olamiz
  // following: shu profil kimlarga obuna => following_id larni olamiz
  const col = active === "followers" ? "following_id" : "follower_id";
  const otherCol = active === "followers" ? "follower_id" : "following_id";

  const { data: rows } = await supabase
    .from("follows")
    .select(otherCol)
    .eq(col, id);

  const ids = ((rows as Record<string, string>[]) ?? []).map(
    (r) => r[otherCol]
  );

  let people: Pick<Profile, "id" | "full_name" | "avatar_url" | "city">[] = [];
  if (ids.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, city")
      .in("id", ids);
    people =
      (data as Pick<Profile, "id" | "full_name" | "avatar_url" | "city">[]) ??
      [];
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-app max-w-2xl py-8">
        <Link
          href={`/profile/${id}`}
          className="text-sm text-gray-500 hover:text-brand"
        >
          ← {profile.full_name}
        </Link>

        <div className="mt-4 flex gap-2 border-b border-gray-100">
          <TabLink id={id} tab="followers" active={active} label="Obunachilar" />
          <TabLink id={id} tab="following" active={active} label="Obunalar" />
        </div>

        {people.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            {active === "followers"
              ? "Hali obunachilar yo'q."
              : "Hali hech kimga obuna bo'lmagan."}
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {people.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/profile/${p.id}`}
                  className="card flex items-center gap-3 p-3 transition hover:shadow-card-hover"
                >
                  <Image
                    src={p.avatar_url || avatarFallback(p.full_name)}
                    alt={p.full_name}
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-xl object-cover"
                    unoptimized
                  />
                  <div>
                    <p className="font-medium text-gray-900">{p.full_name}</p>
                    <p className="text-xs text-gray-500">{p.city || "—"}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function TabLink({
  id,
  tab,
  active,
  label,
}: {
  id: string;
  tab: string;
  active: string;
  label: string;
}) {
  return (
    <Link
      href={`/profile/${id}/connections?tab=${tab}`}
      className={cn(
        "border-b-2 px-4 py-2.5 text-sm font-medium transition",
        active === tab
          ? "border-brand text-brand"
          : "border-transparent text-gray-500 hover:text-gray-700"
      )}
    >
      {label}
    </Link>
  );
}
