import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CURRICULUM_MODULE_IDS,
  CURRICULUM_MODULE_LABEL_FIELDS,
} from "@/lib/locale-curriculum/curriculum-label-keys";
import { getCurriculumModuleLabel } from "@/lib/locale-curriculum/resolve-curriculum-label";
import { PATHS } from "@/lib/curriculum-data";
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
  "src/routes/learn.$pathId.$lessonId.tsx",
].map((path) => readFileSync(resolve(process.cwd(), path), "utf8"));

describe("locale curriculum module labels (Phase 12.5B)", () => {
  it("defines all module title/subtitle labels for four locales", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const modules = LABELS_BY_LOCALE[locale].modules as Record<
        string,
        { title: string; subtitle: string }
      >;
      for (const moduleId of CURRICULUM_MODULE_IDS) {
        for (const field of CURRICULUM_MODULE_LABEL_FIELDS) {
          const value = modules[moduleId]?.[field];
          expect(value?.length, `${locale} ${moduleId}.${field}`).toBeGreaterThan(0);
          expect(value, `${locale} ${moduleId}.${field}`).not.toBe(`${moduleId}.${field}`);
        }
      }
    }
  });

  it("renders English module labels for locale=en", () => {
    expect(getCurriculumModuleLabel("en", "intro-m1", "title")).toBe("Start Here");
    expect(getCurriculumModuleLabel("en", "intro-m1", "subtitle")).toContain("7 short lessons");
  });

  it("keeps ar-EG module labels in Egyptian Arabic", () => {
    expect(getCurriculumModuleLabel("ar-EG", "intro-m1", "title")).toBe("ÇÈÏÃ ãä åäÇ");
    expect(getCurriculumModuleLabel("ar-EG", "automator-m1", "title")).toContain("ÇáÎÑíØÉ");
  });

  it("falls back to curriculum-data when overlay field is missing", () => {
    let canonicalTitle = "";
    for (const path of PATHS) {
      const module = path.modules.find((m) => m.id === "creator-m1");
      if (module) {
        canonicalTitle = module.title;
        break;
      }
    }
    expect(canonicalTitle.length).toBeGreaterThan(0);
    expect(getCurriculumModuleLabel("en", "nonexistent-module", "title")).toBe(
      "nonexistent-module",
    );
    expect(getCurriculumModuleLabel("ar-EG", "creator-m1", "title")).toBe(canonicalTitle);
  });

  it("wires curriculum, dashboard, and learn module chrome through getCurriculumModuleLabel", () => {
    for (const source of ROUTE_SOURCES) {
      expect(source).toContain("getCurriculumModuleLabel");
    }
    expect(ROUTE_SOURCES.join("\n")).not.toMatch(/\{m\.title\}/);
  });
});
