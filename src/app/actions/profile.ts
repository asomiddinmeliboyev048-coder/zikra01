"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface ProfileState {
  error?: string;
  success?: boolean;
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
  const city = String(formData.get("city") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const avatarUrl = String(formData.get("avatar_url") || "").trim();
  const teachIds = String(formData.get("teach_skills") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const learnIds = String(formData.get("learn_skills") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!fullName) return { error: "Ismingizni kiriting." };
  if (teachIds.length === 0)
    return { error: "Kamida bitta o'rgata oladigan ko'nikma tanlang." };
  if (learnIds.length === 0)
    return { error: "Kamida bitta o'rganmoqchi bo'lgan ko'nikma tanlang." };

  // Profilni yangilash
  const { error: upErr } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      city: city || null,
      bio: bio || null,
      avatar_url: avatarUrl || null,
      onboarded: true,
      last_active: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (upErr) return { error: "Profilni saqlashda xatolik: " + upErr.message };

  // Eski ko'nikmalarni tozalab, qaytadan yozamiz
  await supabase.from("user_skills").delete().eq("user_id", user.id);

  const rows = [
    ...teachIds.map((skill_id) => ({
      user_id: user.id,
      skill_id,
      type: "teach" as const,
    })),
    ...learnIds.map((skill_id) => ({
      user_id: user.id,
      skill_id,
      type: "learn" as const,
    })),
  ];

  const { error: skErr } = await supabase.from("user_skills").insert(rows);
  if (skErr) return { error: "Ko'nikmalarni saqlashda xatolik." };

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
