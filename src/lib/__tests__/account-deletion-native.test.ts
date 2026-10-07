// @vitest-environment node
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { psql, psqlAllowFail, psqlConcurrent } from "../../../scripts/billing/disposable-db";

const service = `SELECT set_config('request.jwt.claims','{"role":"service_role"}',false);`;
const enable = `UPDATE billing.account_deletion_control SET enabled=true,
  financial_retention_reference='disposable-finance',crm_retention_reference='disposable-crm',
  responder_reference='disposable-responder',release_reference='disposable-release';`;
const seed = (
  user: string,
) => `INSERT INTO auth.users(id,email,email_confirmed_at) VALUES('${user}','${user}@example.test',now());
  INSERT INTO billing.account_deletion_requests(user_id) VALUES('${user}');`;

describe.skipIf(process.env.LC09_DISPOSABLE_DB !== "1")(
  "LC-09 native cumulative finalization and locks",
  () => {
    afterAll(() => psql("UPDATE billing.account_deletion_control SET enabled=false"));

    it("starts disabled and rejects every client worker call", () => {
      expect(psql("SELECT enabled FROM billing.account_deletion_control")).toBe("f");
      expect(
        psqlAllowFail(
          `BEGIN; SET LOCAL ROLE authenticated; SELECT public.lc09_claim_deletion('${randomUUID()}');`,
        ).ok,
      ).toBe(false);
    });

    it("erases the family on the complete cumulative schema without deleting another family's progress or financial receipts", () => {
      const user = randomUUID(),
        other = randomUUID(),
        child = randomUUID(),
        otherChild = randomUUID();
      const out = psql(`BEGIN; ${service} ${enable} ${seed(user)} ${seed(other)}
      INSERT INTO public.kids_profiles(id,parent_id,display_name,level_id)
        VALUES('${child}','${user}','Synthetic A','level-1'),('${otherChild}','${other}','Synthetic B','level-1');
      INSERT INTO public.kids_lesson_progress(profile_id,level_id,lesson_number,locale)
        VALUES('${child}','level-1',1,'en'),('${otherChild}','level-1',1,'en');
      INSERT INTO public.journey_visits(user_id,line,course_id,subject_id,profile_id,lesson_id,locale)
        VALUES('${user}','ai','ai','${user}',NULL,'intro','en'),
        ('${user}','kids','level-1','${child}','${child}','1','en'),
        ('${other}','ai','ai','${other}',NULL,'intro','en'),
        ('${other}','kids','level-1','${otherChild}','${otherChild}','1','en');
      INSERT INTO public.kids_retention_notices(parent_id,expiry,recipient_email,profile_ids)
        VALUES('${user}',now(),'synthetic@example.test',ARRAY['${child}']::uuid[]);
      INSERT INTO public.kids_stripe_events(event_id,parent_id) VALUES('evt_native_${child.replaceAll("-", "")}','${user}');
      SELECT public.queue_contact_acknowledgement('${child}','${user}@example.test','en','support','Support','Private body','<p>Private body</p>');
      SELECT public.queue_contact_acknowledgement('${otherChild}','${other}@example.test','en','support','Other','Other body','<p>Other body</p>');
      UPDATE public.contact_acknowledgement_outbox SET provider_email_id='email_${child}' WHERE id='${child}';
      SELECT public.record_contact_mail_receipt('receipt_${child}','email_${child}','${user}@example.test','email.delivered',now());
      CREATE TEMP TABLE deletion_claim AS SELECT public.lc09_claim_deletion('${user}') AS claim;
      SELECT public.lc09_advance_deletion('${user}',(SELECT (claim->>'lease_token')::uuid FROM deletion_claim),'provider_reconciled');
      SELECT public.lc09_advance_deletion('${user}',(SELECT (claim->>'lease_token')::uuid FROM deletion_claim),'learner_erased');
      SELECT json_build_object('own_visits_before_auth_delete',(SELECT count(*) FROM public.journey_visits WHERE user_id='${user}'),
        'other_visits',(SELECT count(*) FROM public.journey_visits WHERE user_id='${other}'));
      DELETE FROM auth.users WHERE id='${user}';
      SELECT public.lc09_advance_deletion('${user}',(SELECT (claim->>'lease_token')::uuid FROM deletion_claim),'complete');
      SELECT json_build_object('removed',(SELECT count(*) FROM public.kids_profiles WHERE parent_id='${user}'),
        'other_progress',(SELECT count(*) FROM public.kids_lesson_progress WHERE profile_id='${otherChild}'),
        'receipts',(SELECT count(*) FROM public.kids_stripe_events WHERE parent_id='${user}'),
        'recipients',(SELECT count(*) FROM public.kids_retention_notices WHERE parent_id='${user}' AND recipient_email IS NOT NULL),
        'own_mail',(SELECT count(*) FROM public.contact_acknowledgement_outbox WHERE id='${child}'),
        'own_mail_receipts',(SELECT count(*) FROM public.contact_mail_receipts WHERE event_id='receipt_${child}'),
        'other_mail',(SELECT count(*) FROM public.contact_acknowledgement_outbox WHERE id='${otherChild}'),
        'email_snapshot',(SELECT contact_recipient FROM billing.account_deletion_lifecycle WHERE user_id='${user}'));
      ROLLBACK;`);
      expect(out).toContain('"stage": "complete"');
      expect(out).toContain('"own_visits_before_auth_delete" : 0, "other_visits" : 2');
      expect(out).toContain(
        '"removed" : 0, "other_progress" : 1, "receipts" : 1, "recipients" : 0, "own_mail" : 0, "own_mail_receipts" : 0, "other_mail" : 1, "email_snapshot" : null',
      );
    });

    it("serializes workers and rehearses the actual pause script without restoring access or erasing the identity", async () => {
      const user = randomUUID();
      psql(`${enable} ${seed(user)}`);
      const results = await psqlConcurrent([
        `BEGIN; ${service} SELECT public.lc09_claim_deletion('${user}'); SELECT pg_sleep(0.15); COMMIT;`,
        `BEGIN; ${service} SELECT public.lc09_claim_deletion('${user}'); COMMIT;`,
      ]);
      expect(results.filter((r) => r.ok)).toHaveLength(1);
      expect(results.filter((r) => !r.ok)[0].out).toContain("LC09_WORKER_BUSY");
      expect(
        psql(`SELECT count(*) FROM billing.account_deletion_lifecycle WHERE user_id='${user}'`),
      ).toBe("1");
      psql(readFileSync("docs/launch/lc09-finalizer-pause.sql", "utf8"));
      expect(psql("SELECT enabled FROM billing.account_deletion_control")).toBe("f");
      expect(
        psql(
          `${service} SELECT billing.evaluate_access('${user}','lesson','builder:intro')->>'allowed'`,
        )
          .split("\n")
          .at(-1),
      ).toBe("false");
      expect(
        psqlAllowFail(`${service} SELECT public.lc09_claim_deletion('${user}')`).out,
      ).toContain("LC09_DISABLED");
      expect(psql(`SELECT count(*) FROM auth.users WHERE id='${user}'`)).toBe("1");
      psql(
        `${enable} UPDATE billing.account_deletion_lifecycle SET lease_until=now()-interval '1 second' WHERE user_id='${user}';`,
      );
      expect(psql(`${service} SELECT public.lc09_claim_deletion('${user}')`)).toContain(
        '"stage": "blocked"',
      );
    });

    it("serializes a late Kids paid event behind deletion and records it without granting access", async () => {
      const user = randomUUID(),
        suffix = user.replaceAll("-", "");
      psql(`${enable} ${seed(user)}
      INSERT INTO billing.gateway_customers(user_id,gateway_code,gateway_customer_id,status)
        VALUES('${user}','stripe_us','cus_${suffix}','active');`);
      const results = await psqlConcurrent([
        `BEGIN; ${service} SELECT public.lc09_claim_deletion('${user}'); SELECT pg_sleep(0.15); COMMIT;`,
        `BEGIN; ${service} SELECT pg_sleep(0.05); SELECT public.apply_kids_stripe_event(
        'evt_${suffix}','${user}','sub_${suffix}','cus_${suffix}','price_native','active',now(),true,
        'in_${suffix}',now(),now()+interval '1 month'); COMMIT;`,
      ]);
      expect(
        results.every((r) => r.ok),
        JSON.stringify(results),
      ).toBe(true);
      expect(
        psql(`SELECT count(*) FROM public.kids_family_entitlements WHERE parent_id='${user}'`),
      ).toBe("0");
      expect(
        psql(`SELECT count(*) FROM billing.webhook_events WHERE gateway_event_id='evt_${suffix}'`),
      ).toBe("1");
    });
    it("executes the financial purge on the full cumulative schema after the fifteen-day boundary", () => {
      const user = randomUUID(),
        other = randomUUID(),
        sub = randomUUID(),
        payment = randomUUID();
      const result = psql(`BEGIN; ${service}
        UPDATE billing.account_deletion_control SET financial_purge_enabled=true;
        INSERT INTO billing.account_deletion_requests(user_id) VALUES('${user}');
        INSERT INTO billing.account_deletion_lifecycle(user_id,stage,completed_at,financial_retention_reference,crm_retention_reference,release_reference)
          VALUES('${user}','complete',now(),'OWNER-FINANCIAL-15D-01','separate-crm','native');
        INSERT INTO billing.subscriptions(id,user_id,access_state,billing_state,market_code,currency_code,billing_interval,idempotency_key)
          VALUES('${sub}','${user}','suspended','canceled','EG','EGP','month','native-finance-${user}');
        INSERT INTO billing.gateway_customers(user_id,gateway_code,gateway_customer_id,status)
          VALUES('${user}','stripe_us','cus_${user.replaceAll("-", "")}','active'),
          ('${other}','stripe_us','cus_${other.replaceAll("-", "")}','active');
        INSERT INTO billing.payment_transactions(id,user_id,subscription_id,gateway_code,gateway_transaction_id,transaction_type,status,amount_minor,currency_code,idempotency_key,initiated_at)
          VALUES('${payment}','${user}','${sub}','stripe_us','in_${user.replaceAll("-", "")}','checkout','succeeded',1000,'EGP','native-payment-${user}',now());
        INSERT INTO billing.refunds(payment_transaction_id,refund_type,status,amount_minor,currency_code,reason_code,gateway_code,idempotency_key,requested_at)
          VALUES('${payment}','manual','succeeded',1000,'EGP','synthetic','stripe_us','native-refund-${user}',now());
        INSERT INTO public.kids_stripe_events(event_id,parent_id) VALUES('evt_${user.replaceAll("-", "")}','${user}');
        UPDATE billing.account_deletion_lifecycle SET completed_at=now()-interval '361 hours' WHERE user_id='${user}';
        CREATE TEMP TABLE financial_claim AS SELECT public.lc09_claim_financial_purge('${user}') AS claim;
        SELECT public.lc09_complete_financial_purge('${user}',(SELECT (claim->>'lease_token')::uuid FROM financial_claim));
        SELECT json_build_object('own',(SELECT count(*) FROM billing.payment_transactions WHERE user_id='${user}'),
          'other',(SELECT count(*) FROM billing.gateway_customers WHERE user_id='${other}'),
          'kids',(SELECT count(*) FROM public.kids_stripe_events WHERE parent_id='${user}'),
          'receipt',(SELECT count(*) FROM billing.account_deletion_lifecycle WHERE user_id='${user}' AND financial_purged_at IS NOT NULL));
        ROLLBACK;`);
      expect(result).toContain('"stage": "financial_purged"');
      expect(result).toContain('"own" : 0, "other" : 1, "kids" : 0, "receipt" : 1');
    });

    it("serializes financial workers and a late paid event without recreating finance", async () => {
      const user = randomUUID(),
        suffix = user.replaceAll("-", "");
      psql(`UPDATE billing.account_deletion_control SET financial_purge_enabled=true;
        INSERT INTO billing.account_deletion_requests(user_id) VALUES('${user}');
        INSERT INTO billing.account_deletion_lifecycle(user_id,stage,completed_at,financial_retention_reference,crm_retention_reference,release_reference)
          VALUES('${user}','complete',now()-interval '361 hours','OWNER-FINANCIAL-15D-01','separate-crm','native');`);
      const claims = await psqlConcurrent([
        `BEGIN; ${service} SELECT public.lc09_claim_financial_purge('${user}'); SELECT pg_sleep(0.15); COMMIT;`,
        `BEGIN; ${service} SELECT public.lc09_claim_financial_purge('${user}'); COMMIT;`,
      ]);
      expect(claims.filter((r) => r.ok)).toHaveLength(1);
      expect(claims.find((r) => !r.ok)?.out).toContain("LC09_FINANCIAL_WORKER_BUSY");
      const lease = psql(
        `SELECT financial_lease_token FROM billing.account_deletion_lifecycle WHERE user_id='${user}'`,
      );
      const race = await psqlConcurrent([
        `BEGIN; ${service} SELECT public.lc09_complete_financial_purge('${user}','${lease}'); SELECT pg_sleep(0.15); COMMIT;`,
        `BEGIN; ${service} SELECT public.apply_kids_stripe_event('evt_${suffix}','${user}','sub_${suffix}','cus_${suffix}',
          'unknown','active',now(),true,'in_${suffix}',now(),now()+interval '1 month'); COMMIT;`,
      ]);
      expect(
        race.every((r) => r.ok),
        JSON.stringify(race),
      ).toBe(true);
      expect(psql(`SELECT count(*) FROM public.kids_stripe_events WHERE parent_id='${user}'`)).toBe(
        "0",
      );
      expect(
        psql(`SELECT count(*) FROM billing.payment_transactions WHERE user_id='${user}'`),
      ).toBe("0");
    });

    it("exposes neither financial erasure nor a deletion batch to a browser", () => {
      for (const call of [
        `public.lc09_financial_purge_candidates()`,
        `public.lc09_deletion_candidates()`,
        `public.lc09_financial_expired('${randomUUID()}')`,
      ]) {
        expect(
          psqlAllowFail(`BEGIN; SET LOCAL ROLE authenticated; SELECT ${call}; ROLLBACK;`).ok,
        ).toBe(false);
      }
      expect(
        psql(
          "SELECT has_table_privilege('authenticated','billing.account_deletion_lifecycle','SELECT')",
        ),
      ).toBe("f");
    });
  },
);
