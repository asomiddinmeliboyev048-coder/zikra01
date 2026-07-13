import { getCurrentProfile, getUnreadCount } from "@/lib/queries";
import Logo from "./Logo";
import NavbarClient from "./NavbarClient";
import FixedWidgets from "./FixedWidgets";

/**
 * Authenticated sahifalar uchun yuqori navigatsiya paneli.
 * Server komponent — joriy profil va o'qilmagan bildirishnomalar sonini oladi.
 *
 * Eslatma: `touch_streak` (kunlik faollik) endi shu yerda emas — u klient
 * tomonda (FixedWidgets) kuniga bir marta chaqiriladi. Shu sabab har bir
 * sahifa ochilishida qo'shimcha DB yozuvi (kechikish) bo'lmaydi.
 */
export default async function Navbar() {
  const profile = await getCurrentProfile();

  const unread = profile ? await getUnreadCount(profile.id) : 0;

  return (
    <>
      <header className="zikra-navbar sticky top-0 z-40 border-b border-gray-100 bg-white/85 backdrop-blur">
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

      {/* Fixed widgetlar header'dan TASHQARIDA (backdrop-blur containing-block muammosi) */}
      {profile && <FixedWidgets userId={profile.id} unread={unread} />}
    </>
  );
}
