import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { buildPilotManifest } from "./buildManifest";
import { loadClassification100 } from "./loadClassification";
import {
  ARTIFACTS_RECEIPTS_DIR,
  assertSafeCellId,
  cellFinalPngPath,
  cellReceiptPath,
} from "./paths";
import type { CellReceipt, PilotManifest } from "./types";

export interface ReconciliationPaths {
  receiptsRoot: string;
  cellPngPath: (cellId: string) => string;
  pilotReceiptPath: (cellId: string) => string;
  failedOnlyReceiptPath: (cellId: string) => string;
  pilotSummaryPath: string;
}

export function defaultReconciliationPaths(): ReconciliationPaths {
  return {
    receiptsRoot: ARTIFACTS_RECEIPTS_DIR,
    cellPngPath: cellFinalPngPath,
    pilotReceiptPath: (cellId) => cellReceiptPath("pilot", cellId),
    failedOnlyReceiptPath: (cellId) => cellReceiptPath("failed-only", cellId),
    pilotSummaryPath: join(ARTIFACTS_RECEIPTS_DIR, "pilot", "_summary.json"),
  };
}

export interface CanonicalPilotInventory {
  expected: number;
  unique: number;
  accepted: number;
  failed: number;
  missing: number;
  duplicate: number;
  unexpected: number;
  orderedCellIds: string[];
  missingCellIds: string[];
  unexpectedCellIds: string[];
  duplicateCellIds: string[];
  failedCellIds: string[];
}

export interface ReconciliationResult {
  ok: boolean;
  promotedCellIds: string[];
  noopCellIds: string[];
  errors: string[];
  inventory: CanonicalPilotInventory;
}

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex").toUpperCase();
}

/** Atomic text write: temp in same directory, then rename. */
export function atomicWriteTextFile(destPath: string, contents: string): void {
  mkdirSync(dirname(destPath), { recursive: true });
  const tmp = join(
    dirname(destPath),
    `.${createHash("sha256").update(destPath).digest("hex").slice(0, 12)}.tmp`,
  );
  writeFileSync(tmp, contents, "utf8");
  renameSync(tmp, destPath);
}

export function serializeReceipt(receipt: CellReceipt): string {
  return `${JSON.stringify(receipt, null, 2)}\n`;
}

export function readReceiptFile(path: string): CellReceipt {
  const raw = readFileSync(path, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`malformed receipt JSON: ${path}`);
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`malformed receipt object: ${path}`);
  }
  return parsed as CellReceipt;
}

function validateRecoveredReceiptShape(receipt: CellReceipt, path: string): string[] {
  const errors: string[] = [];
  if (receipt.receiptVersion !== "controlled-v1-receipt/1") {
    errors.push(`${path}: invalid receiptVersion`);
  }
  if (!receipt.cellId || typeof receipt.cellId !== "string") {
    errors.push(`${path}: missing cellId`);
  }
  if (!receipt.lessonId || typeof receipt.lessonId !== "string") {
    errors.push(`${path}: missing lessonId`);
  }
  if (!receipt.locale || typeof receipt.locale !== "string") {
    errors.push(`${path}: missing locale`);
  }
  if (!receipt.status || typeof receipt.status !== "string") {
    errors.push(`${path}: missing status`);
  }
  if (receipt.producedAt == null || typeof receipt.producedAt !== "string") {
    errors.push(`${path}: missing producedAt`);
  }
  return errors;
}

function semanticAcceptedEqual(a: CellReceipt, b: CellReceipt): boolean {
  return (
    a.cellId === b.cellId &&
    a.lessonId === b.lessonId &&
    a.locale === b.locale &&
    a.status === "ACCEPTED" &&
    b.status === "ACCEPTED" &&
    a.route === b.route &&
    (a.artifactSha256 ?? null) === (b.artifactSha256 ?? null) &&
    (a.bytesWritten ?? null) === (b.bytesWritten ?? null)
  );
}

/**
 * Returns every failed-only receipt file whose parsed cellId matches, plus the
 * canonical primary path `failed-only/<cellId>.receipt.json`.
 */
export function listFailedOnlyRecoveryReceiptPaths(
  cellId: string,
  paths: ReconciliationPaths = defaultReconciliationPaths(),
): string[] {
  const safe = assertSafeCellId(cellId);
  const dir = join(paths.receiptsRoot, "failed-only");
  if (!existsSync(dir)) return [];

  const matches: string[] = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".receipt.json")) continue;
    const path = join(dir, f);
    try {
      const receipt = readReceiptFile(path);
      if (receipt.cellId === safe) matches.push(path);
    } catch {
      // Ignore unreadable files for listing; malformed primary is handled later.
      if (f === `${safe}.receipt.json`) matches.push(path);
    }
  }
  return matches;
}

export function inventoryCanonicalPilotReceipts(
  pilotManifest: PilotManifest,
  paths: ReconciliationPaths = defaultReconciliationPaths(),
): CanonicalPilotInventory {
  const expectedIds = pilotManifest.cells.map((c) => c.cellId);
  const expectedSet = new Set(expectedIds);
  const pilotDir = join(paths.receiptsRoot, "pilot");
  const files = existsSync(pilotDir)
    ? readdirSync(pilotDir).filter((f) => f.endsWith(".receipt.json"))
    : [];

  const byId = new Map<string, CellReceipt[]>();
  const unexpectedCellIds: string[] = [];
  for (const f of files) {
    const path = join(pilotDir, f);
    let receipt: CellReceipt;
    try {
      receipt = readReceiptFile(path);
    } catch {
      unexpectedCellIds.push(f);
      continue;
    }
    if (!expectedSet.has(receipt.cellId)) {
      unexpectedCellIds.push(receipt.cellId);
      continue;
    }
    const list = byId.get(receipt.cellId) ?? [];
    list.push(receipt);
    byId.set(receipt.cellId, list);
  }

  const duplicateCellIds = [...byId.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([id]) => id);
  const missingCellIds = expectedIds.filter((id) => !byId.has(id));
  const failedCellIds: string[] = [];
  let accepted = 0;
  let failed = 0;
  for (const id of expectedIds) {
    const list = byId.get(id);
    if (!list || list.length !== 1) continue;
    if (list[0]!.status === "ACCEPTED") accepted += 1;
    else if (list[0]!.status === "FAILED") {
      failed += 1;
      failedCellIds.push(id);
    }
  }

  return {
    expected: expectedIds.length,
    unique: byId.size,
    accepted,
    failed,
    missing: missingCellIds.length,
    duplicate: duplicateCellIds.length,
    unexpected: unexpectedCellIds.length,
    orderedCellIds: expectedIds,
    missingCellIds,
    unexpectedCellIds,
    duplicateCellIds,
    failedCellIds,
  };
}

export function rebuildCanonicalPilotSummary(
  pilotManifest: PilotManifest,
  paths: ReconciliationPaths = defaultReconciliationPaths(),
): CanonicalPilotInventory {
  const inventory = inventoryCanonicalPilotReceipts(pilotManifest, paths);
  const receipts: CellReceipt[] = [];
  for (const cell of pilotManifest.cells) {
    const path = paths.pilotReceiptPath(cell.cellId);
    if (!existsSync(path)) continue;
    receipts.push(readReceiptFile(path));
  }
  const counts: Record<string, number> = {};
  for (const r of receipts) counts[r.status] = (counts[r.status] ?? 0) + 1;

  const summary = {
    generatedAt: new Date().toISOString(),
    counts,
    reconciliation: {
      expected: inventory.expected,
      unique: inventory.unique,
      accepted: inventory.accepted,
      failed: inventory.failed,
      missing: inventory.missing,
      duplicate: inventory.duplicate,
      unexpected: inventory.unexpected,
    },
    controlledFailureState: null,
    receipts,
  };
  atomicWriteTextFile(paths.pilotSummaryPath, `${JSON.stringify(summary, null, 2)}\n`);
  return inventory;
}

function assertFinalInventory(inventory: CanonicalPilotInventory): string[] {
  const errors: string[] = [];
  if (inventory.expected !== 12)
    errors.push(`expected pilot cells must be 12, got ${inventory.expected}`);
  if (inventory.unique !== 12)
    errors.push(`unique canonical receipts must be 12, got ${inventory.unique}`);
  if (inventory.accepted !== 12) errors.push(`ACCEPTED must be 12, got ${inventory.accepted}`);
  if (inventory.failed !== 0) {
    errors.push(`FAILED must be 0, got ${inventory.failed} (${inventory.failedCellIds.join(",")})`);
  }
  if (inventory.missing !== 0) {
    errors.push(
      `missing must be 0, got ${inventory.missing} (${inventory.missingCellIds.join(",")})`,
    );
  }
  if (inventory.duplicate !== 0) {
    errors.push(
      `duplicate must be 0, got ${inventory.duplicate} (${inventory.duplicateCellIds.join(",")})`,
    );
  }
  if (inventory.unexpected !== 0) {
    errors.push(
      `unexpected must be 0, got ${inventory.unexpected} (${inventory.unexpectedCellIds.join(",")})`,
    );
  }
  return errors;
}

/**
 * After failed-only renders ACCEPTED recoveries, promote them into the canonical
 * pilot receipt namespace and rebuild receipts/pilot/_summary.json to 12/0.
 */
export function reconcileFailedOnlyIntoPilot(options: {
  recoveredCellIds: string[];
  pilotManifest?: PilotManifest;
  paths?: ReconciliationPaths;
}): ReconciliationResult {
  const errors: string[] = [];
  const promotedCellIds: string[] = [];
  const noopCellIds: string[] = [];
  const paths = options.paths ?? defaultReconciliationPaths();
  const pilotManifest = options.pilotManifest ?? buildPilotManifest(loadClassification100());
  const pilotById = new Map(pilotManifest.cells.map((c) => [c.cellId, c]));
  const pilotIdSet = new Set(pilotManifest.cells.map((c) => c.cellId));

  for (const cellId of options.recoveredCellIds) {
    try {
      assertSafeCellId(cellId);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
      continue;
    }

    if (!pilotIdSet.has(cellId)) {
      errors.push(`non-pilot cell selected for reconciliation: ${cellId}`);
      continue;
    }
    const manifestCell = pilotById.get(cellId)!;

    const recoveryPath = resolve(paths.failedOnlyReceiptPath(cellId));
    if (!existsSync(recoveryPath)) {
      errors.push(`missing recovery receipt for ${cellId}`);
      continue;
    }

    const contentMatches = listFailedOnlyRecoveryReceiptPaths(cellId, paths).map((p) => resolve(p));
    if (contentMatches.length > 1) {
      errors.push(`duplicate recovery receipts for ${cellId}`);
      continue;
    }

    let recovered: CellReceipt;
    try {
      recovered = readReceiptFile(recoveryPath);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
      continue;
    }

    const shapeErrors = validateRecoveredReceiptShape(recovered, recoveryPath);
    errors.push(...shapeErrors);
    if (shapeErrors.length > 0) continue;

    if (recovered.cellId !== cellId) {
      errors.push(`mismatched cellId in recovery: expected ${cellId}, got ${recovered.cellId}`);
      continue;
    }
    if (recovered.lessonId !== manifestCell.lessonId) {
      errors.push(
        `mismatched lessonId for ${cellId}: expected ${manifestCell.lessonId}, got ${recovered.lessonId}`,
      );
      continue;
    }
    if (recovered.locale !== manifestCell.locale) {
      errors.push(
        `mismatched locale for ${cellId}: expected ${manifestCell.locale}, got ${recovered.locale}`,
      );
      continue;
    }
    if (recovered.status !== "ACCEPTED") {
      errors.push(`non-ACCEPTED recovery receipt for ${cellId}: ${recovered.status}`);
      continue;
    }

    const pngPath = paths.cellPngPath(cellId);
    if (!existsSync(pngPath)) {
      errors.push(`missing recovered PNG for ${cellId}`);
      continue;
    }
    if (!recovered.artifactSha256) {
      errors.push(`recovered receipt missing artifactSha256 for ${cellId}`);
      continue;
    }
    const pngSha = sha256File(pngPath);
    if (pngSha !== recovered.artifactSha256.toUpperCase()) {
      errors.push(
        `recovered PNG SHA mismatch for ${cellId}: file=${pngSha} receipt=${recovered.artifactSha256}`,
      );
      continue;
    }

    const canonicalPath = paths.pilotReceiptPath(cellId);
    const canonicalReceipt: CellReceipt = {
      ...recovered,
      mode: "pilot",
    };

    if (existsSync(canonicalPath)) {
      let existing: CellReceipt;
      try {
        existing = readReceiptFile(canonicalPath);
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
        continue;
      }
      if (existing.cellId !== cellId) {
        errors.push(`canonical receipt cellId mismatch at ${canonicalPath}`);
        continue;
      }
      if (existing.status === "ACCEPTED") {
        if (semanticAcceptedEqual(existing, canonicalReceipt)) {
          noopCellIds.push(cellId);
          continue;
        }
        errors.push(
          `refusing to replace already ACCEPTED canonical receipt with differing recovery for ${cellId}`,
        );
        continue;
      }
      if (existing.status !== "FAILED") {
        errors.push(
          `canonical receipt for ${cellId} has unsupported status ${existing.status}; only FAILED may be replaced`,
        );
        continue;
      }
    }

    atomicWriteTextFile(canonicalPath, serializeReceipt(canonicalReceipt));
    promotedCellIds.push(cellId);
  }

  if (errors.length > 0) {
    const inventory = inventoryCanonicalPilotReceipts(pilotManifest, paths);
    return { ok: false, promotedCellIds, noopCellIds, errors, inventory };
  }

  const inventory = rebuildCanonicalPilotSummary(pilotManifest, paths);
  errors.push(...assertFinalInventory(inventory));
  return {
    ok: errors.length === 0,
    promotedCellIds,
    noopCellIds,
    errors,
    inventory,
  };
}

/** Exported for tests: promote a single cell using an already-written failed-only receipt. */
export function reconcileSingleFailedOnlyCell(
  cellId: string,
  pilotManifest?: PilotManifest,
  paths?: ReconciliationPaths,
): ReconciliationResult {
  return reconcileFailedOnlyIntoPilot({
    recoveredCellIds: [cellId],
    pilotManifest,
    paths,
  });
}
