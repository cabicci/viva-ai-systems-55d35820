/**
 * Browser-safe controlled-v1 visual resolver.
 * No node:path / node:fs / node:crypto / archives.
 */
import browserManifest from "./controlledV1BrowserManifest.json";

export type ControlledV1Locale = "ar-EG" | "ar-MSA" | "ar-Gulf" | "en";
export type ControlledV1Method = "A" | "C";

export type ControlledV1ManifestEntry = {
  cellId: string;
  lessonId: string;
  locale: string;
  method: ControlledV1Method;
  acceptedSha256: string;
  realFormat: string;
  assetKey: string;
};

export type ControlledV1ResolveOk = {
  ok: true;
  cellId: string;
  lessonId: string;
  locale: ControlledV1Locale;
  method: ControlledV1Method;
  acceptedSha256: string;
  realFormat: string;
  assetKey: string;
  url: string;
};

export type ControlledV1ResolveErr = {
  ok: false;
  reason:
    | "missing_lesson"
    | "missing_locale"
    | "unsupported_locale"
    | "duplicate_mapping"
    | "missing_emitted_asset"
    | "method_mismatch";
  lessonId: string;
  locale: string;
  cellId?: string;
};

export type ControlledV1ResolveResult = ControlledV1ResolveOk | ControlledV1ResolveErr;

const SUPPORTED = new Set<string>(["ar-EG", "ar-MSA", "ar-Gulf", "en"]);

type EagerUrlModule = string | { default: string };

/**
 * Build-time discovery of materialized controlled-v1 assets.
 * Materializer must run before Vite/dev/build so this glob resolves 400 URLs.
 */
const CONTROLLED_V1_MODULES = import.meta.glob(
  "../../../../assets/lesson-visuals/controlled-v1/*/*.{png,jpg,jpeg,webp,svg}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
) as Record<string, EagerUrlModule>;

function unwrapUrl(mod: EagerUrlModule | undefined): string | undefined {
  if (mod == null) return undefined;
  if (typeof mod === "string" && mod.trim() !== "") return mod;
  if (
    typeof mod === "object" &&
    typeof mod.default === "string" &&
    mod.default.trim() !== ""
  ) {
    return mod.default;
  }
  return undefined;
}

function toAssetKey(globKey: string): string | null {
  const normalized = globKey.replace(/\\/g, "/");
  const match = normalized.match(
    /(?:^|\/)assets\/lesson-visuals\/controlled-v1\/(ar-EG|ar-MSA|ar-Gulf|en)\/([^/]+)\.(png|jpg|jpeg|webp|svg)$/,
  );
  if (!match) return null;
  return `src/assets/lesson-visuals/controlled-v1/${match[1]}/${match[2]}.${match[3]}`;
}

function indexModules(
  modules: Record<string, EagerUrlModule>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const [globKey, mod] of Object.entries(modules)) {
    const key = toAssetKey(globKey);
    const url = unwrapUrl(mod);
    if (!key || !url) continue;
    if (map.has(key)) {
      // Duplicate glob identity — fail closed at resolve time via diagnostics.
      map.set(key, "");
      continue;
    }
    map.set(key, url);
  }
  return map;
}

const DISCOVERED = indexModules(CONTROLLED_V1_MODULES);

/** Test override for unit tests without Vite asset emission. */
let testUrlByAssetKey: ReadonlyMap<string, string> | null = null;

export function setControlledV1AssetUrlMapForTests(
  map: Record<string, string> | null,
): void {
  testUrlByAssetKey = map ? new Map(Object.entries(map)) : null;
}

export function getControlledV1DiscoveredAssetCount(): number {
  if (testUrlByAssetKey) {
    return [...testUrlByAssetKey.values()].filter((u) => u !== "").length;
  }
  return [...DISCOVERED.values()].filter((u) => u !== "").length;
}

export function getControlledV1BrowserManifestEntries(): ControlledV1ManifestEntry[] {
  return browserManifest.entries as ControlledV1ManifestEntry[];
}

const entries = browserManifest.entries as ControlledV1ManifestEntry[];
const byLessonLocale = new Map<string, ControlledV1ManifestEntry>();
const duplicateKeys = new Set<string>();

for (const e of entries) {
  const k = `${e.lessonId}::${e.locale}`;
  if (byLessonLocale.has(k)) {
    duplicateKeys.add(k);
  } else {
    byLessonLocale.set(k, e);
  }
}

function lookupUrl(assetKey: string): string | undefined {
  if (testUrlByAssetKey) {
    const fromTest = testUrlByAssetKey.get(assetKey);
    if (fromTest == null || fromTest === "") return undefined;
    return fromTest;
  }
  const fromGlob = DISCOVERED.get(assetKey);
  if (fromGlob == null || fromGlob === "") return undefined;
  return fromGlob;
}

export function resolveControlledV1Visual(input: {
  lessonId: string;
  locale: string;
  expectedMethod?: ControlledV1Method;
}): ControlledV1ResolveResult {
  const lessonId = (input.lessonId ?? "").trim();
  const locale = (input.locale ?? "").trim();

  if (!SUPPORTED.has(locale)) {
    return {
      ok: false,
      reason: "unsupported_locale",
      lessonId,
      locale,
    };
  }
  if (!lessonId) {
    return { ok: false, reason: "missing_lesson", lessonId, locale };
  }

  const key = `${lessonId}::${locale}`;
  if (duplicateKeys.has(key)) {
    return {
      ok: false,
      reason: "duplicate_mapping",
      lessonId,
      locale,
    };
  }

  const entry = byLessonLocale.get(key);
  if (!entry) {
    const lessonKnown = entries.some((e) => e.lessonId === lessonId);
    return {
      ok: false,
      reason: lessonKnown ? "missing_locale" : "missing_lesson",
      lessonId,
      locale,
    };
  }

  if (input.expectedMethod && entry.method !== input.expectedMethod) {
    return {
      ok: false,
      reason: "method_mismatch",
      lessonId,
      locale,
      cellId: entry.cellId,
    };
  }

  const url = lookupUrl(entry.assetKey);
  if (!url) {
    return {
      ok: false,
      reason: "missing_emitted_asset",
      lessonId,
      locale,
      cellId: entry.cellId,
    };
  }

  return {
    ok: true,
    cellId: entry.cellId,
    lessonId: entry.lessonId,
    locale: entry.locale as ControlledV1Locale,
    method: entry.method,
    acceptedSha256: entry.acceptedSha256,
    realFormat: entry.realFormat,
    assetKey: entry.assetKey,
    url,
  };
}

/** Diagnostics: prove manifest + glob integrity without Node APIs. */
export function auditControlledV1BrowserResolver(): {
  manifestEntries: number;
  uniqueLessonLocaleKeys: number;
  discoveredUrls: number;
  methodA: number;
  methodC: number;
  locales: Record<string, number>;
  missingAssets: number;
  duplicateMappings: number;
} {
  const locales: Record<string, number> = {
    "ar-EG": 0,
    "ar-MSA": 0,
    "ar-Gulf": 0,
    en: 0,
  };
  let methodA = 0;
  let methodC = 0;
  let missingAssets = 0;
  for (const e of entries) {
    if (e.method === "A") methodA++;
    else methodC++;
    locales[e.locale] = (locales[e.locale] ?? 0) + 1;
    if (!lookupUrl(e.assetKey)) missingAssets++;
  }
  return {
    manifestEntries: entries.length,
    uniqueLessonLocaleKeys: byLessonLocale.size,
    discoveredUrls: getControlledV1DiscoveredAssetCount(),
    methodA,
    methodC,
    locales,
    missingAssets,
    duplicateMappings: duplicateKeys.size,
  };
}
