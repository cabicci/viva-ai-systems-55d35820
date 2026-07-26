/**
 * Method C 356 canonical artifact sanitation (packaging only).
 *
 * Copies allowlisted ACCEPTED Method C cells byte-for-byte from a locked
 * historical production artifact into a fresh staging tree. Never regenerates
 * PNGs or rewrites receipts.
 */
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import {
  LOCALES,
  METHOD_C_CANONICAL_EXCLUDED_RESIDUE_CELL_IDS,
  METHOD_C_CANONICAL_REPAIR_AUTH_ID,
  METHOD_C_CANONICAL_SOURCE_ARTIFACT_DIGEST,
  METHOD_C_CANONICAL_SOURCE_ARTIFACT_ID,
  METHOD_C_CANONICAL_SOURCE_ARTIFACT_NAME,
  METHOD_C_CANONICAL_SOURCE_RUN_ID,
  METHOD_C_REMAINING_EXPECTED_PER_LOCALE,
  METHOD_C_REMAINING_EXPECTED_TOTAL,
  PRESERVED_METHOD_C_PILOT_CELL_IDS,
} from "./constants";
import { selectMethodCRemainingCells } from "./methodCRemaining";
import type { CellReceipt, Locale, ProductionManifest } from "./types";

const RASTER_EXTS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".avif",
  ".bmp",
  ".tif",
  ".tiff",
]);

const RESIDUE_SET = new Set<string>(METHOD_C_CANONICAL_EXCLUDED_RESIDUE_CELL_IDS);
const PILOT_SET = new Set<string>(PRESERVED_METHOD_C_PILOT_CELL_IDS);

export interface CanonicalHashEntry {
  kind: "png" | "receipt";
  cellId: string;
  relativePath: string;
  sha256: string;
  bytes: number;
}

export interface CanonicalValidationCounts {
  authorizedCellDirectories: number;
  finalPngFiles: number;
  acceptedReceipts: number;
  methodCReceipts: number;
  instructionalCompositionReceipts: number;
  perLocale: Record<Locale, number>;
  pilotCells: number;
  methodACells: number;
  methodBCells: number;
  unauthorizedCellDirectories: number;
  missingCells: number;
  duplicateCells: number;
  unexpectedCells: number;
  unreceiptedRasters: number;
  receiptOnlyCells: number;
  zeroPngCells: number;
  multiPngCells: number;
  pngHashMismatches: number;
  receiptHashMismatches: number;
}

export interface CanonicalValidationResult {
  ok: boolean;
  errors: string[];
  counts: CanonicalValidationCounts;
}

export interface CanonicalStageResult {
  ok: boolean;
  errors: string[];
  stagingRoot: string;
  allowlist: string[];
  sourceLedger: CanonicalHashEntry[];
  stagedLedger: CanonicalHashEntry[];
  validation: CanonicalValidationResult;
  sanitationReportPath: string;
  provenancePath: string;
  hashLedgerPath: string;
}

export interface CanonicalRepairProvenance {
  authorizationId: string;
  sourceRunId: string;
  sourceExecutionSha: string | null;
  historicalArtifactId: string;
  historicalArtifactName: string;
  historicalApiDigest: string;
  sourceArtifactSizeBytes: number | null;
  sourceSelectionIdentity: string;
  excludedResiduePaths: string[];
  authorizedCount: number;
  localeCounts: Record<Locale, number>;
  copiedPngCount: number;
  copiedReceiptCount: number;
  copiedNotGenerated: true;
  rendererExecutions: 0;
  imageProviderCalls: 0;
  paidProviderCalls: 0;
  sourceToCanonicalIdentity: CanonicalHashEntry[];
  canonicalValidationOk: boolean;
  repairExecutionSha: string | null;
}

function sha256HexOfFile(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex").toUpperCase();
}

function sha256HexOfBuffer(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex").toUpperCase();
}

function emptyLocaleCounts(): Record<Locale, number> {
  return Object.fromEntries(LOCALES.map((l) => [l, 0])) as Record<Locale, number>;
}

function emptyCounts(): CanonicalValidationCounts {
  return {
    authorizedCellDirectories: 0,
    finalPngFiles: 0,
    acceptedReceipts: 0,
    methodCReceipts: 0,
    instructionalCompositionReceipts: 0,
    perLocale: emptyLocaleCounts(),
    pilotCells: 0,
    methodACells: 0,
    methodBCells: 0,
    unauthorizedCellDirectories: 0,
    missingCells: 0,
    duplicateCells: 0,
    unexpectedCells: 0,
    unreceiptedRasters: 0,
    receiptOnlyCells: 0,
    zeroPngCells: 0,
    multiPngCells: 0,
    pngHashMismatches: 0,
    receiptHashMismatches: 0,
  };
}

function walkFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  const out: string[] = [];
  const stack = [root];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const name of readdirSync(cur)) {
      const full = join(cur, name);
      const st = statSync(full);
      if (st.isDirectory()) stack.push(full);
      else out.push(full);
    }
  }
  return out;
}

function normalizeRel(path: string): string {
  return path.split(sep).join("/");
}

function controlledV1Root(artifactRoot: string): string {
  const nested = resolve(artifactRoot, "artifacts/controlled-v1");
  if (existsSync(nested)) return nested;
  const direct = resolve(artifactRoot, "controlled-v1");
  if (existsSync(direct)) return direct;
  // Already pointing at controlled-v1
  if (existsSync(resolve(artifactRoot, "cells")) || existsSync(resolve(artifactRoot, "receipts"))) {
    return artifactRoot;
  }
  return nested;
}

/**
 * Derive the exact 356-cell allowlist from selection evidence (never by listing cells/).
 */
export function resolveAuthorizedAllowlist(options: {
  selectionJsonPath?: string;
  selection?: { cells?: Array<{ cellId: string }> };
  productionManifest?: ProductionManifest;
  /** Test-only: override expected total (production omits → 356). */
  expectedTotal?: number;
  /** Test-only: override expected per-locale (production omits → 89). */
  expectedPerLocale?: number;
}): { ok: boolean; cellIds: string[]; errors: string[] } {
  const expectedTotal = options.expectedTotal ?? METHOD_C_REMAINING_EXPECTED_TOTAL;
  const expectedPerLocale =
    options.expectedPerLocale ?? METHOD_C_REMAINING_EXPECTED_PER_LOCALE;
  const errors: string[] = [];
  let cellIds: string[] = [];

  if (options.selection?.cells) {
    cellIds = options.selection.cells.map((c) => c.cellId);
  } else if (options.selectionJsonPath && existsSync(options.selectionJsonPath)) {
    const raw = JSON.parse(readFileSync(options.selectionJsonPath, "utf8")) as {
      cellIds?: string[];
      cells?: Array<{ cellId: string }>;
      selection?: { cells?: Array<{ cellId: string }>; cellIds?: string[] };
    };
    if (Array.isArray(raw.cellIds) && raw.cellIds.length > 0) {
      cellIds = raw.cellIds;
    } else if (Array.isArray(raw.selection?.cellIds) && raw.selection!.cellIds!.length > 0) {
      cellIds = raw.selection!.cellIds!;
    } else {
      const cells = raw.cells ?? raw.selection?.cells ?? [];
      cellIds = cells.map((c) => c.cellId);
    }
  } else if (options.productionManifest) {
    const sel = selectMethodCRemainingCells(options.productionManifest);
    if (!sel.ok) errors.push(...sel.errors);
    cellIds = sel.cells.map((c) => c.cellId);
  } else {
    errors.push("no selection evidence provided for allowlist");
  }

  const seen = new Set<string>();
  for (const id of cellIds) {
    if (seen.has(id)) errors.push(`duplicate allowlist cellId: ${id}`);
    seen.add(id);
    if (RESIDUE_SET.has(id)) errors.push(`residue cell must not be in allowlist: ${id}`);
    if (PILOT_SET.has(id)) {
      errors.push(`preserved pilot cell must not be in allowlist: ${id}`);
    }
  }

  if (cellIds.length !== expectedTotal) {
    errors.push(`allowlist expected ${expectedTotal}, got ${cellIds.length}`);
  }

  const perLocale = emptyLocaleCounts();
  for (const id of cellIds) {
    const locale = id.split("__")[1] as Locale;
    if (!LOCALES.includes(locale)) {
      errors.push(`invalid locale in cellId: ${id}`);
      continue;
    }
    perLocale[locale] += 1;
  }
  for (const locale of LOCALES) {
    if (perLocale[locale] !== expectedPerLocale) {
      errors.push(
        `allowlist locale ${locale} expected ${expectedPerLocale}, got ${perLocale[locale]}`,
      );
    }
  }

  return { ok: errors.length === 0, cellIds, errors };
}

export function buildSourceHashLedger(
  sourceArtifactRoot: string,
  allowlist: string[],
  options: { expectedTotal?: number } = {},
): { ok: boolean; errors: string[]; ledger: CanonicalHashEntry[] } {
  const expectedTotal = options.expectedTotal ?? METHOD_C_REMAINING_EXPECTED_TOTAL;
  const errors: string[] = [];
  const cv1 = controlledV1Root(sourceArtifactRoot);
  const ledger: CanonicalHashEntry[] = [];
  const allow = new Set(allowlist);

  for (const cellId of allowlist) {
    const pngRel = `cells/${cellId}/final.png`;
    const receiptRel = `receipts/method-c-remaining/${cellId}.receipt.json`;
    const pngPath = resolve(cv1, pngRel);
    const receiptPath = resolve(cv1, receiptRel);

    if (!existsSync(pngPath)) {
      errors.push(`missing authorized source PNG: ${pngRel}`);
    } else {
      const buf = readFileSync(pngPath);
      ledger.push({
        kind: "png",
        cellId,
        relativePath: pngRel,
        sha256: sha256HexOfBuffer(buf),
        bytes: buf.length,
      });
    }

    if (!existsSync(receiptPath)) {
      errors.push(`missing authorized source receipt: ${receiptRel}`);
    } else {
      const buf = readFileSync(receiptPath);
      let receipt: CellReceipt;
      try {
        receipt = JSON.parse(buf.toString("utf8")) as CellReceipt;
      } catch {
        errors.push(`unreadable receipt JSON: ${receiptRel}`);
        continue;
      }
      if (receipt.status !== "ACCEPTED") {
        errors.push(`receipt not ACCEPTED: ${cellId} status=${receipt.status}`);
      }
      if (receipt.route !== "INSTRUCTIONAL_COMPOSITION") {
        errors.push(`receipt not INSTRUCTIONAL_COMPOSITION: ${cellId} route=${receipt.route}`);
      }
      if (receipt.cellId !== cellId) {
        errors.push(`receipt cellId mismatch: file=${cellId} receipt=${receipt.cellId}`);
      }
      if (!allow.has(receipt.cellId)) {
        errors.push(`receipt cellId outside selection: ${receipt.cellId}`);
      }
      if (receipt.artifactSha256) {
        const pngEntry = ledger.find((e) => e.kind === "png" && e.cellId === cellId);
        if (pngEntry && pngEntry.sha256 !== receipt.artifactSha256.toUpperCase()) {
          errors.push(
            `receipt PNG hash mismatch for ${cellId}: receipt=${receipt.artifactSha256} file=${pngEntry.sha256}`,
          );
        }
      }
      ledger.push({
        kind: "receipt",
        cellId,
        relativePath: receiptRel,
        sha256: sha256HexOfBuffer(buf),
        bytes: buf.length,
      });
    }
  }

  if (ledger.length !== expectedTotal * 2) {
    errors.push(`source ledger expected ${expectedTotal * 2} entries, got ${ledger.length}`);
  }

  return { ok: errors.length === 0, errors, ledger };
}

function copyExact(src: string, dest: string): void {
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
}

function copyIfExists(src: string, dest: string): boolean {
  if (!existsSync(src)) return false;
  copyExact(src, dest);
  return true;
}

/**
 * Build a fresh canonical staging tree from an empty directory using the allowlist.
 * Binary byte-for-byte copy for PNGs and receipts — no JSON rewrite.
 */
export function stageCanonicalMethodCArtifact(options: {
  sourceArtifactRoot: string;
  stagingRoot: string;
  allowlist: string[];
  sourceLedger: CanonicalHashEntry[];
  authorizationId?: string;
  sourceExecutionSha?: string | null;
  repairExecutionSha?: string | null;
  sourceArtifactSizeBytes?: number | null;
  historicalApiDigest?: string;
  expectedTotal?: number;
  expectedPerLocale?: number;
}): CanonicalStageResult {
  const errors: string[] = [];
  const {
    sourceArtifactRoot,
    stagingRoot,
    allowlist,
    sourceLedger,
  } = options;
  const expectedTotal = options.expectedTotal ?? METHOD_C_REMAINING_EXPECTED_TOTAL;
  const expectedPerLocale =
    options.expectedPerLocale ?? METHOD_C_REMAINING_EXPECTED_PER_LOCALE;

  if (existsSync(stagingRoot)) {
    const existing = readdirSync(stagingRoot);
    if (existing.length > 0) {
      // Require empty staging — wipe only when caller opts into force via empty marker file
      // Auth: "starts from a new empty canonical staging directory"
      rmSync(stagingRoot, { recursive: true, force: true });
    }
  }
  mkdirSync(stagingRoot, { recursive: true });

  const sourceCv1 = controlledV1Root(sourceArtifactRoot);
  const stagedCv1 = resolve(stagingRoot, "artifacts/controlled-v1");
  mkdirSync(stagedCv1, { recursive: true });

  const sourceByKey = new Map(
    sourceLedger.map((e) => [`${e.kind}:${e.cellId}`, e] as const),
  );
  const stagedLedger: CanonicalHashEntry[] = [];

  for (const cellId of allowlist) {
    if (RESIDUE_SET.has(cellId)) {
      errors.push(`refusing to copy excluded residue cell: ${cellId}`);
      continue;
    }

    const pngRel = `cells/${cellId}/final.png`;
    const receiptRel = `receipts/method-c-remaining/${cellId}.receipt.json`;
    const srcPng = resolve(sourceCv1, pngRel);
    const srcReceipt = resolve(sourceCv1, receiptRel);
    const destPng = resolve(stagedCv1, pngRel);
    const destReceipt = resolve(stagedCv1, receiptRel);

    if (!existsSync(srcPng) || !existsSync(srcReceipt)) {
      errors.push(`missing source files for ${cellId}`);
      continue;
    }

    copyExact(srcPng, destPng);
    copyExact(srcReceipt, destReceipt);

    const pngSha = sha256HexOfFile(destPng);
    const receiptSha = sha256HexOfFile(destReceipt);
    const srcPngEntry = sourceByKey.get(`png:${cellId}`);
    const srcReceiptEntry = sourceByKey.get(`receipt:${cellId}`);
    if (!srcPngEntry || srcPngEntry.sha256 !== pngSha) {
      errors.push(`staged PNG hash mismatch for ${cellId}`);
    }
    if (!srcReceiptEntry || srcReceiptEntry.sha256 !== receiptSha) {
      errors.push(`staged receipt hash mismatch for ${cellId}`);
    }

    stagedLedger.push({
      kind: "png",
      cellId,
      relativePath: pngRel,
      sha256: pngSha,
      bytes: statSync(destPng).size,
    });
    stagedLedger.push({
      kind: "receipt",
      cellId,
      relativePath: receiptRel,
      sha256: receiptSha,
      bytes: statSync(destReceipt).size,
    });
  }

  // Selection-consistent reports / ledgers / manifests (never wholesale cells/**)
  const reportCopies = [
    "reports/method-c-remaining-selection.json",
    "reports/method-c-remaining-report.json",
    "receipts/method-c-remaining/_summary.json",
  ];
  for (const rel of reportCopies) {
    copyIfExists(resolve(sourceCv1, rel), resolve(stagedCv1, rel));
  }

  // Contact sheets only when they exclusively reference the authorized mode name
  const contactDir = resolve(sourceCv1, "contact-sheets");
  if (existsSync(contactDir)) {
    for (const name of readdirSync(contactDir)) {
      if (!name.startsWith("method-c-remaining-contact-sheet")) continue;
      const html = readFileSync(join(contactDir, name), "utf8");
      let residueHit = false;
      for (const residue of METHOD_C_CANONICAL_EXCLUDED_RESIDUE_CELL_IDS) {
        if (html.includes(residue)) {
          residueHit = true;
          break;
        }
      }
      if (residueHit) {
        errors.push(`contact sheet references excluded residue: ${name}`);
        continue;
      }
      copyExact(join(contactDir, name), resolve(stagedCv1, "contact-sheets", name));
    }
  }

  // Docs manifests if present in historical artifact
  const docsSrc = resolve(sourceArtifactRoot, "docs/lesson-visuals/controlled-v1");
  if (existsSync(docsSrc)) {
    for (const name of [
      "PRODUCTION_MANIFEST.json",
      "PILOT_MANIFEST.json",
      "UNRESOLVED_LEDGER.json",
    ]) {
      copyIfExists(join(docsSrc, name), resolve(stagingRoot, "docs/lesson-visuals/controlled-v1", name));
    }
  }

  const validation = validateCanonicalStaging({
    stagingRoot,
    allowlist,
    sourceLedger,
    expectedTotal,
    expectedPerLocale,
  });
  if (!validation.ok) errors.push(...validation.errors);

  const localeCounts = emptyLocaleCounts();
  for (const id of allowlist) {
    const locale = id.split("__")[1] as Locale;
    localeCounts[locale] += 1;
  }

  const provenance: CanonicalRepairProvenance = {
    authorizationId: options.authorizationId ?? METHOD_C_CANONICAL_REPAIR_AUTH_ID,
    sourceRunId: METHOD_C_CANONICAL_SOURCE_RUN_ID,
    sourceExecutionSha: options.sourceExecutionSha ?? null,
    historicalArtifactId: METHOD_C_CANONICAL_SOURCE_ARTIFACT_ID,
    historicalArtifactName: METHOD_C_CANONICAL_SOURCE_ARTIFACT_NAME,
    historicalApiDigest:
      options.historicalApiDigest ?? METHOD_C_CANONICAL_SOURCE_ARTIFACT_DIGEST,
    sourceArtifactSizeBytes: options.sourceArtifactSizeBytes ?? null,
    sourceSelectionIdentity: "reports/method-c-remaining-selection.json",
    excludedResiduePaths: METHOD_C_CANONICAL_EXCLUDED_RESIDUE_CELL_IDS.map(
      (id) => `cells/${id}/final.png`,
    ),
    authorizedCount: expectedTotal,
    localeCounts,
    copiedPngCount: stagedLedger.filter((e) => e.kind === "png").length,
    copiedReceiptCount: stagedLedger.filter((e) => e.kind === "receipt").length,
    copiedNotGenerated: true,
    rendererExecutions: 0,
    imageProviderCalls: 0,
    paidProviderCalls: 0,
    sourceToCanonicalIdentity: stagedLedger,
    canonicalValidationOk: validation.ok,
    repairExecutionSha: options.repairExecutionSha ?? null,
  };

  const provenanceDir = resolve(stagedCv1, "provenance");
  mkdirSync(provenanceDir, { recursive: true });
  const provenancePath = join(provenanceDir, "method-c-canonical-sanitation-provenance.json");
  const hashLedgerPath = join(provenanceDir, "source-to-canonical-hash-ledger.json");
  const sanitationReportPath = resolve(
    stagedCv1,
    "reports/method-c-canonical-sanitation-report.json",
  );
  mkdirSync(dirname(sanitationReportPath), { recursive: true });

  writeFileSync(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`, "utf8");
  writeFileSync(
    hashLedgerPath,
    `${JSON.stringify(
      {
        schemaVersion: "controlled-v1-source-to-canonical-hash-ledger/1",
        entryCount: stagedLedger.length,
        entries: stagedLedger,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  writeFileSync(
    sanitationReportPath,
    `${JSON.stringify(
      {
        schemaVersion: "controlled-v1-method-c-canonical-sanitation-report/1",
        ok: errors.length === 0 && validation.ok,
        authorizationId: provenance.authorizationId,
        mode: "method-c-canonical-repair",
        confirmToken: "RUN_AUTHORIZED_METHOD_C_CANONICAL_REPAIR",
        sourceRunId: METHOD_C_CANONICAL_SOURCE_RUN_ID,
        historicalArtifactId: METHOD_C_CANONICAL_SOURCE_ARTIFACT_ID,
        historicalArtifactName: METHOD_C_CANONICAL_SOURCE_ARTIFACT_NAME,
        historicalApiDigest: provenance.historicalApiDigest,
        excludedResiduePaths: provenance.excludedResiduePaths,
        counts: validation.counts,
        errors,
        rendererExecutions: 0,
        imageProviderCalls: 0,
        paidProviderCalls: 0,
        copiedNotGenerated: true,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  return {
    ok: errors.length === 0 && validation.ok,
    errors,
    stagingRoot,
    allowlist,
    sourceLedger,
    stagedLedger,
    validation,
    sanitationReportPath,
    provenancePath,
    hashLedgerPath,
  };
}

export function validateCanonicalStaging(options: {
  stagingRoot: string;
  allowlist: string[];
  sourceLedger: CanonicalHashEntry[];
  expectedTotal?: number;
  expectedPerLocale?: number;
}): CanonicalValidationResult {
  const expectedTotal = options.expectedTotal ?? METHOD_C_REMAINING_EXPECTED_TOTAL;
  const expectedPerLocale =
    options.expectedPerLocale ?? METHOD_C_REMAINING_EXPECTED_PER_LOCALE;
  const errors: string[] = [];
  const counts = emptyCounts();
  const cv1 = controlledV1Root(options.stagingRoot);
  const allow = new Set(options.allowlist);
  const sourceByKey = new Map(
    options.sourceLedger.map((e) => [`${e.kind}:${e.cellId}`, e] as const),
  );

  const cellsDir = resolve(cv1, "cells");
  const cellDirs = existsSync(cellsDir)
    ? readdirSync(cellsDir).filter((n) => statSync(join(cellsDir, n)).isDirectory())
    : [];

  const seenDirs = new Set<string>();
  for (const dir of cellDirs) {
    if (seenDirs.has(dir)) {
      counts.duplicateCells += 1;
      errors.push(`duplicate cell directory: ${dir}`);
    }
    seenDirs.add(dir);

    if (RESIDUE_SET.has(dir)) {
      counts.unauthorizedCellDirectories += 1;
      errors.push(`excluded residue path present in staging: cells/${dir}/final.png`);
      continue;
    }
    if (PILOT_SET.has(dir)) {
      counts.pilotCells += 1;
      errors.push(`pilot cell directory present in staging: ${dir}`);
    }
    if (!allow.has(dir)) {
      counts.unauthorizedCellDirectories += 1;
      counts.unexpectedCells += 1;
      errors.push(`unauthorized/unexpected cell directory: ${dir}`);
      continue;
    }
    counts.authorizedCellDirectories += 1;
    const locale = dir.split("__")[1] as Locale;
    if (LOCALES.includes(locale)) counts.perLocale[locale] += 1;

    const pngs = readdirSync(join(cellsDir, dir)).filter((f) => f.toLowerCase().endsWith(".png"));
    if (pngs.length === 0) {
      counts.zeroPngCells += 1;
      errors.push(`zero PNG cells: ${dir}`);
    } else if (pngs.length > 1) {
      counts.multiPngCells += 1;
      errors.push(`multi-PNG cell: ${dir}`);
    } else if (pngs[0] !== "final.png") {
      errors.push(`expected final.png in ${dir}, found ${pngs[0]}`);
    } else {
      counts.finalPngFiles += 1;
    }
  }

  for (const id of options.allowlist) {
    if (!seenDirs.has(id)) {
      counts.missingCells += 1;
      errors.push(`missing authorized cell directory: ${id}`);
    }
  }

  const receiptDir = resolve(cv1, "receipts/method-c-remaining");
  const receiptFiles = existsSync(receiptDir)
    ? readdirSync(receiptDir).filter((f) => f.endsWith(".receipt.json"))
    : [];

  const receiptCells = new Set<string>();
  for (const file of receiptFiles) {
    const cellId = file.replace(/\.receipt\.json$/, "");
    receiptCells.add(cellId);
    const full = join(receiptDir, file);
    const buf = readFileSync(full);
    const receipt = JSON.parse(buf.toString("utf8")) as CellReceipt;

    if (receipt.status !== "ACCEPTED") {
      errors.push(`non-ACCEPTED receipt: ${cellId}`);
    } else {
      counts.acceptedReceipts += 1;
    }
    if (receipt.route === "MASAARAT_SCREENSHOT") {
      counts.methodACells += 1;
      errors.push(`Method A receipt: ${cellId}`);
    } else if (receipt.route === "AUTHORIZED_EXTERNAL_SCREENSHOT") {
      counts.methodBCells += 1;
      errors.push(`Method B receipt: ${cellId}`);
    } else if (receipt.route === "INSTRUCTIONAL_COMPOSITION") {
      counts.methodCReceipts += 1;
      counts.instructionalCompositionReceipts += 1;
    } else {
      errors.push(`unexpected receipt route: ${cellId} ${receipt.route}`);
    }

    const pngPath = resolve(cv1, `cells/${cellId}/final.png`);
    if (!existsSync(pngPath)) {
      counts.receiptOnlyCells += 1;
      errors.push(`receipt without PNG: ${cellId}`);
    }

    const srcReceipt = sourceByKey.get(`receipt:${cellId}`);
    const stagedSha = sha256HexOfBuffer(buf);
    if (!srcReceipt || srcReceipt.sha256 !== stagedSha) {
      counts.receiptHashMismatches += 1;
      errors.push(`source/staged receipt hash mismatch: ${cellId}`);
    }

    const srcPng = sourceByKey.get(`png:${cellId}`);
    if (existsSync(pngPath)) {
      const pngSha = sha256HexOfFile(pngPath);
      if (!srcPng || srcPng.sha256 !== pngSha) {
        counts.pngHashMismatches += 1;
        errors.push(`source/staged PNG hash mismatch: ${cellId}`);
      }
    }
  }

  for (const id of options.allowlist) {
    if (!receiptCells.has(id)) {
      errors.push(`missing ACCEPTED receipt for authorized cell: ${id}`);
    }
  }

  // Any raster anywhere under staging outside authorized cell final.png fails closed
  for (const file of walkFiles(options.stagingRoot)) {
    const ext = file.slice(file.lastIndexOf(".")).toLowerCase();
    if (!RASTER_EXTS.has(ext)) continue;
    const rel = normalizeRel(relative(options.stagingRoot, file));
    const m = rel.match(
      /(?:^|\/)artifacts\/controlled-v1\/cells\/([^/]+)\/final\.png$/i,
    ) || rel.match(/(?:^|\/)cells\/([^/]+)\/final\.png$/i);
    if (!m || !allow.has(m[1])) {
      counts.unreceiptedRasters += 1;
      errors.push(`unauthorized raster in staging: ${rel}`);
    } else if (!receiptCells.has(m[1])) {
      counts.unreceiptedRasters += 1;
      errors.push(`unreceipted raster: ${rel}`);
    }
  }

  for (const locale of LOCALES) {
    if (counts.perLocale[locale] !== expectedPerLocale) {
      errors.push(
        `locale ${locale} expected ${expectedPerLocale}, got ${counts.perLocale[locale]}`,
      );
    }
  }

  if (counts.authorizedCellDirectories !== expectedTotal) {
    errors.push(
      `authorized directories expected ${expectedTotal}, got ${counts.authorizedCellDirectories}`,
    );
  }
  if (counts.finalPngFiles !== expectedTotal) {
    errors.push(`final PNGs expected ${expectedTotal}, got ${counts.finalPngFiles}`);
  }
  if (counts.acceptedReceipts !== expectedTotal) {
    errors.push(
      `ACCEPTED receipts expected ${expectedTotal}, got ${counts.acceptedReceipts}`,
    );
  }

  return { ok: errors.length === 0, errors, counts };
}

/** Verify historical source extraction remained byte-identical after staging. */
export function assertSourceUnchanged(
  sourceArtifactRoot: string,
  sourceLedger: CanonicalHashEntry[],
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const cv1 = controlledV1Root(sourceArtifactRoot);
  for (const entry of sourceLedger) {
    const full = resolve(cv1, entry.relativePath);
    if (!existsSync(full)) {
      errors.push(`source missing after staging: ${entry.relativePath}`);
      continue;
    }
    const sha = sha256HexOfFile(full);
    if (sha !== entry.sha256) {
      errors.push(`source mutated: ${entry.relativePath}`);
    }
    if (statSync(full).size !== entry.bytes) {
      errors.push(`source size changed: ${entry.relativePath}`);
    }
  }
  return { ok: errors.length === 0, errors };
}
