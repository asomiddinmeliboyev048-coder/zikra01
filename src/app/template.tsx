"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const SWIPE_ROUTES = ["/discovery", "/videos", "/reels", "/chat", "/lessons"];

function routeIndex(pathname: string) {
  return SWIPE_ROUTES.findIndex((route) => pathname === route || pathname.startsWith(route + "/"));
}

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const touchStart = useRef<{ x: number; y: number; ignored: boolean } | null>(null);
  const [direction, setDirection] = useState<"left" | "right">("left");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("zikra-route-direction");
      if (stored === "left" || stored === "right") setDirection(stored);
      sessionStorage.removeItem("zikra-route-direction");
    } catch {}
  }, [pathname]);

  function onTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const ignored = Boolean(target.closest(
      'input,textarea,select,button,a,[role="button"],[contenteditable="true"],[data-swipe-ignore],[data-horizontal-scroll],.hide-scrollbar'
    ));
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY, ignored };
  }

  function onTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || start.ignored || window.innerWidth >= 768) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 76 || Math.abs(dx) < Math.abs(dy) * 1.35) return;
    const current = routeIndex(pathname);
    if (current < 0) return;
    const next = dx < 0 ? current + 1 : current - 1;
    if (next < 0 || next >= SWIPE_ROUTES.length) return;
    const destination = SWIPE_ROUTES[next];
    if (destination === pathname) return;
    const nextDirection = dx < 0 ? "left" : "right";
    setDirection(nextDirection);
    try { sessionStorage.setItem("zikra-route-direction", nextDirection); } catch {}
    router.push(destination);
  }

  return (
    <div className="zikra-page-transition" data-direction={direction} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {children}
    </div>
  );
}
