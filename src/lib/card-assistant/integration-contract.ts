import type { CardMembershipJson } from "../rag/card-membership";
import type { PackageManifestEntry } from "../rag/types";
import type { RegisteredCard } from "./registry";

export const INTEGRATION_LOCALES = ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const;
export type IntegrationPath = { id: string; status: string; modules: { id: string; lessons: { id: string; state: string; route?: string }[] }[] };
export type IntegrationIssue = { code: string; location: string; message: string };
export type CoverageRecord = { area: "kids" | "technical" | "academic"; cardId: string; stepId: string; locale: string;
  approved: boolean; sourceSha256: string; verifiedSha256: string; chunks: number };
export type AcademicRegistration = { id: string; titles: Record<string, string>; steps: string[] };

/** Validate identities and coverage, not teaching quality or live account entitlements. */
export function verifyCardIntegration(input: {
  paths: IntegrationPath[]; cards: RegisteredCard[]; packages: PackageManifestEntry[];
  membership: CardMembershipJson; academic?: AcademicRegistration[]; coverage?: CoverageRecord[];
}): IntegrationIssue[] {
  const issues: IntegrationIssue[] = [];
  const fail = (code: string, location: string, message: string) => issues.push({ code, location, message });
  const expectedAI = new Map<string, { card: string; station: string; route: string }>();
  const cards = new Set<string>(), stations = new Set<string>(), sources = new Set<string>();
  const protectedSteps = new Set<string>();
  const registerCard = (area: string, id: string) => {
    const key = `${area}:${id}`;
    if (!id || cards.has(key)) fail("DUPLICATE_CARD", key, "Use one unique card ID within its area.");
    cards.add(key);
  };
  for (const card of input.paths) {
    registerCard("ai", card.id);
    let available = 0;
    for (const station of card.modules) {
      const key = `ai:${card.id}:${station.id}`;
      if (!station.id || stations.has(key)) fail("DUPLICATE_STATION", key, "Register each station once within its card.");
      stations.add(key);
      for (const step of station.lessons) {
        if (step.state !== "available") continue;
        available++;
        if (expectedAI.has(step.id)) fail("DUPLICATE_STEP", key + ":" + step.id, "A live AI step must have exactly one card and station owner.");
        const route = `/learn/${card.id}/${step.id}`;
        if (step.route !== route) fail("STEP_ROUTE", key + ":" + step.id, `Expected the generic shared lesson route ${route}.`);
        expectedAI.set(step.id, { card: card.id, station: station.id, route });
      }
    }
    if (card.status === "open" && !available) fail("EMPTY_CARD", `ai:${card.id}`, "An open card needs approved available steps.");
  }
  const packages = new Map<string, PackageManifestEntry>();
  for (const pkg of input.packages) {
    const key = `${pkg.locale}|${pkg.lessonId}`;
    if (packages.has(key)) fail("DUPLICATE_SOURCE", pkg.packagePath, `One approved package is required for ${key}.`);
    packages.set(key, pkg);
    const expected = expectedAI.get(pkg.lessonId);
    if (!expected || pkg.trackId !== expected.card) fail("ORPHAN_SOURCE", pkg.packagePath, "Approved source must belong to a live step of this exact card.");
    if (!INTEGRATION_LOCALES.includes(pkg.locale)) fail("SOURCE_LOCALE", pkg.packagePath, "Use one of the four supported locales.");
    if (!Number.isInteger(pkg.chunkCount) || pkg.chunkCount < 1) fail("EMPTY_SOURCE", pkg.packagePath, "Generate at least one approved learner-visible chunk.");
    if (!/^[a-f0-9]{64}$/.test(pkg.packageChecksum)) fail("SOURCE_HASH", pkg.packagePath, "Regenerate the package manifest with its current canonical SHA-256.");
    const expectedPath = `src/lib/locale-lessons/${pkg.locale}/lessons/${pkg.lessonId}.json`;
    if (pkg.packagePath !== expectedPath || pkg.productionRoute !== expected?.route)
      fail("SOURCE_ROUTE", pkg.packagePath, `Expected ${expectedPath} and ${expected?.route ?? "a registered card route"}.`);
    const member = input.membership.records[key];
    if (!member || member.lessonId !== pkg.lessonId || member.locale !== pkg.locale || member.trackId !== pkg.trackId ||
      member.moduleId !== pkg.moduleId || member.packagePath !== pkg.packagePath || member.packageChecksum !== pkg.packageChecksum ||
      member.productionRoute !== pkg.productionRoute || !Array.isArray(member.contextModuleIds) ||
      !member.contextModuleIds.includes(expected?.station ?? ""))
      fail("RUNTIME_MEMBERSHIP", key, "Regenerate card-membership.json from the approved manifests; preserve the exact card and observed station aliases.");
  }
  for (const [id, expected] of expectedAI) for (const locale of INTEGRATION_LOCALES) {
    if (!packages.has(`${locale}|${id}`)) fail("MISSING_LOCALE_SOURCE", `ai:${expected.card}:${id}:${locale}`, "Add the approved package and regenerate manifests before publishing this step.");
  }
  for (const key of Object.keys(input.membership.records)) {
    if (!packages.has(key)) fail("STALE_MEMBERSHIP", key, "Remove stale runtime membership by regenerating from current approved manifests.");
  }
  for (const card of input.cards) {
    registerCard(card.area, card.id);
    if (!["kids", "technical"].includes(card.area)) fail("ACCESS_ADAPTER", card.id, "Only the registered Kids or Technical source/access adapter can serve this card.");
    if (!card.steps.length) fail("EMPTY_CARD", `${card.area}:${card.id}`, "Register at least one step.");
    const seen = new Set<string>();
    for (const step of card.steps) {
      const key = `${card.area}:${card.id}:${step.id}`;
      if (!step.id || !step.stationId || seen.has(step.id)) fail("DUPLICATE_STEP", key, "Each step needs one nonempty ID and station within its card.");
      seen.add(step.id); protectedSteps.add(key);
      if (step.source.adapter !== card.area) fail("ACCESS_ADAPTER", key, "Source and authorization adapter must match the card area.");
      const source = step.source.adapter === "kids" ? `kids:${step.source.levelId}:${step.source.lessonNumber}` : `technical:${step.source.lessonId}`;
      if (sources.has(source)) fail("CROSS_CARD_SOURCE", key, `Protected source ${source} already belongs to another step; allocate a distinct source identity.`);
      sources.add(source);
    }
    if (!card.steps.some(step => !step.preview)) fail("PAID_SCOPE", `${card.area}:${card.id}`, "Define at least one protected step; free previews cannot authorize whole-card retrieval.");
  }
  for (const card of input.academic ?? []) {
    registerCard("academic", card.id);
    if (!/^AC-[A-Z0-9]+$/.test(card.id)) fail("ACADEMIC_ID", card.id, "Use the canonical AC-* course registration.");
    for (const locale of INTEGRATION_LOCALES) if (!card.titles[locale]?.trim()) fail("CARD_LOCALE", card.id, `Register the ${locale} title.`);
    const seen = new Set<string>();
    if (!card.steps.length) fail("EMPTY_CARD", card.id, "Register approved academic steps before publishing.");
    for (const id of card.steps) {
      if (!id.startsWith(`${card.id}-`) || !/^AC-[A-Z0-9]+-M\d{2}-L\d{2}$/.test(id) || seen.has(id))
        fail("ACADEMIC_STEP", `${card.id}:${id}`, "Step IDs must belong uniquely to this card and encode their station.");
      seen.add(id); protectedSteps.add(`academic:${card.id}:${id}`);
    }
  }
  if (input.coverage !== undefined) {
    const seen = new Set<string>();
    for (const source of input.coverage) {
      const owner = `${source.area}:${source.cardId}:${source.stepId}`, key = `${owner}:${source.locale}`;
      if (!protectedSteps.has(owner)) fail("ORPHAN_SOURCE", key, "Protected source is not owned by a registered card/step.");
      if (seen.has(key)) fail("DUPLICATE_SOURCE", key, "Export exactly one current approved source per step and locale.");
      seen.add(key);
      if (!source.approved || !/^[a-f0-9]{64}$/.test(source.sourceSha256) || source.sourceSha256 !== source.verifiedSha256 || !Number.isInteger(source.chunks) || source.chunks < 1)
        fail("UNAPPROVED_SOURCE", key, "Approve the current source hash and provide nonempty learner-visible content before publication.");
      if (!(INTEGRATION_LOCALES as readonly string[]).includes(source.locale)) fail("SOURCE_LOCALE", key, "Use one of the four supported locales.");
    }
    for (const step of protectedSteps) for (const locale of INTEGRATION_LOCALES)
      if (!seen.has(`${step}:${locale}`)) fail("MISSING_LOCALE_SOURCE", `${step}:${locale}`, "Import and approve the source in this locale before publishing the card.");
  }
  return issues;
}
