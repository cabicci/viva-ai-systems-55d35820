import * as assert from "node:assert/strict";
import { LegacyProjectionInputError, projectLegacyHistory } from "../learning-read/legacy-projection.ts";

// Keep the project's normal Vitest registration. The identical handwritten
// cases can also run with local Node when the shared Vitest loader is stalled.
const runner = process.env.MASAARAT_LEGACY_TEST_RUNNER === "node" ? "node:test" : "vitest";
const { describe, it } = await import(runner) as Pick<typeof import("node:test"), "describe" | "it">;

function cases<T>(values: readonly T[], name: string, run: (value: T) => void) {
  for (const [index, value] of values.entries()) it(`${name} #${index + 1}`, () => run(value));
}

const ACTOR = "11111111-1111-4111-8111-111111111111";
const CHILD = "22222222-2222-4222-8222-222222222222";
const OTHER = "33333333-3333-4333-8333-333333333333";
const OBSERVED = "2026-10-24T13:00:00.123456Z";
const RECORDED = "2026-04-01T08:30:00.987654Z";
const U = { state: "unknown", value: null, reason: "not_recorded_legacy" };
function mission(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { id: "old-row", user_id: ACTOR, mission_id: "lesson::mission", lesson_id: "lesson-a",
    status: "passed", score: 72.5, created_at: RECORDED, attempt_count: 7, ...overrides };
}
function quiz(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { id: "old-row", user_id: ACTOR, lesson_id: "lesson-a", question_id: "lesson-a::quiz::0",
    selected_index: 1, is_correct: true, attempted_at: RECORDED, ...overrides };
}
function visit(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { user_id: ACTOR, line: "academic", course_id: "course-a", subject_id: ACTOR,
    profile_id: null, lesson_id: "lesson-b", visited_at: RECORDED, locale: "ar-EG", ...overrides };
}
function entry(row: Record<string, unknown>, locator = String(row.id ?? "bookmark-a")) { return { locator, row }; }
function source(kind: "mission" | "quiz" | "bookmark", rows: ReturnType<typeof entry>[] = [],
  load_state = "succeeded", completeness = "complete", source_id = kind) {
  return { source_id, kind, rows, load_state, completeness };
}
function input(sources = [source("mission", [entry(mission())])], subject = { kind: "auth_user", id: ACTOR }) {
  return { actor_user_id: ACTOR, subject, observed_at: OBSERVED, sources };
}
function fact(value: unknown) {
  const first = projectLegacyHistory(value).records[0];
  if (first?.record_type !== "legacy_fact") throw new Error("Expected a legacy fact");
  return first.record;
}
function mark(value: unknown) {
  const first = projectLegacyHistory(value).records[0];
  if (first?.record_type !== "bookmark") throw new Error("Expected a bookmark");
  return first.record;
}
function error(value: unknown, code: string) {
  try { projectLegacyHistory(value); throw new Error("Expected rejection"); }
  catch (caught) {
    assert.ok((caught) instanceof LegacyProjectionInputError);
    assert.strictEqual((caught as LegacyProjectionInputError).code, code);
  }
}
function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

describe("recorded legacy facts and honest unknown references", () => {
  it("keeps a legacy row and its physical locator without minting controlled identity", () => {
    const id = "abcdefab-1234-4123-8123-123456789abc";
    const result = fact(input([source("mission", [entry(mission({ id }))])]));
    assert.deepStrictEqual(result.source, { source_kind: "legacy_mission", locator: id });
    assert.strictEqual(result.fact_kind, "mission_submission");
    assert.deepStrictEqual(result.learning.item_id, { state: "known", value: "lesson-a" });
    for (const field of ["enrollment_id", "content_version", "curriculum_manifest_id", "curriculum_manifest_sha256",
      "policy_version", "locale_registry_version", "actual_content_locale_id", "requested_content_locale_id",
      "equivalence_version", "fallback_rule_version"] as const) assert.deepStrictEqual(result.learning[field], U);
    assert.deepStrictEqual(result.actual_assessment_locale_id, U);
    assert.strictEqual(result.grading_provenance, "unknown_legacy");
    assert.deepStrictEqual(result.score_scale_ref, U);
    assert.deepStrictEqual(result.provenance.source_revision, U);
  });
  it("keeps score zero and timestamp precision without deriving count, scale or receipt", () => {
    const row = mission({ score: 0, created_at: "2026-04-01T08:30:00.987654+00:00" });
    const result = fact(input([source("mission", [entry(row)])]));
    assert.deepStrictEqual(result.score, { state: "known", value: "0" });
    assert.deepStrictEqual(result.provenance.recorded_at, { state: "known", value: RECORDED });
    assert.strictEqual(result.provenance.observed_at, OBSERVED);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(result, "attempt_count"), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(result, "receipt"), false);
    assert.strictEqual(row.created_at, "2026-04-01T08:30:00.987654+00:00");
    assert.strictEqual(row.attempt_count, 7);
  });
  cases([["-0.5000", "-0.5000"], [1e-7, "0.0000001"], [1.2e21, "1200000000000000000000"], [-0, "-0"]],
    "represents an already recorded score without policy or scale coercion: %s", ([value, rendered]) => {
      assert.deepStrictEqual(fact(input([source("mission", [entry(mission({ score: value }))])])).score, { state: "known", value: rendered });
    });
  it("does not promote caller-supplied UI/version/enrollment claims", () => {
    const row = mission({ enrollment_id: OTHER, definition_sha256: "private", snapshot_sha256: "new",
      canonicalVersion: "today", assessment_locale_id: "en", ui_locale: "en", actual_content_locale_id: "en" });
    assert.deepStrictEqual(fact(input([source("mission", [entry(row)])])).learning.actual_content_locale_id, U);
    assert.deepStrictEqual(fact(input([source("mission", [entry(row)])])).learning.enrollment_id, U);
  });
  it("labels a recorded practice boolean without creating an official grade or answer", () => {
    const record = fact(input([source("quiz", [entry(quiz({ is_correct: false, score: 100 }))])]));
    assert.strictEqual(record.source.source_kind, "legacy_quiz_attempt");
    assert.deepStrictEqual(record.observed_status, { state: "known", value: "is_correct=false" });
    assert.deepStrictEqual(record.score, U);
    assert.deepStrictEqual(record.original_response, { status: "not_requested", value: null });
    assert.strictEqual(Object.prototype.hasOwnProperty.call(record, "selected_index"), false);
  });
  it("represents a mutable draft as legacy_draft, not a controlled draft", () => {
    const result = fact(input([source("mission", [entry(mission({ status: "draft" }))])]));
    assert.strictEqual(result.fact_kind, "draft");
    assert.strictEqual(result.source.source_kind, "legacy_draft");
    assert.strictEqual(Object.prototype.hasOwnProperty.call(result, "draft_id"), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(result, "revision"), false);
  });
  it("retains a row with missing historical fields as unknown", () => {
    const result = fact(input([source("mission", [entry({ id: "old-row", user_id: ACTOR })])]));
    assert.deepStrictEqual(result.learning.item_id, U);
    assert.deepStrictEqual(result.observed_status, U);
    assert.deepStrictEqual(result.score, U);
    assert.deepStrictEqual(result.provenance.recorded_at, U);
  });
});

describe("typed source identity and real child bookmark scope", () => {
  it("does not collapse the same opaque ID across mission and quiz sources", () => {
    const result = projectLegacyHistory(input([source("mission", [entry(mission())]), source("quiz", [entry(quiz())])]));
    assert.strictEqual((result.records).length, 2);
    assert.deepStrictEqual(result.records.map(r => r.record_type === "legacy_fact" && r.record.source.source_kind), ["legacy_mission", "legacy_quiz_attempt"]);
  });
  it("rejects duplicate same-kind identity rather than merging or dropping a row", () => {
    error(input([source("mission", [entry(mission()), entry(mission({ score: 1 }))])]), "DUPLICATE_LEGACY_SOURCE");
  });
  it("preserves a genuine child's recorded bookmark composite and unknown eligibility", () => {
    const row = visit({ line: "kids", subject_id: CHILD, profile_id: CHILD, locale: "en" });
    const result = mark(input([source("bookmark", [entry(row, "legacy-child-bookmark")])], { kind: "kids_profile", id: CHILD }));
    assert.deepStrictEqual(result.logical_key, { subject: { kind: "kids_profile", id: CHILD }, area: "kids", course_id: "course-a", enrollment_id: U });
    assert.strictEqual(result.bookmark_id, "legacy-child-bookmark");
    assert.deepStrictEqual(result.provenance.source, { source_kind: "legacy_bookmark", locator: "legacy-child-bookmark" });
    assert.deepStrictEqual(result.last_visited_at, { state: "known", value: RECORDED });
    assert.strictEqual(result.resume_status, "reference_unknown");
    assert.strictEqual(result.receipt, null);
    assert.deepStrictEqual(result.learning.actual_content_locale_id, U);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(result, "locale"), false);
  });
  cases(["mission", "quiz"] as const, "does not reattribute an actor-only %s row to a child", kind => {
    const row = kind === "mission" ? mission({ profile_id: CHILD }) : quiz({ profile_id: CHILD });
    error(input([source(kind, [entry(row)])], { kind: "kids_profile", id: CHILD }), "SUBJECT_MISMATCH");
  });
  cases([
    { profile_id: OTHER }, { subject_id: OTHER }, { user_id: OTHER },
  ], "rejects a child bookmark with conflicting actual fields: %j", change => {
    const row = visit({ line: "kids", subject_id: CHILD, profile_id: CHILD, ...change });
    error(input([source("bookmark", [entry(row)])], { kind: "kids_profile", id: CHILD }), "SUBJECT_MISMATCH");
  });
  it("does not merge separate child scopes even if their opaque locators are equal", () => {
    const run = (id: string) => mark(input([source("bookmark", [entry(visit({ line: "kids", subject_id: id, profile_id: id }), "same-locator")])], { kind: "kids_profile", id }));
    assert.strictEqual(run(CHILD).logical_key.subject.id, CHILD);
    assert.strictEqual(run(OTHER).logical_key.subject.id, OTHER);
  });
  it("requires the actual adult composite and rejects a disguised child", () => {
    assert.deepStrictEqual(mark(input([source("bookmark", [entry(visit())])])).logical_key.subject, { kind: "auth_user", id: ACTOR });
    error(input([source("bookmark", [entry(visit({ profile_id: CHILD }))])]), "SUBJECT_MISMATCH");
  });
});

describe("explicit minimal allowlists and original Unicode preservation", () => {
  it("omits originals, URL, arbitrary nested metadata and marking fields", () => {
    const original = "  اَلْعَرَبِيَّة\u200f\r\n e\u0301 \u{1F9EA}\u0000  ";
    const row = mission({ submission_text: original, submission_url: "https://private.invalid/secret",
      submission_metadata: { modelAnswer: "PRIVATE", revealed: true, note: "PRIVATE", nested: { correctIndex: 2 } },
      modelAnswer: "PRIVATE", rubric: [{ criteria: "PRIVATE" }], correctIndex: 2, unexpected: { original_answer: original } });
    const before = [...original].map(c => c.codePointAt(0));
    const result = projectLegacyHistory(input([source("mission", [entry(row)])]));
    const serialized = JSON.stringify(result);
    for (const key of ["submission_text", "submission_url", "submission_metadata", "modelAnswer", "revealed", "rubric", "correctIndex", "unexpected", "PRIVATE", "private.invalid"]) assert.strictEqual((serialized).includes(key), false);
    assert.strictEqual(row.submission_text, original);
    assert.deepStrictEqual([...row.submission_text as string].map(c => c.codePointAt(0)), before);
  });
  it("returns exactly the accepted legacy_fact and provenance field allowlists", () => {
    const result = fact(input());
    assert.deepStrictEqual(Object.keys(result).sort(), ["fact_kind", "source", "learning", "observed_status", "score", "score_scale_ref",
      "original_response", "actual_assessment_locale_id", "grading_provenance", "provenance"].sort());
    assert.deepStrictEqual(Object.keys(result.provenance).sort(), ["origin", "source", "source_revision", "recorded_at", "observed_at", "provenance_status"].sort());
    assert.deepStrictEqual(Object.keys(result.learning).sort(), ["state", "area", "course_id", "item_id", "enrollment_id", "curriculum_manifest_id",
      "curriculum_manifest_sha256", "content_version", "policy_version", "locale_registry_version", "actual_content_locale_id",
      "requested_content_locale_id", "equivalence_version", "fallback_rule_version"].sort());
  });
  it("never evaluates an unexpected metadata getter", () => {
    let calls = 0;
    const row = mission();
    Object.defineProperty(row, "submission_metadata", { enumerable: true, get: () => { calls++; throw new Error("SECRET"); } });
    assert.deepStrictEqual(fact(input([source("mission", [entry(row)])])).score, { state: "known", value: "72.5" });
    assert.strictEqual(calls, 0);
  });
  it("rejects an accessor on a field it must actually read", () => {
    let calls = 0;
    const row = mission();
    Object.defineProperty(row, "score", { get: () => { calls++; return 50; } });
    error(input([source("mission", [entry(row)])]), "ACCESSOR_NOT_DATA");
    assert.strictEqual(calls, 0);
  });
  it("does not accept a URL or silently replace a mismatching source ID", () => {
    error(input([source("mission", [entry(mission(), "https://private.invalid")])]), "INVALID_LEGACY_LOCATOR");
    error(input([source("mission", [entry(mission(), "different-id")])]), "LOCATOR_MISMATCH");
  });
});

describe("source completeness and empty history", () => {
  it("distinguishes successfully complete empty loads without claiming freshness", () => {
    const result = projectLegacyHistory(input([source("mission")]));
    assert.strictEqual(result.empty_confirmed, true);
    assert.strictEqual(result.coverage.completeness, "complete");
    assert.strictEqual(result.coverage.freshness, "unknown");
    assert.strictEqual(result.coverage.source_as_of.state, "unknown");
    assert.deepStrictEqual(result.coverage.sources[0]?.watermark, U);
  });
  cases([["failed", "SOURCE_FAILED"], ["missing", "SOURCE_MISSING"]], "does not turn %s/unknown zero rows into empty/current", ([state, code]) => {
    const result = projectLegacyHistory(input([source("mission", [], state, "unavailable")]));
    assert.strictEqual(result.empty_confirmed, false);
    assert.strictEqual(result.coverage.completeness, "unavailable");
    assert.strictEqual(result.coverage.freshness, "unknown");
    assert.strictEqual(result.coverage.sources[0]?.error_code, code);
  });
  it("does not turn a partial zero-row load into confirmed empty", () => {
    const result = projectLegacyHistory(input([source("mission", [], "succeeded", "partial")]));
    assert.strictEqual(result.empty_confirmed, false);
    assert.strictEqual(result.coverage.completeness, "partial");
    assert.strictEqual(result.coverage.sources[0]?.error_code, null);
  });
  it("keeps available facts when another selected source fails", () => {
    const result = projectLegacyHistory(input([source("mission", [entry(mission())]), source("quiz", [], "failed", "unavailable")]));
    assert.strictEqual((result.records).length, 1);
    assert.strictEqual(result.empty_confirmed, false);
    assert.strictEqual(result.coverage.completeness, "partial");
    assert.deepStrictEqual(result.coverage.sources.map(s => s.load_state), ["succeeded", "failed"]);
  });
  it("does not claim successful empty from only non-applicable sources", () => {
    const result = projectLegacyHistory(input([source("mission", [], "not_applicable", "not_applicable")]));
    assert.strictEqual(result.empty_confirmed, false);
    assert.deepStrictEqual(result.coverage.sources[0]?.watermark, { state: "not_applicable", value: null });
  });
  it("rejects inconsistent or unrecognized load states rather than silently ignoring them", () => {
    error(input([source("mission", [], "failed", "complete")]), "INCONSISTENT_LOAD_STATE");
    error(input([source("mission", [entry(mission())], "missing", "unavailable")]), "INCONSISTENT_LOAD_STATE");
    error(input([source("mission", [], "unknown", "unavailable")]), "INVALID_LOAD_STATE");
  });
});

describe("determinism, no mutations and invalid input boundaries", () => {
  it("requires full lexical matches rather than accepting trailing newlines", () => {
    error({ ...input(), actor_user_id: ACTOR + "\n" }, "INVALID_UUID");
    error(input([source("mission", [entry(mission(), "old-row\n")])]), "INVALID_LEGACY_LOCATOR");
    error(input([source("mission", [entry(mission({ score: "1\n" }))])]), "INVALID_SCORE");
    error(input([source("mission", [entry(mission({ created_at: RECORDED + "\n" }))])]), "INVALID_TIME");
  });
  it("uses read1 Unicode code-point text limits without rewriting recorded IDs", () => {
    const lesson = "\u{1F9EA}".repeat(200);
    assert.deepStrictEqual(fact(input([source("mission", [entry(mission({ lesson_id: lesson }))])])).learning.item_id,
      { state: "known", value: lesson });
    error(input([source("mission", [entry(mission({ lesson_id: lesson + "a" }))])]), "INVALID_TEXT");
  });
  it("is deterministic on deeply frozen inputs and creates detached results", () => {
    const value = freeze(input([source("mission", [entry(mission({ submission_text: "\u200f e\u0301\r\n" }))]), source("bookmark", [entry(visit())])]));
    const before = JSON.stringify(value), first = projectLegacyHistory(value), second = projectLegacyHistory(value);
    assert.deepStrictEqual(first, second);
    first.subject.id = OTHER;
    const record = first.records[1];
    if (record?.record_type === "bookmark") record.record.logical_key.subject.id = OTHER;
    assert.strictEqual(JSON.stringify(value), before);
    assert.strictEqual(second.subject.id, ACTOR);
    assert.strictEqual(value.sources[0]?.rows[0]?.row.attempt_count, 7);
  });
  it("requires a nonempty selected-source set and unique source IDs", () => {
    error(input([]), "NO_SELECTED_SOURCES");
    error(input([source("mission"), source("quiz", [], "succeeded", "complete", "mission")]), "DUPLICATE_SOURCE_ID");
  });
  cases(["2026-02-30T00:00:00Z", "2026-01-01T24:00:00Z", "not-a-time"],
    "rejects an invalid recorded timestamp without using a fallback clock: %s", value => {
      error(input([source("mission", [entry(mission({ created_at: value }))])]), "INVALID_TIME");
    });
  cases([NaN, Infinity, true, "1e2", " 2", { private: "SECRET" }], "does not coerce an invalid recorded score: %j", value => {
    error(input([source("mission", [entry(mission({ score: value }))])]), "INVALID_SCORE");
  });
  it("returns bounded errors without embedding the offending private value", () => {
    try { projectLegacyHistory(input([source("mission", [entry(mission({ score: "PRIVATE secret" }))])])); }
    catch (caught) {
      assert.strictEqual(String(caught), "LegacyProjectionInputError: INVALID_SCORE: row.score");
      assert.strictEqual((String(caught)).includes("PRIVATE"), false);
      return;
    }
    throw new Error("Expected rejection");
  });
  it("rejects malformed actor/subject identity; matching IDs are still not authentication", () => {
    error({ ...input(), actor_user_id: "caller-role-admin" }, "INVALID_UUID");
    // R6-LP-001: equal bytes are valid typed child scope; an empty source set still rejects.
    error(input([], { kind: "kids_profile", id: ACTOR }), "NO_SELECTED_SOURCES");
    error(input([], { kind: "auth_user", id: OTHER }), "SUBJECT_MISMATCH");
  });
});


describe("R6-LP-001 typed entity UUID equality", () => {
  // Exact original independent R04 input, preserved without a new policy/default.
  function originalR04() {
    return {
      "actor_user_id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "subject": {
        "kind": "kids_profile",
        "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
      },
      "observed_at": "2026-10-24T12:34:56.123456789Z",
      "sources": [
        {
          "source_id": "bookmark",
          "kind": "bookmark",
          "rows": [
            {
              "locator": "same-bytes-child",
              "row": {
                "user_id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
                "subject_id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
                "profile_id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
                "line": "kids",
                "course_id": "level-1",
                "lesson_id": "recorded-lesson",
                "visited_at": "2026-10-24T12:34:56.123456789Z"
              }
            }
          ],
          "load_state": "succeeded",
          "completeness": "complete"
        }
      ]
    };
  }
  it("preserves the original R04 child bookmark when actor and child UUID bytes coincide", () => {
    const value = originalR04();
    const before = JSON.stringify(value);
    const projected = projectLegacyHistory(value);
    assert.deepStrictEqual(projected.subject, { kind: "kids_profile", id: value.actor_user_id });
    assert.strictEqual(projected.records.length, 1);
    const record = projected.records[0];
    assert.ok(record?.record_type === "bookmark");
    assert.deepStrictEqual(record.record.logical_key.subject, value.subject);
    assert.strictEqual(record.record.logical_key.area, "kids");
    assert.strictEqual(record.record.bookmark_id, "same-bytes-child");
    assert.deepStrictEqual(record.record.provenance.source,
      { source_kind: "legacy_bookmark", locator: "same-bytes-child" });
    assert.strictEqual(JSON.stringify(value), before);
  });
  cases(["user_id", "profile_id", "subject_id"] as const,
    "rejects a conflicting actual row actor/profile/subject despite equal scope UUID bytes", field => {
      const value = originalR04();
      value.sources[0]!.rows[0]!.row[field] = OTHER;
      error(value, "SUBJECT_MISMATCH");
    });
  it("does not authorize a kids bookmark through an auth_user tag with matching UUID bytes", () => {
    const value = originalR04();
    error({ ...value, subject: { kind: "auth_user", id: value.actor_user_id } }, "SUBJECT_MISMATCH");
  });
  it("still requires the kids area/composite for a kids_profile tag", () => {
    const value = originalR04();
    value.sources[0]!.rows[0]!.row.line = "academic";
    error(value, "SUBJECT_MISMATCH");
  });
  cases(["mission", "quiz"] as const,
    "keeps actor-only mission/quiz invalid for an equal-byte kids_profile", kind => {
      const id = originalR04().actor_user_id;
      const row = kind === "mission" ? mission({ id, user_id: id }) : quiz({ id, user_id: id });
      const value = { ...input([source(kind, [entry(row)])], { kind: "kids_profile", id }), actor_user_id: id };
      error(value, "SUBJECT_MISMATCH");
    });
  it("preserves ordinary auth_user self equality", () => {
    const result = mark(input([source("bookmark", [entry(visit())])]));
    assert.deepStrictEqual(result.logical_key.subject, { kind: "auth_user", id: ACTOR });
  });
  it("still rejects auth_user self when subject UUID differs from the actor", () => {
    error(input([source("bookmark", [entry(visit())])], { kind: "auth_user", id: OTHER }), "SUBJECT_MISMATCH");
  });
});
