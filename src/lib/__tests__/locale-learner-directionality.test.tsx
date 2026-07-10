import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocaleProvider, useLocale } from "@/lib/locale/locale-context";
import { LOCALE_META, SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/locale/types";

const ARABIC_LOCALES = ["ar-EG", "ar-MSA", "ar-Gulf"] as const satisfies readonly SupportedLocale[];

const STYLES_SOURCE = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
const CURRICULUM_SOURCE = readFileSync(resolve(process.cwd(), "src/routes/curriculum.tsx"), "utf8");
const DASHBOARD_SOURCE = readFileSync(resolve(process.cwd(), "src/routes/dashboard.tsx"), "utf8");
const LEARN_SOURCE = readFileSync(
  resolve(process.cwd(), "src/routes/learn.$pathId.$lessonId.tsx"),
  "utf8",
);
const INTRO_RENDERER_SOURCE = readFileSync(
  resolve(process.cwd(), "src/components/intro/IntroLessonRenderer.tsx"),
  "utf8",
);

function LocaleDirProbe() {
  const { locale, dir } = useLocale();
  return (
    <div data-testid="probe" data-locale={locale} data-dir={dir}>
      <p data-testid="wrapped-en" dir={dir}>
        Lesson 3: What is AI, really? — start here.
      </p>
    </div>
  );
}

describe("locale learner directionality (inherited RTL regression)", () => {
  it("maps four locales to expected document directions", () => {
    expect(LOCALE_META.en.dir).toBe("ltr");
    for (const locale of ARABIC_LOCALES) {
      expect(LOCALE_META[locale].dir, locale).toBe("rtl");
    }
    for (const locale of SUPPORTED_LOCALES) {
      expect(LOCALE_META[locale].dir, locale).toMatch(/^(ltr|rtl)$/);
    }
  });

  it("scopes global html direction to html[dir] instead of unconditional rtl", () => {
    expect(STYLES_SOURCE).toContain('html[dir="rtl"] { direction: rtl; }');
    expect(STYLES_SOURCE).toContain('html[dir="ltr"] { direction: ltr; }');
    expect(STYLES_SOURCE).not.toMatch(/^\s*html\s*\{\s*direction:\s*rtl;/m);
  });

  it("binds curriculum and dashboard shells to locale dir", () => {
    expect(CURRICULUM_SOURCE).toMatch(/dir=\{dir\}/);
    expect(DASHBOARD_SOURCE).toMatch(/dir=\{dir\}/);
  });

  it("uses logical alignment on learner path and module cards", () => {
    expect(DASHBOARD_SOURCE).toContain("text-start");
    expect(DASHBOARD_SOURCE).not.toContain("text-right");
    expect(CURRICULUM_SOURCE).not.toContain("text-right");
  });

  it("keeps English curriculum badges under ltr while locale shell follows dir", () => {
    expect(CURRICULUM_SOURCE).toContain('dir="ltr"');
    expect(CURRICULUM_SOURCE).toContain("useLocale()");
  });

  it("uses locale-aware navigation arrows on learn route", () => {
    expect(LEARN_SOURCE).toContain('const PreviousNavIcon = dir === "rtl" ? ArrowRight : ArrowLeft');
    expect(LEARN_SOURCE).toContain('const NextNavIcon = dir === "rtl" ? ArrowLeft : ArrowRight');
    expect(LEARN_SOURCE).not.toMatch(/<ArrowRight className="h-4 w-4" \/>\s*\{t\("learn\.nav\.previous"\)/);
  });

  it("uses logical borders in IntroLessonRenderer concept and case-study blocks", () => {
    expect(INTRO_RENDERER_SOURCE).toContain("border-s-2 border-primary/30 ps-3");
    expect(INTRO_RENDERER_SOURCE).toContain("border-e-4 bg-accent");
    expect(INTRO_RENDERER_SOURCE).not.toContain("border-r-2 border-primary/30 pr-3");
    expect(INTRO_RENDERER_SOURCE).not.toContain("border-r-4 bg-accent");
  });

  it("rotates curriculum builder CTA arrow only for rtl locales", () => {
    expect(CURRICULUM_SOURCE).toContain('${dir === "rtl" ? "rotate-180" : ""}');
  });

  describe("four-locale directionality via LocaleProvider", () => {
    it("resolves English curriculum/path context as ltr", () => {
      render(
        <LocaleProvider initialLocale="en" effectiveLocale="en">
          <LocaleDirProbe />
        </LocaleProvider>,
      );
      expect(screen.getByTestId("probe").getAttribute("data-dir")).toBe("ltr");
      expect(screen.getByTestId("wrapped-en").getAttribute("dir")).toBe("ltr");
    });

    for (const locale of ARABIC_LOCALES) {
      it(`resolves ${locale} curriculum/path context as rtl`, () => {
        render(
          <LocaleProvider initialLocale={locale} effectiveLocale={locale}>
            <LocaleDirProbe />
          </LocaleProvider>,
        );
        expect(screen.getByTestId("probe").getAttribute("data-dir")).toBe("rtl");
        expect(screen.getByTestId("wrapped-en").getAttribute("dir")).toBe("rtl");
      });
    }

    it("switches direction when locale changes in shared provider", () => {
      const { rerender } = render(
        <LocaleProvider initialLocale="ar-EG" effectiveLocale="ar-EG">
          <LocaleDirProbe />
        </LocaleProvider>,
      );
      expect(screen.getByTestId("probe").getAttribute("data-dir")).toBe("rtl");

      rerender(
        <LocaleProvider initialLocale="en" effectiveLocale="en">
          <LocaleDirProbe />
        </LocaleProvider>,
      );
      expect(screen.getByTestId("probe").getAttribute("data-dir")).toBe("ltr");
      expect(screen.getByTestId("wrapped-en").getAttribute("dir")).toBe("ltr");
    });
  });

  it("preserves ar-EG default rtl learner behavior", () => {
    render(
      <LocaleProvider initialLocale="ar-EG" effectiveLocale="ar-EG">
        <LocaleDirProbe />
      </LocaleProvider>,
    );
    expect(screen.getByTestId("probe").getAttribute("data-locale")).toBe("ar-EG");
    expect(screen.getByTestId("probe").getAttribute("data-dir")).toBe("rtl");
  });
});
