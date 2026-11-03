"use client";

import { useEffect } from "react";
import { translations, getCanonicalText, type Locale } from "@/lib/i18n";

const LOCALES: Locale[] = ["uz", "en", "ru"];
const ATTRS = ["placeholder", "title", "aria-label", "alt"] as const;

function readLocale(): Locale {
  try {
    const value = localStorage.getItem("zikra-locale");
    if (value && LOCALES.includes(value as Locale)) return value as Locale;
  } catch {}
  return "uz";
}

function translateTree(root: ParentNode, locale: Locale) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || !node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
      if (parent.closest("script,style,noscript,svg,code,pre,textarea,[contenteditable=true],[data-no-translate]")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

  for (const node of textNodes) {
    const raw = node.nodeValue ?? "";
    const trimmed = raw.trim();
    const canonical = getCanonicalText(trimmed, currentLocaleFromText(trimmed, locale));
    const target = locale === "uz" ? canonical : translations[canonical]?.[locale] ?? canonical;
    if (target !== trimmed) node.nodeValue = raw.replace(trimmed, target);
  }

  const elements = root instanceof Element ? [root, ...Array.from(root.querySelectorAll("*"))] : Array.from((root as Document).querySelectorAll("*"));
  for (const element of elements) {
    if (element.closest("script,style,noscript,svg,[data-no-translate]")) continue;
    for (const attr of ATTRS) {
      const value = element.getAttribute(attr);
      if (!value) continue;
      const canonical = getCanonicalText(value, currentLocaleFromText(value, locale));
      const target = locale === "uz" ? canonical : translations[canonical]?.[locale] ?? canonical;
      if (target !== value) element.setAttribute(attr, target);
    }
  }
}

// If the visible text is currently in another supported language, reverse it
// to the canonical Uzbek phrase before applying the selected locale.
function currentLocaleFromText(text: string, selected: Locale): Locale {
  if (selected === "uz") return "en"; // reverse lookup accepts either translated value below
  return selected === "en" ? "ru" : "en";
}

export default function LanguageRuntime() {
  useEffect(() => {
    let locale = readLocale();
    document.documentElement.lang = locale;
    translateTree(document.body, locale);

    const applyLocale = (next: Locale) => {
      if (!LOCALES.includes(next)) return;
      locale = next;
      try { localStorage.setItem("zikra-locale", next); } catch {}
      document.documentElement.lang = next;
      translateTree(document.body, next);
    };

    const onLocaleChange = (event: Event) => {
      const next = (event as CustomEvent<string>).detail;
      if (next === "uz" || next === "en" || next === "ru") applyLocale(next);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === "zikra-locale" && (event.newValue === "uz" || event.newValue === "en" || event.newValue === "ru")) {
        applyLocale(event.newValue);
      }
    };

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData" && record.target.parentElement) {
          translateTree(record.target.parentElement, locale);
        }
        for (const node of Array.from(record.addedNodes)) {
          if (node.nodeType === Node.ELEMENT_NODE) translateTree(node as Element, locale);
          else if (node.nodeType === Node.TEXT_NODE && node.parentElement) translateTree(node.parentElement, locale);
        }
        if (record.type === "attributes" && record.target instanceof Element) translateTree(record.target, locale);
      }
    });

    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
    window.addEventListener("zikra-locale-change", onLocaleChange);
    window.addEventListener("storage", onStorage);
    return () => {
      observer.disconnect();
      window.removeEventListener("zikra-locale-change", onLocaleChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return null;
}
