import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import type { LessonVisualMaster } from "../types";
import { LOCALES } from "../types";
import {
  MASTERS_DIR,
  canonicalJson,
  loadJson,
  type ValidationIssue,
} from "./shared";

/**
 * Template similarity audit.
 * Fails only when two masters share an identical complete brief fingerprint
 * (compositionPattern + all label texts) without duplicationJustification.
 */
export function validateTemplateSimilarity(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const files = readdirSync(MASTERS_DIR).filter((f) =>
    f.endsWith(".master.json"),
  );
  const masters = files.map((f) =>
    loadJson<LessonVisualMaster>(resolve(MASTERS_DIR, f)),
  );

  const byFingerprint = new Map<string, LessonVisualMaster[]>();
  for (const m of masters) {
    const labelBlob = LOCALES.map((loc) =>
      m.labelPacks[loc].map((l) => l.text).join("|"),
    ).join("||");
    const fp = `${m.compositionPattern}::${labelBlob}`;
    const list = byFingerprint.get(fp) ?? [];
    list.push(m);
    byFingerprint.set(fp, list);
  }

  for (const [, group] of byFingerprint) {
    if (group.length < 2) continue;
    for (const m of group) {
      if (!m.duplicationJustification || m.duplicationJustification.length < 12) {
        issues.push({
          gate: "templateSimilarity",
          lessonId: m.lessonId,
          message: `identical complete brief shared with ${group
            .map((g) => g.lessonId)
            .filter((id) => id !== m.lessonId)
            .join(", ")} without duplicationJustification`,
        });
      }
    }
  }

  // Soft report: shared compositionPattern counts (non-failing metadata via console)
  const patternCounts = new Map<string, number>();
  for (const m of masters) {
    patternCounts.set(
      m.compositionPattern,
      (patternCounts.get(m.compositionPattern) ?? 0) + 1,
    );
  }
  const report = Object.fromEntries(patternCounts);
  // Attach as informational only — do not fail
  void report;
  void canonicalJson;

  return issues;
}

export function templateSimilarityReport(): Record<string, number> {
  const files = readdirSync(MASTERS_DIR).filter((f) =>
    f.endsWith(".master.json"),
  );
  const patternCounts = new Map<string, number>();
  for (const f of files) {
    const m = loadJson<LessonVisualMaster>(resolve(MASTERS_DIR, f));
    patternCounts.set(
      m.compositionPattern,
      (patternCounts.get(m.compositionPattern) ?? 0) + 1,
    );
  }
  return Object.fromEntries(patternCounts);
}
