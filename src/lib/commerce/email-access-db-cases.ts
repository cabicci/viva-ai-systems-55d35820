// Imported by the cumulative commerce DB suite: share its single disposable DB,
// avoiding competing schema creation against the native PostgreSQL CI service.
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { describe, beforeEach, afterEach, it, expect } from "vitest";
type Db = { query<T>(sql: string, args?: unknown[]): Promise<{ rows: T[] }>; exec(sql: string): Promise<unknown> };
type Grant = { id: string; status: string; user_id: string | null; activated_at: string | null; ends_at: string | null; audit: { action: string }[] };
export function emailAccessDbCases(getDb: () => Db, ids: { admin: string; user: string; other: string }) {
  const { admin, user, other } = ids;
  const query = <T = unknown>(sql: string, args?: unknown[]) => getDb().query<T>(sql, args);
  const val = async <T = unknown>(sql: string, args?: unknown[]) => (await query<{ value: T }>(sql, args)).rows[0]?.value;
  const caller = (id: string) => query("SELECT set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role','authenticated',false)", [id]);
  const command = <T = { id: string }>(action: string, data: unknown = {}) => val<T>("SELECT public.email_access_command($1,$2::jsonb) AS value", [action, JSON.stringify(data)]);
  const create = (extra: Record<string, unknown> = {}) => command("create", {
    email: "member@example.test", scope_mode: "all_published", catalogues: [],
    duration_days: 30, invitation: false, locale: "en", key: randomUUID(), ...extra,
  });
  const row = async (id: string) => (await command<{ grants: Grant[] }>("list")).grants.find(g => g.id === id)!;
  const deny = async (work: () => Promise<unknown>, error: RegExp) => {
    await getDb().exec("SAVEPOINT email_denied");
    try { await expect(work()).rejects.toThrow(error); }
    finally { await getDb().exec("ROLLBACK TO SAVEPOINT email_denied; RELEASE SAVEPOINT email_denied"); }
  };
  describe("pre-registration email access grants on cumulative PostgreSQL", () => {
    beforeEach(async () => {
      await getDb().exec("BEGIN");
      await caller(admin);
      await getDb().exec(`UPDATE public.technical_release_control SET enabled=true;
       INSERT INTO public.technical_lesson_content VALUES('M01-L02','en','lesson','{}',gen_random_uuid(),repeat('a',64));
       UPDATE public.academic_courses SET enabled=true WHERE id='AC-BUS';
       INSERT INTO public.academic_courses(id,titles,enabled) VALUES('AC-OTHER','{"en":"Other","ar-EG":"Other","ar-MSA":"Other","ar-Gulf":"Other"}',true);
       INSERT INTO public.academic_lesson_content(course_id,lesson_id,locale,position,approved,payload,source_sha256)
        VALUES('AC-BUS','AC-BUS-M01-L02','en',2,true,'{"title":"Synthetic","quiz":[]}',repeat('a',64)),
        ('AC-BUS','AC-BUS-M01-L02','ar-EG',2,false,'{}',repeat('a',64)),
        ('AC-OTHER','AC-OTHER-M01-L02','en',2,true,'{}',repeat('a',64));
       UPDATE public.kids_release_control SET accepts_child_data=true,lesson_access_enabled=true;
       INSERT INTO public.kids_content_approvals VALUES('level-1',3,'en',now(),'synthetic-only');`);
    });
    afterEach(async () => { await getDb().exec("ROLLBACK"); await getDb().exec("RESET ROLE"); });
    it("stores pending without an Auth account, then activates in verification transaction before initial access", async () => {
      const id = (await create({ email: "  Future@Example.test " })).id, newUser = randomUUID();
      expect((await row(id)).status).toBe("pending_registration");
      expect(await val("SELECT count(*)::int AS value FROM auth.users WHERE lower(email)='future@example.test'")).toBe(0);
      await query("UPDATE billing.email_access_grants SET created_at=now()-interval '90 days' WHERE id=$1", [id]);
      await query("INSERT INTO auth.users(id,email) VALUES($1,'Future@example.test')", [newUser]);
      expect((await row(id)).user_id).toBeNull();
      await caller(newUser);
      await deny(() => val("SELECT public.activate_my_email_access_grants() AS value"), /IDENTITY_UNAVAILABLE/);
      expect(await val("SELECT public.get_my_billing_access_tier() AS value")).toBe("free");
      await query("UPDATE auth.users SET email_confirmed_at=now() WHERE id=$1", [newUser]);
      // This is the first authenticated access reader, no client claim call.
      expect(await val("SELECT public.get_my_billing_access_tier() AS value")).toBe("pro_plus");
      expect(await val("SELECT (ends_at-activated_at)=interval '30 days' AS value FROM billing.email_access_grants WHERE id=$1", [id])).toBe(true);
      await caller(admin);
      const grant = await row(id);
      expect(grant.status).toBe("active"); expect(grant.user_id).toBe(newUser);
      expect(grant.audit.map(a => a.action).sort()).toEqual(["activated", "created"]);
      expect(await val("SELECT count(*)::int AS value FROM public.user_roles WHERE user_id=$1", [newUser])).toBe(0);
    });
    it("activates an already verified account immediately, including verified OAuth registration inserts", async () => {
      const id = (await create()).id;
      expect((await row(id)).user_id).toBe(user);
      const newUser = randomUUID(), pending = (await create({ email: "oauth@example.test", duration_days: null })).id;
      await query("INSERT INTO auth.users(id,email,email_confirmed_at) VALUES($1,'oauth@example.test',now())", [newUser]);
      expect((await row(pending)).status).toBe("active"); expect((await row(pending)).ends_at).toBeNull();
    });
    it("keeps existing unverified accounts pending until verification", async () => {
      await query("UPDATE auth.users SET email_confirmed_at=NULL WHERE id=$1", [user]);
      const id = (await create()).id;
      expect((await row(id)).status).toBe("pending_registration");
      await query("UPDATE auth.users SET email_confirmed_at=now() WHERE id=$1", [user]);
      expect((await row(id)).user_id).toBe(user);
    });
    it("idempotently retries creation and activation without restarting duration or duplicating audit/mail", async () => {
      const key = randomUUID(), id = (await create({ key, invitation: true })).id;
      expect((await create({ key, invitation: true })).id).toBe(id);
      await deny(() => create({ key, duration_days: 10 }), /KEY_CONFLICT/);
      const original = await row(id); await caller(user);
      expect(await val("SELECT public.activate_my_email_access_grants() AS value")).toBe(0);
      await query("UPDATE auth.users SET email_confirmed_at=email_confirmed_at WHERE id=$1", [user]);
      await caller(admin);
      expect((await row(id)).activated_at).toBe(original.activated_at);
      expect((await row(id)).audit.filter(a => a.action === "activated")).toHaveLength(1);
      expect(await val("SELECT count(*)::int AS value FROM billing.email_access_mail WHERE id=$1", [id])).toBe(1);
    });
    it("rejects wrong-email, JWT metadata, direct-table and private helper claims; verifies ownership changes", async () => {
      const id = (await create({ email: "future@example.test" })).id;
      await caller(other);
      await query("SELECT set_config('request.jwt.claim.email','future@example.test',false)");
      expect(await val("SELECT public.activate_my_email_access_grants() AS value")).toBe(0);
      await getDb().exec("SET LOCAL ROLE authenticated");
      await deny(() => query("SELECT billing.email_access_activate($1)", [user]), /permission denied/);
      await deny(() => query("UPDATE billing.email_access_grants SET user_id=$1 WHERE id=$2", [other, id]), /permission denied/);
      await getDb().exec("RESET ROLE");
      await caller(admin); expect((await row(id)).status).toBe("pending_registration");
      const active = (await create()).id; await caller(user);
      expect(await val("SELECT public.get_my_billing_access_tier() AS value")).toBe("pro_plus");
      await query("UPDATE auth.users SET email='changed@example.test',email_confirmed_at=NULL WHERE id=$1", [user]);
      expect(await val("SELECT public.get_my_billing_access_tier() AS value")).toBe("free");
      await caller(admin); expect((await row(active)).user_id).toBe(user);
    });
    it("rechecks stored administrator role and verified/lifecycle identity on every command", async () => {
      await caller(other); await deny(() => command("list"), /ADMIN_REQUIRED/);
      await caller(admin); await query("DELETE FROM public.user_roles WHERE user_id=$1", [admin]);
      await deny(() => create(), /ADMIN_REQUIRED/);
    });
    it("revokes pending grants before registration and audits the action without creating a user", async () => {
      const id = (await create({ email: "revoked@example.test", invitation: true })).id;
      const key = randomUUID();
      await command("revoke", { id, key }); await command("revoke", { id, key });
      await query("INSERT INTO auth.users(id,email,email_confirmed_at) VALUES($1,'revoked@example.test',now())", [randomUUID()]);
      const g = await row(id); expect(g.status).toBe("revoked"); expect(g.user_id).toBeNull();
      expect(g.audit.filter(a => a.action === "revoked")).toHaveLength(1);
      expect(await val("SELECT status AS value FROM billing.email_access_mail WHERE id=$1", [id])).toBe("suppressed");
    });
    it("extends active grants exactly once, expires naturally, and can extend expired access from now", async () => {
      const id = (await create({ duration_days: 1 })).id, key = randomUUID();
      await command("extend", { id, duration_days: 7, key }); await command("extend", { id, duration_days: 7, key });
      expect(await val("SELECT (ends_at-activated_at)=interval '8 days' AS value FROM billing.email_access_grants WHERE id=$1", [id])).toBe(true);
      await query("UPDATE billing.email_access_grants SET activated_at=now()-interval '10 days',ends_at=now()-interval '1 day' WHERE id=$1", [id]);
      expect((await row(id)).status).toBe("expired");
      await caller(user); expect(await val("SELECT public.get_my_billing_access_tier() AS value")).toBe("free");
      await caller(admin); await command("extend", { id, duration_days: 2, key: randomUUID() });
      expect((await row(id)).status).toBe("active");
      expect(await val("SELECT ends_at=now()+interval '2 days' AS value FROM billing.email_access_grants WHERE id=$1", [id])).toBe(true);
      const forever = (await create({ duration_days: null })).id;
      await deny(() => command("extend", { id: forever, duration_days: 1, key: randomUUID() }), /NOT_EXTENDABLE/);
    });
    it("rejects unpublished/unknown scopes and invalid durations", async () => {
      await deny(() => create({ scope_mode: "selected", catalogues: ["admin"] }), /INVALID_SCOPE/);
      await deny(() => create({ scope_mode: "selected", catalogues: [] }), /INVALID_SCOPE/);
      await deny(() => create({ duration_days: 0 }), /INVALID_INPUT/);
      await getDb().exec("UPDATE public.technical_release_control SET enabled=false");
      await deny(() => create({ scope_mode: "selected", catalogues: ["technical:furniture"] }), /INVALID_SCOPE/);
    });
    it("all-published actually covers AI, Technical and Academic with release/approval/locale gates", async () => {
      await create({ duration_days: null }); await caller(user);
      await getDb().exec("UPDATE public.academic_courses SET assistant_enabled=true");
      expect(await val("SELECT public.academic_assistant_allowed('AC-BUS','AC-BUS-M01-L02','en') AS value")).toBe(false);
      expect(await val("SELECT public.technical_can_access('M01-L02') AS value")).toBe(true);
      expect(await val("SELECT public.academic_can_access('AC-BUS','AC-BUS-M01-L02','en') AS value")).toBe(true);
      expect(await val("SELECT public.academic_can_access('AC-BUS','AC-BUS-M01-L02','ar-EG') AS value")).toBe(false);
      expect(await val("SELECT public.academic_can_access('AC-OTHER','AC-OTHER-M01-L02','en') AS value")).toBe(true);
      expect(await val("SELECT public.technical_can_access('M99-L99') AS value")).toBe(false);
      await getDb().exec("UPDATE public.academic_courses SET enabled=false; UPDATE public.technical_release_control SET enabled=false");
      expect(await val("SELECT public.technical_can_access('M01-L02') AS value")).toBe(false);
      expect(await val("SELECT public.academic_can_access('AC-BUS','AC-BUS-M01-L02','en') AS value")).toBe(false);
    });
    it("selected Academic stays course-scoped; Pro Plus is not access to every catalogue", async () => {
      await create({ scope_mode: "selected", catalogues: ["academic:AC-BUS"] }); await caller(user);
      expect(await val("SELECT public.academic_can_access('AC-BUS','AC-BUS-M01-L02','en') AS value")).toBe(true);
      expect(await val("SELECT public.academic_can_access('AC-OTHER','AC-OTHER-M01-L02','en') AS value")).toBe(false);
      expect(await val("SELECT public.technical_can_access('M01-L02') AS value")).toBe(false);
      expect(await val("SELECT public.get_my_billing_access_tier() AS value")).toBe("free");
      await caller(admin); await create({ email: "other@example.test", scope_mode: "selected", catalogues: ["ai:pro_plus"] }); await caller(other);
      expect(await val("SELECT public.get_my_billing_access_tier() AS value")).toBe("pro_plus");
      expect(await val("SELECT public.academic_can_access('AC-BUS','AC-BUS-M01-L02','en') AS value")).toBe(false);
      expect(await val("SELECT public.technical_can_access('M01-L02') AS value")).toBe(false);
      expect(await val("SELECT public.academic_assistant_allowed('AC-BUS','AC-BUS-M01-L02','en') AS value")).toBe(false);
    });
    it("preserves Kids guardian, country, profile consent and published-locale requirements", async () => {
      await create({ duration_days: null }); await caller(user);
      const profile = randomUUID(), policy = randomUUID();
      await query("INSERT INTO public.kids_profiles(id,parent_id,display_name,level_id) VALUES($1,$2,'Synthetic','level-1')", [profile, user]);
      const can = () => val("SELECT public.kids_can_access_lesson($1,'level-1',3,'en') AS value", [profile]);
      expect(await can()).toBe(false);
      await getDb().exec("UPDATE public.kids_market_release SET accepts_child_data=true,reviewed_at=now(),review_reference='synthetic-only' WHERE country_code='EG'");
      await query("INSERT INTO public.kids_consent_policies(id,country_code,version,locale,notice_text,consent_text,review_reference,enabled) VALUES($1,'EG','synthetic','en',repeat('x',80),repeat('x',20),'synthetic-only',true)", [policy]);
      await query("INSERT INTO public.kids_parent_access_requests(parent_id,parent_email,status,country_code,adult_confirmed) VALUES($1,'member@example.test','approved','EG',true)", [user]);
      await query("INSERT INTO public.kids_parent_attestations(parent_id,policy_id,country_code) VALUES($1,$2,'EG')", [user, policy]);
      expect(await can()).toBe(false);
      await query("INSERT INTO public.kids_profile_consents(profile_id,parent_id,policy_id,guardian_reference) VALUES($1,$2,$3,'synthetic')", [profile, user, policy]);
      expect(await can()).toBe(true);
      expect(await val("SELECT public.kids_can_access_lesson($1,'level-1',3,'ar-EG') AS value", [profile])).toBe(false);
      await caller(other); expect(await can()).toBe(false); await caller(user);
      await query("UPDATE public.kids_profile_consents SET withdrawn_at=now() WHERE profile_id=$1", [profile]); expect(await can()).toBe(false);
      const status = (await query<{ access_source: string; active_until: string }>("SELECT * FROM public.get_my_kids_access_status()")).rows[0];
      expect(status.access_source).toBe("complimentary_email");
      expect(new Date(status.active_until).getUTCFullYear()).toBe(9999);
    });
    it("preserves published AI caps without summing overlaps and maintains core 71/100 lesson contracts", async () => {
      await create({ scope_mode: "selected", catalogues: ["ai:pro"] }); await caller(user);
      const snap = () => val<{ lessons: { entitled_lesson_count: number }; expires_at: string }>("SELECT billing.get_entitlement_snapshot($1) AS value", [user]);
      expect((await snap()).lessons.entitled_lesson_count).toBe(71);
      await caller(admin); const id = (await create({ scope_mode: "selected", catalogues: ["ai:pro_plus"] })).id;
      await query("UPDATE billing.email_access_grants SET ends_at=now()+interval '5 seconds' WHERE id=$1", [id]);
      await caller(user); expect((await snap()).lessons.entitled_lesson_count).toBe(100);
      expect((await query("SELECT * FROM billing.resolve_ai_assistant_limits($1)", [user])).rows[0]).toEqual({ general_monthly_limit: 150, per_lesson_limit: 6 });
      expect(await val("SELECT (billing.get_entitlement_snapshot($1)->>'expires_at')::timestamptz<=now()+interval '5 seconds' AS value", [user])).toBe(true);
      await caller(admin); await create(); await caller(user);
      expect((await query("SELECT * FROM billing.resolve_ai_assistant_limits($1)", [user])).rows[0]).toEqual({ general_monthly_limit: 150, per_lesson_limit: 6 });
    });
    it("expiry/revocation preserve separately valid Stripe and external paid access", async () => {
      await query(`INSERT INTO billing.subscriptions(user_id,plan_version_id,access_state,billing_state,market_code,currency_code,billing_interval,idempotency_key,current_period_start,current_period_end)
       SELECT $1,pv.id,'paid_active','active','EG','EGP','month','email-overlap',now(),now()+interval '30 days'
       FROM billing.plan_versions pv JOIN billing.plan_catalog pc ON pc.id=pv.plan_id WHERE pc.plan_key='pro_plus' AND pv.billing_interval='month' ORDER BY pv.version_number LIMIT 1`, [user]);
      const id = (await create()).id;
      await query("UPDATE billing.email_access_grants SET activated_at=now()-interval '2 days',ends_at=now()-interval '1 day' WHERE id=$1", [id]);
      await caller(user); expect(await val("SELECT public.get_my_billing_access_tier() AS value")).toBe("pro_plus");
      await caller(admin); await command("revoke", { id, key: randomUUID() }); await caller(user);
      expect(await val("SELECT public.get_my_billing_access_tier() AS value")).toBe("pro_plus");
      expect(await val("SELECT access_state AS value FROM billing.subscriptions WHERE user_id=$1", [user])).toBe("paid_active");
      await caller(admin);
      await getDb().exec("UPDATE billing.commerce_control SET enabled=true,access_enabled=true");
      const old = await val<{ id: string }>("SELECT public.commerce_command('grant',$1::jsonb) AS value", [JSON.stringify({ user_id: other, package: "pro", duration_days: 30, reason: "Synthetic", key: randomUUID() })]);
      const second = (await create({ email: "other@example.test" })).id;
      await command("revoke", { id: second, key: randomUUID() }); await caller(other);
      expect(await val("SELECT public.get_my_billing_access_tier() AS value")).toBe("pro");
      expect(await val("SELECT revoked_at IS NULL AS value FROM billing.commerce_grants WHERE id=$1", [old.id])).toBe(true);
    });
    it("blocks suspended accounts without revoking independently valid paid records", async () => {
      await create();
      await query("INSERT INTO billing.subscriptions(user_id,access_state,billing_state,market_code,currency_code,billing_interval,idempotency_key) VALUES($1,'suspended','canceled','EG','EGP','month','email-suspended')", [user]);
      await caller(user); expect(await val("SELECT public.get_my_billing_access_tier() AS value")).toBe("free");
      expect(await val("SELECT public.technical_can_access('M01-L02') AS value")).toBe(false);
    });
    it("preserves separately valid Academic, Technical and Kids access after email-grant revocation", async () => {
      const id = (await create()).id;
      await query("INSERT INTO billing.academic_stripe_subscriptions(user_id,subscription_id,customer_id,price_id,status,last_event_at,starts_at,ends_at) VALUES($1,'synthetic-academic','synthetic-customer','synthetic-price','active',now(),now(),now()+interval '30 days')", [user]);
      await query("INSERT INTO billing.technical_stripe_subscriptions(user_id,subscription_id,customer_id,price_id,status,last_event_at,starts_at,ends_at) VALUES($1,'synthetic-technical','synthetic-customer','synthetic-price','active',now(),now(),now()+interval '30 days')", [user]);
      await query("INSERT INTO public.kids_family_entitlements(parent_id,active_from,active_until,entitlement_reference) VALUES($1,now(),now()+interval '30 days','stripe-test:synthetic')", [user]);
      await command("revoke", { id, key: randomUUID() }); await caller(user);
      expect(await val("SELECT public.academic_can_access('AC-BUS','AC-BUS-M01-L02','en') AS value")).toBe(true);
      expect(await val("SELECT public.technical_can_access('M01-L02') AS value")).toBe(true);
      expect((await query<{ access_source: string }>("SELECT * FROM public.get_my_kids_access_status()")).rows[0].access_source).toBe("stripe_test");
      expect(await val("SELECT status AS value FROM billing.academic_stripe_subscriptions WHERE user_id=$1", [user])).toBe("active");
      expect(await val("SELECT status AS value FROM billing.technical_stripe_subscriptions WHERE user_id=$1", [user])).toBe("active");
    });
    it("queues optional invitations without sending; mail leases, retries, revocation and service ACL are guarded", async () => {
      const silent = (await create({ email: "silent@example.test" })).id;
      expect(await val("SELECT count(*)::int AS value FROM billing.email_access_mail WHERE id=$1", [silent])).toBe(0);
      const id = (await create({ email: "invited@example.test", invitation: true })).id;
      const mail = <T = unknown>(action: string, data: unknown = {}) => val<T>("SELECT public.email_access_mail($1,$2::jsonb) AS value", [action, JSON.stringify(data)]);
      await deny(() => mail("claim"), /SERVICE_ONLY/);
      await query("SELECT set_config('request.jwt.claim.role','service_role',false)");
      const claimed = await mail<{ id: string; claim_token: string }[]>("claim", { id });
      expect(claimed).toHaveLength(1); expect(await mail("claim", { id })).toEqual([]);
      const claim = claimed[0]; expect(await mail("authorize_attempt", claim)).toBe(true);
      expect(await mail("result", { ...claim, claim_token: randomUUID(), provider_id: "fake" })).toBe(false);
      expect(await mail("result", { ...claim, provider_id: null, retryable: true })).toBe(true);
      const retry = (await mail<{ id: string; claim_token: string }[]>("claim", { id }))[0];
      await caller(admin); await command("revoke", { id, key: randomUUID() });
      await query("SELECT set_config('request.jwt.claim.role','service_role',false)");
      expect(await mail("authorize_attempt", retry)).toBe(false);
    });
    it("erases grant recipient/audit/outbox at LC09 learner erasure and FK cascades on Auth deletion", async () => {
      await create({ invitation: true });
      await getDb().exec("SELECT set_config('request.jwt.claim.role','service_role',false); UPDATE billing.account_deletion_control SET enabled=true,financial_purge_enabled=true,financial_retention_reference='synthetic-finance',crm_retention_reference='synthetic-crm',responder_reference='synthetic-owner',release_reference='synthetic-release'");
      await query("INSERT INTO billing.account_deletion_requests(user_id) VALUES($1)", [user]);
      const lease = await val<{ lease_token: string }>("SELECT public.lc09_claim_deletion($1) AS value", [user]);
      for (const stage of ["provider_reconciled", "learner_erased"])
        await query("SELECT public.lc09_advance_deletion($1,$2,$3)", [user, lease.lease_token, stage]);
      expect(await val("SELECT count(*)::int AS value FROM billing.email_access_grants WHERE recipient_email='member@example.test'")).toBe(0);
      expect(await val("SELECT count(*)::int AS value FROM billing.email_access_audit")).toBe(0);
      expect(await val("SELECT count(*)::int AS value FROM billing.email_access_mail")).toBe(0);
      await caller(admin); await create({ email: "other@example.test" });
      await query("DELETE FROM auth.users WHERE id=$1", [other]);
      expect(await val("SELECT count(*)::int AS value FROM billing.email_access_grants")).toBe(0);
    });
  });
  // True concurrent transactions on PostgreSQL 16; no simulated concurrency.
  it.skipIf(!process.env.COMMERCE_NATIVE_DATABASE_URL)("concurrent admin creation and email verification leave access ready exactly once", async () => {
    const url = process.env.COMMERCE_NATIVE_DATABASE_URL!;
    const clients = [postgres(url, { max: 1 }), postgres(url, { max: 1 })];
    const newUser = randomUUID(), email = "admin-race-" + newUser + "@example.test";
    try {
      await query("INSERT INTO auth.users(id,email) VALUES($1,$2)", [newUser, email]);
      await clients[0].unsafe("SELECT set_config('request.jwt.claim.sub',$1,false)", [admin]);
      await Promise.all([
        clients[0].unsafe("SELECT public.email_access_command('create',$1::jsonb)", [clients[0].json({ email, scope_mode: "all_published", catalogues: [], duration_days: 3, invitation: false, locale: "en", key: randomUUID() })]),
        clients[1].unsafe("UPDATE auth.users SET email_confirmed_at=now() WHERE id=$1", [newUser]),
      ]);
      await caller(newUser);
      expect(await val("SELECT public.get_my_billing_access_tier() AS value")).toBe("pro_plus");
      expect(await val("SELECT count(*)::int AS value FROM billing.email_access_audit a JOIN billing.email_access_grants g ON g.id=a.grant_id WHERE g.user_id=$1 AND a.action='activated'", [newUser])).toBe(1);
    } finally { await query("DELETE FROM auth.users WHERE id=$1", [newUser]); await Promise.all(clients.map(c => c.end())); }
  });
  it.skipIf(!process.env.COMMERCE_NATIVE_DATABASE_URL)("concurrent verification/claim retries activate exactly once", async () => {
    const url = process.env.COMMERCE_NATIVE_DATABASE_URL!;
    const clients = [postgres(url, { max: 1 }), postgres(url, { max: 1 })];
    const newUser = randomUUID(), email = "race-" + newUser + "@example.test";
    try {
      await clients[0].unsafe("SELECT set_config('request.jwt.claim.sub',$1,false)", [admin]);
      await clients[0].unsafe("SELECT public.email_access_command('create',$1::jsonb)", [clients[0].json({ email, scope_mode: "all_published", catalogues: [], duration_days: 3, invitation: false, locale: "en", key: randomUUID() })]);
      await clients[0].unsafe("INSERT INTO auth.users(id,email) VALUES($1,$2)", [newUser, email]);
      await Promise.all(clients.map(async c => {
        await c.unsafe("SELECT set_config('request.jwt.claim.sub',$1,false)", [newUser]);
        await c.unsafe("UPDATE auth.users SET email_confirmed_at=now() WHERE id=$1", [newUser]);
        await c.unsafe("SELECT public.activate_my_email_access_grants()");
      }));
      expect(await val("SELECT count(*)::int AS value FROM billing.email_access_audit a JOIN billing.email_access_grants g ON g.id=a.grant_id WHERE g.user_id=$1 AND a.action='activated'", [newUser])).toBe(1);
      expect(await val("SELECT (ends_at-activated_at)=interval '3 days' AS value FROM billing.email_access_grants WHERE user_id=$1", [newUser])).toBe(true);
    } finally { await query("DELETE FROM auth.users WHERE id=$1", [newUser]); await Promise.all(clients.map(c => c.end())); }
  });
}

