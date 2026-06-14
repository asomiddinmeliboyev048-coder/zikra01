"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
}

/** Ro'yxatdan o'tish (email + parol) */
export async function signUpAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!fullName || !email || !password) {
    return { error: "Barcha maydonlarni to'ldiring." };
  }
  if (password.length < 6) {
    return { error: "Parol kamida 6 ta belgidan iborat bo'lishi kerak." };
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
      .select("onboarded, pin_code")
      .eq("id", user.id)
      .single();

    await supabase
      .from("profiles")
      .update({ last_login: new Date().toISOString() })
      .eq("id", user.id);

    const p = profile as { onboarded: boolean; pin_code: string | null } | null;
    revalidatePath("/", "layout");
    if (!p || !p.pin_code) redirect("/welcome"); // PIN o'rnatilmagan → Welcome
    if (!p.onboarded) redirect("/onboarding");
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
