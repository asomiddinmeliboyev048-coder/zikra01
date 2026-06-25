"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
}

const ALLOWED_CERT_TYPES = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
const MAX_CERT_SIZE = 10 * 1024 * 1024; // 10MB

function fileExtFromName(name: string): string {
  const m = name.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "bin";
}

/** Ro'yxatdan o'tish (email + parol) + ixtiyoriy sertifikat */
export async function signUpAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const certificate = formData.get("certificate");

  if (!fullName || !email || !password) {
    return { error: "Barcha maydonlarni to'ldiring." };
  }
  if (password.length < 6) {
    return { error: "Parol kamida 6 ta belgidan iborat bo'lishi kerak." };
  }

  // Sertifikat (agar yuklangan bo'lsa) validatsiyasi
  const hasCert =
    certificate instanceof File && certificate.size > 0 && certificate.name !== "";
  if (hasCert) {
    const cert = certificate as File;
    if (!ALLOWED_CERT_TYPES.includes(cert.type)) {
      return { error: "Sertifikat faqat JPG, PNG yoki PDF formatida bo'lishi mumkin." };
    }
    if (cert.size > MAX_CERT_SIZE) {
      return { error: "Sertifikat hajmi 10MB dan oshmasligi kerak." };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Ro'yxatdan o'tgandan so'ng session mavjud bo'lsa, sertifikatni yuklaymiz.
  if (hasCert) {
    const cert = certificate as File;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const path = `${user.id}/certificate-${Date.now()}.${fileExtFromName(cert.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("certificates")
        .upload(path, cert, {
          contentType: cert.type || undefined,
          upsert: true,
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("certificates")
          .getPublicUrl(path);

        // certificate_url'ni saqlaymiz, holatni 'pending' qilamiz.
        // Tasdiq (is_verified) faqat admin tomonidan beriladi.
        await supabase
          .from("profiles")
          .update({
            certificate_url: urlData.publicUrl,
            is_verified: false,
            verification_status: "pending",
          })
          .eq("id", user.id);
      }
      // Yuklashda xatolik bo'lsa ham ro'yxatdan o'tishni to'xtatmaymiz —
      // foydalanuvchi keyinroq profildan sertifikat qo'sha oladi.
    }
  }

  revalidatePath("/", "layout");
  // Yangi foydalanuvchi — avval PIN o'rnatish (Welcome), so'ng onboarding
  redirect("/welcome");
}

/** Tizimga kirish (email + parol) */
export async function signInAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const redirectTo = String(formData.get("redirect") || "/discovery");

  if (!email || !password) {
    return { error: "Email va parolni kiriting." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email yoki parol noto'g'ri." };
  }

  // Onboarding va PIN holatiga qarab yo'naltirish + last_login yangilash
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded, pin_code, last_login")
      .eq("id", user.id)
      .single();

    const p = profile as
      | { onboarded: boolean; pin_code: string | null; last_login: string | null }
      | null;

    // Yo'nalishni last_login yangilanishidan oldin hal qilamiz
    let dest = redirectTo;
    if (!p || (!p.pin_code && !p.last_login)) dest = "/welcome"; // birinchi kirish, PIN yo'q
    else if (!p.onboarded) dest = "/onboarding";

    await supabase
      .from("profiles")
      .update({ last_login: new Date().toISOString() })
      .eq("id", user.id);

    revalidatePath("/", "layout");
    redirect(dest);
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

/** Tizimdan chiqish */
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
