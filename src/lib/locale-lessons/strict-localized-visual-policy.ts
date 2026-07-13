import type { SupportedLocale } from "@/lib/locale/types";
import { isPackageLocale } from "./registry";
import type { LessonPackageLocale } from "./types";

/**
 * Strict localized visual policy (Block 2 video + Block 7 screenshot/diagram):
 * package locales never inherit ar-EG media, chrome, or canonical LESSON_DIAGRAMS.
 * Missing localized media → locale-safe neutral placeholder only.
 */
export const STRICT_LOCALIZED_VISUAL_LOCALES = [
  "ar-MSA",
  "ar-Gulf",
  "en",
] as const satisfies readonly LessonPackageLocale[];

/** UI keys that exist in every package locale (no ar-EG string fallback needed). */
export const STRICT_VISUAL_UI_KEYS = {
  videoMissingTitle: "safety.video.title",
  videoMissingBody: "safety.video.body",
  screenshotTitle: "safety.screenshot.title",
  screenshotPlaceholder: "intro.block.screenshotPlaceholder",
  screenshotLabel: "intro.block.screenshotLabel",
  screenshotAlt: "intro.block.screenshotAlt",
  diagramTitle: "safety.diagram.title",
  diagramPlaceholder: "safety.diagram.placeholder",
  diagramLabel: "intro.block.diagramLabel",
  comingSoon: "intro.block.comingSoon",
} as const;

export function usesStrictLocalizedVisualPolicy(
  locale: SupportedLocale | undefined | null,
): locale is LessonPackageLocale {
  return locale != null && isPackageLocale(locale);
}

/**
 * Future-only relative asset convention for localized screenshots.
 * Do not resolve via absolute filesystem paths.
 */
export function localizedLessonScreenshotAssetPath(
  locale: LessonPackageLocale,
  lessonId: string,
): string {
  return `src/assets/lessons/${locale}/${lessonId}.jpg`;
}

/**
 * Future-only relative asset convention for localized diagrams.
 * Do not resolve via absolute filesystem paths.
 */
export function localizedLessonDiagramAssetPath(
  locale: LessonPackageLocale,
  lessonId: string,
): string {
  return `src/assets/lessons/${locale}/${lessonId}.svg`;
}

/**
 * Runtime screenshot src for package locales.
 * Assets are not shipped yet — never fall back to ar-EG media.
 */
export function resolveStrictLocalizedScreenshotSrc(
  _locale: LessonPackageLocale,
  _lessonId: string,
): string | undefined {
  return undefined;
}

/**
 * Runtime diagram asset for package locales.
 * Assets are not shipped yet — never fall back to canonical LESSON_DIAGRAMS.
 */
export function resolveStrictLocalizedDiagramSrc(
  _locale: LessonPackageLocale,
  _lessonId: string,
): string | undefined {
  return undefined;
}
