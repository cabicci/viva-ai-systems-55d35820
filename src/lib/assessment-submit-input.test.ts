import { expect, test } from "vitest";
import {
  decodeAssessmentSubmitInput,
  type AssessmentSubmitArea,
  type AssessmentSubmitSubjectKind,
  type AssessmentSubmitUiLocale,
  type UntrustedAssessmentSubmitArtifact,
  type UntrustedAssessmentSubmitLearningContext,
  type UntrustedAssessmentSubmitRequest,
  type UntrustedAssessmentSubmitResponse,
} from "./assessment-submit-input";

const ID = "01234567-89ab-cdef-0123-456789abcdef";
const OTHER = "ABCDEF01-2345-6789-ABCD-EF0123456789";
const HASH = "0123456789abcdef".repeat(4);

function learning(): UntrustedAssessmentSubmitLearningContext {
  return {
    area: "academic", course_id: " course Original ", item_id: "item-Q", enrollment_id: OTHER,
    curriculum_manifest_id: "manifest-v", curriculum_manifest_sha256: HASH,
    content_version: "content-v", policy_version: "policy-v", locale_registry_version: "registry-v",
    content_locale_id: "Content.X_1:a-b", equivalence_version: null,
    fallback_rule_version: " fallback-V ", requested_content_locale_id: "Requested.Y_2:c-d",
  };
}
function answer(): UntrustedAssessmentSubmitResponse {
  return { question_id: "question-one", answer_type: "text", original_answer: " original\nanswer ", response_locale_id: null };
}
function upload(): UntrustedAssessmentSubmitArtifact {
  return { upload_id: OTHER, object_version_id: " upload-v ", sha256: HASH };
}
function request(): UntrustedAssessmentSubmitRequest {
  return {
    contract_version: "masarat-backend-v1", command: "submit_attempt", wire_revision: 3,
    operation_id: ID, subject: { kind: "auth_user", id: OTHER }, organization_id: null,
    ui_locale: "ar-MSA", learning_context: learning(), expected_revision: 7,
    payload: { attempt_id: OTHER, snapshot_sha256: HASH, responses: [answer()], artifacts: [upload()],
      draft_id: ID, expected_attempt_revision: 11 },
  };
}
function isBox(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
function box(value: unknown): Record<string, unknown> {
  if (!isBox(value)) throw new Error("Synthetic fixture navigation failed");
  return value;
}
function locate(value: unknown, path: string): Record<string, unknown> {
  let current = box(value);
  for (const key of path.split(".").filter(Boolean)) current = box(current[key]);
  return current;
}
function changed(path: string, value: unknown): UntrustedAssessmentSubmitRequest {
  const input = request();
  const pieces = path.split(".");
  const key = pieces.pop();
  if (!key) throw new Error("Missing synthetic path");
  locate(input, pieces.join("."))[key] = value;
  return input;
}
function accepted(input: unknown): UntrustedAssessmentSubmitRequest {
  const result = decodeAssessmentSubmitInput(input);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("Expected synthetic input to decode");
  expect(result.trust).toBe("untrusted");
  expect(Object.keys(result).sort()).toEqual(["ok", "request", "trust"]);
  expect(result.request).toStrictEqual(input);
  return result.request;
}
function rejected(input: unknown): void {
  const result = decodeAssessmentSubmitInput(input);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error("Expected syntax rejection");
  for (const issue of result.issues) {
    expect(typeof issue.path).toBe("string");
    expect(["type", "required", "additional_property", "const", "enum", "length", "format", "pattern", "range", "integer", "items"]).toContain(issue.code);
    expect(Object.keys(issue).sort()).toEqual(["code", "path"]);
  }
}

const ui: readonly AssessmentSubmitUiLocale[] = ["ar-EG", "ar-MSA", "ar-Gulf", "en"];
const areas: readonly AssessmentSubmitArea[] = ["ai", "technical", "academic", "kids"];
const kinds: readonly AssessmentSubmitSubjectKind[] = ["auth_user", "kids_profile"];
for (const kind of kinds) {
  for (let index = 0; index < ui.length; index += 1) {
    test(`SUB-POS full context ${kind} ${ui[index]}`, () => {
      const input = request(); input.subject.kind = kind; input.ui_locale = ui[index];
      const context = learning(); context.area = areas[index]; input.learning_context = context;
      input.organization_id = index % 2 ? ID : null;
      context.equivalence_version = index % 2 ? "equiv-actual" : null;
      context.fallback_rule_version = index % 2 ? null : "fallback-actual";
      input.payload.responses[0].response_locale_id = "Response.Z_3:e-f";
      accepted(input);
    });
  }
}
test.each(ui)("SUB-POS null context and independent UI %s", (locale) => {
  const input = request(); input.ui_locale = locale; input.learning_context = null;
  input.organization_id = OTHER; input.subject.kind = "kids_profile"; accepted(input);
});

const objectFields = [
  ["", ["contract_version", "command", "wire_revision", "operation_id", "subject", "organization_id", "ui_locale", "learning_context", "expected_revision", "payload"]],
  ["subject", ["kind", "id"]],
  ["learning_context", ["area", "course_id", "item_id", "enrollment_id", "curriculum_manifest_id", "curriculum_manifest_sha256", "content_version", "policy_version", "locale_registry_version", "content_locale_id", "equivalence_version", "fallback_rule_version", "requested_content_locale_id"]],
  ["payload", ["attempt_id", "snapshot_sha256", "responses", "artifacts", "draft_id", "expected_attempt_revision"]],
  ["payload.responses.0", ["question_id", "answer_type", "original_answer", "response_locale_id"]],
  ["payload.artifacts.0", ["upload_id", "object_version_id", "sha256"]],
] as const;
for (const [site, fields] of objectFields) {
  for (const field of fields) {
    test(`SUB-REQ omit ${site || "root"}.${field}`, () => {
      const input = request(); delete locate(input, site)[field]; rejected(input);
    });
    test(`SUB-OWN inherited only ${site || "root"}.${field}`, () => {
      const input = request(); const original = locate(input, site);
      const inherited: unknown = Object.create({ [field]: original[field] });
      for (const key of Object.keys(original)) if (key !== field) box(inherited)[key] = original[key];
      if (!site) rejected(inherited);
      else {
        const parts = site.split("."); const last = parts.pop();
        if (!last) throw new Error("Missing fixture segment");
        locate(input, parts.join("."))[last] = inherited; rejected(input);
      }
    });
  }
  for (const extra of ["actor", "score", "receipt", "private_marking", "__proto__", "constructor"]) {
    test(`SUB-EXTRA ${site || "root"}.${extra}`, () => {
      const input = request();
      Object.defineProperty(locate(input, site), extra, { value: { private: "unrelated synthetic value" }, enumerable: true });
      rejected(input);
    });
  }
  test.each([null, [], 1, false, "object"].map((value) => [
    site === "learning_context" && value === null
      ? "SUB-SHAPE learning_context permits null"
      : `SUB-SHAPE ${site || "root"} rejects ${JSON.stringify(value)}`,
    value,
  ] as const))("%s", (_name, value) => {
    if (site === "learning_context" && value === null) accepted(changed(site, value));
    else if (!site) rejected(value); else rejected(changed(site, value));
  });
}

test.each([
  ["contract_version", "masarat-backend-v2"], ["contract_version", null], ["command", "create_attempt"],
  ["command", 3], ["wire_revision", 2], ["wire_revision", "3"], ["wire_revision", null],
  ["ui_locale", "EN"], ["ui_locale", "en "], ["ui_locale", "fr"], ["ui_locale", 1],
  ["subject.kind", "student"], ["subject.kind", null], ["learning_context.area", "Academic"],
  ["learning_context.area", "school"], ["payload.responses.0.answer_type", "json"], ["payload.responses.0.answer_type", null],
] as const)("SUB-LITERAL %s rejects %j", (path, value) => rejected(changed(path, value)));

for (const path of ["expected_revision", "payload.expected_attempt_revision"]) {
  test.each([-1, 0.5, 9007199254740992, NaN, Infinity, -Infinity, "1", null, {}, []].map((value, index) => [index, value] as const))(
    `SUB-REV ${path} rejects numbered boundary %i %j`, (_index, value) => rejected(changed(path, value)),
  );
}
test.each([[0, 9007199254740991], [9007199254740991, 0], [21, 34], [-0, -0]])(
  "SUB-REV preserve independent parsed revisions %j %j", (outer, inner) => {
    const input = request(); input.expected_revision = outer; input.payload.expected_attempt_revision = inner;
    const output = accepted(input);
    expect(Object.is(output.expected_revision, outer)).toBe(true);
    expect(Object.is(output.payload.expected_attempt_revision, inner)).toBe(true);
  },
);

test.each([0, 300])("SUB-ARRAY responses count %i and duplicate order", (length) => {
  const input = request(); input.payload.responses = Array.from({ length }, (_, index) => ({
    ...answer(), question_id: index === 1 ? "second" : "repeated", original_answer: String(index % 2),
  }));
  accepted(input);
});
test.each([0, 20])("SUB-ARRAY artifacts count %i and duplicates", (length) => {
  const input = request(); input.payload.artifacts = Array.from({ length }, () => upload()); accepted(input);
});
test("SUB-ARRAY response 301 rejects", () => {
  const input = request(); input.payload.responses = Array.from({ length: 301 }, () => answer()); rejected(input);
});
test("SUB-ARRAY artifact 21 rejects", () => {
  const input = request(); input.payload.artifacts = Array.from({ length: 21 }, () => upload()); rejected(input);
});
for (const path of ["payload.responses", "payload.artifacts"]) {
  test.each([null, {}, "[]", 0, false])(`SUB-ARRAY ${path} rejects wrong container %j`, (value) => rejected(changed(path, value)));
}
test("SUB-ARRAY entries are newly projected, repeated values remain permitted", () => {
  const input = request(); input.payload.responses = [answer(), answer()]; input.payload.artifacts = [upload(), upload()];
  const output = accepted(input);
  expect(output.payload.responses[0]).not.toBe(input.payload.responses[0]);
  expect(output.payload.responses[1]).not.toBe(input.payload.responses[1]);
  expect(output.payload.responses[0]).not.toBe(output.payload.responses[1]);
  expect(output.payload.artifacts[0]).not.toBe(input.payload.artifacts[0]);
});

for (const kind of ["text", "choice", "structured"] as const) {
  test.each(["", "  ", "  جواب e\u0301 😀\n ", '{"selection":[1,2]}', "not JSON {", "2"])(
    `SUB-ANSWER ${kind} retains original string %j`, (original) => {
      const input = request(); input.payload.responses[0].answer_type = kind;
      input.payload.responses[0].original_answer = original; accepted(input);
    },
  );
}
test.each([65536, 65537])("SUB-ANSWER BMP code point boundary %i", (size) => {
  const input = changed("payload.responses.0.original_answer", "x".repeat(size));
  if (size === 65536) accepted(input); else rejected(input);
});
test.each([65536, 65537])("SUB-ANSWER astral code point boundary %i", (size) => {
  const input = changed("payload.responses.0.original_answer", "😀".repeat(size));
  if (size === 65536) accepted(input); else rejected(input);
});
test("SUB-ANSWER combining code point boundary", () => {
  accepted(changed("payload.responses.0.original_answer", "e\u0301".repeat(32768)));
  rejected(changed("payload.responses.0.original_answer", "e\u0301".repeat(32768) + "e"));
});
test.each([null, 1, false, {}, []].map((value) => [value] as const))("SUB-ANSWER rejects non-string %j for structured", (value) => {
  const input = changed("payload.responses.0.original_answer", value); input.payload.responses[0].answer_type = "structured"; rejected(input);
});

const shortFields = ["learning_context.course_id", "learning_context.item_id", "learning_context.curriculum_manifest_id",
  "learning_context.content_version", "learning_context.policy_version", "learning_context.locale_registry_version",
  "learning_context.equivalence_version", "learning_context.fallback_rule_version", "payload.responses.0.question_id", "payload.artifacts.0.object_version_id"];
for (const path of shortFields) {
  test.each([0, 1, 200, 201])(`SUB-STRING ${path} code point boundary %i`, (size) => {
    const input = changed(path, "😀".repeat(size));
    if (size === 1 || size === 200) accepted(input); else rejected(input);
  });
  test(`SUB-STRING ${path} preserves spaces, case and combining text`, () => accepted(changed(path, "  Original e\u0301\n ")));
  test(`SUB-STRING ${path} rejects numeric coercion`, () => rejected(changed(path, 12)));
}
test.each(["organization_id", "learning_context.equivalence_version", "learning_context.fallback_rule_version", "payload.responses.0.response_locale_id"])(
  "SUB-NULL required explicit null %s", (path) => { accepted(changed(path, null)); },
);

const uuidPaths = ["operation_id", "subject.id", "organization_id", "learning_context.enrollment_id", "payload.attempt_id", "payload.artifacts.0.upload_id"];
for (const path of uuidPaths) {
  test(`SUB-UUID ${path} accepts mixed uppercase non-v4 lexical ID`, () => accepted(changed(path, OTHER)));
  test.each(["01234567-89ab-cdef-0123-456789abcde", "01234567-89ab-cdef-0123-456789abcdef0", "g1234567-89ab-cdef-0123-456789abcdef",
    "0123456-789ab-cdef-0123-456789abcdef", "{01234567-89ab-cdef-0123-456789abcdef}", " " + ID, ID + "\n", 3, {}, []].map((value) => [value] as const))(
    `SUB-UUID ${path} rejects %j`, (value) => rejected(changed(path, value)),
  );
}
test.each([OTHER, ID + "\n", ID.slice(1), "g" + ID.slice(1), 1, null, {}])(
  "SUB-DRAFT own lowercase UUID restriction rejects %j", (value) => rejected(changed("payload.draft_id", value)),
);
test("SUB-UUID equality is not forbidden or admission", () => {
  const input = request(); input.operation_id = ID; input.subject.id = ID; input.organization_id = ID;
  const context = learning(); context.enrollment_id = ID; input.learning_context = context;
  input.payload.attempt_id = ID; input.payload.draft_id = ID; input.payload.artifacts[0].upload_id = ID; accepted(input);
});
for (const path of ["learning_context.curriculum_manifest_sha256", "payload.snapshot_sha256", "payload.artifacts.0.sha256"]) {
  test(`SUB-HASH ${path} accepts lexical lowercase only without resolving material`, () => accepted(changed(path, "a".repeat(64))));
  test.each(["a".repeat(63), "a".repeat(65), "A".repeat(64), "g".repeat(64), "a".repeat(63) + "\n", 7, null])(
    `SUB-HASH ${path} rejects %j`, (value) => rejected(changed(path, value)),
  );
}
for (const path of ["learning_context.content_locale_id", "learning_context.requested_content_locale_id", "payload.responses.0.response_locale_id"]) {
  test.each(["a", "Z9._:-", "X".repeat(64), "xx-Extensible.Original_2:x"])(`SUB-TOKEN ${path} accepts %s`, (value) => { accepted(changed(path, value)); });
  test.each(["", "X".repeat(65), "1bad", ".bad", "-bad", "a+", "a/", "a@", " a", "a ", "é", "ع", "a😀", "a\tb", "a\nb", "a\n", "a\r", "a\u2028", "a\u2029", "a\r\n", 1, {}])(
    `SUB-TOKEN ${path} rejects %j`, (value) => rejected(changed(path, value)),
  );
}
test("SUB-PRESERVE caller input unchanged on success and rejection", () => {
  const valid = request(); const before = structuredClone(valid); accepted(valid); expect(valid).toStrictEqual(before);
  const invalid = changed("payload.responses.0.original_answer", { private: "synthetic answer-value sentinel" });
  const snapshot = structuredClone(invalid); rejected(invalid); expect(invalid).toStrictEqual(snapshot);
  const extra = request(); Object.defineProperty(extra.payload, "receipt", { value: { unrelated: "retained caller value" }, enumerable: true });
  const extraBefore = structuredClone(extra); rejected(extra); expect(extra).toStrictEqual(extraBefore);
});
test("SUB-PROJECT later caller nested and array changes cannot relabel decoded output", () => {
  const input = request(); const before = structuredClone(input); const output = accepted(input);
  expect(output).not.toBe(input); expect(output.subject).not.toBe(input.subject);
  expect(output.learning_context).not.toBe(input.learning_context); expect(output.payload).not.toBe(input.payload);
  expect(output.payload.responses).not.toBe(input.payload.responses); expect(output.payload.artifacts).not.toBe(input.payload.artifacts);
  input.subject.id = ID; input.organization_id = OTHER; input.expected_revision = 100;
  if (input.learning_context) { input.learning_context.policy_version = "changed"; input.learning_context.content_locale_id = "changed"; }
  input.payload.responses[0].original_answer = "changed answer"; input.payload.responses[0].response_locale_id = "changed";
  input.payload.artifacts[0].sha256 = "0".repeat(64); input.payload.artifacts[0].object_version_id = "changed";
  input.payload.responses.push(answer()); input.payload.responses.reverse(); input.payload.artifacts.splice(0, 1);
  input.learning_context = null; input.subject = { kind: "kids_profile", id: ID };
  input.payload = { ...input.payload, responses: [], artifacts: [], draft_id: "00000000-0000-0000-0000-000000000000" };
  expect(output).toStrictEqual(before);
});
test("SUB-ISSUES never echo an original answer value or claim record existence", () => {
  const secret = "SYNTHETIC_PRIVATE_ANSWER_SENTINEL_71";
  const result = decodeAssessmentSubmitInput(changed("payload.responses.0.original_answer", { text: secret }));
  expect(result.ok).toBe(false); expect(JSON.stringify(result)).not.toContain(secret);
  const enumResult = decodeAssessmentSubmitInput(changed("ui_locale", secret));
  expect(enumResult.ok).toBe(false); expect(JSON.stringify(enumResult)).not.toContain(secret);
});
