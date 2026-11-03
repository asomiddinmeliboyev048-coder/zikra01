"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/utils";

export default function RelativeTime({ date }: { date: string }) {
  const [label, setLabel] = useState("Sana");
  useEffect(() => {
    const update = () => setLabel(timeAgo(date));
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, [date]);
  return <span>{label}</span>;
}
