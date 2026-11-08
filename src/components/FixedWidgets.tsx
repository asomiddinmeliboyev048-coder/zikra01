"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import BottomNav from "@/components/BottomNav";
import NotificationListener from "@/components/NotificationListener";
import SupportWidget from "@/components/SupportWidget";
import CallProvider from "@/components/call/CallProvider";
import PushManager from "@/components/PushManager";

/**
 * Viewport widgets are rendered in document.body, outside animated route
 * wrappers and blurred headers. This keeps fixed positioning stable.
 */
export default function FixedWidgets({
  userId,
  unread,
}: {
  userId: string;
  unread: number;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <>
      <NotificationListener userId={userId} />
      <SupportWidget userId={userId} />
      <CallProvider userId={userId} />
      <PushManager userId={userId} />
      <BottomNav profileId={userId} unread={unread} />
    </>,
    document.body
  );
}
