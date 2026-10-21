// @vitest-environment node
import { expect, it } from "vitest";
import { verifyCardIntegration, INTEGRATION_LOCALES, type CoverageRecord } from "../card-assistant/integration-contract";
import { verifyAssistantWiring } from "../../../scripts/assistant/integration-wiring";
import type { PackageManifestEntry } from "../rag/types";
import type { CardMembershipJson } from "../rag/card-membership";
import type { RegisteredCard } from "../card-assistant/registry";

function fixture() {
  const packages: PackageManifestEntry[] = INTEGRATION_LOCALES.map(locale => ({ locale, lessonId: "one", trackId: "new-card", moduleId: "station-one",
    productionRoute: "/learn/new-card/one", packagePath: `src/lib/locale-lessons/${locale}/lessons/one.json`,
    packageChecksum: "a".repeat(64), sourceSha: "frozen", canonicalVersion: "1", chunkCount: 2 }));
  const membership: CardMembershipJson = { schemaVersion: "card-membership-v1", sourceSha: "frozen", indexVersion: "1",
    records: Object.fromEntries(packages.map(pkg => [`${pkg.locale}|${pkg.lessonId}`, { ...pkg, contextModuleIds: ["station-one"] }])) };
  const cards: RegisteredCard[] = [{ area: "kids", id: "level-1", steps: [{ id: "1", stationId: "level-1", preview: false,
    source: { adapter: "kids", levelId: "level-1", lessonNumber: 1 } }] }];
  const coverage: CoverageRecord[] = INTEGRATION_LOCALES.map(locale => ({ area: "kids", cardId: "level-1", stepId: "1", locale,
    approved: true, sourceSha256: "b".repeat(64), verifiedSha256: "b".repeat(64), chunks: 2 }));
  return { paths: [{ id: "new-card", status: "open", modules: [{ id: "station-one", lessons: [{ id: "one", state: "available", route: "/learn/new-card/one" }] }] }],
    cards, packages, membership, coverage };
}
it("accepts data-only card registration without fixed course counts", () => {
  expect(verifyCardIntegration(fixture())).toEqual([]);
});
it.each(["ai", "kids", "academic"])("rejects an authored %s card assistant switch in the mandatory publication check", area => {
  const data = { ...fixture(), academic: [{ id: "AC-NEW", titles: Object.fromEntries(INTEGRATION_LOCALES.map(locale => [locale, "New path"])), steps: ["AC-NEW-M01-L01"] }] };
  const card = area === "ai" ? data.paths[0] : area === "kids" ? data.cards[0] : data.academic[0];
  Object.assign(card, { assistant: false });
  expect(verifyCardIntegration(data)).toContainEqual(expect.objectContaining({ code: "COURSE_PLATFORM_OVERRIDE" }));
});
it("blocks a new live step missing even one approved locale", () => {
  const data = fixture(); data.packages.pop();
  expect(verifyCardIntegration(data)).toContainEqual(expect.objectContaining({ code: "MISSING_LOCALE_SOURCE", location: "ai:new-card:one:en" }));
});
it.each(["card", "station", "step"])("rejects duplicate %s ownership", type => {
  const data = fixture();
  if (type === "card") data.paths.push(structuredClone(data.paths[0]));
  if (type === "station") data.paths[0].modules.push(structuredClone(data.paths[0].modules[0]));
  if (type === "step") data.paths[0].modules[0].lessons.push(structuredClone(data.paths[0].modules[0].lessons[0]));
  expect(verifyCardIntegration(data).some(issue => issue.code === `DUPLICATE_${type.toUpperCase()}`)).toBe(true);
});
it("blocks cross-card sources, stale runtime members and route escapes", () => {
  const data = fixture(); data.packages[0].trackId = "other"; data.packages[1].productionRoute = "/learn/other/one";
  data.membership.records["en|old-step"] = { ...data.membership.records["en|one"], lessonId: "old-step" };
  const codes = verifyCardIntegration(data).map(issue => issue.code);
  expect(codes).toEqual(expect.arrayContaining(["ORPHAN_SOURCE", "SOURCE_ROUTE", "STALE_MEMBERSHIP", "RUNTIME_MEMBERSHIP"]));
});
it("accepts an observed localized station alias but rejects an absent live station", () => {
  const data = fixture(); data.packages[0].moduleId = "localized-station";
  Object.assign(data.membership.records["ar-EG|one"], { moduleId: "localized-station", contextModuleIds: ["station-one", "localized-station"] });
  expect(verifyCardIntegration(data)).toEqual([]);
  data.membership.records["ar-EG|one"].contextModuleIds = ["localized-station"];
  expect(verifyCardIntegration(data)).toContainEqual(expect.objectContaining({ code: "RUNTIME_MEMBERSHIP" }));
});
it("rejects reusing a protected source in another card", () => {
  const data = fixture(); data.cards.push({ ...structuredClone(data.cards[0]), id: "new-card" });
  expect(verifyCardIntegration(data)).toContainEqual(expect.objectContaining({ code: "CROSS_CARD_SOURCE", location: "kids:new-card:1" }));
});
it("rejects area/access adapter mismatch and preview-only whole-card access", () => {
  const data = fixture(); data.cards[0].steps[0].source = { adapter: "technical", lessonId: "M01-L01" };
  data.cards[0].steps[0].preview = true;
  const codes = verifyCardIntegration(data).map(issue => issue.code);
  expect(codes).toEqual(expect.arrayContaining(["ACCESS_ADAPTER", "PAID_SCOPE"]));
});
it.each(["missing", "unapproved", "changed", "empty"])("blocks %s protected publication content", kind => {
  const data = fixture();
  if (kind === "missing") data.coverage.pop();
  if (kind === "unapproved") data.coverage[0].approved = false;
  if (kind === "changed") data.coverage[0].verifiedSha256 = "c".repeat(64);
  if (kind === "empty") data.coverage[0].chunks = 0;
  expect(verifyCardIntegration(data)).toContainEqual(expect.objectContaining({ code: kind === "missing" ? "MISSING_LOCALE_SOURCE" : "UNAPPROVED_SOURCE" }));
});
it("requires four-locale coverage of dynamically registered academic cards", () => {
  const data = { ...fixture(), academic: [{ id: "AC-NEW", titles: Object.fromEntries(INTEGRATION_LOCALES.map(locale => [locale, "New path"])), steps: ["AC-NEW-M01-L01"] }] };
  const issues = verifyCardIntegration(data).filter(issue => issue.location.startsWith("academic:"));
  expect(issues).toHaveLength(4);
  expect(issues.every(issue => issue.code === "MISSING_LOCALE_SOURCE")).toBe(true);
});
it("does not mistake comments or unused shared-template imports for an actual shared mount", () => {
  const issues = verifyAssistantWiring(() => `// <AssistantConversationPanel />\nimport {AssistantConversationPanel} from './AssistantConversationPanel';\nexport const Screen=()=> <form/>; // academic_assistant_access`);
  expect(issues.filter(issue => issue.code === "SHARED_TEMPLATE")).toHaveLength(10);
  expect(issues.filter(issue => issue.code === "ACCESS_ADAPTER")).toHaveLength(6);
});
