import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, readdirSync } from "node:fs";
import { TechnicalDiagram } from "./TechnicalDiagram";
import definitions from "../../lib/technical-education/new-diagrams.json";
import type { TechnicalLesson } from "../../lib/technical-education/types";
import { SUPPORTED_LOCALES } from "../../lib/locale/types";

const files = readdirSync("src/lib/technical-education/lessons").filter(
  (name) => name.endsWith(".json") && !name.startsWith("M01-"),
);
const lessons = files.map(
  (name) =>
    JSON.parse(
      readFileSync(`src/lib/technical-education/lessons/${name}`, "utf8"),
    ) as TechnicalLesson,
);

describe("additional authored technical lessons", () => {
  it("keeps explanation concept and objective answer meaning aligned in all four registers", () => {
    for (const id of new Set(lessons.map((lesson) => lesson.id))) {
      const variants = SUPPORTED_LOCALES.map((locale) =>
        lessons.find((lesson) => lesson.id === id && lesson.locale === locale),
      );
      expect(variants.every(Boolean)).toBe(true);
      const first = variants[0]!;
      for (const lesson of variants) {
        expect(lesson!.sections.map((s) => [s.id, s.diagram])).toEqual(
          first.sections.map((s) => [s.id, s.diagram]),
        );
        expect(lesson!.quiz.map((q) => [q.id, q.correct, q.options.length])).toEqual(
          first.quiz.map((q) => [q.id, q.correct, q.options.length]),
        );
        expect(JSON.stringify(lesson)).not.toMatch(
          /Metwood|source_pdf_pages|library_file_id|صفحات الكتاب/,
        );
      }
    }
  });
  it.each(SUPPORTED_LOCALES)("renders real and distinct concept geometry in %s", (locale) => {
    const actual = lessons
      .filter((lesson) => lesson.locale === locale)
      .flatMap((lesson) => lesson.sections);
    expect(actual.length).toBeGreaterThan(0);
    const rendered = actual.map((section) => {
      expect(section.diagram in definitions).toBe(true);
      return renderToStaticMarkup(
        <TechnicalDiagram kind={section.diagram} locale={locale} title={section.title} />,
      ).replace(/data-diagram="[^"]+"|aria-label="[^"]+"/g, "");
    });
    expect(new Set(rendered).size).toBe(actual.length);
    expect(
      rendered.every((svg) => svg.includes("Cairo, sans-serif") && !svg.includes("undefined")),
    ).toBe(true);
  });
});
