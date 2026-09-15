/** Browser-only resolver for verified contextual-v2 public assets. */
import browserManifest from "./contextualV2BrowserManifest.json";

export type ContextualV2Locale = "ar-EG" | "ar-MSA" | "ar-Gulf" | "en";

export type ContextualV2ManifestEntry = {
  cellId: string;
  lessonId: string;
  locale: ContextualV2Locale;
  pathId: string;
  moduleId: string;
  lessonOrder: number;
  title: string;
  publicPath: string;
  productionStatus: "verified";
  assetSha256: string;
  assetBytes: number;
  actualFormat: "png" | "webp";
  sourceType: "infographic" | "screenshot";
  width: 1900;
  height: 1000;
  sourceHead: string;
  sourcePath: string;
  sourceBlob: string;
  sourceSha256: string;
  rendererClass: "production" | "pilot-compositor";
  rendererSha256: string;
  receipt: string;
};

type ResolveErrorReason =
  | "manifest_unverified"
  | "unsupported_locale"
  | "missing_lesson"
  | "missing_locale"
  | "duplicate_mapping"
  | "unverified_asset";

export type ContextualV2ResolveResult =
  | ({ ok: true; url: string } & ContextualV2ManifestEntry)
  | {
      ok: false;
      reason: ResolveErrorReason;
      lessonId: string;
      locale: string;
      cellId?: string;
    };

const SUPPORTED = new Set<ContextualV2Locale>([
  "ar-EG",
  "ar-MSA",
  "ar-Gulf",
  "en",
]);
const manifestIsVerified =
  browserManifest.manifestVersion === "lesson-visuals-contextual-v2/runtime-v1" &&
  browserManifest.integrationStatus === "VERIFIED_400";
const entries = browserManifest.entries as ContextualV2ManifestEntry[];
const byLessonLocale = new Map<string, ContextualV2ManifestEntry>();
const duplicateKeys = new Set<string>();

for (const entry of entries) {
  const key = `${entry.lessonId}::${entry.locale}`;
  if (byLessonLocale.has(key)) duplicateKeys.add(key);
  else byLessonLocale.set(key, entry);
}

export function getContextualV2BrowserManifestEntries(): readonly ContextualV2ManifestEntry[] {
  return entries;
}

export function resolveContextualV2Visual(input: {
  lessonId: string;
  locale: string;
}): ContextualV2ResolveResult {
  const lessonId = (input.lessonId ?? "").trim();
  const locale = (input.locale ?? "").trim();
  if (!manifestIsVerified) {
    return { ok: false, reason: "manifest_unverified", lessonId, locale };
  }
  if (!SUPPORTED.has(locale as ContextualV2Locale)) {
    return { ok: false, reason: "unsupported_locale", lessonId, locale };
  }
  if (!lessonId) return { ok: false, reason: "missing_lesson", lessonId, locale };

  const key = `${lessonId}::${locale}`;
  if (duplicateKeys.has(key)) {
    return { ok: false, reason: "duplicate_mapping", lessonId, locale };
  }
  const entry = byLessonLocale.get(key);
  if (!entry) {
    const lessonKnown = entries.some((candidate) => candidate.lessonId === lessonId);
    return {
      ok: false,
      reason: lessonKnown ? "missing_locale" : "missing_lesson",
      lessonId,
      locale,
    };
  }
  const exactPath = `/lesson-visuals/contextual-v2/${entry.locale}/${entry.lessonId}.${entry.actualFormat}`;
  if (
    entry.productionStatus !== "verified" ||
    entry.publicPath !== exactPath ||
    !/^[a-f0-9]{64}$/.test(entry.assetSha256) ||
    entry.assetBytes <= 0
  ) {
    return {
      ok: false,
      reason: "unverified_asset",
      lessonId,
      locale,
      cellId: entry.cellId,
    };
  }
  return { ok: true, ...entry, url: entry.publicPath };
}

export function auditContextualV2BrowserResolver() {
  const localeCounts: Record<ContextualV2Locale, number> = {
    "ar-EG": 0,
    "ar-MSA": 0,
    "ar-Gulf": 0,
    en: 0,
  };
  for (const entry of entries) localeCounts[entry.locale] += 1;
  return {
    manifestIsVerified,
    entries: entries.length,
    lessons: new Set(entries.map((entry) => entry.lessonId)).size,
    uniqueLessonLocaleKeys: byLessonLocale.size,
    duplicateMappings: duplicateKeys.size,
    localeCounts,
    staticImageImports: 0,
  };
}
