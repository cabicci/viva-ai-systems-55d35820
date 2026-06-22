import { describe, expect, it } from "vitest";
import { localizedLessonsEnabled } from "@/lib/locale/feature-flags";
import {
  isLessonLocalePreviewActive,
  parseLessonPreviewSearch,
  resolveRouteLessonAccess,
} from "@/lib/locale-lessons/lesson-preview-search";

const LESSON_ID = "intro-m1-l1-what-is-ai";

describe("lesson route locale preview (Phase 4)", () => {
  it("keeps localizedLessonsEnabled off", () => {
    expect(localizedLessonsEnabled).toBe(false);
  });

  it("defaults route access to ar-EG with no search params", () => {
    const search = parseLessonPreviewSearch({});
    expect(isLessonLocalePreviewActive(search)).toBe(false);

    const access = resolveRouteLessonAccess(LESSON_ID, search);
    expect(access.effectiveLocale).toBe("ar-EG");
    expect(access.contentSource).toBe("egyptian-ts");
    expect(access.fallbackUsed).toBe(false);
  });

  it("keeps ar-EG when locale is set without preview flag", () => {
    const search = parseLessonPreviewSearch({ locale: "en" });
    expect(isLessonLocalePreviewActive(search)).toBe(false);

    const access = resolveRouteLessonAccess(LESSON_ID, search);
    expect(access.effectiveLocale).toBe("ar-EG");
    expect(access.contentSource).toBe("egyptian-ts");
  });

  it("resolves en package with previewLocale=1", () => {
    const search = parseLessonPreviewSearch({
      locale: "en",
      previewLocale: "1",
    });
    expect(isLessonLocalePreviewActive(search)).toBe(true);

    const access = resolveRouteLessonAccess(LESSON_ID, search);
    expect(access.effectiveLocale).toBe("en");
    expect(access.contentSource).toBe("locale-package-json");
    expect(access.fallbackUsed).toBe(false);
  });

  it("resolves ar-Gulf package with previewLocale=1", () => {
    const search = parseLessonPreviewSearch({
      locale: "ar-Gulf",
      previewLocale: 1,
    });

    const access = resolveRouteLessonAccess(LESSON_ID, search);
    expect(access.effectiveLocale).toBe("ar-Gulf");
    expect(access.contentSource).toBe("locale-package-json");
  });

  it("resolves ar-MSA canonical package with previewLocale=1", () => {
    const search = parseLessonPreviewSearch({
      locale: "ar-MSA",
      previewLocale: true,
    });

    const access = resolveRouteLessonAccess(LESSON_ID, search);
    expect(access.effectiveLocale).toBe("ar-MSA");
    expect(access.contentSource).toBe("locale-package-json");
  });

  it("falls back to ar-EG for unsupported locale even with preview flag", () => {
    const search = parseLessonPreviewSearch({
      locale: "fr-FR",
      previewLocale: "1",
    });
    expect(isLessonLocalePreviewActive(search)).toBe(false);

    const access = resolveRouteLessonAccess(LESSON_ID, search);
    expect(access.effectiveLocale).toBe("ar-EG");
    expect(access.contentSource).toBe("egyptian-ts");
  });

  it("does not activate preview when flag is set without locale", () => {
    const search = parseLessonPreviewSearch({ previewLocale: "1" });
    expect(isLessonLocalePreviewActive(search)).toBe(false);

    const access = resolveRouteLessonAccess(LESSON_ID, search);
    expect(access.effectiveLocale).toBe("ar-EG");
    expect(access.contentSource).toBe("egyptian-ts");
  });
});
