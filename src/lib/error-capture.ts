// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => {
    const err = (event as ErrorEvent).error ?? event;
    record(err);
    void reportToServer("window.onerror", err);
  });
  globalThis.addEventListener("unhandledrejection", (event) => {
    const reason = (event as PromiseRejectionEvent).reason;
    record(reason);
    void reportToServer("unhandledrejection", reason);
  });
}

export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
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
    // simple cap: drop oldest-ish
    const firstKey = recentReports.keys().next().value;
    if (firstKey) recentReports.delete(firstKey);
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
    const key = `${scope}::${message}`;
    if (!shouldReport(key)) return;
    const { logClientError } = await import("@/lib/error-log.functions");
    await logClientError({
      data: {
        scope,
        message: message.slice(0, 2000),
        stack: stack ? stack.slice(0, 10_000) : null,
        url: typeof location !== "undefined" ? location.href.slice(0, 2000) : null,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
        release: null,
      },
    });
  } catch {
    // Swallow — logging must never throw.
  }
}

/**
 * Non-fatal warning. Silent in production, console.warn in dev.
 * Also records into the last-error capture so SSR can recover context.
 */
export function captureWarn(scope: string, err: unknown): void {
  record(err);
  void reportToServer(scope, err);
  if (IS_DEV && typeof console !== "undefined") {
    console.warn(`[${scope}]`, err);
  }
}

/**
 * Recoverable error. Silent in production, console.error in dev.
 * Records into the last-error capture.
 */
export function captureError(scope: string, err: unknown): void {
  record(err);
  void reportToServer(scope, err);
  if (IS_DEV && typeof console !== "undefined") {
    console.error(`[${scope}]`, err);
  }
}
