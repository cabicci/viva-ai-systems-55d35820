import type { LessonPackageLocale } from "./types";

type EagerUrlModule = string | { default: string };

function exactAssetKey(
  locale: LessonPackageLocale,
  lessonId: string,
  ext: "jpg" | "svg",
): string {
  return `src/assets/lessons/${locale}/${lessonId}.${ext}`;
}

/**
 * Bundler-compatible discovery — constrained to exact locale folders only.
 * Canonical `src/assets/lessons/*.jpg` and `.../diagrams/*` are intentionally
 * outside this glob and can never satisfy a localized lookup.
 */
const LOCALIZED_JPG_MODULES = {
  ...import.meta.glob("../../assets/lessons/ar-MSA/*.jpg", {
    eager: true,
    query: "?url",
    import: "default",
  }),
  ...import.meta.glob("../../assets/lessons/ar-Gulf/*.jpg", {
    eager: true,
    query: "?url",
    import: "default",
  }),
  ...import.meta.glob("../../assets/lessons/en/*.jpg", {
    eager: true,
    query: "?url",
    import: "default",
  }),
} as Record<string, EagerUrlModule>;

const LOCALIZED_SVG_MODULES = {
  ...import.meta.glob("../../assets/lessons/ar-MSA/*.svg", {
    eager: true,
    query: "?url",
    import: "default",
  }),
  ...import.meta.glob("../../assets/lessons/ar-Gulf/*.svg", {
    eager: true,
    query: "?url",
    import: "default",
  }),
  ...import.meta.glob("../../assets/lessons/en/*.svg", {
    eager: true,
    query: "?url",
    import: "default",
  }),
} as Record<string, EagerUrlModule>;

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

function toCanonicalAssetKey(globKey: string): string | null {
  const normalized = globKey.replace(/\\/g, "/");
  const match = normalized.match(
    /(?:^|\/)assets\/lessons\/(ar-MSA|ar-Gulf|en)\/([^/]+)\.(jpg|svg)$/,
  );
  if (!match) return null;
  return `src/assets/lessons/${match[1]}/${match[2]}.${match[3]}`;
}

function indexEagerModules(
  modules: Record<string, EagerUrlModule>,
): ReadonlyMap<string, string> {
  const map = new Map<string, string>();
  for (const [globKey, mod] of Object.entries(modules)) {
    const assetKey = toCanonicalAssetKey(globKey);
    const url = unwrapUrl(mod);
    if (!assetKey || !url) continue;
    map.set(assetKey, url);
  }
  return map;
}

const DISCOVERED_JPG = indexEagerModules(LOCALIZED_JPG_MODULES);
const DISCOVERED_SVG = indexEagerModules(LOCALIZED_SVG_MODULES);

/** Test-injected exact path → URL map (keys must be `src/assets/lessons/...`). */
let testAssetUrlByPath: ReadonlyMap<string, string> | null = null;

export function setStrictLocalizedAssetMapForTests(
  map: Record<string, string> | null,
): void {
  testAssetUrlByPath = map ? new Map(Object.entries(map)) : null;
}

function lookupExact(
  assetKey: string,
  discovered: ReadonlyMap<string, string>,
): string | undefined {
  const fromTest = testAssetUrlByPath?.get(assetKey);
  if (fromTest != null && fromTest !== "") return fromTest;
  return discovered.get(assetKey);
}

/**
 * Exact locale + lessonId JPG only. No ar-EG, cross-locale, or canonical fallback.
 */
export function resolveStrictLocalizedScreenshotSrc(
  locale: LessonPackageLocale,
  lessonId: string,
): string | undefined {
  if (!lessonId.trim()) return undefined;
  return lookupExact(exactAssetKey(locale, lessonId, "jpg"), DISCOVERED_JPG);
}

/**
 * Exact locale + lessonId SVG only. Image asset — never LESSON_DIAGRAMS.
 */
export function resolveStrictLocalizedDiagramSrc(
  locale: LessonPackageLocale,
  lessonId: string,
): string | undefined {
  if (!lessonId.trim()) return undefined;
  return lookupExact(exactAssetKey(locale, lessonId, "svg"), DISCOVERED_SVG);
}
