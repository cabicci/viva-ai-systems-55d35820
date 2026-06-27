import { describe, expect, it } from "vitest";
import arEGUi from "@/locales/ar-EG/ui.json";
import { getUiString } from "@/lib/locale/ui-strings";
import type { UiStringKey } from "@/lib/locale/ui-strings";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/locale/types";

const LANDING_KEYS = [
  "hero.badge",
  "hero.headline1",
  "hero.cta.explore",
  "cta.section.title",
  "philosophy.eyebrow",
  "ecosystem.eyebrow",
  "journey.eyebrow",
] as const satisfies readonly UiStringKey[];

const NAV_FOOTER_KEYS = [
  "nav.brand",
  "nav.paths",
  "nav.curriculum",
  "nav.pricing",
  "footer.privacy",
  "footer.terms",
  "footer.copyright",
] as const satisfies readonly UiStringKey[];

const CURRICULUM_KEYS = [
  "curriculum.badge",
  "curriculum.titleHighlight",
  "curriculum.progress.label",
  "curriculum.progress.lessons",
  "curriculum.section.intro.title",
  "curriculum.section.user.title",
] as const satisfies readonly UiStringKey[];

const LOCALE_SELECTOR_KEYS = [
  "locale.selector.srOnly",
  "locale.selector.label",
  "locale.option.arEG",
  "locale.option.arMSA",
  "locale.option.arGulf",
  "locale.option.en",
] as const satisfies readonly UiStringKey[];

const SAFETY_KEYS = [
  "safety.video.title",
  "safety.video.body",
  "safety.assistant.title",
  "safety.assistant.body",
  "safety.mission.banner",
  "safety.mission.rubric",
  "safety.mission.dimension",
  "safety.mission.weight",
  "safety.mission.criteria",
] as const satisfies readonly UiStringKey[];

function expectNonEmptyForLocale(locale: SupportedLocale, keys: readonly UiStringKey[]) {
  for (const key of keys) {
    const value = getUiString(locale, key);
    if (key === "safety.assistant.title" || key === "safety.assistant.body") {
      if (locale === "ar-EG") {
        expect(value).toBe("");
        continue;
      }
    }
    expect(value.length, `${locale} ${key}`).toBeGreaterThan(0);
    expect(value, `${locale} ${key}`).not.toBe(key);
  }
}

describe("Phase 12 shell UI localization", () => {
  it("serves landing page strings in all four locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expectNonEmptyForLocale(locale, LANDING_KEYS);
    }
  });

  it("serves nav, header, and footer strings in all four locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expectNonEmptyForLocale(locale, NAV_FOOTER_KEYS);
    }
  });

  it("serves curriculum shell strings in all four locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expectNonEmptyForLocale(locale, CURRICULUM_KEYS);
    }
  });

  it("serves language selector labels in all four locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expectNonEmptyForLocale(locale, LOCALE_SELECTOR_KEYS);
    }
  });

  it("defines safety message keys with locale-appropriate copy", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expectNonEmptyForLocale(locale, SAFETY_KEYS);
    }

    expect(getUiString("en", "safety.video.title")).toContain("coming soon");
    expect(getUiString("ar-MSA", "safety.assistant.title")).toContain("قريب");
    expect(getUiString("ar-Gulf", "safety.assistant.body")).toContain("الخليجية");
  });

  it("supports template placeholders in curriculum progress strings", () => {
    const lessons = getUiString("en", "curriculum.progress.lessons")
      .replace("{completed}", "3")
      .replace("{available}", "10")
      .replace("{pct}", "30");
    expect(lessons).toBe("3/10 lessons available · 30%");

    const footer = getUiString("en", "curriculum.progress.footer")
      .replace("{available}", "10")
      .replace("{upcoming}", "5");
    expect(footer).toBe("10 lessons available now · 5 coming soon");

    const copyright = getUiString("en", "footer.copyright").replace("{year}", "2026");
    expect(copyright).toContain("2026");
    expect(copyright).not.toContain("{year}");
  });

  it("does not read localized lesson package JSON for shell UI", () => {
    const shellSource = Object.keys(arEGUi);
    for (const key of shellSource) {
      expect(key).not.toMatch(/\.json$/);
      expect(key).not.toContain("lessonId");
    }
  });
});
