import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveLearnDisplayTitle } from "@/lib/locale/learn-display-title";
import { LEARN_UI_KEYS } from "@/lib/locale/learn-ui-keys";
import { getUiString } from "@/lib/locale/ui-strings";
import { SUPPORTED_LOCALES } from "@/lib/locale/types";

const LEARN_ROUTE_SOURCE = readFileSync(
  resolve(process.cwd(), "src/routes/learn.$pathId.$lessonId.tsx"),
  "utf8",
);

describe("locale learn route chrome (Phase 12.4A)", () => {
  it("serves learn shell strings for all four locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const key of LEARN_UI_KEYS) {
        const value = getUiString(locale, key);
        expect(value.length, `${locale} ${key}`).toBeGreaterThan(0);
        expect(value, `${locale} ${key}`).not.toBe(key);
      }
    }
  });

  it("renders English learn chrome copy for locale=en", () => {
    expect(getUiString("en", "learn.backToMap")).toBe("Back to map");
    expect(getUiString("en", "learn.backToDashboard")).toBe("Back to dashboard");
    expect(getUiString("en", "learn.nav.previous")).toBe("Previous");
    expect(getUiString("en", "learn.nav.next")).toBe("Next lesson");
    expect(getUiString("en", "learn.assistant.fab")).toBe("Ask assistant");
  });

  it("prefers localized package title for H1 with safe fallback", () => {
    expect(
      resolveLearnDisplayTitle("AI يعني إيه فعلًا؟", {
        title: "What is AI, really?",
      }),
    ).toBe("What is AI, really?");
    expect(resolveLearnDisplayTitle("AI يعني إيه فعلًا؟", { title: "  " })).toBe(
      "AI يعني إيه فعلًا؟",
    );
    expect(resolveLearnDisplayTitle("AI يعني إيه فعلًا؟", null)).toBe(
      "AI يعني إيه فعلًا؟",
    );
  });

  it("wires learn route chrome through useUiString", () => {
    expect(LEARN_ROUTE_SOURCE).toContain("useUiString");
    expect(LEARN_ROUTE_SOURCE).toContain("resolveLearnDisplayTitle");
    expect(LEARN_ROUTE_SOURCE).toContain('learn.path.intro');
    expect(LEARN_ROUTE_SOURCE).not.toMatch(/>\s*رجوع للخريطة\s*</);
  });
});
