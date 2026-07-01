import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PWAInstall from "@/components/PWAInstall";
import PinGate from "@/components/auth/PinGate";
import AuthListener from "@/components/auth/AuthListener";
import { Analytics } from "@vercel/analytics/next";

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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Zikra",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Zikra — Learn. Teach. Be remembered.",
    description: "Bepul P2P ko'nikma almashish platformasi.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#534AB7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover", // iPhone "notch" / safe-area uchun
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
        <PWAInstall />
        <AuthListener />
        <PinGate />
        <Analytics />
      </body>
    </html>
  );
}
