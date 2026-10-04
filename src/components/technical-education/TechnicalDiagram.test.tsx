import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { TechnicalDiagram } from "./TechnicalDiagram";
import type { TechnicalLesson, TechnicalDiagramKind } from "@/lib/technical-education/types";
import { SUPPORTED_LOCALES } from "@/lib/locale/types";
import { getPilotCopy } from "@/lib/furniture-pilot/content";

const drawing = (kind: TechnicalDiagramKind, locale: TechnicalLesson["locale"]) =>
  renderToStaticMarkup(<TechnicalDiagram kind={kind} locale={locale} title="Explanation" />);

describe("section-specific technical illustrations", () => {
  it.each(SUPPORTED_LOCALES)(
    "uses different drawings for different explanation steps in %s",
    (locale) => {
      const all = [];
      for (const id of ["M01-L01", "M01-L02", "M01-L03", "M01-L04"]) {
        const lesson: TechnicalLesson = JSON.parse(
          readFileSync(`src/lib/technical-education/lessons/${id}__${locale}.json`, "utf8"),
        );
        const keys = lesson.sections.map((s) => s.diagram);
        expect(new Set(keys).size).toBe(lesson.sections.length);
        const drawings = keys.map((key) => drawing(key, locale));
        expect(new Set(drawings).size).toBe(lesson.sections.length);
        // Compare actual geometry/text, not just IDs or accessible titles.
        all.push(...drawings.map((svg) => svg.replace(/data-diagram="[^"]+"/g, "")));
      }
      expect(new Set(all).size).toBe(12);
      const pilot = getPilotCopy(locale).sections.map((s) =>
        drawing(`cabinet-${s.id}` as TechnicalDiagramKind, locale),
      );
      expect(new Set(pilot.map((svg) => svg.replace(/data-diagram="[^"]+"/g, ""))).size).toBe(6);
    },
  );
  it("illustrates the shared cabinet arithmetic accurately", () => {
    expect(drawing("cabinet-width", "en")).toContain("600 − 18 − 18 = 564");
    expect(drawing("cabinet-depth", "en")).toContain("300 − 6 = 294 mm");
    expect(drawing("cabinet-openings", "en")).toContain("273 mm");
    expect(drawing("cabinet-list", "en")).toContain("3 × 564 × 294 × 18");
    expect(drawing("survey-check", "en")).toContain("Difference to investigate");
  });
});
