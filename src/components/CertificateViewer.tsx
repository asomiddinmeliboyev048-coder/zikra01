"use client";

import { useEffect, useState } from "react";

/**
 * Sertifikat ko'rsatkichi:
 *  - kichik nusxasi (thumbnail) — rasm bo'lsa rasm, PDF bo'lsa hujjat ikonkasi
 *  - bosilganda chiroyli Modal oyna (popup) ochiladi va to'liq hajmda ko'rsatiladi
 *  - PDF bo'lsa <iframe> orqali ichida ochiladi
 *  - Esc tugmasi yoki fonga bosib yopish mumkin (sahifadan chiqmaydi)
 */
export default function CertificateViewer({
  url,
  verified = false,
  ownerName,
}: {
  url: string;
  verified?: boolean;
  ownerName?: string;
}) {
  const [open, setOpen] = useState(false);
  const isPdf = /\.pdf($|\?)/i.test(url);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    // Modal ochiq bo'lganda fon scroll qilinmasin
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Thumbnail */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full max-w-[220px] overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-left transition hover:border-brand hover:shadow-card-hover"
        aria-label="Sertifikatni ochish"
      >
        <div className="relative flex aspect-[4/3] items-center justify-center bg-gray-100">
          {isPdf ? (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="text-xs font-medium">PDF hujjat</span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt="Sertifikat"
              className="h-full w-full object-cover transition group-hover:scale-[1.03]"
            />
          )}

          {verified && (
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white shadow">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M9 16.2l-3.5-3.5a1 1 0 00-1.4 1.4l4.2 4.2c.4.4 1 .4 1.4 0l9-9a1 1 0 00-1.4-1.4L9 16.2z" />
              </svg>
              Tasdiqlangan
            </span>
          )}
        </div>
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-medium text-gray-600">Sertifikatni ko&apos;rish</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400" aria-hidden="true">
            <path d="M15 3h6v6" />
            <path d="M10 14L21 3" />
            <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
          </svg>
        </div>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 animate-fade-in"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Sertifikat"
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sarlavha */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-gray-900">
                  {ownerName ? `${ownerName} — sertifikat` : "Sertifikat"}
                </h3>
                {verified ? (
                  <p className="text-xs text-brand">Tasdiqlangan hujjat</p>
                ) : (
                  <p className="text-xs text-gray-400">Tasdiq kutilmoqda</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-brand"
                >
                  Yangi oynada ochish
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Yopish"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tarkib */}
            <div className="flex-1 overflow-auto bg-gray-50 p-3">
              {isPdf ? (
                <iframe
                  src={url}
                  title="Sertifikat PDF"
                  className="h-[70vh] w-full rounded-lg border border-gray-200 bg-white"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt="Sertifikat to'liq hajmda"
                  className="mx-auto max-h-[75vh] w-auto rounded-lg object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
