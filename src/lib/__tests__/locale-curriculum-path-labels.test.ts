import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CURRICULUM_PATH_IDS,
  CURRICULUM_PATH_LABEL_FIELDS,
} from "@/lib/locale-curriculum/curriculum-label-keys";
import { getCurriculumPathLabel } from "@/lib/locale-curriculum/resolve-curriculum-label";
import { getPath } from "@/lib/curriculum-data";
import { SUPPORTED_LOCALES } from "@/lib/locale/types";
import arEGLabels from "@/lib/locale-curriculum/ar-EG/labels.json";
import arMSALabels from "@/lib/locale-curriculum/ar-MSA/labels.json";
import arGulfLabels from "@/lib/locale-curriculum/ar-Gulf/labels.json";
import enLabels from "@/lib/locale-curriculum/en/labels.json";

const LABELS_BY_LOCALE = {
  "ar-EG": arEGLabels,
  "ar-MSA": arMSALabels,
  "ar-Gulf": arGulfLabels,
  en: enLabels,
} as const;

const ROUTE_SOURCES = [
  "src/routes/curriculum.tsx",
  "src/routes/dashboard.tsx",
].map((path) => readFileSync(resolve(process.cwd(), path), "utf8"));

describe("locale curriculum path labels (Phase 12.5A)", () => {
  it("defines all path title/tagline labels for four locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const paths = LABELS_BY_LOCALE[locale].paths;
      for (const pathId of CURRICULUM_PATH_IDS) {
        for (const field of CURRICULUM_PATH_LABEL_FIELDS) {
          const value = paths[pathId]?.[field];
          expect(value?.length, `${locale} ${pathId}.${field}`).toBeGreaterThan(0);
          expect(value, `${locale} ${pathId}.${field}`).not.toBe(`${pathId}.${field}`);
        }
      }
    }
  });

  it("renders English path labels for locale=en", () => {
    expect(getCurriculumPathLabel("en", "intro", "title")).toBe("Introduction");
    expect(getCurriculumPathLabel("en", "builder", "tagline")).toContain("AI products");
  });

  it("keeps ar-EG path labels in Egyptian Arabic", () => {
    expect(getCurriculumPathLabel("ar-EG", "intro", "title")).toBe("المقدمة");
    expect(getCurriculumPathLabel("ar-EG", "automator", "tagline")).toContain("أتمتة");
  });

  it("falls back to curriculum-data when overlay field is missing", () => {
    const canonical = getPath("creator");
    expect(canonical).toBeDefined();
    expect(
      getCurriculumPathLabel("en", "nonexistent-path" as "intro", "title"),
    ).toBe("nonexistent-path");
    expect(getCurriculumPathLabel("ar-EG", "creator", "title")).toBe(canonical!.title);
  });

  it("wires curriculum and dashboard path chrome through getCurriculumPathLabel", () => {
    for (const source of ROUTE_SOURCES) {
      expect(source).toContain("getCurriculumPathLabel");
    }
    expect(ROUTE_SOURCES.join("\n")).not.toMatch(/\{path\.title\}/);
    expect(ROUTE_SOURCES.join("\n")).not.toMatch(/\{path\.tagline\}/);
  });
});
