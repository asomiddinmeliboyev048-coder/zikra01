"use client";

import Script from "next/script";

declare global {
  interface Window {
    AOS?: {
      init: (options?: Record<string, unknown>) => void;
      refresh: () => void;
    };
  }
}

export default function LandingAOS() {
  function handleAOSLoad() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const existing = document.querySelector<HTMLLinkElement>('link[data-zikra-aos="true"]');
    if (existing) {
      window.AOS?.refresh();
      return;
    }

    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "https://unpkg.com/aos@2.3.4/dist/aos.css";
    stylesheet.dataset.zikraAos = "true";
    stylesheet.onload = () => {
      window.AOS?.init({
        offset: 90,
        duration: 750,
        easing: "ease-out-cubic",
        once: true,
        mirror: false,
        disable: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
    };
    document.head.appendChild(stylesheet);
  }

  return (
    <Script
      src="https://unpkg.com/aos@2.3.4/dist/aos.js"
      strategy="afterInteractive"
      onLoad={handleAOSLoad}
    />
  );
}
