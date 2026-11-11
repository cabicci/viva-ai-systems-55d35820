import { assertKeyMatchesEnvironment } from "./stripe-environment.ts";

type Json = Record<string, unknown>;
export const CAMPAIGN_STRIPE_MARKER = "masaarat_campaign_renewal";
const API_VERSION = "2026-07-29.dahlia";
const SCHEDULE_ID = /^sub_sched_[A-Za-z0-9]+$/;
const AWARD_ID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;

type RenewalProof = {
  id: string;
  userId: string;
  scope: "core" | "academic" | "technical" | "kids";
  subscriptionId: string;
  customerId: string;
  internalId: string | null;
  priceId: string;
  scheduleId: string;
  paidEnd: number;
  giftEnd: number;
};

type RenewalJob = Omit<RenewalProof, "scheduleId" | "priceId"> & {
  lease: string;
  invoiceId: string;
  state: "pending" | "scheduled";
  scheduleId: string | null;
  priceId: string | null;
  paidStart: number | null;
  createStarted: number | null;
};

type Rpc = <T>(name: string, args: Json) => Promise<T>;
type StripeRead = (path: string) => Promise<Json>;
type Stripe = (path: string, params?: URLSearchParams, idempotencyKey?: string) => Promise<Json>;

export function campaignStripeTransport(key: string): Stripe {
  assertKeyMatchesEnvironment(key, "live");
  return async (path, params, idempotencyKey) => {
    const response = await fetch("https://api.stripe.com/v1" + path, {
      method: params ? "POST" : "GET",
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${key}`,
        "Stripe-Version": API_VERSION,
        ...(params ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body: params?.toString(),
    });
    if (!response.ok) throw new Error("CAMPAIGN_STRIPE_PROVIDER_UNAVAILABLE");
    return response.json();
  };
}

function record(value: unknown): Json {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Json) : {};
}

function rows(value: unknown): Json[] {
  return Array.isArray(value) ? value.map(record) : [];
}

function id(value: unknown): string | null {
  const result = typeof value === "string" ? value : record(value).id;
  return typeof result === "string" ? result : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function stripePath(collection: string, value: string) {
  return `/${collection}/${encodeURIComponent(value)}`;
}

function subscriptionItem(subscription: Json) {
  const items = record(subscription.items);
  const data = rows(items.data);
  return data.length === 1 && items.has_more !== true ? data[0] : null;
}

export function campaignStripeMarker(subscription: Json): string | null {
  const marker = record(subscription.metadata)[CAMPAIGN_STRIPE_MARKER];
  return typeof marker === "string" && AWARD_ID.test(marker) ? marker : null;
}

function subscriptionMatches(
  subscription: Json,
  proof: Pick<RenewalProof, "subscriptionId" | "customerId" | "scope" | "userId" | "internalId">,
) {
  const metadata = record(subscription.metadata);
  return (
    subscription.object === "subscription" &&
    subscription.id === proof.subscriptionId &&
    subscription.livemode === true &&
    id(subscription.customer) === proof.customerId &&
    metadata.app === "masaarat" &&
    metadata.environment === "live" &&
    metadata.user_id === proof.userId &&
    (proof.scope === "core"
      ? (metadata.product_scope == null || metadata.product_scope === "core") &&
        metadata.internal_subscription_id === proof.internalId
      : metadata.product_scope === proof.scope)
  );
}

function scheduleMatches(schedule: Json, proof: RenewalProof) {
  return (
    schedule.object === "subscription_schedule" &&
    schedule.id === proof.scheduleId &&
    schedule.livemode === true &&
    schedule.status === "active" &&
    id(schedule.subscription) === proof.subscriptionId &&
    id(schedule.customer) === proof.customerId
  );
}

function phaseMatches(phase: Json, priceId: string) {
  const items = rows(phase.items);
  return items.length === 1 && id(items[0].price) === priceId && items[0].quantity === 1;
}

function giftPhaseMatches(phase: Json, proof: RenewalProof) {
  return (
    phase.start_date === proof.paidEnd &&
    phase.end_date === proof.giftEnd &&
    phase.trial_end === proof.giftEnd &&
    record(phase.metadata)[CAMPAIGN_STRIPE_MARKER] === proof.id &&
    phaseMatches(phase, proof.priceId)
  );
}

function scheduledGiftMatches(schedule: Json, proof: RenewalProof, paidStart: number) {
  const phases = rows(schedule.phases);
  if (
    !scheduleMatches(schedule, proof) ||
    schedule.end_behavior !== "release" ||
    record(schedule.metadata)[CAMPAIGN_STRIPE_MARKER] !== proof.id ||
    phases.length !== 3
  )
    return false;
  const [paid, gift, next] = phases;
  return (
    paid.start_date === paidStart &&
    paid.end_date === proof.paidEnd &&
    phaseMatches(paid, proof.priceId) &&
    giftPhaseMatches(gift, proof) &&
    next.start_date === proof.giftEnd &&
    next.trial_end == null &&
    next.billing_cycle_anchor === "phase_start" &&
    phaseMatches(next, proof.priceId)
  );
}

function invoiceMatches(invoice: Json, proof: Pick<RenewalProof, "subscriptionId" | "customerId">) {
  const linked =
    id(invoice.subscription) ??
    id(record(record(invoice.parent).subscription_details).subscription);
  return (
    invoice.object === "invoice" &&
    invoice.livemode === true &&
    invoice.status === "paid" &&
    id(invoice.customer) === proof.customerId &&
    linked === proof.subscriptionId &&
    invoice.amount_remaining === 0 &&
    record(invoice.lines).has_more === false
  );
}

function invoiceLineMatches(line: Json, proof: Pick<RenewalProof, "subscriptionId" | "priceId">) {
  const details = record(record(line.parent).subscription_item_details);
  const price = id(record(record(line.pricing).price_details).price) ?? id(line.price);
  return (
    (id(details.subscription) ?? id(line.subscription)) === proof.subscriptionId &&
    price === proof.priceId &&
    details.proration !== true &&
    line.proration !== true
  );
}

function knownGiftInvoice(invoice: Json, proof: RenewalProof) {
  const lines = rows(record(invoice.lines).data);
  const line = lines[0];
  return (
    invoiceMatches(invoice, proof) &&
    invoice.amount_paid === 0 &&
    invoice.total === 0 &&
    ["subscription_cycle", "subscription_update"].includes(String(invoice.billing_reason)) &&
    lines.length === 1 &&
    line.amount === 0 &&
    invoiceLineMatches(line, proof) &&
    record(line.period).start === proof.paidEnd &&
    record(line.period).end === proof.giftEnd
  );
}

async function activateIfCurrent(
  subscription: Json,
  proof: RenewalProof,
  stripe: StripeRead,
  rpc: Rpc,
) {
  if (
    !subscriptionMatches(subscription, proof) ||
    subscription.status !== "trialing" ||
    (subscription.cancel_at != null && subscription.cancel_at !== proof.giftEnd) ||
    subscription.pause_collection != null ||
    subscription.trial_start !== proof.paidEnd ||
    subscription.trial_end !== proof.giftEnd ||
    campaignStripeMarker(subscription) !== proof.id ||
    id(subscription.schedule) !== proof.scheduleId ||
    id(subscriptionItem(subscription)?.price) !== proof.priceId
  )
    return false;
  const schedule = await stripe(stripePath("subscription_schedules", proof.scheduleId));
  if (
    !scheduleMatches(schedule, proof) ||
    record(schedule.metadata)[CAMPAIGN_STRIPE_MARKER] !== proof.id ||
    record(schedule.current_phase).start_date !== proof.paidEnd ||
    record(schedule.current_phase).end_date !== proof.giftEnd ||
    ((subscription.cancel_at_period_end === true || subscription.cancel_at != null) &&
      (schedule.end_behavior !== "cancel" ||
        rows(schedule.phases).at(-1)?.end_date !== proof.giftEnd)) ||
    !rows(schedule.phases).some((phase) => giftPhaseMatches(phase, proof))
  )
    return false;
  return (
    (await rpc<boolean>("activate_campaign_stripe_renewal", {
      p_id: proof.id,
      p_schedule: proof.scheduleId,
    })) === true
  );
}

/** Called only after the Live handler validates the event signature and ownership. */
export async function observeCampaignStripeWebhook(
  eventType: string,
  object: Json,
  subscription: Json,
  stripe: StripeRead,
  rpc: Rpc,
): Promise<boolean> {
  const zeroInvoice = eventType === "invoice.paid" && object.amount_paid === 0;
  if (!zeroInvoice && eventType !== "customer.subscription.updated") return false;
  if (!zeroInvoice && subscription.status !== "trialing") return false;
  const invoiceMarker = record(record(record(object.parent).subscription_details).metadata)[
    CAMPAIGN_STRIPE_MARKER
  ];
  const marker =
    campaignStripeMarker(subscription) ??
    (typeof invoiceMarker === "string" && AWARD_ID.test(invoiceMarker) ? invoiceMarker : null);
  const subscriptionId = id(subscription);
  if (!marker || !subscriptionId) return false;
  const proof = await rpc<RenewalProof | null>("get_campaign_stripe_renewal", {
    p_id: marker,
    p_subscription: subscriptionId,
  });
  if (!proof || !subscriptionMatches(subscription, proof)) return false;
  if (zeroInvoice) {
    const invoiceId = id(object);
    if (!invoiceId) return false;
    const invoice = await stripe(stripePath("invoices", invoiceId));
    if (invoice.id !== invoiceId || !knownGiftInvoice(invoice, proof)) return false;
    await activateIfCurrent(subscription, proof, stripe, rpc);
    return true;
  }
  // Read back the current subscription before extending access based on a
  // potentially delayed or out-of-order snapshot.
  const current = await stripe(stripePath("subscriptions", subscriptionId));
  await activateIfCurrent(current, proof, stripe, rpc);
  return false;
}

class RenewalBlocked extends Error {}

function block(code: string): never {
  throw new RenewalBlocked("CAMPAIGN_STRIPE_" + code);
}

function existingIds(value: unknown) {
  return Array.isArray(value)
    ? value.map((entry) => {
        const result = id(entry);
        if (!result) block("UNSUPPORTED_TERMS");
        return result;
      })
    : [];
}

function discountIds(value: unknown) {
  return Array.isArray(value)
    ? value.map((entry) => {
        const discount = id(record(entry).discount) ?? id(entry);
        if (!discount?.startsWith("di_")) block("UNSUPPORTED_TERMS");
        return discount;
      })
    : [];
}

function putFields(params: URLSearchParams, prefix: string, values: Json) {
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "string" || typeof value === "boolean" || typeof value === "number")
      params.set(`${prefix}[${key}]`, String(value));
  }
}

function phaseTerms(phase: Json) {
  const [item] = rows(phase.items);
  const invoiceSettings = record(phase.invoice_settings);
  const tax = record(phase.automatic_tax);
  if (
    rows(phase.add_invoice_items).length ||
    phase.billing_thresholds ||
    item.billing_thresholds ||
    phase.transfer_data ||
    phase.application_fee_percent != null ||
    phase.on_behalf_of ||
    (record(invoiceSettings.issuer).type && record(invoiceSettings.issuer).type !== "self") ||
    (record(tax.liability).type && record(tax.liability).type !== "self") ||
    (phase.collection_method && phase.collection_method !== "charge_automatically")
  )
    block("UNSUPPORTED_TERMS");
  return { item, invoiceSettings, tax };
}

function putPhase(
  params: URLSearchParams,
  index: number,
  phase: Json,
  proof: RenewalProof,
  changes: Json = {},
) {
  const { item, invoiceSettings, tax } = phaseTerms(phase);
  const prefix = `phases[${index}]`;
  putFields(params, prefix, {
    start_date: phase.start_date,
    end_date: phase.end_date,
    trial_end: phase.trial_end,
    billing_cycle_anchor: phase.billing_cycle_anchor,
    collection_method: phase.collection_method,
    currency: phase.currency,
    description: phase.description,
    default_payment_method: id(phase.default_payment_method),
    proration_behavior: phase.proration_behavior,
    ...changes,
  });
  putFields(params, `${prefix}[items][0]`, { price: proof.priceId, quantity: 1 });
  putFields(params, `${prefix}[items][0][metadata]`, record(item.metadata));
  putFields(params, `${prefix}[metadata]`, {
    ...record(phase.metadata),
    [CAMPAIGN_STRIPE_MARKER]: proof.id,
  });
  if (typeof tax.enabled === "boolean")
    putFields(params, `${prefix}[automatic_tax]`, { enabled: tax.enabled });
  if (invoiceSettings.days_until_due != null)
    putFields(params, `${prefix}[invoice_settings]`, {
      days_until_due: invoiceSettings.days_until_due,
    });
  if (record(invoiceSettings.issuer).type === "self")
    params.set(`${prefix}[invoice_settings][issuer][type]`, "self");
  const fields = [
    [`${prefix}[default_tax_rates]`, phase.default_tax_rates],
    [`${prefix}[items][0][tax_rates]`, item.tax_rates],
    [`${prefix}[invoice_settings][account_tax_ids]`, invoiceSettings.account_tax_ids],
  ] as const;
  for (const [path, value] of fields)
    existingIds(value).forEach((value, i) => params.set(`${path}[${i}]`, value));
  // Reuse the exact discount objects. Never issue a fresh coupon redemption.
  discountIds(phase.discounts).forEach((value, i) =>
    params.set(`${prefix}[discounts][${i}][discount]`, value),
  );
  discountIds(item.discounts).forEach((value, i) =>
    params.set(`${prefix}[items][0][discounts][${i}][discount]`, value),
  );
}

function scheduleUpdate(
  phase: Json,
  proof: RenewalProof,
  paidStart: number,
  interval: "month" | "year",
) {
  const params = new URLSearchParams({
    end_behavior: "release",
    proration_behavior: "none",
    [`metadata[${CAMPAIGN_STRIPE_MARKER}]`]: proof.id,
  });
  putPhase(params, 0, phase, proof, {
    start_date: paidStart,
    end_date: proof.paidEnd,
    trial_end: null,
  });
  putPhase(params, 1, phase, proof, {
    start_date: proof.paidEnd,
    end_date: proof.giftEnd,
    trial_end: proof.giftEnd,
    billing_cycle_anchor: "automatic",
    proration_behavior: "none",
  });
  putPhase(params, 2, phase, proof, {
    start_date: proof.giftEnd,
    end_date: null,
    trial_end: null,
    billing_cycle_anchor: "phase_start",
    proration_behavior: "none",
  });
  putFields(params, "phases[2][duration]", { interval, interval_count: 1 });
  return params;
}

export async function campaignStripeCancellation(
  userId: string,
  sourceKey: string,
  cancel: boolean,
  stripe: Stripe,
  rpc: Rpc,
  now = Date.now() / 1000,
) {
  const proof = await rpc<RenewalProof | null>("get_campaign_stripe_cancellation", {
    p_user: userId,
    p_source: sourceKey,
  });
  if (!proof) return { available: false, canceled: false };
  if (proof.userId !== userId) throw new Error("CAMPAIGN_STRIPE_CANCELLATION_UNVERIFIED");
  const subscription = await stripe(stripePath("subscriptions", proof.subscriptionId));
  if (!subscriptionMatches(subscription, proof) || id(subscription.schedule) !== proof.scheduleId)
    return { available: false, canceled: false };
  const path = stripePath("subscription_schedules", proof.scheduleId);
  const schedule = await stripe(path);
  if (
    !scheduleMatches(schedule, proof) ||
    record(schedule.metadata)[CAMPAIGN_STRIPE_MARKER] !== proof.id
  )
    return { available: false, canceled: false };
  if (schedule.end_behavior === "cancel") return { available: true, canceled: true };
  if (
    schedule.end_behavior !== "release" ||
    !["active", "trialing"].includes(String(subscription.status))
  )
    return { available: false, canceled: false };
  const phases = rows(schedule.phases);
  const currentBounds = record(schedule.current_phase);
  const current = phases.find(
    (phase) =>
      phase.start_date === currentBounds.start_date && phase.end_date === currentBounds.end_date,
  );
  if (
    !current ||
    typeof current.end_date !== "number" ||
    current.end_date <= now ||
    !phaseMatches(current, proof.priceId)
  )
    return { available: false, canceled: false };
  // Before the gift, keep the paid phase and the gift, removing the paid
  // renewal. Inside/after the gift, cancel at the end of the current phase.
  const gift = phases.find((phase) => giftPhaseMatches(phase, proof));
  if (current.end_date === proof.paidEnd && !gift)
    throw new Error("CAMPAIGN_STRIPE_CANCELLATION_UNVERIFIED");
  const keep = current.end_date === proof.paidEnd && gift ? [current, gift] : [current];
  if (!cancel) return { available: true, canceled: false };
  const params = new URLSearchParams({ end_behavior: "cancel", proration_behavior: "none" });
  keep.forEach((phase, index) =>
    putPhase(params, index, phase, proof, { proration_behavior: "none" }),
  );
  const updated = await stripe(
    path,
    params,
    `masaarat-campaign-cancel-${proof.id}-${current.end_date}`,
  );
  if (
    !scheduleMatches(updated, proof) ||
    updated.end_behavior !== "cancel" ||
    rows(updated.phases).at(-1)?.end_date !== keep.at(-1)?.end_date
  )
    throw new Error("CAMPAIGN_STRIPE_CANCELLATION_UNVERIFIED");
  return { available: true, canceled: true };
}

function paidPeriod(
  subscription: Json,
  invoice: Json,
  job: RenewalJob,
): { start: number; priceId: string; interval: "month" | "year" } {
  const item = subscriptionItem(subscription);
  const price = record(item?.price);
  const recurring = record(price.recurring);
  const start = item?.current_period_start;
  const end = item?.current_period_end;
  const priceId = id(price);
  const interval = recurring.interval;
  if (
    !subscriptionMatches(subscription, job) ||
    subscription.status !== "active" ||
    subscription.collection_method !== "charge_automatically" ||
    subscription.cancel_at_period_end === true ||
    subscription.cancel_at != null ||
    subscription.pending_update ||
    subscription.pause_collection ||
    subscription.test_clock ||
    subscription.transfer_data ||
    subscription.application_fee_percent != null ||
    subscription.billing_thresholds ||
    subscription.on_behalf_of ||
    item?.billing_thresholds ||
    item?.quantity !== 1 ||
    !priceId ||
    recurring.interval_count !== 1 ||
    (interval !== "month" && interval !== "year") ||
    recurring.usage_type !== "licensed" ||
    typeof start !== "number" ||
    !Number.isSafeInteger(start) ||
    start >= job.paidEnd ||
    end !== job.paidEnd ||
    id(subscription.latest_invoice) !== job.invoiceId
  )
    block("SUBSCRIPTION_CHANGED");
  if (
    !invoiceMatches(invoice, job) ||
    invoice.id !== job.invoiceId ||
    typeof invoice.amount_paid !== "number" ||
    !Number.isSafeInteger(invoice.amount_paid) ||
    invoice.amount_paid <= 0 ||
    invoice.paid_out_of_band === true ||
    invoice.currency !== price.currency ||
    !rows(record(invoice.lines).data).some(
      (line) =>
        invoiceLineMatches(line, { ...job, priceId }) &&
        typeof line.amount === "number" &&
        line.amount > 0 &&
        record(line.period).start === start &&
        record(line.period).end === end,
    )
  )
    block("PAYMENT_UNVERIFIED");
  return { start, priceId, interval };
}

async function runRenewal(job: RenewalJob, stripe: Stripe, rpc: Rpc, now: number) {
  const step = async (stepName: string, args: Json = {}) =>
    (await rpc<boolean>("step_campaign_stripe_renewal", {
      p_id: job.id,
      p_lease: job.lease,
      p_step: stepName,
      ...args,
    })) === true;
  const subscription = await stripe(stripePath("subscriptions", job.subscriptionId));
  if (job.state === "scheduled") {
    if (!job.scheduleId || !job.priceId) block("SCHEDULE_UNVERIFIED");
    const applied = await activateIfCurrent(
      subscription,
      { ...job, scheduleId: job.scheduleId, priceId: job.priceId },
      stripe,
      rpc,
    );
    if (!applied) await step("retry", { p_code: "CAMPAIGN_STRIPE_TRIAL_NOT_CONFIRMED" });
    return applied ? "activated" : "deferred";
  }

  let scheduleId = job.scheduleId;
  const attached = id(subscription.schedule);
  if (scheduleId && attached !== scheduleId) block("SCHEDULE_CHANGED");
  // Recognize the persisted result of a timed-out update before revalidating
  // the paid period, which might have ended in the meantime.
  if (scheduleId && job.priceId && job.paidStart !== null) {
    const proof = { ...job, scheduleId, priceId: job.priceId };
    const schedule = await stripe(stripePath("subscription_schedules", scheduleId));
    if (scheduledGiftMatches(schedule, proof, job.paidStart)) {
      if (!(await step("scheduled", { p_schedule: scheduleId })))
        throw new Error("CAMPAIGN_STRIPE_LEASE_LOST");
      return "scheduled";
    }
    if (record(schedule.metadata)[CAMPAIGN_STRIPE_MARKER]) block("SCHEDULE_CHANGED");
  }
  if (attached && !scheduleId && job.createStarted === null) block("EXISTING_SCHEDULE");
  if (!scheduleId && job.createStarted !== null && now - job.createStarted >= 23 * 3600)
    block("CREATE_RESULT_UNCERTAIN");
  if (now >= job.paidEnd - 20) block("PAID_PERIOD_ENDED");

  const invoice = await stripe(stripePath("invoices", job.invoiceId));
  const { start, priceId, interval } = paidPeriod(subscription, invoice, job);
  if (!scheduleId) {
    if (!(await step("create"))) block("ELIGIBILITY_CHANGED");
    const created = await stripe(
      "/subscription_schedules",
      new URLSearchParams({ from_subscription: job.subscriptionId }),
      `masaarat-campaign-create-${job.id}`,
    );
    scheduleId = id(created);
    if (
      !scheduleId ||
      !SCHEDULE_ID.test(scheduleId) ||
      (attached && attached !== scheduleId) ||
      !scheduleMatches(created, { ...job, priceId, scheduleId })
    )
      block("SCHEDULE_UNVERIFIED");
    if (!(await step("bind", { p_schedule: scheduleId, p_price: priceId, p_start: start })))
      throw new Error("CAMPAIGN_STRIPE_LEASE_LOST");
  }
  const proof = { ...job, scheduleId, priceId };
  const schedule = await stripe(stripePath("subscription_schedules", scheduleId));
  const phases = rows(schedule.phases);
  const paid = phases[0];
  if (
    !scheduleMatches(schedule, proof) ||
    schedule.end_behavior !== "release" ||
    phases.length !== 1 ||
    Object.keys(record(schedule.metadata)).length > 0 ||
    paid.start_date !== start ||
    paid.end_date !== job.paidEnd ||
    (paid.trial_end != null && (typeof paid.trial_end !== "number" || paid.trial_end > start)) ||
    !phaseMatches(paid, priceId)
  )
    block("SCHEDULE_CHANGED");
  const params = scheduleUpdate(paid, proof, start, interval);
  if (!(await step("authorize"))) block("ELIGIBILITY_CHANGED");
  const updated = await stripe(
    stripePath("subscription_schedules", scheduleId),
    params,
    `masaarat-campaign-update-${job.id}`,
  );
  if (!scheduledGiftMatches(updated, proof, start))
    throw new Error("CAMPAIGN_STRIPE_UPDATE_UNVERIFIED");
  if (!(await step("scheduled", { p_schedule: scheduleId })))
    throw new Error("CAMPAIGN_STRIPE_LEASE_LOST");
  return "scheduled";
}

export async function runCampaignStripeRenewals(rpc: Rpc, stripe: Stripe, now = Date.now() / 1000) {
  const jobs = await rpc<RenewalJob[]>("claim_campaign_stripe_renewals", {});
  if (!Array.isArray(jobs)) throw new Error("CAMPAIGN_STRIPE_QUEUE_UNAVAILABLE");
  const counts = { scheduled: 0, activated: 0, blocked: 0, deferred: 0 };
  const results = await Promise.allSettled(
    jobs.map(async (job) => {
      try {
        const outcome = await runRenewal(job, stripe, rpc, now);
        counts[outcome]++;
      } catch (error) {
        const blocked = error instanceof RenewalBlocked;
        const code = blocked ? error.message : "CAMPAIGN_STRIPE_RETRY_REQUIRED";
        const stored = await rpc<boolean>("step_campaign_stripe_renewal", {
          p_id: job.id,
          p_lease: job.lease,
          p_step: blocked ? "blocked" : "retry",
          p_code: code,
        });
        if (stored !== true) throw new Error("CAMPAIGN_STRIPE_RETRY_UNRECORDED");
        counts[blocked ? "blocked" : "deferred"]++;
      }
    }),
  );
  if (results.some((result) => result.status === "rejected"))
    throw new Error("CAMPAIGN_STRIPE_RETRY_UNRECORDED");
  return counts;
}
