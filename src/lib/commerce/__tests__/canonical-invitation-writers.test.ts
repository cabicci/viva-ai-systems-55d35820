import { describe, it, expect } from "vitest";
import { couponExtensionAllowed } from "../../../components/commerce/AdminPayments";
import type { AdminData, Entitlement } from "../contracts";
import { invitationImportCopy } from "../email-access";
describe("M01 source-aware extension controls", () => {
  const entitlement = { grant_id: "g", user_id: "u" } as Entitlement;
  const state = (grant: object, order: object) =>
    ({ grants: [grant], orders: [order] }) as Pick<AdminData, "grants" | "orders">;
  const grant = { id: "g", user_id: "u", offer_order_id: "o" };
  const order = {
    id: "o",
    user_id: "u",
    offer_id: "offer",
    confirmed_at: "2026-01-01",
    final_minor: 0,
  };
  it("permits a confirmed 100% financial coupon source", () =>
    expect(couponExtensionAllowed(entitlement, state(grant, order))).toBe(true));
  it.each([{ offer_order_id: null }, { user_id: "other" }])(
    "excludes unbacked grants %j",
    (change) =>
      expect(couponExtensionAllowed(entitlement, state({ ...grant, ...change }, order))).toBe(
        false,
      ),
  );
  it.each([{ user_id: "other" }, { final_minor: 100 }, { offer_id: null }, { confirmed_at: null }])(
    "excludes noncoupon orders %j",
    (change) =>
      expect(couponExtensionAllowed(entitlement, state(grant, { ...order, ...change }))).toBe(
        false,
      ),
  );
  it.each(["en", "ar-EG", "ar-MSA", "ar-Gulf"])("localizes every bulk result in %s", (locale) => {
    const copy = invitationImportCopy(locale);
    for (const field of [copy.pending, copy.saved, copy.uncertain, copy.note])
      expect(field.length).toBeGreaterThan(5);
  });
});
