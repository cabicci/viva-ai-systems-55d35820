import { describe, expect, it } from "vitest";
import {
  accountSubscriptionSchema,
  adminSubscriptionSchema,
  allowedPortalScope,
  currentSubscriptionData,
  paymentLabel,
  sourceState,
  sourceTitle,
  subscriptionCopy,
  subscriptionRefreshInterval,
  type SubscriptionSource,
} from "../subscription-display";

const source: SubscriptionSource = {
  sourceKey: "a".repeat(32),
  kind: "core_subscription",
  area: "ai",
  product: "pro",
  targets: ["ai"],
  beneficiary: null,
  sourceStatus: "paid_active",
  startsAt: "2026-11-01T00:00:00Z",
  accessUntil: "2026-12-01T00:00:00Z",
  isLifetime: false,
  paid: true,
  eligible: true,
  cancelAtPeriodEnd: false,
  paymentMethod: "stripe_us_live",
  paymentEnvironment: "live",
  portalScope: "core",
  termsUntil: null,
};
const owner = "d0200000-0000-4000-8000-000000000001";
const now = Date.parse("2026-11-05T00:00:00Z");
const emptySummary = {
  activePaidAccounts: 0,
  activePaidSources: 0,
  activeInvitationSources: 0,
  activeGrantSources: 0,
  activeLifetimeSources: 0,
  byArea: {},
  byKind: {},
};
const parseSummary = (summary: unknown) =>
  adminSubscriptionSchema.safeParse({
    actorUserId: owner,
    serverTime: new Date(now).toISOString(),
    summary,
  });
describe("subscription display contracts", () => {
  it.each([
    {
      ...emptySummary,
      activePaidAccounts: 1,
      activePaidSources: 3,
      byArea: { ai: { accounts: 1, sources: 2 }, kids: { accounts: 1, sources: 1 } },
    },
    emptySummary,
    { ...emptySummary, byKind: { invitation: 2 } },
  ])("accepts sparse or empty SQL aggregates without filling absent categories %#", (summary) => {
    const parsed = parseSummary(summary);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.summary).toEqual(summary);
  });
  it.each([
    { ...emptySummary, byArea: { unexpected: { accounts: 0, sources: 0 } } },
    { ...emptySummary, byKind: { unexpected: 0 } },
    { ...emptySummary, byArea: { ai: { accounts: 0, sources: 0, secret: 1 } } },
    { ...emptySummary, byArea: { ai: { accounts: 0 } } },
    { ...emptySummary, byArea: null },
    { ...emptySummary, byKind: null },
    { ...emptySummary, byArea: undefined },
    { ...emptySummary, byKind: undefined },
  ])("rejects unknown keys, incomplete values and absent aggregate maps %#", (summary) => {
    expect(parseSummary(summary).success).toBe(false);
  });
  it.each([-1, 0.5, "1", null, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid counts in every aggregate position: %s",
    (value) => {
      for (const summary of [
        { ...emptySummary, activePaidAccounts: value },
        { ...emptySummary, byArea: { ai: { accounts: value, sources: 0 } } },
        { ...emptySummary, byArea: { ai: { accounts: 0, sources: value } } },
        { ...emptySummary, byKind: { invitation: value } },
      ])
        expect(parseSummary(summary).success).toBe(false);
    },
  );
  it("rejects extra private fields instead of forwarding raw provider records", () => {
    expect(
      accountSubscriptionSchema.safeParse({
        actorUserId: owner,
        serverTime: new Date(now).toISOString(),
        sources: [{ ...source, customer_id: "cus_private" }],
      }).success,
    ).toBe(false);
  });
  it("rejects missing and malformed counts instead of manufacturing zero", () => {
    for (const summary of [{}, { activePaidAccounts: null }, { activePaidAccounts: -1 }])
      expect(
        adminSubscriptionSchema.safeParse({
          actorUserId: owner,
          serverTime: new Date(now).toISOString(),
          summary,
        }).success,
      ).toBe(false);
  });
  it("hides previous-user, error and expired snapshots", () => {
    const data = { actorUserId: owner, serverTime: new Date(now).toISOString(), sources: [source] };
    expect(currentSubscriptionData(data, owner, false, now)).toBe(data);
    expect(currentSubscriptionData(data, owner, true, now)).toBeUndefined();
    expect(currentSubscriptionData(data, null, false, now)).toBeUndefined();
    expect(currentSubscriptionData(data, owner.replace(/1$/, "2"), false, now)).toBeUndefined();
    expect(currentSubscriptionData(data, owner, false, now + 90_000)).toBeUndefined();
  });
  it("distinguishes cancellation, pending, fixed future periods and exact expiry", () => {
    expect(sourceState({ ...source, cancelAtPeriodEnd: true }, now)).toBe("ending");
    expect(sourceState({ ...source, startsAt: new Date(now + 1).toISOString() }, now)).toBe(
      "scheduled",
    );
    expect(sourceState({ ...source, accessUntil: new Date(now).toISOString() }, now)).toBe("ended");
    expect(
      sourceState(
        { ...source, sourceStatus: "pending_acceptance", startsAt: null, accessUntil: null },
        now,
      ),
    ).toBe("pending");
    expect(sourceState({ ...source, eligible: false }, now)).toBe("inactive");
  });
  it("does not expire lifetime content when its first-month questions end", () => {
    expect(
      sourceState(
        {
          ...source,
          kind: "lifetime",
          isLifetime: true,
          accessUntil: null,
          startsAt: "2024-01-01T00:00:00Z",
        },
        now,
      ),
    ).toBe("active");
  });
  it("refreshes at the next relevant boundary instead of waiting a full interval", () => {
    expect(
      subscriptionRefreshInterval(
        {
          actorUserId: owner,
          serverTime: new Date(now).toISOString(),
          sources: [{ ...source, accessUntil: new Date(now + 1500).toISOString() }],
        },
        now,
      ),
    ).toBe(1510);
    expect(subscriptionRefreshInterval(undefined, now)).toBe(30_000);
  });
  it("does not offer core portal for manual, academic, technical, invitation, or Test sources", () => {
    expect(allowedPortalScope(source)).toBe("core");
    expect(
      allowedPortalScope({
        ...source,
        kind: "kids_subscription",
        portalScope: "kids",
        paymentMethod: "stripe",
      }),
    ).toBe("kids");
    for (const kind of [
      "manual_subscription",
      "academic_subscription",
      "technical_subscription",
      "invitation",
      "lifetime",
    ] as const)
      expect(allowedPortalScope({ ...source, kind })).toBeNull();
    expect(allowedPortalScope({ ...source, paymentEnvironment: "test" })).toBeNull();
    expect(allowedPortalScope({ ...source, paymentMethod: "bank" })).toBeNull();
  });
  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const)(
    "provides truthful labels for every state in %s",
    (locale) => {
      for (const value of Object.values(subscriptionCopy[locale]))
        expect(value.trim().length).toBeGreaterThan(0);
      expect(sourceTitle(source, locale)).toBe("AI Pro");
      expect(paymentLabel({ ...source, paymentMethod: "bank" }, locale)).toBe(
        subscriptionCopy[locale].bank,
      );
      expect(paymentLabel({ ...source, paymentMethod: null }, locale)).toBe(
        subscriptionCopy[locale].unknown,
      );
    },
  );
});
