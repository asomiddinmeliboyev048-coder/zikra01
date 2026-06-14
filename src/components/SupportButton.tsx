"use client";

/**
 * Profil sahifasidagi "Support" tugmasi — bosilganda global SupportWidget
 * (admin bilan chat oynasi) ochiladi. SupportWidget "zikra:open-support"
 * hodisasini tinglaydi.
 */
export default function SupportButton({
  className = "btn-outline",
}: {
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("zikra:open-support"))}
      className={className}
    >
      <span className="mr-1.5">🎧</span> Support
    </button>
  );
}
