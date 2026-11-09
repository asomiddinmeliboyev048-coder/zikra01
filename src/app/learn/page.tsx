import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import LearnDashboard from "@/components/learn/LearnDashboard";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Learn — O‘rganish markazi | Zikra",
  description: "Zikra Learn — kurslar, video darslar va shaxsiy rivojlanish paneli.",
};
export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");
  const supabase = await createClient();

  const [{ data: videoRows }, { data: skillRows }, { data: lessonRows }] = await Promise.all([
    supabase.from("videos")
      .select("id, title, thumbnail_url, duration, created_at, skill:skills(name)")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("user_skills")
      .select("skill:skills(name)")
      .eq("user_id", me.id),
    supabase.from("lessons")
      .select("id, status")
      .or(`teacher_id.eq.${me.id},learner_id.eq.${me.id}`),
  ]);

  const courses = (videoRows ?? []).map((video) => ({
    id: video.id,
    title: video.title,
    thumbnail_url: video.thumbnail_url,
    duration: video.duration,
    created_at: video.created_at,
    skill_name: Array.isArray(video.skill) ? video.skill[0]?.name ?? null : (video.skill as { name?: string } | null)?.name ?? null,
  }));
  const skills = Array.from(new Set((skillRows ?? []).map((row) => {
    const skill = row.skill as unknown as { name?: string } | null;
    return skill?.name ?? "";
  }).filter(Boolean)));
  const lessons = lessonRows ?? [];

  return (
    <div className="min-h-screen">
      <Navbar />
      <LearnDashboard
        profile={{
          id: me.id,
          full_name: me.full_name,
          username: me.username,
          avatar_url: me.avatar_url,
          level: me.level,
          xp: Number(me.xp ?? 0),
          streak_days: Number(me.streak_days ?? 0),
          city: me.city,
          bio: me.bio,
        }}
        courses={courses}
        skills={skills}
        lessonStats={{
          upcoming: lessons.filter((lesson) => lesson.status === "scheduled").length,
          completed: lessons.filter((lesson) => lesson.status === "completed").length,
        }}
      />
    </div>
  );
}
