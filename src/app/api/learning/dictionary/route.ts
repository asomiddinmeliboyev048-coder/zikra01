import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type DictionaryEntry = {
  word?: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string; audio?: string }>;
  meanings?: Array<{
    partOfSpeech?: string;
    definitions?: Array<{ definition?: string; example?: string }>;
  }>;
};

async function translate(word: string, source: "en" | "ru") {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", word);
  url.searchParams.set("langpair", source + "|uz");
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(7000),
    cache: "no-store",
  });
  if (!response.ok) return "";
  const payload = await response.json();
  const value = payload?.responseData?.translatedText;
  if (typeof value !== "string" || !value.trim() || value.toLowerCase() === word.toLowerCase()) return "";
  return value.replace(/&amp;/g, "&").replace(/&#39;/g, "'");
}

async function lookupEnglish(word: string) {
  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(7000), cache: "no-store" }
  );
  if (!response.ok) return null;
  const entries = await response.json();
  return Array.isArray(entries) ? (entries[0] as DictionaryEntry | undefined) || null : null;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const word = params.get("word")?.trim();
  const requested = params.get("from");
  const source: "en" | "ru" = requested === "ru" || (requested !== "en" && /[а-яё]/i.test(word || "")) ? "ru" : "en";

  if (!word || word.length > 80 || !/^[a-zA-Zа-яА-ЯёЁ'’ʻʼ -]+$/.test(word)) {
    return NextResponse.json({ error: "So‘zni to‘g‘ri kiriting." }, { status: 400 });
  }

  const [translation, entry] = await Promise.all([
    translate(word, source).catch((error) => {
      console.warn("[learning-dictionary] translation provider unavailable", error);
      return "";
    }),
    source === "en" ? lookupEnglish(word).catch((error) => {
      console.warn("[learning-dictionary] dictionary provider unavailable", error);
      return null;
    }) : Promise.resolve(null),
  ]);

  const meanings = (entry?.meanings || [])
    .flatMap((meaning) => (meaning.definitions || []).map((definition) => ({
      partOfSpeech: meaning.partOfSpeech || "",
      definition: definition.definition || "",
      example: definition.example || "",
    })))
    .filter((item) => item.definition)
    .slice(0, 6);

  if (!translation && !meanings.length && !entry?.phonetic) {
    return NextResponse.json({
      error: "Tarjima yoki lug‘at xizmati hozir javob bermayapti. Birozdan keyin qayta urinib ko‘ring.",
    }, { status: 502 });
  }

  return NextResponse.json({
    word: entry?.word || word,
    translation,
    sourceLanguage: source,
    targetLanguage: "uz",
    phonetic: entry?.phonetic || entry?.phonetics?.find((item) => item.text)?.text || "",
    meanings,
    audio: entry?.phonetics?.find((item) => item.audio)?.audio || "",
  }, { headers: { "Cache-Control": "private, max-age=900, stale-while-revalidate=3600" } });
}
