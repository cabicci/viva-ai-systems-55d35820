// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any -- Assert heterogeneous PostgreSQL command responses and malformed inputs without treating them as trusted application types. */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { a, b, child, child2, fixture, monthFunction } from "./test-fixture";
import { learningCommandResponseSchemas, learningReportListResponseSchema } from "./contracts";

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
    const exported = await command("export", { recordId: records[0].id });
    expect(learningCommandResponseSchemas.records.safeParse(records).success).toBe(true);
    expect(learningCommandResponseSchemas.detail.safeParse(detail).success).toBe(true);
    expect(learningCommandResponseSchemas.export.safeParse(exported).success).toBe(true);
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
    const list = await reports("list");
    expect(learningReportListResponseSchema.safeParse(list).success).toBe(true);
    expect(list.sources[0].used).toBe(2);
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
