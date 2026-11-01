import { describe, expect, it } from "vitest";
import { decodeAssessmentCreateInput, type AssessmentCreateIssueCode,
  type UntrustedAssessmentCreateRequest } from "./assessment-create-input";

// Independent synthetic examples, not generated from the schema or decoder helpers.
function example(): UntrustedAssessmentCreateRequest {
  return {
    contract_version: "masarat-backend-v1", command: "create_attempt", wire_revision: 3,
    operation_id: "11111111-2222-3333-4444-555555555555",
    subject: { kind: "auth_user", id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" },
    organization_id: null, ui_locale: "ar-EG",
    learning_context: {
      area: "ai", course_id: "course-one", item_id: "item-one",
      enrollment_id: "22222222-3333-4444-5555-666666666666",
      curriculum_manifest_id: "release-one", curriculum_manifest_sha256: "a0".repeat(32),
      content_version: "content-one", policy_version: "policy-one", locale_registry_version: "registry-one",
      content_locale_id: "fr-CA", equivalence_version: null, fallback_rule_version: null,
      requested_content_locale_id: "de-AT",
    },
    expected_revision: 0,
    payload: {
      assessment_id: "assessment-one", assessment_version: "assessment-version-one", rubric_version: "rubric-one",
      assessment_locale_id: "es-419", response_policy_version: "response-policy-one",
      response_locale_id: "sw-KE", accommodation_id: null,
    },
  };
}
// Only the malformed-input construction boundary uses an unknown-valued record.
function record(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid test construction");
  return value as Record<string, unknown>;
}
function container(input: unknown, path: string): { row: Record<string, unknown>; key: string } {
  const parts = path.split("/").slice(1);
  const key = parts.pop();
  if (key === undefined) throw new Error("missing construction path");
  let row = record(input);
  for (const part of parts) row = record(row[part]);
  return { row, key };
}
function replace(input: unknown, path: string, value: unknown): void {
  const { row, key } = container(input, path); row[key] = value;
}
function omit(input: unknown, path: string): void {
  const { row, key } = container(input, path); delete row[key];
}
function rejected(input: unknown, path: string, code: AssessmentCreateIssueCode): void {
  const result = decodeAssessmentCreateInput(input);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error("unexpected successful decode");
  expect(result.issues).toContainEqual({ path, code });
  for (const issue of result.issues) expect(Object.keys(issue).sort()).toEqual(["code", "path"]);
  expect(Object.keys(result).sort()).toEqual(["issues", "ok"]);
}
function decoded(input: unknown): UntrustedAssessmentCreateRequest {
  const result = decodeAssessmentCreateInput(input);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("unexpected syntax rejection");
  expect(result.trust).toBe("untrusted");
  expect(Object.keys(result).sort()).toEqual(["ok", "request", "trust"]);
  return result.request;
}

const REQUIRED = [
  "/contract_version", "/command", "/wire_revision", "/operation_id", "/subject", "/organization_id",
  "/ui_locale", "/learning_context", "/expected_revision", "/payload", "/subject/kind", "/subject/id",
  "/learning_context/area", "/learning_context/course_id", "/learning_context/item_id", "/learning_context/enrollment_id",
  "/learning_context/curriculum_manifest_id", "/learning_context/curriculum_manifest_sha256",
  "/learning_context/content_version", "/learning_context/policy_version", "/learning_context/locale_registry_version",
  "/learning_context/content_locale_id", "/learning_context/equivalence_version", "/learning_context/fallback_rule_version",
  "/learning_context/requested_content_locale_id", "/payload/assessment_id", "/payload/assessment_version",
  "/payload/rubric_version", "/payload/assessment_locale_id", "/payload/response_policy_version",
  "/payload/response_locale_id", "/payload/accommodation_id",
] as const;
const TEXT_FIELDS = [
  "/learning_context/course_id", "/learning_context/item_id", "/learning_context/curriculum_manifest_id",
  "/learning_context/content_version", "/learning_context/policy_version", "/learning_context/locale_registry_version",
  "/learning_context/equivalence_version", "/learning_context/fallback_rule_version",
  "/payload/assessment_id", "/payload/assessment_version", "/payload/rubric_version", "/payload/response_policy_version",
] as const;
const UUID_FIELDS = ["/operation_id", "/subject/id", "/organization_id", "/learning_context/enrollment_id", "/payload/accommodation_id"] as const;
const LOCALE_FIELDS = ["/learning_context/content_locale_id", "/learning_context/requested_content_locale_id",
  "/payload/assessment_locale_id", "/payload/response_locale_id"] as const;

describe("decodeAssessmentCreateInput: ordinary parsed JSON syntax only", () => {
  it("projects the complete independent example with no authority or extra wire fields", () => {
    const input = example(); const output = decoded(input);
    expect(output).toEqual(input);
    expect(Object.keys(output)).toHaveLength(10);
    expect(Object.keys(output.learning_context)).toHaveLength(13);
    expect(Object.keys(output.payload)).toHaveLength(7);
    expect(output).not.toBe(input);
    expect(output.subject).not.toBe(input.subject);
    expect(output.learning_context).not.toBe(input.learning_context);
    expect(output.payload).not.toBe(input.payload);
  });
  it.each(["auth_user", "kids_profile"] as const)("accepts subject syntax %s without ownership inference", kind => {
    const input = example(); input.subject.kind = kind; expect(decoded(input).subject.kind).toBe(kind);
  });
  it.each([
    ["ai", "ar-EG"], ["technical", "ar-MSA"], ["academic", "ar-Gulf"], ["kids", "en"],
  ] as const)("accepts area %s and UI key %s", (area, ui) => {
    const input = example(); input.learning_context.area = area; input.ui_locale = ui;
    expect(decoded(input)).toEqual(input);
  });
  it("accepts every nullable field as an actual value, including nonnull organization", () => {
    const input = example(); input.organization_id = "BBBBBBBB-CCCC-DDDD-EEEE-FFFFFFFFFFFF";
    input.payload.accommodation_id = "33333333-4444-5555-6666-777777777777";
    input.learning_context.equivalence_version = "equivalence-one"; input.learning_context.fallback_rule_version = "fallback-one";
    expect(decoded(input)).toEqual(input);
  });
  it("keeps all four explicit nulls instead of inferring applicability or defaults", () => {
    const output = decoded(example());
    expect(output.organization_id).toBeNull(); expect(output.payload.accommodation_id).toBeNull();
    expect(output.learning_context.equivalence_version).toBeNull(); expect(output.learning_context.fallback_rule_version).toBeNull();
  });
  it.each(REQUIRED)("rejects each own required omission %s", path => {
    const input = example(); omit(input, path); rejected(input, path, "required");
  });
  it.each(["/operation_id", "/subject/id", "/learning_context/equivalence_version", "/payload/accommodation_id"])(
    "does not accept inherited required %s", path => {
      const input = example(); const { row, key } = container(input, path); const value = row[key]; delete row[key];
      Object.setPrototypeOf(row, { [key]: value }); rejected(input, path, "required");
    });
  it.each([
    ["", "actor_user_id"], ["/subject", "owner_user_id"], ["/learning_context", "permission"], ["/payload", "private_answer_key"],
  ] as const)("rejects additional properties at object %s", (path, key) => {
    const input = example(); const target = path ? container(input, `${path}/x`).row : record(input);
    target[key] = { secret: "synthetic-private-extra" };
    rejected(input, `${path}/${key}`, "additional_property");
  });
  it.each(["actor", "role", "grade", "pass", "deadline", "receipt", "profile", "private_rubric", "trusted_binding", "verified"])(
    "rejects caller authority/private root field %s", key => {
      const input = example(); record(input)[key] = "synthetic-value-not-to-echo"; rejected(input, `/${key}`, "additional_property");
    });
  it("escapes additional-property syntax paths without returning private values", () => {
    const input = example(); record(input)["private/answer~"] = { value: "synthetic-private" };
    expect(decodeAssessmentCreateInput(input)).toEqual({ ok: false, issues: [{ path: "/private~1answer~0", code: "additional_property" }] });
  });
  it.each([
    ["/contract_version", "other"], ["/command", "submit_attempt"], ["/wire_revision", 4],
    ["/wire_revision", "3"], ["/expected_revision", 1], ["/expected_revision", "0"],
  ] as const)("rejects wrong literal %s = %s without coercion", (path, value) => {
    const input = example(); replace(input, path, value); rejected(input, path, "const");
  });
  it.each([["/subject/kind", "learner"], ["/learning_context/area", "school"], ["/ui_locale", "fr-CA"]])(
    "rejects unknown closed enum at %s", (path, value) => { const input = example(); replace(input, path, value); rejected(input, path, "enum"); });
  it.each(UUID_FIELDS)("preserves uppercase and accepts equal/nil syntactically valid IDs at %s", path => {
    const input = example(); replace(input, path, "ABCDEF01-ABCD-0123-4567-89ABCDEF0123");
    const output = decoded(input); const { row, key } = container(output, path); expect(row[key]).toBe("ABCDEF01-ABCD-0123-4567-89ABCDEF0123");
    for (const uuidPath of UUID_FIELDS) replace(input, uuidPath, "00000000-0000-0000-0000-000000000000");
    expect(decoded(input)).toEqual(input);
  });
  it.each(UUID_FIELDS)("rejects wrong UUID grouping at %s", path => {
    const input = example(); replace(input, path, "000000000-000-0000-0000-000000000000"); rejected(input, path, "format");
  });
  it.each(["0123456789abcdef0123456789abcdef", "00000000-0000-0000-0000-00000000000g", " 00000000-0000-0000-0000-000000000000"])(
    "rejects malformed UUID %s", value => {
      const input = example(); input.operation_id = value; const result = decodeAssessmentCreateInput(input); expect(result.ok).toBe(false);
    });
  it.each(TEXT_FIELDS)("accepts one and 200 code points at %s", path => {
    for (const value of ["x", "x".repeat(200), " ".repeat(200), "😀".repeat(200)]) {
      const input = example(); replace(input, path, value); const { row, key } = container(decoded(input), path); expect(row[key]).toBe(value);
    }
  });
  it.each(TEXT_FIELDS)("rejects empty, 201 ASCII and 201 astral code points at %s", path => {
    for (const value of ["", "x".repeat(201), "😀".repeat(201)]) {
      const input = example(); replace(input, path, value); rejected(input, path, "length");
    }
  });
  it.each(TEXT_FIELDS)("does not coerce a number to a string at %s", path => {
    const input = example(); replace(input, path, 17); rejected(input, path, "type");
  });
  it.each([
    ["a".repeat(63), "length"], ["a".repeat(65), "length"], ["A".repeat(64), "pattern"], ["g".repeat(64), "pattern"],
  ] as const)("rejects malformed lowerhex digest %s", (value, code) => {
    const input = example(); input.learning_context.curriculum_manifest_sha256 = value;
    rejected(input, "/learning_context/curriculum_manifest_sha256", code);
  });
  it("preserves four independent extensible content/assessment/response token values", () => {
    const input = example(); expect(decoded(input)).toEqual(input);
    expect(new Set([input.ui_locale, input.learning_context.content_locale_id,
      input.learning_context.requested_content_locale_id, input.payload.assessment_locale_id, input.payload.response_locale_id]).size).toBe(5);
  });
  it.each(LOCALE_FIELDS)("applies locale token syntax at %s without UI-enum restriction", path => {
    for (const value of ["q", "A" + "-".repeat(63), "x-Q1._:-"]) {
      const input = example(); replace(input, path, value); const { row, key } = container(decoded(input), path); expect(row[key]).toBe(value);
    }
    const input = example(); replace(input, path, "9abc"); rejected(input, path, "pattern");
  });
  it.each(["_abc", "9en", "é-FR", "en/US", "en US", " en"])("rejects locale first character/punctuation %s", value => {
    const input = example(); input.payload.response_locale_id = value; rejected(input, "/payload/response_locale_id", "pattern");
  });
  it.each(["", "x".repeat(65)])("rejects locale token length %s", value => {
    const input = example(); input.payload.assessment_locale_id = value; rejected(input, "/payload/assessment_locale_id", "length");
  });
  it.each(["", "/subject", "/learning_context", "/payload"])("rejects arrays/null/primitives for object %s", path => {
    for (const value of [null, [], "object", 1, true]) {
      if (path === "") rejected(value, "", "type");
      else { const input = example(); replace(input, path, value); rejected(input, path, "type"); }
    }
  });
  it.each(["/organization_id", "/payload/accommodation_id", "/learning_context/equivalence_version", "/learning_context/fallback_rule_version"])(
    "rejects wrong nonnull nullable primitive at %s", path => {
      const input = example(); replace(input, path, false); rejected(input, path, "type");
    });
  it("leaves a frozen input unchanged and makes an independent nested projection", () => {
    const input = example(); const original = structuredClone(input);
    Object.freeze(input.subject); Object.freeze(input.learning_context); Object.freeze(input.payload); Object.freeze(input);
    expect(decoded(input)).toEqual(original); expect(input).toEqual(original);
    const mutable = example(); const output = decoded(mutable); const before = structuredClone(output);
    mutable.subject.kind = "kids_profile"; mutable.learning_context.course_id = "changed"; mutable.payload.assessment_id = "changed";
    expect(output).toEqual(before);
  });
});
