import { describe, expect, it, vi, afterEach } from "vitest";
import { writeLocaleCookie, readLocaleCookie, LOCALE_COOKIE_NAME } from "@/lib/locale/locale-cookie";
import { resolvePublicLocale } from "@/lib/locale/resolve-public-locale";
import { DEFAULT_LOCALE } from "@/lib/locale/types";
import {
  parseLessonPreviewSearch,
  resolveRouteLessonAccess,
} from "@/lib/locale-lessons/lesson-preview-search";

const LESSON_ID = "intro-m1-l1-what-is-ai";

describe("resolvePublicLocale (Phase 9)", () => {
  it("prefers URL locale over cookie", () => {
    expect(
      resolvePublicLocale({ urlLocale: "en", cookieLocale: "ar-Gulf" }),
    ).toEqual({ locale: "en", source: "url" });
  });

  it("uses cookie when URL locale is absent", () => {
    expect(resolvePublicLocale({ cookieLocale: "ar-MSA" })).toEqual({
      locale: "ar-MSA",
      source: "cookie",
    });
  });

  it("falls back to ar-EG", () => {
    expect(resolvePublicLocale({})).toEqual({
      locale: DEFAULT_LOCALE,
      source: "default",
    });
  });

  it("falls back unsupported URL locale to ar-EG", () => {
    expect(resolvePublicLocale({ urlLocale: "fr-FR" })).toEqual({
      locale: DEFAULT_LOCALE,
      source: "url",
    });
  });
});

describe("locale cookie (Phase 9)", () => {
  afterEach(() => {
    document.cookie = `${LOCALE_COOKIE_NAME}=; path=/; max-age=0`;
  });

  it("writes and reads masaarat_locale", () => {
    writeLocaleCookie("en");
    expect(readLocaleCookie()).toBe("en");
  });
});

describe("lesson route live locale (Phase 9)", () => {
  it("defaults route access to ar-EG with no search params or cookie", () => {
    const search = parseLessonPreviewSearch({});
    const access = resolveRouteLessonAccess(LESSON_ID, search);
    expect(access.effectiveLocale).toBe("ar-EG");
    expect(access.contentSource).toBe("egyptian-ts");
  });

  it("loads en package with ?locale=en without previewLocale", () => {
    const search = parseLessonPreviewSearch({ locale: "en" });
    const access = resolveRouteLessonAccess(LESSON_ID, search);
    expect(access.effectiveLocale).toBe("en");
    expect(access.contentSource).toBe("locale-package-json");
  });

  it("loads ar-MSA package with ?locale=ar-MSA", () => {
    const search = parseLessonPreviewSearch({ locale: "ar-MSA" });
    const access = resolveRouteLessonAccess(LESSON_ID, search);
    expect(access.effectiveLocale).toBe("ar-MSA");
    expect(access.contentSource).toBe("locale-package-json");
  });

  it("loads ar-Gulf package with ?locale=ar-Gulf", () => {
    const search = parseLessonPreviewSearch({ locale: "ar-Gulf" });
    const access = resolveRouteLessonAccess(LESSON_ID, search);
    expect(access.effectiveLocale).toBe("ar-Gulf");
    expect(access.contentSource).toBe("locale-package-json");
  });

  it("uses cookie locale when URL locale is absent", () => {
    const search = parseLessonPreviewSearch({});
    const access = resolveRouteLessonAccess(LESSON_ID, search, "en");
    expect(access.effectiveLocale).toBe("en");
    expect(access.contentSource).toBe("locale-package-json");
  });

  it("URL locale overrides cookie locale", () => {
    const search = parseLessonPreviewSearch({ locale: "ar-MSA" });
    const access = resolveRouteLessonAccess(LESSON_ID, search, "en");
    expect(access.effectiveLocale).toBe("ar-MSA");
    expect(access.contentSource).toBe("locale-package-json");
  });

  it("falls back to ar-EG for unsupported locale", () => {
    const search = parseLessonPreviewSearch({ locale: "fr-FR" });
    const access = resolveRouteLessonAccess(LESSON_ID, search);
    expect(access.effectiveLocale).toBe("ar-EG");
    expect(access.contentSource).toBe("egyptian-ts");
  });

  it("keeps previewLocale=1 backward compatibility", () => {
    const search = parseLessonPreviewSearch({
      locale: "en",
      previewLocale: "1",
    });
    const access = resolveRouteLessonAccess(LESSON_ID, search);
    expect(access.effectiveLocale).toBe("en");
    expect(access.contentSource).toBe("locale-package-json");
  });
});

describe("lesson route live locale rollback flag", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("falls back to ar-EG for ?locale=en when localizedLessonsEnabled=false", async () => {
    vi.stubEnv("VITE_LOCALIZED_LESSONS_ENABLED", "false");
    vi.resetModules();

    const { resolveRouteLessonAccess: resolveWithFlagOff } = await import(
      "@/lib/locale-lessons/lesson-preview-search"
    );
    const search = parseLessonPreviewSearch({ locale: "en" });
    const access = resolveWithFlagOff(LESSON_ID, search);
    expect(access.effectiveLocale).toBe("ar-EG");
    expect(access.contentSource).toBe("egyptian-ts");
  });

  it("still allows previewLocale=1 when localizedLessonsEnabled=false", async () => {
    vi.stubEnv("VITE_LOCALIZED_LESSONS_ENABLED", "false");
    vi.resetModules();

    const { resolveRouteLessonAccess: resolveWithFlagOff } = await import(
      "@/lib/locale-lessons/lesson-preview-search"
    );
    const search = parseLessonPreviewSearch({
      locale: "en",
      previewLocale: "1",
    });
    const access = resolveWithFlagOff(LESSON_ID, search);
    expect(access.effectiveLocale).toBe("en");
    expect(access.contentSource).toBe("locale-package-json");
  });
});
