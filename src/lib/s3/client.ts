import { S3Client } from "@aws-sdk/client-s3";

/**
 * AWS S3 klienti — reels (qisqa videolar) uchun.
 *
 * MUHIM (XAVFSIZLIK):
 *  - Bu fayl FAQAT server tomonda ishlatiladi (route handler / server action).
 *  - Maxfiy kalitlar HECH QACHON kodga yozilmaydi — faqat muhit
 *    o'zgaruvchilaridan (.env.local) o'qiladi.
 *  - AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY oldiga NEXT_PUBLIC_ QO'YMANG,
 *    aks holda ular brauzerga (client bundle) tushib ketadi va oshkor bo'ladi.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Muhit o'zgaruvchisi topilmadi: ${name}. .env.local faylini tekshiring.`
    );
  }
  return value;
}

export const S3_REGION = requireEnv("AWS_REGION");
export const S3_BUCKET = requireEnv("AWS_S3_BUCKET");

/**
 * Videolarni ommaviy o'qish uchun asosiy URL manzil.
 * Odatda: https://<bucket>.s3.<region>.amazonaws.com
 * Kelajakda CloudFront qo'shilsa — shu qiymatni CloudFront domenига o'zgartiring.
 */
export const S3_PUBLIC_BASE_URL = requireEnv("S3_PUBLIC_BASE_URL").replace(
  /\/+$/,
  ""
);

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
