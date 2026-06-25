"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  uploadCertificate,
  isValidCertificate,
  CERTIFICATE_ACCEPT,
} from "@/lib/storage";
import {
  saveCertificateAction,
  removeCertificateAction,
} from "@/app/actions/profile";
import CertificateViewer from "./CertificateViewer";

type VStatus = "none" | "pending" | "approved" | "rejected";

export default function CertificateUpload({
  certificateUrl,
  verified = false,
  status = "none",
  ownerName,
}: {
  certificateUrl: string | null;
  verified?: boolean;
  status?: VStatus;
  ownerName?: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!isValidCertificate(file)) {
      setError("Faqat JPG, PNG yoki PDF fayl yuklash mumkin.");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Fayl hajmi 10MB dan oshmasligi kerak.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const url = await uploadCertificate(file); // mijoz tomonida Storage'ga yuklash
      const res = await saveCertificateAction(url); // URL'ni saqlash + status='pending'
      if (res.error) setError(res.error);
      else router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yuklashda xatolik.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!confirm("Sertifikatni o'chirmoqchimisiz?")) return;
    setUploading(true);
    setError(null);
    const res = await removeCertificateAction();
    setUploading(false);
    if (res.error) setError(res.error);
    else router.refresh();
  }

  const statusBadge = () => {
    if (verified || status === "approved")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
          ✓ Tasdiqlangan
        </span>
      );
    if (status === "pending")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
          ⏳ Tasdiqlash kutilmoqda
        </span>
      );
    if (status === "rejected")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2.5 py-1 text-xs font-semibold text-accent-700">
          ✖ Rad etilgan
        </span>
      );
    return null;
  };

  return (
    <div className="space-y-3">
      {certificateUrl ? (
        <>
          <div className="flex items-center gap-2">{statusBadge()}</div>
          <CertificateViewer
            url={certificateUrl}
            verified={verified || status === "approved"}
            ownerName={ownerName}
          />
          {status === "rejected" && (
            <p className="text-xs text-accent-700">
              Sertifikatingiz rad etildi. Iltimos, aniqroq hujjat yuklang.
            </p>
          )}
          {status === "pending" && (
            <p className="text-xs text-gray-500">
              Sertifikatingiz admin tomonidan ko&apos;rib chiqilmoqda.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn-outline text-sm"
            >
              {uploading ? "Yuklanmoqda..." : "🔄 Boshqa fayl yuklash"}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 transition hover:border-accent-100 hover:text-accent-700"
            >
              O&apos;chirish
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-500">
            O&apos;rgata oladigan faningiz bo&apos;yicha sertifikatingizni
            yuklang. Admin tasdiqlagach, profilingizda ishonch belgisi paydo
            bo&apos;ladi.
          </p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex w-full max-w-sm cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-4 text-sm text-gray-500 transition hover:border-brand hover:text-brand disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {uploading ? "Yuklanmoqda..." : "Sertifikat yuklash (JPG, PNG yoki PDF)"}
          </button>
        </>
      )}

      <input
        ref={fileRef}
        type="file"
        accept={CERTIFICATE_ACCEPT}
        onChange={handleFile}
        className="hidden"
      />

      {error && <p className="text-xs text-accent-700">{error}</p>}
    </div>
  );
}
