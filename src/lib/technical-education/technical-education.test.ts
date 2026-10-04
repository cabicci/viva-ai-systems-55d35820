import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { catalog, hasTechnicalLesson, technicalDownloadName } from "./catalog";
import { parsePreviewProgress } from "./preview-progress";
import { getPilotCopy, resolvePilotLocale } from "../furniture-pilot/content";
import type { TechnicalLesson } from "./types";
import { SUPPORTED_LOCALES } from "../locale/types";

describe("technical learning journey", () => {
  it("retains the curriculum topology and reuses the existing cut-list lesson", () => {
    expect(catalog.sections).toHaveLength(7);
    expect(catalog.modules).toHaveLength(21);
    expect(catalog.lessons).toHaveLength(80);
    expect(new Set(catalog.lessons.map((lesson) => lesson.id)).size).toBe(80);
    expect(
      catalog.lessons
        .filter((lesson) => lesson.runtimeId === "furniture-m1-cut-list")
        .map((lesson) => lesson.id),
    ).toEqual(["M04-L02"]);
    expect(JSON.stringify(catalog)).not.toMatch(
      /Metwood|source_pdf_pages|library_file_id|sourceNote/,
    );
    expect(hasTechnicalLesson("M99-L99", "ar-EG")).toBe(false);
    expect(hasTechnicalLesson("M01-L01", "ar-Gulf")).toBe(true);
  });
  it("keeps technical facts, question IDs and assessment meaning aligned across authored locales", () => {
    const files = readdirSync("src/lib/technical-education/lessons").filter((name) =>
      name.endsWith(".json"),
    );
    expect(files).toHaveLength(
      4 * (catalog.lessons.filter((lesson) => hasTechnicalLesson(lesson.id, "en")).length - 1),
    );
    for (const id of ["M01-L01", "M01-L02", "M01-L03", "M01-L04"]) {
      const packages = SUPPORTED_LOCALES.map(
        (locale) =>
          JSON.parse(
            readFileSync(`src/lib/technical-education/lessons/${id}__${locale}.json`, "utf8"),
          ) as TechnicalLesson,
      );
      for (const pkg of packages) {
        expect(pkg.id).toBe(id);
        expect(pkg.sections.map((section) => section.id)).toEqual(
          packages[0].sections.map((section) => section.id),
        );
        expect(
          pkg.quiz.map((question) => [question.id, question.correct, question.options.length]),
        ).toEqual(
          packages[0].quiz.map((question) => [
            question.id,
            question.correct,
            question.options.length,
          ]),
        );
        expect(pkg.assignment.fields).toHaveLength(3);
        expect(pkg.assignment.criteria).toHaveLength(3);
        expect(JSON.stringify(pkg)).not.toMatch(/Metwood|كتاب|source_pdf_pages/);
      }
      if (id === "M01-L02")
        for (const pkg of packages) expect(pkg.example.text).toMatch(/1200.*1194/);
    }
  });
  it.each(SUPPORTED_LOCALES)("never falls back to another pilot register for %s", (locale) => {
    expect(resolvePilotLocale(locale)).toBe(locale);
    const pkg = getPilotCopy(locale);
    expect(pkg.sections).toHaveLength(6);
    expect(pkg.eyebrow).toContain("M04");
    expect(JSON.stringify(pkg)).not.toMatch(/Metwood|HSE reference|مصدر HSE|sourceNote/);
    expect(Object.values(pkg.downloadNames).every((name) => name.endsWith(".pdf"))).toBe(true);
  });
  it("rejects corrupt or unrelated preview state rather than manufacturing completion", () => {
    expect(parsePreviewProgress("broken")).toEqual({});
    expect(
      parsePreviewProgress(
        '{"unknown":{"read":true},"M01-L01":{"read":"true","quizPassed":1,"practiceReviewed":true}}',
      ),
    ).toEqual({
      "M01-L01": { read: false, quizPassed: false, practiceReviewed: true, drafts: {} },
    });
    expect(technicalDownloadName("دليل الدرس", "الوحدة: مدخل/صغير")).toBe(
      "دليل الدرس — الوحدة - مدخل - صغير.pdf",
    );
  });
});
