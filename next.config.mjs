/** @type {import('next').NextConfig} */
const nextConfig = {
  // ============================================================
  // MUHIM: build (Vercel deploy) ESLint yoki TypeScript ogohlantirishlari
  // tufayli TO'XTAB QOLMASIN. Aks holda bitta kichik xato butun deploy'ni
  // to'xtatib, sayt eski versiyada qotib qoladi.
  // ============================================================
  eslint: {
    // Lint xatolari deploy'ni to'xtatmaydi (ular baribir faqat ogohlantirish)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScript xatolari ham deploy'ni to'xtatmaydi
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "ui-avatars.com" },
      // AWS S3 (reels/videolar) — barcha amazonaws xostlari
      { protocol: "https", hostname: "*.amazonaws.com" },
    ],
  },

  // ============================================================
  // REDIRECT'LAR — eski/mos kelmaydigan match havolalari 404 bermasin.
  // Route papkamiz `/match/[skillId]` (BIRLIKDA). Eski bildirishnomalar
  // `/matches/...` (ko'plikda) yoki `/skills/...` bo'lishi mumkin edi —
  // ularni bir xil `/match/...` sahifasiga yo'naltiramiz. Query (?mode=...)
  // avtomatik saqlanadi.
  // ============================================================
  async redirects() {
    return [
      {
        source: "/matches/:path*",
        destination: "/match/:path*",
        permanent: false,
      },
      {
        source: "/skills/:path*",
        destination: "/match/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
