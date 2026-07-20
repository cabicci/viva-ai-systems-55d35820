import { existsSync } from "node:fs";
import type { AuthorizedManifest, LessonVisualMaster } from "../types";
import { LOCALES } from "../types";
import {
  MANIFEST_PATH,
  MASTERS_DIR,
  loadJson,
  type ValidationIssue,
} from "./shared";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";

export function validateManifest(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!existsSync(MANIFEST_PATH)) {
    return [{ gate: "manifest", message: `missing ${MANIFEST_PATH}` }];
  }
  const manifest = loadJson<AuthorizedManifest>(MANIFEST_PATH);
  if (manifest.manifestVersion !== "lesson-visuals-authorized/v1") {
    issues.push({
      gate: "manifest",
      message: `bad manifestVersion: ${manifest.manifestVersion}`,
    });
  }
  if (manifest.lessonIds.length !== 100) {
    issues.push({
      gate: "manifest",
      message: `lessonIds length ${manifest.lessonIds.length} != 100`,
    });
  }
  if (manifest.cells.length !== 400) {
    issues.push({
      gate: "manifest",
      message: `cells length ${manifest.cells.length} != 400`,
    });
  }
  if (
    JSON.stringify(manifest.locales) !==
    JSON.stringify([...LOCALES])
  ) {
    issues.push({ gate: "manifest", message: "locales partition mismatch" });
  }
  if (
    manifest.counts.masters !== 100 ||
    manifest.counts.cells !== 400 ||
    manifest.counts.perLocale !== 100
  ) {
    issues.push({ gate: "manifest", message: "counts object incorrect" });
  }

  const cellIds = new Set<string>();
  const perLocale: Record<string, number> = {};
  for (const cell of manifest.cells) {
    if (cellIds.has(cell.cellId)) {
      issues.push({
        gate: "manifest",
        cellId: cell.cellId,
        message: "duplicate cellId",
      });
    }
    cellIds.add(cell.cellId);
    const expected = `${cell.lessonId}__${cell.locale}`;
    if (cell.cellId !== expected) {
      issues.push({
        gate: "manifest",
        cellId: cell.cellId,
        message: `cellId should be ${expected}`,
      });
    }
    perLocale[cell.locale] = (perLocale[cell.locale] ?? 0) + 1;
  }
  for (const loc of LOCALES) {
    if (perLocale[loc] !== 100) {
      issues.push({
        gate: "manifest",
        message: `locale ${loc} has ${perLocale[loc] ?? 0} cells, expected 100`,
      });
    }
  }

  // method on cell must match master
  const masterFiles = existsSync(MASTERS_DIR)
    ? readdirSync(MASTERS_DIR).filter((f) => f.endsWith(".master.json"))
    : [];
  const methods = new Map<string, number>();
  for (const f of masterFiles) {
    const m = loadJson<LessonVisualMaster>(resolve(MASTERS_DIR, f));
    methods.set(m.lessonId, m.method);
  }
  for (const cell of manifest.cells) {
    const m = methods.get(cell.lessonId);
    if (m !== undefined && m !== cell.method) {
      issues.push({
        gate: "manifest",
        cellId: cell.cellId,
        message: `method ${cell.method} != master method ${m}`,
      });
    }
  }

  return issues;
}
