"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Zikra — yuqoridagi ingichka yuklanish chizig'i (Instagram/YouTube uslubi).
 *
 * Foydalanuvchi havolani bosgan zahoti chiziq yuqorida paydo bo'lib, asta-sekin
 * 90% gacha "sudralib" boradi (foydalanuvchiga "harakat bor" degan tuyg'u —
 * kutish sezilmaydi). Sahifa (pathname) o'zgarishi bilan 100% ga to'lib yo'qoladi.
 *
 * Next.js App Router'da router event'lari yo'q, shuning uchun:
 *  - Boshlanish: hujjatdagi <a> bosishini "capture" fazasida tutamiz.
 *  - Tugash: `usePathname()` o'zgarganda.
 *  - Xavfsizlik: 10s dan keyin majburan tugatamiz (osilib qolmasin).
 *
 * `useSearchParams` ATAYIN ishlatilmadi — u statik sahifalarda <Suspense>
 * talab qiladi. Faqat `usePathname` bilan ishlaymiz.
 */
export default function NavProgress() {
  const pathname = usePathname();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const firstRender = useRef(true);

  function clearAll() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (trickle.current) {
      clearInterval(trickle.current);
      trickle.current = null;
    }
  }

  function start() {
    clearAll();
    setVisible(true);
    setWidth(8);
    // Asta-sekin 90% gacha ko'tarilib boradi (haqiqiy tugash noma'lum).
    trickle.current = setInterval(() => {
      setWidth((w) => (w < 90 ? w + Math.max(0.4, (90 - w) * 0.06) : w));
    }, 180);
    // Osilib qolmasligi uchun xavfsizlik chegarasi.
    timers.current.push(setTimeout(finish, 10000));
  }

  function finish() {
    clearAll();
    setWidth(100);
    timers.current.push(
      setTimeout(() => {
        setVisible(false);
        timers.current.push(setTimeout(() => setWidth(0), 260));
      }, 180)
    );
  }

  // Havola bosilishini tutish (navigatsiya boshlanishi).
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      const target = e.target as HTMLElement | null;
      const a = target?.closest?.("a");
      if (!a) return;

      const href = a.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (a.getAttribute("target") === "_blank") return;
      if (a.hasAttribute("download")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      // Tashqi domen — brauzer o'zi boshqaradi.
      if (url.origin !== window.location.origin) return;
      // Aynan shu sahifa (faqat hash farqi) — navigatsiya bo'lmaydi.
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }
      start();
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", start);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sahifa (pathname) o'zgarganda tugatamiz.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Komponent yo'q qilinganda tozalash.
  useEffect(() => () => clearAll(), []);

  if (!visible && width === 0) return null;

  return (
    <div
      className="zikra-navprogress"
      style={{ width: `${width}%`, opacity: visible ? 1 : 0 }}
      aria-hidden
    />
  );
}
