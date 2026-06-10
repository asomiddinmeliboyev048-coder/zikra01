import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import LessonCard, { type LessonView } from "./LessonCard";
import NewLessonModal, { type PartnerOption } from "./NewLessonModal";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getSkills } from "@/lib/queries";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Darslarim" };
export const dynamic = "force-dynamic";

interface LessonRow {
  id: string;
  status: "scheduled" | "completed" | "cancelled";
  scheduled_at: string | null;
  teacher_id: string;
  learner_id: string;
  skill: { name: string } | null;
}

export default async function LessonsPage() {
  const me = await getCurrentProfile();
  if (!me) redirect("/login");

  const supabase = await createClient();

  // Mening darslarim
  const { data: lessonsData } = await supabase
    .from("lessons")
    .select("id, status, scheduled_at, teacher_id, learner_id, skill:skills(name)")
    .or(`teacher_id.eq.${me.id},learner_id.eq.${me.id}`)
    .order("created_at", { ascending: false });

  const rows = (lessonsData as unknown as LessonRow[]) ?? [];

  // Hamkor profillari
  const partnerIds = Array.from(
    new Set(
      rows.map((r) => (r.teacher_id === me.id ? r.learner_id : r.teacher_id))
    )
  );

  const profById = new Map<string, Profile>();
  if (partnerIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", partnerIds);
    for (const p of (profs as Profile[]) ?? []) profById.set(p.id, p);
  }

  // Men allaqachon baholagan darslar
  const { data: myRatings } = await supabase
    .from("ratings")
    .select("lesson_id")
    .eq("rater_id", me.id);
  const ratedSet = new Set((myRatings ?? []).map((r) => r.lesson_id));

  const lessons: LessonView[] = rows.map((r) => {
    const iAmTeacher = r.teacher_id === me.id;
    const partnerId = iAmTeacher ? r.learner_id : r.teacher_id;
    const partner = profById.get(partnerId);
    return {
      id: r.id,
      status: r.status,
      skillName: r.skill?.name ?? null,
      scheduledAt: r.scheduled_at,
      iAmTeacher,
      partner: {
        id: partnerId,
        full_name: partner?.full_name ?? "Foydalanuvchi",
        avatar_url: partner?.avatar_url ?? null,
      },
      alreadyRated: ratedSet.has(r.id),
    };
  });

  // Yangi dars uchun hamkorlar — suhbatdosh bo'lganlar
  const { data: msgs } = await supabase
    .from("messages")
    .select("sender_id, receiver_id")
    .or(`sender_id.eq.${me.id},receiver_id.eq.${me.id}`);

  const convPartnerIds = new Set<string>();
  for (const m of msgs ?? []) {
    const other = m.sender_id === me.id ? m.receiver_id : m.sender_id;
    if (other) convPartnerIds.add(other);
  }

  let partners: PartnerOption[] = [];
  if (convPartnerIds.size > 0) {
    const { data: cp } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(convPartnerIds));
    partners = (cp as PartnerOption[]) ?? [];
  }

  const skills = await getSkills();

  const active = lessons.filter((l) => l.status === "scheduled");
  const done = lessons.filter((l) => l.status !== "scheduled");

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-app py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Darslarim</h1>
            <p className="mt-1 text-sm text-gray-500">
              Darslarni boshqaring va yakunlangach baho bering.
            </p>
          </div>
          <NewLessonModal partners={partners} skills={skills} />
        </div>

        {lessons.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-16 text-center">
            <span className="text-4xl">📚</span>
            <p className="font-medium text-gray-700">Hali darslar yo&apos;q</p>
            <p className="text-sm text-gray-500">
              &quot;Yangi dars&quot; tugmasi orqali birinchi darsingizni
              rejalashtiring.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {active.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Faol darslar
                </h2>
                <div className="space-y-3">
                  {active.map((l) => (
                    <LessonCard key={l.id} lesson={l} />
                  ))}
                </div>
              </section>
            )}
            {done.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Tarix
                </h2>
                <div className="space-y-3">
                  {done.map((l) => (
                    <LessonCard key={l.id} lesson={l} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
