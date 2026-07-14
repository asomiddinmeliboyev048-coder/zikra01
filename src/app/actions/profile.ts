"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface ProfileState {
  error?: string;
  success?: boolean;
}

const USERNAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]{2,19}$/;

/** Username formatini tekshirish (ichki yordamchi — eksport qilinmaydi) */
function validateUsername(u: string): string | null {
  if (!u) return null; // bo'sh — ixtiyoriy
  if (u.length < 3 || u.length > 20)
    return "Username 3–20 ta belgidan iborat bo'lishi kerak.";
  if (/^[0-9]/.test(u)) return "Username raqam bilan boshlanmasligi kerak.";
  if (!USERNAME_RE.test(u))
    return "Faqat lotin harflari, raqamlar va _ ishlatish mumkin.";
  return null;
}

/** Username bo'shligini real vaqtda tekshirish */
export async function checkUsernameAction(
  username: string
): Promise<{ available: boolean; error?: string }> {
  const u = username.trim();
  const fmtErr = validateUsername(u);
  if (fmtErr) return { available: false, error: fmtErr };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", u)
    .maybeSingle();

  if (data && data.id !== user?.id) {
    return { available: false, error: "Bu username band." };
  }
  return { available: true };
}

/**
 * Sertifikat URL'ini saqlash (mijoz tomonida Storage'ga yuklangandan keyin).
 * verification_status -> 'pending', is_verified -> false (admin tasdiqlashi kerak).
 */
export async function saveCertificateAction(
  certificateUrl: string
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const url = String(certificateUrl || "").trim();
  if (!url) return { error: "Sertifikat URL topilmadi." };

  const { error } = await supabase
    .from("profiles")
    .update({
      certificate_url: url,
      verification_status: "pending",
      is_verified: false,
    })
    .eq("id", user.id);

  if (error) return { error: "Saqlashda xatolik: " + error.message };

  revalidatePath(`/profile/${user.id}`);
  revalidatePath("/discovery");
  return { success: true };
}

/** Sertifikatni o'chirish */
export async function removeCertificateAction(): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const { error } = await supabase
    .from("profiles")
    .update({
      certificate_url: null,
      verification_status: "none",
      is_verified: false,
    })
    .eq("id", user.id);

  if (error) return { error: "O'chirishda xatolik: " + error.message };

  revalidatePath(`/profile/${user.id}`);
  revalidatePath("/discovery");
  return { success: true };
}

/** Server Supabase klient turi (yordamchi funksiyalar uchun) */
type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

/** Ko'nikma nomini id bo'yicha olish (topilmasa "ko'nikma") */
async function getSkillName(
  supabase: SupabaseServer,
  skillId: string
): Promise<string> {
  const { data } = await supabase
    .from("skills")
    .select("name")
    .eq("id", skillId)
    .maybeSingle();
  return (data as { name: string } | null)?.name ?? "ko'nikma";
}

/**
 * MATCHMAKING BILDIRISHNOMALARI.
 *
 * Foydalanuvchi profilida YANGI ko'nikma qo'shganda, mos hamkorlar bo'lsa,
 * o'ziga bildirishnoma yaratamiz:
 *  - Yangi O'RGANMOQCHI (learn) ko'nikma  -> uni o'rgata oladiganlar bormi?
 *    (link: /match/<id>?mode=mentors)
 *  - Yangi O'RGATA oladigan (teach) ko'nikma -> uni o'rganmoqchi bo'lganlar bormi?
 *    (link: /match/<id>?mode=students)
 *
 * MUHIM:
 *  - Faqat YANGI qo'shilgan ko'nikmalar tekshiriladi (spam bo'lmasligi uchun).
 *  - Har bir qadam try/catch bilan o'ralgan va xatolar console'ga log qilinadi.
 *    Bu funksiya HECH QACHON profil saqlashni buzmaydi (chaqiruvchi ham
 *    try/catch ichida chaqiradi).
 *  - Bildirishnoma FAQAT o'ziga (user_id = meId) yaratiladi -> RLS
 *    "notifications_insert_self" siyosati bilan ishlaydi (SQL skriptga qarang).
 */
async function notifyMatches(
  supabase: SupabaseServer,
  meId: string,
  newLearnIds: string[],
  newTeachIds: string[]
): Promise<void> {
  const notifications: {
    user_id: string;
    type: string;
    message: string;
    link: string;
  }[] = [];

  // 1) Men O'RGANMOQCHI bo'lgan yangi ko'nikmalar -> ularni O'RGATA oladiganlar
  for (const skillId of newLearnIds) {
    try {
      const { data: teachers, error } = await supabase
        .from("user_skills")
        .select("user_id")
        .eq("skill_id", skillId)
        .eq("type", "teach")
        .neq("user_id", meId);
      if (error) {
        console.error(
          `[MATCH] O'rgatuvchilarni olishda xato (skill=${skillId}):`,
          error.message
        );
        continue;
      }
      const count = new Set(
        ((teachers ?? []) as { user_id: string }[]).map((t) => t.user_id)
      ).size;
      if (count === 0) continue;
      const name = await getSkillName(supabase, skillId);
      notifications.push({
        user_id: meId,
        type: "match",
        message: `🤝 «${name}» ni o'rgata oladigan ${count} ta hamkor topildi! Ko'rib chiqing.`,
        link: `/match/${skillId}?mode=mentors`,
      });
    } catch (e) {
      console.error(`[MATCH] learn ko'nikma ${skillId} bo'yicha xato:`, e);
    }
  }

  // 2) Men O'RGATA oladigan yangi ko'nikmalar -> ularni O'RGANMOQCHI bo'lganlar
  for (const skillId of newTeachIds) {
    try {
      const { data: learners, error } = await supabase
        .from("user_skills")
        .select("user_id")
        .eq("skill_id", skillId)
        .eq("type", "learn")
        .neq("user_id", meId);
      if (error) {
        console.error(
          `[MATCH] O'rganuvchilarni olishda xato (skill=${skillId}):`,
          error.message
        );
        continue;
      }
      const count = new Set(
        ((learners ?? []) as { user_id: string }[]).map((t) => t.user_id)
      ).size;
      if (count === 0) continue;
      const name = await getSkillName(supabase, skillId);
      notifications.push({
        user_id: meId,
        type: "match",
        message: `🎓 «${name}» ni o'rganmoqchi bo'lgan ${count} ta odam bor — ularga o'rgatishingiz mumkin!`,
        link: `/match/${skillId}?mode=students`,
      });
    } catch (e) {
      console.error(`[MATCH] teach ko'nikma ${skillId} bo'yicha xato:`, e);
    }
  }

  if (notifications.length === 0) {
    console.log("[MATCH] Yangi mos hamkor topilmadi — bildirishnoma yaratilmadi.");
    return;
  }

  const { error } = await supabase.from("notifications").insert(notifications);
  if (error) {
    console.error("[MATCH] Bildirishnomalarni saqlashda xato:", error.message);
  } else {
    console.log(
      `[MATCH] ${notifications.length} ta match bildirishnoma yaratildi (user=${meId}).`
    );
  }
}

/**
 * Onboarding / profilni saqlash.
 * teach_skills va learn_skills — vergul bilan ajratilgan skill_id'lar.
 */
export async function saveProfileAction(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const fullName = String(formData.get("full_name") || "").trim();
  const username = String(formData.get("username") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const avatarUrl = String(formData.get("avatar_url") || "").trim();
  const certificateUrl = String(formData.get("certificate_url") || "").trim();
  const teachIds = String(formData.get("teach_skills") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const learnIds = String(formData.get("learn_skills") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!fullName) return { error: "Ismingizni kiriting." };

  // Username (ixtiyoriy) — format va bandlikni tekshirish
  if (username) {
    const fmtErr = validateUsername(username);
    if (fmtErr) return { error: fmtErr };
    const { data: taken } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", username)
      .maybeSingle();
    if (taken && taken.id !== user.id) return { error: "Bu username band." };
  }

  if (teachIds.length === 0)
    return { error: "Kamida bitta o'rgata oladigan ko'nikma tanlang." };
  if (learnIds.length === 0)
    return { error: "Kamida bitta o'rganmoqchi bo'lgan ko'nikma tanlang." };

  // Profilni yangilash
  const updatePayload: Record<string, unknown> = {
    full_name: fullName,
    username: username || null,
    city: city || null,
    bio: bio || null,
    avatar_url: avatarUrl || null,
    onboarded: true,
    last_active: new Date().toISOString(),
  };

  // Sertifikat (onboarding'da yuklangan bo'lsa) — tasdiqlash navbatiga qo'shamiz
  if (certificateUrl) {
    const { data: current } = await supabase
      .from("profiles")
      .select("certificate_url")
      .eq("id", user.id)
      .single();
    const cur = (current as { certificate_url: string | null } | null)?.certificate_url;
    if (cur !== certificateUrl) {
      updatePayload.certificate_url = certificateUrl;
      updatePayload.verification_status = "pending";
      updatePayload.is_verified = false;
    }
  }

  const { error: upErr } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id);

  if (upErr) return { error: "Profilni saqlashda xatolik: " + upErr.message };

  // Takrorlanuvchi id'larni olib tashlaymiz (bir xil ko'nikma ikki marta
  // tanlansa, unique (user_id, skill_id, type) cheklovi buzilishini oldini oladi).
  const uniqTeach = Array.from(new Set(teachIds));
  const uniqLearn = Array.from(new Set(learnIds));

  // MATCHMAKING uchun: o'chirishdan OLDIN eski ko'nikmalarni o'qib olamiz.
  // Shu tufayli keyin qaysi ko'nikmalar YANGI qo'shilganini aniqlaymiz
  // (faqat yangilar bo'yicha bildirishnoma yuboriladi — takror/spam bo'lmaydi).
  const { data: prevSkills } = await supabase
    .from("user_skills")
    .select("skill_id, type")
    .eq("user_id", user.id);
  const prevLearn = new Set(
    ((prevSkills ?? []) as { skill_id: string; type: string }[])
      .filter((r) => r.type === "learn")
      .map((r) => r.skill_id)
  );
  const prevTeach = new Set(
    ((prevSkills ?? []) as { skill_id: string; type: string }[])
      .filter((r) => r.type === "teach")
      .map((r) => r.skill_id)
  );

  // Eski ko'nikmalarni tozalab, qaytadan yozamiz
  const { error: delErr } = await supabase
    .from("user_skills")
    .delete()
    .eq("user_id", user.id);
  if (delErr)
    return { error: "Ko'nikmalarni yangilashda xatolik: " + delErr.message };

  const rows = [
    ...uniqTeach.map((skill_id) => ({
      user_id: user.id,
      skill_id,
      type: "teach" as const,
    })),
    ...uniqLearn.map((skill_id) => ({
      user_id: user.id,
      skill_id,
      type: "learn" as const,
    })),
  ];

  // Oddiy insert: yuqorida barcha eski ko'nikmalar o'chirildi va massivlar
  // dedup qilindi, shuning uchun konflikt bo'lmaydi.
  //
  // MUHIM: bu yerda .upsert({ onConflict: "...type" }) ISHLATILMAYDI, chunki
  // `type` ustuni enum (skill_type). PostgREST enum ustunni onConflict'da
  // ishlatganda "operator does not exist: text = skill_type" xatosini beradi.
  // Oddiy insert bu muammoni butunlay chetlab o'tadi.
  const { error: skErr } = await supabase.from("user_skills").insert(rows);
  if (skErr)
    return { error: "Ko'nikmalarni saqlashda xatolik: " + skErr.message };

  // --- MATCHMAKING BILDIRISHNOMALARI ---
  // Yangi qo'shilgan ko'nikmalar bo'yicha mos hamkorlar haqida xabar beramiz.
  // Butun blok try/catch ichida — bu HECH QACHON profil saqlashni buzmaydi.
  try {
    const newLearn = uniqLearn.filter((id) => !prevLearn.has(id));
    const newTeach = uniqTeach.filter((id) => !prevTeach.has(id));
    console.log(
      `[MATCH] Yangi ko'nikmalar -> learn: ${newLearn.length}, teach: ${newTeach.length}`
    );
    await notifyMatches(supabase, user.id, newLearn, newTeach);
  } catch (e) {
    console.error("[MATCH] Matchmaking bloki kutilmagan xato bilan tugadi:", e);
  }

  revalidatePath("/discovery");
  revalidatePath(`/profile/${user.id}`);
  revalidatePath("/notifications");
  redirect("/discovery");
}

/**
 * Yangi ko'nikma yaratish (agar ro'yxatda bo'lmasa).
 * skill id qaytaradi.
 */
export async function createSkillAction(
  name: string,
  category: string
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const clean = name.trim();
  if (!clean) return { error: "Ko'nikma nomi bo'sh." };

  // Avval bor-yo'qligini tekshiramiz
  const { data: existing } = await supabase
    .from("skills")
    .select("id")
    .ilike("name", clean)
    .maybeSingle();

  if (existing) return { id: existing.id };

  const { data, error } = await supabase
    .from("skills")
    .insert({ name: clean, category: category || "Boshqa" })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}
