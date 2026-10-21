import type { IntegrationIssue, IntegrationPath } from "../../src/lib/card-assistant/integration-contract";

export type AiCommerceRegistration = {
  lessons: { lessonId: string; cardId: string }[];
  excludedProCard: string;
  expectedProLessons: number;
  expectedProPlusLessons: number;
};

/** Parse the installed source-controlled contract, failing closed if its SQL
 * shape changes. This never executes SQL or invents subscription membership. */
export function parseAiCommerceRegistration(sql: string): AiCommerceRegistration {
  const inserts = [...sql.matchAll(/INSERT\s+INTO\s+billing\.commerce_lesson_catalog\s*\(\s*lesson_id\s*,\s*path_id\s*\)\s*VALUES\s*([\s\S]*?);/gi)];
  const count = [...sql.matchAll(/CASE\s+v_package\s+WHEN\s+'pro'\s+THEN\s+(\d+)\s+ELSE\s+(\d+)\s+END/gi)];
  const selector = [...sql.matchAll(/FROM\s+billing\.commerce_lesson_catalog\s+WHERE\s+v_package\s*=\s*'pro_plus'\s+OR\s+path_id\s*<>\s*'([a-z0-9-]+)'\s*;/gi)];
  if (inserts.length !== 1 || count.length !== 1 || selector.length !== 1)
    throw new Error("COMMERCE_REGISTRATION_CONTRACT_CHANGED: inspect the authoritative catalogue and tier selection before updating this parser.");
  const body = inserts[0][1];
  const rows = [...body.matchAll(/\(\s*'([a-z0-9-]+)'\s*,\s*'([a-z0-9-]+)'\s*\)/g)];
  if (!rows.length || body.replace(/\(\s*'([a-z0-9-]+)'\s*,\s*'([a-z0-9-]+)'\s*\)/g, "").replace(/[\s,]/g, ""))
    throw new Error("COMMERCE_REGISTRATION_VALUES_CHANGED: only explicit reviewed lesson/card pairs are supported.");
  return { lessons: rows.map(row => ({ lessonId: row[1], cardId: row[2] })), excludedProCard: selector[0][1],
    expectedProLessons: Number(count[0][1]), expectedProPlusLessons: Number(count[0][2]) };
}

export function verifyAiCommerceRegistration(paths: IntegrationPath[], contract: AiCommerceRegistration): IntegrationIssue[] {
  const issues: IntegrationIssue[] = [];
  const location = "billing.commerce_lesson_catalog";
  const expected = new Map(paths.flatMap(card => card.modules.flatMap(station => station.lessons
    .filter(step => step.state === "available").map(step => [step.id, card.id] as const))));
  const registered = new Map<string, string>();
  for (const row of contract.lessons) {
    if (registered.has(row.lessonId)) issues.push({ code: "COMMERCE_DUPLICATE_STEP", location: `${location}:${row.lessonId}`, message: "One commerce owner is required per lesson." });
    registered.set(row.lessonId, row.cardId);
    if (expected.get(row.lessonId) !== row.cardId) issues.push({ code: "COMMERCE_WRONG_CARD", location: `${location}:${row.lessonId}`, message: `Commerce card ${row.cardId} does not match the live lesson owner; review the source-controlled access migration.` });
  }
  for (const [id, card] of expected) if (!registered.has(id)) issues.push({ code: "COMMERCE_MISSING_STEP", location: `ai:${card}:${id}`, message: "Register the new lesson in the authoritative commerce catalogue and review its existing tier contract before publication." });
  const actualPro = contract.lessons.filter(row => row.cardId !== contract.excludedProCard).length;
  const actualPlus = contract.lessons.length;
  if (actualPro !== contract.expectedProLessons || actualPlus !== contract.expectedProPlusLessons)
    issues.push({ code: "COMMERCE_CARDINALITY", location, message: `The SQL snapshot gate requires pro=${contract.expectedProLessons}/pro_plus=${contract.expectedProPlusLessons}, but its catalogue has ${actualPro}/${actualPlus}; update the reviewed registration contract, without bypassing subscription checks.` });
  // Even before a new lesson is inserted into commerce, identify the hardcoded
  // cardinality gate that will reject an otherwise complete future registration.
  const livePro = [...expected.values()].filter(card => card !== contract.excludedProCard).length;
  if (livePro !== contract.expectedProLessons || expected.size !== contract.expectedProPlusLessons)
    issues.push({ code: "COMMERCE_LIVE_CARDINALITY", location: "billing.get_entitlement_snapshot", message: `Live lessons need ${livePro}/${expected.size} entries; the source-controlled snapshot still expects ${contract.expectedProLessons}/${contract.expectedProPlusLessons}. A billing registration migration must accompany this content change.` });
  return issues;
}

export type AcademicPolicyCourse = { id: string; enabled: boolean; assistant_enabled: boolean; assistant_review_enabled: boolean };
export type AcademicPolicyRow = { course_id: string; runtime_enabled: boolean };
/** Intended for a protected publication export, never a substitute for the
 * authenticated runtime access RPC or per-user content/assistant entitlements. */
export function verifyAcademicPolicyRegistration(courses: AcademicPolicyCourse[], policies: AcademicPolicyRow[] | undefined): IntegrationIssue[] {
  const issues: IntegrationIssue[] = [];
  const registered = new Map<string, AcademicPolicyRow>();
  for (const policy of policies ?? []) {
    if (registered.has(policy.course_id)) issues.push({ code: "ACADEMIC_POLICY_DUPLICATE", location: policy.course_id, message: "Export exactly one assistant policy per registered course." });
    if (!courses.some(course => course.id === policy.course_id)) issues.push({ code: "ACADEMIC_POLICY_ORPHAN", location: policy.course_id, message: "Policy must refer to a registered academic course." });
    registered.set(policy.course_id, policy);
  }
  for (const course of courses) {
    if (!(course.assistant_review_enabled || (course.enabled && course.assistant_enabled))) continue;
    const policy = registered.get(course.id);
    if (!policy) issues.push({ code: policies === undefined ? "ACADEMIC_POLICY_UNVERIFIED" : "ACADEMIC_POLICY_MISSING", location: course.id, message: "Export and verify the actual academic_assistant_policy row before publishing assistant access; repository content alone does not register this DB policy." });
    else if (policy.runtime_enabled !== true) issues.push({ code: "ACADEMIC_POLICY_DISABLED", location: course.id, message: "This card advertises assistant access while its independent runtime policy is disabled. Reconcile the intended release state; do not bypass the gate." });
  }
  return issues;
}
