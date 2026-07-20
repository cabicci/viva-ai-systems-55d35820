import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import type { LessonVisualMaster } from "../types";
import { LOCALES } from "../types";
import {
  MASTERS_DIR,
  isBannedLabel,
  loadJson,
  type ValidationIssue,
} from "./shared";

export function validateGenericLabelBan(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const files = readdirSync(MASTERS_DIR).filter((f) =>
    f.endsWith(".master.json"),
  );

  for (const f of files) {
    const master = loadJson<LessonVisualMaster>(resolve(MASTERS_DIR, f));
    for (const locale of LOCALES) {
      const labels = master.labelPacks[locale] ?? [];
      if (labels.length === 0) {
        issues.push({
          gate: "genericLabelBan",
          lessonId: master.lessonId,
          message: `empty label pack for ${locale}`,
        });
      }
      for (const label of labels) {
        if (isBannedLabel(label.text)) {
          issues.push({
            gate: "genericLabelBan",
            lessonId: master.lessonId,
            message: `banned/empty label in ${locale}: "${label.text}"`,
          });
        }
      }
      const cmp = master.contentBrief.comparison[locale];
      for (const t of [
        cmp.leftLabel,
        cmp.rightLabel,
      ]) {
        if (isBannedLabel(t)) {
          issues.push({
            gate: "genericLabelBan",
            lessonId: master.lessonId,
            message: `banned comparison label in ${locale}: "${t}"`,
          });
        }
      }
    }
  }
  return issues;
}
