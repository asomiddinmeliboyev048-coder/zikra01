import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const offlineEntries: Record<string, { translation: string; definition: string; example: string }> = {
  hello:{translation:"salom",definition:"A greeting used when meeting someone.",example:"Hello, how are you?"},
  world:{translation:"dunyo",definition:"The earth and all people and things on it.",example:"We want to make the world better."},
  apple:{translation:"olma",definition:"A round fruit with red, green, or yellow skin.",example:"I eat an apple every morning."},
  book:{translation:"kitob",definition:"A set of written or printed pages bound together.",example:"This book is interesting."},
  learn:{translation:"o‘rganmoq",definition:"To gain knowledge or a new skill.",example:"I learn English every day."},
  student:{translation:"talaba",definition:"A person who is studying at a school or university.",example:"The student is preparing for an exam."},
  computer:{translation:"kompyuter",definition:"An electronic device for storing and processing information.",example:"My computer is fast."},
  security:{translation:"xavfsizlik",definition:"The state of being protected from danger or attack.",example:"Security is important online."},
  network:{translation:"tarmoq",definition:"A group of connected computers or people.",example:"The network is secure."},
  improve:{translation:"yaxshilamoq",definition:"To make or become better.",example:"Practice helps you improve."},
  opportunity:{translation:"imkoniyat",definition:"A situation in which it is possible to do something.",example:"This is a great opportunity."},
  experience:{translation:"tajriba",definition:"Knowledge or skill gained by doing something.",example:"Experience makes you more confident."},
  challenge:{translation:"qiyinchilik",definition:"A difficult task that tests ability.",example:"Every challenge is a chance to grow."},
  beautiful:{translation:"chiroyli",definition:"Pleasing to the senses or mind.",example:"It is a beautiful day."},
  happy:{translation:"xursand",definition:"Feeling or showing pleasure and contentment.",example:"She is happy today."},
  authentication:{translation:"autentifikatsiya",definition:"The process of verifying the identity of a user or system.",example:"Use multi-factor authentication."},
  encryption:{translation:"shifrlash",definition:"The process of converting information into a protected form.",example:"Encryption protects private data."},
  firewall:{translation:"tarmoqlararo ekran",definition:"A security system that controls network traffic.",example:"The firewall blocks suspicious traffic."},
  phishing:{translation:"firibgarlik orqali ma’lumot o‘g‘irlash",definition:"A scam that tricks people into revealing sensitive information.",example:"Never open a suspicious phishing link."},
  array:{translation:"massiv",definition:"A data structure that stores a collection of values.",example:"The array contains five numbers."},
  function:{translation:"funksiya",definition:"A reusable block of code that performs a task.",example:"This function returns a number."},
  "привет":{translation:"salom",definition:"A common informal Russian greeting.",example:"Привет, как дела?"},
  "спасибо":{translation:"rahmat",definition:"A polite expression of gratitude.",example:"Спасибо за помощь."},
  "пожалуйста":{translation:"iltimos; marhamat",definition:"A polite word used when making a request or responding to thanks.",example:"Пожалуйста, помогите мне."},
  "сегодня":{translation:"bugun",definition:"On this day; at the present time.",example:"Сегодня хорошая погода."},
  "работа":{translation:"ish",definition:"An activity involving mental or physical effort.",example:"У меня много работы."},
  "дом":{translation:"uy",definition:"A building where people live.",example:"Я иду домой."},
  "книга":{translation:"kitob",definition:"A written or printed work consisting of pages.",example:"Я читаю интересную книгу."},
  "вода":{translation:"suv",definition:"A clear liquid essential for life.",example:"Пейте больше воды."},
  "школа":{translation:"maktab",definition:"An institution where children receive education.",example:"Моя школа рядом."},
  "друг":{translation:"do‘st",definition:"A person whom one knows and likes.",example:"Мой друг помогает мне."},
};

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
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(6500), cache: "no-store" });
    if (response.ok) {
      const payload = await response.json();
      const value = payload?.responseData?.translatedText;
      if (payload?.responseStatus === 200 && typeof value === "string" && value.trim() && value.toLowerCase() !== word.toLowerCase() && !/please select|invalid language|quota exceeded/i.test(value)) {
        return value.replace(/&amp;/g, "&").replace(/&#39;/g, "'");
      }
    }
  } catch {}
  try {
    const fallbackUrl = new URL("https://translate.googleapis.com/translate_a/single");
    fallbackUrl.searchParams.set("client", "gtx");
    fallbackUrl.searchParams.set("sl", source);
    fallbackUrl.searchParams.set("tl", "uz");
    fallbackUrl.searchParams.set("dt", "t");
    fallbackUrl.searchParams.set("q", word);
    const response = await fetch(fallbackUrl, { signal: AbortSignal.timeout(6500), cache: "no-store" });
    if (!response.ok) return "";
    const payload = await response.json();
    const value = Array.isArray(payload?.[0]) ? payload[0].map((part: any) => part?.[0] || "").join("") : "";
    return value.trim() && value.toLowerCase() !== word.toLowerCase() ? value : "";
  } catch { return ""; }
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
      console.warn("[learning-dictionary] translation providers unavailable", error);
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

  const fallback = offlineEntries[word.toLowerCase()];
  const finalTranslation = translation || fallback?.translation || "";
  const finalMeanings = meanings.length ? meanings : fallback ? [{ partOfSpeech: "meaning", definition: fallback.definition, example: fallback.example }] : [];
  const example = finalMeanings.find((item) => item.example)?.example || fallback?.example || "";
  const exampleTranslation = example ? await translate(example, source).catch(() => "") : "";

  if (!finalTranslation && !finalMeanings.length && !entry?.phonetic) {
    return NextResponse.json({
      error: "Bu so‘z uchun hozircha ma’lumot topilmadi. Internet aloqasini tekshirib, boshqa so‘z bilan urinib ko‘ring.",
    }, { status: 404 });
  }

  return NextResponse.json({
    word: entry?.word || word,
    translation: finalTranslation,
    sourceLanguage: source,
    targetLanguage: "uz",
    phonetic: entry?.phonetic || entry?.phonetics?.find((item) => item.text)?.text || "",
    meanings: finalMeanings,
    example,
    exampleTranslation,
    audio: entry?.phonetics?.find((item) => item.audio)?.audio || "",
    source: translation || meanings.length ? "online" : "offline",
  }, { headers: { "Cache-Control": "private, max-age=900, stale-while-revalidate=3600" } });
}
