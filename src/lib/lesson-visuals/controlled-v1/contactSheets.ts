import { mkdirSync, writeFileSync } from "node:fs";
import { relative } from "node:path";
import { ARTIFACTS_CONTACT_SHEETS_DIR, ARTIFACTS_ROOT } from "./paths";
import type { CellReceipt, RunnerMode } from "./types";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const STATUS_COLORS: Record<string, string> = {
  ACCEPTED: "#1b7f3c",
  FAILED: "#c1272d",
  BLOCKED_UNRESOLVED_SPEC: "#8a6d00",
  PENDING: "#666666",
};

/**
 * Generates an HTML contact sheet for a run: one card per cell, with an
 * embedded <img> for ACCEPTED cells (relative path to the PNG) and a status
 * badge otherwise. No PNG-montage image library is available in this repo
 * (no sharp/canvas/resvg — see package.json), so the contact sheet is HTML,
 * not a single flattened raster montage.
 */
export function generateContactSheetHtml(mode: RunnerMode, receipts: CellReceipt[]): string {
  const rows = receipts
    .map((r) => {
      const color = STATUS_COLORS[r.status] ?? "#333333";
      const imgRel = r.artifactPath
        ? relative(ARTIFACTS_CONTACT_SHEETS_DIR, r.artifactPath).replace(/\\/g, "/")
        : null;
      const body = imgRel
        ? `<img src="${escapeHtml(imgRel)}" width="320" height="180" loading="lazy" />`
        : `<div class="placeholder" style="border-color:${color}">${escapeHtml(r.status)}</div>`;
      return `<div class="card">
        <div class="card-body">${body}</div>
        <div class="card-meta">
          <div class="cell-id">${escapeHtml(r.cellId)}</div>
          <div class="status" style="color:${color}">${escapeHtml(r.status)}</div>
          <div class="reason">${escapeHtml(r.reason ?? "")}</div>
        </div>
      </div>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>controlled-v1 contact sheet — ${escapeHtml(mode)}</title>
<style>
  body { font-family: system-ui, sans-serif; background: #f4f5f7; margin: 0; padding: 24px; }
  h1 { font-size: 18px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
  .card { background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
  .card-body { background: #eee; display: flex; align-items: center; justify-content: center; min-height: 180px; }
  .placeholder { border: 3px dashed; padding: 24px; font-weight: 600; }
  .card-meta { padding: 10px 12px; font-size: 12px; }
  .cell-id { font-weight: 700; margin-bottom: 4px; }
  .status { font-weight: 700; text-transform: uppercase; }
  .reason { color: #555; margin-top: 4px; word-break: break-word; }
</style>
</head>
<body>
  <h1>controlled-v1 contact sheet — mode: ${escapeHtml(mode)} — ${receipts.length} cell(s)</h1>
  <div class="grid">
${rows}
  </div>
</body>
</html>`;
}

export function writeContactSheet(mode: RunnerMode, receipts: CellReceipt[]): string {
  mkdirSync(ARTIFACTS_CONTACT_SHEETS_DIR, { recursive: true });
  const path = `${ARTIFACTS_CONTACT_SHEETS_DIR}/${mode}-contact-sheet.html`;
  writeFileSync(path, generateContactSheetHtml(mode, receipts), "utf8");

  // Per-locale sheets + four-locale comparison for the side-by-side lesson.
  const locales = ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const;
  for (const locale of locales) {
    const subset = receipts.filter((r) => r.locale === locale);
    if (subset.length === 0) continue;
    writeFileSync(
      `${ARTIFACTS_CONTACT_SHEETS_DIR}/${mode}-contact-sheet-${locale}.html`,
      generateContactSheetHtml(mode, subset),
      "utf8",
    );
  }
  const fourLocaleLessons = ["intro-m1-l4-ai-can-cannot", "builder-m6-l3-first-prompt-to-lovable"];
  for (const fourLocaleLesson of fourLocaleLessons) {
    const four = locales
      .map((locale) => receipts.find((r) => r.lessonId === fourLocaleLesson && r.locale === locale))
      .filter((r): r is CellReceipt => Boolean(r));
    if (four.length === 4) {
      writeFileSync(
        `${ARTIFACTS_CONTACT_SHEETS_DIR}/${mode}-four-locale-${fourLocaleLesson}.html`,
        generateContactSheetHtml(mode, four),
        "utf8",
      );
    }
  }
  return path;
}

export { ARTIFACTS_ROOT };
