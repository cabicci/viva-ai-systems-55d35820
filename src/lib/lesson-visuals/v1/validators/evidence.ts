import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import type { LessonVisualMaster } from "../types";
import { LOCALES } from "../types";
import {
  MASTERS_DIR,
  REPO_ROOT,
  loadJson,
  quoteInFile,
  type ValidationIssue,
} from "./shared";

export function validateEvidence(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const files = readdirSync(MASTERS_DIR).filter((f) =>
    f.endsWith(".master.json"),
  );

  for (const f of files) {
    const master = loadJson<LessonVisualMaster>(resolve(MASTERS_DIR, f));

    for (const locale of LOCALES) {
      const q = master.contentBrief.visualIntent.packageQuotes[locale];
      const abs = resolve(REPO_ROOT, q.path);
      if (!quoteInFile(abs, q.quote)) {
        issues.push({
          gate: "evidence",
          lessonId: master.lessonId,
          message: `visualIntent quote not found in ${q.path} (${locale})`,
        });
      }
    }

    for (const claim of master.factualClaims) {
      const abs = resolve(REPO_ROOT, claim.path);
      if (!quoteInFile(abs, claim.quote)) {
        issues.push({
          gate: "evidence",
          lessonId: master.lessonId,
          message: `factual claim quote not found in ${claim.path}`,
        });
      }
    }

    for (const locale of LOCALES) {
      for (const label of master.labelPacks[locale]) {
        const abs = resolve(REPO_ROOT, label.source.path);
        if (!quoteInFile(abs, label.text)) {
          issues.push({
            gate: "evidence",
            lessonId: master.lessonId,
            message: `label "${label.text}" not found in ${label.source.path}`,
          });
        }
      }
    }
  }
  return issues;
}
