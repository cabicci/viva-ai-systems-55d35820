/** Local syntax decoding only. Selectors and original answers remain untrusted. */
export type AssessmentSubmitSubjectKind = "auth_user" | "kids_profile";
export type AssessmentSubmitUiLocale = "ar-EG" | "ar-MSA" | "ar-Gulf" | "en";
export type AssessmentSubmitArea = "ai" | "technical" | "academic" | "kids";
export type AssessmentSubmitAnswerType = "text" | "choice" | "structured";

export interface UntrustedAssessmentSubmitSubject {
  kind: AssessmentSubmitSubjectKind;
  id: string;
}

export interface UntrustedAssessmentSubmitLearningContext {
  area: AssessmentSubmitArea;
  course_id: string;
  item_id: string;
  enrollment_id: string;
  curriculum_manifest_id: string;
  curriculum_manifest_sha256: string;
  content_version: string;
  policy_version: string;
  locale_registry_version: string;
  content_locale_id: string;
  equivalence_version: string | null;
  fallback_rule_version: string | null;
  requested_content_locale_id: string;
}

export interface UntrustedAssessmentSubmitResponse {
  question_id: string;
  answer_type: AssessmentSubmitAnswerType;
  original_answer: string;
  response_locale_id: string | null;
}

export interface UntrustedAssessmentSubmitArtifact {
  upload_id: string;
  object_version_id: string;
  sha256: string;
}

export interface UntrustedAssessmentSubmitPayload {
  attempt_id: string;
  snapshot_sha256: string;
  responses: UntrustedAssessmentSubmitResponse[];
  artifacts: UntrustedAssessmentSubmitArtifact[];
  draft_id: string;
  expected_attempt_revision: number;
}

export interface UntrustedAssessmentSubmitRequest {
  contract_version: "masarat-backend-v1";
  command: "submit_attempt";
  wire_revision: 3;
  operation_id: string;
  subject: UntrustedAssessmentSubmitSubject;
  organization_id: string | null;
  ui_locale: AssessmentSubmitUiLocale;
  learning_context: UntrustedAssessmentSubmitLearningContext | null;
  expected_revision: number;
  payload: UntrustedAssessmentSubmitPayload;
}

export type AssessmentSubmitInputIssueCode =
  | "type" | "required" | "additional_property" | "const" | "enum"
  | "length" | "format" | "pattern" | "range" | "integer" | "items";

export interface AssessmentSubmitInputIssue {
  path: string;
  code: AssessmentSubmitInputIssueCode;
}

type Failure = { ok: false; issues: ReadonlyArray<AssessmentSubmitInputIssue> };
type Step<T> = { ok: true; value: T } | Failure;
export type AssessmentSubmitInputDecodeResult =
  | { ok: true; trust: "untrusted"; request: UntrustedAssessmentSubmitRequest }
  | Failure;

function good<T>(value: T): Step<T> {
  return { ok: true, value };
}

function bad(path: string, code: AssessmentSubmitInputIssueCode): Failure {
  return { ok: false, issues: [{ path, code }] };
}

function at(path: string, key: string | number): string {
  return `${path}/${String(key).replace(/~/g, "~0").replace(/\//g, "~1")}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function closedObject(value: unknown, path: string, keys: readonly string[]): Step<Record<string, unknown>> {
  if (!isRecord(value)) return bad(path, "type");
  // Inspect keys before values: rejected extras are never traversed or retained.
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) return bad(at(path, key), "additional_property");
  }
  for (const key of keys) {
    if (!Object.hasOwn(value, key)) return bad(at(path, key), "required");
  }
  return good(value);
}

function literal<T extends string | number>(value: unknown, expected: T, path: string): Step<T> {
  return value === expected ? good(expected) : bad(path, "const");
}

function member<T extends string>(value: unknown, options: readonly T[], path: string): Step<T> {
  for (const option of options) {
    if (value === option) return good(option);
  }
  return bad(path, "enum");
}

function text(value: unknown, path: string, minimum: number, maximum: number): Step<string> {
  if (typeof value !== "string") return bad(path, "type");
  let length = 0;
  for (const character of value) {
    length += 1;
    if (length > maximum) return bad(path, "length");
  }
  return length < minimum ? bad(path, "length") : good(value);
}

function shortText(value: unknown, path: string): Step<string> {
  return text(value, path, 1, 200);
}

function nullable<T>(value: unknown, path: string, decode: (value: unknown, path: string) => Step<T>): Step<T | null> {
  return value === null ? good(null) : decode(value, path);
}

function uuid(value: unknown, path: string): Step<string> {
  const result = text(value, path, 36, 36);
  if (!result.ok) return result;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(result.value)
    ? result : bad(path, "format");
}

function draftUuid(value: unknown, path: string): Step<string> {
  const result = uuid(value, path);
  if (!result.ok) return result;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(result.value)
    ? result : bad(path, "pattern");
}

function digest(value: unknown, path: string): Step<string> {
  const result = text(value, path, 64, 64);
  if (!result.ok) return result;
  return /^[a-f0-9]{64}$/.test(result.value) ? result : bad(path, "pattern");
}

function localeToken(value: unknown, path: string): Step<string> {
  const result = text(value, path, 1, 64);
  if (!result.ok) return result;
  return /^[A-Za-z][A-Za-z0-9._:-]*$/.test(result.value) ? result : bad(path, "pattern");
}

function revision(value: unknown, path: string): Step<number> {
  if (typeof value !== "number") return bad(path, "type");
  if (!Number.isFinite(value) || !Number.isInteger(value)) return bad(path, "integer");
  if (value < 0 || value > 9007199254740991) return bad(path, "range");
  return good(value);
}

function subject(value: unknown, path: string): Step<UntrustedAssessmentSubmitSubject> {
  const object = closedObject(value, path, ["kind", "id"]);
  if (!object.ok) return object;
  const kind = member(object.value.kind, ["auth_user", "kids_profile"] as const, at(path, "kind"));
  if (!kind.ok) return kind;
  const id = uuid(object.value.id, at(path, "id"));
  if (!id.ok) return id;
  return good({ kind: kind.value, id: id.value });
}

function context(value: unknown, path: string): Step<UntrustedAssessmentSubmitLearningContext> {
  const object = closedObject(value, path, [
    "area", "course_id", "item_id", "enrollment_id", "curriculum_manifest_id",
    "curriculum_manifest_sha256", "content_version", "policy_version", "locale_registry_version",
    "content_locale_id", "equivalence_version", "fallback_rule_version", "requested_content_locale_id",
  ]);
  if (!object.ok) return object;
  const v = object.value;
  const area = member(v.area, ["ai", "technical", "academic", "kids"] as const, at(path, "area"));
  if (!area.ok) return area;
  const course = shortText(v.course_id, at(path, "course_id"));
  if (!course.ok) return course;
  const item = shortText(v.item_id, at(path, "item_id"));
  if (!item.ok) return item;
  const enrollment = uuid(v.enrollment_id, at(path, "enrollment_id"));
  if (!enrollment.ok) return enrollment;
  const manifest = shortText(v.curriculum_manifest_id, at(path, "curriculum_manifest_id"));
  if (!manifest.ok) return manifest;
  const manifestHash = digest(v.curriculum_manifest_sha256, at(path, "curriculum_manifest_sha256"));
  if (!manifestHash.ok) return manifestHash;
  const contentVersion = shortText(v.content_version, at(path, "content_version"));
  if (!contentVersion.ok) return contentVersion;
  const policy = shortText(v.policy_version, at(path, "policy_version"));
  if (!policy.ok) return policy;
  const registry = shortText(v.locale_registry_version, at(path, "locale_registry_version"));
  if (!registry.ok) return registry;
  const contentLocale = localeToken(v.content_locale_id, at(path, "content_locale_id"));
  if (!contentLocale.ok) return contentLocale;
  const equivalence = nullable(v.equivalence_version, at(path, "equivalence_version"), shortText);
  if (!equivalence.ok) return equivalence;
  const fallback = nullable(v.fallback_rule_version, at(path, "fallback_rule_version"), shortText);
  if (!fallback.ok) return fallback;
  const requestedLocale = localeToken(v.requested_content_locale_id, at(path, "requested_content_locale_id"));
  if (!requestedLocale.ok) return requestedLocale;
  return good({
    area: area.value, course_id: course.value, item_id: item.value, enrollment_id: enrollment.value,
    curriculum_manifest_id: manifest.value, curriculum_manifest_sha256: manifestHash.value,
    content_version: contentVersion.value, policy_version: policy.value, locale_registry_version: registry.value,
    content_locale_id: contentLocale.value, equivalence_version: equivalence.value,
    fallback_rule_version: fallback.value, requested_content_locale_id: requestedLocale.value,
  });
}

function response(value: unknown, path: string): Step<UntrustedAssessmentSubmitResponse> {
  const object = closedObject(value, path, ["question_id", "answer_type", "original_answer", "response_locale_id"]);
  if (!object.ok) return object;
  const question = shortText(object.value.question_id, at(path, "question_id"));
  if (!question.ok) return question;
  const kind = member(object.value.answer_type, ["text", "choice", "structured"] as const, at(path, "answer_type"));
  if (!kind.ok) return kind;
  const answer = text(object.value.original_answer, at(path, "original_answer"), 0, 65536);
  if (!answer.ok) return answer;
  const locale = nullable(object.value.response_locale_id, at(path, "response_locale_id"), localeToken);
  if (!locale.ok) return locale;
  return good({ question_id: question.value, answer_type: kind.value, original_answer: answer.value, response_locale_id: locale.value });
}

function artifact(value: unknown, path: string): Step<UntrustedAssessmentSubmitArtifact> {
  const object = closedObject(value, path, ["upload_id", "object_version_id", "sha256"]);
  if (!object.ok) return object;
  const upload = uuid(object.value.upload_id, at(path, "upload_id"));
  if (!upload.ok) return upload;
  const version = shortText(object.value.object_version_id, at(path, "object_version_id"));
  if (!version.ok) return version;
  const hash = digest(object.value.sha256, at(path, "sha256"));
  if (!hash.ok) return hash;
  return good({ upload_id: upload.value, object_version_id: version.value, sha256: hash.value });
}

function entries<T>(value: unknown, path: string, maximum: number, decode: (value: unknown, path: string) => Step<T>): Step<T[]> {
  if (!Array.isArray(value)) return bad(path, "type");
  if (value.length > maximum) return bad(path, "items");
  const projected: T[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const result = decode(value[index], at(path, index));
    if (!result.ok) return result;
    projected.push(result.value);
  }
  return good(projected);
}

function payload(value: unknown, path: string): Step<UntrustedAssessmentSubmitPayload> {
  const object = closedObject(value, path, ["attempt_id", "snapshot_sha256", "responses", "artifacts", "draft_id", "expected_attempt_revision"]);
  if (!object.ok) return object;
  const v = object.value;
  const attempt = uuid(v.attempt_id, at(path, "attempt_id"));
  if (!attempt.ok) return attempt;
  const snapshot = digest(v.snapshot_sha256, at(path, "snapshot_sha256"));
  if (!snapshot.ok) return snapshot;
  const responses = entries(v.responses, at(path, "responses"), 300, response);
  if (!responses.ok) return responses;
  const artifacts = entries(v.artifacts, at(path, "artifacts"), 20, artifact);
  if (!artifacts.ok) return artifacts;
  const draft = draftUuid(v.draft_id, at(path, "draft_id"));
  if (!draft.ok) return draft;
  const expected = revision(v.expected_attempt_revision, at(path, "expected_attempt_revision"));
  if (!expected.ok) return expected;
  return good({ attempt_id: attempt.value, snapshot_sha256: snapshot.value, responses: responses.value,
    artifacts: artifacts.value, draft_id: draft.value, expected_attempt_revision: expected.value });
}

/** Decodes ordinary parsed JSON; does not admit, persist, grade or resolve selectors. */
export function decodeAssessmentSubmitInput(value: unknown): AssessmentSubmitInputDecodeResult {
  const object = closedObject(value, "", [
    "contract_version", "command", "wire_revision", "operation_id", "subject", "organization_id",
    "ui_locale", "learning_context", "expected_revision", "payload",
  ]);
  if (!object.ok) return object;
  const v = object.value;
  const contract = literal(v.contract_version, "masarat-backend-v1", "/contract_version");
  if (!contract.ok) return contract;
  const command = literal(v.command, "submit_attempt", "/command");
  if (!command.ok) return command;
  const wire = literal(v.wire_revision, 3, "/wire_revision");
  if (!wire.ok) return wire;
  const operation = uuid(v.operation_id, "/operation_id");
  if (!operation.ok) return operation;
  const actor = subject(v.subject, "/subject");
  if (!actor.ok) return actor;
  const organization = nullable(v.organization_id, "/organization_id", uuid);
  if (!organization.ok) return organization;
  const ui = member(v.ui_locale, ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const, "/ui_locale");
  if (!ui.ok) return ui;
  const learning = nullable(v.learning_context, "/learning_context", context);
  if (!learning.ok) return learning;
  const expected = revision(v.expected_revision, "/expected_revision");
  if (!expected.ok) return expected;
  const body = payload(v.payload, "/payload");
  if (!body.ok) return body;
  return { ok: true, trust: "untrusted", request: {
    contract_version: contract.value, command: command.value, wire_revision: wire.value,
    operation_id: operation.value, subject: actor.value, organization_id: organization.value,
    ui_locale: ui.value, learning_context: learning.value, expected_revision: expected.value, payload: body.value,
  } };
}
