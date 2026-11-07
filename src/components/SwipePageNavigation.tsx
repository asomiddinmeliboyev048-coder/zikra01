"use client";

import { useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const SWIPE_ROUTES = ["/discovery", "/videos", "/reels", "/chat", "/lessons"] as const;
const SWIPE_THRESHOLD = 76;
const AXIS_RATIO = 1.25;

type Point = { x: number; y: number; pointerId: number };

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(
    "a,button,input,textarea,select,[contenteditable='true'],[role='slider'],[data-no-page-swipe],.no-page-swipe"
  ));
}

export default function SwipePageNavigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const start = useRef<Point | null>(null);
  const navigating = useRef(false);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch" || isInteractiveTarget(event.target)) {
      start.current = null;
      return;
    }
    start.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    navigating.current = false;
  }, []);

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const origin = start.current;
    start.current = null;
    if (!origin || navigating.current || event.pointerType !== "touch" || isInteractiveTarget(event.target)) return;

    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * AXIS_RATIO) return;

    const currentIndex = SWIPE_ROUTES.findIndex(route =>
      route === "/discovery" ? pathname === route || pathname === "/" : pathname.startsWith(route)
    );
    if (currentIndex < 0) return;

    const nextIndex = dx < 0 ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= SWIPE_ROUTES.length) return;

    navigating.current = true;
    router.push(SWIPE_ROUTES[nextIndex]);
  }, [pathname, router]);

  const cancel = useCallback(() => { start.current = null; }, []);

  return (
    <div
      className="zikra-swipe-viewport min-h-[100dvh]"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={cancel}
      onPointerLeave={cancel}
      style={{ touchAction: "pan-y" }}
    >
      {children}
    </div>
  );
}
