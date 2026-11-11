import { describe, expect, it, vi } from "vitest";
import {
  CAMPAIGN_STRIPE_MARKER,
  campaignStripeCancellation,
  observeCampaignStripeWebhook,
  runCampaignStripeRenewals,
} from "../../../../supabase/functions/_shared/stripe-campaign-renewal";

const paidStart = 1_790_000_000;
const paidEnd = paidStart + 30 * 86_400;
const giftEnd = paidEnd + 14 * 86_400;
const invoiceId = "in_paid";
const subscriptionId = "sub_platform";
const scheduleId = "sub_sched_platform";
const customerId = "cus_platform";
const priceId = "price_platform";
const job = {
  id: "11111111-1111-4111-8111-111111111111",
  lease: "22222222-2222-4222-8222-222222222222",
  userId: "33333333-3333-4333-8333-333333333333",
  internalId: "44444444-4444-4444-8444-444444444444",
  scope: "core",
  state: "pending",
  invoiceId,
  campaignEnd: paidStart + 10 * 86_400,
  subscriptionId,
  customerId,
  paidEnd,
  giftEnd,
  scheduleId: null,
  priceId: null,
  paidStart: null,
  createStarted: null,
};
const marker = { [CAMPAIGN_STRIPE_MARKER]: job.id };
const metadata = {
  app: "masaarat",
  environment: "live",
  user_id: job.userId,
  internal_subscription_id: job.internalId,
};
const price = {
  id: priceId,
  currency: "usd",
  recurring: { interval: "month", interval_count: 1, usage_type: "licensed" },
};
const paidSubscription = {
  id: subscriptionId,
  object: "subscription",
  livemode: true,
  status: "active",
  collection_method: "charge_automatically",
  latest_invoice: invoiceId,
  customer: customerId,
  metadata,
  items: {
    has_more: false,
    data: [{ price, quantity: 1, current_period_start: paidStart, current_period_end: paidEnd }],
  },
};
const phaseItems = [{ price: priceId, quantity: 1 }];
const paidPhase = {
  start_date: paidStart,
  end_date: paidEnd,
  trial_end: null,
  proration_behavior: "create_prorations",
  automatic_tax: { enabled: false },
  default_payment_method: "pm_original",
  discounts: [{ discount: "di_existing" }],
  default_tax_rates: ["txr_original"],
  items: phaseItems,
};
const giftPhase = {
  start_date: paidEnd,
  end_date: giftEnd,
  trial_end: giftEnd,
  metadata: marker,
  items: phaseItems,
};
const paidSchedule = {
  id: scheduleId,
  object: "subscription_schedule",
  livemode: true,
  status: "active",
  subscription: subscriptionId,
  customer: customerId,
  end_behavior: "release",
  metadata: {},
  phases: [paidPhase],
};
const updatedSchedule = {
  ...paidSchedule,
  metadata: marker,
  phases: [
    paidPhase,
    giftPhase,
    {
      start_date: giftEnd,
      end_date: giftEnd + 30 * 86_400,
      billing_cycle_anchor: "phase_start",
      items: phaseItems,
    },
  ],
};
const invoice = {
  id: invoiceId,
  object: "invoice",
  livemode: true,
  customer: customerId,
  status: "paid",
  amount_paid: 5000,
  status_transitions: { paid_at: paidStart + 1 },
  amount_remaining: 0,
  currency: "usd",
  parent: { subscription_details: { subscription: subscriptionId } },
  lines: {
    has_more: false,
    data: [
      {
        amount: 5000,
        period: { start: paidStart, end: paidEnd },
        parent: { subscription_item_details: { subscription: subscriptionId, proration: false } },
        pricing: { price_details: { price: priceId } },
      },
    ],
  },
};
const trial = {
  ...paidSubscription,
  status: "trialing",
  schedule: scheduleId,
  trial_start: paidEnd,
  trial_end: giftEnd,
  metadata: { ...metadata, ...marker },
};
const proof = { ...job, priceId, scheduleId };
const zeroInvoice = {
  ...invoice,
  id: "in_gift",
  amount_paid: 0,
  total: 0,
  billing_reason: "subscription_cycle",
  lines: {
    ...invoice.lines,
    data: [{ ...invoice.lines.data[0], amount: 0, period: { start: paidEnd, end: giftEnd } }],
  },
};

type Json = Record<string, unknown>;
const subscriptionPath = "/subscriptions/" + subscriptionId;
const schedulePath = "/subscription_schedules/" + scheduleId;
const invoicePath = "/invoices/" + invoiceId;

function harness(
  overrides: {
    jobs?: Json[];
    read?: Record<string, Json>;
    update?: Json;
    authorized?: boolean;
    failFirstUpdate?: boolean;
  } = {},
) {
  const { jobs = [job], read = {}, update = updatedSchedule, authorized = true } = overrides;
  const call = vi.fn((name: string, args: Json): unknown => {
    if (name === "claim_campaign_stripe_renewals") return jobs;
    if (name === "get_campaign_stripe_renewal" || name === "get_campaign_stripe_cancellation")
      return proof;
    if (name === "step_campaign_stripe_renewal" && args.p_step === "authorize") return authorized;
    return true;
  });
  const rpc = async <T>(name: string, args: Json) => call(name, args) as T;
  const stripe = vi.fn(
    async (path: string, params?: URLSearchParams, _key?: string): Promise<Json> => {
      if (params && path === "/subscription_schedules") return paidSchedule;
      if (params && path === schedulePath) {
        if (overrides.failFirstUpdate) throw new Error("response lost");
        return update;
      }
      const value = {
        [subscriptionPath]: paidSubscription,
        [schedulePath]: paidSchedule,
        [invoicePath]: invoice,
        ...read,
      }[path];
      if (!value) throw new Error("unexpected stripe request");
      return value;
    },
  );
  return { rpc, stripe, call };
}

describe("campaign Stripe renewals", () => {
  it("adds the gift after the paid term and resumes the same price on the new date", async () => {
    const h = harness();
    expect(await runCampaignStripeRenewals(h.rpc, h.stripe, paidStart + 60)).toEqual({
      scheduled: 1,
      activated: 0,
      blocked: 0,
      deferred: 0,
    });
    expect(h.stripe).toHaveBeenCalledWith(
      "/subscription_schedules",
      new URLSearchParams({ from_subscription: subscriptionId }),
      "masaarat-campaign-create-" + job.id,
    );
    const params = h.stripe.mock.calls.find(([path, body]) => path === schedulePath && body)?.[1];
    expect(Object.fromEntries(params ?? [])).toMatchObject({
      end_behavior: "release",
      proration_behavior: "none",
      "phases[0][start_date]": String(paidStart),
      "phases[0][end_date]": String(paidEnd),
      "phases[0][default_payment_method]": "pm_original",
      "phases[0][discounts][0][discount]": "di_existing",
      "phases[0][default_tax_rates][0]": "txr_original",
      "phases[1][start_date]": String(paidEnd),
      "phases[1][trial_end]": String(giftEnd),
      "phases[1][end_date]": String(giftEnd),
      "phases[1][proration_behavior]": "none",
      "phases[2][start_date]": String(giftEnd),
      "phases[2][billing_cycle_anchor]": "phase_start",
      "phases[2][items][0][price]": priceId,
      "phases[2][discounts][0][discount]": "di_existing",
      "phases[2][duration][interval]": "month",
    });
    expect(
      h.call.mock.calls.filter(([, args]) => args.p_step).map(([, args]) => args.p_step),
    ).toEqual(["create", "bind", "authorize", "scheduled"]);
  });

  it("reconciles an update whose response was lost without issuing it twice", async () => {
    const lost = harness({ failFirstUpdate: true });
    expect((await runCampaignStripeRenewals(lost.rpc, lost.stripe, paidStart + 60)).deferred).toBe(
      1,
    );
    expect(lost.call).toHaveBeenCalledWith(
      "step_campaign_stripe_renewal",
      expect.objectContaining({ p_step: "retry" }),
    );
    const h = harness({
      jobs: [{ ...job, scheduleId, priceId, paidStart, createStarted: paidStart + 60 }],
      read: {
        [subscriptionPath]: { ...paidSubscription, schedule: scheduleId },
        [schedulePath]: updatedSchedule,
      },
    });
    expect((await runCampaignStripeRenewals(h.rpc, h.stripe, paidStart + 120)).scheduled).toBe(1);
    expect(h.stripe.mock.calls.every(([, params]) => !params)).toBe(true);
  });

  it.each([
    ["foreign schedule", { ...paidSubscription, schedule: "sub_sched_other" }, invoice],
    ["unpaid invoice", paidSubscription, { ...invoice, amount_paid: 0 }],
    [
      "payment after the campaign",
      paidSubscription,
      { ...invoice, status_transitions: { paid_at: job.campaignEnd } },
    ],
    ["test subscription", { ...paidSubscription, livemode: false }, invoice],
    ["canceled renewal", { ...paidSubscription, cancel_at_period_end: true }, invoice],
  ] as const)("leaves Stripe untouched for %s", async (_label, sub, payment) => {
    const h = harness({ read: { [subscriptionPath]: sub, [invoicePath]: payment } });
    expect((await runCampaignStripeRenewals(h.rpc, h.stripe, paidStart + 60)).blocked).toBe(1);
    expect(h.stripe.mock.calls.every(([, params]) => !params)).toBe(true);
  });

  it("does not update an attached schedule if eligibility changes after the claim", async () => {
    const h = harness({ authorized: false });
    expect((await runCampaignStripeRenewals(h.rpc, h.stripe, paidStart + 60)).blocked).toBe(1);
    expect(h.stripe.mock.calls.some(([path, params]) => path === schedulePath && params)).toBe(
      false,
    );
  });

  it("confirms the active gift even when Stripe does not send a zero invoice", async () => {
    const h = harness({
      jobs: [{ ...job, state: "scheduled", priceId, scheduleId, paidStart }],
      read: {
        [subscriptionPath]: trial,
        [schedulePath]: { ...updatedSchedule, current_phase: giftPhase },
      },
    });
    expect((await runCampaignStripeRenewals(h.rpc, h.stripe, paidEnd + 1)).activated).toBe(1);
    expect(h.call).toHaveBeenCalledWith("activate_campaign_stripe_renewal", {
      p_id: job.id,
      p_schedule: scheduleId,
    });
  });

  it("acknowledges only the matching zero invoice and keeps paid invoice processing separate", async () => {
    const h = harness({
      read: {
        "/invoices/in_gift": zeroInvoice,
        [schedulePath]: { ...updatedSchedule, current_phase: giftPhase },
      },
    });
    expect(
      await observeCampaignStripeWebhook("invoice.paid", zeroInvoice, trial, h.stripe, h.rpc),
    ).toBe(true);
    expect(h.call).toHaveBeenCalledWith("activate_campaign_stripe_renewal", {
      p_id: job.id,
      p_schedule: scheduleId,
    });
    expect(
      await observeCampaignStripeWebhook("invoice.paid", invoice, trial, h.stripe, h.rpc),
    ).toBe(false);
    const unrelated = harness({
      read: { "/invoices/in_gift": { ...zeroInvoice, customer: "cus_other" } },
    });
    expect(
      await observeCampaignStripeWebhook(
        "invoice.paid",
        zeroInvoice,
        trial,
        unrelated.stripe,
        unrelated.rpc,
      ),
    ).toBe(false);
    expect(unrelated.call).not.toHaveBeenCalledWith(
      "activate_campaign_stripe_renewal",
      expect.anything(),
    );
  });
  it("lets the owner stop renewal without removing paid or gifted time", async () => {
    const source = "a".repeat(32);
    const attached = { ...paidSubscription, schedule: scheduleId };
    const scheduled = { ...updatedSchedule, current_phase: paidPhase };
    const h = harness({
      read: { [subscriptionPath]: attached, [schedulePath]: scheduled },
      update: { ...scheduled, end_behavior: "cancel", phases: [paidPhase, giftPhase] },
    });
    expect(
      await campaignStripeCancellation(job.userId, source, false, h.stripe, h.rpc, paidStart + 60),
    ).toEqual({ available: true, canceled: false });
    expect(h.stripe.mock.calls.every(([, params]) => !params)).toBe(true);
    await expect(
      campaignStripeCancellation("another-account", source, true, h.stripe, h.rpc, paidStart + 60),
    ).rejects.toThrow("CAMPAIGN_STRIPE_CANCELLATION_UNVERIFIED");
    expect(
      await campaignStripeCancellation(job.userId, source, true, h.stripe, h.rpc, paidStart + 60),
    ).toEqual({ available: true, canceled: true });
    expect(h.call).toHaveBeenCalledWith("get_campaign_stripe_cancellation", {
      p_user: job.userId,
      p_source: source,
    });
    const params = h.stripe.mock.calls.find(([path, body]) => path === schedulePath && body)?.[1];
    expect(Object.fromEntries(params ?? [])).toMatchObject({
      end_behavior: "cancel",
      proration_behavior: "none",
      "phases[0][end_date]": String(paidEnd),
      "phases[1][trial_end]": String(giftEnd),
    });
    expect(params?.has("phases[2][start_date]")).toBe(false);
  });

  it("still activates a verified gift with cancellation set at the gift end", async () => {
    const h = harness({
      jobs: [{ ...job, state: "scheduled", priceId, scheduleId, paidStart }],
      read: {
        [subscriptionPath]: { ...trial, cancel_at: giftEnd },
        [schedulePath]: {
          ...updatedSchedule,
          end_behavior: "cancel",
          current_phase: giftPhase,
          phases: [paidPhase, giftPhase],
        },
      },
    });
    expect((await runCampaignStripeRenewals(h.rpc, h.stripe, paidEnd + 1)).activated).toBe(1);
  });
});
