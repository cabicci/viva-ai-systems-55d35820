import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveRouterEffectiveLocale } from "@/lib/locale/resolve-router-locale";
import { resolvePublicLocale } from "@/lib/locale/resolve-public-locale";
import { getUiString } from "@/lib/locale/ui-strings";
import {
  parseLessonPreviewSearch,
  resolveRouteLessonAccess,
} from "@/lib/locale-lessons/lesson-preview-search";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/locale/types";

const LESSON_ID = "intro-m1-l1-what-is-ai";
const LEARN_ROUTE_SOURCE = readFileSync(
  resolve(process.cwd(), "src/routes/learn.$pathId.$lessonId.tsx"),
  "utf8",
);

describe("Phase 12.1 shell localization hotfix", () => {
  describe("resolveRouterEffectiveLocale", () => {
    it("uses server URL locale when router search is absent on SSR", () => {
      expect(
        resolveRouterEffectiveLocale({
          serverUrlLocale: "en",
          serverCountryCode: "EG",
        }),
      ).toBe("en");
    });

    it("uses server cookie over geo for shell locale", () => {
      expect(
        resolveRouterEffectiveLocale({
          serverCookieLocale: "ar-EG",
          serverCountryCode: "US",
        }),
      ).toBe("ar-EG");
    });

    it("uses client cookie over geo when server cookie absent", () => {
      expect(
        resolveRouterEffectiveLocale({
          cookieLocale: "en",
          serverCountryCode: "EG",
        }),
      ).toBe("en");
    });

    it("URL beats cookie and geo on /learn/* shell", () => {
      expect(
        resolveRouterEffectiveLocale({
          urlLocale: "ar-Gulf",
          cookieLocale: "en",
          serverCountryCode: "US",
        }),
      ).toBe("ar-Gulf");
    });

    it("falls back to geo only when URL and cookie are absent", () => {
      expect(
        resolveRouterEffectiveLocale({
          serverCountryCode: "US",
        }),
      ).toBe("en");
    });
  });

  describe("landing hero/body copy across locales", () => {
    const heroKeys = [
      "hero.headline1",
      "hero.headline2",
      "hero.headlineSuffix",
      "hero.subtitle",
      "ecosystem.title1",
      "journey.titleHighlight",
      "philosophy.titleHighlight",
    ] as const;

    it("serves non-empty hero and section strings for all four locales", () => {
      for (const locale of SUPPORTED_LOCALES) {
        for (const key of heroKeys) {
          const value = getUiString(locale, key);
          expect(value.length, `${locale} ${key}`).toBeGreaterThan(0);
        }
      }
    });

    it("English hero is not Egyptian Arabic", () => {
      expect(getUiString("en", "hero.headline1")).toBe("Learn artificial intelligence");
      expect(getUiString("en", "hero.headline1")).not.toBe(
        getUiString("ar-EG", "hero.headline1"),
      );
    });

    it("MSA and Gulf hero suffix differ from Egyptian where defined", () => {
      expect(getUiString("ar-MSA", "hero.headlineSuffix")).not.toBe(
        getUiString("ar-EG", "hero.headlineSuffix"),
      );
      expect(getUiString("ar-Gulf", "hero.headlineSuffix")).not.toBe(
        getUiString("ar-EG", "hero.headlineSuffix"),
      );
    });

    it("resolves landing shell locale from ?locale=en even with EG geo", () => {
      const locale: SupportedLocale = resolveRouterEffectiveLocale({
        serverUrlLocale: "en",
        serverCountryCode: "EG",
      });
      expect(getUiString(locale, "hero.headline1")).toBe("Learn artificial intelligence");
    });
  });

  describe("lesson debug label removal", () => {
    it("does not expose visible Localized lesson copy in learn route source", () => {
      expect(LEARN_ROUTE_SOURCE).not.toContain("Localized lesson:");
    });

    it("keeps data-locale-live-active marker for QA automation", () => {
      expect(LEARN_ROUTE_SOURCE).toContain("data-locale-live-active");
    });

    it("falls back to Egyptian lesson access when package load fails", async () => {
      const { resolveLessonAccess } = await import(
        "@/lib/locale-lessons/resolve-lesson-access"
      );
      const access = resolveLessonAccess("intro-m1-l1-what-is-ai");
      expect(access.contentSource).toBe("egyptian-ts");
      expect(access.effectiveLocale).toBe("ar-EG");
    });
  });

  describe("/learn/* cookie and geo precedence (lesson access)", () => {
    it("cookie masaarat_locale=ar-EG + geo US/NL still resolves ar-EG", () => {
      for (const country of ["US", "NL"] as const) {
        const access = resolveRouteLessonAccess(
          LESSON_ID,
          parseLessonPreviewSearch({}),
          "ar-EG",
          country,
        );
        expect(access.effectiveLocale).toBe("ar-EG");
        expect(
          resolvePublicLocale({ cookieLocale: "ar-EG", countryCode: country }).locale,
        ).toBe("ar-EG");
      }
    });

    it("cookie masaarat_locale=en + geo EG resolves en", () => {
      const access = resolveRouteLessonAccess(
        LESSON_ID,
        parseLessonPreviewSearch({}),
        "en",
        "EG",
      );
      expect(access.effectiveLocale).toBe("en");
      expect(
        resolvePublicLocale({ cookieLocale: "en", countryCode: "EG" }).locale,
      ).toBe("en");
    });

    it("URL ?locale=ar-Gulf + cookie en + geo US resolves ar-Gulf", () => {
      const search = parseLessonPreviewSearch({ locale: "ar-Gulf" });
      const access = resolveRouteLessonAccess(LESSON_ID, search, "en", "US");
      expect(access.effectiveLocale).toBe("ar-Gulf");
      expect(
        resolveRouterEffectiveLocale({
          urlLocale: "ar-Gulf",
          cookieLocale: "en",
          serverCountryCode: "US",
        }),
      ).toBe("ar-Gulf");
    });
  });

  describe("safety markers", () => {
    it("defines safety marker keys for non-ar-EG locales", () => {
      for (const locale of ["en", "ar-MSA", "ar-Gulf"] as const) {
        expect(getUiString(locale, "safety.video.title").length).toBeGreaterThan(0);
        expect(getUiString(locale, "safety.assistant.title").length).toBeGreaterThan(0);
        expect(getUiString(locale, "safety.mission.banner").length).toBeGreaterThan(0);
      }
    });

    it("keeps ar-EG assistant safety copy empty (live assistant)", () => {
      expect(getUiString("ar-EG", "safety.assistant.title")).toBe("");
      expect(getUiString("ar-EG", "safety.assistant.body")).toBe("");
    });
  });
});
