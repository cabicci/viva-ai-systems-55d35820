import { readAcademicAuditChain } from "./academic-audit-chain.mjs";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { checkAcademicCompletionRevision } from "./check-completion-revision.mjs";

const receipt = JSON.parse(
  readFileSync("scripts/academic-integration/audit-revision-17-30.json", "utf8"),
);
const { sql, report } = checkAcademicCompletionRevision();
const chain = readAcademicAuditChain();
const originals = receipt.changes.map((change) => {
  const after = chain.stageAfter(
    "scripts/academic-integration/audit-revision-17-30.json",
    change.lessonId,
    change.locale,
  ).payload;
  const before = structuredClone(after);
  for (const field of [...change.changedFields].reverse()) {
    const keys = field.path.split(".");
    let parent = before;
    for (const key of keys.slice(0, -1)) parent = parent[key];
    if (field.beforeExists) parent[keys.at(-1)] = field.before;
    else delete parent[keys.at(-1)];
  }
  return { change, before, after };
});
let db;
before(async () => {
  db = new PGlite();
  await db.exec(
    [
      "CREATE TABLE public.academic_courses(id text PRIMARY KEY,enabled boolean,assistant_enabled boolean);",
      "CREATE TABLE public.academic_lesson_content(course_id text,lesson_id text,locale text,source_sha256 text,payload jsonb,approved boolean,video_guid text,video_ready boolean,PRIMARY KEY(course_id,lesson_id,locale));",
    ].join("\n"),
  );
});
after(async () => db?.close());
beforeEach(async () => {
  await db.exec(
    "TRUNCATE public.academic_lesson_content,public.academic_courses; INSERT INTO public.academic_courses VALUES ('AC-BUS',false,false);",
  );
  for (const { change, before } of originals) {
    await db.query(
      "INSERT INTO public.academic_lesson_content VALUES ('AC-BUS',$1,$2,$3,$4,false,'preserve-existing-media',true)",
      [change.lessonId, change.locale, change.beforeSha256, JSON.stringify(before)],
    );
  }
});
const rows = async () =>
  (await db.query("SELECT * FROM public.academic_lesson_content ORDER BY lesson_id,locale")).rows;

test("updates eleven exact payloads including absent example steps, keeps release/media and keys, and is idempotent", async () => {
  assert.equal(report.databaseChanged, false);
  assert.equal(originals.length, 11);
  const newSteps = originals.find(({ change }) => change.item === 30);
  assert.equal(Object.hasOwn(newSteps.before.example, "steps"), false);
  assert.equal(newSteps.after.example.steps.length, 5);
  await db.exec(sql);
  for (const { change, before, after } of originals) {
    const { rows: actual } = await db.query(
      "SELECT * FROM public.academic_lesson_content WHERE lesson_id=$1 AND locale=$2",
      [change.lessonId, change.locale],
    );
    assert.equal(actual.length, 1);
    assert.deepEqual(actual[0].payload, after);
    assert.equal(actual[0].source_sha256, change.afterSha256);
    assert.equal(actual[0].approved, false);
    assert.equal(actual[0].video_guid, "preserve-existing-media");
    assert.equal(actual[0].video_ready, true);
    assert.deepEqual(
      after.quiz.map(({ id, correct }) => ({ id, correct })),
      before.quiz.map(({ id, correct }) => ({ id, correct })),
    );
  }
  const once = await rows();
  await db.exec(sql);
  assert.deepEqual(await rows(), once);
  assert.deepEqual(
    (await db.query("SELECT enabled,assistant_enabled FROM public.academic_courses")).rows,
    [{ enabled: false, assistant_enabled: false }],
  );
});
for (const flag of ["enabled", "assistant_enabled"]) {
  test("refuses an active " + flag + " state before changing content", async () => {
    await db.exec("UPDATE public.academic_courses SET " + flag + "=true");
    const before = await rows();
    await assert.rejects(db.exec(sql), /inactive course/);
    await db.exec("ROLLBACK");
    assert.deepEqual(await rows(), before);
  });
}
test("rolls back earlier rows when a later payload has an unrecorded edit despite its old fingerprint", async () => {
  const last = originals.at(-1).change;
  await db.query(
    "UPDATE public.academic_lesson_content SET payload=jsonb_set(payload,'{unrecorded}', 'true') WHERE lesson_id=$1 AND locale=$2",
    [last.lessonId, last.locale],
  );
  const before = await rows();
  await assert.rejects(db.exec(sql), /Original unapproved payload differs/);
  await db.exec("ROLLBACK");
  assert.deepEqual(await rows(), before);
});
test("refuses a later approved row and rolls back the earlier revisions", async () => {
  const last = originals.at(-1).change;
  await db.query(
    "UPDATE public.academic_lesson_content SET approved=true WHERE lesson_id=$1 AND locale=$2",
    [last.lessonId, last.locale],
  );
  const before = await rows();
  await assert.rejects(db.exec(sql), /Original unapproved payload differs/);
  await db.exec("ROLLBACK");
  assert.deepEqual(await rows(), before);
});
test("refuses a missing later row and rolls back earlier revisions", async () => {
  const last = originals.at(-1).change;
  // Isolated in-memory fixture only; no filesystem or service deletion.
  await db.query("DELETE FROM public.academic_lesson_content WHERE lesson_id=$1 AND locale=$2", [
    last.lessonId,
    last.locale,
  ]);
  const before = await rows();
  await assert.rejects(db.exec(sql), /Original unapproved payload differs/);
  await db.exec("ROLLBACK");
  assert.deepEqual(await rows(), before);
});
test("refuses a mismatched fingerprint even when the payload is the original", async () => {
  const last = originals.at(-1).change;
  await db.query(
    "UPDATE public.academic_lesson_content SET source_sha256='unexpected' WHERE lesson_id=$1 AND locale=$2",
    [last.lessonId, last.locale],
  );
  const before = await rows();
  await assert.rejects(db.exec(sql), /Original unapproved payload differs/);
  await db.exec("ROLLBACK");
  assert.deepEqual(await rows(), before);
});
