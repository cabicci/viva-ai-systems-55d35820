import { describe, expect, it } from "vitest";
import {
  LOCALE_COOKIE_NAME,
  parseLocaleCookieHeader,
} from "@/lib/locale/locale-cookie";
import { LOCALE_META } from "@/lib/locale/types";
import {
  buildLessonLocaleSearch,
  parseLessonPreviewSearch,
  resolveRouteLessonAccess,
} from "@/lib/locale-lessons/lesson-preview-search";

const LESSON_ID = "intro-m1-l1-what-is-ai";

describe("Phase 9.1 locale runtime parity", () => {
  it("parses masaarat_locale from cookie header", () => {
    expect(
      parseLocaleCookieHeader(`${LOCALE_COOKIE_NAME}=en; other=value`),
    ).toBe("en");
  });

  it("resolves en package from URL without previewLocale on SSR (no cookie)", () => {
    const search = parseLessonPreviewSearch({ locale: "en" });
    const access = resolveRouteLessonAccess(LESSON_ID, search, undefined);
    expect(access.effectiveLocale).toBe("en");
    expect(access.contentSource).toBe("locale-package-json");
  });

  it("falls back fr-FR URL to ar-EG without package locale nav param", () => {
    const search = parseLessonPreviewSearch({ locale: "fr-FR" });
    const access = resolveRouteLessonAccess(LESSON_ID, search, "en");
    expect(access.effectiveLocale).toBe("ar-EG");
    expect(access.contentSource).toBe("egyptian-ts");
    expect(buildLessonLocaleSearch(search, "en")).toBeUndefined();
  });

  it("URL locale overrides cookie for route access", () => {
    const search = parseLessonPreviewSearch({ locale: "ar-MSA" });
    const access = resolveRouteLessonAccess(LESSON_ID, search, "en");
    expect(access.effectiveLocale).toBe("ar-MSA");
  });

  it("uses cookie when URL locale missing", () => {
    const search = parseLessonPreviewSearch({});
    const access = resolveRouteLessonAccess(LESSON_ID, search, "ar-Gulf");
    expect(access.effectiveLocale).toBe("ar-Gulf");
  });

  it("maps effective locale to document lang/dir metadata", () => {
    expect(LOCALE_META.en).toEqual({ lang: "en", dir: "ltr", displayName: "English" });
    expect(LOCALE_META["ar-EG"].dir).toBe("rtl");
    expect(LOCALE_META["ar-MSA"].lang).toBe("ar");
  });
});
