"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveItemAction, deleteSavedAction } from "@/app/actions/saved";
import Linkify from "@/components/Linkify";
import { formatTime } from "@/lib/utils";

export interface SavedItem {
  id: string;
  content: string;
  message_type: string;
  created_at: string;
}

function isMediaUrl(s: string) {
  return /^https?:\/\/\S+\.(jpe?g|png|gif|webp|mp4|webm|mov)(\?.*)?$/i.test(s.trim());
}

export default function SavedClient({ initial }: { initial: SavedItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<SavedItem[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    const t = text.trim();
    if (!t) return;
    setBusy(true);
    setText("");
    const res = await saveItemAction(t, "text");
    setBusy(false);
    if (res.error) {
      alert(res.error);
      setText(t);
    } else {
      router.refresh();
    }
  }

  async function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteSavedAction(id);
  }

  return (
    <div className="card flex h-[70vh] flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <span className="text-xl">📌</span>
        <h2 className="font-semibold text-gray-900">Saqlangan xabarlar</h2>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto bg-gray-50/50 p-4">
        {items.length === 0 && (
          <p className="mt-8 text-center text-sm text-gray-400">
            Bu yerga eslatma, havola yoki g&apos;oyalaringizni saqlang.
          </p>
        )}
        {items.map((it) => (
          <div key={it.id} className="group flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-brand px-4 py-2 text-sm text-white">
              {isMediaUrl(it.content) ? (
                /\.(mp4|webm|mov)(\?.*)?$/i.test(it.content) ? (
                  <video src={it.content} controls className="max-h-60 rounded-lg" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.content} alt="" className="max-h-60 rounded-lg" />
                )
              ) : (
                <p className="whitespace-pre-wrap break-words">
                  <Linkify text={it.content} />
                </p>
              )}
              <div className="mt-1 flex items-center justify-end gap-2">
                <span className="text-[10px] text-brand-100">{formatTime(it.created_at)}</span>
                <button onClick={() => remove(it.id)} className="text-[10px] text-brand-100 hover:text-white">
                  o&apos;chirish
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-gray-100 p-3 dark:border-gray-800">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Eslatma yozing..."
          className="input flex-1"
        />
        <button onClick={add} disabled={busy || !text.trim()} className="btn-primary px-4">
          Saqlash
        </button>
      </div>
    </div>
  );
}
