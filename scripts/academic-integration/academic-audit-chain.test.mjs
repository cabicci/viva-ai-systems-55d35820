import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import {
  ACADEMIC_AUDIT_CHAIN_PATH,
  academicPayloadHash,
  readAcademicAuditChain,
  renderCurrentAcademicAuditSQL,
} from "./academic-audit-chain.mjs";

const WORKSTREAM = "7b93d7d707c382c3b2ffc654ece60d43701733c1";
const textHash = (value) => createHash("sha256").update(value).digest("hex");
function fixture(mutate = () => {}) {
  const base = {
    id: "AC-BUS-M02-L01",
    locale: "en",
    courseId: "AC-BUS",
    title: "Original",
    example: {},
  };
  const middle = { ...structuredClone(base), title: "First revision" };
  const current = {
    ...structuredClone(middle),
    title: "Final revision",
    example: { steps: ["one"] },
  };
  const sourcePath = "experiments/academic/course/expanded/en.json";
  const make = (item, old, next, changedFields) => ({
    role: "academic-audit-source-revision",
    state: "source-only-not-applied-to-database",
    originalWorkstream: WORKSTREAM,
    items: [item],
    changes: [
      {
        item,
        courseId: "AC-BUS",
        lessonId: base.id,
        locale: "en",
        sourcePath,
        beforeSha256: academicPayloadHash(old),
        afterSha256: academicPayloadHash(next),
        changedFields,
      },
    ],
  });
  const first = make(21, base, middle, [
    { path: "title", before: base.title, after: middle.title },
  ]);
  const second = make(22, middle, current, [
    { path: "title", beforeExists: true, before: middle.title, after: current.title },
    { path: "example.steps", beforeExists: false, after: current.example.steps },
  ]);
  const manifest = {
    source: WORKSTREAM,
    lessons: [
      {
        course_id: "AC-BUS",
        lesson_id: base.id,
        locale: "en",
        source_sha256: academicPayloadHash(current),
        approved: false,
        video_guid: null,
        video_ready: false,
      },
    ],
  };
  const paths = [
    "scripts/academic-integration/audit-revision-fixture-1.json",
    "scripts/academic-integration/audit-revision-fixture-2.json",
  ];
  mutate({ base, middle, current, first, second, manifest, sourcePath });
  const documents = new Map([
    [sourcePath, JSON.stringify([current])],
    ["scripts/academic-integration/manifest.json", JSON.stringify(manifest)],
    [paths[0], JSON.stringify(first)],
    [paths[1], JSON.stringify(second)],
  ]);
  const chain = {
    role: "academic-audit-revision-chain",
    version: 1,
    originalWorkstream: WORKSTREAM,
    receipts: paths.map((path) => ({ path, sha256: textHash(documents.get(path)) })),
  };
  documents.set(ACADEMIC_AUDIT_CHAIN_PATH, JSON.stringify(chain));
  const read = (path) => {
    assert(documents.has(path), "Unexpected fixture path " + path);
    return documents.get(path);
  };
  return { documents, read, paths, base, middle, current, sourcePath };
}
describe("immutable academic stage reconstruction", () => {
  test("reconstructs overlapping historical edits and an originally absent field without repinning the original", () => {
    const f = fixture();
    const chain = readAcademicAuditChain(f.read);
    assert.equal(chain.receiptCount, 2);
    assert.deepEqual(
      chain.rows[0].states.map((row) => row.payload),
      [f.base, f.middle, f.current],
    );
    const stage = chain.stageAfter(f.paths[0], f.base.id, "en");
    assert.deepEqual(stage.payload, f.middle);
    assert.equal(Object.hasOwn(stage.payload.example, "steps"), false);
    assert.equal(stage.latestSha256, academicPayloadHash(f.current));
  });
  test("rejects changed receipt bytes even when parsed content would be equivalent", () => {
    const f = fixture();
    f.documents.set(f.paths[0], f.documents.get(f.paths[0]) + "\n");
    assert.throws(() => readAcademicAuditChain(f.read), /receipt bytes changed/);
  });
  test("rejects a disconnected historical fingerprint instead of treating it as an arbitrary allowed state", () => {
    const f = fixture(({ base, second }) => {
      second.changes[0].beforeSha256 = academicPayloadHash(base);
    });
    assert.throws(() => readAcademicAuditChain(f.read), /Discontinuous/);
  });
  test("rejects a recorded leaf that differs from the reconstructed current payload", () => {
    const f = fixture(({ second }) => {
      second.changes[0].changedFields[1].after = ["different"];
    });
    assert.throws(() => readAcademicAuditChain(f.read), /changed field differs/);
  });
  test("rejects a source path outside the academic content roots before attempting to read it", () => {
    const f = fixture(({ first }) => {
      first.changes[0].sourcePath = "../outside.json";
    });
    assert.throws(() => readAcademicAuditChain(f.read), /Invalid academic source path/);
  });
  test("rejects a source edit with an unchanged stale manifest fingerprint", () => {
    const f = fixture();
    f.documents.set(f.sourcePath, JSON.stringify([{ ...f.current, unrecorded: true }]));
    assert.throws(() => readAcademicAuditChain(f.read), /Current source\/manifest\/release/);
  });
  test("rejects approved release state while validating the latest source", () => {
    const f = fixture(({ manifest }) => {
      manifest.lessons[0].approved = true;
    });
    assert.throws(() => readAcademicAuditChain(f.read), /Current source\/manifest\/release/);
  });
  test("rejects duplicate receipt identities", () => {
    const f = fixture();
    const chain = JSON.parse(f.documents.get(ACADEMIC_AUDIT_CHAIN_PATH));
    chain.receipts.push(chain.receipts[0]);
    f.documents.set(ACADEMIC_AUDIT_CHAIN_PATH, JSON.stringify(chain));
    assert.throws(() => readAcademicAuditChain(f.read), /duplicate receipt identity/);
  });
  test("does not fall back to current source for an unrecorded requested stage", () => {
    const f = fixture();
    const chain = readAcademicAuditChain(f.read);
    assert.throws(() => chain.stageAfter("not-recorded", f.base.id, "en"), /stage is not recorded/);
  });
});

describe("current guarded delivery proposal in isolated PostgreSQL", () => {
  const snapshot = readAcademicAuditChain();
  const { sql, report } = renderCurrentAcademicAuditSQL(snapshot);
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
    for (const row of snapshot.rows) {
      const original = row.states[0];
      await db.query(
        "INSERT INTO public.academic_lesson_content VALUES ('AC-BUS',$1,$2,$3,$4,false,'preserve-media',true)",
        [row.lessonId, row.locale, original.sha256, JSON.stringify(original.payload)],
      );
    }
  });
  const rows = async () =>
    (await db.query("SELECT * FROM public.academic_lesson_content ORDER BY lesson_id,locale")).rows;
  test("accepts exact original/intermediate/latest rows together and preserves six-field order, release and media", async () => {
    assert.equal(report.databaseChanged, false);
    const leadership = snapshot.rows.find(
      (row) => row.lessonId === "AC-BUS-M02-L01" && row.locale === "en",
    );
    assert.equal(leadership.states.length, 3);
    assert.equal(leadership.states[1].payload.assignment.fields.length, 5);
    assert.equal(leadership.payload.assignment.fields.length, 6);
    assert.deepEqual(
      leadership.payload.assignment.rubric,
      leadership.states[1].payload.assignment.rubric,
    );
    assert.deepEqual(
      leadership.payload.assignment.criteria,
      leadership.states[1].payload.assignment.criteria,
    );
    const intermediate = leadership.states[1];
    await db.query(
      "UPDATE public.academic_lesson_content SET payload=$1,source_sha256=$2 WHERE lesson_id=$3 AND locale=$4",
      [
        JSON.stringify(intermediate.payload),
        intermediate.sha256,
        leadership.lessonId,
        leadership.locale,
      ],
    );
    const first = snapshot.rows[0];
    await db.query(
      "UPDATE public.academic_lesson_content SET payload=$1,source_sha256=$2 WHERE lesson_id=$3 AND locale=$4",
      [JSON.stringify(first.payload), first.latestSha256, first.lessonId, first.locale],
    );
    await db.exec(sql);
    for (const row of snapshot.rows) {
      const { rows: actual } = await db.query(
        "SELECT * FROM public.academic_lesson_content WHERE lesson_id=$1 AND locale=$2",
        [row.lessonId, row.locale],
      );
      assert.deepEqual(actual[0].payload, row.payload);
      assert.equal(actual[0].source_sha256, row.latestSha256);
      assert.equal(actual[0].approved, false);
      assert.equal(actual[0].video_guid, "preserve-media");
      assert.equal(actual[0].video_ready, true);
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
    test("refuses active " + flag + " before content changes", async () => {
      await db.exec("UPDATE public.academic_courses SET " + flag + "=true");
      const prior = await rows();
      await assert.rejects(db.exec(sql), /inactive course/);
      await db.exec("ROLLBACK");
      assert.deepEqual(await rows(), prior);
    });
  }
  test("rolls back all earlier rows when a later payload has an unrecorded edit", async () => {
    const row = snapshot.rows.at(-1);
    await db.query(
      "UPDATE public.academic_lesson_content SET payload=jsonb_set(payload,'{unrecorded}', 'true') WHERE lesson_id=$1 AND locale=$2",
      [row.lessonId, row.locale],
    );
    const prior = await rows();
    await assert.rejects(db.exec(sql), /Known unapproved payload differs/);
    await db.exec("ROLLBACK");
    assert.deepEqual(await rows(), prior);
  });
  test("refuses an approved later row and rolls back earlier updates", async () => {
    const row = snapshot.rows.at(-1);
    await db.query(
      "UPDATE public.academic_lesson_content SET approved=true WHERE lesson_id=$1 AND locale=$2",
      [row.lessonId, row.locale],
    );
    const prior = await rows();
    await assert.rejects(db.exec(sql), /Known unapproved payload differs/);
    await db.exec("ROLLBACK");
    assert.deepEqual(await rows(), prior);
  });
  test("refuses a missing later row without inserting or retaining earlier updates", async () => {
    const row = snapshot.rows.at(-1);
    // This deletion is an isolated in-memory test fixture, not a service or file operation.
    await db.query("DELETE FROM public.academic_lesson_content WHERE lesson_id=$1 AND locale=$2", [
      row.lessonId,
      row.locale,
    ]);
    const prior = await rows();
    await assert.rejects(db.exec(sql), /Known unapproved payload differs/);
    await db.exec("ROLLBACK");
    assert.deepEqual(await rows(), prior);
  });
  test("refuses a stale unknown fingerprint even for an otherwise recorded payload", async () => {
    const row = snapshot.rows.at(-1);
    await db.query(
      "UPDATE public.academic_lesson_content SET source_sha256='unknown' WHERE lesson_id=$1 AND locale=$2",
      [row.lessonId, row.locale],
    );
    const prior = await rows();
    await assert.rejects(db.exec(sql), /Known unapproved payload differs/);
    await db.exec("ROLLBACK");
    assert.deepEqual(await rows(), prior);
  });
});
