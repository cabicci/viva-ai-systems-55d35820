/** Syntax only for ordinary parsed JSON. Decoded selectors remain untrusted.
 * This module does not authenticate, admit an attempt, or define canonical bytes. */
export type AssessmentCreateIssueCode =
  | "type" | "required" | "additional_property" | "const"
  | "enum" | "length" | "format" | "pattern";
export type AssessmentCreateIssue = Readonly<{ path: string; code: AssessmentCreateIssueCode }>;
export type AssessmentCreateSubject = { kind: "auth_user" | "kids_profile"; id: string };
export type AssessmentCreateLearningContext = {
  area: "ai" | "technical" | "academic" | "kids";
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
};
export type AssessmentCreatePayload = {
  assessment_id: string;
  assessment_version: string;
  rubric_version: string;
  assessment_locale_id: string;
  response_policy_version: string;
  response_locale_id: string;
  accommodation_id: string | null;
};
export type UntrustedAssessmentCreateRequest = {
  contract_version: "masarat-backend-v1";
  command: "create_attempt";
  wire_revision: 3;
  operation_id: string;
  subject: AssessmentCreateSubject;
  organization_id: string | null;
  ui_locale: "ar-EG" | "ar-MSA" | "ar-Gulf" | "en";
  learning_context: AssessmentCreateLearningContext;
  expected_revision: 0;
  payload: AssessmentCreatePayload;
};
export type AssessmentCreateInputResult =
  | { ok: true; trust: "untrusted"; request: UntrustedAssessmentCreateRequest }
  | { ok: false; issues: ReadonlyArray<AssessmentCreateIssue> };

const ROOT_FIELDS = ["contract_version", "command", "wire_revision", "operation_id", "subject",
  "organization_id", "ui_locale", "learning_context", "expected_revision", "payload"] as const;
const CONTEXT_FIELDS = ["area", "course_id", "item_id", "enrollment_id", "curriculum_manifest_id",
  "curriculum_manifest_sha256", "content_version", "policy_version", "locale_registry_version",
  "content_locale_id", "equivalence_version", "fallback_rule_version", "requested_content_locale_id"] as const;
const PAYLOAD_FIELDS = ["assessment_id", "assessment_version", "rubric_version", "assessment_locale_id",
  "response_policy_version", "response_locale_id", "accommodation_id"] as const;
const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const LOCALE = /^[A-Za-z][A-Za-z0-9._:-]*$/;
const SHA256 = /^[a-f0-9]{64}$/;
type Issues = AssessmentCreateIssue[];

function at(path: string, key: string): string {
  return `${path}/${key.replace(/~/g, "~0").replace(/\//g, "~1")}`;
}
function objectFields(value: unknown, fields: readonly string[], path: string, issues: Issues):
  Record<string, unknown> | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    issues.push({ path, code: "type" });
    return undefined;
  }
  // This assertion is only the input inspection boundary, never an output cast.
  const row = value as Record<string, unknown>;
  let valid = true;
  for (const key of Object.keys(row)) {
    if (!fields.includes(key)) {
      issues.push({ path: at(path, key), code: "additional_property" });
      valid = false;
    }
  }
  for (const key of fields) {
    if (!Object.hasOwn(row, key)) {
      issues.push({ path: at(path, key), code: "required" });
      valid = false;
    }
  }
  // In particular, never read or traverse the values of rejected private extras.
  return valid ? row : undefined;
}
function text(value: unknown, path: string, issues: Issues, min = 1, max = 200): string | undefined {
  if (typeof value !== "string") {
    issues.push({ path, code: "type" });
    return undefined;
  }
  const length = [...value].length;
  if (length < min || length > max) {
    issues.push({ path, code: "length" });
    return undefined;
  }
  return value;
}
function patterned(value: unknown, path: string, issues: Issues, min: number, max: number,
  pattern: RegExp, code: "format" | "pattern"): string | undefined {
  const result = text(value, path, issues, min, max);
  if (result !== undefined && !pattern.test(result)) {
    issues.push({ path, code });
    return undefined;
  }
  return result;
}
function uuid(value: unknown, path: string, issues: Issues): string | undefined {
  return patterned(value, path, issues, 36, 36, UUID, "format");
}
function locale(value: unknown, path: string, issues: Issues): string | undefined {
  return patterned(value, path, issues, 1, 64, LOCALE, "pattern");
}
function nullableUuid(value: unknown, path: string, issues: Issues): string | null | undefined {
  return value === null ? null : uuid(value, path, issues);
}
function nullableText(value: unknown, path: string, issues: Issues): string | null | undefined {
  return value === null ? null : text(value, path, issues);
}
function member<T extends string>(value: unknown, allowed: readonly T[], path: string, issues: Issues):
  T | undefined {
  if (typeof value !== "string") {
    issues.push({ path, code: "type" });
    return undefined;
  }
  const result = allowed.find(candidate => candidate === value);
  if (result === undefined) issues.push({ path, code: "enum" });
  return result;
}
function subject(value: unknown, issues: Issues): AssessmentCreateSubject | undefined {
  const row = objectFields(value, ["kind", "id"], "/subject", issues);
  if (!row) return undefined;
  const kind = member(row.kind, ["auth_user", "kids_profile"] as const, "/subject/kind", issues);
  const id = uuid(row.id, "/subject/id", issues);
  if (kind === undefined || id === undefined) return undefined;
  return { kind, id };
}
function learning(value: unknown, issues: Issues): AssessmentCreateLearningContext | undefined {
  const row = objectFields(value, CONTEXT_FIELDS, "/learning_context", issues);
  if (!row) return undefined;
  const area = member(row.area, ["ai", "technical", "academic", "kids"] as const, "/learning_context/area", issues);
  const course_id = text(row.course_id, "/learning_context/course_id", issues);
  const item_id = text(row.item_id, "/learning_context/item_id", issues);
  const enrollment_id = uuid(row.enrollment_id, "/learning_context/enrollment_id", issues);
  const curriculum_manifest_id = text(row.curriculum_manifest_id, "/learning_context/curriculum_manifest_id", issues);
  const curriculum_manifest_sha256 = patterned(row.curriculum_manifest_sha256,
    "/learning_context/curriculum_manifest_sha256", issues, 64, 64, SHA256, "pattern");
  const content_version = text(row.content_version, "/learning_context/content_version", issues);
  const policy_version = text(row.policy_version, "/learning_context/policy_version", issues);
  const locale_registry_version = text(row.locale_registry_version, "/learning_context/locale_registry_version", issues);
  const content_locale_id = locale(row.content_locale_id, "/learning_context/content_locale_id", issues);
  const equivalence_version = nullableText(row.equivalence_version, "/learning_context/equivalence_version", issues);
  const fallback_rule_version = nullableText(row.fallback_rule_version, "/learning_context/fallback_rule_version", issues);
  const requested_content_locale_id = locale(row.requested_content_locale_id, "/learning_context/requested_content_locale_id", issues);
  if (area === undefined || course_id === undefined || item_id === undefined || enrollment_id === undefined ||
    curriculum_manifest_id === undefined || curriculum_manifest_sha256 === undefined || content_version === undefined ||
    policy_version === undefined || locale_registry_version === undefined || content_locale_id === undefined ||
    equivalence_version === undefined || fallback_rule_version === undefined || requested_content_locale_id === undefined) return undefined;
  return { area, course_id, item_id, enrollment_id, curriculum_manifest_id, curriculum_manifest_sha256,
    content_version, policy_version, locale_registry_version, content_locale_id, equivalence_version,
    fallback_rule_version, requested_content_locale_id };
}
function payload(value: unknown, issues: Issues): AssessmentCreatePayload | undefined {
  const row = objectFields(value, PAYLOAD_FIELDS, "/payload", issues);
  if (!row) return undefined;
  const assessment_id = text(row.assessment_id, "/payload/assessment_id", issues);
  const assessment_version = text(row.assessment_version, "/payload/assessment_version", issues);
  const rubric_version = text(row.rubric_version, "/payload/rubric_version", issues);
  const assessment_locale_id = locale(row.assessment_locale_id, "/payload/assessment_locale_id", issues);
  const response_policy_version = text(row.response_policy_version, "/payload/response_policy_version", issues);
  const response_locale_id = locale(row.response_locale_id, "/payload/response_locale_id", issues);
  const accommodation_id = nullableUuid(row.accommodation_id, "/payload/accommodation_id", issues);
  if (assessment_id === undefined || assessment_version === undefined || rubric_version === undefined ||
    assessment_locale_id === undefined || response_policy_version === undefined || response_locale_id === undefined ||
    accommodation_id === undefined) return undefined;
  return { assessment_id, assessment_version, rubric_version, assessment_locale_id,
    response_policy_version, response_locale_id, accommodation_id };
}

export function decodeAssessmentCreateInput(value: unknown): AssessmentCreateInputResult {
  const issues: Issues = [];
  const row = objectFields(value, ROOT_FIELDS, "", issues);
  if (!row) return { ok: false, issues };
  const contract_version = row.contract_version;
  const command = row.command;
  const wire_revision = row.wire_revision;
  const expected_revision = row.expected_revision;
  if (contract_version !== "masarat-backend-v1") issues.push({ path: "/contract_version", code: "const" });
  if (command !== "create_attempt") issues.push({ path: "/command", code: "const" });
  if (wire_revision !== 3) issues.push({ path: "/wire_revision", code: "const" });
  if (expected_revision !== 0) issues.push({ path: "/expected_revision", code: "const" });
  const operation_id = uuid(row.operation_id, "/operation_id", issues);
  const decodedSubject = subject(row.subject, issues);
  const organization_id = nullableUuid(row.organization_id, "/organization_id", issues);
  const ui_locale = member(row.ui_locale, ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const, "/ui_locale", issues);
  const learning_context = learning(row.learning_context, issues);
  const decodedPayload = payload(row.payload, issues);
  if (contract_version !== "masarat-backend-v1" || command !== "create_attempt" || wire_revision !== 3 ||
    expected_revision !== 0 || operation_id === undefined || decodedSubject === undefined || organization_id === undefined ||
    ui_locale === undefined || learning_context === undefined || decodedPayload === undefined || issues.length !== 0) {
    return { ok: false, issues };
  }
  return { ok: true, trust: "untrusted", request: { contract_version, command, wire_revision,
    operation_id, subject: decodedSubject, organization_id, ui_locale, learning_context,
    expected_revision, payload: decodedPayload } };
}
