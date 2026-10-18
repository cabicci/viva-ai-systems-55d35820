import { readAcademicAuditChain } from "../../../scripts/academic-integration/academic-audit-chain.mjs";
// @vitest-environment node
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { checkAcademicAuditRevision } from "../../../scripts/academic-integration/check-audit-revision.mjs";

type Payload = Record<string, unknown>;
type Change = {
  lessonId: string;
  locale: string;
  beforeSha256: string;
  afterSha256: string;
  changedFields: Array<{ path: string; before: unknown }>;
};
const receipt = JSON.parse(
  readFileSync("scripts/academic-integration/audit-revision-8-9-10-40.json", "utf8"),
) as { changes: Change[] };
const { sql, report } = checkAcademicAuditRevision();
const chain = readAcademicAuditChain();
const originals = receipt.changes.map((change) => {
  const after = chain.stageAfter(
    "scripts/academic-integration/audit-revision-8-9-10-40.json",
    change.lessonId,
    change.locale,
  ).payload as Payload;
  const before = structuredClone(after);
  for (const field of [...change.changedFields].reverse()) {
    const keys = field.path.split(".");
    let parent = before;
    for (const key of keys.slice(0, -1)) parent = parent[key] as Payload;
    parent[keys.at(-1)!] = field.before;
  }
  return { change, before, after };
});
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
 CREATE TABLE public.academic_courses(id text PRIMARY KEY,enabled boolean,assistant_enabled boolean);
 CREATE TABLE public.academic_lesson_content(course_id text,lesson_id text,locale text,source_sha256 text,payload jsonb,approved boolean,video_guid text,video_ready boolean,PRIMARY KEY(course_id,lesson_id,locale));
 `);
}, 30000);
afterAll(async () => db?.close());
beforeEach(async () => {
  await db.exec(
    "TRUNCATE public.academic_lesson_content,public.academic_courses; INSERT INTO public.academic_courses VALUES ('AC-BUS',false,false);",
  );
  for (const { change, before } of originals)
    await db.query(
      "INSERT INTO public.academic_lesson_content VALUES ('AC-BUS',$1,$2,$3,$4,false,'unchanged-media',true)",
      [change.lessonId, change.locale, change.beforeSha256, JSON.stringify(before)],
    );
});
const rows = async () =>
  (
    await db.query<{
      source_sha256: string;
      approved: boolean;
      video_guid: string;
      video_ready: boolean;
    }>(
      "SELECT source_sha256,approved,video_guid,video_ready FROM public.academic_lesson_content ORDER BY lesson_id,locale",
    )
  ).rows;
it("revises all four exact payloads atomically, preserves release/media state and is idempotent", async () => {
  expect(report.databaseChanged).toBe(false);
  await db.exec(sql);
  for (const { change, after } of originals) {
    const result = await db.query<{
      payload: Payload;
      source_sha256: string;
      approved: boolean;
      video_guid: string;
      video_ready: boolean;
    }>("SELECT * FROM public.academic_lesson_content WHERE lesson_id=$1 AND locale=$2", [
      change.lessonId,
      change.locale,
    ]);
    expect(result.rows[0]).toMatchObject({
      payload: after,
      source_sha256: change.afterSha256,
      approved: false,
      video_guid: "unchanged-media",
      video_ready: true,
    });
  }
  const once = await rows();
  await db.exec(sql);
  expect(await rows()).toEqual(once);
});
it.each(["enabled", "assistant_enabled"])(
  "rejects an active %s state before updating any row",
  async (field) => {
    await db.exec(`UPDATE public.academic_courses SET ${field}=true`);
    const before = await rows();
    await expect(db.exec(sql)).rejects.toThrow(/inactive course/);
    await db.exec("ROLLBACK");
    expect(await rows()).toEqual(before);
  },
);
it("rolls back earlier updates when the last payload has unrecorded edits despite an unchanged fingerprint", async () => {
  const last = originals.at(-1)!.change;
  await db.query(
    "UPDATE public.academic_lesson_content SET payload=jsonb_set(payload,'{unexpected}', 'true') WHERE lesson_id=$1 AND locale=$2",
    [last.lessonId, last.locale],
  );
  const before = await rows();
  await expect(db.exec(sql)).rejects.toThrow(/Original unapproved payload differs/);
  await db.exec("ROLLBACK");
  expect(await rows()).toEqual(before);
});
it("rejects an approved row and leaves all fingerprints unchanged", async () => {
  const last = originals.at(-1)!.change;
  await db.query(
    "UPDATE public.academic_lesson_content SET approved=true WHERE lesson_id=$1 AND locale=$2",
    [last.lessonId, last.locale],
  );
  const before = await rows();
  await expect(db.exec(sql)).rejects.toThrow(/Original unapproved payload differs/);
  await db.exec("ROLLBACK");
  expect(await rows()).toEqual(before);
});
