import { canonicalJson, sha256 } from "@/lib/card-assistant/corpus";
import type { RegisteredCard } from "@/lib/card-assistant/registry";
export type AutomaticScope = { stepId: string; locale: string; sourceSha: string | null };
export type AutomaticManifest = {
  schemaVersion: "assistant-auto-v1"; build: string; area: "ai" | "kids" | "technical" | "academic";
  cardId: string; scopes: AutomaticScope[]; scopeCount: number; issue: string | null; releaseId?: string;
  sourceRevision?: string;
};
export type AutomaticPlan = { key: string; material: string; manifest: AutomaticManifest };
export type SourceMetadata = {
  kids: { level_id: string; lesson_number: number; locale: string; approved_sha256: string }[];
  technical: { lesson_id: string; locale: string; source_sha256: string }[];
  academicCourses: { id: string; enabled: boolean; assistant_enabled: boolean; assistant_review_enabled: boolean }[];
  academic: { course_id: string; lesson_id: string; locale: string; approved: boolean; source_sha256: string }[];
};
const locales = ["ar-EG", "ar-MSA", "ar-Gulf", "en"];
const hash = /^[a-f0-9]{64}$/;
/** Metadata only; no lesson body or learner identity enters the queue manifest. */
export async function automaticPlans(build: string, ai: { releaseId: string; chunks: number }, cards: RegisteredCard[], source: SourceMetadata,
  sourceRevisions: Record<string, string> = {}): Promise<AutomaticPlan[]> {
  if (!hash.test(build) || !hash.test(ai.releaseId) || !Number.isSafeInteger(ai.chunks) || ai.chunks < 1)
    throw new Error("AUTOMATION_BUILD_UNAVAILABLE");
  const manifests: AutomaticManifest[] = [{ schemaVersion: "assistant-auto-v1", build, area: "ai", cardId: "current",
    releaseId: ai.releaseId, scopes: [], scopeCount: Math.ceil(ai.chunks / 64) + 2, issue: null }];
  for (const card of cards) {
    const scopes = card.steps.flatMap(step => locales.map(locale => {
      const locator = step.source;
      const matches = locator.adapter === "kids"
        ? source.kids.filter(row => row.level_id === locator.levelId && row.lesson_number === locator.lessonNumber && row.locale === locale)
          .map(row => row.approved_sha256)
        : source.technical.filter(row => row.lesson_id === locator.lessonId && row.locale === locale).map(row => row.source_sha256);
      return { stepId: step.id, locale, sourceSha: matches.length === 1 && hash.test(matches[0]) ? matches[0] : null };
    }));
    manifests.push({ schemaVersion: "assistant-auto-v1", build, area: card.area, cardId: card.id, scopes,
      scopeCount: scopes.length + 1, issue: scopes.some(scope => !scope.sourceSha) ? "AUTOMATION_SOURCE_UNAPPROVED" : null });
  }
  for (const course of source.academicCourses.filter(row => row.assistant_review_enabled || (row.enabled && row.assistant_enabled))) {
    const rows = source.academic.filter(row => row.course_id === course.id).sort((a, b) =>
      a.locale < b.locale ? -1 : a.locale > b.locale ? 1 : a.lesson_id < b.lesson_id ? -1 : a.lesson_id > b.lesson_id ? 1 : 0);
    const scopes = rows.map(row => ({ stepId: row.lesson_id, locale: row.locale,
      sourceSha: row.approved && hash.test(row.source_sha256) ? row.source_sha256 : null }));
    const ids = [...new Set(rows.map(row => row.lesson_id))];
    const complete = ids.length > 0 && rows.length === ids.length * locales.length &&
      ids.every(id => locales.every(locale => rows.filter(row => row.lesson_id === id && row.locale === locale).length === 1));
    manifests.push({ schemaVersion: "assistant-auto-v1", build, area: "academic", cardId: course.id, scopes,
      scopeCount: scopes.length + 1, issue: !complete || scopes.some(scope => !scope.sourceSha) ? "AUTOMATION_SOURCE_UNAPPROVED" : null });
  }
  if (manifests.length > 200 || manifests.some(item => item.scopeCount < 1 || item.scopeCount > 20001)) throw new Error("AUTOMATION_SCOPE_LIMIT");
  const result: AutomaticPlan[] = [];
  for (const manifest of manifests) {
    const revision = sourceRevisions[`${manifest.area}:${manifest.cardId}`];
    if (revision !== undefined) {
      if (!/^[0-9]{1,20}$/.test(revision)) throw new Error("AUTOMATION_SOURCE_REVISION_INVALID");
      manifest.sourceRevision = revision;
    }
    const material = canonicalJson(manifest);
    if (new TextEncoder().encode(material).length > 3000000) throw new Error("AUTOMATION_SCOPE_LIMIT");
    result.push({ key: await sha256(material), material, manifest });
  }
  return result;
}
