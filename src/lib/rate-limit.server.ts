import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Server-side rate limiter — protects expensive endpoints (AI Gateway calls)
 * from runaway cost. Backed by `public.consume_rate_limit` (atomic SQL).
 *
 * Use inside server functions AFTER `requireSupabaseAuth` middleware so you
 * have a verified `userId`. Throws a user-facing Arabic Error when exhausted.
 */
export interface RateLimitOptions {
  userId: string;
  /** Stable identifier for the endpoint, e.g. "ai:evaluate-mission". */
  bucketKey: string;
  /** Max allowed calls within the window. */
  maxCalls: number;
  /** Window size in seconds. */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
}

export async function enforceRateLimit(
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const { data, error } = await supabaseAdmin.rpc("consume_rate_limit", {
    p_user_id: opts.userId,
    p_bucket_key: opts.bucketKey,
    p_max_calls: opts.maxCalls,
    p_window_seconds: opts.windowSeconds,
  });

  if (error) {
    // Fail CLOSED for cost-sensitive AI buckets — better to surface a
    // transient error than to let runaway cost through on DB instability.
    console.error("[rate-limit] consume_rate_limit failed:", error);
    throw new Error("الخدمة غير متاحة مؤقتًا. حاول تاني بعد شوية.");
  }

  const row = Array.isArray(data) ? data[0] : data;
  const result: RateLimitResult = {
    allowed: Boolean(row?.allowed),
    remaining: Number(row?.remaining ?? 0),
    resetAt: String(row?.reset_at ?? new Date().toISOString()),
  };

  if (!result.allowed) {
    const resetMs = new Date(result.resetAt).getTime() - Date.now();
    const minutes = Math.max(1, Math.ceil(resetMs / 60000));
    throw new Error(
      `وصلت للحد الأقصى من المحاولات. جرّب تاني بعد حوالي ${minutes} دقيقة.`,
    );
  }

  return result;
}