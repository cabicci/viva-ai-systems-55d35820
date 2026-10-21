// @vitest-environment node
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parseAiCommerceRegistration, verifyAiCommerceRegistration, verifyAcademicPolicyRegistration } from "../../../scripts/assistant/access-registration-contract";
import type { IntegrationPath } from "../card-assistant/integration-contract";
const sql = readFileSync(new URL("../../../supabase/migrations/20261004012000_commerce_access.sql", import.meta.url), "utf8");
const contract = parseAiCommerceRegistration(sql);
const paths = (): IntegrationPath[] => [...new Set(contract.lessons.map(row => row.cardId))].map(id => ({ id, status: "open",
  modules: [{ id: `${id}-station`, lessons: contract.lessons.filter(row => row.cardId === id).map(row => ({ id: row.lessonId, state: "available" })) }] }));
it("reads the actual 71/100 SQL catalogue and tier exclusion without changing billing policy", () => {
  expect(contract.lessons).toHaveLength(100);
  expect(contract).toMatchObject({ excludedProCard: "builder", expectedProLessons: 71, expectedProPlusLessons: 100 });
  expect(verifyAiCommerceRegistration(paths(), contract)).toEqual([]);
});
it("blocks a future live card that has content but no commerce registration", () => {
  const next = [...paths(), { id: "future", status: "open", modules: [{ id: "future-one", lessons: [{ id: "future-step", state: "available" }] }] }];
  expect(verifyAiCommerceRegistration(next, contract).map(issue => issue.code)).toEqual(expect.arrayContaining(["COMMERCE_MISSING_STEP", "COMMERCE_LIVE_CARDINALITY"]));
});
it("still blocks adding a commerce row without updating its reviewed fixed-count contract", () => {
  const next = paths(); next[0].modules[0].lessons.push({ id: "future-step", state: "available" });
  expect(verifyAiCommerceRegistration(next, { ...contract, lessons: [...contract.lessons, { lessonId: "future-step", cardId: next[0].id }] })
    .map(issue => issue.code)).toEqual(expect.arrayContaining(["COMMERCE_CARDINALITY", "COMMERCE_LIVE_CARDINALITY"]));
});
it("blocks incorrect card ownership and duplicate catalogue rows", () => {
  const changed = structuredClone(contract); changed.lessons[0].cardId = "builder"; changed.lessons.push(changed.lessons[1]);
  expect(verifyAiCommerceRegistration(paths(), changed).map(issue => issue.code)).toEqual(expect.arrayContaining(["COMMERCE_WRONG_CARD", "COMMERCE_DUPLICATE_STEP"]));
});
it("requires explicit review when SQL registration changes shape", () => {
  expect(() => parseAiCommerceRegistration(sql.replace("THEN 71 ELSE 100", "THEN computed_limit ELSE 100"))).toThrow("CONTRACT_CHANGED");
});
const course = { id: "AC-NEW", enabled: true, assistant_enabled: true, assistant_review_enabled: false };
it("rejects a published Academic assistant with an absent or disabled independent DB policy", () => {
  expect(verifyAcademicPolicyRegistration([course], undefined)[0].code).toBe("ACADEMIC_POLICY_UNVERIFIED");
  expect(verifyAcademicPolicyRegistration([course], [])[0].code).toBe("ACADEMIC_POLICY_MISSING");
  expect(verifyAcademicPolicyRegistration([course], [{ course_id: course.id, runtime_enabled: false }])[0].code).toBe("ACADEMIC_POLICY_DISABLED");
  expect(verifyAcademicPolicyRegistration([course], [{ course_id: course.id, runtime_enabled: true }])).toEqual([]);
});
it("requires review-only assistant policy too while allowing intentionally unpublished cards", () => {
  expect(verifyAcademicPolicyRegistration([{ ...course, enabled: false, assistant_enabled: false, assistant_review_enabled: true }], [])[0].code).toBe("ACADEMIC_POLICY_MISSING");
  expect(verifyAcademicPolicyRegistration([{ ...course, enabled: false, assistant_enabled: false }], [])).toEqual([]);
});
