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

  // upsert + ignoreDuplicates: agar biror qator allaqachon mavjud bo'lsa,
  // unique cheklov xatosini bermay, jimgina o'tkazib yuboradi.
  // Xatolik bo'lsa — HAQIQIY sabab (message) ko'rsatiladi (masalan noto'g'ri
  // skill_id yoki FK buzilishi), shunda muammoni aniq bilish mumkin.
  const { error: skErr } = await supabase
    .from("user_skills")
    .upsert(rows, {
      onConflict: "user_id,skill_id,type",
      ignoreDuplicates: true,
    });
  if (skErr)
    return { error: "Ko'nikmalarni saqlashda xatolik: " + skErr.message };

  revalidatePath("/discovery");
  revalidatePath(`/profile/${user.id}`);
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
