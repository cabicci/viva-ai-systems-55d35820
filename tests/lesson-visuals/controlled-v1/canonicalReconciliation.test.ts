import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { buildPilotManifest } from "../../../src/lib/lesson-visuals/controlled-v1/buildManifest";
import {
  inventoryCanonicalPilotReceipts,
  reconcileFailedOnlyIntoPilot,
  type ReconciliationPaths,
} from "../../../src/lib/lesson-visuals/controlled-v1/reconcileFailedOnlyIntoPilot";
import type {
  CellReceipt,
  PilotManifest,
} from "../../../src/lib/lesson-visuals/controlled-v1/types";

const FAILED_CELL = "intro-m1-l4-ai-can-cannot__en";
const NON_PILOT = "some-other-lesson__en";

function sha256(buf: Buffer | string): string {
  return createHash("sha256").update(buf).digest("hex").toUpperCase();
}

function makePaths(root: string): ReconciliationPaths {
  const receiptsRoot = join(root, "receipts");
  const cellsRoot = join(root, "cells");
  return {
    receiptsRoot,
    cellPngPath: (cellId) => join(cellsRoot, cellId, "final.png"),
    pilotReceiptPath: (cellId) => join(receiptsRoot, "pilot", `${cellId}.receipt.json`),
    failedOnlyReceiptPath: (cellId) => join(receiptsRoot, "failed-only", `${cellId}.receipt.json`),
    pilotSummaryPath: join(receiptsRoot, "pilot", "_summary.json"),
  };
}

function acceptedReceipt(
  cellId: string,
  pngSha: string,
  bytes: number,
  mode: CellReceipt["mode"] = "pilot",
): CellReceipt {
  const [lessonId, locale] = cellId.split("__") as [string, CellReceipt["locale"]];
  return {
    receiptVersion: "controlled-v1-receipt/1",
    cellId,
    lessonId,
    locale,
    route: "INSTRUCTIONAL_COMPOSITION",
    mode,
    status: "ACCEPTED",
    reason: null,
    artifactPath: `artifacts/controlled-v1/cells/${cellId}/final.png`,
    artifactSha256: pngSha,
    bytesWritten: bytes,
    controlledFailureInjected: false,
    producedAt: "2026-07-26T10:00:00.000Z",
  };
}

function failedReceipt(cellId: string): CellReceipt {
  const [lessonId, locale] = cellId.split("__") as [string, CellReceipt["locale"]];
  return {
    receiptVersion: "controlled-v1-receipt/1",
    cellId,
    lessonId,
    locale,
    route: "INSTRUCTIONAL_COMPOSITION",
    mode: "pilot",
    status: "FAILED",
    reason: "controlled failure injection",
    artifactPath: null,
    artifactSha256: null,
    bytesWritten: null,
    controlledFailureInjected: true,
    producedAt: "2026-07-26T10:00:00.000Z",
  };
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function seedPilotFixture(root: string, paths: ReconciliationPaths, pilot: PilotManifest) {
  const pngHashes = new Map<string, string>();
  for (const cell of pilot.cells) {
    const pngBytes = Buffer.from(`png-fixture:${cell.cellId}`, "utf8");
    const pngSha = sha256(pngBytes);
    pngHashes.set(cell.cellId, pngSha);
    const pngPath = paths.cellPngPath(cell.cellId);
    mkdirSync(join(pngPath, ".."), { recursive: true });
    writeFileSync(pngPath, pngBytes);

    if (cell.cellId === FAILED_CELL) {
      writeJson(paths.pilotReceiptPath(cell.cellId), failedReceipt(cell.cellId));
    } else {
      writeJson(
        paths.pilotReceiptPath(cell.cellId),
        acceptedReceipt(cell.cellId, pngSha, pngBytes.length),
      );
    }
  }

  writeJson(paths.pilotSummaryPath, {
    generatedAt: "2026-07-26T10:00:00.000Z",
    counts: { ACCEPTED: 11, FAILED: 1 },
    receipts: [],
  });

  const recoveredPngSha = pngHashes.get(FAILED_CELL)!;
  const recoveredBytes = Buffer.from(`png-fixture:${FAILED_CELL}`, "utf8").length;
  writeJson(
    paths.failedOnlyReceiptPath(FAILED_CELL),
    acceptedReceipt(FAILED_CELL, recoveredPngSha, recoveredBytes, "failed-only"),
  );

  return pngHashes;
}

describe("canonical failed-only → pilot reconciliation", () => {
  let root = "";
  let paths: ReconciliationPaths;
  let pilot: PilotManifest;
  let pngHashes: Map<string, string>;
  let acceptedReceiptHashesBefore: Map<string, string>;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "fo-canon-"));
    paths = makePaths(root);
    pilot = buildPilotManifest();
    expect(pilot.cells).toHaveLength(12);
    pngHashes = seedPilotFixture(root, paths, pilot);
    acceptedReceiptHashesBefore = new Map();
    for (const cell of pilot.cells) {
      if (cell.cellId === FAILED_CELL) continue;
      const p = paths.pilotReceiptPath(cell.cellId);
      acceptedReceiptHashesBefore.set(cell.cellId, sha256(readFileSync(p)));
    }
  });

  afterEach(() => {
    if (root && existsSync(root)) rmSync(root, { recursive: true, force: true });
  });

  it("promotes one recovered ACCEPTED receipt over matching FAILED canonical only", () => {
    const beforeFailed = readFileSync(paths.pilotReceiptPath(FAILED_CELL), "utf8");
    expect(JSON.parse(beforeFailed).status).toBe("FAILED");

    const result = reconcileFailedOnlyIntoPilot({
      recoveredCellIds: [FAILED_CELL],
      pilotManifest: pilot,
      paths,
    });

    expect(result.ok).toBe(true);
    expect(result.promotedCellIds).toEqual([FAILED_CELL]);
    expect(result.errors).toEqual([]);
    expect(result.inventory).toMatchObject({
      expected: 12,
      unique: 12,
      accepted: 12,
      failed: 0,
      missing: 0,
      duplicate: 0,
      unexpected: 0,
    });
    expect(result.inventory.orderedCellIds).toEqual(pilot.cells.map((c) => c.cellId));

    const promoted = JSON.parse(readFileSync(paths.pilotReceiptPath(FAILED_CELL), "utf8"));
    expect(promoted.status).toBe("ACCEPTED");
    expect(promoted.mode).toBe("pilot");
    expect(promoted.cellId).toBe(FAILED_CELL);

    for (const [cellId, hashBefore] of acceptedReceiptHashesBefore) {
      expect(sha256(readFileSync(paths.pilotReceiptPath(cellId)))).toBe(hashBefore);
    }

    for (const cell of pilot.cells) {
      expect(sha256(readFileSync(paths.cellPngPath(cell.cellId)))).toBe(pngHashes.get(cell.cellId));
    }

    expect(existsSync(paths.failedOnlyReceiptPath(FAILED_CELL))).toBe(true);
    const audit = JSON.parse(readFileSync(paths.failedOnlyReceiptPath(FAILED_CELL), "utf8"));
    expect(audit.status).toBe("ACCEPTED");
    expect(audit.mode).toBe("failed-only");

    const summary = JSON.parse(readFileSync(paths.pilotSummaryPath, "utf8"));
    expect(summary.counts).toMatchObject({ ACCEPTED: 12 });
    expect(summary.counts.FAILED ?? 0).toBe(0);
    expect(summary.reconciliation).toMatchObject({
      expected: 12,
      unique: 12,
      accepted: 12,
      failed: 0,
      missing: 0,
      duplicate: 0,
      unexpected: 0,
    });
    expect(summary.receipts.map((r: CellReceipt) => r.cellId)).toEqual(
      pilot.cells.map((c) => c.cellId),
    );
  });

  it("is idempotent when identical recovery is applied twice", () => {
    const first = reconcileFailedOnlyIntoPilot({
      recoveredCellIds: [FAILED_CELL],
      pilotManifest: pilot,
      paths,
    });
    expect(first.ok).toBe(true);
    const afterFirst = sha256(readFileSync(paths.pilotReceiptPath(FAILED_CELL)));

    const second = reconcileFailedOnlyIntoPilot({
      recoveredCellIds: [FAILED_CELL],
      pilotManifest: pilot,
      paths,
    });
    expect(second.ok).toBe(true);
    expect(second.promotedCellIds).toEqual([]);
    expect(second.noopCellIds).toEqual([FAILED_CELL]);
    expect(sha256(readFileSync(paths.pilotReceiptPath(FAILED_CELL)))).toBe(afterFirst);
    expect(second.inventory.accepted).toBe(12);
    expect(second.inventory.failed).toBe(0);
  });

  it("fails closed when differing recovery targets already ACCEPTED canonical", () => {
    const first = reconcileFailedOnlyIntoPilot({
      recoveredCellIds: [FAILED_CELL],
      pilotManifest: pilot,
      paths,
    });
    expect(first.ok).toBe(true);

    const differing = acceptedReceipt(FAILED_CELL, pngHashes.get(FAILED_CELL)!, 999, "failed-only");
    writeJson(paths.failedOnlyReceiptPath(FAILED_CELL), differing);

    const second = reconcileFailedOnlyIntoPilot({
      recoveredCellIds: [FAILED_CELL],
      pilotManifest: pilot,
      paths,
    });
    expect(second.ok).toBe(false);
    expect(second.errors.some((e) => e.includes("refusing to replace already ACCEPTED"))).toBe(
      true,
    );
  });

  it("fails closed when recovery receipt is missing", () => {
    rmSync(paths.failedOnlyReceiptPath(FAILED_CELL), { force: true });
    const result = reconcileFailedOnlyIntoPilot({
      recoveredCellIds: [FAILED_CELL],
      pilotManifest: pilot,
      paths,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("missing recovery receipt"))).toBe(true);
  });

  it("fails closed when recovery cellId mismatches", () => {
    const bad = acceptedReceipt(
      FAILED_CELL,
      pngHashes.get(FAILED_CELL)!,
      Buffer.from(`png-fixture:${FAILED_CELL}`).length,
      "failed-only",
    );
    bad.cellId = "intro-m1-l4-ai-can-cannot__ar-EG";
    writeJson(paths.failedOnlyReceiptPath(FAILED_CELL), bad);
    const result = reconcileFailedOnlyIntoPilot({
      recoveredCellIds: [FAILED_CELL],
      pilotManifest: pilot,
      paths,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("mismatched cellId"))).toBe(true);
  });

  it("fails closed when locale or lesson mismatches", () => {
    const badLesson = acceptedReceipt(
      FAILED_CELL,
      pngHashes.get(FAILED_CELL)!,
      Buffer.from(`png-fixture:${FAILED_CELL}`).length,
      "failed-only",
    );
    badLesson.lessonId = "builder-m7-l1-tables-columns";
    writeJson(paths.failedOnlyReceiptPath(FAILED_CELL), badLesson);
    const lessonResult = reconcileFailedOnlyIntoPilot({
      recoveredCellIds: [FAILED_CELL],
      pilotManifest: pilot,
      paths,
    });
    expect(lessonResult.ok).toBe(false);
    expect(lessonResult.errors.some((e) => e.includes("mismatched lessonId"))).toBe(true);

    seedPilotFixture(root, paths, pilot);
    const badLocale = acceptedReceipt(
      FAILED_CELL,
      pngHashes.get(FAILED_CELL)!,
      Buffer.from(`png-fixture:${FAILED_CELL}`).length,
      "failed-only",
    );
    badLocale.locale = "ar-EG";
    writeJson(paths.failedOnlyReceiptPath(FAILED_CELL), badLocale);
    const localeResult = reconcileFailedOnlyIntoPilot({
      recoveredCellIds: [FAILED_CELL],
      pilotManifest: pilot,
      paths,
    });
    expect(localeResult.ok).toBe(false);
    expect(localeResult.errors.some((e) => e.includes("mismatched locale"))).toBe(true);
  });

  it("fails closed on duplicate recovery receipts", () => {
    const dupPath = join(paths.receiptsRoot, "failed-only", `${FAILED_CELL}.dup.receipt.json`);
    writeFileSync(dupPath, readFileSync(paths.failedOnlyReceiptPath(FAILED_CELL)));
    const result = reconcileFailedOnlyIntoPilot({
      recoveredCellIds: [FAILED_CELL],
      pilotManifest: pilot,
      paths,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("duplicate recovery receipts"))).toBe(true);
  });

  it("fails closed on malformed recovery receipt", () => {
    writeFileSync(paths.failedOnlyReceiptPath(FAILED_CELL), "{not-json");
    const result = reconcileFailedOnlyIntoPilot({
      recoveredCellIds: [FAILED_CELL],
      pilotManifest: pilot,
      paths,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("malformed"))).toBe(true);
  });

  it("fails closed on non-ACCEPTED recovery receipt", () => {
    writeJson(paths.failedOnlyReceiptPath(FAILED_CELL), failedReceipt(FAILED_CELL));
    const result = reconcileFailedOnlyIntoPilot({
      recoveredCellIds: [FAILED_CELL],
      pilotManifest: pilot,
      paths,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("non-ACCEPTED"))).toBe(true);
  });

  it("fails closed when unexpected canonical receipt exists", () => {
    writeJson(
      join(paths.receiptsRoot, "pilot", "unexpected-cell__en.receipt.json"),
      acceptedReceipt("builder-m7-l1-tables-columns__en", "AA", 1),
    );
    // Fix the unexpected file to have a non-pilot cellId
    writeJson(join(paths.receiptsRoot, "pilot", "rogue__en.receipt.json"), {
      ...acceptedReceipt(FAILED_CELL, pngHashes.get(FAILED_CELL)!, 1),
      cellId: "rogue-lesson__en",
      lessonId: "rogue-lesson",
    });
    const result = reconcileFailedOnlyIntoPilot({
      recoveredCellIds: [FAILED_CELL],
      pilotManifest: pilot,
      paths,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("unexpected"))).toBe(true);
  });

  it("fails closed when a canonical receipt is missing", () => {
    const other = pilot.cells.find((c) => c.cellId !== FAILED_CELL)!.cellId;
    rmSync(paths.pilotReceiptPath(other), { force: true });
    const result = reconcileFailedOnlyIntoPilot({
      recoveredCellIds: [FAILED_CELL],
      pilotManifest: pilot,
      paths,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("missing"))).toBe(true);
  });

  it("fails closed when any canonical FAILED remains after reconciliation attempt", () => {
    // Leave FAILED in place by providing no recoveries, then assert inventory.
    const inventory = inventoryCanonicalPilotReceipts(pilot, paths);
    expect(inventory.failed).toBe(1);
    expect(inventory.failedCellIds).toEqual([FAILED_CELL]);

    const result = reconcileFailedOnlyIntoPilot({
      recoveredCellIds: [],
      pilotManifest: pilot,
      paths,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("FAILED must be 0"))).toBe(true);
  });

  it("rejects non-pilot cells for reconciliation", () => {
    const result = reconcileFailedOnlyIntoPilot({
      recoveredCellIds: [NON_PILOT],
      pilotManifest: pilot,
      paths,
    });
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes("non-pilot") || e.includes("cellId failed safety")),
    ).toBe(true);
  });
});

describe("controlled-400 workflow artifact upload includes both namespaces", () => {
  const yml = readFileSync(
    resolve(process.cwd(), ".github/workflows/controlled-400-visual-pipeline.yml"),
    "utf8",
  );

  it("uploads canonical receipts, failed-only receipts, summaries, and cells", () => {
    expect(yml).toContain("artifacts/controlled-v1/receipts/**");
    expect(yml).toContain("artifacts/controlled-v1/cells/**");
    expect(yml).toContain("artifacts/controlled-v1/reports/**");
  });
});
