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
  function revealAllContent() {
    document.querySelectorAll<HTMLElement>("[data-aos]").forEach((element) => {
      element.classList.add("aos-animate");
      element.style.opacity = "1";
      element.style.transform = "none";
      element.style.visibility = "visible";
    });
  }

  function handleAOSLoad() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealAllContent();
      return;
    }

    const existing = document.querySelector<HTMLLinkElement>('link[data-zikra-aos="true"]');
    if (existing) {
      try {
        window.AOS?.refresh();
      } catch {
        revealAllContent();
      }
      return;
    }

    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "https://unpkg.com/aos@2.3.4/dist/aos.css";
    stylesheet.dataset.zikraAos = "true";
    stylesheet.onload = () => {
      try {
        if (!window.AOS) {
          revealAllContent();
          return;
        }

        window.AOS.init({
          offset: 90,
          duration: 750,
          easing: "ease-out-cubic",
          once: true,
          mirror: false,
          disable: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        });
        window.AOS.refresh();
      } catch {
        revealAllContent();
      }
    };
    stylesheet.onerror = revealAllContent;
    document.head.appendChild(stylesheet);
  }

  return (
    <Script
      src="https://unpkg.com/aos@2.3.4/dist/aos.js"
      strategy="afterInteractive"
      onLoad={handleAOSLoad}
      onError={revealAllContent}
    />
  );
}
