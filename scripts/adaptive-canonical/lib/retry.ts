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

/** Client cancellation is not proof that remote generation or billing stopped. */
export class ReviewUncertainError extends Error {
  constructor(message = "Review completion is uncertain; reconciliation required before another request") {
    super(message); this.name = "ReviewUncertainError";
  }
}
export class ReviewTimeoutError extends ReviewUncertainError {
  constructor(timeoutMs: number) {
    super(`API review timed out after ${timeoutMs}ms; cancellation requested, remote completion/billing unknown`);
    this.name = "ReviewTimeoutError";
  }
}
export class ReviewRejectedError extends Error {
  constructor(public readonly status: number) {
    super(`Reviewer explicitly rejected request: HTTP ${status}`); this.name = "ReviewRejectedError";
  }
}
export function reviewHttpError(status: number): Error {
  return status >= 500 ? new ReviewUncertainError("Reviewer server error; remote completion/billing unknown") : new ReviewRejectedError(status);
}
export function isRetryableError(err: unknown): boolean {
  // Only an observed rate-limit rejection is automatically retried, after the
  // preceding request settles. Timeouts/network/parse failures are ambiguous.
  return err instanceof ReviewRejectedError && err.status === 429;
}
export async function withTimeout<T>(task: (signal: AbortSignal) => Promise<T>, timeoutMs: number): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error("Invalid review timeout");
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        // Reject the deadline first: abort listeners may reject the task too.
        reject(new ReviewTimeoutError(timeoutMs)); controller.abort();
      }, timeoutMs);
    });
    return await Promise.race([Promise.resolve().then(() => task(controller.signal)), deadline]);
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
