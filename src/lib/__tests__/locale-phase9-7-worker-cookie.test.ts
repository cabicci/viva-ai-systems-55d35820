import { afterEach, describe, expect, it } from "vitest";
import {
  LOCALE_COOKIE_NAME,
  clearLocaleCookie,
  localeCookieDeletionDirectives,
  localeCookieWriteDirective,
  readLocaleCookie,
  writeLocaleCookie,
} from "@/lib/locale/locale-cookie";
import { persistValidLocaleCookie } from "@/lib/locale/locale-search";
import { resolvePublicLocale } from "@/lib/locale/resolve-public-locale";
import { DEFAULT_LOCALE } from "@/lib/locale/types";

describe("Phase 9.7 cookie deletion directives", () => {
  it("write directive includes Path=/, Max-Age, and encoded value", () => {
    expect(localeCookieWriteDirective("ar-Gulf")).toBe(
      `${LOCALE_COOKIE_NAME}=ar-Gulf; Path=/; SameSite=Lax; Max-Age=31536000`,
    );
  });

  it("deletion directives include Path=/, Max-Age=0, Expires, and Secure variant", () => {
    const directives = localeCookieDeletionDirectives();
    expect(directives).toHaveLength(2);
    for (const directive of directives) {
      expect(directive).toContain(`${LOCALE_COOKIE_NAME}=;`);
      expect(directive).toContain("Path=/");
      expect(directive).toContain("Max-Age=0");
      expect(directive).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
      expect(directive).toContain("SameSite=Lax");
    }
    expect(directives[1]).toContain("Secure");
  });

  it("clearLocaleCookie removes a previously written locale", () => {
    writeLocaleCookie("ar-Gulf");
    expect(readLocaleCookie()).toBe("ar-Gulf");
    clearLocaleCookie();
    expect(readLocaleCookie()).toBeUndefined();
  });
});

describe("Phase 9.7 ar-EG selector overwrites stale cookie", () => {
  afterEach(() => {
    clearLocaleCookie();
  });

  it("select ar-Gulf then ar-EG leaves cookie ar-EG not stale ar-Gulf", () => {
    persistValidLocaleCookie("ar-Gulf");
    expect(readLocaleCookie()).toBe("ar-Gulf");

    persistValidLocaleCookie(DEFAULT_LOCALE);
    expect(readLocaleCookie()).toBe("ar-EG");
    expect(readLocaleCookie()).not.toBe("ar-Gulf");
  });

  it("bare URL after ar-EG resolves ar-EG not stale ar-Gulf", () => {
    persistValidLocaleCookie("ar-Gulf");
    persistValidLocaleCookie(DEFAULT_LOCALE);

    const resolved = resolvePublicLocale({
      urlLocale: undefined,
      cookieLocale: readLocaleCookie(),
    });
    expect(resolved.locale).toBe("ar-EG");
    expect(resolved.source).toBe("cookie");
  });

  it("non-EG locales still persist independently", () => {
    for (const locale of ["en", "ar-MSA", "ar-Gulf"] as const) {
      persistValidLocaleCookie(locale);
      expect(readLocaleCookie()).toBe(locale);
      clearLocaleCookie();
    }
  });
});
