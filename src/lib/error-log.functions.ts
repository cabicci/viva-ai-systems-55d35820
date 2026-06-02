import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

const ErrorLogInput = z.object({
  scope: z.string().min(1).max(120).default("unknown"),
  message: z.string().min(1).max(2000),
  stack: z.string().max(10_000).optional().nullable(),
  url: z.string().max(2000).optional().nullable(),
  userAgent: z.string().max(500).optional().nullable(),
  release: z.string().max(120).optional().nullable(),
  extra: z.record(z.string(), z.unknown()).optional().nullable(),
});

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