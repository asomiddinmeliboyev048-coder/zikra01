"use client";

import { useState } from "react";
import { saveItemAction } from "@/app/actions/saved";

export default function SaveVideoButton({ url }: { url: string }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const res = await saveItemAction(url, "video");
    setBusy(false);
    if (res.error) alert(res.error);
    else setSaved(true);
  }

  return (
    <button
      onClick={save}
      disabled={busy || saved}
      className="flex items-center gap-1 text-sm text-gray-500 transition hover:text-brand disabled:opacity-60"
    >
      📌 {saved ? "Saqlandi" : "Saqlash"}
    </button>
  );
}
