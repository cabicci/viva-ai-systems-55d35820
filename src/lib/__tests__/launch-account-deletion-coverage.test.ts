import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { disposableDbReady, psql, psqlAllowFail } from "../../../scripts/billing/disposable-db";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

describe("launch account deletion coverage (Batch A)", () => {
  // The former assertion read an obsolete migration and never ran the
  // effective function. DB execution now lives below on the cumulative tree.

  it("rate-limit.server.ts does not statically import client.server", () => {
    const source = readFileSync(
      path.join(REPO_ROOT, "src/lib/rate-limit.server.ts"),
      "utf8",
    );
    expect(source).not.toMatch(
      /^import\s+.*from\s+["']@\/integrations\/supabase\/client\.server["']/m,
    );
    expect(source).toContain('import("@/integrations/supabase/client.server")');
  });

  it("assistant-runtime rate limit fails closed on RPC errors", () => {
    const source = readFileSync(
      path.join(REPO_ROOT, "supabase/functions/assistant-runtime/index.ts"),
      "utf8",
    );
    expect(source).toContain("allowed: false");
    expect(source).not.toMatch(
      /rate-limit disabled: missing supabase env[\s\S]*allowed: true/,
    );
  });
});

const PAID_USER = "f0aa0000-0000-0000-0000-000000000001";
const OTHER_USER = "f0aa0000-0000-0000-0000-000000000002";
const SUBSCRIPTION = "f0aa0000-0000-0000-0000-000000000003";
const TRANSACTION = "f0aa0000-0000-0000-0000-000000000004";
const auth = (user: string) =>
  `SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claims = '{"role":"authenticated","sub":"${user}"}';`;
const request = (user: string) =>
  `BEGIN; ${auth(user)} SELECT public.request_account_deletion(); COMMIT;`;

describe.skipIf(process.env.LC09_DISPOSABLE_DB !== "1")(
  "LC-09 effective RPC on the latest cumulative disposable schema",
  () => {
    it("has a live disposable database and the new effective function", () => {
      expect(disposableDbReady()).toBe(true);
      expect(psql("SELECT to_regclass('billing.account_deletion_requests') IS NOT NULL")).toBe("t");
    });

    it("records only the requesting paid user and preserves financial dependents", () => {
      psql(`INSERT INTO billing.subscriptions
        (id,user_id,access_state,billing_state,market_code,currency_code,billing_interval,idempotency_key)
        VALUES ('${SUBSCRIPTION}','${PAID_USER}','paid_active','active','EG','EGP','month','lc09-sub');
        INSERT INTO billing.subscription_events
        (subscription_id,event_type,idempotency_key,occurred_at,source)
        VALUES ('${SUBSCRIPTION}','payment_succeeded','lc09-event',now(),'gateway_webhook');
        INSERT INTO billing.gateway_customers
        (user_id,gateway_code,gateway_customer_id,status)
        VALUES ('${PAID_USER}','stripe_us','cus_lc09','active');
        INSERT INTO billing.gateway_subscriptions
        (subscription_id,gateway_code,gateway_subscription_id,gateway_customer_id,status)
        VALUES ('${SUBSCRIPTION}','stripe_us','sub_lc09','cus_lc09','active');
        INSERT INTO billing.payment_transactions
        (id,subscription_id,user_id,gateway_code,gateway_transaction_id,transaction_type,status,
         amount_minor,currency_code,idempotency_key,initiated_at)
        VALUES ('${TRANSACTION}','${SUBSCRIPTION}','${PAID_USER}','stripe_us','pi_lc09',
          'checkout','succeeded',10000,'EGP','lc09-payment',now());
        INSERT INTO billing.refunds
        (payment_transaction_id,refund_type,status,amount_minor,currency_code,reason_code,
         gateway_code,idempotency_key,requested_at)
        VALUES ('${TRANSACTION}','manual','pending',1000,'EGP','requested_by_customer',
          'stripe_us','lc09-refund',now());
        INSERT INTO billing.subscriptions
        (user_id,access_state,billing_state,market_code,currency_code,billing_interval,idempotency_key)
        VALUES ('${OTHER_USER}','free_active','none','EG','EGP','none','lc09-other');`);

      expect(psql(request(PAID_USER))).toContain("pending_review");
      expect(psql(`SELECT count(*) FROM billing.account_deletion_requests WHERE user_id='${PAID_USER}'`)).toBe("1");
      expect(psql(`SELECT count(*) FROM billing.account_deletion_requests WHERE user_id='${OTHER_USER}'`)).toBe("0");
      expect(psql(`SELECT count(*) FROM billing.subscriptions WHERE id='${SUBSCRIPTION}'`)).toBe("1");
      expect(psql(`SELECT count(*) FROM billing.subscription_events WHERE subscription_id='${SUBSCRIPTION}'`)).toBe("1");
      expect(psql(`SELECT count(*) FROM billing.refunds WHERE payment_transaction_id='${TRANSACTION}'`)).toBe("1");
    });

    it("does not grant a user another person's request or the old destructive RPC", () => {
      const old = psqlAllowFail(`BEGIN; ${auth(PAID_USER)} SELECT public.delete_my_account_data(); COMMIT;`);
      expect(old.ok).toBe(false);
      expect(old.out).toMatch(/permission denied|has no permission/i);
      const noAuth = psqlAllowFail("BEGIN; SET LOCAL ROLE anon; SELECT public.request_account_deletion(); COMMIT;");
      expect(noAuth.ok).toBe(false);
      expect(psql(`SELECT count(*) FROM billing.account_deletion_requests WHERE user_id='${OTHER_USER}'`)).toBe("0");
      expect(psql(`SELECT has_table_privilege('authenticated','billing.account_deletion_requests','SELECT')`)).toBe("f");
    });

    it("rolls back an interrupted request and records repeats idempotently", () => {
      expect(psql(`BEGIN; ${auth(OTHER_USER)} SELECT public.request_account_deletion(); ROLLBACK;`)).toContain("pending_review");
      expect(psql(`SELECT count(*) FROM billing.account_deletion_requests WHERE user_id='${OTHER_USER}'`)).toBe("0");
      expect(psql(request(PAID_USER))).toContain("pending_review");
      expect(psql(`SELECT count(*) FROM billing.account_deletion_requests WHERE user_id='${PAID_USER}'`)).toBe("1");
    });

    it("keeps replayable financial events while request remains pending", () => {
      psql(`INSERT INTO billing.webhook_events
        (gateway_code,gateway_event_id,event_type,status,signature_valid,received_at,idempotency_key)
        VALUES ('stripe_us','evt_lc09_late','invoice.paid','processed',true,now(),'lc09-late')
        ON CONFLICT (gateway_code,gateway_event_id) DO NOTHING`);
      expect(psql(`SELECT count(*) FROM billing.webhook_events WHERE gateway_event_id='evt_lc09_late'`)).toBe("1");
      expect(psql(`SELECT status FROM billing.account_deletion_requests WHERE user_id='${PAID_USER}'`)).toBe("pending_review");
    });
  },
);
