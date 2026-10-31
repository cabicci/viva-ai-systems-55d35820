/**
 * Pure read1 legacy DTO projection, not an authenticated service or snapshot.
 * The later trusted adapter must authorize the actor, subject and selected rows
 * before calling this function. Matching IDs and TypeScript types grant nothing.
 * Complete loads must mean exhaustive selected-source loads, not a partial page.
 * No original-response projection is provided. Unrepresented source fields
 * (including attempt_count, selected_index and raw visit locale) remain in the
 * unchanged input/storage; they are not repurposed as read1 fields.
 */
export type Fact<T> =
  | { state: "known"; value: T }
  | { state: "unknown"; value: null; reason: "not_recorded_legacy" | "not_retrievable" }
  | { state: "not_applicable"; value: null };

export type Subject = { kind: "auth_user" | "kids_profile"; id: string };
export type Area = "ai" | "technical" | "academic" | "kids";
export type SourceKind = "legacy_mission" | "legacy_draft" | "legacy_quiz_attempt" | "legacy_bookmark";
export type SourceLocator = { source_kind: SourceKind; locator: string };
export type HistoricalLearning = {
  state: "historical";
  area: Fact<Area>;
  course_id: Fact<string>;
  item_id: Fact<string>;
  enrollment_id: Fact<string>;
  curriculum_manifest_id: Fact<string>;
  curriculum_manifest_sha256: Fact<string>;
  content_version: Fact<string>;
  policy_version: Fact<string>;
  locale_registry_version: Fact<string>;
  actual_content_locale_id: Fact<string>;
  requested_content_locale_id: Fact<string>;
  equivalence_version: Fact<string>;
  fallback_rule_version: Fact<string>;
};
export type Provenance = {
  origin: "legacy_observed";
  source: SourceLocator;
  source_revision: Fact<string>;
  recorded_at: Fact<string>;
  observed_at: string;
  provenance_status: "unknown_legacy";
};
export type LegacyFact = {
  fact_kind: "mission_submission" | "draft" | "quiz_attempt";
  source: SourceLocator;
  learning: HistoricalLearning;
  observed_status: Fact<string>;
  score: Fact<string>;
  score_scale_ref: Fact<string>;
  original_response: { status: "not_requested"; value: null };
  actual_assessment_locale_id: Fact<string>;
  grading_provenance: "unknown_legacy";
  provenance: Provenance;
};
export type LegacyBookmark = {
  bookmark_id: string;
  identity_kind: "opaque_bookmark_not_write_uuid";
  logical_key: { subject: Subject; area: Area; course_id: string; enrollment_id: Fact<string> };
  item_id: Fact<string>;
  learning: HistoricalLearning;
  resume_status: "reference_unknown";
  last_visited_at: Fact<string>;
  receipt: null;
  provenance: Provenance;
};
export type LegacyRecord =
  | { record_type: "legacy_fact"; record: LegacyFact }
  | { record_type: "bookmark"; record: LegacyBookmark };
export type SourceState = {
  source_id: string;
  load_state: "succeeded" | "failed" | "missing" | "not_applicable";
  completeness: "complete" | "partial" | "unavailable" | "not_applicable";
  freshness: "unknown" | "not_applicable";
  watermark: Fact<string>;
  source_as_of: Fact<string>;
  error_code: "SOURCE_FAILED" | "SOURCE_MISSING" | null;
};
/** Internal composition result. Records/coverage use read1 DTOs, not an envelope. */
export type LegacyProjection = {
  subject: Subject;
  records: LegacyRecord[];
  coverage: {
    completeness: "complete" | "partial" | "unavailable";
    freshness: "unknown";
    source_as_of: Fact<string>;
    sources: SourceState[];
  };
  empty_confirmed: boolean;
};

export class LegacyProjectionInputError extends Error {
  public readonly code: string;
  public readonly field: string;
  constructor(code: string, field: string) {
    super(`${code}: ${field}`);
    this.name = "LegacyProjectionInputError";
    this.code = code;
    this.field = field;
  }
}
type Row = Record<string, unknown>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const DECIMAL = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/;
function fail(code: string, field: string): never { throw new LegacyProjectionInputError(code, field); }
function object(value: unknown, field: string): Row {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("INVALID_OBJECT", field);
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) fail("INVALID_OBJECT", field);
  return value as Row;
}
// Read only named own data properties. Never evaluate an unexpected getter or
// traverse metadata, original answers, URLs, rubric or cached model solutions.
function data(row: object, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(row, key);
  if (!descriptor) return undefined;
  if (!("value" in descriptor)) fail("ACCESSOR_NOT_DATA", key);
  return descriptor.value;
}
function array(value: unknown, field: string): readonly unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) fail("INVALID_ARRAY", field);
  return value;
}
function text(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length < 1 || [...value].length > 200) fail("INVALID_TEXT", field);
  return value;
}
function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || UUID.exec(value)?.[0] !== value) fail("INVALID_UUID", field);
  return value;
}
function locator(value: unknown): string {
  if (typeof value !== "string" || /^[A-Za-z0-9_-]+$/.exec(value)?.[0] !== value) fail("INVALID_LEGACY_LOCATOR", "locator");
  return value;
}
function unknown<T>(reason: "not_recorded_legacy" | "not_retrievable" = "not_recorded_legacy"): Fact<T> {
  return { state: "unknown", value: null, reason };
}
function known<T>(value: T): Fact<T> { return { state: "known", value }; }
function na<T>(): Fact<T> { return { state: "not_applicable", value: null }; }
function optionalText(value: unknown, field: string): Fact<string> {
  return value === null || value === undefined ? unknown() : known(text(value, field));
}
function utc(value: unknown, field: string): string {
  if (typeof value !== "string") fail("INVALID_TIME", field);
  // Preserve sub-millisecond precision; only an explicit UTC offset is rendered
  // as Z. No current clock, local timezone, rounding or Date parser is used.
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|\+00:00)$/.exec(value);
  if (!match || match[0] !== value) fail("INVALID_TIME", field);
  const y = Number(match[1]), m = Number(match[2]), d = Number(match[3]);
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (m < 1 || m > 12 || d < 1 || d > days[m - 1]! || Number(match[4]) > 23 || Number(match[5]) > 59 || Number(match[6]) > 59) fail("INVALID_TIME", field);
  return value.endsWith("Z") ? value : value.slice(0, -6) + "Z";
}
function optionalTime(value: unknown, field: string): Fact<string> {
  return value === null || value === undefined ? unknown() : known(utc(value, field));
}
function score(value: unknown): Fact<string> {
  if (value === undefined || value === null) return unknown();
  if (typeof value === "string") {
    if (DECIMAL.exec(value)?.[0] !== value) fail("INVALID_SCORE", "row.score");
    return known(value);
  }
  if (typeof value !== "number" || !Number.isFinite(value)) fail("INVALID_SCORE", "row.score");
  if (Object.is(value, -0)) return known("-0");
  const raw = String(value);
  if (DECIMAL.test(raw)) return known(raw);
  // Decimal rendering of the already supplied JS number, not a command digest
  // serializer, reparsing of learner text or new score/scale calculation.
  const [coefficient, exponent] = raw.toLowerCase().split("e");
  const negative = coefficient!.startsWith("-");
  const body = negative ? coefficient!.slice(1) : coefficient!;
  const [whole, fraction = ""] = body.split(".");
  const digits = whole! + fraction, point = whole!.length + Number(exponent);
  const expanded = point <= 0 ? "0." + "0".repeat(-point) + digits
    : point >= digits.length ? digits + "0".repeat(point - digits.length)
      : digits.slice(0, point) + "." + digits.slice(point);
  return known((negative ? "-" : "") + expanded);
}
function learning(item: Fact<string>, area: Fact<Area> = unknown(), course: Fact<string> = unknown()): HistoricalLearning {
  return {
    state: "historical", area, course_id: course, item_id: item,
    enrollment_id: unknown(), curriculum_manifest_id: unknown(), curriculum_manifest_sha256: unknown(),
    content_version: unknown(), policy_version: unknown(), locale_registry_version: unknown(),
    actual_content_locale_id: unknown(), requested_content_locale_id: unknown(),
    equivalence_version: unknown(), fallback_rule_version: unknown(),
  };
}
function provenance(source: SourceLocator, recorded: Fact<string>, observed: string): Provenance {
  return { origin: "legacy_observed", source: { ...source }, source_revision: unknown(), recorded_at: recorded,
    observed_at: observed, provenance_status: "unknown_legacy" };
}
function missionOrQuiz(kind: "mission" | "quiz", row: Row, opaque: string, subject: Subject, actor: string, observed: string): LegacyRecord {
  if (subject.kind !== "auth_user" || subject.id !== actor || data(row, "user_id") !== actor) fail("SUBJECT_MISMATCH", "row.user_id");
  // These sources really have row IDs. Do not replace or encode an old ID into
  // a newly minted attempt/draft/decision UUID or a fictitious source locator.
  if (locator(data(row, "id")) !== opaque) fail("LOCATOR_MISMATCH", "row.id");
  let status: Fact<string> = unknown();
  if (kind === "mission") status = optionalText(data(row, "status"), "row.status");
  else {
    const correct = data(row, "is_correct");
    if (correct !== undefined && correct !== null) {
      if (typeof correct !== "boolean") fail("INVALID_BOOLEAN", "row.is_correct");
      // A label for a recorded practice boolean, never official pass/mastery.
      status = known(correct ? "is_correct=true" : "is_correct=false");
    }
  }
  const draft = kind === "mission" && status.state === "known" && status.value === "draft";
  const source: SourceLocator = { source_kind: kind === "quiz" ? "legacy_quiz_attempt" : draft ? "legacy_draft" : "legacy_mission", locator: opaque };
  return { record_type: "legacy_fact", record: {
    fact_kind: kind === "quiz" ? "quiz_attempt" : draft ? "draft" : "mission_submission", source,
    learning: learning(optionalText(data(row, "lesson_id"), "row.lesson_id")), observed_status: status,
    score: kind === "mission" ? score(data(row, "score")) : unknown(), score_scale_ref: unknown(),
    original_response: { status: "not_requested", value: null }, actual_assessment_locale_id: unknown(),
    grading_provenance: "unknown_legacy",
    provenance: provenance(source, optionalTime(data(row, kind === "mission" ? "created_at" : "attempted_at"), "row.recorded_at"), observed),
  } };
}
function bookmark(row: Row, opaque: string, subject: Subject, actor: string, observed: string): LegacyRecord {
  if (opaque.length > 200) fail("INVALID_LEGACY_LOCATOR", "bookmark_id");
  const line = data(row, "line");
  if (line !== "ai" && line !== "technical" && line !== "academic" && line !== "kids") fail("INVALID_AREA", "row.line");
  if (data(row, "user_id") !== actor || data(row, "subject_id") !== subject.id) fail("SUBJECT_MISMATCH", "row.subject_id");
  const profile = data(row, "profile_id");
  if (line === "kids") {
    if (subject.kind !== "kids_profile" || profile !== subject.id) fail("SUBJECT_MISMATCH", "row.profile_id");
  } else if (subject.kind !== "auth_user" || subject.id !== actor || profile !== null) fail("SUBJECT_MISMATCH", "row.profile_id");
  const course = text(data(row, "course_id"), "row.course_id");
  const item = optionalText(data(row, "lesson_id"), "row.lesson_id");
  const visited = optionalTime(data(row, "visited_at"), "row.visited_at");
  // A bookmark has a composite physical key. Its supplied opaque locator must
  // come from the upstream source mapping; this pure function invents no map.
  const source: SourceLocator = { source_kind: "legacy_bookmark", locator: opaque };
  return { record_type: "bookmark", record: {
    bookmark_id: opaque, identity_kind: "opaque_bookmark_not_write_uuid",
    logical_key: { subject: { ...subject }, area: line, course_id: course, enrollment_id: unknown() },
    item_id: item, learning: learning({ ...item }, known(line), known(course)), resume_status: "reference_unknown",
    last_visited_at: { ...visited }, receipt: null, provenance: provenance(source, visited, observed),
  } };
}

/**
 * Input JSON: {actor_user_id, subject:{kind,id}, observed_at, sources:[
 * {source_id, kind:'mission'|'quiz'|'bookmark', load_state, completeness,
 * rows:[{locator, row:<actual source row>}]}]}.
 * Rows must already be authorized; failed/missing/not_applicable loads have no
 * rows. Success completeness is complete or partial. Unsupported or ambiguous
 * input throws a bounded error rather than silently losing history.
 */
export function projectLegacyHistory(input: unknown): LegacyProjection {
  const root = object(input, "input"), scope = object(data(root, "subject"), "subject");
  const actor = uuid(data(root, "actor_user_id"), "actor_user_id");
  const kind = data(scope, "kind");
  if (kind !== "auth_user" && kind !== "kids_profile") fail("INVALID_SUBJECT_KIND", "subject.kind");
  const subject: Subject = { kind, id: uuid(data(scope, "id"), "subject.id") };
  if (subject.kind === "auth_user" && subject.id !== actor) fail("SUBJECT_MISMATCH", "subject");
  const observed = utc(data(root, "observed_at"), "observed_at");
  if (!(data(root, "observed_at") as string).endsWith("Z")) fail("INVALID_TIME", "observed_at");
  const batches = array(data(root, "sources"), "sources");
  if (!batches.length) fail("NO_SELECTED_SOURCES", "sources");
  const records: LegacyRecord[] = [], sources: SourceState[] = [];
  const sourceIds = new Set<string>(), identities = new Set<string>();
  for (let i = 0; i < batches.length; i++) {
    const batch = object(data(batches, String(i)), "source");
    const sourceId = text(data(batch, "source_id"), "source_id");
    if (sourceIds.has(sourceId)) fail("DUPLICATE_SOURCE_ID", "source_id");
    sourceIds.add(sourceId);
    const rowKind = data(batch, "kind");
    if (rowKind !== "mission" && rowKind !== "quiz" && rowKind !== "bookmark") fail("UNSUPPORTED_SOURCE_KIND", "kind");
    const load = data(batch, "load_state"), complete = data(batch, "completeness");
    if (load !== "succeeded" && load !== "failed" && load !== "missing" && load !== "not_applicable") fail("INVALID_LOAD_STATE", "load_state");
    if (load === "succeeded" ? complete !== "complete" && complete !== "partial"
      : load === "not_applicable" ? complete !== "not_applicable" : complete !== "unavailable") fail("INCONSISTENT_LOAD_STATE", "completeness");
    const rows = array(data(batch, "rows"), "rows");
    if (load !== "succeeded" && rows.length) fail("INCONSISTENT_LOAD_STATE", "rows");
    sources.push({ source_id: sourceId, load_state: load,
      completeness: complete as SourceState["completeness"], freshness: load === "not_applicable" ? "not_applicable" : "unknown",
      watermark: load === "not_applicable" ? na() : unknown(),
      source_as_of: load === "not_applicable" ? na() : unknown("not_retrievable"),
      error_code: load === "failed" ? "SOURCE_FAILED" : load === "missing" ? "SOURCE_MISSING" : null });
    for (let n = 0; n < rows.length; n++) {
      const entry = object(data(rows, String(n)), "entry");
      const row = object(data(entry, "row"), "row"), opaque = locator(data(entry, "locator"));
      const record = rowKind === "bookmark" ? bookmark(row, opaque, subject, actor, observed)
        : missionOrQuiz(rowKind, row, opaque, subject, actor, observed);
      const source = record.record_type === "bookmark" ? record.record.provenance.source : record.record.source;
      const identity = JSON.stringify([source.source_kind, source.locator]);
      if (identities.has(identity)) fail("DUPLICATE_LEGACY_SOURCE", "locator");
      identities.add(identity);
      records.push(record);
    }
  }
  const complete = sources.every(s => s.completeness === "complete" || s.completeness === "not_applicable");
  const available = sources.some(s => s.load_state === "succeeded");
  return { subject, records, coverage: {
    completeness: complete ? "complete" : available ? "partial" : "unavailable", freshness: "unknown",
    source_as_of: unknown("not_retrievable"), sources,
  }, empty_confirmed: records.length === 0 && complete && available };
}
