import { randomUUID } from "node:crypto";
import { describe, beforeEach, afterEach, it, expect } from "vitest";
import type { FreeAccessAdminData, FreeAccessSnapshot } from "./free-access";
type Db = {
  query<T>(sql: string, args?: unknown[]): Promise<{ rows: T[] }>;
  exec(sql: string): Promise<unknown>;
};
export function freeAccessDbCases(
  getDb: () => Db,
  ids: { admin: string; user: string; other: string },
) {
  const { admin, user, other } = ids;
  const query = <T = unknown>(sql: string, args?: unknown[]) => getDb().query<T>(sql, args);
  const val = async <T = unknown>(sql: string, args?: unknown[]) =>
    (await query<{ value: T }>(sql, args)).rows[0]?.value;
  const caller = (id: string) =>
    query(
      "SELECT set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role','authenticated',false)",
      [id],
    );
  const command = <T = { id: string; version: number }>(action: string, data: unknown = {}) =>
    val<T>("SELECT public.free_access_window_command($1,$2::jsonb) AS value", [
      action,
      JSON.stringify(data),
    ]);
  const parameters = (extra: Record<string, unknown> = {}) => ({
    title: "Synthetic offer",
    targets: ["ai:business", "academic:AC-BUS"],
    starts_at: new Date(Date.now() - 86_400_000).toISOString(),
    ends_at: new Date(Date.now() + 86_400_000).toISOString(),
    enabled: true,
    key: randomUUID(),
    ...extra,
  });
  const create = (extra: Record<string, unknown> = {}) => command("create", parameters(extra));
  const snapshot = () => val<FreeAccessSnapshot>("SELECT public.get_my_free_access() AS value");
  const deny = async (work: () => Promise<unknown>, error: RegExp) => {
    await getDb().exec("SAVEPOINT free_denied");
    try {
      await expect(work()).rejects.toThrow(error);
    } finally {
      await getDb().exec("ROLLBACK TO SAVEPOINT free_denied; RELEASE SAVEPOINT free_denied");
    }
  };
  describe("scheduled free access on cumulative PostgreSQL", () => {
    beforeEach(async () => {
      await getDb().exec("BEGIN");
      await caller(admin);
      await getDb().exec(`UPDATE public.technical_release_control SET enabled=true;
        INSERT INTO public.technical_lesson_content VALUES('M01-L02','en','lesson','{}',gen_random_uuid(),repeat('a',64));
        UPDATE public.academic_courses SET enabled=true WHERE id='AC-BUS';
        INSERT INTO public.academic_lesson_content(course_id,lesson_id,locale,position,approved,payload,source_sha256)
        VALUES('AC-BUS','AC-BUS-M01-L02','en',2,true,'{"title":"Synthetic","quiz":[]}',repeat('a',64)),
          ('AC-BUS','AC-BUS-M01-L02','ar-EG',2,false,'{}',repeat('a',64));`);
    });
    afterEach(async () => {
      await getDb().exec("ROLLBACK; RESET ROLE");
    });
    it("uses one fixed multi-target window for every verified account, without upgrading plans", async () => {
      await create();
      for (const id of [user, other]) {
        await caller(id);
        const s = await snapshot();
        expect(s.targets).toEqual(["academic:AC-BUS", "ai:business"]);
        expect(s.lesson_ids.length).toBeGreaterThan(1);
        expect(s.lesson_ids.every((id) => id.startsWith("business-"))).toBe(true);
        expect(
          await val("SELECT public.academic_can_access('AC-BUS','AC-BUS-M01-L02','en') AS value"),
        ).toBe(true);
        expect(await val("SELECT public.get_my_billing_access_tier() AS value")).toBe("free");
        expect(await val("SELECT public.technical_can_access('M01-L02') AS value")).toBe(false);
        expect(
          await val(
            "SELECT public.academic_assistant_allowed('AC-BUS','AC-BUS-M01-L02','en') AS value",
          ),
        ).toBe(false);
      }
    });
    it("discovers new draft and published curricula from the catalogue on the next list", async () => {
      const before = await command<FreeAccessAdminData>("list");
      expect(before.targets.some((t) => t.id === "academic:AC-NEW")).toBe(false);
      await getDb().exec(
        `INSERT INTO public.academic_courses(id,titles,enabled) VALUES('AC-NEW','{"en":"New course","ar-EG":"منهج جديد","ar-MSA":"جديد","ar-Gulf":"جديد"}',false)`,
      );
      const added = (await command<FreeAccessAdminData>("list")).targets.find(
        (t) => t.id === "academic:AC-NEW",
      );
      expect(added).toMatchObject({ title: "New course", published: false });
      await create({ targets: ["academic:AC-NEW"] });
      await caller(user);
      expect(await val("SELECT public.academic_can_access('AC-NEW','unknown','en') AS value")).toBe(
        false,
      );
    });
    it("starts inclusively, ends exclusively and expires all accounts at the same instant", async () => {
      const row = await create();
      await query(
        "UPDATE billing.free_access_windows SET starts_at=now(),ends_at=now()+interval '14 days' WHERE id=$1",
        [row.id],
      );
      await caller(user);
      expect((await snapshot()).targets).toContain("ai:business");
      await query(
        "UPDATE billing.free_access_windows SET starts_at=now()-interval '14 days',ends_at=now() WHERE id=$1",
        [row.id],
      );
      for (const id of [user, other]) {
        await caller(id);
        expect((await snapshot()).targets).toEqual([]);
      }
      await caller(admin);
      expect((await command<FreeAccessAdminData>("list")).windows[0].status).toBe("expired");
    });
    it("keeps scheduled windows closed and reports the next boundary to the client", async () => {
      const row = await create();
      await query(
        "UPDATE billing.free_access_windows SET starts_at=now()+interval '10 seconds' WHERE id=$1",
        [row.id],
      );
      await caller(user);
      const s = await snapshot();
      expect(s.targets).toEqual([]);
      expect(Date.parse(s.valid_until) - Date.parse(s.server_time)).toBe(10_000);
    });
    it("retries creation/updates exactly once and rejects stale admin edits", async () => {
      const p = parameters(),
        row = await command("create", p);
      expect(await command("create", p)).toEqual(row);
      await deny(() => command("create", { ...p, title: "Changed" }), /RETRY_MISMATCH/);
      const update = {
        ...p,
        key: randomUUID(),
        id: row.id,
        expected_version: row.version,
        enabled: false,
      };
      expect(await command("update", update)).toEqual({ id: row.id, version: 2 });
      expect(await command("update", update)).toEqual({ id: row.id, version: 2 });
      await deny(() => command("update", { ...update, key: randomUUID() }), /CONFLICT/);
      const listed = await command<FreeAccessAdminData>("list");
      expect(listed.audit).toHaveLength(2);
      await caller(user);
      expect((await snapshot()).targets).toEqual([]);
      await caller(admin);
      await command("update", { ...update, key: randomUUID(), expected_version: 2, enabled: true });
      await caller(user);
      expect((await snapshot()).targets).toContain("ai:business");
    });
    it("composes overlapping windows without duplicate lessons; stopping one preserves another", async () => {
      const first = await create();
      await create({ targets: ["ai:business", "technical:furniture"] });
      await query("UPDATE billing.free_access_windows SET enabled=false WHERE id=$1", [first.id]);
      await caller(user);
      const s = await snapshot();
      expect(new Set(s.lesson_ids).size).toBe(s.lesson_ids.length);
      expect(await val("SELECT public.technical_can_access('M01-L02') AS value")).toBe(true);
      expect(
        await val("SELECT public.academic_can_access('AC-BUS','AC-BUS-M01-L02','en') AS value"),
      ).toBe(false);
    });
    it("preserves content release and locale approval requirements", async () => {
      await create({ targets: ["academic:AC-BUS", "technical:furniture"] });
      await caller(user);
      expect(
        await val("SELECT public.academic_can_access('AC-BUS','AC-BUS-M01-L02','ar-EG') AS value"),
      ).toBe(false);
      expect(await val("SELECT public.technical_can_access('M99-L99') AS value")).toBe(false);
      await getDb().exec(
        "UPDATE public.academic_courses SET enabled=false; UPDATE public.technical_release_control SET enabled=false",
      );
      expect(
        await val("SELECT public.academic_can_access('AC-BUS','AC-BUS-M01-L02','en') AS value"),
      ).toBe(false);
      expect(await val("SELECT public.technical_can_access('M01-L02') AS value")).toBe(false);
    });
    it("rejects unverified, unavailable and anonymous identities and protects admin commands", async () => {
      await create();
      await caller(other);
      await deny(() => command("list"), /ADMIN_REQUIRED/);
      await query("UPDATE auth.users SET email_confirmed_at=NULL WHERE id=$1", [other]);
      expect((await snapshot()).targets).toEqual([]);
      await caller("");
      await deny(snapshot, /AUTH_REQUIRED/);
      await caller(admin);
      await query("DELETE FROM public.user_roles WHERE user_id=$1", [admin]);
      await deny(() => command("list"), /ADMIN_REQUIRED/);
    });
    it("rejects invalid targets, empty selections, duplicate targets and invalid dates at the SQL boundary", async () => {
      for (const invalid of [
        { targets: [] },
        { targets: ["ai:business", "ai:business"] },
        { targets: ["made-up"] },
        { ends_at: "2000-01-01T00:00:00Z" },
        { starts_at: "2026-01-01T00:00:00" },
        { enabled: "true" },
        { extra: "field" },
      ]) {
        await deny(() => create(invalid), /FREE_ACCESS_INVALID/);
      }
    });
    it("exposes no direct table or private helper access to authenticated/anonymous clients", async () => {
      await getDb().exec("SET LOCAL ROLE authenticated");
      await deny(() => query("SELECT * FROM billing.free_access_windows"), /permission denied/);
      await deny(
        () => query("SELECT billing.free_access_has($1,'ai')", [user]),
        /permission denied/,
      );
      await getDb().exec("SET LOCAL ROLE anon");
      await deny(snapshot, /permission denied/);
      await deny(() => command("list"), /permission denied/);
    });
    it("extends scoped AI lesson/video decisions without altering paid snapshots or assistant allowances", async () => {
      await query("SELECT set_config('request.jwt.claim.role','service_role',false)");
      const before = await val("SELECT billing.get_entitlement_snapshot($1) AS value", [user]);
      const limits = await query("SELECT * FROM billing.resolve_ai_assistant_limits($1)", [user]);
      await caller(admin);
      await create({ targets: ["ai:business"] });
      await deny(
        () =>
          val(
            "SELECT billing.evaluate_access($1,'lesson','business-m1-l2-reactive-vs-proactive') AS value",
            [user],
          ),
        /SERVICE_ONLY/,
      );
      await query("SELECT set_config('request.jwt.claim.role','service_role',false)");
      expect(
        await val(
          "SELECT billing.evaluate_access($1,'lesson','business-m1-l2-reactive-vs-proactive')->>'allowed' AS value",
          [user],
        ),
      ).toBe("true");
      expect(
        await val(
          "SELECT billing.evaluate_access($1,'video','business-m1-l2-reactive-vs-proactive')->>'allowed' AS value",
          [user],
        ),
      ).toBe("true");
      expect(
        await val(
          "SELECT billing.evaluate_access($1,'lesson','builder-m1-l1-what-is-llm')->>'allowed' AS value",
          [user],
        ),
      ).toBe("false");
      expect(
        await val(
          "SELECT billing.evaluate_access($1,'rag','business-m1-l2-reactive-vs-proactive')->>'allowed' AS value",
          [user],
        ),
      ).toBe("false");
      expect(await val("SELECT billing.get_entitlement_snapshot($1) AS value", [user])).toEqual(
        before,
      );
      expect(await query("SELECT * FROM billing.resolve_ai_assistant_limits($1)", [user])).toEqual(
        limits,
      );
    });
    it("tags only free deliveries, preserves paid deliveries and keeps progress after expiry", async () => {
      await create({ targets: ["academic:AC-BUS", "technical:furniture"] });
      await caller(user);
      const academic = () =>
        val<{ allowed: boolean; free_access_check_at?: string }>(
          "SELECT public.academic_command('lesson','AC-BUS','AC-BUS-M01-L02','en') AS value",
        );
      const technical = () =>
        val<{ allowed: boolean; free_access_check_at?: string }>(
          "SELECT public.technical_command('lesson','M01-L02','en') AS value",
        );
      expect((await academic()).free_access_check_at).toBeTruthy();
      expect((await technical()).free_access_check_at).toBeTruthy();
      await val("SELECT public.academic_command('read','AC-BUS','AC-BUS-M01-L02','en') AS value");
      await val("SELECT public.technical_command('read','M01-L02','en') AS value");
      await getDb().exec("UPDATE billing.free_access_windows SET ends_at=now()");
      expect((await academic()).allowed).toBe(false);
      expect((await technical()).allowed).toBe(false);
      expect(
        await val("SELECT read AS value FROM public.academic_progress WHERE user_id=$1", [user]),
      ).toBe(true);
      expect(
        await val("SELECT read AS value FROM public.technical_progress WHERE user_id=$1", [user]),
      ).toBe(true);
      await query(
        "INSERT INTO billing.academic_stripe_subscriptions(user_id,subscription_id,customer_id,price_id,status,last_event_at,starts_at,ends_at) VALUES($1,'synthetic-academic','synthetic-customer','synthetic-price','active',now(),now(),now()+interval '30 days')",
        [user],
      );
      await query(
        "INSERT INTO billing.technical_stripe_subscriptions(user_id,subscription_id,customer_id,price_id,status,last_event_at,starts_at,ends_at) VALUES($1,'synthetic-technical','synthetic-customer','synthetic-price','active',now(),now(),now()+interval '30 days')",
        [user],
      );
      await getDb().exec("UPDATE billing.free_access_windows SET ends_at=now()+interval '1 day'");
      expect(await academic()).toMatchObject({ allowed: true });
      expect((await academic()).free_access_check_at).toBeUndefined();
      expect(await technical()).toMatchObject({ allowed: true });
      expect((await technical()).free_access_check_at).toBeUndefined();
    });
    it("preserves Kids guardian, ownership, country, publication and consent gates during an offer", async () => {
      await create({ targets: ["kids"] });
      await caller(user);
      const profile = randomUUID(),
        policy = randomUUID();
      await query(
        "INSERT INTO public.kids_profiles(id,parent_id,display_name,level_id) VALUES($1,$2,'Synthetic','level-1')",
        [profile, user],
      );
      const can = () =>
        val("SELECT public.kids_can_access_lesson($1,'level-1',3,'en') AS value", [profile]);
      expect(await can()).toBe(false);
      await getDb().exec(
        "UPDATE public.kids_release_control SET accepts_child_data=true,lesson_access_enabled=true; UPDATE public.kids_market_release SET accepts_child_data=true,reviewed_at=now(),review_reference='synthetic-only' WHERE country_code='EG'; INSERT INTO public.kids_content_approvals VALUES('level-1',3,'en',now(),'synthetic-only')",
      );
      await query(
        "INSERT INTO public.kids_consent_policies(id,country_code,version,locale,notice_text,consent_text,review_reference,enabled) VALUES($1,'EG','synthetic','en',repeat('x',80),repeat('x',20),'synthetic-only',true)",
        [policy],
      );
      await query(
        "INSERT INTO public.kids_parent_access_requests(parent_id,parent_email,status,country_code,adult_confirmed) VALUES($1,'member@example.test','approved','EG',true)",
        [user],
      );
      await query(
        "INSERT INTO public.kids_parent_attestations(parent_id,policy_id,country_code) VALUES($1,$2,'EG')",
        [user, policy],
      );
      expect(await can()).toBe(false);
      await query(
        "INSERT INTO public.kids_profile_consents(profile_id,parent_id,policy_id,guardian_reference) VALUES($1,$2,$3,'synthetic')",
        [profile, user, policy],
      );
      expect(await can()).toBe(true);
      await caller(other);
      expect(await can()).toBe(false);
      await caller(user);
      expect(
        await val("SELECT public.kids_can_access_lesson($1,'level-1',3,'ar-EG') AS value", [
          profile,
        ]),
      ).toBe(false);
      await query(
        "UPDATE public.kids_profile_consents SET withdrawn_at=now() WHERE profile_id=$1",
        [profile],
      );
      expect(await can()).toBe(false);
    });
    it("blocks suspended and deletion-pending users without mutating their independent subscription records", async () => {
      await create();
      await query(
        "INSERT INTO billing.subscriptions(user_id,access_state,billing_state,market_code,currency_code,billing_interval,idempotency_key) VALUES($1,'suspended','canceled','EG','EGP','month','free-suspended')",
        [user],
      );
      await caller(user);
      expect((await snapshot()).targets).toEqual([]);
      expect(
        await val("SELECT public.academic_can_access('AC-BUS','AC-BUS-M01-L02','en') AS value"),
      ).toBe(false);
      await getDb().exec(
        "UPDATE billing.account_deletion_control SET enabled=true,financial_retention_reference='synthetic-finance',crm_retention_reference='synthetic-crm',responder_reference='synthetic-owner',release_reference='synthetic-release'",
      );
      await query("INSERT INTO billing.account_deletion_requests(user_id) VALUES($1)", [other]);
      await query("SELECT set_config('request.jwt.claim.role','service_role',false)");
      await query("SELECT public.lc09_claim_deletion($1)", [other]);
      await caller(other);
      expect((await snapshot()).targets).toEqual([]);
      expect(
        await val("SELECT access_state AS value FROM billing.subscriptions WHERE user_id=$1", [
          user,
        ]),
      ).toBe("suspended");
    });
    it("unlinks deleted administrator attribution while retaining offers used by other learners", async () => {
      const window = await create();
      await query("DELETE FROM auth.users WHERE id=$1", [admin]);
      expect(
        await val(
          "SELECT created_by IS NULL AS value FROM billing.free_access_windows WHERE id=$1",
          [window.id],
        ),
      ).toBe(true);
      expect(
        await val(
          "SELECT actor IS NULL AND position($1 IN details::text)=0 AS value FROM billing.free_access_window_audit",
          [admin],
        ),
      ).toBe(true);
      expect(
        await val("SELECT count(*)::int AS value FROM billing.free_access_window_requests"),
      ).toBe(0);
      await caller(user);
      expect((await snapshot()).targets).toContain("academic:AC-BUS");
    });
  });
}
