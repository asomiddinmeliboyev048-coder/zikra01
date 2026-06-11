import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Zikra — Learn. Teach. Be remembered.",
    template: "%s · Zikra",
  },
  description:
    "Zikra — O'zbekistondagi birinchi bepul P2P ko'nikma almashish platformasi. Sen menga Python o'rgat, men senga Ingliz tili o'rgataman.",
  keywords: ["Zikra", "ko'nikma almashish", "bepul ta'lim", "P2P", "Uzbekistan"],
  openGraph: {
    title: "Zikra — Learn. Teach. Be remembered.",
    description: "Bepul P2P ko'nikma almashish platformasi.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('zikra-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#f7f7fb] font-sans text-gray-900 antialiased dark:bg-[#0e1525] dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}
