import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import type { LessonVisualMaster } from "../types";
import { LOCALES } from "../types";
import {
  MASTERS_DIR,
  arabicCharRatio,
  latinCharRatio,
  loadJson,
  type ValidationIssue,
} from "./shared";

/**
 * Language integrity: EN packs must not be Arabic-dominated;
 * AR packs must not be English-literal dominated (best-effort).
 */
export function validateLocaleIntegrity(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const files = readdirSync(MASTERS_DIR).filter((f) =>
    f.endsWith(".master.json"),
  );

  for (const f of files) {
    const master = loadJson<LessonVisualMaster>(resolve(MASTERS_DIR, f));
    for (const locale of LOCALES) {
      const labels = master.labelPacks[locale] ?? [];
      const alt = master.altTexts[locale] ?? "";
      const joined = [...labels.map((l) => l.text), alt].join(" ");

      if (locale === "en") {
        if (arabicCharRatio(joined) > 0.25) {
          issues.push({
            gate: "localeIntegrity",
            lessonId: master.lessonId,
            message: "EN labels/alt contain substantial Arabic",
          });
        }
      } else {
        // Arabic locales should have meaningful Arabic content
        if (arabicCharRatio(joined) < 0.2 && latinCharRatio(joined) > 0.6) {
          issues.push({
            gate: "localeIntegrity",
            lessonId: master.lessonId,
            message: `${locale} labels/alt look English-dominated`,
          });
        }
      }
    }

    // Dialect leakage best-effort: Egyptian markers in MSA/Gulf titles only warn via soft check
    const egMarkers = /النهاردة|ازاي|إزاي|بتاع|عشان كده|هتعمل/;
    for (const loc of ["ar-MSA", "ar-Gulf"] as const) {
      const blob = [
        master.titles[loc],
        master.contentBrief.coreIdea[loc],
        ...master.labelPacks[loc].map((l) => l.text),
      ].join(" ");
      // Soft: only fail if EG markers dominate MSA/Gulf label pack entirely
      const hits = (blob.match(egMarkers) ?? []).length;
      if (hits >= 4) {
        issues.push({
          gate: "localeIntegrity",
          lessonId: master.lessonId,
          message: `${loc} shows heavy ar-EG dialect leakage (${hits} markers)`,
        });
      }
    }
  }
  return issues;
}
