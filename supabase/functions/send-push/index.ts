// ============================================================
// Zikra — "send-push" Supabase Edge Function (Deno)
// Foydalanuvchiga FCM HTTP v1 orqali push bildirishnoma yuboradi.
//
// O'RNATISH:
//   1) Service account yarating (Firebase Console > Project Settings >
//      Service accounts > Generate new private key).
//   2) Supabase secrets:
//        supabase secrets set FIREBASE_PROJECT_ID=...
//        supabase secrets set FIREBASE_CLIENT_EMAIL=...
//        supabase secrets set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
//        supabase secrets set SUPABASE_URL=...                 (avtomatik mavjud)
//        supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...    (avtomatik mavjud)
//   3) Deploy:  supabase functions deploy send-push
//   4) `notifications` jadvaliga Database Webhook (INSERT) qo'shib, shu
//      funksiyani chaqiring (payload: { userId, title, body, link }).
//      Yoki to'g'ridan-to'g'ri server'dan fetch bilan chaqiring.
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

interface PushPayload {
  userId: string;
  title: string;
  body: string;
  link?: string;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

function base64url(input: string | Uint8Array): string {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : input;
  let str = btoa(String.fromCharCode(...bytes));
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Service account orqali OAuth2 access token olish (RS256 JWT)
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
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(
    JSON.stringify(claim)
  )}`;

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
  const jwt = `${unsigned}.${base64url(new Uint8Array(sig))}`;

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
    const projectId = Deno.env.get("FIREBASE_PROJECT_ID")!;
    const clientEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL")!;
    const privateKey = (Deno.env.get("FIREBASE_PRIVATE_KEY") ?? "").replace(
      /\\n/g,
      "\n"
    );

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Webhook (record) yoki to'g'ridan-to'g'ri payload'ni qo'llab-quvvatlash
    const incoming = await req.json();
    const record = incoming.record ?? incoming;
    const payload: PushPayload = {
      userId: record.userId ?? record.user_id,
      title: record.title ?? "Zikra",
      body: record.body ?? record.message ?? "",
      link: record.link ?? "/",
    };

    if (!payload.userId) {
      return new Response(JSON.stringify({ error: "userId yo'q" }), {
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
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    let sent = 0;
    for (const { token } of tokens as { token: string }[]) {
      const r = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title: payload.title, body: payload.body },
            data: { link: payload.link ?? "/" },
            webpush: { fcmOptions: { link: payload.link ?? "/" } },
          },
        }),
      });
      if (r.ok) sent++;
      else if (r.status === 404 || r.status === 400) {
        // Eskirgan token — o'chiramiz
        await supabase.from("push_tokens").delete().eq("token", token);
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
