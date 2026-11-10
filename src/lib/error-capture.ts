import { sanitizeErrorLog } from "@/lib/error-log-sanitize";

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => {
    const err = (event as ErrorEvent).error ?? event;
    void reportToServer("window.onerror", err);
  });
  globalThis.addEventListener("unhandledrejection", (event) => {
    const reason = (event as PromiseRejectionEvent).reason;
    void reportToServer("unhandledrejection", reason);
  });
}

/* ---------------------------------------------------------------- */
/*  Dev-only logging helpers                                         */
/* ---------------------------------------------------------------- */

const IS_DEV =
  (typeof import.meta !== "undefined" && (import.meta as { env?: { DEV?: boolean } }).env?.DEV) ??
  (typeof process !== "undefined" && process.env?.NODE_ENV !== "production");

/* ---------------------------------------------------------------- */
/*  Server reporting (lightweight, fire-and-forget)                  */
/* ---------------------------------------------------------------- */

// Throttle: at most one report per (scope+message) per 30s, max 20 per minute total.
const recentReports = new Map<string, number>();
let reportsThisMinute = 0;
let minuteStart = 0;

function shouldReport(key: string): boolean {
  const now = Date.now();
  if (now - minuteStart > 60_000) {
    minuteStart = now;
    reportsThisMinute = 0;
  }
  if (reportsThisMinute >= 20) return false;
  const last = recentReports.get(key);
  if (last && now - last < 30_000) return false;
  recentReports.set(key, now);
  if (recentReports.size > 100) {
    // Proper sweep: drop every entry older than the 30s dedup window so
    // long-lived sessions don't accumulate stale keys. Fallback: clear all.
    const cutoff = now - 30_000;
    let removed = 0;
    for (const [k, ts] of recentReports) {
      if (ts < cutoff) {
        recentReports.delete(k);
        removed += 1;
      }
    }
    if (removed === 0) recentReports.clear();
  }
  reportsThisMinute += 1;
  return true;
}

async function reportToServer(scope: string, err: unknown): Promise<void> {
  // Only report from the browser, only in production builds.
  if (typeof window === "undefined") return;
  if (IS_DEV) return;
  try {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : String(err);
    const stack = err instanceof Error ? err.stack ?? null : null;
    const data = sanitizeErrorLog({
      scope,
      message,
      stack,
      url: typeof location !== "undefined" ? location.href : null,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      release: null,
    });
    const key = `${data.scope}::${data.message}`;
    if (!shouldReport(key)) return;
    const { logClientError } = await import("@/lib/error-log.functions");
    await logClientError({ data });
  } catch {
    // Swallow — logging must never throw.
  }
}

/**
 * Non-fatal warning. Silent in production, console.warn in dev.
 */
export function captureWarn(scope: string, err: unknown): void {
  void reportToServer(scope, err);
  if (IS_DEV && typeof console !== "undefined") {
    console.warn(`[${scope}]`, err);
  }
}

/**
 * Recoverable error. Silent in production, console.error in dev.
 */
export function captureError(scope: string, err: unknown): void {
  void reportToServer(scope, err);
  if (IS_DEV && typeof console !== "undefined") {
    console.error(`[${scope}]`, err);
  }
}
