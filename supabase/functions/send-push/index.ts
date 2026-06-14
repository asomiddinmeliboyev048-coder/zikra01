// ============================================================
// Zikra — "send-push" Supabase Edge Function (Deno)
// FCM HTTP v1 orqali push yuboradi.
// Eslatma: backslash (\) ishlatilmaydi — nusxalashda buzilmasligi uchun
// regex o'rniga split/join va String.fromCharCode ishlatilgan.
//
// Secrets: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
// (SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY avtomatik mavjud)
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const NL = String.fromCharCode(10); // newline
const BSLASH = String.fromCharCode(92); // backslash

function pemToArrayBuffer(pem: string): ArrayBuffer {
  // literal "\n", haqiqiy newline, CR, tab, bo'shliq va sarlavhalarni olib tashlaymiz
  let s = pem.split(BSLASH + "n").join("");
  s = s.split(NL).join("");
  s = s.split(String.fromCharCode(13)).join("");
  s = s.split(String.fromCharCode(9)).join("");
  s = s.split(" ").join("");
  s = s.split("-----BEGINPRIVATEKEY-----").join("");
  s = s.split("-----ENDPRIVATEKEY-----").join("");
  const bin = atob(s);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

function base64url(input: string | Uint8Array): string {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  return b64.split("+").join("-").split("/").join("_").split("=").join("");
}

async function getAccessToken(
  clientEmail: string,
  privateKeyPem: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned =
    base64url(JSON.stringify(header)) + "." + base64url(JSON.stringify(claim));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned)
  );
  const jwt = unsigned + "." + base64url(new Uint8Array(sig));

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("OAuth token olinmadi");
  return data.access_token as string;
}

Deno.serve(async (req: Request) => {
  try {
    const projectId = Deno.env.get("FIREBASE_PROJECT_ID") ?? "";
    const clientEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL") ?? "";
    const privateKey = Deno.env.get("FIREBASE_PRIVATE_KEY") ?? "";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const incoming = await req.json();
    const record = incoming.record ?? incoming;
    const payload = {
      userId: record.userId ?? record.user_id,
      title: record.title ?? "Zikra",
      body: record.body ?? record.message ?? "",
      link: record.link ?? "/",
    };
    if (!payload.userId) {
      return new Response(JSON.stringify({ error: "userId yoq" }), {
        status: 400,
      });
    }

    const { data: tokens } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("user_id", payload.userId);
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
    }

    const accessToken = await getAccessToken(clientEmail, privateKey);
    const url =
      "https://fcm.googleapis.com/v1/projects/" + projectId + "/messages:send";

    let sent = 0;
    for (const row of tokens as { token: string }[]) {
      const r = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: row.token,
            data: {
              title: payload.title,
              body: payload.body,
              link: payload.link,
            },
            webpush: {
              headers: { Urgency: "high", TTL: "120" },
              fcmOptions: { link: payload.link },
            },
          },
        }),
      });
      if (r.ok) sent++;
      else if (r.status === 404 || r.status === 400) {
        await supabase.from("push_tokens").delete().eq("token", row.token);
      }
    }

    return new Response(JSON.stringify({ sent }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "xatolik" }),
      { status: 500 }
    );
  }
});
