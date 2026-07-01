import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, S3_BUCKET, buildPublicUrl } from "@/lib/s3/client";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/reels/presign
 *
 * Brauzerga S3'ga TO'G'RIDAN-TO'G'RI yuklash uchun qisqa muddatli (presigned)
 * PUT URL beradi. Fayl serverdan o'tmaydi va AWS kalitlari brauzerga
 * chiqmaydi — bu Vercel (serverless) uchun eng xavfsiz va tejamli usul.
 *
 * Oqim:
 *   1) Foydalanuvchi tizimga kirganini tekshiramiz (Supabase).
 *   2) URL BERISHDAN OLDIN fayl turi va hajmini server tomonda tekshiramiz.
 *   3) Server o'zi noyob key yaratadi (foydalanuvchi boshqa faylni yoza olmaydi).
 */

// Ruxsat etilgan MIME turlari -> fayl kengaytmasi
const ALLOWED_TYPES = new Map<string, string>([
  ["video/mp4", "mp4"],
  ["video/quicktime", "mov"], // .mov
]);

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB
const URL_TTL_SECONDS = 60; // presigned URL 1 daqiqada eskiradi

export async function POST(req: Request) {
  try {
    // 1) Autentifikatsiya
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Avtorizatsiya talab qilinadi." },
        { status: 401 }
      );
    }

    // 2) Kirish ma'lumotlarini o'qish va tekshirish
    let body: { contentType?: unknown; size?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Yaroqsiz so'rov." },
        { status: 400 }
      );
    }

    const contentType =
      typeof body.contentType === "string" ? body.contentType : "";
    const size = typeof body.size === "number" ? body.size : NaN;

    const ext = ALLOWED_TYPES.get(contentType);
    if (!ext) {
      return NextResponse.json(
        { error: "Faqat .mp4 yoki .mov formatidagi videolarga ruxsat etiladi." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(size) || size <= 0 || size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Video hajmi 50MB dan oshmasligi kerak." },
        { status: 400 }
      );
    }

    // 3) Server tomonda noyob key — har bir foydalanuvchi o'z papkasida
    const key = `reels/${user.id}/${randomUUID()}.${ext}`;

    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: URL_TTL_SECONDS }
    );

    return NextResponse.json({
      uploadUrl,
      publicUrl: buildPublicUrl(key),
      key,
    });
  } catch {
    // Xatolik tafsilotlari (env, stack) mijozga OSHKOR QILINMAYDI.
    return NextResponse.json(
      { error: "Yuklash manzilini yaratib bo'lmadi. Keyinroq urinib ko'ring." },
      { status: 500 }
    );
  }
}
