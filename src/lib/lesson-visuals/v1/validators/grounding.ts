/**
 * Grounding gate — package checksums, meaningful briefs, claim quotes, locale labels.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { LessonVisualMaster, Locale } from "../types";
import {
  BANNED_GENERIC_LABELS,
  LOCALES,
  MIN_MEANINGFUL_BRIEF_CHARS,
} from "../types";
import {
  MASTERS_DIR,
  REPO_ROOT,
  loadJson,
  quoteInFile,
  type ValidationIssue,
} from "./shared";

const LEDGER_PATH = resolve(
  REPO_ROOT,
  "docs/lesson-visuals/v1/ledgers/grounding_audit.json",
);

function fileSha256(absPath: string): string {
  const bytes = readFileSync(absPath);
  return createHash("sha256").update(bytes).digest("hex");
}

function isThin(text: string | undefined): boolean {
  const t = (text ?? "").trim();
  if (t.length < MIN_MEANINGFUL_BRIEF_CHARS) return true;
  const bannedExact = (BANNED_GENERIC_LABELS as readonly string[]).some(
    (b) => b.toLowerCase() === t.toLowerCase(),
  );
  if (bannedExact) return true;
  // Single token / chrome stubs
  if (/^[A-Za-z]{1,12}:?$/.test(t)) return true;
  return false;
}

function containsBannedChrome(text: string): boolean {
  const t = text.trim();
  return (BANNED_GENERIC_LABELS as readonly string[]).some(
    (b) => b.toLowerCase() === t.toLowerCase(),
  );
}

export function validateGrounding(
  options: { writeAuditLedger?: boolean } = { writeAuditLedger: false },
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!existsSync(MASTERS_DIR)) {
    return [{ gate: "grounding", message: `masters dir missing: ${MASTERS_DIR}` }];
  }

  const files = readdirSync(MASTERS_DIR).filter((f) => f.endsWith(".master.json"));
  const auditEntries: Array<Record<string, unknown>> = [];
  const coreIdeaEnCounts = new Map<string, string[]>();
  const purposeEnCounts = new Map<string, string[]>();

  for (const f of files) {
    const master = loadJson<LessonVisualMaster>(resolve(MASTERS_DIR, f));
    const id = master.lessonId;
    let passed = true;
    const packageChecksums: Record<string, string> = {};

    if (!master.packageChecksums) {
      issues.push({
        gate: "grounding",
        lessonId: id,
        message: "packageChecksums missing",
      });
      passed = false;
    }

    for (const locale of LOCALES) {
      const sp = master.sourcePackages?.[locale];
      if (!sp?.path) {
        issues.push({
          gate: "grounding",
          lessonId: id,
          message: `sourcePackages.${locale} path missing`,
        });
        passed = false;
        continue;
      }
      const abs = resolve(REPO_ROOT, sp.path);
      if (!existsSync(abs)) {
        issues.push({
          gate: "grounding",
          lessonId: id,
          message: `package path missing: ${sp.path}`,
        });
        passed = false;
        continue;
      }
      const actual = fileSha256(abs);
      packageChecksums[locale] = actual;
      const expected = master.packageChecksums?.[locale];
      if (!expected || expected !== actual) {
        issues.push({
          gate: "grounding",
          lessonId: id,
          message: `packageChecksums.${locale} mismatch (expected ${expected}, actual ${actual})`,
        });
        passed = false;
      }
    }

    const cb = master.contentBrief;
    if (!cb) {
      issues.push({ gate: "grounding", lessonId: id, message: "contentBrief missing" });
      passed = false;
    } else {
      for (const locale of LOCALES) {
        if (isThin(cb.coreIdea?.[locale])) {
          issues.push({
            gate: "grounding",
            lessonId: id,
            message: `coreIdea.${locale} too thin or banned: "${cb.coreIdea?.[locale] ?? ""}"`,
          });
          passed = false;
        }
        if (isThin(cb.instructionalPurpose?.[locale])) {
          issues.push({
            gate: "grounding",
            lessonId: id,
            message: `instructionalPurpose.${locale} too thin or missing`,
          });
          passed = false;
        }
        if (!master.altTexts?.[locale] || master.altTexts[locale].trim().length < 8) {
          issues.push({
            gate: "grounding",
            lessonId: id,
            message: `altTexts.${locale} missing or too short`,
          });
          passed = false;
        }
        const labels = master.labelPacks?.[locale] ?? [];
        if (labels.length < 2) {
          issues.push({
            gate: "grounding",
            lessonId: id,
            message: `labelPacks.${locale} needs >=2 labels`,
          });
          passed = false;
        }
        for (const label of labels) {
          if (containsBannedChrome(label.text)) {
            issues.push({
              gate: "grounding",
              lessonId: id,
              message: `banned generic label in ${locale}: "${label.text}"`,
            });
            passed = false;
          }
        }
      }

      if (!Array.isArray(cb.lessonObjects) || cb.lessonObjects.length < 2) {
        issues.push({
          gate: "grounding",
          lessonId: id,
          message: "lessonObjects must have >=2 items",
        });
        passed = false;
      }
      if (!Array.isArray(cb.relationships) || cb.relationships.length < 1) {
        issues.push({
          gate: "grounding",
          lessonId: id,
          message: "relationships must be non-empty",
        });
        passed = false;
      }

      const coreEn = (cb.coreIdea?.en ?? "").trim();
      const purposeEn = (cb.instructionalPurpose?.en ?? "").trim();
      if (coreEn) {
        const arr = coreIdeaEnCounts.get(coreEn) ?? [];
        arr.push(id);
        coreIdeaEnCounts.set(coreEn, arr);
      }
      if (purposeEn) {
        const arr = purposeEnCounts.get(purposeEn) ?? [];
        arr.push(id);
        purposeEnCounts.set(purposeEn, arr);
      }
    }

    for (const claim of master.factualClaims ?? []) {
      const abs = resolve(REPO_ROOT, claim.path);
      if (!quoteInFile(abs, claim.quote)) {
        issues.push({
          gate: "grounding",
          lessonId: id,
          message: `factualClaim quote not found in ${claim.path}: "${claim.quote}"`,
        });
        passed = false;
      }
    }

    auditEntries.push({
      lessonId: id,
      passed,
      packageChecksums,
      method: master.method,
      coreIdeaEnLen: (cb?.coreIdea?.en ?? "").length,
      instructionalPurposeEnLen: (cb?.instructionalPurpose?.en ?? "").length,
      lessonObjectCount: cb?.lessonObjects?.length ?? 0,
      relationshipCount: cb?.relationships?.length ?? 0,
      factualClaimCount: master.factualClaims?.length ?? 0,
    });
  }

  for (const [text, ids] of coreIdeaEnCounts) {
    if (ids.length >= 5) {
      for (const id of ids) {
        const master = loadJson<LessonVisualMaster>(
          resolve(MASTERS_DIR, `${id}.master.json`),
        );
        if (!master.duplicationJustification) {
          issues.push({
            gate: "grounding",
            lessonId: id,
            message: `coreIdea.en identical across ${ids.length} lessons without duplicationJustification`,
          });
        }
      }
    }
  }
  for (const [text, ids] of purposeEnCounts) {
    if (ids.length >= 5) {
      for (const id of ids) {
        const master = loadJson<LessonVisualMaster>(
          resolve(MASTERS_DIR, `${id}.master.json`),
        );
        if (!master.duplicationJustification) {
          issues.push({
            gate: "grounding",
            lessonId: id,
            message: `instructionalPurpose.en identical across ${ids.length} lessons without duplicationJustification`,
          });
        }
      }
    }
  }

  const allPassed = issues.filter((i) => i.gate === "grounding").length === 0 && files.length === 100;
  // Recompute passed flags after cross-lesson checks
  const failedIds = new Set(
    issues.filter((i) => i.gate === "grounding" && i.lessonId).map((i) => i.lessonId!),
  );
  for (const entry of auditEntries) {
    if (failedIds.has(entry.lessonId as string)) entry.passed = false;
  }

  if (options.writeAuditLedger !== false) {
    const ledger = {
      ledgerVersion: "lesson-visuals-grounding-audit/v1",
      generatedAt: new Date().toISOString(),
      mastersAudited: files.length,
      allPassed: failedIds.size === 0 && files.length === 100,
      minMeaningfulChars: MIN_MEANINGFUL_BRIEF_CHARS,
      entries: auditEntries.sort((a, b) =>
        String(a.lessonId).localeCompare(String(b.lessonId)),
      ),
    };
    writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2) + "\n", "utf8");
  }

  if (files.length !== 100) {
    issues.push({
      gate: "grounding",
      message: `expected 100 masters, found ${files.length}`,
    });
  }

  return issues;
}

export { LEDGER_PATH as GROUNDING_AUDIT_PATH };
