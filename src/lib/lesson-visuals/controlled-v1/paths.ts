import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));

/** src/lib/lesson-visuals/controlled-v1 -> repo root (4 levels up). */
export const REPO_ROOT = resolve(MODULE_DIR, "../../../..");

export const DOCS_CONTROLLED_V1 = resolve(REPO_ROOT, "docs/lesson-visuals/controlled-v1");
export const DOCS_CONTROLLED_V1_INPUTS = resolve(DOCS_CONTROLLED_V1, "inputs");
export const DOCS_CONTROLLED_V1_GOLDEN = resolve(DOCS_CONTROLLED_V1, "golden");
export const DOCS_CONTROLLED_V1_RIGHTS = resolve(DOCS_CONTROLLED_V1, "rights");
export const DOCS_CONTROLLED_V1_CAPTURE = resolve(DOCS_CONTROLLED_V1, "capture");

export const CLASSIFICATION_PROVENANCE_PATH = resolve(
  DOCS_CONTROLLED_V1,
  "classification-provenance.json",
);
export const CLASSIFICATION_100_PATH = resolve(DOCS_CONTROLLED_V1, "classification-100.json");
export const GOLDEN_REFERENCES_PATH = resolve(DOCS_CONTROLLED_V1, "golden-references.json");
export const MEDIA_MAP_COPY_PATH = resolve(DOCS_CONTROLLED_V1_INPUTS, "ar-eg-media-map.md");
export const RIGHTS_LEDGER_PATH = resolve(DOCS_CONTROLLED_V1_RIGHTS, "ledger.json");
export const CAPTURE_LEDGER_PATH = resolve(DOCS_CONTROLLED_V1_CAPTURE, "ledger.json");

export const PRODUCTION_MANIFEST_PATH = resolve(DOCS_CONTROLLED_V1, "PRODUCTION_MANIFEST.json");
export const PILOT_MANIFEST_PATH = resolve(DOCS_CONTROLLED_V1, "PILOT_MANIFEST.json");
export const UNRESOLVED_LEDGER_PATH = resolve(DOCS_CONTROLLED_V1, "UNRESOLVED_LEDGER.json");

/** External (out-of-git) authoring inputs. Only used by local regeneration; never required in CI. */
export const EXTERNAL_MEDIA_MAP_DIR = "E:/Masaarat/Worktrees/_external-audits/ar-eg-100-media-map";
export const EXTERNAL_MEDIA_MAP_MD_PATH = `${EXTERNAL_MEDIA_MAP_DIR}/ar-eg-media-map.md`;
export const EXTERNAL_RECONCILE_RESULT_PATH = `${EXTERNAL_MEDIA_MAP_DIR}/_reconcile-result.json`;

export const ARTIFACTS_ROOT = resolve(REPO_ROOT, "artifacts/controlled-v1");
export const ARTIFACTS_CELLS_DIR = resolve(ARTIFACTS_ROOT, "cells");
export const ARTIFACTS_RECEIPTS_DIR = resolve(ARTIFACTS_ROOT, "receipts");
export const ARTIFACTS_PROVENANCE_DIR = resolve(ARTIFACTS_ROOT, "provenance");
export const ARTIFACTS_REPORTS_DIR = resolve(ARTIFACTS_ROOT, "reports");
export const ARTIFACTS_CONTACT_SHEETS_DIR = resolve(ARTIFACTS_ROOT, "contact-sheets");
export const ARTIFACTS_STATE_DIR = resolve(ARTIFACTS_ROOT, "state");
export const CONTROLLED_FAILURE_STATE_PATH = resolve(
  ARTIFACTS_STATE_DIR,
  "controlled-failure-state.json",
);

export const LOCALE_LESSONS_DIR = resolve(REPO_ROOT, "src/lib/locale-lessons");
export const AR_EG_LESSON_TS_DIR = resolve(REPO_ROOT, "src/components/intro/lessons");

/** cellId shape: {lessonId}__{locale}. No path separators — safe to use as a filename stem. */
const CELL_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)+__(?:ar-EG|ar-MSA|ar-Gulf|en)$/;

export function assertSafeCellId(cellId: string): string {
  const id = (cellId ?? "").trim();
  if (!id) throw new Error("cellId missing");
  if (id.includes("..") || id.includes("/") || id.includes("\\") || id.includes("\0")) {
    throw new Error(`unsafe cellId path characters: ${id}`);
  }
  if (!CELL_ID_RE.test(id)) {
    throw new Error(`cellId failed safety/shape validation: ${id}`);
  }
  return id;
}

export function cellId(lessonId: string, locale: string): string {
  return `${lessonId}__${locale}`;
}

export function cellArtifactDir(cid: string): string {
  const safe = assertSafeCellId(cid);
  return resolve(ARTIFACTS_CELLS_DIR, safe);
}

export function cellFinalPngPath(cid: string): string {
  return resolve(cellArtifactDir(cid), "final.png");
}

export function cellReceiptPath(mode: string, cid: string): string {
  const safe = assertSafeCellId(cid);
  const safeMode = mode.replace(/[^a-z0-9-]/gi, "_");
  return resolve(ARTIFACTS_RECEIPTS_DIR, safeMode, `${safe}.receipt.json`);
}
