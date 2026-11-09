import {
  coordinateCheckout,
  type CheckoutIntentBase,
  type CheckoutSession,
} from "../../../../supabase/functions/_shared/stripe-checkout-intent";

export type ScopedIntent = CheckoutIntentBase & {
  idempotency_key: string;
  parameters: string;
  selection_parameters: string | null;
  session_expires_at: string | null;
  create_started_at: string | null;
  legacy: boolean;
};
type ProviderObject = {
  id: string;
  object: string;
  livemode: boolean;
  status: string | null;
  url: string | null;
  customer?: string | { id: string };
  client_reference_id?: string;
  metadata?: Record<string, string>;
  expires_at?: number;
  line_items?: { has_more: boolean; data: { price: string | { id: string }; quantity: number }[] };
  subscription?: string | { id: string };
  payment_status?: string;
  pending_update?: unknown;
  latest_invoice?: {
    id: string;
    object: string;
    livemode: boolean;
    status: string;
    amount_remaining: number;
    customer: string | { id: string };
    subscription?: string | { id: string };
    parent?: { subscription_details?: { subscription?: string | { id: string } } };
  };
};
export type ScopedDeps = {
  rpc<T>(name: string, body: Record<string, unknown>): Promise<T>;
  stripe<T>(
    path: string,
    options?: {
      method?: "GET" | "POST" | "DELETE";
      params?: URLSearchParams;
      idempotencyKey?: string;
    },
  ): Promise<T>;
};
function id(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id;
}
export function scopedSelection(parameters: URLSearchParams): string {
  const stable = new URLSearchParams(parameters);
  stable.delete("expires_at");
  stable.delete("metadata[checkout_generation]");
  stable.delete("subscription_data[metadata][checkout_generation]");
  stable.sort();
  return stable.toString();
}
function payableUrl(value: string | null): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "checkout.stripe.com" &&
      !url.port &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

/** No provider creation until the native ledger has sealed the entire request.
 * Unknown outcome always keeps its original row/key, even after key retention.
 */
export async function createScopedCheckout(input: {
  userId: string;
  scope: "kids" | "technical" | "academic";
  parameters: URLSearchParams;
  offer: boolean;
  deps: ScopedDeps;
  afterSession(session: CheckoutSession): Promise<void>;
}): Promise<CheckoutSession> {
  const { userId, scope, deps } = input;
  const selection = scopedSelection(input.parameters);
  let current: ScopedIntent | undefined;
  const evidence = new Map<string, ProviderObject>();
  const identity = (intent: ScopedIntent, session = intent.checkout_session_id) => ({
    p_user_id: userId,
    p_scope: scope,
    p_generation: intent.checkout_generation,
    p_key: intent.idempotency_key,
    p_session: session,
  });
  function stored(intent: ScopedIntent) {
    if (
      !intent ||
      typeof intent.parameters !== "string" ||
      !intent.idempotency_key ||
      !/^[0-9a-f-]{36}$/i.test(intent.checkout_generation)
    )
      throw new Error("CHECKOUT_IN_PROGRESS");
    const parameters = new URLSearchParams(intent.parameters);
    if (
      parameters.get("mode") !== "subscription" ||
      parameters.get("client_reference_id") !== userId ||
      parameters.get("metadata[user_id]") !== userId ||
      parameters.get("metadata[product_scope]") !== scope ||
      parameters.get("metadata[environment]") !== "live" ||
      parameters.get("metadata[app]") !== "masaarat" ||
      parameters.get("customer") !== input.parameters.get("customer") ||
      !parameters.get("line_items[0][price]")
    )
      throw new Error("CHECKOUT_IN_PROGRESS");
    if (intent.legacy) {
      if (!intent.idempotency_key.startsWith(`${scope}-live-checkout-${userId}-`))
        throw new Error("CHECKOUT_IN_PROGRESS");
    } else if (
      intent.idempotency_key !== `scoped-${scope}-live-${intent.checkout_generation}` ||
      intent.selection_parameters !== scopedSelection(parameters) ||
      parameters.get("metadata[checkout_generation]") !== intent.checkout_generation ||
      Number(parameters.get("expires_at")) * 1000 !== Date.parse(intent.session_expires_at ?? "")
    ) {
      throw new Error("CHECKOUT_IN_PROGRESS");
    }
    return parameters;
  }
  function verifySession(session: ProviderObject, intent: ScopedIntent, sessionId: string) {
    const parameters = stored(intent);
    if (
      session.id !== sessionId ||
      !/^cs_[A-Za-z0-9_]+$/.test(sessionId) ||
      session.object !== "checkout.session" ||
      session.livemode !== true ||
      id(session.customer) !== parameters.get("customer") ||
      session.client_reference_id !== userId ||
      session.metadata?.user_id !== userId ||
      session.metadata?.product_scope !== scope ||
      session.metadata?.environment !== "live" ||
      session.metadata?.app !== "masaarat" ||
      (!intent.legacy &&
        (session.metadata?.checkout_generation !== intent.checkout_generation ||
          session.expires_at !== Number(parameters.get("expires_at")))) ||
      !session.line_items ||
      session.line_items.has_more !== false ||
      session.line_items.data.length !== 1 ||
      id(session.line_items.data[0].price) !== parameters.get("line_items[0][price]") ||
      session.line_items.data[0].quantity !== 1
    )
      throw new Error("CHECKOUT_IN_PROGRESS");
    return session;
  }
  async function retrieve(intent: ScopedIntent, sessionId: string) {
    const session = await deps.stripe<ProviderObject>(
      `/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=line_items`,
    );
    verifySession(session, intent, sessionId);
    evidence.set(sessionId, session);
    return session;
  }
  async function expire(intent: ScopedIntent, sessionId: string) {
    const response = await deps.stripe<ProviderObject>(
      `/checkout/sessions/${encodeURIComponent(sessionId)}/expire`,
      {
        method: "POST",
        params: new URLSearchParams(),
        idempotencyKey: `expire-checkout-${sessionId}`,
      },
    );
    if (response.id !== sessionId || response.livemode !== true || response.status !== "expired") {
      throw new Error("CHECKOUT_IN_PROGRESS");
    }
    const actual = await retrieve(intent, sessionId);
    if (actual.status !== "expired") throw new Error("CHECKOUT_IN_PROGRESS");
    return actual;
  }
  async function close(
    intent: ScopedIntent,
    disposition: "expired" | "completed_terminal",
    subscription?: string,
  ) {
    const actual = evidence.get(intent.checkout_session_id ?? "");
    if (
      !actual ||
      (disposition === "expired" ? actual.status !== "expired" : actual.status !== "complete")
    ) {
      throw new Error("CHECKOUT_IN_PROGRESS");
    }
    if (
      !(await deps.rpc<boolean>("close_scoped_checkout_intent", {
        ...identity(intent),
        p_disposition: disposition,
        p_subscription: subscription ?? null,
      }))
    )
      throw new Error("CHECKOUT_INTENT_SUPERSEDED");
    return true;
  }
  async function completedTerminal(intent: ScopedIntent, session: ProviderObject) {
    const subscriptionId = id(session.subscription);
    if (
      !subscriptionId ||
      !/^sub_[A-Za-z0-9_]+$/.test(subscriptionId) ||
      !["paid", "no_payment_required"].includes(session.payment_status ?? "")
    )
      return false;
    const subscription = await deps.stripe<ProviderObject>(
      `/subscriptions/${encodeURIComponent(subscriptionId)}?expand[]=latest_invoice`,
    );
    const invoice = subscription.latest_invoice;
    const directSubscription = id(invoice?.subscription);
    const parentSubscription = id(invoice?.parent?.subscription_details?.subscription);
    if (
      subscription.id !== subscriptionId ||
      subscription.object !== "subscription" ||
      subscription.livemode !== true ||
      id(subscription.customer) !== id(session.customer) ||
      subscription.metadata?.user_id !== userId ||
      subscription.metadata?.environment !== "live" ||
      subscription.metadata?.product_scope !== scope ||
      !["canceled", "incomplete_expired"].includes(subscription.status ?? "") ||
      subscription.pending_update ||
      !invoice ||
      invoice.object !== "invoice" ||
      invoice.livemode !== true ||
      !["paid", "void"].includes(invoice.status) ||
      invoice.amount_remaining !== 0 ||
      id(invoice.customer) !== id(session.customer) ||
      (directSubscription ?? parentSubscription) !== subscriptionId ||
      (directSubscription !== undefined &&
        parentSubscription !== undefined &&
        directSubscription !== parentSubscription)
    )
      return false;
    await close(intent, "completed_terminal", subscriptionId);
    return true;
  }
  async function prepare(): Promise<ScopedIntent> {
    // Each pass reads every relevant row. No pagination/age/enum absence shortcut.
    for (let pass = 0; pass < 3; pass++) {
      const rows = await deps.rpc<ScopedIntent[]>("prepare_scoped_checkout_intent", {
        p_user_id: userId,
        p_scope: scope,
        p_parameters: selection,
        p_offer: input.offer,
      });
      if (!Array.isArray(rows) || !rows.length) throw new Error("CHECKOUT_IN_PROGRESS");
      const remaining: ScopedIntent[] = [];
      for (const row of rows) {
        const parameters = stored(row);
        row.selection_matches = scopedSelection(parameters) === selection;
        if (!row.checkout_session_id) {
          if (row.legacy) throw new Error("CHECKOUT_IN_PROGRESS");
          remaining.push(row);
          continue;
        }
        const session = await retrieve(row, row.checkout_session_id);
        if (session.status === "expired") {
          await close(row, "expired");
          continue;
        }
        if (session.status === "complete") {
          if (await completedTerminal(row, session)) continue;
          throw new Error("SUBSCRIPTION_ALREADY_MANAGED");
        }
        if (session.status !== "open") throw new Error("CHECKOUT_IN_PROGRESS");
        remaining.push(row);
      }
      if (!remaining.length) continue;
      if (remaining.length !== 1) throw new Error("CHECKOUT_IN_PROGRESS");
      current = remaining[0];
      return current;
    }
    throw new Error("CHECKOUT_IN_PROGRESS");
  }
  const session = await coordinateCheckout<ScopedIntent>({
    prepare,
    retrieve: (sessionId) => retrieve(current!, sessionId),
    expire: (sessionId) => expire(current!, sessionId),
    close: (intent) => close(intent, "expired"),
    confirm: (intent) => deps.rpc<boolean>("confirm_scoped_checkout_intent", identity(intent)),
    attach: (intent, sessionId) =>
      deps.rpc<boolean>("attach_scoped_checkout_intent", identity(intent, sessionId)),
    create: async (intent) => {
      const parameters = stored(intent);
      const started = Date.parse(intent.create_started_at ?? ""),
        expires = Date.parse(intent.session_expires_at ?? "");
      const now = Date.now();
      // Stay below the provider's key-retention boundary and preserve the
      // database-issued expiry. Failed validation and unknown outcomes never rekey.
      if (
        intent.legacy ||
        !Number.isFinite(started) ||
        !Number.isFinite(expires) ||
        now < started - 5000 ||
        now >= Math.min(started + 23 * 3600_000, expires) - 5000
      ) {
        throw new Error("CHECKOUT_IN_PROGRESS");
      }
      const created = await deps.stripe<ProviderObject>("/checkout/sessions", {
        method: "POST",
        params: parameters,
        idempotencyKey: intent.idempotency_key,
      });
      // Capture even a complete session before the generic coordinator's status
      // branch. LC09 deliberately persists known IDs even when deletion refuses.
      if (!/^cs_[A-Za-z0-9_]+$/.test(created.id)) throw new Error("CHECKOUT_IN_PROGRESS");
      const admitted = await deps.rpc<boolean>("lc09_record_kids_checkout", {
        p_user_id: userId,
        p_attempt: intent.checkout_generation,
        p_session: created.id,
        p_expired: false,
      });
      intent.checkout_session_id = created.id;
      const actual = await retrieve(intent, created.id);
      if (admitted !== true) {
        if (actual.status === "open") await expire(intent, actual.id);
        throw new Error("CHECKOUT_INTENT_SUPERSEDED");
      }
      return actual;
    },
  });
  await input.afterSession(session);
  if (!current) throw new Error("CHECKOUT_IN_PROGRESS");
  // Binding/expanded offer verification can race retirement. Re-read and CAS
  // after it, rather than returning the earlier session snapshot.
  const actual = await retrieve(current, session.id);
  if (actual.status !== "open" || !payableUrl(actual.url)) throw new Error("CHECKOUT_IN_PROGRESS");
  if (!(await deps.rpc<boolean>("confirm_scoped_checkout_intent", identity(current, actual.id)))) {
    throw new Error("CHECKOUT_INTENT_SUPERSEDED");
  }
  return actual;
}
