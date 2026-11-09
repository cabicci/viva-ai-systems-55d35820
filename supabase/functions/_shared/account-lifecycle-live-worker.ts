import { finalizeLiveAccount, purgeLiveFinancialAccount, type LiveLifecycleDependencies } from "./account-lifecycle-live.ts";
import type { LifecycleDatabase } from "./account-lifecycle-worker.ts";
import { assertKeyMatchesEnvironment } from "./stripe-environment.ts";

export function lifecycleMode(value: string | undefined): "test" | "live" {
  if (value === undefined || value === "") return "test";
  const mode = value.trim().toLowerCase();
  if (mode !== "test" && mode !== "live") throw new Error("LC09_BILLING_MODE_INVALID");
  return mode;
}

/** Explicit Live composition; no new-checkout switch, customer creation or refund transport. */
export function createLiveAccountLifecycleWorker(
  db: LifecycleDatabase,
  key: string,
  transport?: LiveLifecycleDependencies["stripe"],
) {
  assertKeyMatchesEnvironment(key, "live");
  const rpc: LiveLifecycleDependencies["rpc"] = async <T>(name: string, args: Record<string, unknown>) => {
    const { data, error } = await db.rpc(name, args);
    if (error) throw new Error("LC09_DATABASE_STEP_FAILED");
    return data as T;
  };
  const stripe: LiveLifecycleDependencies["stripe"] = transport ?? (async (path, options = {}) => {
    if (!/^\/(customers|checkout\/sessions|subscription_schedules|subscriptions|invoices|payment_intents|charges|refunds)(\/|\?|$)/.test(path)
      || path.includes("#") || path.includes("\\")) throw new Error("LC09_PROVIDER_PATH_INVALID");
    const method = options.method ?? "GET";
    // Refund endpoints are read-only; this worker never decides to refund or waive debt.
    if (path.startsWith("/refunds") && method !== "GET") throw new Error("LC09_REFUND_MUTATION_FORBIDDEN");
    const response = await fetch(`https://api.stripe.com/v1${path}`, {
      method, signal: AbortSignal.timeout(10_000),
      headers: { Authorization: `Bearer ${key}`, "Stripe-Version": "2026-08-26.dahlia",
        ...(options.idempotency ? { "Idempotency-Key": options.idempotency } : {}),
        ...(method !== "GET" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
      body: method === "GET" ? undefined : options.params?.toString(),
    });
    if (!response.ok) throw new Error("LC09_PROVIDER_STEP_FAILED");
    return response.json();
  });
  const deps: LiveLifecycleDependencies = {
    rpc, stripe,
    removeStorage: async (objects, financial, beforeEach) => {
      for (const object of objects) {
        if (!object || typeof object.bucket !== "string" || !object.bucket || typeof object.name !== "string" || !object.name
          || (financial && (object.bucket !== "commerce-receipts" || !/^[a-f0-9-]{36}\/[a-f0-9-]{36}$/.test(object.name)))) throw new Error("LC09_STORAGE_MANIFEST_INVALID");
      }
      for (const object of objects) {
        if (!beforeEach) throw new Error("LC09_STORAGE_LEASE_REQUIRED");
        await beforeEach();
        const result = await db.storage.from(object.bucket).remove([object.name]);
        if (result.error) throw new Error("LC09_STORAGE_REMOVAL_FAILED");
      }
    },
    identityExists: async (user) => {
      const result = await db.auth.admin.getUserById(user);
      if (result.error && result.error.status !== 404) throw new Error("LC09_AUTH_LOOKUP_FAILED");
      return !!result.data?.user;
    },
    deleteIdentity: async (user) => {
      if ((await db.auth.admin.deleteUser(user, false)).error) throw new Error("LC09_AUTH_REMOVAL_FAILED");
    },
  };
  const finalize = (user: string) => finalizeLiveAccount(user, deps);
  const purge = (user: string) => purgeLiveFinancialAccount(user, deps);
  const runBatch = async ({ deletionEnabled, financialEnabled }: { deletionEnabled: boolean; financialEnabled: boolean }) => {
    let completed = 0, deferred = 0;
    for (const [enabled, candidate, run] of [
      [deletionEnabled, "lc09_deletion_candidates", finalize],
      [financialEnabled, "lc09_financial_purge_candidates", purge],
    ] as const) {
      if (!enabled) continue;
      const users = await rpc<unknown>(candidate, { p_limit: 2 });
      if (!Array.isArray(users) || users.length > 2 || users.some(u => typeof u !== "string")) throw new Error("LC09_CANDIDATES_INVALID");
      for (const user of users) { try { await run(user); completed++; } catch { deferred++; } }
    }
    return { completed, deferred };
  };
  return { finalize, purge, runBatch };
}
