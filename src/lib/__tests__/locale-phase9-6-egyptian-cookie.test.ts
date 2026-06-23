import { afterEach, describe, expect, it } from "vitest";
import {
  LOCALE_COOKIE_NAME,
  readLocaleCookie,
  writeLocaleCookie,
} from "@/lib/locale/locale-cookie";
import {
  buildLocaleNavigationSearch,
  persistValidLocaleCookie,
} from "@/lib/locale/locale-search";
import { resolvePublicLocale } from "@/lib/locale/resolve-public-locale";
import { DEFAULT_LOCALE } from "@/lib/locale/types";

describe("Phase 9.6 ar-EG selector cookie reset", () => {
  afterEach(() => {
    document.cookie = `${LOCALE_COOKIE_NAME}=; Path=/; Max-Age=0`;
  });

  it("select en writes cookie=en and bare URL resolves en", () => {
    persistValidLocaleCookie("en");
    expect(readLocaleCookie()).toBe("en");
    expect(
      resolvePublicLocale({ urlLocale: undefined, cookieLocale: readLocaleCookie() })
        .locale,
    ).toBe("en");
  });

  it("select ar-Gulf writes cookie=ar-Gulf and bare URL resolves ar-Gulf", () => {
    persistValidLocaleCookie("ar-Gulf");
    expect(readLocaleCookie()).toBe("ar-Gulf");
    expect(
      resolvePublicLocale({ urlLocale: undefined, cookieLocale: readLocaleCookie() })
        .locale,
    ).toBe("ar-Gulf");
  });

  it("select ar-EG clears cookie so refresh stays ar-EG default", () => {
    writeLocaleCookie("ar-Gulf");
    persistValidLocaleCookie(DEFAULT_LOCALE);
    expect(readLocaleCookie()).toBeUndefined();
    expect(
      resolvePublicLocale({ urlLocale: undefined, cookieLocale: readLocaleCookie() })
        .locale,
    ).toBe(DEFAULT_LOCALE);
  });

  it("after ar-EG select, bare URL does not resolve stale en", () => {
    writeLocaleCookie("en");
    persistValidLocaleCookie(DEFAULT_LOCALE);
    expect(readLocaleCookie()).toBeUndefined();
    const resolved = resolvePublicLocale({
      urlLocale: undefined,
      cookieLocale: readLocaleCookie(),
    });
    expect(resolved.locale).toBe("ar-EG");
    expect(resolved.source).toBe("default");
  });

  it("after ar-EG select, bare URL does not resolve stale ar-MSA", () => {
    writeLocaleCookie("ar-MSA");
    persistValidLocaleCookie(DEFAULT_LOCALE);
    expect(
      resolvePublicLocale({ urlLocale: undefined, cookieLocale: readLocaleCookie() })
        .locale,
    ).toBe("ar-EG");
  });

  it("URL locale=en overrides stale cookie until ar-EG clears it", () => {
    writeLocaleCookie("ar-Gulf");
    expect(
      resolvePublicLocale({ urlLocale: "en", cookieLocale: readLocaleCookie() }).locale,
    ).toBe("en");
  });

  it("buildLocaleNavigationSearch removes locale param for ar-EG", () => {
    expect(buildLocaleNavigationSearch({ locale: "en" }, DEFAULT_LOCALE)).toEqual({});
  });

  it("does not write cookie for unsupported fr-FR", () => {
    writeLocaleCookie("en");
    persistValidLocaleCookie("fr-FR");
    expect(readLocaleCookie()).toBe("en");
  });

  it("non-ar-EG locales still persist cookie", () => {
    for (const locale of ["en", "ar-MSA", "ar-Gulf"] as const) {
      persistValidLocaleCookie(locale);
      expect(readLocaleCookie()).toBe(locale);
      document.cookie = `${LOCALE_COOKIE_NAME}=; Path=/; Max-Age=0`;
    }
  });
});
