export type DeletionClaim = {
  stage: "blocked" | "provider_reconciled" | "learner_erased" | "complete";
  user_id?: string;
  lease_token?: string;
  checkout_in_flight?: boolean;
  customers?: { id: string; gateway: string; mode: string | null }[];
  storage_objects?: { bucket: string; name: string }[];
  checkout_attempts?: { id: string; key: string; parameters: string }[];
};

export type DeletionDependencies = {
  claim(userId: string): Promise<DeletionClaim>;
  advance(userId: string, lease: string, stage: string): Promise<unknown>;
  reconcileCustomer(customer: string, userId: string): Promise<void>;
  recoverCheckout(
    attempt: { id: string; key: string; parameters: string },
    userId: string,
  ): Promise<void>;
  removeStorage(objects: { bucket: string; name: string }[]): Promise<void>;
  deleteIdentity(userId: string): Promise<void>;
  identityExists(userId: string): Promise<boolean>;
};

export async function authorizedDeletionJob(request: Request, secret?: string): Promise<boolean> {
  if (!secret || secret.length < 32) return false;
  const provided = request.headers.get("Authorization")?.replace(/^Bearer /, "") ?? "";
  const hash = async (s: string) =>
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  const [actual, expected] = await Promise.all([hash(provided), hash(secret)]);
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= actual[i] ^ expected[i];
  return difference === 0;
}

export type FinancialPurgeClaim = {
  stage: "financial_due" | "financial_purged";
  user_id?: string;
  lease_token?: string;
  customers?: { id: string; gateway: string; mode: string | null }[];
};
export type FinancialPurgeDependencies = {
  claim(userId: string): Promise<FinancialPurgeClaim>;
  complete(userId: string, lease: string, release?: boolean): Promise<unknown>;
  eraseCustomer(customer: string, userId: string): Promise<void>;
};
export async function purgeFinancialAccount(userId: string, deps: FinancialPurgeDependencies) {
  const claim = await deps.claim(userId);
  if (claim.stage === "financial_purged") return { stage: "financial_purged" };
  if (claim.stage !== "financial_due" || claim.user_id !== userId || !claim.lease_token)
    throw new Error("LC09_INVALID_FINANCIAL_CLAIM");
  const lease = claim.lease_token;
  try {
    for (const customer of claim.customers ?? []) {
      if (customer.gateway !== "stripe_us" || !["test", null].includes(customer.mode))
        throw new Error("LC09_PROVIDER_REVIEW_REQUIRED");
      await deps.eraseCustomer(customer.id, userId);
    }
    await deps.complete(userId, lease);
    return { stage: "financial_purged" };
  } finally {
    await deps.complete(userId, lease, true).catch(() => undefined);
  }
}

// Each database checkpoint is durable. Auth removal may succeed before a crash:
// the next attempt verifies absence and completes instead of resurrecting data.
export async function finalizeAccount(userId: string, deps: DeletionDependencies) {
  const claim = await deps.claim(userId);
  if (claim.stage === "complete") return { stage: "complete" };
  if (claim.user_id !== userId || !claim.lease_token) throw new Error("LC09_INVALID_CLAIM");
  const lease = claim.lease_token;
  try {
    if (claim.stage === "blocked") {
      if (claim.checkout_in_flight) throw new Error("LC09_CHECKOUT_IN_FLIGHT");
      for (const customer of claim.customers ?? []) {
        if (customer.gateway !== "stripe_us" || !["test", null].includes(customer.mode))
          throw new Error("LC09_PROVIDER_REVIEW_REQUIRED");
        await deps.reconcileCustomer(customer.id, userId);
      }
      for (const attempt of claim.checkout_attempts ?? []) {
        const customer = new URLSearchParams(attempt.parameters).get("customer");
        if (!claim.customers?.some((c) => c.id === customer))
          throw new Error("LC09_CHECKOUT_CUSTOMER_UNKNOWN");
        await deps.recoverCheckout(attempt, userId);
      }
      if (claim.checkout_attempts?.length)
        for (const customer of claim.customers ?? [])
          await deps.reconcileCustomer(customer.id, userId);
      await deps.advance(userId, lease, "provider_reconciled");
    }
    if (claim.stage !== "learner_erased") {
      await deps.removeStorage(claim.storage_objects ?? []);
      await deps.advance(userId, lease, "learner_erased");
    } else {
      // Storage left by an interrupted API operation is rechecked on retries.
      await deps.removeStorage(claim.storage_objects ?? []);
    }
    if (await deps.identityExists(userId)) await deps.deleteIdentity(userId);
    if (await deps.identityExists(userId)) throw new Error("LC09_AUTH_REMOVAL_UNVERIFIED");
    await deps.advance(userId, lease, "complete");
    return { stage: "complete" };
  } finally {
    // Release has no effect on the tombstone; failures never restore access.
    await deps.advance(userId, lease, "release").catch(() => undefined);
  }
}

type StripeObject = { id: string; [key: string]: unknown };
export type StripeTransport = (
  path: string,
  options?: { method?: "GET" | "POST" | "DELETE"; params?: URLSearchParams; idempotency?: string },
) => Promise<StripeObject | { data: StripeObject[]; has_more: boolean }>;

// Stripe deletes the Customer/payment details; its historical transaction
// records have separate provider retention. This is never a claim to erase
// every Stripe object. Retry the same owned customer after a lost response.
export async function eraseStripeCustomer(
  transport: StripeTransport,
  customerId: string,
  userId: string,
) {
  if (!/^cus_[A-Za-z0-9_]+$/.test(customerId)) throw new Error("LC09_INVALID_CUSTOMER");
  const path = `/customers/${encodeURIComponent(customerId)}`;
  const customer = (await transport(path)) as StripeObject;
  if (customer.id !== customerId) throw new Error("LC09_PROVIDER_OWNERSHIP_MISMATCH");
  if (customer.deleted === true) return;
  const metadata = customer.metadata as Record<string, string> | undefined;
  if (
    customer.livemode !== false ||
    metadata?.environment !== "test" ||
    metadata?.user_id !== userId
  )
    throw new Error("LC09_PROVIDER_OWNERSHIP_MISMATCH");
  const removed = (await transport(path, { method: "DELETE" })) as StripeObject;
  if (removed.id !== customerId || removed.deleted !== true)
    throw new Error("LC09_CUSTOMER_REMOVAL_UNVERIFIED");
  const verified = (await transport(path)) as StripeObject;
  if (verified.id !== customerId || verified.deleted !== true)
    throw new Error("LC09_CUSTOMER_REMOVAL_UNVERIFIED");
}

export async function recoverStripeCheckout(
  transport: StripeTransport,
  attempt: { key: string; parameters: string },
) {
  const session = (await transport("/checkout/sessions", {
    method: "POST",
    params: new URLSearchParams(attempt.parameters),
    idempotency: attempt.key,
  })) as StripeObject;
  if (session.livemode !== false) throw new Error("LC09_TEST_ONLY");
  if (session.status === "open") {
    const expired = (await transport(
      `/checkout/sessions/${encodeURIComponent(session.id)}/expire`,
      { method: "POST" },
    )) as StripeObject;
    if (expired.status !== "expired") throw new Error("LC09_CHECKOUT_NOT_EXPIRED");
  } else if (!["complete", "expired"].includes(String(session.status)))
    throw new Error("LC09_CHECKOUT_STATE_UNKNOWN");
  return session.id;
}

async function listAll(transport: StripeTransport, path: string, customer: string) {
  const records: StripeObject[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 100; page++) {
    const query = new URLSearchParams({ customer, limit: "100" });
    if (path === "/subscriptions") query.set("status", "all");
    if (cursor) query.set("starting_after", cursor);
    const list = (await transport(`${path}?${query}`)) as {
      data: StripeObject[];
      has_more: boolean;
    };
    if (!Array.isArray(list.data) || typeof list.has_more !== "boolean")
      throw new Error("LC09_PROVIDER_LIST_INVALID");
    records.push(...list.data);
    if (!list.has_more) return records;
    const next = list.data.at(-1)?.id;
    if (!next || next === cursor) throw new Error("LC09_PROVIDER_PAGINATION_INVALID");
    cursor = next;
  }
  throw new Error("LC09_PROVIDER_LIST_LIMIT");
}

// TEST only. Cancellation creates neither a prorated invoice nor an automatic
// refund. Refund/dispute decisions remain explicit and block finalization.
export async function reconcileStripeCustomer(
  transport: StripeTransport,
  customerId: string,
  userId: string,
) {
  const customer = (await transport(
    `/customers/${encodeURIComponent(customerId)}`,
  )) as StripeObject;
  const metadata = customer.metadata as Record<string, string> | undefined;
  if (
    customer.id !== customerId ||
    customer.livemode !== false ||
    metadata?.environment !== "test" ||
    metadata?.user_id !== userId
  )
    throw new Error("LC09_PROVIDER_OWNERSHIP_MISMATCH");

  const sessions = await listAll(transport, "/checkout/sessions", customerId);
  for (const session of sessions) {
    if (session.livemode !== false) throw new Error("LC09_TEST_ONLY");
    if (session.status === "open") {
      const expired = (await transport(
        `/checkout/sessions/${encodeURIComponent(session.id)}/expire`,
        { method: "POST" },
      )) as StripeObject;
      if (expired.status !== "expired") throw new Error("LC09_CHECKOUT_NOT_EXPIRED");
    }
  }
  const schedules = await listAll(transport, "/subscription_schedules", customerId);
  for (const schedule of schedules) {
    if (schedule.livemode !== false) throw new Error("LC09_TEST_ONLY");
    if (["active", "not_started"].includes(String(schedule.status))) {
      const canceled = (await transport(
        `/subscription_schedules/${encodeURIComponent(schedule.id)}/cancel`,
        {
          method: "POST",
          params: new URLSearchParams({ invoice_now: "false", prorate: "false" }),
        },
      )) as StripeObject;
      if (canceled.status !== "canceled") throw new Error("LC09_SCHEDULE_NOT_CANCELLED");
    }
  }
  if (
    (await listAll(transport, "/subscription_schedules", customerId)).some((s) =>
      ["active", "not_started"].includes(String(s.status)),
    )
  )
    throw new Error("LC09_SCHEDULE_STILL_ACTIVE");
  const subscriptions = await listAll(transport, "/subscriptions", customerId);
  for (const subscription of subscriptions) {
    if (subscription.livemode !== false) throw new Error("LC09_TEST_ONLY");
    if (!["canceled", "incomplete_expired"].includes(String(subscription.status))) {
      const cancelled = (await transport(`/subscriptions/${encodeURIComponent(subscription.id)}`, {
        method: "DELETE",
        params: new URLSearchParams({ invoice_now: "false", prorate: "false" }),
      })) as StripeObject;
      if (cancelled.status !== "canceled") throw new Error("LC09_RENEWAL_NOT_CANCELLED");
    }
  }
  // Re-read after external changes. Never trust only the cancellation response.
  if (
    (await listAll(transport, "/subscriptions", customerId)).some(
      (s) => !["canceled", "incomplete_expired"].includes(String(s.status)),
    )
  )
    throw new Error("LC09_RENEWAL_STILL_ACTIVE");
  const invoices = await listAll(transport, "/invoices", customerId);
  const intents = await listAll(transport, "/payment_intents", customerId);
  const charges = await listAll(transport, "/charges", customerId);
  if (
    invoices.some((i) => ["draft", "open"].includes(String(i.status))) ||
    intents.some((i) => !["succeeded", "canceled"].includes(String(i.status))) ||
    charges.some((c) => c.disputed === true)
  )
    throw new Error("LC09_FINANCIAL_RECONCILIATION_PENDING");
  for (const charge of charges) {
    const refunds = (await transport(
      `/refunds?${new URLSearchParams({ charge: charge.id, limit: "100" })}`,
    )) as {
      data: StripeObject[];
      has_more: boolean;
    };
    if (
      !Array.isArray(refunds.data) ||
      refunds.has_more ||
      refunds.data.some((r) => !["succeeded", "failed", "canceled"].includes(String(r.status)))
    )
      throw new Error("LC09_REFUND_REVIEW_REQUIRED");
  }
}
