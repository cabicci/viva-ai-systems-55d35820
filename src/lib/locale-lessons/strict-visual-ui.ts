import arGulfUi from "@/locales/ar-Gulf/ui.json";
import arMsaUi from "@/locales/ar-MSA/ui.json";
import enUi from "@/locales/en/ui.json";
import type { LessonPackageLocale } from "./types";

type UiCatalog = Readonly<Record<string, string>>;

const STRICT_VISUAL_UI_CATALOGS: Record<LessonPackageLocale, UiCatalog> = {
  "ar-MSA": arMsaUi as UiCatalog,
  "ar-Gulf": arGulfUi as UiCatalog,
  en: enUi as UiCatalog,
};

/** Test-only catalog overlays — never used in production paths. */
let catalogOverrides: Partial<
  Record<LessonPackageLocale, UiCatalog | null>
> | null = null;

export function setStrictVisualUiCatalogOverrideForTests(
  locale: LessonPackageLocale,
  catalog: UiCatalog | null,
): void {
  if (!catalogOverrides) catalogOverrides = {};
  catalogOverrides[locale] = catalog;
}

export function clearStrictVisualUiCatalogOverridesForTests(): void {
  catalogOverrides = null;
}

function catalogFor(locale: LessonPackageLocale): UiCatalog {
  const override = catalogOverrides?.[locale];
  if (override) return override;
  return STRICT_VISUAL_UI_CATALOGS[locale];
}

/**
 * Exact-locale UI lookup for Block 2 / Block 7 chrome.
 * Never falls back to ar-EG or any other locale.
 * Missing / empty keys fail closed to `undefined`.
 */
export function getStrictVisualUiString(
  locale: LessonPackageLocale,
  key: string,
): string | undefined {
  const value = catalogFor(locale)[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/** Fail-closed render text: exact locale value or empty (never ar-EG). */
export function strictVisualUiOrEmpty(
  locale: LessonPackageLocale,
  key: string,
): string {
  return getStrictVisualUiString(locale, key) ?? "";
}
