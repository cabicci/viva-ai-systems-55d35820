import { createClient } from "npm:@supabase/supabase-js@2.105.4";
import { verifyResendWebhook } from "../_shared/resend.ts";
import { readWebhookBody, recordRetentionEvent } from "./handler.ts";

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  if (Deno.env.get("KIDS_RETENTION_WEBHOOK_ENABLED") !== "true")
    return new Response(null, { status: 503 });
  const secret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret || !url || !key) return new Response(null, { status: 503 });
  const body = await readWebhookBody(request);
  if (body === null) return new Response(null, { status: 413 });
  const event = await verifyResendWebhook(body, request.headers, secret);
  if (!event) return new Response(null, { status: 401 });
  try {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const recorded = await recordRetentionEvent(db, event);
    // Retry a delivery event that arrived before the send receipt was committed.
    return new Response(null, { status: recorded ? 204 : 503 });
  } catch {
    return new Response(null, { status: 503 });
  }
});
