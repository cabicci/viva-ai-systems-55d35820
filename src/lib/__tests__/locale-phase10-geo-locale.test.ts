import { describe, expect, it, vi, afterEach } from "vitest";
import {
  LOCALE_COOKIE_NAME,
  readLocaleCookie,
  writeLocaleCookie,
} from "@/lib/locale/locale-cookie";
import { persistValidLocaleCookie } from "@/lib/locale/locale-search";
import { readCountryCodeFromHeaders } from "@/lib/locale/read-request-country";
import {
  normalizeCountryCode,
  resolveGeoLocale,
} from "@/lib/locale/resolve-geo-locale";
import { resolvePublicLocale } from "@/lib/locale/resolve-public-locale";
import { DEFAULT_LOCALE } from "@/lib/locale/types";
import {
  parseLessonPreviewSearch,
  resolveRouteLessonAccess,
} from "@/lib/locale-lessons/lesson-preview-search";

const LESSON_ID = "intro-m1-l1-what-is-ai";

describe("normalizeCountryCode", () => {
  it("uppercases valid ISO codes", () => {
    expect(normalizeCountryCode("eg")).toBe("EG");
    expect(normalizeCountryCode(" sa ")).toBe("SA");
  });

  it("rejects invalid and unknown sentinel codes", () => {
    expect(normalizeCountryCode("")).toBeUndefined();
    expect(normalizeCountryCode("USA")).toBeUndefined();
    expect(normalizeCountryCode("XX")).toBeUndefined();
    expect(normalizeCountryCode("T1")).toBeUndefined();
    expect(normalizeCountryCode(null)).toBeUndefined();
  });
});

describe("resolveGeoLocale", () => {
  it("maps EG to ar-EG", () => {
    expect(resolveGeoLocale("EG")).toBe("ar-EG");
  });

  it("maps GCC countries to ar-Gulf", () => {
    for (const code of ["SA", "AE", "KW", "QA", "BH", "OM"] as const) {
      expect(resolveGeoLocale(code)).toBe("ar-Gulf");
    }
  });

  it("maps other Arabic countries to ar-MSA", () => {
    expect(resolveGeoLocale("JO")).toBe("ar-MSA");
    expect(resolveGeoLocale("MA")).toBe("ar-MSA");
  });

  it("maps known international countries to en", () => {
    for (const code of ["US", "GB", "FR", "DE"] as const) {
      expect(resolveGeoLocale(code)).toBe("en");
    }
  });

  it("returns null for missing or unlisted countries (no guess)", () => {
    expect(resolveGeoLocale(undefined)).toBeNull();
    expect(resolveGeoLocale("XX")).toBeNull();
    expect(resolveGeoLocale("IS")).toBeNull();
  });
});

describe("readCountryCodeFromHeaders", () => {
  it("reads cf-ipcountry", () => {
    expect(
      readCountryCodeFromHeaders(new Headers({ "cf-ipcountry": "EG" })),
    ).toBe("EG");
  });

  it("falls back to x-vercel-ip-country and x-country-code", () => {
    expect(
      readCountryCodeFromHeaders(new Headers({ "x-vercel-ip-country": "SA" })),
    ).toBe("SA");
    expect(
      readCountryCodeFromHeaders(new Headers({ "x-country-code": "US" })),
    ).toBe("US");
  });
});

describe("resolvePublicLocale Phase 10 precedence", () => {
  it("URL ?locale=en overrides cookie and geo", () => {
    expect(
      resolvePublicLocale({
        urlLocale: "en",
        cookieLocale: "ar-Gulf",
        countryCode: "EG",
      }),
    ).toEqual({ locale: "en", source: "url" });
  });

  it("cookie ar-Gulf overrides geo EG", () => {
    expect(
      resolvePublicLocale({ cookieLocale: "ar-Gulf", countryCode: "EG" }),
    ).toEqual({ locale: "ar-Gulf", source: "cookie" });
  });

  it("no cookie + EG country → ar-EG via geo", () => {
    expect(resolvePublicLocale({ countryCode: "EG" })).toEqual({
      locale: "ar-EG",
      source: "geo",
    });
  });

  it("no cookie + SA → ar-Gulf via geo", () => {
    expect(resolvePublicLocale({ countryCode: "SA" })).toEqual({
      locale: "ar-Gulf",
      source: "geo",
    });
  });

  it("no cookie + JO → ar-MSA via geo", () => {
    expect(resolvePublicLocale({ countryCode: "JO" })).toEqual({
      locale: "ar-MSA",
      source: "geo",
    });
  });

  it("no cookie + US → en via geo", () => {
    expect(resolvePublicLocale({ countryCode: "US" })).toEqual({
      locale: "en",
      source: "geo",
    });
  });

  it("missing country → safe default", () => {
    expect(resolvePublicLocale({})).toEqual({
      locale: DEFAULT_LOCALE,
      source: "default",
    });
  });

  it("unknown country → safe default (no guess)", () => {
    expect(resolvePublicLocale({ countryCode: "IS" })).toEqual({
      locale: DEFAULT_LOCALE,
      source: "default",
    });
  });

  it("invalid locale query still safe fallback via url source", () => {
    expect(resolvePublicLocale({ urlLocale: "fr-FR", countryCode: "US" })).toEqual({
      locale: DEFAULT_LOCALE,
      source: "url",
    });
  });

  it("user preference overrides geo when no URL/cookie", () => {
    expect(
      resolvePublicLocale({
        userPreferenceLocale: "ar-MSA",
        countryCode: "US",
      }),
    ).toEqual({ locale: "ar-MSA", source: "user-preference" });
  });
});

describe("resolveRouteLessonAccess with geo", () => {
  it("loads en package for US geo with no cookie", () => {
    const search = parseLessonPreviewSearch({});
    const access = resolveRouteLessonAccess(LESSON_ID, search, undefined, "US");
    expect(access.effectiveLocale).toBe("en");
    expect(access.contentSource).toBe("locale-package-json");
  });

  it("cookie overrides geo for lesson access", () => {
    const search = parseLessonPreviewSearch({});
    const access = resolveRouteLessonAccess(LESSON_ID, search, "ar-Gulf", "US");
    expect(access.effectiveLocale).toBe("ar-Gulf");
  });

  it("URL overrides geo for lesson access", () => {
    const search = parseLessonPreviewSearch({ locale: "ar-MSA" });
    const access = resolveRouteLessonAccess(LESSON_ID, search, undefined, "US");
    expect(access.effectiveLocale).toBe("ar-MSA");
  });
});

describe("Phase 9.7 cookie behavior unchanged with geo present", () => {
  afterEach(() => {
    document.cookie = `${LOCALE_COOKIE_NAME}=; Path=/; Max-Age=0`;
  });

  it("selector path still writes non-EG cookie when geo would differ", () => {
    persistValidLocaleCookie("en");
    expect(readLocaleCookie()).toBe("en");
    expect(
      resolvePublicLocale({ cookieLocale: readLocaleCookie(), countryCode: "EG" })
        .locale,
    ).toBe("en");
  });

  it("ar-EG selection still overwrites stale cookie with geo present", () => {
    writeLocaleCookie("ar-Gulf");
    persistValidLocaleCookie(DEFAULT_LOCALE);
    expect(readLocaleCookie()).toBe("ar-EG");
    expect(
      resolvePublicLocale({ cookieLocale: readLocaleCookie(), countryCode: "US" })
        .locale,
    ).toBe("ar-EG");
  });
});

describe("geoLocaleEnabled rollback flag", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("skips geo when VITE_GEO_LOCALE_ENABLED=false", async () => {
    vi.stubEnv("VITE_GEO_LOCALE_ENABLED", "false");
    vi.resetModules();
    const { resolvePublicLocale: resolveWithFlagOff } = await import(
      "@/lib/locale/resolve-public-locale"
    );
    expect(resolveWithFlagOff({ countryCode: "US" })).toEqual({
      locale: DEFAULT_LOCALE,
      source: "default",
    });
  });
});
