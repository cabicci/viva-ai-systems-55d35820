import { readAcademicAuditChain } from "./academic-audit-chain.mjs";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { pathToFileURL } from "node:url";

export function checkAcademicCompletionRevision() {
  const base = "scripts/academic-integration/";
  const revision = JSON.parse(readFileSync(base + "audit-revision-17-30.json", "utf8"));
  const manifest = JSON.parse(readFileSync(base + "manifest.json", "utf8"));
  const chain = readAcademicAuditChain();
  const canonical = (value) =>
    JSON.stringify(value, (_key, child) =>
      child && typeof child === "object" && !Array.isArray(child)
        ? Object.fromEntries(
            Object.keys(child)
              .sort()
              .map((key) => [key, child[key]]),
          )
        : child,
    );
  const sha = (value) => createHash("sha256").update(canonical(value)).digest("hex");
  const same = (left, right) => canonical(left) === canonical(right);
  const assert = (condition, message) => {
    if (!condition) throw Error(message);
  };
  assert(
    revision.role === "academic-audit-source-revision" &&
      revision.state === "source-only-not-applied-to-database",
    "Wrong revision role/state",
  );
  assert(
    revision.changes.length === 11 &&
      JSON.stringify(revision.items) === "[17,18,19,20,21,26,27,28,29,30]",
    "Unexpected revision scope",
  );
  const statements = [
    "BEGIN;",
    "LOCK TABLE public.academic_lesson_content IN SHARE ROW EXCLUSIVE MODE;",
    "DO $audit_revision$",
    "DECLARE course_enabled boolean; assistant_enabled boolean; row_count integer;",
    "BEGIN",
    "SELECT enabled, academic_courses.assistant_enabled INTO course_enabled, assistant_enabled FROM public.academic_courses WHERE id = 'AC-BUS' FOR UPDATE;",
    "IF course_enabled IS DISTINCT FROM false OR assistant_enabled IS DISTINCT FROM false THEN RAISE EXCEPTION 'Academic revision requires the existing inactive course and disabled assistant'; END IF;",
  ];
  const literal = (value) => "'" + String(value).replaceAll("'", "''") + "'";
  const expected = [
    {
      item: 17,
      lessonId: "AC-BUS-M02-L02",
      locale: "ar-Gulf",
      sourcePath: "experiments/academic/course/expanded/ar-Gulf.json",
      beforeSha256: "65948c66d589f37336f1f3bf47f735bc2770514007f2df08827145d77b1fa44c",
    },
    {
      item: 18,
      lessonId: "AC-BUS-M03-L03",
      locale: "ar-EG",
      sourcePath: "experiments/academic/course/expanded/ar-EG.json",
      beforeSha256: "b519a65249af8578d6fbf0f22b83c1dde1cdd610b1fdfdecdf1cd563142cdc33",
    },
    {
      item: 19,
      lessonId: "AC-BUS-M06-L01",
      locale: "ar-MSA",
      sourcePath: "experiments/academic/course/expanded/ar-MSA.json",
      beforeSha256: "e4886ec93ded8c929e75fe1a11eab990c9441df4c6529fc5eac46e8aa9953fd6",
    },
    {
      item: 20,
      lessonId: "AC-BUS-M07-L08",
      locale: "ar-Gulf",
      sourcePath: "experiments/academic/course/expanded/ar-Gulf.json",
      beforeSha256: "04aeff0e6e7b96c847616f5cd0c37ff94d4b9f21e01549081020906ed087ab17",
    },
    {
      item: 21,
      lessonId: "AC-BUS-M02-L01",
      locale: "ar-MSA",
      sourcePath: "experiments/academic/course/expanded/ar-MSA.json",
      beforeSha256: "2171f793d9566d9563e40876d48cf3f50e995e0932db1953c49a16af4251bd16",
    },
    {
      item: 21,
      lessonId: "AC-BUS-M02-L01",
      locale: "en",
      sourcePath: "experiments/academic/course/expanded/en.json",
      beforeSha256: "b117ecfa0711dc708e410a6e50c673e48e84ecfb3cdecaab661ea918e4cff6a4",
    },
    {
      item: 26,
      lessonId: "AC-BUS-M06-L03",
      locale: "ar-MSA",
      sourcePath: "experiments/academic/course/expanded/ar-MSA.json",
      beforeSha256: "0224b1dc77d58ade1f56a9e15e6cdb65a173bb2bdf734bbb2652479effc36030",
    },
    {
      item: 27,
      lessonId: "AC-BUS-M04-L01",
      locale: "ar-MSA",
      sourcePath: "experiments/academic/course/expanded/ar-MSA.json",
      beforeSha256: "38caa09f3010df46033b2fa473bafcedd0834950c539a4b9565d95fd3770d7ce",
    },
    {
      item: 28,
      lessonId: "AC-BUS-M05-L02",
      locale: "ar-MSA",
      sourcePath: "experiments/academic/course/expanded/ar-MSA.json",
      beforeSha256: "93779fab38d7121218d0e407975fb481c5e2adbcc12ed20ad92da79fe9bd0d74",
    },
    {
      item: 29,
      lessonId: "AC-BUS-M01-L03",
      locale: "ar-Gulf",
      sourcePath: "experiments/academic/course/expanded/ar-Gulf.json",
      beforeSha256: "a7b2072ed34ce49b425c86f54db694a22f789ae11f65557b7246dd889fc99b78",
    },
    {
      item: 30,
      lessonId: "AC-BUS-M01-L01",
      locale: "ar-Gulf",
      sourcePath: "experiments/academic/content/ar-Gulf.json",
      beforeSha256: "355e0617348058e6583c2be83d8521ea20c7e0b063546ed708e9bfb4e57a406a",
    },
  ];
  for (const [index, change] of revision.changes.entries()) {
    assert(
      change.courseId === "AC-BUS" &&
        revision.originalWorkstream === manifest.source &&
        Object.entries(expected[index]).every(([key, value]) => change[key] === value),
      "Unexpected revision identity",
    );
    const { payload: after, latestSha256 } = chain.stageAfter(
      "scripts/academic-integration/audit-revision-17-30.json",
      change.lessonId,
      change.locale,
    );
    assert(
      after &&
        after.id === change.lessonId &&
        after.locale === change.locale &&
        sha(after) === change.afterSha256,
      "Revised source fingerprint differs",
    );
    const entry = manifest.lessons.find(
      (row) => row.lesson_id === change.lessonId && row.locale === change.locale,
    );
    assert(
      entry?.source_sha256 === latestSha256 &&
        entry.approved === false &&
        entry.video_guid === null &&
        entry.video_ready === false,
      "Delivery source or release/media state differs",
    );
    const before = structuredClone(after);
    for (const field of [...change.changedFields].reverse()) {
      const keys = field.path.split(".");
      assert(
        keys.length > 0 &&
          keys.every((key) => key && !["__proto__", "prototype", "constructor"].includes(key)),
        "Invalid field path",
      );
      let parent = before;
      for (const key of keys.slice(0, -1)) {
        assert(parent && Object.hasOwn(parent, key), "Missing field parent");
        parent = parent[key];
      }
      const key = keys.at(-1);
      assert(
        Object.hasOwn(parent, key) && same(parent[key], field.after),
        "Changed field differs: " + field.path,
      );
      if (field.beforeExists === true) parent[key] = field.before;
      else {
        assert(
          field.beforeExists === false && !Object.hasOwn(field, "before"),
          "Invalid absent-field provenance",
        );
        delete parent[key];
      }
    }
    assert(sha(before) === change.beforeSha256, "Original source cannot be reconstructed exactly");
    const where = `course_id = 'AC-BUS' AND lesson_id = ${literal(change.lessonId)} AND locale = ${literal(change.locale)}`;
    // Exact whole-payload comparison detects unrecorded edits even if a stale fingerprint was retained.
    statements.push(
      `IF EXISTS (SELECT 1 FROM public.academic_lesson_content WHERE ${where} AND source_sha256 = ${literal(change.afterSha256)} AND payload = ${literal(canonical(after))}::jsonb AND approved = false) THEN NULL;`,
      "ELSE",
      `UPDATE public.academic_lesson_content SET payload = ${literal(canonical(after))}::jsonb, source_sha256 = ${literal(change.afterSha256)} WHERE ${where} AND source_sha256 = ${literal(change.beforeSha256)} AND payload = ${literal(canonical(before))}::jsonb AND approved = false;`,
      "GET DIAGNOSTICS row_count = ROW_COUNT;",
      `IF row_count <> 1 THEN RAISE EXCEPTION 'Original unapproved payload differs for ${change.lessonId}/${change.locale}'; END IF;`,
      "END IF;",
    );
  }
  // Check the example's fixed-volume arithmetic independently of its prose.
  const revenue = 20 * 150;
  const directCost = 20 * 90;
  const baselineResult = revenue - directCost - 900;
  const discountResult = 20 * (150 - 10) - directCost - 900;
  const collections = revenue - 600;
  assert(
    revenue === 3000 &&
      directCost === 1800 &&
      baselineResult === 300 &&
      discountResult === 100 &&
      collections === 2400,
    "Fixed-volume price example",
  );
  statements.push("END;", "$audit_revision$;", "COMMIT;");
  return {
    sql: statements.join("\n") + "\n",
    report: {
      items: revision.items,
      sourceLessons: 11,
      exactBeforeAfter: true,
      arithmetic: { revenue, directCost, baselineResult, discountResult, collections },
      databaseChanged: false,
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const sqlArg = process.argv.indexOf("--sql");
  if (!process.argv.includes("--check") && sqlArg < 0)
    throw Error("Use --check or --sql NEW_REVIEW_FILE.sql; this tool never connects to a database");
  const { sql, report } = checkAcademicCompletionRevision();
  if (sqlArg >= 0) {
    if (!process.argv[sqlArg + 1]) throw Error("Provide an explicit new SQL output path");
    writeFileSync(resolve(process.argv[sqlArg + 1]), sql, { encoding: "utf8", flag: "wx" });
  }
  console.log(JSON.stringify({ ...report, sqlRendered: sqlArg >= 0 }));
}
