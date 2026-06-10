import { getCurrentProfile, getUnreadCount } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import Logo from "./Logo";
import NavbarClient from "./NavbarClient";

/**
 * Authenticated sahifalar uchun yuqori navigatsiya paneli.
 * Server komponent — joriy profil va o'qilmagan bildirishnomalar sonini oladi.
 */
export default async function Navbar() {
  const profile = await getCurrentProfile();

  // Kunlik faollik (streak) ni yangilash — kuniga bir marta hisoblanadi
  if (profile) {
    const supabase = await createClient();
    await supabase.rpc("touch_streak", { uid: profile.id });
  }

  const unread = profile ? await getUnreadCount(profile.id) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/85 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between gap-4">
        <Logo />
        <NavbarClient
          profile={
            profile
              ? {
                  id: profile.id,
                  full_name: profile.full_name,
                  avatar_url: profile.avatar_url,
                  level: profile.level,
                  xp: profile.xp,
                }
              : null
          }
          unread={unread}
        />
      </div>
    </header>
  );
}
