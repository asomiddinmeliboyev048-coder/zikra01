import { S3Client } from "@aws-sdk/client-s3";

/**
 * AWS S3 klienti — reels (qisqa videolar) uchun.
 *
 * MUHIM (XAVFSIZLIK):
 *  - Bu modul FAQAT server tomonda import qilinadi (route handler / server action).
 *  - Maxfiy kalitlar HECH QACHON kodga yozilmaydi — faqat muhit
 *    o'zgaruvchilaridan o'qiladi.
 *  - Kalitlar oldiga NEXT_PUBLIC_ QO'YMANG, aks holda ular brauzer
 *    bundle'iga tushib, oshkor bo'ladi.
 *
 * Kutilayotgan muhit o'zgaruvchilari (Vercel Project Settings → Environment
 * Variables yoki lokal .env.local):
 *   - AWS_REGION
 *   - AWS_ACCESS_KEY_ID
 *   - AWS_SECRET_ACCESS_KEY
 *   - AWS_BUCKET_NAME
 *   - S3_PUBLIC_BASE_URL (IXTIYORIY — masalan, kelajakda CloudFront domeni.
 *     Berilmasa, region + bucket'dan avtomatik hosil qilinadi.)
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    // Xatolik xabari maxfiy qiymatni oshkor qilmaydi — faqat nomni ko'rsatadi.
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const S3_REGION = requireEnv("AWS_REGION");
export const S3_BUCKET = requireEnv("AWS_BUCKET_NAME");

/**
 * Videolarni ommaviy o'qish uchun asosiy URL.
 * Standart: https://<bucket>.s3.<region>.amazonaws.com
 * CloudFront'ga o'tsangiz, S3_PUBLIC_BASE_URL ni o'rnating.
 */
export const S3_PUBLIC_BASE_URL = (
  process.env.S3_PUBLIC_BASE_URL ||
  `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`
).replace(/\/+$/, "");

export const s3 = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),
  },
});

/** Berilgan S3 kalit (key) uchun ommaviy URL manzilini quradi. */
export function buildPublicUrl(key: string): string {
  return `${S3_PUBLIC_BASE_URL}/${key.replace(/^\/+/, "")}`;
}
