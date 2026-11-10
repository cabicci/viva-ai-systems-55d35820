import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
// Mock route and content boundaries before loading the real presentation. No
// curriculum, lesson registry, provider or account service is imported by tests.
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (value: unknown) => value,
  Link: () => null,
}));
vi.mock("@/lib/lesson-catalog", () => ({ LESSONS: [] }));
vi.mock("@/lib/curriculum-data", () => ({ PATHS: [] }));
vi.mock("@/lib/entitlements", () => ({ useEntitlement: vi.fn(), useStreak: vi.fn() }));
vi.mock("@/lib/billing/subscription-display.functions", () => ({
  getAccountSubscriptions: vi.fn(),
}));
vi.mock("@/components/billing/StripePortalButton", () => ({
  StripePortalButton: ({ scope }: { scope: string }) => <button>portal:{scope}</button>,
}));
vi.mock("@/lib/admin.functions", () => ({
  getAdminOverview: vi.fn(),
  getAdminActivity: vi.fn(),
  getAdminInsights: vi.fn(),
  listUsers: vi.fn(),
}));
import { SubscriptionSources } from "../account";
import { SubscriptionTotals } from "../admin.index";
import {
  adminSubscriptionSchema,
  subscriptionCopy,
  type AccountSubscriptions,
  type SubscriptionSource,
} from "../../lib/billing/subscription-display";

const owner = "d0200000-0000-4000-8000-000000000001";
const source: SubscriptionSource = {
  sourceKey: "a".repeat(32),
  kind: "manual_subscription",
  area: "ai",
  product: "pro",
  targets: ["ai"],
  beneficiary: null,
  sourceStatus: "confirmed",
  startsAt: "2020-01-01T00:00:00Z",
  accessUntil: "2099-01-01T00:00:00Z",
  isLifetime: false,
  paid: true,
  eligible: true,
  cancelAtPeriodEnd: null,
  paymentMethod: "bank",
  paymentEnvironment: null,
  portalScope: null,
  termsUntil: null,
};
const snapshot = (sources = [source]): AccountSubscriptions => ({
  actorUserId: owner,
  serverTime: new Date().toISOString(),
  sources,
});
describe("real account/admin display JSX with isolated imports", () => {
  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const)(
    "shows fixed-term payment and no Stripe portal in %s",
    (locale) => {
      const html = renderToStaticMarkup(
        <SubscriptionSources
          data={snapshot()}
          accountId={owner}
          locale={locale}
          loading={false}
          error={false}
          retry={() => {}}
        />,
      );
      expect(html).toContain(subscriptionCopy[locale].bank);
      expect(html).toContain(subscriptionCopy[locale].noRenewal);
      expect(html).not.toContain("portal:");
    },
  );
  it("hides stale private details after error or account switch", () => {
    const data = snapshot([{ ...source, beneficiary: "PRIVATE CHILD" }]);
    for (const props of [
      { accountId: owner, error: true },
      { accountId: owner.replace(/1$/, "2"), error: false },
    ]) {
      const html = renderToStaticMarkup(
        <SubscriptionSources data={data} {...props} locale="en" loading={false} retry={() => {}} />,
      );
      expect(html).not.toContain("PRIVATE CHILD");
      expect(html).toContain("could not be loaded");
    }
  });
  it("distinguishes a successful empty list from an unavailable read", () => {
    const html = renderToStaticMarkup(
      <SubscriptionSources
        data={snapshot([])}
        accountId={owner}
        locale="en"
        loading={false}
        error={false}
        retry={() => {}}
      />,
    );
    expect(html).toContain("No subscriptions or purchases");
    expect(html).not.toContain('role="alert"');
  });
  it("keeps independent lifetime and invitation rows and separates the first-month allowance", () => {
    const html = renderToStaticMarkup(
      <SubscriptionSources
        data={snapshot([
          {
            ...source,
            kind: "lifetime",
            product: "lifetime_course",
            isLifetime: true,
            accessUntil: null,
          },
          {
            ...source,
            sourceKey: "b".repeat(32),
            kind: "invitation",
            product: "comprehensive",
            paid: false,
            paymentMethod: null,
            accessUntil: null,
          },
        ])}
        accountId={owner}
        locale="en"
        loading={false}
        error={false}
        retry={() => {}}
      />,
    );
    expect(html).toContain("Lifetime curriculum access");
    expect(html).toContain("first month only");
    expect(html).toContain("Comprehensive invitation");
    expect(html).toContain("No end date");
  });
  it("renders source counts with overlap explanation instead of summing them as users", () => {
    const data = adminSubscriptionSchema.parse({
      actorUserId: owner,
      serverTime: new Date().toISOString(),
      summary: {
        activePaidAccounts: 1,
        activePaidSources: 3,
        activeInvitationSources: 2,
        activeGrantSources: 1,
        activeLifetimeSources: 1,
        byArea: { ai: { accounts: 1, sources: 2 }, kids: { accounts: 1, sources: 1 } },
        byKind: {},
      },
    });
    const html = renderToStaticMarkup(<SubscriptionTotals locale="en" summary={data.summary} />);
    expect(html).toContain("Accounts are counted once");
    expect(html).toContain("Active invitations");
    expect(html).toContain("Active paid access sources");
    expect(html).toContain("AI: 1");
    expect(html).toContain("Children: 1");
    expect(html).not.toContain("Academic:");
  });
  it("renders a validated empty aggregate without invented categories or unavailable state", () => {
    const data = adminSubscriptionSchema.parse({
      actorUserId: owner,
      serverTime: new Date().toISOString(),
      summary: {
        activePaidAccounts: 0,
        activePaidSources: 0,
        activeInvitationSources: 0,
        activeGrantSources: 0,
        activeLifetimeSources: 0,
        byArea: {},
        byKind: {},
      },
    });
    const html = renderToStaticMarkup(<SubscriptionTotals locale="en" summary={data.summary} />);
    expect(html).toContain("Active paid access sources: 0");
    expect(html).not.toContain("AI:");
    expect(html).not.toContain("Children:");
    expect(html).not.toContain("could not be loaded");
  });
});
