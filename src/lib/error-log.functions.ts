import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

// IMPORTANT: load `supabaseAdmin` dynamically inside the handler so its
// top-level import never reaches the client bundle.
async function loadSupabaseAdmin() {
  const mod = await import("@/integrations/supabase/client.server");
  return mod.supabaseAdmin;
}

const ErrorLogInput = z.object({
  scope: z.string().min(1).max(120).default("unknown"),
  message: z.string().min(1).max(2000),
  stack: z.string().max(10_000).optional().nullable(),
  url: z.string().max(2000).optional().nullable(),
  userAgent: z.string().max(500).optional().nullable(),
  release: z.string().max(120).optional().nullable(),
  extra: z.record(z.string(), z.unknown()).optional().nullable(),
});

const ANON_RATE_LIMIT_USER_ID = "00000000-0000-0000-0000-000000000001";
const ERROR_LOG_BUCKET_KEY = "error-log";

/** Fail closed on RPC errors; returns false when the limit is exceeded or RPC fails. */
async function consumeErrorLogRateLimit(
  userId: string,
  maxCalls: number,
): Promise<boolean> {
  try {
    const supabaseAdmin = await loadSupabaseAdmin();
    const { data, error } = await supabaseAdmin.rpc("consume_rate_limit", {
      p_user_id: userId,
      p_bucket_key: ERROR_LOG_BUCKET_KEY,
      p_max_calls: maxCalls,
      p_window_seconds: 60,
    });
    if (error) return false;
    const row = Array.isArray(data) ? data[0] : data;
    return Boolean(row?.allowed);
  } catch {
    return false;
  }
}

export const logClientError = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ErrorLogInput.parse(data))
  .handler(async ({ data }) => {
    try {
      // C3 fix: derive user_id from a verified bearer token instead of trusting
      // caller input. Unauthenticated callers are allowed (pre-login errors
      // still useful) but are logged with user_id = null — preventing spoofing.
      let resolvedUserId: string | null = null;
      const authHeader = getRequestHeader("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          const url = process.env.SUPABASE_URL;
          const anon = process.env.SUPABASE_PUBLISHABLE_KEY;
          if (url && anon) {
            const client = createClient(url, anon, {
              global: { headers: { Authorization: authHeader } },
              auth: { persistSession: false, autoRefreshToken: false },
            });
            const { data: claims } = await client.auth.getClaims(
              authHeader.slice(7),
            );
            const sub = claims?.claims?.sub;
            if (typeof sub === "string") resolvedUserId = sub;
          }
        } catch {
          resolvedUserId = null;
        }
      }

      const rateLimitAllowed = await consumeErrorLogRateLimit(
        resolvedUserId ?? ANON_RATE_LIMIT_USER_ID,
        resolvedUserId ? 30 : 20,
      );
      if (!rateLimitAllowed) return { ok: false as const };

      const supabaseAdmin = await loadSupabaseAdmin();
      await supabaseAdmin.from("client_error_logs").insert({
        scope: data.scope,
        message: data.message,
        stack: data.stack ?? null,
        url: data.url ?? null,
        user_agent: data.userAgent ?? null,
        release: data.release ?? null,
        extra: (data.extra ?? null) as Json | null,
        user_id: resolvedUserId,
      });
      return { ok: true as const };
    } catch {
      // Never let logging failures bubble up to the caller.
      return { ok: false as const };
    }
  });