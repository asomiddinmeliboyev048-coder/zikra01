"use client";

// ============================================================
// Zikra — Biometrik qulf (WebAuthn / platform authenticator)
// Face ID / Touch ID / barmoq izi orqali ilovani ochish.
// Bu QURILMA darajasidagi qulf — PIN'ga qo'shimcha (uni almashtirmaydi).
// HTTPS (yoki localhost) talab qiladi.
// ============================================================

const BIO_CRED_KEY = "zikra_bio_cred";
const BIO_ENABLED_KEY = "zikra_bio_enabled";

function bufToB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBuf(s: string): ArrayBuffer {
  let str = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4 ? 4 - (str.length % 4) : 0;
  str += "=".repeat(pad);
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

/** Qurilmada biometrik (platform authenticator) mavjudmi? */
export async function isBiometricSupported(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** Biometrik qulf yoqilganmi? */
export function isBiometricEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    localStorage.getItem(BIO_ENABLED_KEY) === "1" &&
    !!localStorage.getItem(BIO_CRED_KEY)
  );
}

/** Biometrikni ro'yxatdan o'tkazish (yoqish) */
export async function registerBiometric(
  userId: string,
  userName: string
): Promise<boolean> {
  if (!(await isBiometricSupported())) return false;
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Zikra", id: location.hostname },
      user: {
        id: new TextEncoder().encode(userId),
        name: userName || "zikra-user",
        displayName: userName || "Zikra foydalanuvchisi",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;

  if (!cred) return false;
  localStorage.setItem(BIO_CRED_KEY, bufToB64url(cred.rawId));
  localStorage.setItem(BIO_ENABLED_KEY, "1");
  return true;
}

/** Biometrik tekshirish (qulfni ochish) */
export async function verifyBiometric(): Promise<boolean> {
  const id = localStorage.getItem(BIO_CRED_KEY);
  if (!id) return false;
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ type: "public-key", id: b64urlToBuf(id) }],
        userVerification: "required",
        timeout: 60000,
      },
    });
    return !!assertion;
  } catch {
    return false;
  }
}

/** Biometrik qulfni o'chirish */
export function clearBiometric(): void {
  localStorage.removeItem(BIO_CRED_KEY);
  localStorage.removeItem(BIO_ENABLED_KEY);
}
