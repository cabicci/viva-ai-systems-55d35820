import type {
  AdaptedLessonPackage,
  LocalizedLessonPackage,
} from "../../../src/lib/locale-lessons/types.ts";
import { lookupGulfTopicTitle } from "./gulf-title-fallback-map.ts";

export const GENERIC_BAD_GULF_TITLE_PATTERNS: RegExp[] = [
  /^بداية\s+الدرس$/,
  /^مقدمة\s+الدرس$/,
  /^عنوان\s+الدرس$/,
  /^الدرس$/,
  /^هذا\s+الدرس$/,
  /^lesson\s+start$/i,
  /^introduction\s+to\s+the\s+lesson$/i,
  /^getting\s+started$/i,
  /^ماذا\s+ستفهم/,
  /^وش\s+راح\s+تفهم/,
  /^وين\s+يروح\s+وقتك/,
];

function normalizeTitle(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function orientationSectionSubtitle(source: LocalizedLessonPackage): string | null {
  const orientation = source.sections.find((section) => section.role === "Orientation");
  return orientation?.subtitle?.trim() ?? null;
}

function matchesOrientationSubtitle(
  title: string,
  source: LocalizedLessonPackage,
): boolean {
  const orientationSubtitle = orientationSectionSubtitle(source);
  if (!orientationSubtitle) return false;
  return normalizeTitle(title) === normalizeTitle(orientationSubtitle);
}

/** True when Gulf catalog title is empty, orientation-like, or a known generic placeholder. */
export function isGenericBadGulfTitle(
  title: string,
  source: LocalizedLessonPackage,
): boolean {
  const trimmed = title?.trim() ?? "";
  if (!trimmed) return true;
  if (matchesOrientationSubtitle(trimmed, source)) return true;
  return GENERIC_BAD_GULF_TITLE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function deriveGulfTopicTitle(
  source: LocalizedLessonPackage,
  adapted: AdaptedLessonPackage,
): string | null {
  const titleEn = source.titleEn?.trim() ?? adapted.titleEn?.trim();
  if (!titleEn) return null;
  return lookupGulfTopicTitle(titleEn);
}

/** Replace generic Gulf orientation titles with deterministic topic titles from titleEn. */
export function repairGulfCatalogTitle(
  source: LocalizedLessonPackage,
  adapted: AdaptedLessonPackage,
): AdaptedLessonPackage {
  if (adapted.locale !== "ar-Gulf") return adapted;

  const title = adapted.title?.trim() ?? "";
  if (!isGenericBadGulfTitle(title, source)) return adapted;

  const replacement = deriveGulfTopicTitle(source, adapted);
  if (!replacement || replacement.trim() === title) return adapted;

  return { ...adapted, title: replacement };
}
