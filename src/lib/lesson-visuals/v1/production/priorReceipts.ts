/**
 * Intentional prior-receipt bundle loader for failed-only mode.
 * Does not scan arbitrary paths — only an explicitly authorized directory.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { FIXTURE_RECEIPT_MARKER } from "../constants";
import { fingerprintProductionReceipt } from "./receipts";
import { validateReceiptSchema } from "./schemaValidator";
import type { ExecutionMode, ProductionCellReceipt, ProductionRunMode } from "./types";

export interface PriorReceiptLoadInput {
  mode: ProductionRunMode;
  /** Absolute or cwd-relative path to authorized prior-receipt bundle directory. */
  priorReceiptBundlePath: string | null | undefined;
  expectedSourceSha: string;
  expectedManifestSha256: string;
  expectedCellIds: readonly string[];
  executionMode: ExecutionMode;
}

export interface PriorReceiptLoadResult {
  ok: boolean;
  errors: string[];
  /** Valid ACCEPTED receipts keyed by cellId (only when ok). */
  acceptedByCellId: Map<string, ProductionCellReceipt>;
  skippedEligibleCount: number;
}

function listReceiptFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (current: string): void => {
    for (const name of readdirSync(current)) {
      if (name === "." || name === ".." || name.includes("..")) continue;
      const abs = join(current, name);
      const st = statSync(abs);
      if (st.isDirectory()) {
        walk(abs);
        continue;
      }
      if (!st.isFile()) continue;
      if (!name.endsWith(".receipt.json")) continue;
      // Basename must be exactly {cellId}.receipt.json — reject traversal/obfuscation.
      if (name.includes("/") || name.includes("\\")) continue;
      out.push(abs);
    }
  };
  walk(dir);
  return out;
}

export function loadPriorAcceptedReceipts(input: PriorReceiptLoadInput): PriorReceiptLoadResult {
  const errors: string[] = [];
  const acceptedByCellId = new Map<string, ProductionCellReceipt>();

  if (input.mode !== "failed-only") {
    return { ok: true, errors: [], acceptedByCellId, skippedEligibleCount: 0 };
  }

  const rawPath = (input.priorReceiptBundlePath ?? "").trim();
  if (!rawPath) {
    return {
      ok: false,
      errors: ["failed-only requires prior_receipt_bundle_path (authorized receipt bundle)"],
      acceptedByCellId,
      skippedEligibleCount: 0,
    };
  }

  const dir = resolve(rawPath);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    return {
      ok: false,
      errors: [`prior receipt bundle not found or not a directory: ${dir}`],
      acceptedByCellId,
      skippedEligibleCount: 0,
    };
  }

  const expected = new Set(input.expectedCellIds);
  const seenCells = new Set<string>();
  const files = listReceiptFiles(dir);
  if (files.length === 0) {
    return {
      ok: false,
      errors: ["prior receipt bundle contains no *.receipt.json files"],
      acceptedByCellId,
      skippedEligibleCount: 0,
    };
  }

  for (const file of files) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(file, "utf8"));
    } catch {
      errors.push(`malformed receipt JSON: ${basename(file)}`);
      continue;
    }
    const schema = validateReceiptSchema(parsed);
    if (!schema.ok) {
      errors.push(`schema-invalid receipt ${basename(file)}: ${schema.errors.join("; ")}`);
      continue;
    }
    const receipt = parsed as ProductionCellReceipt;
    const expectedName = `${receipt.cellId}.receipt.json`;
    if (basename(file) !== expectedName) {
      errors.push(`receipt filename ${basename(file)} does not match cellId ${receipt.cellId}`);
      continue;
    }
    if (!expected.has(receipt.cellId)) {
      errors.push(`receipt cellId ${receipt.cellId} not in authoritative matrix`);
      continue;
    }
    if (seenCells.has(receipt.cellId)) {
      errors.push(`duplicate receipt for cell ${receipt.cellId}`);
      continue;
    }
    seenCells.add(receipt.cellId);

    if (receipt.status !== "ACCEPTED") {
      errors.push(`receipt ${receipt.cellId} status ${receipt.status} not ACCEPTED`);
      continue;
    }
    if (receipt.sourceSha !== input.expectedSourceSha) {
      errors.push(`receipt ${receipt.cellId} stale/wrong sourceSha`);
      continue;
    }
    if (receipt.approvedManifestSha256 !== input.expectedManifestSha256) {
      errors.push(`receipt ${receipt.cellId} wrong manifest digest`);
      continue;
    }
    const expectCell = `${receipt.lessonId}__${receipt.locale}`;
    if (receipt.cellId !== expectCell) {
      errors.push(`receipt ${receipt.cellId} lesson/locale identity mismatch`);
      continue;
    }
    if (!receipt.contentSha256) {
      errors.push(`receipt ${receipt.cellId} missing contentSha256`);
      continue;
    }
    if (receipt.fixtureMarker || (receipt.error ?? "").includes(FIXTURE_RECEIPT_MARKER)) {
      if (input.executionMode === "production") {
        errors.push(`fixture/mock receipt rejected for production reuse: ${receipt.cellId}`);
        continue;
      }
    }
    const fp = fingerprintProductionReceipt({
      runId: receipt.runId,
      cellId: receipt.cellId,
      lessonId: receipt.lessonId,
      locale: receipt.locale,
      method: receipt.method,
      sourceSha: receipt.sourceSha,
      approvedManifestSha256: receipt.approvedManifestSha256,
      idempotencyKey: receipt.idempotencyKey,
      contentSha256: receipt.contentSha256,
    });
    if (fp !== receipt.fingerprint) {
      errors.push(`receipt ${receipt.cellId} stale/mismatched fingerprint`);
      continue;
    }

    acceptedByCellId.set(receipt.cellId, receipt);
  }

  // failed-only does not require a receipt for every cell — missing means regenerate.
  // But any invalid file in the bundle fails closed.
  if (errors.length > 0) {
    return { ok: false, errors, acceptedByCellId: new Map(), skippedEligibleCount: 0 };
  }

  return {
    ok: true,
    errors: [],
    acceptedByCellId,
    skippedEligibleCount: acceptedByCellId.size,
  };
}
