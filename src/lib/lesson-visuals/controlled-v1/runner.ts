import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname } from "node:path";
import {
  buildProductionManifest,
  buildPilotManifest,
  buildUnresolvedLedger,
  writeJson,
} from "./buildManifest";
import { FULL_400_CONFIRM_TOKEN } from "./constants";
import {
  getControlledFailureState,
  markControlledFailureTriggered,
  resetControlledFailureState,
  shouldInjectControlledFailure,
} from "./controlledFailure";
import { loadClassification100, validateClassification100 } from "./loadClassification";
import { allGoldenReferencesOk, loadGoldenReferences, verifyGoldenReferences } from "./goldenRefs";
import {
  ARTIFACTS_RECEIPTS_DIR,
  ARTIFACTS_REPORTS_DIR,
  cellFinalPngPath,
  cellReceiptPath,
} from "./paths";
import { runAuthorizedExternalRoute } from "./routes/authorizedExternal";
import { runMasaaratScreenshotRoute } from "./routes/masaaratScreenshot";
import { generateInstructionalComposition } from "./routes/instructionalComposition";
import type { CellReceipt, ManifestCell, ProductionManifest, RunnerMode } from "./types";
import { validateProductionManifest } from "./validateManifest";

function sha256HexOfBuffer(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex").toUpperCase();
}

function writeReceipt(receipt: CellReceipt): void {
  const path = cellReceiptPath(receipt.mode, receipt.cellId);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
}

export function runCell(cell: ManifestCell, mode: RunnerMode): CellReceipt {
  const producedAt = new Date().toISOString();

  if (cell.route === "MASAARAT_SCREENSHOT") {
    const result = runMasaaratScreenshotRoute(cell.lessonId, cell.locale);
    return {
      receiptVersion: "controlled-v1-receipt/1",
      cellId: cell.cellId,
      lessonId: cell.lessonId,
      locale: cell.locale,
      route: cell.route,
      mode,
      status: result.status,
      reason: result.reason,
      artifactPath: null,
      artifactSha256: null,
      bytesWritten: null,
      controlledFailureInjected: false,
      producedAt,
    };
  }

  if (cell.route === "AUTHORIZED_EXTERNAL_SCREENSHOT") {
    const result = runAuthorizedExternalRoute(cell.lessonId, cell.locale);
    return {
      receiptVersion: "controlled-v1-receipt/1",
      cellId: cell.cellId,
      lessonId: cell.lessonId,
      locale: cell.locale,
      route: cell.route,
      mode,
      status: result.status,
      reason: result.reason,
      artifactPath: null,
      artifactSha256: null,
      bytesWritten: null,
      controlledFailureInjected: false,
      producedAt,
    };
  }

  // INSTRUCTIONAL_COMPOSITION
  const inject = shouldInjectControlledFailure(mode, cell.cellId);
  if (inject) {
    markControlledFailureTriggered(cell.cellId);
    return {
      receiptVersion: "controlled-v1-receipt/1",
      cellId: cell.cellId,
      lessonId: cell.lessonId,
      locale: cell.locale,
      route: cell.route,
      mode,
      status: "FAILED",
      reason: "CONTROLLED_FAILURE_INJECTED (pilot-only, first pilot run)",
      artifactPath: null,
      artifactSha256: null,
      bytesWritten: null,
      controlledFailureInjected: true,
      producedAt,
    };
  }

  try {
    const result = generateInstructionalComposition({
      lessonId: cell.lessonId,
      locale: cell.locale,
      position: cell.position,
      title: cell.title,
    });
    const outPath = cellFinalPngPath(cell.cellId);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, result.png);
    return {
      receiptVersion: "controlled-v1-receipt/1",
      cellId: cell.cellId,
      lessonId: cell.lessonId,
      locale: cell.locale,
      route: cell.route,
      mode,
      status: "ACCEPTED",
      reason: null,
      artifactPath: outPath,
      artifactSha256: sha256HexOfBuffer(result.png),
      bytesWritten: result.png.length,
      controlledFailureInjected: false,
      producedAt,
    };
  } catch (err) {
    return {
      receiptVersion: "controlled-v1-receipt/1",
      cellId: cell.cellId,
      lessonId: cell.lessonId,
      locale: cell.locale,
      route: cell.route,
      mode,
      status: "FAILED",
      reason: err instanceof Error ? err.message : String(err),
      artifactPath: null,
      artifactSha256: null,
      bytesWritten: null,
      controlledFailureInjected: false,
      producedAt,
    };
  }
}

export interface RunResult {
  mode: RunnerMode;
  ok: boolean;
  summary: string;
  receipts: CellReceipt[];
  errors: string[];
}

function writeRunReport(mode: RunnerMode, payload: unknown): string {
  const path = `${ARTIFACTS_REPORTS_DIR}/${mode}-report.json`;
  writeJson(path, payload);
  return path;
}

function receiptCounts(receipts: CellReceipt[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of receipts) counts[r.status] = (counts[r.status] ?? 0) + 1;
  return counts;
}

export function runPreflight(): RunResult {
  const errors: string[] = [];
  const classification = loadClassification100();
  const classificationCheck = validateClassification100(classification);
  errors.push(...classificationCheck.errors);

  const manifest = buildProductionManifest(classification);
  const manifestCheck = validateProductionManifest(manifest);
  errors.push(...manifestCheck.errors);

  const goldenResults = verifyGoldenReferences(loadGoldenReferences());
  const goldenOk = allGoldenReferencesOk(goldenResults);
  if (!goldenOk) {
    for (const r of goldenResults.filter((x) => !x.ok)) {
      errors.push(`golden reference failed: ${r.id} (${r.error})`);
    }
  }

  const report = {
    mode: "preflight" as const,
    generatedAt: new Date().toISOString(),
    classification: {
      ok: classificationCheck.ok,
      errors: classificationCheck.errors,
      counts: classification.counts,
    },
    manifest: { ok: manifestCheck.ok, errors: manifestCheck.errors, counts: manifest.counts },
    goldenReferences: { ok: goldenOk, results: goldenResults },
    ok: errors.length === 0,
  };
  writeRunReport("preflight", report);

  return {
    mode: "preflight",
    ok: errors.length === 0,
    summary: `preflight: classification=${classificationCheck.ok}, manifest=${manifestCheck.ok}, golden=${goldenOk}`,
    receipts: [],
    errors,
  };
}

export function runPilot(): RunResult {
  // Each pilot dispatch starts with a clean controlled-failure latch so the
  // intentional failure fires exactly once per pilot run.
  resetControlledFailureState();
  const classification = loadClassification100();
  const pilotManifest = buildPilotManifest(classification);
  const receipts = pilotManifest.cells.map((cell) => runCell(cell, "pilot"));
  for (const r of receipts) writeReceipt(r);

  writeJson(`${ARTIFACTS_RECEIPTS_DIR}/pilot/_summary.json`, {
    generatedAt: new Date().toISOString(),
    counts: receiptCounts(receipts),
    controlledFailureState: getControlledFailureState(),
    receipts,
  });

  writeRunReport("pilot", {
    generatedAt: new Date().toISOString(),
    counts: receiptCounts(receipts),
    controlledFailureState: getControlledFailureState(),
    cells: receipts.map((r) => ({ cellId: r.cellId, status: r.status, reason: r.reason })),
  });

  return {
    mode: "pilot",
    ok: true,
    summary: `pilot: ${receipts.length} cells, counts=${JSON.stringify(receiptCounts(receipts))}`,
    receipts,
    errors: [],
  };
}

export function runFull400(confirmToken: string | undefined): RunResult {
  if (confirmToken !== FULL_400_CONFIRM_TOKEN) {
    const msg = `full-400 requires confirm_full_400 === "${FULL_400_CONFIRM_TOKEN}" exactly; received ${JSON.stringify(confirmToken)}`;
    return { mode: "full-400", ok: false, summary: msg, receipts: [], errors: [msg] };
  }

  const classification = loadClassification100();
  const manifest = buildProductionManifest(classification);
  const manifestCheck = validateProductionManifest(manifest);
  if (!manifestCheck.ok) {
    return {
      mode: "full-400",
      ok: false,
      summary: "manifest validation failed; refusing to run full-400",
      receipts: [],
      errors: manifestCheck.errors,
    };
  }

  const receipts = manifest.cells.map((cell) => runCell(cell, "full-400"));
  for (const r of receipts) writeReceipt(r);

  const unresolvedLedger = buildUnresolvedLedger(manifest);
  writeJson(`${ARTIFACTS_RECEIPTS_DIR}/full-400/_summary.json`, {
    generatedAt: new Date().toISOString(),
    counts: receiptCounts(receipts),
    receipts,
  });
  writeRunReport("full-400", {
    generatedAt: new Date().toISOString(),
    confirmToken,
    counts: receiptCounts(receipts),
    unresolvedCount: unresolvedLedger.entries.length,
  });

  const anyControlledFailure = receipts.some((r) => r.controlledFailureInjected);

  return {
    mode: "full-400",
    ok: !anyControlledFailure,
    summary: `full-400: ${receipts.length} cells, counts=${JSON.stringify(receiptCounts(receipts))}`,
    receipts,
    errors: anyControlledFailure
      ? ["controlled failure was injected during full-400 — this must never happen"]
      : [],
  };
}

function collectAllReceipts(): CellReceipt[] {
  if (!existsSync(ARTIFACTS_RECEIPTS_DIR)) return [];
  const byMode = readdirSync(ARTIFACTS_RECEIPTS_DIR, { withFileTypes: true }).filter((d) =>
    d.isDirectory(),
  );
  const all: CellReceipt[] = [];
  for (const dirEntry of byMode) {
    const modeDir = `${ARTIFACTS_RECEIPTS_DIR}/${dirEntry.name}`;
    for (const file of readdirSync(modeDir)) {
      if (!file.endsWith(".receipt.json")) continue;
      try {
        const parsed = JSON.parse(readFileSync(`${modeDir}/${file}`, "utf8")) as CellReceipt;
        all.push(parsed);
      } catch {
        // ignore unreadable receipt
      }
    }
  }
  return all;
}

/**
 * Latest receipt per cellId (by producedAt), then only FAILED cells.
 * Successful ACCEPTED cells are never selected for failed-only rerun.
 */
export function selectFailedCellIdsFromReceipts(all: CellReceipt[]): string[] {
  const latestByCell = new Map<string, CellReceipt>();
  for (const r of all) {
    const existing = latestByCell.get(r.cellId);
    if (!existing || r.producedAt > existing.producedAt) latestByCell.set(r.cellId, r);
  }
  return [...latestByCell.values()]
    .filter((r) => r.status === "FAILED")
    .map((r) => r.cellId)
    .sort();
}

/** Reprocesses only cells whose latest known receipt has status FAILED. */
export function runFailedOnly(manifest: ProductionManifest = buildProductionManifest()): RunResult {
  const all = collectAllReceipts();
  const failedCellIds = selectFailedCellIdsFromReceipts(all);

  const cellsById = new Map(manifest.cells.map((c) => [c.cellId, c]));
  const toRerun = failedCellIds
    .map((id) => cellsById.get(id))
    .filter((c): c is ManifestCell => Boolean(c));

  const receipts = toRerun.map((cell) => runCell(cell, "failed-only"));
  for (const r of receipts) writeReceipt(r);

  writeJson(`${ARTIFACTS_RECEIPTS_DIR}/failed-only/_summary.json`, {
    generatedAt: new Date().toISOString(),
    rerunCellIds: failedCellIds,
    counts: receiptCounts(receipts),
    receipts,
  });
  writeRunReport("failed-only", {
    generatedAt: new Date().toISOString(),
    rerunCellIds: failedCellIds,
    counts: receiptCounts(receipts),
  });

  return {
    mode: "failed-only",
    ok: true,
    summary: `failed-only: reran ${receipts.length} previously FAILED cell(s)`,
    receipts,
    errors: [],
  };
}

export function runReportOnly(): RunResult {
  const all = collectAllReceipts();
  const latestByCell = new Map<string, CellReceipt>();
  for (const r of all) {
    const existing = latestByCell.get(r.cellId);
    if (!existing || r.producedAt > existing.producedAt) latestByCell.set(r.cellId, r);
  }
  const receipts = [...latestByCell.values()];

  const goldenResults = verifyGoldenReferences(loadGoldenReferences());

  const report = {
    generatedAt: new Date().toISOString(),
    totalKnownCellReceipts: receipts.length,
    counts: receiptCounts(receipts),
    goldenReferences: { ok: allGoldenReferencesOk(goldenResults), results: goldenResults },
  };
  writeRunReport("report-only", report);

  return {
    mode: "report-only",
    ok: true,
    summary: `report-only: ${receipts.length} known cell receipts, counts=${JSON.stringify(receiptCounts(receipts))}`,
    receipts,
    errors: [],
  };
}
