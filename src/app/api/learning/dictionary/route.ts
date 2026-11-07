import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const word = new URL(request.url).searchParams.get("word")?.trim();
  if (!word || word.length > 80 || !/^[a-zA-Z][a-zA-Z' -]*$/.test(word)) {
    return NextResponse.json({ error: "Inglizcha so‘zni to‘g‘ri kiriting." }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000), cache: "force-cache", next: { revalidate: 3600 } }
    );
    if (response.status === 404) {
      return NextResponse.json({ error: "Bu so‘z lug‘atdan topilmadi. Imlo yozilishini tekshiring." }, { status: 404 });
    }
    if (!response.ok) {
      return NextResponse.json({ error: "Lug‘at xizmati hozir javob bermayapti. Birozdan keyin urinib ko‘ring." }, { status: 502 });
    }
    const entries = await response.json();
    const entry = Array.isArray(entries) ? entries[0] : null;
    if (!entry) return NextResponse.json({ error: "So‘z bo‘yicha ma’lumot topilmadi." }, { status: 404 });

    return NextResponse.json({
      word: entry.word || word,
      phonetic: entry.phonetic || entry.phonetics?.find((item: any) => item.text)?.text || "",
      meanings: (entry.meanings || []).flatMap((meaning: any) =>
        (meaning.definitions || []).map((definition: any) => ({
          partOfSpeech: meaning.partOfSpeech || "",
          definition: definition.definition || "",
          example: definition.example || ""
        }))
      ).filter((item: any) => item.definition).slice(0, 6),
      audio: entry.phonetics?.find((item: any) => item.audio)?.audio || ""
    }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch (error) {
    console.error("[learning-dictionary]", error);
    return NextResponse.json({ error: "Lug‘at serveriga ulanib bo‘lmadi. Internet aloqasini tekshirib, qayta urinib ko‘ring." }, { status: 502 });
  }
}
