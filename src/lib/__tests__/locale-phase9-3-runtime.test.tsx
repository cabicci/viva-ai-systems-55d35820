import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocaleAssistantUnavailable } from "@/components/locale/LocaleAssistantUnavailable";
import { LocaleLiveSafetyMarkers } from "@/components/locale/LocaleLiveSafetyMarkers";
import { LocalePackagePreviewRenderer } from "@/components/locale/LocalePackagePreviewRenderer";
import { LocalePreviewMission } from "@/components/locale/LocalePreviewMission";
import {
  LOCALE_COOKIE_NAME,
  readLocaleCookie,
  writeLocaleCookie,
} from "@/lib/locale/locale-cookie";
import {
  buildLocaleNavigationSearch,
  persistValidLocaleCookie,
  readUrlLocaleFromHref,
  stripFalseBooleanSearchParams,
} from "@/lib/locale/locale-search";
import { resolvePublicLocale } from "@/lib/locale/resolve-public-locale";
import { DEFAULT_LOCALE } from "@/lib/locale/types";
import {
  buildLessonLocaleSearch,
  parseLessonPreviewSearch,
  resolveRouteLessonAccess,
} from "@/lib/locale-lessons/lesson-preview-search";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";

const LESSON_ID = "intro-m1-l1-what-is-ai";
const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

function readPackage(locale: "en"): LocalizedLessonPackage {
  const filePath = path.join(
    REPO_ROOT,
    "src/lib/locale-lessons",
    locale,
    "lessons",
    `${LESSON_ID}.json`,
  );
  return JSON.parse(readFileSync(filePath, "utf8")) as LocalizedLessonPackage;
}

describe("Phase 9.3 locale cookie persistence", () => {
  afterEach(() => {
    document.cookie = `${LOCALE_COOKIE_NAME}=; Path=/; Max-Age=0`;
  });

  it("writes masaarat_locale for supported non-default URL locales", () => {
    for (const locale of ["en", "ar-MSA", "ar-Gulf"] as const) {
      persistValidLocaleCookie(locale);
      expect(readLocaleCookie()).toBe(locale);
      document.cookie = `${LOCALE_COOKIE_NAME}=; Path=/; Max-Age=0`;
    }
  });

  it("clears masaarat_locale when default ar-EG is persisted", () => {
    writeLocaleCookie("ar-Gulf");
    persistValidLocaleCookie("ar-EG");
    expect(readLocaleCookie()).toBe("ar-EG");
  });

  it("persists cookie when URL locale is read from href", () => {
    const href = "https://masaarat.ai/learn/intro/intro-m1-l1-what-is-ai?locale=en";
    expect(readUrlLocaleFromHref(href)).toBe("en");
    persistValidLocaleCookie(readUrlLocaleFromHref(href));
    expect(readLocaleCookie()).toBe("en");
  });

  it("does not write cookie for unsupported URL locale", () => {
    writeLocaleCookie("en");
    persistValidLocaleCookie("fr-FR");
    expect(readLocaleCookie()).toBe("en");
  });

  it("selector path writes cookie via writeLocaleCookie", () => {
    writeLocaleCookie("ar-MSA");
    expect(readLocaleCookie()).toBe("ar-MSA");
  });
});

describe("Phase 9.3 selector navigation search", () => {
  it("updates URL search with selected locale", () => {
    expect(buildLocaleNavigationSearch({ from: "dashboard" }, "en")).toEqual({
      from: "dashboard",
      locale: "en",
    });
  });

  it("removes locale param when selecting ar-EG default", () => {
    expect(
      buildLocaleNavigationSearch({ locale: "en", previewLocale: false }, DEFAULT_LOCALE),
    ).toEqual({});
  });

  it("never emits previewLocale=false", () => {
    const next = buildLocaleNavigationSearch(
      { locale: "en", previewLocale: false },
      "ar-MSA",
    );
    expect(next).toEqual({ locale: "ar-MSA" });
    expect("previewLocale" in next).toBe(false);
  });

  it("stripFalseBooleanSearchParams removes previewLocale=false from raw search", () => {
    expect(
      stripFalseBooleanSearchParams({ locale: "en", previewLocale: false }),
    ).toEqual({ locale: "en" });
  });

  it("parseLessonPreviewSearch ignores previewLocale=false in raw URL", () => {
    const search = parseLessonPreviewSearch({
      locale: "en",
      previewLocale: false,
    });
    expect(search).toEqual({ locale: "en" });
    expect(buildLessonLocaleSearch(search, undefined)).toEqual({ locale: "en" });
  });
});

describe("Phase 9.3 refresh and precedence", () => {
  it("uses cookie when URL locale is absent", () => {
    const search = parseLessonPreviewSearch({});
    const access = resolveRouteLessonAccess(LESSON_ID, search, "ar-Gulf");
    expect(access.effectiveLocale).toBe("ar-Gulf");
    expect(resolvePublicLocale({ cookieLocale: "ar-Gulf" }).locale).toBe("ar-Gulf");
  });

  it("URL locale overrides cookie", () => {
    const search = parseLessonPreviewSearch({ locale: "ar-MSA" });
    const access = resolveRouteLessonAccess(LESSON_ID, search, "en");
    expect(access.effectiveLocale).toBe("ar-MSA");
    expect(
      resolvePublicLocale({ urlLocale: "ar-MSA", cookieLocale: "en" }).locale,
    ).toBe("ar-MSA");
  });

  it("unsupported locale falls back to ar-EG without invalid cookie locale", () => {
    writeLocaleCookie("en");
    const search = parseLessonPreviewSearch({ locale: "fr-FR" });
    const access = resolveRouteLessonAccess(LESSON_ID, search, "en");
    expect(access.effectiveLocale).toBe("ar-EG");
    expect(access.contentSource).toBe("egyptian-ts");
    expect(buildLessonLocaleSearch(search, "en")).toBeUndefined();
    persistValidLocaleCookie("fr-FR");
    expect(readLocaleCookie()).toBe("en");
  });
});

describe("Phase 9.3 live locale rendering", () => {
  it("loads en package from ?locale=en", () => {
    const access = resolveRouteLessonAccess(
      LESSON_ID,
      parseLessonPreviewSearch({ locale: "en" }),
    );
    expect(access.effectiveLocale).toBe("en");
    expect(access.contentSource).toBe("locale-package-json");
  });

  it("loads ar-MSA package from ?locale=ar-MSA", () => {
    const access = resolveRouteLessonAccess(
      LESSON_ID,
      parseLessonPreviewSearch({ locale: "ar-MSA" }),
    );
    expect(access.effectiveLocale).toBe("ar-MSA");
    expect(access.contentSource).toBe("locale-package-json");
  });

  it("loads ar-Gulf package from ?locale=ar-Gulf", () => {
    const access = resolveRouteLessonAccess(
      LESSON_ID,
      parseLessonPreviewSearch({ locale: "ar-Gulf" }),
    );
    expect(access.effectiveLocale).toBe("ar-Gulf");
    expect(access.contentSource).toBe("locale-package-json");
  });
});

describe("Phase 9.3 non-ar-EG QA markers", () => {
  it("exposes page-level safety markers for en via LocaleLiveSafetyMarkers", () => {
    const { container } = render(<LocaleLiveSafetyMarkers locale="en" />);
    expect(container.querySelector('[data-locale-video="placeholder"]')).not.toBeNull();
    expect(container.querySelector('[data-locale-assistant="unavailable"]')).not.toBeNull();
    expect(container.querySelector('[data-locale-mission="readonly"]')).not.toBeNull();
  });

  it("does not expose page-level safety markers for ar-EG", () => {
    const { container } = render(<LocaleLiveSafetyMarkers locale="ar-EG" />);
    expect(container.querySelector('[data-locale-video="placeholder"]')).toBeNull();
    expect(container.querySelector('[data-locale-assistant="unavailable"]')).toBeNull();
    expect(container.querySelector('[data-locale-mission="readonly"]')).toBeNull();
  });

  it("exposes assistant unavailable marker for en", () => {
    const { container } = render(<LocaleAssistantUnavailable locale="en" />);
    expect(
      container.querySelector('[data-locale-assistant="unavailable"]'),
    ).not.toBeNull();
  });

  it("does not expose assistant unavailable marker for ar-EG", () => {
    const { container } = render(<LocaleAssistantUnavailable locale="ar-EG" />);
    expect(
      container.querySelector('[data-locale-assistant="unavailable"]'),
    ).toBeNull();
  });

  it("exposes mission readonly marker in preview mission", () => {
    const { container } = render(
      <LocalePreviewMission intro="Intro" delivery={[]} rubric={[]} />,
    );
    expect(container.querySelector('[data-locale-mission="readonly"]')).not.toBeNull();
  });

  it("exposes video placeholder marker when localized composite GUID is absent", () => {
    const pkg = readPackage("en");
    const { container } = render(<LocalePackagePreviewRenderer pkg={pkg} />);
    expect(container.querySelector('[data-locale-video="placeholder"]')).not.toBeNull();
    expect(screen.getByText(/Video for this language is coming soon/i)).toBeTruthy();
  });
});
