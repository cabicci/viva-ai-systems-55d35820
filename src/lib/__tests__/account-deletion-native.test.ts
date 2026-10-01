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
  },
);
