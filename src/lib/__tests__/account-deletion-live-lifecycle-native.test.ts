// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { psql } from "../../../scripts/billing/disposable-db";

// Independently selected; all native mutations roll back.
export const M17_NATIVE_FIXTURE = String.raw`SELECT set_config('masaarat.stripe_environment','live',true);
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
INSERT INTO billing.account_deletion_control(singleton,enabled,financial_purge_enabled,financial_retention_reference,crm_retention_reference,responder_reference,release_reference)
 VALUES(true,true,true,'OWNER-FINANCIAL-15D-01','synthetic-crm','synthetic-responder','synthetic-release')
 ON CONFLICT(singleton) DO UPDATE SET enabled=true,financial_purge_enabled=true,
 financial_retention_reference='OWNER-FINANCIAL-15D-01',crm_retention_reference='synthetic-crm',responder_reference='synthetic-responder',release_reference='synthetic-release';
DO $helper_acl$
BEGIN
 IF has_function_privilege('service_role','public.m17_previous_advance_deletion(uuid,uuid,text)','EXECUTE')
 OR has_function_privilege('service_role','public.m17_previous_complete_financial_purge(uuid,uuid,boolean)','EXECUTE')
 OR has_function_privilege('service_role','public.m17_previous_claim_financial_purge(uuid)','EXECUTE')
 THEN RAISE EXCEPTION 'M17_UNGUARDED_HELPER_EXPOSED'; END IF;
END $helper_acl$;
CREATE TEMP TABLE m17_checks(name text PRIMARY KEY);
CREATE FUNCTION pg_temp.m17_check(name text,passed boolean) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF passed IS DISTINCT FROM true THEN RAISE EXCEPTION 'M17_ASSERT: %',name; END IF;
 INSERT INTO m17_checks VALUES(name); END $$;
CREATE FUNCTION pg_temp.m17_denied(name text,statement text,expected text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
 BEGIN EXECUTE statement; RAISE EXCEPTION 'M17_EXPECTED_DENIAL';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>expected THEN RAISE; END IF; END;
 INSERT INTO m17_checks VALUES(name);
END $$;
DO $m17$
DECLARE u uuid:=gen_random_uuid(); other_user uuid:=gen_random_uuid(); g uuid:=gen_random_uuid(); sid uuid:=gen_random_uuid();
 purchase uuid:=gen_random_uuid(); attempt uuid:=gen_random_uuid(); token uuid; claim jsonb; customer text:='cus_m17native';
 proof text; obs text;
BEGIN
 INSERT INTO auth.users(id,email,email_confirmed_at) VALUES(u,u||'@example.test',now()),(other_user,other_user||'@example.test',now());
 INSERT INTO billing.gateway_customers(user_id,gateway_code,gateway_customer_id,status,metadata,stripe_environment)
 VALUES(u,'stripe_us_live',customer,'active','{"mode":"live"}','live'),(other_user,'stripe_us_live','cus_m17other','active','{"mode":"live"}','live');
 INSERT INTO billing.subscriptions(id,user_id,access_state,billing_state,market_code,currency_code,billing_interval,idempotency_key,checkout_generation,checkout_started_at)
 VALUES(sid,u,'suspended','checkout_pending','EG','EGP','month','m17-native',g,now());
 INSERT INTO billing.commercial_purchases(id,user_id,kind,wallet_scope,amount_minor,currency,request_id,parameters,price_id,product_id)
 VALUES(purchase,u,'question_topup','account',5000,'EGP',gen_random_uuid(),'{}','price_m17','prod_m17');
 INSERT INTO billing.account_checkout_attempts(id,user_id,idempotency_key,parameters,checkout_scope,checkout_environment,selection_parameters,session_expires_at,create_started_at)
 VALUES(attempt,u,'scoped-kids-live-'||attempt,'synthetic','kids','live','synthetic',now()+interval '1 day',now());
 INSERT INTO billing.account_deletion_requests(user_id) VALUES(u);
 claim:=public.lc09_claim_live_deletion(u); token:=(claim->>'lease_token')::uuid;
 PERFORM pg_temp.m17_check('claim owns actor and bounded lease',claim->>'user_id'=u::text AND token IS NOT NULL AND (claim->>'lease_until')::timestamptz>(claim->>'server_time')::timestamptz);
 PERFORM pg_temp.m17_check('inventories include all pending scopes',jsonb_array_length(claim->'core_checkouts')=1 AND jsonb_array_length(claim->'commercial_checkouts')=1 AND jsonb_array_length(claim->'checkout_attempts')=1 AND jsonb_array_length(claim->'holds')=3);
 proof:=format('SELECT public.lc09_record_live_checkout_proof(%L,%L,''core'',%L,''cs_live_m17core'',%L,',u,token,g,customer);
 obs:=proof||'''observed'')';
 PERFORM pg_temp.m17_denied('null proof lease',replace(obs,quote_literal(token::text),'NULL'),'LC09_LEASE_LOST');
 PERFORM pg_temp.m17_denied('stolen proof lease',replace(obs,quote_literal(token::text),quote_literal(gen_random_uuid()::text)),'LC09_LEASE_LOST');
 PERFORM pg_temp.m17_denied('cross user proof',replace(obs,quote_literal(u::text),quote_literal(other_user::text)),'LC09_LEASE_LOST');
 PERFORM pg_temp.m17_denied('cross generation proof',replace(obs,quote_literal(g::text),quote_literal(gen_random_uuid()::text)),'LC09_LIVE_PROOF_BINDING');
 PERFORM pg_temp.m17_denied('foreign customer proof',replace(obs,quote_literal(customer),'''cus_m17other'''),'LC09_LIVE_PROOF_CUSTOMER');
 PERFORM pg_temp.m17_denied('test session proof',replace(obs,'cs_live_m17core','cs_test_m17core'),'LC09_LIVE_PROOF_INVALID');
 PERFORM pg_temp.m17_denied('null disposition',proof||'NULL)','LC09_LIVE_PROOF_INVALID');
 PERFORM pg_temp.m17_denied('expired with payment proof',proof||'''expired'',NULL,''pi_m17'')','LC09_LIVE_PROOF_INVALID');
 UPDATE billing.account_deletion_lifecycle SET lease_until=clock_timestamp()-interval '1 second' WHERE user_id=u;
 PERFORM pg_temp.m17_denied('expired proof lease',obs,'LC09_LEASE_LOST');
 PERFORM pg_temp.m17_denied('expired renewal cannot resurrect',format('SELECT public.lc09_renew_live_lifecycle_lease(%L,%L,''deletion'')',u,token),'LC09_LEASE_LOST');
 UPDATE billing.account_deletion_lifecycle SET lease_until=clock_timestamp()+interval '5 minutes' WHERE user_id=u;
 PERFORM set_config('request.jwt.claims','{"role":"authenticated"}',true);
 PERFORM pg_temp.m17_denied('proof service only',obs,'LC09_SERVICE_ONLY');
 PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
 PERFORM pg_temp.m17_check('browser proof privilege absent',NOT has_function_privilege('authenticated','public.lc09_record_live_checkout_proof(uuid,uuid,text,uuid,text,text,text,text,text)','EXECUTE'));
 PERFORM pg_temp.m17_check('service proof privilege',has_function_privilege('service_role','public.lc09_record_live_checkout_proof(uuid,uuid,text,uuid,text,text,text,text,text)','EXECUTE'));
 EXECUTE obs; EXECUTE obs;
 PERFORM pg_temp.m17_check('observed core identity survives deletion',(SELECT checkout_session_id='cs_live_m17core' AND access_state='suspended' AND billing_state='checkout_pending' FROM billing.subscriptions WHERE id=sid));
 PERFORM pg_temp.m17_denied('core immutable session',replace(obs,'cs_live_m17core','cs_live_changed'),'LC09_LIVE_PROOF_BINDING');
 PERFORM pg_temp.m17_denied('old advance seam null lease',format('SELECT public.lc09_advance_deletion(%L,NULL,''learner_erased'')',u),'LC09_LEASE_LOST');
 PERFORM pg_temp.m17_denied('pending attempts gate old advance',format('SELECT public.lc09_advance_deletion(%L,%L,''provider_reconciled'')',u,token),'LC09_LIVE_RECONCILIATION_PENDING');
 PERFORM pg_temp.m17_check('renew returns current holds',jsonb_array_length(public.lc09_renew_live_lifecycle_lease(u,token,'deletion')->'holds')=3);
 EXECUTE proof||'''completed_terminal'',''sub_m17'')';
 PERFORM pg_temp.m17_check('core terminal grants no access',(SELECT billing_state='canceled' AND access_state='suspended' AND checkout_session_id='cs_live_m17core' FROM billing.subscriptions WHERE id=sid));
 EXECUTE proof||'''completed_terminal'',''sub_m17'')';
 PERFORM pg_temp.m17_check('terminal recording does not erase',EXISTS(SELECT 1 FROM auth.users WHERE id=u));
 UPDATE billing.subscriptions SET billing_state='checkout_pending',checkout_generation=gen_random_uuid(),checkout_session_id=NULL WHERE id=sid RETURNING checkout_generation INTO g;
 PERFORM public.lc09_record_live_checkout_proof(u,token,'core',g,'cs_live_m17expired',customer,'observed');
 PERFORM pg_temp.m17_check('expired core first',public.lc09_record_live_checkout_proof(u,token,'core',g,'cs_live_m17expired',customer,'expired'));
 PERFORM pg_temp.m17_check('expired core idempotent',public.lc09_record_live_checkout_proof(u,token,'core',g,'cs_live_m17expired',customer,'expired'));
 PERFORM public.lc09_record_live_checkout_proof(u,token,'commercial',purchase,'cs_live_m17purchase',customer,'observed');
 PERFORM public.lc09_record_live_checkout_proof(u,token,'commercial',purchase,'cs_live_m17purchase',customer,'observed');
 PERFORM pg_temp.m17_check('commercial capture no fulfillment',(SELECT session_id='cs_live_m17purchase' AND state='pending' AND paid_at IS NULL AND provider_event_id IS NULL FROM billing.commercial_purchases WHERE id=purchase));
 PERFORM pg_temp.m17_denied('commercial wrong session',format('SELECT public.lc09_record_live_checkout_proof(%L,%L,''commercial'',%L,''cs_live_changed'',%L,''observed'')',u,token,purchase,customer),'LC09_LIVE_PROOF_BINDING');
 PERFORM pg_temp.m17_denied('commercial cannot fake settlement',format('SELECT public.lc09_record_live_checkout_proof(%L,%L,''commercial'',%L,''cs_live_m17purchase'',%L,''completed_terminal'')',u,token,purchase,customer),'LC09_LIVE_PROOF_INVALID');
 PERFORM pg_temp.m17_check('commercial expiry first',public.lc09_record_live_checkout_proof(u,token,'commercial',purchase,'cs_live_m17purchase',customer,'expired'));
 PERFORM pg_temp.m17_check('commercial expiry idempotent',public.lc09_record_live_checkout_proof(u,token,'commercial',purchase,'cs_live_m17purchase',customer,'expired'));
 PERFORM public.lc09_record_live_checkout_proof(u,token,'commercial',purchase,'cs_live_m17purchase',customer,'observed',NULL,'pi_m17observed');
 PERFORM pg_temp.m17_check('payment identity recorded without fulfillment',(SELECT payment_id='pi_m17observed' AND state='expired' AND paid_at IS NULL FROM billing.commercial_purchases WHERE id=purchase));
 PERFORM pg_temp.m17_check('ordinary expiry refusal preserves captured identity',NOT public.lc09_record_live_checkout_proof(u,token,'commercial',purchase,'cs_live_m17purchase',customer,'expired'));
 PERFORM pg_temp.m17_denied('payment identity immutable',format('SELECT public.lc09_record_live_checkout_proof(%L,%L,''commercial'',%L,''cs_live_m17purchase'',%L,''observed'',NULL,''pi_changed'')',u,token,purchase,customer),'LC09_LIVE_PROOF_BINDING');
 PERFORM pg_temp.m17_check('unsettled payment after expiry remains held',EXISTS(SELECT 1 FROM jsonb_array_elements(billing.lc09_live_financial_holds(u)) h WHERE h->>'reason'='commercial_pending'));
 -- Fixture-only authoritative signed settlement outcome, not a worker action.
 UPDATE billing.commercial_purchases SET state='fulfilled',provider_event_id='evt_m17settled',paid_at=now() WHERE id=purchase;
 PERFORM pg_temp.m17_check('scoped attach captures despite blocked grant',NOT public.attach_scoped_checkout_intent(u,'kids',attempt,'scoped-kids-live-'||attempt,'cs_live_m17scoped'));
 PERFORM pg_temp.m17_check('close scoped identity',public.close_scoped_checkout_intent(u,'kids',attempt,'scoped-kids-live-'||attempt,'cs_live_m17scoped','expired'));
 INSERT INTO billing.commercial_payment_holds(event_id,session_id,reason) VALUES('evt_m17risk','cs_live_m17purchase','synthetic');
 PERFORM pg_temp.m17_denied('risk prevents advancement',format('SELECT public.lc09_advance_deletion(%L,%L,''provider_reconciled'')',u,token),'LC09_LIVE_RECONCILIATION_PENDING');
 PERFORM pg_temp.m17_check('risk retains identity',EXISTS(SELECT 1 FROM billing.account_checkout_attempts WHERE id=attempt) AND EXISTS(SELECT 1 FROM billing.commercial_purchases WHERE id=purchase));
 -- Fixture-only authoritative resolution, never invoked by the worker.
 DELETE FROM billing.commercial_payment_holds WHERE event_id='evt_m17risk';
 PERFORM public.lc09_advance_deletion(u,token,'provider_reconciled');
 PERFORM public.lc09_advance_deletion(u,token,'learner_erased');
 PERFORM pg_temp.m17_check('live proof retained after learner erasure',EXISTS(SELECT 1 FROM billing.account_checkout_attempts WHERE id=attempt AND resolved_at IS NOT NULL));
 PERFORM pg_temp.m17_check('other customer preserved',EXISTS(SELECT 1 FROM billing.gateway_customers WHERE user_id=other_user));
 DELETE FROM auth.users WHERE id=u;
 PERFORM public.lc09_advance_deletion(u,token,'complete');
 PERFORM pg_temp.m17_check('existing fifteen day deadline',(SELECT financial_due_at=completed_at+interval '360 hours' FROM billing.account_deletion_lifecycle WHERE user_id=u));
 PERFORM pg_temp.m17_denied('financial expiry not accelerated',format('SELECT public.lc09_claim_live_financial_purge(%L)',u),'LC09_FINANCIAL_NOT_DUE');
 UPDATE billing.account_deletion_lifecycle SET completed_at=now()-interval '361 hours' WHERE user_id=u;
 claim:=public.lc09_claim_live_financial_purge(u); token:=(claim->>'lease_token')::uuid;
 PERFORM pg_temp.m17_check('financial claim current lease',claim->>'stage'='financial_due' AND token IS NOT NULL);
 PERFORM pg_temp.m17_check('financial renew token',public.lc09_renew_live_lifecycle_lease(u,token,'financial')->>'lease_token'=token::text);
 PERFORM pg_temp.m17_denied('financial null token denied',format('SELECT public.lc09_complete_financial_purge(%L,NULL,false)',u),'LC09_FINANCIAL_LEASE_LOST');
 PERFORM pg_temp.m17_denied('financial wrong token denied',format('SELECT public.lc09_complete_financial_purge(%L,%L,false)',u,gen_random_uuid()),'LC09_FINANCIAL_LEASE_LOST');
 INSERT INTO billing.commercial_payment_holds(event_id,session_id,reason) VALUES('evt_m17late','cs_live_m17purchase','synthetic-late');
 PERFORM pg_temp.m17_denied('late financial hold prevents purge',format('SELECT public.lc09_complete_financial_purge(%L,%L,false)',u,token),'LC09_LIVE_RECONCILIATION_PENDING');
 PERFORM pg_temp.m17_check('late financial hold retains attempts',EXISTS(SELECT 1 FROM billing.account_checkout_attempts WHERE id=attempt));
 DELETE FROM billing.commercial_payment_holds WHERE event_id='evt_m17late';
 PERFORM public.lc09_complete_financial_purge(u,token,false);
 PERFORM pg_temp.m17_check('proof erased only at financial purge',NOT EXISTS(SELECT 1 FROM billing.account_checkout_attempts WHERE id=attempt));
 PERFORM pg_temp.m17_check('terminal and other owner intact',EXISTS(SELECT 1 FROM billing.account_deletion_lifecycle WHERE user_id=u AND financial_purged_at IS NOT NULL) AND EXISTS(SELECT 1 FROM billing.gateway_customers WHERE user_id=other_user));
END $m17$;
-- Existing Test account erasure remains on its original path.
SELECT set_config('masaarat.stripe_environment','test',true);
DO $test_preserved$
DECLARE u uuid:=gen_random_uuid(); a uuid:=gen_random_uuid(); c jsonb; token uuid;
BEGIN
 INSERT INTO auth.users(id,email,email_confirmed_at) VALUES(u,u||'@example.test',now());
 INSERT INTO billing.gateway_customers(user_id,gateway_code,gateway_customer_id,status,metadata,stripe_environment)
 VALUES(u,'stripe_us','cus_m17test','active','{"mode":"test"}','test');
 INSERT INTO billing.account_checkout_attempts(id,user_id,idempotency_key,parameters,state,session_id)
 VALUES(a,u,'m17-test-only','synthetic','reconciled','cs_test_m17');
 INSERT INTO billing.account_deletion_requests(user_id) VALUES(u);
 c:=public.lc09_claim_deletion(u);token:=(c->>'lease_token')::uuid;
 PERFORM pg_temp.m17_check('Test account not reclassified Live',NOT billing.lc09_requires_live_reconciliation(u));
 PERFORM public.lc09_advance_deletion(u,token,'provider_reconciled');
 PERFORM public.lc09_advance_deletion(u,token,'learner_erased');
 PERFORM pg_temp.m17_check('Test attempts retain original erasure timing',NOT EXISTS(SELECT 1 FROM billing.account_checkout_attempts WHERE id=a));
 DELETE FROM auth.users WHERE id=u;
 PERFORM public.lc09_advance_deletion(u,token,'complete');
 PERFORM pg_temp.m17_check('Test account still completes',(SELECT stage='complete' FROM billing.account_deletion_lifecycle WHERE user_id=u));
END $test_preserved$;
SELECT 'M17_NATIVE_CHECKS='||count(*) FROM m17_checks;
SELECT name FROM m17_checks ORDER BY name;
`;
describe.skipIf(process.env.M17_DISPOSABLE_DB !== "1")("M17 Live lifecycle native guards", () => {
  it("retains proof until the existing financial deadline", () => {
    const migration40 = readFileSync("drizzle/migrations/0041_scoped_checkout_intents.sql", "utf8");
    const migration41 = readFileSync("drizzle/migrations/0042_live_account_lifecycle.sql", "utf8");
    const result = psql("BEGIN;\n" + migration40 + "\n" + migration41 + "\n" + M17_NATIVE_FIXTURE + "\nROLLBACK;");
    expect(result).toContain("M17_NATIVE_CHECKS=52");
  });
});
