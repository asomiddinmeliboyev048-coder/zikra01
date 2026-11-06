"use client";

import { useEffect } from "react";

/**
 * Zikra landing-page reveal animations.
 * No third-party CDN is required. Content is visible by default, so a blocked
 * script, stylesheet, observer, or browser extension can never hide the page.
 */
export default function LandingAOS() {
  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-aos]")
    );

    if (
      !elements.length ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    let observer: IntersectionObserver | null = null;

    try {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const element = entry.target as HTMLElement;
            element.classList.add("zikra-aos-visible");
            observer?.unobserve(element);
          });
        },
        {
          threshold: 0.08,
          rootMargin: "0px 0px -48px 0px",
        }
      );

      elements.forEach((element) => observer?.observe(element));
    } catch {
      // Progressive enhancement only: all content remains visible.
      observer?.disconnect();
    }

    return () => observer?.disconnect();
  }, []);

  return (
    <style jsx global>{`
      [data-aos] {
        opacity: 1;
        visibility: visible;
        transform: none;
      }

      [data-aos].zikra-aos-visible {
        animation: zikra-reveal 680ms cubic-bezier(0.2, 0.75, 0.2, 1) both;
      }

      [data-aos="fade-up"].zikra-aos-visible,
      [data-aos="zoom-in-up"].zikra-aos-visible {
        --zikra-reveal-y: 22px;
      }

      [data-aos="zoom-in"].zikra-aos-visible {
        --zikra-reveal-scale: 0.975;
      }

      @keyframes zikra-reveal {
        from {
          opacity: 0.72;
          transform: translate3d(0, var(--zikra-reveal-y, 12px), 0)
            scale(var(--zikra-reveal-scale, 1));
        }
        to {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        [data-aos],
        [data-aos].zikra-aos-visible {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
          transition: none !important;
        }
      }
    `}</style>
  );
}
