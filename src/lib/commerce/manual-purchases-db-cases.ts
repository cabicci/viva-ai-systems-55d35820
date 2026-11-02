import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Order } from "./contracts";

type LedgerResult = Order & {
  parameters: Record<string, unknown>;
  orders: Order[];
  commercial_purchase: NonNullable<Order["commercial_purchase"]>;
};

type Harness = {
  user: string;
  other: string;
  admin: string;
  actor(id: string, service?: boolean): Promise<unknown>;
  command(action: string, data?: Record<string, unknown>): Promise<LedgerResult>;
  value(sql: string, args?: unknown[]): Promise<unknown>;
  retentionEvidence(): Promise<{ termOfferId: string; reservationId: string }>;
};

/** Runs against the complete installed commerce/payment/risk/coupon stack. */
export function manualPurchaseDbCases(h: Harness) {
  const selection = (kind = "question_topup") => ({
    kind,
    wallet_scope: "account",
    ...(kind === "lifetime_course" ? { area: "ai", course: "ai" } : {}),
  });
  const order = async (extra: Record<string, unknown> = {}) => {
    await h.actor(h.user);
    return h.command("create_one_time_order", {
      ...selection(),
      method: "bank",
      key: randomUUID(),
      ...extra,
    });
  };
  const confirm = async (o: Order, amount = o.final_minor, extra: Record<string, unknown> = {}) => {
    await h.actor(h.admin);
    return h.command("confirm", {
      key: randomUUID(),
      method: o.method,
      currency: o.currency,
      amount_minor: amount,
      transaction_reference: randomUUID(),
      received_at: new Date().toISOString(),
      funds_verified: true,
      allocations: [{ order_id: o.id, amount_minor: amount }],
      ...extra,
    });
  };
  describe("one-time purchases through the existing verified manual ledger", () => {
    it("grants no topup before verified funds and credits exactly once with genuine manual provenance", async () => {
      const o = await order();
      expect(o).toMatchObject({
        package: "question_topup",
        billing_interval: "one_time",
        final_minor: 5000,
        currency: "EGP",
      });
      expect(await h.value("SELECT billing.assistant_wallet_units($1,'account') v", [h.user])).toBe(
        0,
      );
      const key = randomUUID();
      const paid = await confirm(o, 5000, { key });
      expect(paid.method).toBe("bank");
      expect(await h.value("SELECT billing.assistant_wallet_units($1,'account') v", [h.user])).toBe(
        100,
      );
      expect(
        await h.value("SELECT to_jsonb(p) v FROM billing.commercial_purchases p WHERE id=$1", [
          o.commercial_purchase_id,
        ]),
      ).toMatchObject({
        state: "fulfilled",
        payment_rail: "bank",
        payment_id: null,
        session_id: null,
        provider_event_id: null,
      });
      await h.command("confirm", paid.parameters);
      expect(await h.value("SELECT billing.assistant_wallet_units($1,'account') v", [h.user])).toBe(
        100,
      );
    });
    it("activates exactly the selected lifetime curriculum only after complete verified payment", async () => {
      const o = await order(selection("lifetime_course"));
      expect(o.final_minor).toBe(7500);
      expect(
        await h.value("SELECT billing.commercial_course_owned($1,'ai','ai',NULL) v", [h.user]),
      ).toBe(false);
      await confirm(o, 2500);
      expect(
        await h.value("SELECT billing.commercial_course_owned($1,'ai','ai',NULL) v", [h.user]),
      ).toBe(false);
      await confirm(o, 5000);
      expect(
        await h.value("SELECT billing.commercial_course_owned($1,'ai','ai',NULL) v", [h.user]),
      ).toBe(true);
      expect(
        await h.value("SELECT billing.commercial_course_owned($1,'academic','AC-BUS',NULL) v", [
          h.user,
        ]),
      ).toBe(false);
      expect(
        await h.value("SELECT billing.commercial_course_owned($1,'ai','ai',NULL) v", [h.other]),
      ).toBe(false);
    });
    it("binds retries to their original selection and keeps other accounts out of order details", async () => {
      const key = randomUUID(),
        o = await order({ key });
      expect((await order({ key })).id).toBe(o.id);
      await expect(order({ key, wallet_scope: "family" })).rejects.toThrow("RETRY_CONFLICT");
      await h.actor(h.other);
      await expect(h.command("order", { id: o.id })).rejects.toThrow("FORBIDDEN");
      await h.actor(h.user);
      expect((await h.command("my_list")).orders[0].commercial_purchase).toMatchObject({
        state: "pending",
        wallet_scope: "account",
      });
      expect((await h.command("order", { id: o.id })).commercial_purchase.state).toBe("pending");
    });
    it("rejects unverified, non-admin, mismatched-rail and mismatched-currency confirmation without granting credit", async () => {
      const o = await order();
      await h.actor(h.user);
      await expect(h.command("confirm", { key: randomUUID() })).rejects.toThrow("ADMIN_REQUIRED");
      await expect(confirm(o, 5000, { funds_verified: false })).rejects.toThrow("NOT_VERIFIED");
      await expect(confirm(o, 5000, { currency: "USD" })).rejects.toThrow();
      await expect(confirm(o, 5000, { method: "wallet" })).rejects.toThrow();
      expect(await h.value("SELECT billing.assistant_wallet_units($1,'account') v", [h.user])).toBe(
        0,
      );
    });
    it("uses only configured rails and rejects forged prices, foreign scope and the ordinary subscription shortcut", async () => {
      await expect(order({ method: "wallet" })).rejects.toThrow("UNAVAILABLE");
      await expect(order({ amount_minor: 1 })).rejects.toThrow("INVALID_SELECTION");
      await expect(order({ wallet_scope: "family" })).rejects.toThrow("INVALID_SELECTION");
      await expect(
        order({ ...selection("lifetime_course"), child_id: randomUUID() }),
      ).rejects.toThrow("INVALID_SELECTION");
      await expect(
        h.command("create_order", {
          package: "question_topup",
          market: "EG",
          billing_interval: "one_time",
          method: "bank",
          key: randomUUID(),
        }),
      ).rejects.toThrow("BOUND_ORDER_REQUIRED");
      await expect(order({ ...selection("lifetime_course"), code: "TEST" })).rejects.toThrow(
        "INVALID_SELECTION",
      );
    });
    it("expires and cancels pending purchases without granting, then permits a new lifetime attempt", async () => {
      const o = await order(selection("lifetime_course"));
      await expect(order(selection("lifetime_course"))).rejects.toThrow("OWNED_OR_PENDING");
      await h.command("cancel_order", { id: o.id });
      expect(
        await h.value("SELECT state v FROM billing.commercial_purchases WHERE id=$1", [
          o.commercial_purchase_id,
        ]),
      ).toBe("expired");
      const next = await order(selection("lifetime_course"));
      await h.value(
        "UPDATE billing.commerce_orders SET expires_at=now()-interval '1 hour' WHERE id=$1 RETURNING true v",
        [next.id],
      );
      await expect(confirm(next)).rejects.toThrow("NOT_CONFIRMABLE");
      expect((await order(selection("lifetime_course"))).id).not.toBe(next.id);
      expect(
        await h.value("SELECT billing.commercial_course_owned($1,'ai','ai',NULL) v", [h.user]),
      ).toBe(false);
    });
    it("keeps a rejected receipt eligible for further review and verified payment", async () => {
      const o = await order();
      await h.actor(h.admin);
      await h.command("review", { id: o.id, status: "rejected", reason: "Fixture clarification" });
      expect(
        await h.value("SELECT state v FROM billing.commercial_purchases WHERE id=$1", [
          o.commercial_purchase_id,
        ]),
      ).toBe("pending");
      await h.command("review", { id: o.id, status: "more_info", reason: "Fixture reviewed" });
      await confirm(o);
      expect(await h.value("SELECT billing.assistant_wallet_units($1,'account') v", [h.user])).toBe(
        100,
      );
    });
    it("preserves the administrator's existing explicit choice to retain access after a recorded refund", async () => {
      const o = await order(selection("lifetime_course")),
        payment = await confirm(o);
      await h.command("refund", {
        payment_id: payment.id,
        order_id: o.id,
        amount_minor: 7500,
        reference: randomUUID(),
        reason: "Fixture retain access",
        revoke_access: false,
        funds_verified: true,
        key: randomUUID(),
      });
      expect(
        await h.value("SELECT billing.commercial_course_owned($1,'ai','ai',NULL) v", [h.user]),
      ).toBe(true);
    });
    it("adds repeated purchases to permanent credit and preserves verified-payment allocation", async () => {
      const first = await order(),
        second = await order();
      const payment = await confirm(first, 5000, { amount_minor: 10000 });
      expect(await h.value("SELECT billing.assistant_wallet_units($1,'account') v", [h.user])).toBe(
        100,
      );
      await h.command("allocate", {
        payment_id: payment.id,
        key: randomUUID(),
        allocations: [{ order_id: second.id, amount_minor: 5000 }],
      });
      expect(await h.value("SELECT billing.assistant_wallet_units($1,'account') v", [h.user])).toBe(
        200,
      );
      expect(
        await h.value(
          "SELECT bool_and(expires_at IS NULL) v FROM billing.ai_credit_ledger WHERE user_id=$1 AND source_type='commercial_purchase'",
          [h.user],
        ),
      ).toBe(true);
    });
    it("keeps purchased family credit separate from account credit and rejects a foreign child", async () => {
      const child = randomUUID();
      await h.value(
        "INSERT INTO public.kids_profiles(id,parent_id,display_name,level_id) VALUES($1,$2,'Fixture child','level-1') RETURNING id v",
        [child, h.user],
      );
      const o = await order({ wallet_scope: "family" });
      await confirm(o);
      expect(await h.value("SELECT billing.assistant_wallet_units($1,'family') v", [h.user])).toBe(
        100,
      );
      expect(await h.value("SELECT billing.assistant_wallet_units($1,'account') v", [h.user])).toBe(
        0,
      );
      await h.actor(h.other);
      await expect(
        h.command("create_one_time_order", {
          ...selection("lifetime_course"),
          area: "kids",
          course: "kids",
          child_id: child,
          wallet_scope: "family",
          method: "bank",
          key: randomUUID(),
        }),
      ).rejects.toThrow("INVALID_SELECTION");
    });
    it("keeps the new ledger helpers private and denies Stripe identity on a manual purchase", async () => {
      const o = await order();
      await expect(
        h.value(
          "UPDATE billing.commercial_purchases SET session_id='cs_live_forged' WHERE id=$1 RETURNING true v",
          [o.commercial_purchase_id],
        ),
      ).rejects.toThrow();
      await expect(
        h.value(
          "UPDATE billing.commercial_purchases SET payment_rail='stripe' WHERE id=$1 RETURNING true v",
          [o.commercial_purchase_id],
        ),
      ).rejects.toThrow("IMMUTABLE");
      expect(
        await h.value(
          "SELECT bool_and(NOT has_function_privilege('authenticated',p.oid,'EXECUTE') AND NOT has_function_privilege('service_role',p.oid,'EXECUTE')) v FROM pg_proc p WHERE pronamespace='billing'::regnamespace AND proname IN ('commercial_manual_quote','commercial_order_view','commerce_before_one_time_command','commerce_activate','commercial_manual_refund')",
        ),
      ).toBe(true);
    });
    it("reverses refunded top-ups exactly once and blocks their confirmation mail", async () => {
      const o = await order(),
        payment = await confirm(o);
      const mail = await h.value("SELECT id v FROM billing.commerce_outbox WHERE order_id=$1", [
        o.id,
      ]);
      expect(await h.value("SELECT billing.commerce_payment_mail_allowed($1) v", [mail])).toBe(
        true,
      );
      const refund = {
        payment_id: payment.id,
        order_id: o.id,
        amount_minor: 5000,
        reference: randomUUID(),
        reason: "Fixture refund",
        revoke_access: true,
        funds_verified: true,
        key: randomUUID(),
      };
      await h.command("refund", refund);
      await h.command("refund", refund);
      expect(await h.value("SELECT billing.assistant_wallet_units($1,'account') v", [h.user])).toBe(
        0,
      );
      expect(
        await h.value("SELECT state v FROM billing.commercial_purchases WHERE id=$1", [
          o.commercial_purchase_id,
        ]),
      ).toBe("held");
      expect(await h.value("SELECT billing.commerce_payment_mail_allowed($1) v", [mail])).toBe(
        false,
      );
    });
    it("retains suppression and deletion guards on the new payment confirmation stream", async () => {
      const o = await order();
      await confirm(o);
      const mail = await h.value("SELECT id v FROM billing.commerce_outbox WHERE order_id=$1", [
        o.id,
      ]);
      await h.command("mail_preferences", {
        email: "member@example.test",
        marketing_opt_out: false,
        suppressed: true,
      });
      expect(await h.value("SELECT billing.commerce_payment_mail_allowed($1) v", [mail])).toBe(
        false,
      );
      await h.command("mail_preferences", {
        email: "member@example.test",
        marketing_opt_out: false,
        suppressed: false,
      });
      await h.value("UPDATE auth.users SET email_confirmed_at=NULL WHERE id=$1 RETURNING true v", [
        h.user,
      ]);
      expect(await h.value("SELECT billing.commerce_payment_mail_allowed($1) v", [mail])).toBe(
        false,
      );
      await expect(order()).rejects.toThrow();
    });
    it("uses the existing account-erasure and financial-retention lifecycle for bound purchases", async () => {
      const o = await order();
      await confirm(o);
      const evidence = await h.retentionEvidence();
      await h.actor(h.user, true);
      await h.value(
        "UPDATE billing.account_deletion_control SET enabled=true,financial_purge_enabled=true,financial_retention_reference='fixture',crm_retention_reference='fixture',responder_reference='fixture',release_reference='fixture' RETURNING true v",
      );
      await h.value(
        "INSERT INTO billing.account_deletion_requests(user_id) VALUES($1) RETURNING true v",
        [h.user],
      );
      const claim = (await h.value("SELECT public.lc09_claim_deletion($1) v", [h.user])) as {
        lease_token: string;
      };
      await h.value("SELECT public.lc09_advance_deletion($1,$2,'provider_reconciled') v", [
        h.user,
        claim.lease_token,
      ]);
      await h.value("SELECT public.lc09_advance_deletion($1,$2,'learner_erased') v", [
        h.user,
        claim.lease_token,
      ]);
      expect(
        await h.value(
          "SELECT jsonb_build_object('state',state,'parameters',parameters,'child_id',child_id) v FROM billing.commercial_purchases WHERE id=$1",
          [o.commercial_purchase_id],
        ),
      ).toEqual({ state: "held", parameters: {}, child_id: null });
      expect(
        await h.value("SELECT recipient_email v FROM billing.commerce_orders WHERE id=$1", [o.id]),
      ).toBe("");
      expect(
        await h.value("SELECT count(*)::int v FROM billing.commerce_payments WHERE user_id=$1", [
          h.user,
        ]),
      ).toBe(2);
      expect(
        await h.value(
          "SELECT jsonb_build_object('recipient_email',recipient_email,'phone',phone) v FROM public.stripe_live_offer_reservations WHERE id=$1",
          [evidence.reservationId],
        ),
      ).toEqual({ recipient_email: "", phone: null });
      expect(
        await h.value(
          "SELECT jsonb_build_object('recipient_email',recipient_email,'phone',phone) v FROM billing.commerce_discount_terms WHERE offer_id=$1",
          [evidence.termOfferId],
        ),
      ).toEqual({ recipient_email: "", phone: null });
      await h.value("DELETE FROM auth.users WHERE id=$1 RETURNING true v", [h.user]);
      await h.value("SELECT public.lc09_advance_deletion($1,$2,'complete') v", [
        h.user,
        claim.lease_token,
      ]);
      await expect(
        h.value("SELECT public.lc09_claim_financial_purge($1) v", [h.user]),
      ).rejects.toThrow("NOT_DUE");
      await h.value(
        "UPDATE billing.account_deletion_lifecycle SET completed_at=now()-interval '361 hours' WHERE user_id=$1 RETURNING true v",
        [h.user],
      );
      const finance = (await h.value("SELECT public.lc09_claim_financial_purge($1) v", [
        h.user,
      ])) as { lease_token: string };
      await h.value("SELECT public.lc09_complete_financial_purge($1,$2) v", [
        h.user,
        finance.lease_token,
      ]);
      expect(
        await h.value("SELECT count(*)::int v FROM billing.commercial_purchases WHERE user_id=$1", [
          h.user,
        ]),
      ).toBe(0);
      expect(
        await h.value("SELECT count(*)::int v FROM billing.commerce_orders WHERE id=$1", [o.id]),
      ).toBe(0);
      expect(
        await h.value(
          "SELECT count(*)::int v FROM public.stripe_live_offer_reservations WHERE id=$1",
          [evidence.reservationId],
        ),
      ).toBe(0);
      expect(
        await h.value(
          "SELECT count(*)::int v FROM billing.commerce_discount_terms WHERE offer_id=$1",
          [evidence.termOfferId],
        ),
      ).toBe(0);
    });
    it("applies only an explicit top-up coupon and keeps its shared cap and phone binding", async () => {
      await h.actor(h.admin);
      const offer = await h.command("simple_offer", {
        key: randomUUID(),
        audience: "individual",
        emails: ["member@example.test"],
        group_name: "",
        package: "question_topup",
        market: "EG",
        billing_interval: "one_time",
        product_scope: "question_topup",
        percent: 20,
        delivery: "coupon",
        code: "MANUALTOPUP",
        locale: "en",
        limit_mode: "time",
        valid_until: null,
        max_redemptions: null,
        expected_price_minor: 5000,
      });
      await expect(order({ code: "MANUALTOPUP" })).rejects.toThrow("PHONE");
      const o = await order({ code: "MANUALTOPUP", phone: "+201012345678" });
      expect(o.final_minor).toBe(4000);
      await expect(order({ code: "MANUALTOPUP", phone: "+201012345678" })).rejects.toThrow();
      await confirm(o);
      expect(
        await h.value("SELECT consumed_count v FROM billing.commerce_offers WHERE id=$1", [
          offer.id,
        ]),
      ).toBe(1);
      expect(await h.value("SELECT billing.assistant_wallet_units($1,'account') v", [h.user])).toBe(
        100,
      );
    });
  });
}
