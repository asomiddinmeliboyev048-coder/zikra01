"use client";

import { useEffect } from "react";
import { translations, canonicalizeText, type Locale } from "@/lib/i18n";

const LOCALES: Locale[] = ["uz", "en", "ru"];
const ATTRS = ["placeholder", "title", "aria-label", "alt", "content"] as const;

function readLocale(): Locale {
  try {
    const value = localStorage.getItem("zikra-locale");
    if (value && LOCALES.includes(value as Locale)) return value as Locale;
  } catch {}
  return "uz";
}

function localizedText(text: string, locale: Locale): string {
  const titleSuffix = text.match(/^(.*) · Zikra$/);
  if (titleSuffix) return `${localizedText(titleSuffix[1], locale)} · Zikra`;
  const canonical = canonicalizeText(text);
  const exact = locale === "uz" ? canonical : translations[canonical]?.[locale];
  if (exact) return exact;
  const match = text.match(/^([0-9]+) ta mos profil · ([0-9]+)[/]([0-9]+)-sahifa$/);
  if (match) {
    const [, total, page, pages] = match;
    if (locale === "en") return `${total} matching profiles · Page ${page} of ${pages}`;
    if (locale === "ru") return `${total} подходящих профилей · Страница ${page} из ${pages}`;
  }
  const progress = text.match(/^([0-9]+)[/]([0-9]+) bajarildi$/);
  if (progress) return locale === "en" ? `${progress[1]}/${progress[2]} completed` : locale === "ru" ? `Выполнено: ${progress[1]}/${progress[2]}` : text;
  const found = text.match(/^([0-9]+) ta foydalanuvchi topildi$/);
  if (found) return locale === "en" ? `${found[1]} users found` : locale === "ru" ? `Найдено пользователей: ${found[1]}` : text;
  return text;
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
    const target = localizedText(trimmed, locale);
    if (target !== trimmed) node.nodeValue = raw.replace(trimmed, target);
  }

  const elements = root instanceof Element ? [root, ...Array.from(root.querySelectorAll("*"))] : Array.from((root as Document).querySelectorAll("*"));
  for (const element of elements) {
    if (element.closest("script,style,noscript,svg,[data-no-translate]")) continue;
    for (const attr of ATTRS) {
      const value = element.getAttribute(attr);
      if (!value) continue;
      const target = localizedText(value, locale);
      if (target !== value) element.setAttribute(attr, target);
    }
  }
}

export default function LanguageRuntime() {
  useEffect(() => {
    let locale = readLocale();
    document.documentElement.lang = locale;
    translateTree(document.documentElement, locale);

    const applyLocale = (next: Locale) => {
      if (!LOCALES.includes(next)) return;
      locale = next;
      try { localStorage.setItem("zikra-locale", next); } catch {}
      document.documentElement.lang = next;
      translateTree(document.documentElement, next);
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

    observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
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
