"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  PIN_ENABLED_KEY,
  PIN_HASH_KEY,
  PIN_LENGTH_KEY,
} from "@/lib/pin";

/**
 * AuthListener — Supabase auth holatini kuzatadi (onAuthStateChange) va:
 *
 *  1) AUTO-LOGIN: sahifa ochilganda faol sessiyani (getSession) tekshiradi.
 *     Agar foydalanuvchi kirgan bo'lsa va landing ("/") sahifasida tursa —
 *     to'g'ridan-to'g'ri /discovery'ga yo'naltiradi.
 *
 *  2) PIN SYNC: kirgandan so'ng serverdagi PIN (profiles.pin_code) ni lokal
 *     qulfga (PinGate localStorage) moslashtiradi. Shunda boshqa qurilmada
 *     ham bir xil PIN bilan ilova qulflanadi (cross-device).
 *
 * Root layout ichida bir marta o'rnatiladi (PinGate bilan birga ishlaydi).
 */
export default function AuthListener() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();

    // Serverdagi PIN'ni lokal qulfga moslashtirish
    async function syncServerPin(userId: string) {
      const { data } = await supabase
        .from("profiles")
        .select("pin_code")
        .eq("id", userId)
        .single();
      const pin = (data as { pin_code: string | null } | null)?.pin_code;
      if (pin && localStorage.getItem(PIN_ENABLED_KEY) !== "1") {
        // pin_code allaqachon SHA-256 hash — lokal verifyPin shu bilan mos keladi
        localStorage.setItem(PIN_HASH_KEY, pin);
        localStorage.setItem(PIN_ENABLED_KEY, "1");
        localStorage.setItem(PIN_LENGTH_KEY, "6");
      }
    }

    // 1) Boshlang'ich auto-login tekshiruvi
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncServerPin(session.user.id);
        if (pathname === "/") router.replace("/discovery");
      }
    });

    // 2) Auth holati o'zgarganini kuzatish
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
        session?.user
      ) {
        syncServerPin(session.user.id);
      }
      if (event === "SIGNED_OUT") {
        // Lokal qulfni tozalash
        localStorage.removeItem(PIN_ENABLED_KEY);
        localStorage.removeItem(PIN_HASH_KEY);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, pathname]);

  return null;
}
