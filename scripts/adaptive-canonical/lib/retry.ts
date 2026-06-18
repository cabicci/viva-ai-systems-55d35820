const DEFAULT_TIMEOUT_MS = 90_000;
const DEFAULT_ATTEMPTS = 3;
const DEFAULT_BACKOFF_MS = [5_000, 15_000, 30_000];

export function reviewTimeoutMs(): number {
  const n = Number(process.env.AI_REVIEW_TIMEOUT_MS ?? String(DEFAULT_TIMEOUT_MS));
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TIMEOUT_MS;
}

export function retryBackoffMs(): number[] {
  const raw = process.env.AI_REVIEW_RETRY_BACKOFF_MS;
  if (raw) {
    const parsed = raw.split(",").map((s) => Number(s.trim())).filter((n) => n > 0);
    if (parsed.length) return parsed;
  }
  return [...DEFAULT_BACKOFF_MS];
}

export function maxAttempts(): number {
  const n = Number(process.env.AI_REVIEW_MAX_ATTEMPTS ?? String(DEFAULT_ATTEMPTS));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_ATTEMPTS;
}

export class ReviewTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`API review timed out after ${timeoutMs}ms`);
    this.name = "ReviewTimeoutError";
  }
}

export function isRetryableError(err: unknown): boolean {
  const msg = String(err).toLowerCase();
  if (err instanceof ReviewTimeoutError) return true;
  if (msg.includes("timed out") || msg.includes("timeout")) return true;
  if (msg.includes("network") || msg.includes("fetch failed") || msg.includes("econnreset")) {
    return true;
  }
  if (msg.includes("429") || msg.includes("rate limit") || msg.includes("overloaded")) {
    return true;
  }
  if (/\b5\d{2}\b/.test(msg)) return true;
  if (msg.includes("reviewer returned no json")) return true;
  if (msg.includes("reviewer json missing")) return true;
  return false;
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new ReviewTimeoutError(timeoutMs)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  opts?: { attempts?: number; backoffMs?: number[] },
): Promise<T> {
  const attempts = opts?.attempts ?? maxAttempts();
  const backoff = opts?.backoffMs ?? retryBackoffMs();
  let lastErr: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      if (!isRetryableError(err) || attempt >= attempts) throw err;
      const delay = backoff[Math.min(attempt - 1, backoff.length - 1)] ?? 5_000;
      console.warn(
        `  ↻ retry ${attempt}/${attempts - 1} in ${Math.round(delay / 1000)}s (${String(err).slice(0, 120)})`,
      );
      await sleep(delay);
    }
  }

  throw lastErr;
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}
