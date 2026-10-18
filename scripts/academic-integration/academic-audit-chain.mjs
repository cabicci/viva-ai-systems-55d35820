import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export const ACADEMIC_AUDIT_CHAIN_PATH = "scripts/academic-integration/academic-audit-chain.json";
const MANIFEST_PATH = "scripts/academic-integration/manifest.json";
const ORIGINAL_WORKSTREAM = "7b93d7d707c382c3b2ffc654ece60d43701733c1";
const assert = (condition, message) => {
  if (!condition) throw Error(message);
};
export const canonicalAcademicPayload = (value) =>
  JSON.stringify(value, (_key, child) =>
    child && typeof child === "object" && !Array.isArray(child)
      ? Object.fromEntries(
          Object.keys(child)
            .sort()
            .map((key) => [key, child[key]]),
        )
      : child,
  );
export const academicPayloadHash = (value) =>
  createHash("sha256").update(canonicalAcademicPayload(value)).digest("hex");
const textHash = (value) => createHash("sha256").update(value).digest("hex");
const same = (left, right) => canonicalAcademicPayload(left) === canonicalAcademicPayload(right);
const identity = (lessonId, locale) => locale + "::" + lessonId;

function restoreBefore(change, after) {
  assert(
    academicPayloadHash(after) === change.afterSha256,
    "Recorded stage after fingerprint differs",
  );
  const before = structuredClone(after);
  assert(
    Array.isArray(change.changedFields) && change.changedFields.length > 0,
    "Empty revision fields",
  );
  for (const field of [...change.changedFields].reverse()) {
    const keys = field.path.split(".");
    assert(
      keys.length > 0 &&
        keys.every((key) => key && !["__proto__", "constructor", "prototype"].includes(key)),
      "Invalid revision field path",
    );
    let parent = before;
    for (const key of keys.slice(0, -1)) {
      assert(
        parent && typeof parent === "object" && Object.hasOwn(parent, key),
        "Missing revision field parent",
      );
      parent = parent[key];
    }
    const key = keys.at(-1);
    assert(
      parent && Object.hasOwn(parent, key) && same(parent[key], field.after),
      "Recorded changed field differs: " + field.path,
    );
    if (field.beforeExists === false) {
      assert(
        !Object.hasOwn(field, "before") && !Array.isArray(parent),
        "Invalid absent-field provenance",
      );
      delete parent[key];
    } else {
      assert(Object.hasOwn(field, "before"), "Missing original field value");
      parent[key] = field.before;
    }
  }
  assert(
    academicPayloadHash(before) === change.beforeSha256,
    "Original stage cannot be reconstructed exactly",
  );
  return before;
}

/**
 * Read an immutable receipt chain and verify every recorded row against current
 * source/manifest bytes. The optional reader supplies deterministic test data;
 * it never selects an external service or changes the filesystem.
 */
export function readAcademicAuditChain(read = (path) => readFileSync(path, "utf8")) {
  const chain = JSON.parse(read(ACADEMIC_AUDIT_CHAIN_PATH));
  const manifest = JSON.parse(read(MANIFEST_PATH));
  assert(
    chain.role === "academic-audit-revision-chain" &&
      chain.version === 1 &&
      chain.originalWorkstream === ORIGINAL_WORKSTREAM &&
      manifest.source === ORIGINAL_WORKSTREAM,
    "Wrong academic chain/workstream identity",
  );
  assert(Array.isArray(chain.receipts) && chain.receipts.length > 0, "Missing academic receipts");
  const paths = new Set();
  const groups = new Map();
  const allItems = new Set();
  for (const receipt of chain.receipts) {
    assert(
      /^scripts\/academic-integration\/audit-revision-[a-z0-9-]+\.json$/.test(receipt.path) &&
        /^[a-f0-9]{64}$/.test(receipt.sha256) &&
        !paths.has(receipt.path),
      "Invalid or duplicate receipt identity",
    );
    paths.add(receipt.path);
    const bytes = read(receipt.path);
    assert(
      typeof bytes === "string" && textHash(bytes) === receipt.sha256,
      "Immutable receipt bytes changed",
    );
    const revision = JSON.parse(bytes);
    assert(
      revision.role === "academic-audit-source-revision" &&
        revision.state === "source-only-not-applied-to-database" &&
        revision.originalWorkstream === ORIGINAL_WORKSTREAM &&
        Array.isArray(revision.items) &&
        Array.isArray(revision.changes) &&
        revision.changes.length > 0,
      "Wrong academic revision role/state",
    );
    const seen = new Set();
    const usedItems = new Set();
    for (const change of revision.changes) {
      assert(
        change.courseId === "AC-BUS" &&
          /^AC-BUS-M\d{2}-L\d{2}$/.test(change.lessonId) &&
          ["en", "ar-EG", "ar-MSA", "ar-Gulf"].includes(change.locale) &&
          Number.isInteger(change.item) &&
          change.item >= 1 &&
          change.item <= 160 &&
          revision.items.includes(change.item) &&
          /^[a-f0-9]{64}$/.test(change.beforeSha256) &&
          /^[a-f0-9]{64}$/.test(change.afterSha256) &&
          change.beforeSha256 !== change.afterSha256,
        "Invalid academic revision row identity",
      );
      const key = identity(change.lessonId, change.locale);
      assert(!seen.has(key), "Duplicate row within one receipt");
      seen.add(key);
      usedItems.add(change.item);
      allItems.add(change.item);
      const sourcePath =
        change.sourcePath ??
        (receipt.path === "scripts/academic-integration/audit-revision-8-9-10-40.json"
          ? "experiments/academic/course/expanded/" + change.locale + ".json"
          : null);
      assert(
        typeof sourcePath === "string" &&
          /^experiments\/academic\/(?:content|course\/expanded)\/(?:en|ar-EG|ar-MSA|ar-Gulf)\.json$/.test(
            sourcePath,
          ) &&
          sourcePath.endsWith("/" + change.locale + ".json"),
        "Invalid academic source path",
      );
      const group = groups.get(key) ?? {
        lessonId: change.lessonId,
        locale: change.locale,
        sourcePath,
        stages: [],
      };
      assert(group.sourcePath === sourcePath, "Source path changed across revision stages");
      const previous = group.stages.at(-1);
      assert(
        !previous || previous.change.afterSha256 === change.beforeSha256,
        "Discontinuous academic revision chain",
      );
      group.stages.push({ revisionPath: receipt.path, change });
      groups.set(key, group);
    }
    assert(
      revision.items.length === usedItems.size &&
        revision.items.every((item) => usedItems.has(item)),
      "Revision items differ from their recorded rows",
    );
  }
  const sourceCache = new Map();
  const stages = new Map();
  const rows = [];
  for (const [key, group] of groups) {
    if (!sourceCache.has(group.sourcePath))
      sourceCache.set(group.sourcePath, JSON.parse(read(group.sourcePath)));
    const source = sourceCache.get(group.sourcePath);
    const candidates = Array.isArray(source)
      ? source.filter((row) => row.id === group.lessonId)
      : [source];
    assert(candidates.length === 1, "Missing or duplicate current source lesson");
    const current = candidates[0];
    assert(
      current.id === group.lessonId &&
        current.locale === group.locale &&
        (current.courseId === undefined || current.courseId === "AC-BUS"),
      "Current source lesson identity differs",
    );
    const latestSha256 = academicPayloadHash(current);
    const last = group.stages.at(-1).change;
    const entries = manifest.lessons.filter(
      (entry) =>
        entry.course_id === "AC-BUS" &&
        entry.lesson_id === group.lessonId &&
        entry.locale === group.locale,
    );
    assert(
      entries.length === 1 &&
        entries[0].source_sha256 === latestSha256 &&
        entries[0].approved === false &&
        entries[0].video_guid === null &&
        entries[0].video_ready === false &&
        latestSha256 === last.afterSha256,
      "Current source/manifest/release identity differs",
    );
    let cursor = structuredClone(current);
    const states = [];
    for (const stage of [...group.stages].reverse()) {
      const after = structuredClone(cursor);
      cursor = restoreBefore(stage.change, after);
      stages.set(stage.revisionPath + "::" + key, { payload: after, latestSha256 });
      states.unshift({ sha256: stage.change.afterSha256, payload: after });
    }
    states.unshift({ sha256: group.stages[0].change.beforeSha256, payload: cursor });
    rows.push({
      courseId: "AC-BUS",
      lessonId: group.lessonId,
      locale: group.locale,
      sourcePath: group.sourcePath,
      latestSha256,
      payload: structuredClone(current),
      states,
    });
  }
  return {
    items: [...allItems].sort((a, b) => a - b),
    receiptCount: chain.receipts.length,
    rows,
    stageAfter(revisionPath, lessonId, locale) {
      const stage = stages.get(revisionPath + "::" + identity(lessonId, locale));
      assert(stage, "Requested academic stage is not recorded");
      return structuredClone(stage);
    },
  };
}

export function renderCurrentAcademicAuditSQL(snapshot = readAcademicAuditChain()) {
  const literal = (value) => "'" + String(value).replaceAll("'", "''") + "'";
  const body = [
    "DECLARE course_enabled boolean; assistant_enabled boolean; row_count integer;",
    "BEGIN",
    "SELECT c.enabled, c.assistant_enabled INTO course_enabled, assistant_enabled FROM public.academic_courses AS c WHERE c.id = 'AC-BUS' FOR UPDATE;",
    "IF course_enabled IS DISTINCT FROM false OR assistant_enabled IS DISTINCT FROM false THEN RAISE EXCEPTION 'Academic revision requires the existing inactive course and disabled assistant'; END IF;",
  ];
  for (const row of snapshot.rows) {
    const where =
      "course_id = 'AC-BUS' AND lesson_id = " +
      literal(row.lessonId) +
      " AND locale = " +
      literal(row.locale);
    const finalPayload = literal(canonicalAcademicPayload(row.payload)) + "::jsonb";
    const known = [
      ...new Map(
        row.states
          .filter((state) => state.sha256 !== row.latestSha256)
          .map((state) => [state.sha256, state]),
      ).values(),
    ];
    assert(known.length > 0, "No recorded original academic state");
    const precondition = known
      .map(
        (state) =>
          "(source_sha256 = " +
          literal(state.sha256) +
          " AND payload = " +
          literal(canonicalAcademicPayload(state.payload)) +
          "::jsonb)",
      )
      .join(" OR ");
    body.push(
      "IF EXISTS (SELECT 1 FROM public.academic_lesson_content WHERE " +
        where +
        " AND source_sha256 = " +
        literal(row.latestSha256) +
        " AND payload = " +
        finalPayload +
        " AND approved = false) THEN NULL;",
      "ELSE",
      "UPDATE public.academic_lesson_content SET payload = " +
        finalPayload +
        ", source_sha256 = " +
        literal(row.latestSha256) +
        " WHERE " +
        where +
        " AND approved = false AND (" +
        precondition +
        ");",
      "GET DIAGNOSTICS row_count = ROW_COUNT;",
      "IF row_count <> 1 THEN RAISE EXCEPTION 'Known unapproved payload differs for " +
        row.lessonId +
        "/" +
        row.locale +
        "'; END IF;",
      "END IF;",
    );
  }
  body.push("END;");
  const text = body.join("\n");
  let tag = "$academic_audit_current$";
  let suffix = 0;
  while (text.includes(tag)) tag = "$academic_audit_current_" + ++suffix + "$";
  const sql =
    [
      "BEGIN;",
      "LOCK TABLE public.academic_lesson_content IN SHARE ROW EXCLUSIVE MODE;",
      "DO " + tag,
      text,
      tag + ";",
      "COMMIT;",
    ].join("\n") + "\n";
  return {
    sql,
    report: {
      items: snapshot.items,
      sourceLessons: snapshot.rows.length,
      immutableReceipts: snapshot.receiptCount,
      exactRecordedStages: true,
      databaseChanged: false,
    },
  };
}
