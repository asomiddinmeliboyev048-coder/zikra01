"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Kunlik faollik (streak) ni yangilash.
 *
 * Ilgari bu Navbar server komponentida HAR BIR sahifa yuklanishida
 * `await` bilan chaqirilardi — bu har bir navigatsiyaga qo'shimcha DB yozuvi
 * (kechikish) qo'shar edi. Endi u klient tomonda kuniga bir marta chaqiriladi
 * (FixedWidgets), shuning uchun sahifa ochilishini sekinlashtirmaydi.
 */
export async function touchStreakAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.rpc("touch_streak", { uid: user.id });
}
