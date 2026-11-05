"use client";

import { useEffect, useState } from "react";

export default function DownloadQRCode() {
  const [url, setUrl] = useState("");
  useEffect(() => setUrl(window.location.origin), []);

  if (!url) return <div className="h-[132px] w-[132px] animate-pulse rounded-xl bg-white/70" />;

  return (
    <img
      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(url)}`}
      alt="Zikra saytiga o'tish uchun QR kod"
      width={132}
      height={132}
      className="h-[132px] w-[132px] rounded-xl bg-white p-1"
      loading="lazy"
    />
  );
}
