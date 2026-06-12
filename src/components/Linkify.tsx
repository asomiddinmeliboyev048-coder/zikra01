"use client";

/**
 * Matndagi havolalarni (http://, https://, www.) ko'k, bosiladigan linkka aylantiradi.
 * Tashqi havola bosilganda "saytdan chiqib ketyapsiz" ogohlantirishi chiqadi.
 */
export default function Linkify({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/((?:https?:\/\/|www\.)[^\s]+)/g);

  function handleClick(e: React.MouseEvent, href: string) {
    e.preventDefault();
    const url = href.startsWith("http") ? href : `https://${href}`;
    const ok = window.confirm(
      `Siz tashqi saytga o'tyapsiz:\n${url}\n\nDavom etasizmi?`
    );
    if (ok) window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      {parts.map((part, i) =>
        /^(https?:\/\/|www\.)/.test(part) ? (
          <a
            key={i}
            href={part.startsWith("http") ? part : `https://${part}`}
            onClick={(e) => handleClick(e, part)}
            className="text-brand underline decoration-brand/40 hover:decoration-brand"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
