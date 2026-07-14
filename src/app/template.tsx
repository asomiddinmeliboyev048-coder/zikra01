/**
 * Zikra — global sahifa o'tish shabloni (template).
 *
 * `template.tsx` `layout.tsx` dan farqli o'laroq HAR navigatsiyada QAYTA
 * o'rnatiladi (remount). Shu tufayli har o'tishda `zikra-page` CSS
 * animatsiyasi qayta ishga tushadi va sahifa silliq "paydo bo'ladi"
 * (Telegram/Instagram uslubidagi cross-fade).
 *
 * MUHIM: animatsiya FAQAT `opacity` bilan (globals.css'dagi
 * `zikra-page-enter`). `transform` ATAYIN ishlatilmagan — aks holda
 * bu element ichidagi `position: fixed`/`sticky` bolalar (bottom-nav,
 * support widget, navbar) uchun containing-block yaratilib, ular buzilardi.
 *
 * `prefers-reduced-motion` bo'lsa globals.css animatsiyani ~0ms ga tushiradi.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="zikra-page">{children}</div>;
}
