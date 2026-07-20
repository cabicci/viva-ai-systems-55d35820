import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import type { LessonVisualMaster } from "../types";
import {
  DOCS_V1,
  MASTERS_DIR,
  assertSourceExists,
  loadJson,
  verifyMasterChecksum,
  type ValidationIssue,
} from "./shared";

const REQUIRED_KEYS = [
  "schemaVersion",
  "lessonId",
  "pathId",
  "moduleId",
  "sourceSha",
  "titles",
  "sourcePackages",
  "contentBrief",
  "method",
  "methodRationale",
  "compositionPattern",
  "labelPacks",
  "altTexts",
  "factualClaims",
  "checksum",
] as const;

export function validateMasterSchema(
  master: LessonVisualMaster,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const id = master.lessonId ?? "?";

  if (master.schemaVersion !== "lesson-visual-master/v1") {
    issues.push({
      gate: "masterSchema",
      lessonId: id,
      message: `bad schemaVersion: ${master.schemaVersion}`,
    });
  }
  for (const k of REQUIRED_KEYS) {
    if ((master as Record<string, unknown>)[k] === undefined) {
      issues.push({
        gate: "masterSchema",
        lessonId: id,
        message: `missing required field: ${k}`,
      });
    }
  }
  if (![1, 2, 3, 4].includes(master.method)) {
    issues.push({
      gate: "masterSchema",
      lessonId: id,
      message: `invalid method: ${master.method}`,
    });
  }
  if (!/^[a-f0-9]{64}$/.test(master.checksum ?? "")) {
    issues.push({
      gate: "masterSchema",
      lessonId: id,
      message: "checksum must be 64 hex chars",
    });
  }
  if (!verifyMasterChecksum(master)) {
    issues.push({
      gate: "masterSchema",
      lessonId: id,
      message: "checksum mismatch vs canonical JSON",
    });
  }
  for (const err of assertSourceExists(master)) {
    issues.push({ gate: "masterSchema", lessonId: id, message: err });
  }
  return issues;
}

export function validateAllMasters(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!existsSync(MASTERS_DIR)) {
    return [
      {
        gate: "masterSchema",
        message: `masters dir missing: ${MASTERS_DIR}`,
      },
    ];
  }
  const files = readdirSync(MASTERS_DIR).filter((f) =>
    f.endsWith(".master.json"),
  );
  if (files.length !== 100) {
    issues.push({
      gate: "masterSchema",
      message: `expected 100 masters, found ${files.length}`,
    });
  }
  for (const f of files) {
    const master = loadJson<LessonVisualMaster>(resolve(MASTERS_DIR, f));
    issues.push(...validateMasterSchema(master));
  }
  // schema files must exist
  for (const name of [
    "master.schema.json",
    "manifest.schema.json",
    "receipt.schema.json",
  ]) {
    const p = resolve(DOCS_V1, "schemas", name);
    if (!existsSync(p)) {
      issues.push({ gate: "masterSchema", message: `missing schema ${name}` });
    }
  }
  return issues;
}
