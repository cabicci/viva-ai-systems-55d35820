// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any -- Assert heterogeneous PostgreSQL command responses and malformed inputs without treating them as trusted application types. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
const a = "11111111-1111-4111-8111-111111111111",
  b = "22222222-2222-4222-8222-222222222222";
const child = "33333333-3333-4333-8333-333333333333",
  child2 = "44444444-4444-4444-8444-444444444444";
const fixture = `CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE SCHEMA auth; CREATE SCHEMA billing; CREATE SCHEMA learning_private;
GRANT USAGE ON SCHEMA learning_private TO authenticated;
CREATE FUNCTION learning_private.kids_journey(uuid,text) RETURNS jsonb LANGUAGE sql SECURITY DEFINER AS $$SELECT '{"completed":[1]}'::jsonb$$;
REVOKE ALL ON FUNCTION learning_private.kids_journey(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION learning_private.kids_journey(uuid,text) TO authenticated;
CREATE FUNCTION public.kids_journey(uuid,text) RETURNS jsonb LANGUAGE sql SECURITY INVOKER AS $$SELECT learning_private.kids_journey($1,$2)$$;
CREATE TABLE auth.users(id uuid primary key);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
GRANT USAGE ON SCHEMA auth TO authenticated,service_role;
CREATE TABLE public.kids_profiles(id uuid primary key,parent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,level_id text);
CREATE TABLE public.lesson_progress(user_id uuid,lesson_id text,status text);
CREATE TABLE public.lesson_notes(user_id uuid,lesson_id text,content text);
CREATE TABLE public.lesson_quiz_attempts(id uuid primary key default gen_random_uuid(),user_id uuid,lesson_id text,question_id text,selected_index int,is_correct boolean,bloom_level text);
CREATE TABLE public.mission_submissions(id uuid default gen_random_uuid(),user_id uuid,lesson_id text,mission_id text,submission_text text,score int,status text);
CREATE TABLE public.academic_progress(user_id uuid,course_id text,lesson_id text,read boolean,quiz_passed boolean,drafts jsonb);
CREATE TABLE public.academic_courses(id text,titles jsonb);
CREATE TABLE public.technical_progress(user_id uuid,lesson_id text,read boolean,quiz_passed boolean,drafts jsonb);
CREATE TABLE public.kids_lesson_progress(profile_id uuid REFERENCES kids_profiles(id) ON DELETE CASCADE,level_id text,lesson_number int,locale text);
CREATE TABLE public.journey_visits(user_id uuid,line text,course_id text,profile_id uuid,lesson_id text,locale text);
CREATE TABLE public.user_mission_state(user_id uuid,mission_id text,state text);
CREATE TABLE public.academic_lesson_content(course_id text,lesson_id text,locale text,source_sha256 text,payload jsonb);
CREATE TABLE public.technical_lesson_content(lesson_id text,locale text,source_sha256 text,payload jsonb);
CREATE TABLE billing.commercial_purchases(id uuid,user_id uuid,state text,kind text,area text,course text,child_id uuid,paid_at timestamptz);
CREATE FUNCTION billing.commercial_account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT coalesce(current_setting('test.blocked',true),'no')<>'yes'$$;
CREATE FUNCTION billing.commercial_lock(uuid) RETURNS void LANGUAGE plpgsql AS $$BEGIN PERFORM pg_advisory_xact_lock(hashtext($1::text)); END$$;
CREATE FUNCTION billing.commercial_require_service() RETURNS void LANGUAGE plpgsql AS $$BEGIN IF coalesce(current_setting('test.service',true),'no')<>'yes' THEN RAISE EXCEPTION 'SERVICE_ONLY'; END IF; END$$;
CREATE FUNCTION public.kids_parent_can_manage_profiles() RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
CREATE FUNCTION public.kids_profile_has_consent(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT coalesce(current_setting('test.consent',true),'yes')='yes'$$;
CREATE FUNCTION public.kids_can_access_lesson(uuid,text,int,text) RETURNS boolean LANGUAGE sql AS $$SELECT coalesce(current_setting('test.access',true),'yes')='yes' AND EXISTS(SELECT 1 FROM public.kids_profiles WHERE id=$1 AND parent_id=auth.uid())$$;
CREATE FUNCTION billing.assistant_content_allowed(uuid,text,text,text,text,uuid) RETURNS boolean LANGUAGE sql AS $$SELECT coalesce(current_setting('test.access',true),'yes')='yes'$$;
CREATE TABLE billing.test_sources(user_id uuid,area text,course text,child_id uuid,source_key text,anchor timestamptz,valid_until timestamptz);
CREATE FUNCTION billing.assistant_source_specs(uuid,text,text,uuid,timestamptz) RETURNS TABLE(source_key text,anchor timestamptz,valid_until timestamptz,units int,recurring boolean,per_lesson int) LANGUAGE sql AS $$SELECT source_key,anchor,valid_until,100,true,NULL::int FROM billing.test_sources WHERE user_id=$1 AND area=$2 AND course=$3 AND child_id IS NOT DISTINCT FROM $4 AND (valid_until IS NULL OR valid_until>$5)$$;
CREATE FUNCTION public.academic_command(text,text DEFAULT NULL,text DEFAULT NULL,text DEFAULT NULL,jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql AS $$SELECT jsonb_build_object('allowed',coalesce(current_setting('test.access',true),'yes')='yes','score',1,'total',2)$$;
CREATE FUNCTION public.technical_command(text,text DEFAULT NULL,text DEFAULT NULL,jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql AS $$SELECT jsonb_build_object('allowed',coalesce(current_setting('test.access',true),'yes')='yes','score',1,'total',2)$$;
INSERT INTO auth.users VALUES('${a}'),('${b}');
INSERT INTO kids_profiles VALUES('${child}','${a}','level-1'),('${child2}','${a}','level-2');
INSERT INTO lesson_notes VALUES('${a}','L1','existing personal note');
INSERT INTO lesson_progress VALUES('${a}','L1','completed');`;
const month = readFileSync("drizzle/migrations/0027_commercial_policy_20261102.sql", "utf8");
const monthFunction = month.slice(
  month.indexOf("CREATE FUNCTION billing.assistant_month_window("),
  month.indexOf(
    "--> statement-breakpoint",
    month.indexOf("CREATE FUNCTION billing.assistant_month_window("),
  ),
);
describe("student record migration in isolated PostgreSQL", () => {
  let db: PGlite;
  const value = async <T = unknown>(sql: string, args: unknown[] = []) =>
    (await db.query<{ v: T }>(sql, args)).rows[0]?.v;
  const command = (action: string, data: object = {}) =>
    value<any>("SELECT public.learning_command($1,$2::jsonb) v", [action, JSON.stringify(data)]);
  const reports = (action: string, data: object = {}) =>
    value<any>("SELECT public.learning_reports($1,$2::jsonb) v", [action, JSON.stringify(data)]);
  const caller = async (user = a) => {
    await db.exec("RESET ROLE");
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [user]);
    await db.exec("SET ROLE authenticated");
  };
  const record = async (area = "ai", course = "ai", profile: string | null = null) => {
    await db.exec("RESET ROLE");
    return value<string>("SELECT learning_private.record($1,$2,$3,$4) v", [
      a,
      area,
      course,
      profile,
    ]);
  };
  const reserve = (id = crypto.randomUUID(), sourceKey = "invitation:one", subjectId = a) =>
    reports("reserve", { requestId: id, sourceKey, subjectId, locale: "en" });
  beforeEach(async () => {
    db = new PGlite();
    await db.exec(fixture);
    await db.exec(monthFunction);
    await db.exec(readFileSync("drizzle/migrations/0031_student_learning_records.sql", "utf8"));
  }, 30000);
  afterEach(async () => db?.close());
  beforeEach(async () => {
    await db.exec(
      "RESET ROLE; DELETE FROM learning_private.reports; DELETE FROM learning_private.commands; DELETE FROM billing.test_sources;",
    );
    await db.exec(
      "SELECT set_config('test.blocked','no',false),set_config('test.access','yes',false),set_config('test.service','no',false)",
    );
    await db.query(
      "INSERT INTO billing.test_sources VALUES($1,'ai','ai',NULL,'invitation:one',now()-interval '2 days',now()+interval '40 days')",
      [a],
    );
    await caller();
  });
  it("keeps existing progress and notes without inventing older attempts", async () => {
    const records = await command("records");
    const detail = await command("detail", { recordId: records[0].id });
    expect(detail.notes).toContainEqual(
      expect.objectContaining({ lesson: "L1", content: "existing personal note" }),
    );
    expect(detail.events).toContainEqual(
      expect.objectContaining({ kind: "existing_fact", content_version: null }),
    );
    expect(detail.events.some((e: any) => e.evidence.content)).toBe(false);
  });
  it("preserves the installed Kids journey invoker bridge grants", async () => {
    expect(await value("SELECT public.kids_journey($1,'en') v", [child])).toEqual({
      completed: [1],
    });
  });
  it("denies another account, anonymous calls and direct private-table access", async () => {
    const id = (await command("records"))[0].id;
    await caller(b);
    expect(await command("records")).toEqual([]);
    await expect(command("detail", { recordId: id })).rejects.toThrow("LEARNING_RECORD_REQUIRED");
    await expect(db.query("SELECT * FROM learning_private.events")).rejects.toThrow(
      /permission denied/,
    );
    await db.exec("RESET ROLE; SET ROLE anon");
    await expect(command("records")).rejects.toThrow(/permission denied/);
  });
  it("saves notes idempotently, detects concurrent-device conflicts and keeps private text out of history", async () => {
    const id = (await command("records"))[0].id;
    const before = await command("note", { recordId: id, lesson: "L1" });
    const data = {
      recordId: id,
      lesson: "L1",
      locale: "en",
      revision: before.revision,
      content: "new private text",
      requestId: crypto.randomUUID(),
    };
    const saved = await command("save_note", data);
    expect(await command("save_note", data)).toEqual(saved);
    await expect(command("save_note", { ...data, content: "different" })).rejects.toThrow(
      "LEARNING_REQUEST_MISMATCH",
    );
    await expect(command("save_note", { ...data, requestId: crypto.randomUUID() })).rejects.toThrow(
      "LEARNING_NOTE_CONFLICT",
    );
    expect(JSON.stringify((await command("detail", { recordId: id })).events)).not.toContain(
      "new private text",
    );
  });
  it("retains read access when course access ends and denies new edits", async () => {
    const id = (await command("records"))[0].id;
    await db.exec("SELECT set_config('test.access','no',false)");
    expect((await command("note", { recordId: id, lesson: "L1" })).content).toBeTruthy();
    await expect(
      command("save_note", {
        recordId: id,
        lesson: "L1",
        locale: "en",
        revision: 1,
        content: "x",
        requestId: crypto.randomUUID(),
      }),
    ).rejects.toThrow("LEARNING_ACCESS_REQUIRED");
  });
  it("rejects a stale older-tab note write after the canonical note changed", async () => {
    const id = (await command("records"))[0].id;
    await command("save_note", {
      recordId: id,
      lesson: "L1",
      locale: "en",
      revision: 1,
      content: "new canonical text",
      requestId: crypto.randomUUID(),
    });
    await db.exec("RESET ROLE");
    await expect(
      db.query(
        "UPDATE public.lesson_notes SET content='stale older tab' WHERE user_id=$1 AND lesson_id='L1'",
        [a],
      ),
    ).rejects.toThrow("LEARNING_NOTE_CONFLICT");
    await caller();
    expect((await command("note", { recordId: id, lesson: "L1" })).content).toBe(
      "new canonical text",
    );
  });
  it("allows only two report reservations per package and retries one request without extra usage", async () => {
    const id = crypto.randomUUID();
    const first = await reserve(id);
    expect(first.state).toBe("claimed");
    expect(await reserve(id)).toEqual({ state: "pending" });
    await reserve();
    await expect(reserve()).rejects.toThrow("LEARNING_REPORT_LIMIT");
    expect((await reports("list")).sources[0].used).toBe(2);
    expect(JSON.stringify(first.snapshot)).not.toContain("private text");
    expect(JSON.stringify(first.snapshot)).not.toContain("existing personal note");
  });
  it("failed generation releases capacity; ready retrieval does not regenerate or recount", async () => {
    const id = crypto.randomUUID();
    const first = await reserve(id);
    await db.exec("RESET ROLE; SELECT set_config('test.service','yes',false)");
    expect(
      await value("SELECT public.finish_learning_report($1,$2,$3,NULL) v", [
        a,
        id,
        first.claimToken,
      ]),
    ).toBe(true);
    await caller();
    const second = await reserve(id);
    expect(second.state).toBe("claimed");
    await db.exec("RESET ROLE");
    const report = { summary: "Recorded evidence", limitations: ["partial"] };
    expect(
      await value("SELECT public.finish_learning_report($1,$2,$3,$4::jsonb) v", [
        a,
        id,
        second.claimToken,
        JSON.stringify(report),
      ]),
    ).toBe(true);
    expect(
      await value("SELECT public.finish_learning_report($1,$2,$3,NULL) v", [
        a,
        id,
        second.claimToken,
      ]),
    ).toBe(false);
    await caller();
    expect(await reserve(id)).toEqual({ state: "ready", report });
    expect((await reports("list")).sources[0].used).toBe(1);
  });
  it("shares package report quota across courses and children", async () => {
    await record("kids", "level-1", child);
    await record("kids", "level-2", child2);
    await db.query(
      "INSERT INTO billing.test_sources VALUES($1,'kids','kids',$2::uuid,'commerce:family:'||$2::text,now()-interval '2 days',now()+interval '40 days'),($1,'kids','kids',$3::uuid,'commerce:family:'||$3::text,now()-interval '2 days',now()+interval '40 days')",
      [a, child, child2],
    );
    await caller();
    await reserve(crypto.randomUUID(), "commerce:family", child);
    await reserve(crypto.randomUUID(), "commerce:family", child2);
    await expect(reserve(crypto.randomUUID(), "commerce:family", child)).rejects.toThrow(
      "LEARNING_REPORT_LIMIT",
    );
  });
  it("does not grant child ownership to another household", async () => {
    const id = await record("kids", "level-1", child);
    await caller(b);
    await expect(command("detail", { recordId: id })).rejects.toThrow("LEARNING_RECORD_REQUIRED");
    await expect(reports("list", { subjectId: child })).rejects.toThrow(
      "LEARNING_SUBJECT_REQUIRED",
    );
  });
  it("keeps lifetime Kids reports available after the first-month question bonus ends", async () => {
    await record("kids", "level-1", child);
    await db.query(
      "INSERT INTO billing.commercial_purchases VALUES(gen_random_uuid(),$1,'fulfilled','lifetime_course','kids','kids',$2,now()-interval '3 months')",
      [a, child],
    );
    await caller();
    const list = await reports("list", { subjectId: child });
    expect(list.sources).toHaveLength(1);
    expect(list.sources[0].sourceKey).toMatch(/^lifetime:/);
    expect((await reserve(crypto.randomUUID(), list.sources[0].sourceKey, child)).state).toBe(
      "claimed",
    );
  });
  it("blocks new child report processing after consent withdrawal", async () => {
    await record("kids", "level-1", child);
    await caller();
    await db.exec("SELECT set_config('test.consent','no',false)");
    await expect(reserve(crypto.randomUUID(), "package", child)).rejects.toThrow(
      "LEARNING_CHILD_CONSENT_REQUIRED",
    );
    expect((await reports("list", { subjectId: child })).sources).toEqual([]);
  });
  it("persists canonical child quiz attempts once and denies browser-supplied grading", async () => {
    const args = [
      a,
      crypto.randomUUID(),
      child,
      "kids",
      "level-1",
      "1",
      "en",
      "a".repeat(64),
      JSON.stringify({ question: "actual source", answer: 1 }),
      JSON.stringify({ questionId: "q", selectedIndex: 1 }),
      JSON.stringify({ correct: true, explanation: "correct" }),
    ];
    const sql =
      "SELECT public.record_learning_assessment($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb) v";
    await expect(value(sql, args)).rejects.toThrow(/permission denied/);
    await db.exec("RESET ROLE; SELECT set_config('test.service','yes',false)");
    expect(await value(sql, args)).toEqual({ correct: true, explanation: "correct" });
    expect(await value(sql, args)).toEqual({ correct: true, explanation: "correct" });
    expect(
      await value("SELECT count(*)::int v FROM learning_private.events WHERE origin='kids_quiz'"),
    ).toBe(1);
    await db.query("DELETE FROM kids_profiles WHERE id=$1", [child]);
    expect(
      await value("SELECT count(*)::int v FROM learning_private.commands WHERE request_id=$1", [
        args[1],
      ]),
    ).toBe(0);
  });
  it("blocks reads, reservations and writes while deletion is pending", async () => {
    await db.exec("SELECT set_config('test.blocked','yes',false)");
    await expect(command("records")).rejects.toThrow("LEARNING_ACCOUNT_REQUIRED");
    await expect(reserve()).rejects.toThrow("LEARNING_ACCOUNT_REQUIRED");
  });
  it("captures original content revisions and every authorized assessment attempt", async () => {
    await db.exec(
      "RESET ROLE; INSERT INTO academic_lesson_content VALUES('AC-T','L2','en','v1','{\"answer\":1}'); UPDATE academic_lesson_content SET source_sha256='v2',payload='{\"answer\":2}' WHERE course_id='AC-T'",
    );
    expect(
      (await db.query("SELECT version FROM learning_private.content_versions WHERE course='AC-T'"))
        .rows,
    ).toHaveLength(2);
    await caller();
    await value("SELECT public.academic_command('quiz','AC-T','L2','en','{\"answers\":[1]}') v");
    await value("SELECT public.academic_command('quiz','AC-T','L2','en','{\"answers\":[2]}') v");
    const r = (await command("records")).find((r: any) => r.course === "AC-T");
    const events = (await command("detail", { recordId: r.id })).events;
    expect(events.filter((e: any) => e.kind === "quiz")).toHaveLength(2);
    expect(events.every((e: any) => e.content_version === "v2")).toBe(true);
    await db.exec("SELECT set_config('test.access','no',false)");
    await value("SELECT public.academic_command('quiz','AC-T','L2','en','{}') v");
    expect((await command("detail", { recordId: r.id })).events).toHaveLength(2);
  });
  it("does not downgrade completed missions on delayed offline replay", async () => {
    await db.exec("RESET ROLE");
    await db.query("INSERT INTO user_mission_state VALUES($1,'m','completed');", [a]);
    await db.exec("UPDATE user_mission_state SET state='started'");
    expect(await value("SELECT state v FROM user_mission_state")).toBe("completed");
  });
  it("uses the existing anniversary month calculation, including month-end clamping", async () => {
    await db.exec("RESET ROLE");
    const window = await value<any>(
      "SELECT to_jsonb(x) v FROM billing.assistant_month_window('2026-01-31T12:00:00Z','2026-02-28T15:00:00Z') x",
    );
    expect(window.starts_at).toContain("2026-02-28");
    expect(window.ends_at).toContain("2026-03-31");
  });
  it("keeps each course's activity/assessment model instead of imposing the AI model", async () => {
    const examRecord = await record("academic", "AC-EXAM");
    await db.exec(
      `INSERT INTO learning_private.course_models VALUES('academic','AC-EXAM','exam-v1',ARRAY['reading','exam'],'{"authority":"canonical_assessment","required":["exam_passed"],"passMark":70}',true)`,
    );
    await caller();
    const all = await command("records");
    expect(all.find((r: any) => r.area === "ai").learning_model.activities).toContain("mission");
    expect(all.find((r: any) => r.id === examRecord).learning_model.activities).toEqual([
      "reading",
      "exam",
    ]);
    await expect(
      command("save_note", {
        recordId: examRecord,
        lesson: "exam-1",
        locale: "en",
        revision: 0,
        content: "not an activity in this course",
        requestId: crypto.randomUUID(),
      }),
    ).rejects.toThrow("LEARNING_ACTIVITY_NOT_ENABLED");
    await db.exec("RESET ROLE; SELECT set_config('test.service','yes',false)");
    await value(
      "SELECT public.record_learning_assessment($1,$2,NULL,'academic','AC-EXAM','exam-1','en',$3,$4::jsonb,$5::jsonb,$6::jsonb,'exam') v",
      [
        a,
        crypto.randomUUID(),
        "b".repeat(64),
        JSON.stringify({ answerKey: [1] }),
        JSON.stringify({ answers: [1] }),
        JSON.stringify({ score: 80, total: 100, passed: true }),
      ],
    );
    await caller();
    const detail = await command("detail", { recordId: examRecord });
    expect(detail.events[0]).toMatchObject({
      kind: "exam",
      model_version: "exam-v1",
      evidence: { outcome: { score: 80 } },
    });
    await db.exec("RESET ROLE");
    await expect(
      db.exec(
        "UPDATE learning_private.course_models SET activities=ARRAY['mission'] WHERE course='AC-EXAM'",
      ),
    ).rejects.toThrow("LEARNING_NEW_MODEL_VERSION_REQUIRED");
  });
  it("erases only the departing learner's private records and related commands/reports", async () => {
    await db.exec("RESET ROLE");
    const own = await record();
    await db.query(
      "INSERT INTO learning_private.sharing VALUES($1,$2,$3,NULL,NULL,NULL,'progress')",
      [own, b, a],
    );
    await db.query("DELETE FROM auth.users WHERE id=$1", [a]);
    expect(
      await value("SELECT count(*)::int v FROM learning_private.courses WHERE account_id=$1", [a]),
    ).toBe(0);
    expect(await value("SELECT count(*)::int v FROM auth.users WHERE id=$1", [b])).toBe(1);
  });
});
