"use server";

import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

export interface PinState {
  error?: string;
  success?: boolean;
}

/**
 * PIN'ni SHA-256 bilan hash qiladi.
 * Bu client tomonidagi `@/lib/pin` sha256() bilan AYNAN bir xil natija beradi,
 * shuning uchun server PIN'ini lokal qulf (PinGate) ham tekshira oladi.
 */
function hashPin(pin: string): string {
  return createHash("sha256").update(pin).digest("hex");
}

/**
 * Hisob uchun 6 xonali PIN o'rnatish (Welcome sahifasida).
 * PIN profiles.pin_code ustuniga HASH ko'rinishida saqlanadi + last_login yangilanadi.
 */
export async function setupAccountPinAction(pin: string): Promise<PinState> {
  if (!/^\d{6}$/.test(pin)) {
    return { error: "PIN aniq 6 ta raqamdan iborat bo'lishi kerak." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avtorizatsiya talab qilinadi." };

  const { error } = await supabase
    .from("profiles")
    .update({
      pin_code: hashPin(pin),
      last_login: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: "PIN saqlanmadi: " + error.message };
  return { success: true };
}

/** Oxirgi kirish vaqtini yangilash (login oqimida chaqiriladi) */
export async function updateLastLoginAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("profiles")
    .update({ last_login: new Date().toISOString() })
    .eq("id", user.id);
}
