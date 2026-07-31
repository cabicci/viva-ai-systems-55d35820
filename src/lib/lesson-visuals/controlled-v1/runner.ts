import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import {
  buildProductionManifest,
  buildPilotManifest,
  buildUnresolvedLedger,
  writeJson,
} from "./buildManifest";
import {
  FULL_400_CONFIRM_TOKEN,
  METHOD_A_M7L1_FOUR_PILOT_AUTH_ID,
  METHOD_A_M7L1_FOUR_PILOT_CONFIRM_TOKEN,
  METHOD_A_M7L1_FOUR_PILOT_EXPECTED_TOTAL,
  METHOD_A_REMAINING_SIX_AUTH_ID,
  METHOD_A_REMAINING_SIX_CONFIRM_TOKEN,
  METHOD_A_REMAINING_SIX_EXPECTED_TOTAL,
  METHOD_C_B6L3_FOUR_PILOT_AUTH_ID,
  METHOD_C_B6L3_FOUR_PILOT_CONFIRM_TOKEN,
  METHOD_C_B6L3_FOUR_PILOT_EXPECTED_TOTAL,
  METHOD_C_CANONICAL_REPAIR_CONFIRM_TOKEN,
  METHOD_C_CANONICAL_SOURCE_ARTIFACT_DIGEST,
  METHOD_C_CANONICAL_SOURCE_RUN_ID,
  METHOD_C_REMAINING_CONFIRM_TOKEN,
  METHOD_C_REMAINING_EIGHT_AUTH_ID,
  METHOD_C_REMAINING_EIGHT_CONFIRM_TOKEN,
  METHOD_C_REMAINING_EIGHT_EXPECTED_TOTAL,
} from "./constants";
import { selectMethodAFourCellPilot } from "./methodAFourCellPilot";
import { selectMethodARemainingSix } from "./methodARemainingSix";
import { setupMethodARemainingSixFixtures } from "./methodARemainingSixFixtures";
import { selectMethodBToCFourCellPilot } from "./methodBToCFourCellPilot";
import { selectMethodBToCRemainingEight } from "./methodBToCRemainingEight";
import { selectMethodCRemainingCells } from "./methodCRemaining";

import {
  assertSourceUnchanged,
  buildSourceHashLedger,
  resolveAuthorizedAllowlist,
  stageCanonicalMethodCArtifact,
} from "./methodCCanonicalRepair";
import { resolveLocalePackage } from "./localePackages";
import {
  getControlledFailureState,
  markControlledFailureTriggered,
  resetControlledFailureState,
  shouldInjectControlledFailure,
} from "./controlledFailure";
import { loadClassification100, validateClassification100 } from "./loadClassification";
import { allGoldenReferencesOk, loadGoldenReferences, verifyGoldenReferences } from "./goldenRefs";
import {
  ARTIFACTS_CANONICAL_STAGING_DIR,
  ARTIFACTS_PROVENANCE_DIR,
  ARTIFACTS_RECEIPTS_DIR,
  ARTIFACTS_REPORTS_DIR,
  cellArtifactDir,
  cellFinalPngPath,
  cellReceiptPath,
} from "./paths";
import { runAuthorizedExternalRoute } from "./routes/authorizedExternal";
import { captureMethodAPilotCell, writeCaptureEvidenceJson } from "./routes/methodALiveCapture";
import {
  captureMethodARemainingSixCell,
  writeRemainingSixCaptureEvidenceJson,
} from "./routes/methodARemainingSixCapture";
import { runMasaaratScreenshotRoute } from "./routes/masaaratScreenshot";
import {
  generateInstructionalComposition,
  renderTelemetry,
  resetRenderTelemetry,
} from "./routes/instructionalComposition";
import type { CellReceipt, ManifestCell, ProductionManifest, RunnerMode } from "./types";
import { validateProductionManifest } from "./validateManifest";
import { reconcileFailedOnlyIntoPilot } from "./reconcileFailedOnlyIntoPilot";

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
    const cellDir = cellArtifactDir(cell.cellId);
    const outPath = cellFinalPngPath(cell.cellId);
    mkdirSync(cellDir, { recursive: true });
    writeFileSync(outPath, result.png);
    copyFileSync(result.htmlPath, join(cellDir, "final-review.html"));

    const artifactSha256 = sha256HexOfBuffer(result.png);
    const isPendingPilot =
      mode === "method-c-b6l3-four-pilot" || mode === "method-c-b-to-c-remaining-eight";
    const status = isPendingPilot ? ("PENDING" as const) : ("ACCEPTED" as const);
    const reason = isPendingPilot ? "PENDING_HUMAN_REVIEW" : null;

    if (isPendingPilot) {
      mkdirSync(ARTIFACTS_PROVENANCE_DIR, { recursive: true });
      const authId =
        mode === "method-c-b-to-c-remaining-eight"
          ? METHOD_C_REMAINING_EIGHT_AUTH_ID
          : METHOD_C_B6L3_FOUR_PILOT_AUTH_ID;
      writeJson(join(ARTIFACTS_PROVENANCE_DIR, `${cell.cellId}.provenance.json`), {
        schemaVersion: "controlled-v1-pilot-cell-provenance/1",
        authorizationId: authId,
        cellId: cell.cellId,
        lessonId: cell.lessonId,
        locale: cell.locale,
        classification: { category: cell.category, route: cell.route },
        rights: {
          basis: "ORIGINAL_INSTRUCTIONAL_COMPOSITION",
          externalScreenshotSource: null,
          noValidRightsBasisReason: "NO_VALID_RIGHTS_BASIS",
        },
        localeEvidence: {
          packagePath: result.packagePath,
          packageExists: result.packageExists,
          direction: result.direction,
          localizedTitle: result.localizedTitle,
        },
        renderer: {
          kind: "instructional-composition-chrome-html-to-png",
          providerCalls: 0,
          paidProviderCalls: 0,
        },
        artifactSha256,
        status,
        reason,
        producedAt,
      });
    }

    return {
      receiptVersion: "controlled-v1-receipt/1",
      cellId: cell.cellId,
      lessonId: cell.lessonId,
      locale: cell.locale,
      route: cell.route,
      mode,
      status,
      reason,
      artifactPath: outPath,
      artifactSha256,
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

/**
 * Produce the remaining 356 Method C cells (exclude 4 preserved pilot C cells and all A/B).
 * Confirmation must equal METHOD_C_REMAINING_CONFIRM_TOKEN exactly.
 * Under CONTROLLED_V1_ZERO_RENDER=1, performs dry selection only (no Chrome / no PNGs).
 */
export function runMethodCRemaining(confirmToken: string | undefined): RunResult {
  if (confirmToken !== METHOD_C_REMAINING_CONFIRM_TOKEN) {
    const msg = `method-c-remaining requires confirm_full_400 === "${METHOD_C_REMAINING_CONFIRM_TOKEN}" exactly; received ${JSON.stringify(confirmToken)}`;
    return { mode: "method-c-remaining", ok: false, summary: msg, receipts: [], errors: [msg] };
  }

  const classification = loadClassification100();
  const manifest = buildProductionManifest(classification);
  const manifestCheck = validateProductionManifest(manifest);
  if (!manifestCheck.ok) {
    return {
      mode: "method-c-remaining",
      ok: false,
      summary: "manifest validation failed; refusing method-c-remaining",
      receipts: [],
      errors: manifestCheck.errors,
    };
  }

  const selection = selectMethodCRemainingCells(manifest);
  writeJson(`${ARTIFACTS_REPORTS_DIR}/method-c-remaining-selection.json`, {
    generatedAt: new Date().toISOString(),
    ok: selection.ok,
    counts: selection.counts,
    excludedPreservedPilotCellIds: selection.excludedPreservedPilotCellIds,
    excludedAbCellCount: selection.excludedAbCellIds.length,
    excludedReplacementCellCount: selection.excludedReplacementCellIds.length,
    cellIds: selection.cells.map((c) => c.cellId),
    errors: selection.errors,
  });

  if (!selection.ok) {
    return {
      mode: "method-c-remaining",
      ok: false,
      summary: "method-c-remaining selection failed closed",
      receipts: [],
      errors: selection.errors,
    };
  }

  // Locale isolation gate before any render.
  const localeErrors: string[] = [];
  for (const cell of selection.cells) {
    const pkg = resolveLocalePackage(cell.lessonId, cell.locale, cell.title);
    if (!pkg.exists) {
      localeErrors.push(
        `missing locale package for ${cell.cellId}: expected ${pkg.path} (no cross-locale fallback)`,
      );
    }
    if (pkg.locale !== cell.locale) {
      localeErrors.push(`locale package mismatch for ${cell.cellId}`);
    }
  }
  if (localeErrors.length > 0) {
    return {
      mode: "method-c-remaining",
      ok: false,
      summary: "method-c-remaining locale isolation failed closed",
      receipts: [],
      errors: localeErrors,
    };
  }

  if (process.env.CONTROLLED_V1_ZERO_RENDER === "1") {
    writeRunReport("method-c-remaining", {
      generatedAt: new Date().toISOString(),
      confirmToken,
      drySelectOnly: true,
      counts: selection.counts,
      selectedCellIds: selection.cells.map((c) => c.cellId),
    });
    return {
      mode: "method-c-remaining",
      ok: true,
      summary: `method-c-remaining dry-select: ${selection.cells.length} cells (0 A / 0 B / 356 C); no render`,
      receipts: [],
      errors: [],
    };
  }

  const receipts: CellReceipt[] = [];
  for (const cell of selection.cells) {
    // Never select or render A/B; selection already excludes them.
    if (cell.route !== "INSTRUCTIONAL_COMPOSITION") {
      return {
        mode: "method-c-remaining",
        ok: false,
        summary: `refusing A/B-to-C fallback for ${cell.cellId}`,
        receipts,
        errors: [`non-Method-C cell reached renderer: ${cell.cellId}`],
      };
    }
    const receipt = runCell(cell, "method-c-remaining");
    writeReceipt(receipt);
    receipts.push(receipt);
    // Do not retry ACCEPTED cells; runCell is invoked once per selected cell.
  }

  const counts = receiptCounts(receipts);
  const failed = receipts.filter((r) => r.status !== "ACCEPTED");
  writeJson(`${ARTIFACTS_RECEIPTS_DIR}/method-c-remaining/_summary.json`, {
    generatedAt: new Date().toISOString(),
    counts,
    selection: {
      total: selection.counts.total,
      perLocale: selection.counts.perLocale,
      excludedPreservedPilotCellIds: selection.excludedPreservedPilotCellIds,
      excludedAbCellCount: selection.excludedAbCellIds.length,
    },
    failedCellLedger: failed.map((r) => ({
      cellId: r.cellId,
      status: r.status,
      reason: r.reason,
    })),
    receipts,
  });
  writeRunReport("method-c-remaining", {
    generatedAt: new Date().toISOString(),
    confirmToken,
    drySelectOnly: false,
    counts,
    selectionCounts: selection.counts,
    failedCount: failed.length,
  });

  const anyControlledFailure = receipts.some((r) => r.controlledFailureInjected);
  const ok = !anyControlledFailure && failed.length === 0;
  return {
    mode: "method-c-remaining",
    ok,
    summary: `method-c-remaining: ${receipts.length} cells, counts=${JSON.stringify(counts)}`,
    receipts,
    errors: [
      ...(anyControlledFailure
        ? ["controlled failure was injected during method-c-remaining — must never happen"]
        : []),
      ...failed.map((r) => `${r.cellId}: ${r.reason ?? r.status}`),
    ],
  };
}

/**
 * Exact four-cell Method B→C pilot for builder-m6-l3-first-prompt-to-lovable × 4 locales.
 * Receipts remain PENDING / PENDING_HUMAN_REVIEW — never production-accepted.
 */
export function runMethodBToCFourCellPilot(confirmToken: string | undefined): RunResult {
  if (confirmToken !== METHOD_C_B6L3_FOUR_PILOT_CONFIRM_TOKEN) {
    const msg = `method-c-b6l3-four-pilot requires confirm_full_400 === "${METHOD_C_B6L3_FOUR_PILOT_CONFIRM_TOKEN}" exactly; received ${JSON.stringify(confirmToken)}`;
    return {
      mode: "method-c-b6l3-four-pilot",
      ok: false,
      summary: msg,
      receipts: [],
      errors: [msg],
    };
  }

  resetRenderTelemetry();
  const classification = loadClassification100();
  const manifest = buildProductionManifest(classification);
  const manifestCheck = validateProductionManifest(manifest);
  if (!manifestCheck.ok) {
    return {
      mode: "method-c-b6l3-four-pilot",
      ok: false,
      summary: "manifest validation failed; refusing four-cell pilot",
      receipts: [],
      errors: manifestCheck.errors,
    };
  }

  const selection = selectMethodBToCFourCellPilot(manifest);
  writeJson(`${ARTIFACTS_REPORTS_DIR}/method-c-b6l3-four-pilot-selection.json`, {
    generatedAt: new Date().toISOString(),
    authorizationId: METHOD_C_B6L3_FOUR_PILOT_AUTH_ID,
    ok: selection.ok,
    counts: selection.counts,
    cellIds: selection.cells.map((c) => c.cellId),
    errors: selection.errors,
  });

  if (!selection.ok) {
    return {
      mode: "method-c-b6l3-four-pilot",
      ok: false,
      summary: "method-c-b6l3-four-pilot selection failed closed",
      receipts: [],
      errors: selection.errors,
    };
  }

  const localeErrors: string[] = [];
  for (const cell of selection.cells) {
    const pkg = resolveLocalePackage(cell.lessonId, cell.locale, cell.title);
    if (!pkg.exists) {
      localeErrors.push(
        `missing locale package for ${cell.cellId}: expected ${pkg.path} (no cross-locale fallback)`,
      );
    }
    if (pkg.locale !== cell.locale) {
      localeErrors.push(`locale package mismatch for ${cell.cellId}`);
    }
  }
  if (localeErrors.length > 0) {
    return {
      mode: "method-c-b6l3-four-pilot",
      ok: false,
      summary: "method-c-b6l3-four-pilot locale isolation failed closed",
      receipts: [],
      errors: localeErrors,
    };
  }

  if (process.env.CONTROLLED_V1_ZERO_RENDER === "1") {
    writeRunReport("method-c-b6l3-four-pilot", {
      generatedAt: new Date().toISOString(),
      confirmToken,
      drySelectOnly: true,
      authorizationId: METHOD_C_B6L3_FOUR_PILOT_AUTH_ID,
      counts: selection.counts,
      selectedCellIds: selection.cells.map((c) => c.cellId),
    });
    return {
      mode: "method-c-b6l3-four-pilot",
      ok: true,
      summary: `method-c-b6l3-four-pilot dry-select: ${selection.cells.length} cells; Method A 0; other replacements 0; accepted Method C 0; no render`,
      receipts: [],
      errors: [],
    };
  }

  const receipts: CellReceipt[] = [];
  for (const cell of selection.cells) {
    if (cell.route !== "INSTRUCTIONAL_COMPOSITION" || cell.category !== "C") {
      return {
        mode: "method-c-b6l3-four-pilot",
        ok: false,
        summary: `refusing non-Method-C cell ${cell.cellId}`,
        receipts,
        errors: [`non-Method-C cell reached renderer: ${cell.cellId}`],
      };
    }
    const receipt = runCell(cell, "method-c-b6l3-four-pilot");
    writeReceipt(receipt);
    receipts.push(receipt);
  }

  const counts = receiptCounts(receipts);
  const failed = receipts.filter(
    (r) => r.status === "FAILED" || r.status === "BLOCKED_UNRESOLVED_SPEC",
  );
  const pending = receipts.filter(
    (r) => r.status === "PENDING" && r.reason === "PENDING_HUMAN_REVIEW",
  );
  const accepted = receipts.filter((r) => r.status === "ACCEPTED");

  writeJson(`${ARTIFACTS_RECEIPTS_DIR}/method-c-b6l3-four-pilot/_summary.json`, {
    generatedAt: new Date().toISOString(),
    authorizationId: METHOD_C_B6L3_FOUR_PILOT_AUTH_ID,
    counts,
    selection: selection.counts,
    pendingHumanReview: pending.map((r) => r.cellId),
    receipts,
    renderTelemetry: { ...renderTelemetry },
  });
  writeRunReport("method-c-b6l3-four-pilot", {
    generatedAt: new Date().toISOString(),
    confirmToken,
    authorizationId: METHOD_C_B6L3_FOUR_PILOT_AUTH_ID,
    drySelectOnly: false,
    counts,
    selectionCounts: selection.counts,
    pendingCount: pending.length,
    failedCount: failed.length,
    acceptedCount: accepted.length,
    renderTelemetry: { ...renderTelemetry },
  });

  const telemetryOk =
    renderTelemetry.paidProviderCalls === 0 && renderTelemetry.rendererCalls === receipts.length;
  const ok =
    receipts.length === METHOD_C_B6L3_FOUR_PILOT_EXPECTED_TOTAL &&
    pending.length === METHOD_C_B6L3_FOUR_PILOT_EXPECTED_TOTAL &&
    failed.length === 0 &&
    accepted.length === 0 &&
    telemetryOk;

  return {
    mode: "method-c-b6l3-four-pilot",
    ok,
    summary: `method-c-b6l3-four-pilot: ${receipts.length} cells PENDING_HUMAN_REVIEW; Method A 0; other replacements 0; accepted Method C 0; providerCalls=0`,
    receipts,
    errors: [
      ...(accepted.length > 0
        ? [`pilot must not mark cells ACCEPTED; got ${accepted.length}`]
        : []),
      ...(pending.length !== METHOD_C_B6L3_FOUR_PILOT_EXPECTED_TOTAL
        ? [
            `expected ${METHOD_C_B6L3_FOUR_PILOT_EXPECTED_TOTAL} PENDING receipts, got ${pending.length}`,
          ]
        : []),
      ...(!telemetryOk
        ? [
            `telemetry gate failed: renderer=${renderTelemetry.rendererCalls} paid=${renderTelemetry.paidProviderCalls}`,
          ]
        : []),
      ...failed.map((r) => `${r.cellId}: ${r.reason ?? r.status}`),
    ],
  };
}

/**
 * Exact four-cell Method A capture pilot:
 * builder-m7-l1-tables-columns × {ar-EG, ar-MSA, ar-Gulf, en}.
 * Live capture against local-dev /system-state only. Receipts stay PENDING_HUMAN_REVIEW.
 */
export async function runMethodAFourCellPilot(
  confirmToken: string | undefined,
): Promise<RunResult> {
  if (confirmToken !== METHOD_A_M7L1_FOUR_PILOT_CONFIRM_TOKEN) {
    const msg = `method-a-m7l1-four-pilot requires confirm_full_400 === "${METHOD_A_M7L1_FOUR_PILOT_CONFIRM_TOKEN}" exactly; received ${JSON.stringify(confirmToken)}`;
    return {
      mode: "method-a-m7l1-four-pilot",
      ok: false,
      summary: msg,
      receipts: [],
      errors: [msg],
    };
  }

  const classification = loadClassification100();
  const manifest = buildProductionManifest(classification);
  const manifestCheck = validateProductionManifest(manifest);
  if (!manifestCheck.ok) {
    return {
      mode: "method-a-m7l1-four-pilot",
      ok: false,
      summary: "manifest validation failed; refusing Method A four-locale pilot",
      receipts: [],
      errors: manifestCheck.errors,
    };
  }

  const selection = selectMethodAFourCellPilot(manifest);
  writeJson(`${ARTIFACTS_REPORTS_DIR}/method-a-m7l1-four-pilot-selection.json`, {
    generatedAt: new Date().toISOString(),
    authorizationId: METHOD_A_M7L1_FOUR_PILOT_AUTH_ID,
    ok: selection.ok,
    counts: selection.counts,
    cellIds: selection.cells.map((c) => c.cellId),
    errors: selection.errors,
  });

  if (!selection.ok) {
    return {
      mode: "method-a-m7l1-four-pilot",
      ok: false,
      summary: "method-a-m7l1-four-pilot selection failed closed",
      receipts: [],
      errors: selection.errors,
    };
  }

  if (
    process.env.CONTROLLED_V1_ZERO_CAPTURE === "1" ||
    process.env.CONTROLLED_V1_ZERO_RENDER === "1"
  ) {
    writeRunReport("method-a-m7l1-four-pilot", {
      generatedAt: new Date().toISOString(),
      confirmToken,
      drySelectOnly: true,
      authorizationId: METHOD_A_M7L1_FOUR_PILOT_AUTH_ID,
      counts: selection.counts,
      selectedCellIds: selection.cells.map((c) => c.cellId),
    });
    return {
      mode: "method-a-m7l1-four-pilot",
      ok: true,
      summary: `method-a-m7l1-four-pilot dry-select: ${selection.cells.length} cells; Method B 0; Method C 0; other Method A 0; no capture`,
      receipts: [],
      errors: [],
    };
  }

  const receipts: CellReceipt[] = [];
  const captureErrors: string[] = [];

  for (const cell of selection.cells) {
    if (cell.route !== "MASAARAT_SCREENSHOT" || cell.category !== "A") {
      return {
        mode: "method-a-m7l1-four-pilot",
        ok: false,
        summary: `refusing non-Method-A cell ${cell.cellId}`,
        receipts,
        errors: [`non-Method-A cell reached capture: ${cell.cellId}`],
      };
    }

    const producedAt = new Date().toISOString();
    const cellDir = cellArtifactDir(cell.cellId);
    const outPath = cellFinalPngPath(cell.cellId);
    const capture = await captureMethodAPilotCell({
      lessonId: cell.lessonId,
      locale: cell.locale,
      cellId: cell.cellId,
      outputDir: cellDir,
    });

    if (!capture.ok) {
      const reason = capture.errors.join("; ");
      captureErrors.push(`${cell.cellId}: ${reason}`);
      const failedReceipt: CellReceipt = {
        receiptVersion: "controlled-v1-receipt/1",
        cellId: cell.cellId,
        lessonId: cell.lessonId,
        locale: cell.locale,
        route: cell.route,
        mode: "method-a-m7l1-four-pilot",
        status: "FAILED",
        reason,
        artifactPath: null,
        artifactSha256: null,
        bytesWritten: null,
        controlledFailureInjected: false,
        producedAt,
      };
      writeReceipt(failedReceipt);
      if (capture.evidence) {
        writeCaptureEvidenceJson(
          join(ARTIFACTS_REPORTS_DIR, `method-a-capture-evidence-${cell.cellId}.json`),
          cell.cellId,
          capture.evidence,
          null,
        );
      }
      receipts.push(failedReceipt);
      // Fail closed: do not continue finalizing further cells after a failed assertion.
      break;
    }

    writeCaptureEvidenceJson(
      join(ARTIFACTS_REPORTS_DIR, `method-a-capture-evidence-${cell.cellId}.json`),
      cell.cellId,
      capture.evidence,
      capture.sha256,
    );

    mkdirSync(ARTIFACTS_PROVENANCE_DIR, { recursive: true });
    writeJson(join(ARTIFACTS_PROVENANCE_DIR, `${cell.cellId}.provenance.json`), {
      schemaVersion: "controlled-v1-pilot-cell-provenance/1",
      authorizationId: METHOD_A_M7L1_FOUR_PILOT_AUTH_ID,
      cellId: cell.cellId,
      lessonId: cell.lessonId,
      locale: cell.locale,
      classification: { category: cell.category, route: cell.route },
      capture: {
        kind: "masaarat-authenticated-local-dev-screenshot",
        route: capture.evidence.route,
        resolvedLocale: capture.evidence.resolvedLocale,
        direction: capture.evidence.direction,
        sessionUrl: capture.evidence.finalUrl,
        readiness: capture.evidence.readiness,
        redaction: capture.evidence.redaction,
        networkAudit: capture.evidence.networkAudit,
        providerCalls: 0,
        paidProviderCalls: 0,
      },
      rights: {
        basis: "FIRST_PARTY_MASAARAT_LOCAL_DEV_CAPTURE",
        externalScreenshotSource: null,
      },
      artifactSha256: capture.sha256,
      status: "PENDING",
      reason: "PENDING_HUMAN_REVIEW",
      productionAccepted: false,
      producedAt,
    });

    const receipt: CellReceipt = {
      receiptVersion: "controlled-v1-receipt/1",
      cellId: cell.cellId,
      lessonId: cell.lessonId,
      locale: cell.locale,
      route: cell.route,
      mode: "method-a-m7l1-four-pilot",
      status: "PENDING",
      reason: "PENDING_HUMAN_REVIEW",
      artifactPath: outPath,
      artifactSha256: capture.sha256,
      bytesWritten: capture.png.length,
      controlledFailureInjected: false,
      producedAt,
    };
    writeReceipt(receipt);
    receipts.push(receipt);
  }

  const counts = receiptCounts(receipts);
  const failed = receipts.filter(
    (r) => r.status === "FAILED" || r.status === "BLOCKED_UNRESOLVED_SPEC",
  );
  const pending = receipts.filter(
    (r) => r.status === "PENDING" && r.reason === "PENDING_HUMAN_REVIEW",
  );
  const accepted = receipts.filter((r) => r.status === "ACCEPTED");

  writeJson(`${ARTIFACTS_RECEIPTS_DIR}/method-a-m7l1-four-pilot/_summary.json`, {
    generatedAt: new Date().toISOString(),
    authorizationId: METHOD_A_M7L1_FOUR_PILOT_AUTH_ID,
    counts,
    selection: selection.counts,
    pendingHumanReview: pending.map((r) => r.cellId),
    receipts,
  });
  writeRunReport("method-a-m7l1-four-pilot", {
    generatedAt: new Date().toISOString(),
    confirmToken,
    authorizationId: METHOD_A_M7L1_FOUR_PILOT_AUTH_ID,
    drySelectOnly: false,
    counts,
    selectionCounts: selection.counts,
    pendingCount: pending.length,
    failedCount: failed.length,
    acceptedCount: accepted.length,
  });

  const ok =
    receipts.length === METHOD_A_M7L1_FOUR_PILOT_EXPECTED_TOTAL &&
    pending.length === METHOD_A_M7L1_FOUR_PILOT_EXPECTED_TOTAL &&
    failed.length === 0 &&
    accepted.length === 0 &&
    captureErrors.length === 0;

  return {
    mode: "method-a-m7l1-four-pilot",
    ok,
    summary: ok
      ? `method-a-m7l1-four-pilot: ${receipts.length} cells PENDING_HUMAN_REVIEW; Method B 0; Method C 0; other Method A 0; providerCalls=0`
      : `method-a-m7l1-four-pilot failed closed: pending=${pending.length} failed=${failed.length}`,
    receipts,
    errors: [
      ...(accepted.length > 0
        ? [`pilot must not mark cells ACCEPTED; got ${accepted.length}`]
        : []),
      ...(pending.length !== METHOD_A_M7L1_FOUR_PILOT_EXPECTED_TOTAL
        ? [
            `expected ${METHOD_A_M7L1_FOUR_PILOT_EXPECTED_TOTAL} PENDING receipts, got ${pending.length}`,
          ]
        : []),
      ...captureErrors,
      ...failed.map((r) => `${r.cellId}: ${r.reason ?? r.status}`),
    ],
  };
}

/**
 * Exact 24-cell remaining Method A capture run: six lessons × four locales
 * (builder-m2-l1-prompt-layer, builder-m2-l2-instructions-examples,
 * builder-m3-l1-context-layer, builder-m6-l4-components-routes,
 * builder-m7-l3-queries, builder-m10-l2-first-users). Live capture against
 * local-dev only. Receipts stay PENDING_HUMAN_REVIEW. Never re-captures the
 * already human-accepted four-locale pilot lesson.
 */
export async function runMethodARemainingSixLessons(
  confirmToken: string | undefined,
): Promise<RunResult> {
  if (confirmToken !== METHOD_A_REMAINING_SIX_CONFIRM_TOKEN) {
    const msg = `method-a-remaining-six-lessons-24 requires confirm_full_400 === "${METHOD_A_REMAINING_SIX_CONFIRM_TOKEN}" exactly; received ${JSON.stringify(confirmToken)}`;
    return {
      mode: "method-a-remaining-six-lessons-24",
      ok: false,
      summary: msg,
      receipts: [],
      errors: [msg],
    };
  }

  const classification = loadClassification100();
  const manifest = buildProductionManifest(classification);
  const manifestCheck = validateProductionManifest(manifest);
  if (!manifestCheck.ok) {
    return {
      mode: "method-a-remaining-six-lessons-24",
      ok: false,
      summary: "manifest validation failed; refusing Method A remaining-six run",
      receipts: [],
      errors: manifestCheck.errors,
    };
  }

  const selection = selectMethodARemainingSix(manifest);
  writeJson(`${ARTIFACTS_REPORTS_DIR}/method-a-remaining-six-lessons-24-selection.json`, {
    generatedAt: new Date().toISOString(),
    authorizationId: METHOD_A_REMAINING_SIX_AUTH_ID,
    ok: selection.ok,
    counts: selection.counts,
    cellIds: selection.cells.map((c) => c.cellId),
    errors: selection.errors,
  });

  if (!selection.ok) {
    return {
      mode: "method-a-remaining-six-lessons-24",
      ok: false,
      summary: "method-a-remaining-six-lessons-24 selection failed closed",
      receipts: [],
      errors: selection.errors,
    };
  }

  if (
    process.env.CONTROLLED_V1_ZERO_CAPTURE === "1" ||
    process.env.CONTROLLED_V1_ZERO_RENDER === "1"
  ) {
    writeRunReport("method-a-remaining-six-lessons-24", {
      generatedAt: new Date().toISOString(),
      confirmToken,
      drySelectOnly: true,
      authorizationId: METHOD_A_REMAINING_SIX_AUTH_ID,
      counts: selection.counts,
      selectedCellIds: selection.cells.map((c) => c.cellId),
    });
    return {
      mode: "method-a-remaining-six-lessons-24",
      ok: true,
      summary: `method-a-remaining-six-lessons-24 dry-select: ${selection.cells.length} cells; Method B 0; Method C 0; other Method A 0; accepted pilot 0; no capture`,
      receipts: [],
      errors: [],
    };
  }

  const fixtures = await setupMethodARemainingSixFixtures();
  writeJson(`${ARTIFACTS_REPORTS_DIR}/method-a-remaining-six-lessons-24-fixtures.json`, {
    generatedAt: new Date().toISOString(),
    ok: fixtures.ok,
    userIdSanitized: fixtures.userIdSanitized,
    before: fixtures.before,
    after: fixtures.after,
    errors: fixtures.errors,
  });
  if (!fixtures.ok) {
    return {
      mode: "method-a-remaining-six-lessons-24",
      ok: false,
      summary: "method-a-remaining-six-lessons-24 fixture setup failed closed; refusing capture",
      receipts: [],
      errors: fixtures.errors,
    };
  }

  // Mandatory pre-capture readiness: validate all 24 cells before writing any PNG.
  const readinessFailures: string[] = [];
  const readinessReport: Array<{
    cellId: string;
    ok: boolean;
    errors: string[];
    resolvedLocale?: string | null;
    direction?: string | null;
  }> = [];
  for (const cell of selection.cells) {
    const ready = await captureMethodARemainingSixCell({
      lessonId: cell.lessonId,
      locale: cell.locale,
      cellId: cell.cellId,
      outputDir: cellArtifactDir(cell.cellId),
      readinessOnly: true,
    });
    if (!ready.ok) {
      readinessFailures.push(`${cell.cellId}: ${ready.errors.join("; ")}`);
      readinessReport.push({ cellId: cell.cellId, ok: false, errors: ready.errors });
      continue;
    }
    readinessReport.push({
      cellId: cell.cellId,
      ok: true,
      errors: [],
      resolvedLocale: ready.evidence.resolvedLocale,
      direction: ready.evidence.direction,
    });
  }
  writeJson(
    `${ARTIFACTS_REPORTS_DIR}/method-a-remaining-six-lessons-24-pre-capture-readiness.json`,
    {
      generatedAt: new Date().toISOString(),
      authorizationId: METHOD_A_REMAINING_SIX_AUTH_ID,
      ok: readinessFailures.length === 0,
      validated: readinessReport.length,
      failures: readinessFailures,
      cells: readinessReport,
    },
  );
  if (readinessFailures.length > 0) {
    return {
      mode: "method-a-remaining-six-lessons-24",
      ok: false,
      summary: `method-a-remaining-six-lessons-24 pre-capture readiness failed closed; captured 0 cells; failures=${readinessFailures.length}`,
      receipts: [],
      errors: readinessFailures,
    };
  }

  const receipts: CellReceipt[] = [];
  const captureErrors: string[] = [];

  for (const cell of selection.cells) {
    if (cell.route !== "MASAARAT_SCREENSHOT" || cell.category !== "A") {
      return {
        mode: "method-a-remaining-six-lessons-24",
        ok: false,
        summary: `refusing non-Method-A cell ${cell.cellId}`,
        receipts,
        errors: [`non-Method-A cell reached capture: ${cell.cellId}`],
      };
    }

    const producedAt = new Date().toISOString();
    const cellDir = cellArtifactDir(cell.cellId);
    const outPath = cellFinalPngPath(cell.cellId);
    const capture = await captureMethodARemainingSixCell({
      lessonId: cell.lessonId,
      locale: cell.locale,
      cellId: cell.cellId,
      outputDir: cellDir,
    });

    if (!capture.ok || ("readinessOnly" in capture && capture.readinessOnly)) {
      const reason = !capture.ok
        ? capture.errors.join("; ")
        : "readiness-only result returned during capture phase";
      captureErrors.push(`${cell.cellId}: ${reason}`);
      const failedReceipt: CellReceipt = {
        receiptVersion: "controlled-v1-receipt/1",
        cellId: cell.cellId,
        lessonId: cell.lessonId,
        locale: cell.locale,
        route: cell.route,
        mode: "method-a-remaining-six-lessons-24",
        status: "FAILED",
        reason,
        artifactPath: null,
        artifactSha256: null,
        bytesWritten: null,
        controlledFailureInjected: false,
        producedAt,
      };
      writeReceipt(failedReceipt);
      if (!capture.ok && capture.evidence) {
        writeRemainingSixCaptureEvidenceJson(
          join(
            ARTIFACTS_REPORTS_DIR,
            `method-a-remaining-six-capture-evidence-${cell.cellId}.json`,
          ),
          cell.cellId,
          capture.evidence,
          null,
        );
      }
      receipts.push(failedReceipt);
      // Fail closed: do not continue finalizing further cells after a failed assertion.
      break;
    }

    writeRemainingSixCaptureEvidenceJson(
      join(ARTIFACTS_REPORTS_DIR, `method-a-remaining-six-capture-evidence-${cell.cellId}.json`),
      cell.cellId,
      capture.evidence,
      capture.sha256,
    );

    mkdirSync(ARTIFACTS_PROVENANCE_DIR, { recursive: true });
    writeJson(join(ARTIFACTS_PROVENANCE_DIR, `${cell.cellId}.provenance.json`), {
      schemaVersion: "controlled-v1-pilot-cell-provenance/1",
      authorizationId: METHOD_A_REMAINING_SIX_AUTH_ID,
      cellId: cell.cellId,
      lessonId: cell.lessonId,
      locale: cell.locale,
      classification: { category: cell.category, route: cell.route },
      capture: {
        kind: "masaarat-authenticated-local-dev-screenshot",
        concept: capture.evidence.concept,
        route: capture.evidence.route,
        resolvedLocale: capture.evidence.resolvedLocale,
        direction: capture.evidence.direction,
        sessionUrl: capture.evidence.finalUrl,
        readiness: capture.evidence.readiness,
        redaction: capture.evidence.redaction,
        networkAudit: capture.evidence.networkAudit,
        providerCalls: 0,
        paidProviderCalls: 0,
      },
      rights: {
        basis: "FIRST_PARTY_MASAARAT_LOCAL_DEV_CAPTURE",
        externalScreenshotSource: null,
      },
      artifactSha256: capture.sha256,
      status: "PENDING",
      reason: "PENDING_HUMAN_REVIEW",
      productionAccepted: false,
      producedAt,
    });

    const receipt: CellReceipt = {
      receiptVersion: "controlled-v1-receipt/1",
      cellId: cell.cellId,
      lessonId: cell.lessonId,
      locale: cell.locale,
      route: cell.route,
      mode: "method-a-remaining-six-lessons-24",
      status: "PENDING",
      reason: "PENDING_HUMAN_REVIEW",
      artifactPath: outPath,
      artifactSha256: capture.sha256,
      bytesWritten: capture.png.length,
      controlledFailureInjected: false,
      producedAt,
    };
    writeReceipt(receipt);
    receipts.push(receipt);
  }

  const counts = receiptCounts(receipts);
  const failed = receipts.filter(
    (r) => r.status === "FAILED" || r.status === "BLOCKED_UNRESOLVED_SPEC",
  );
  const pending = receipts.filter(
    (r) => r.status === "PENDING" && r.reason === "PENDING_HUMAN_REVIEW",
  );
  const accepted = receipts.filter((r) => r.status === "ACCEPTED");

  writeJson(`${ARTIFACTS_RECEIPTS_DIR}/method-a-remaining-six-lessons-24/_summary.json`, {
    generatedAt: new Date().toISOString(),
    authorizationId: METHOD_A_REMAINING_SIX_AUTH_ID,
    counts,
    selection: selection.counts,
    pendingHumanReview: pending.map((r) => r.cellId),
    receipts,
  });
  writeRunReport("method-a-remaining-six-lessons-24", {
    generatedAt: new Date().toISOString(),
    confirmToken,
    authorizationId: METHOD_A_REMAINING_SIX_AUTH_ID,
    drySelectOnly: false,
    counts,
    selectionCounts: selection.counts,
    pendingCount: pending.length,
    failedCount: failed.length,
    acceptedCount: accepted.length,
  });

  const ok =
    receipts.length === METHOD_A_REMAINING_SIX_EXPECTED_TOTAL &&
    pending.length === METHOD_A_REMAINING_SIX_EXPECTED_TOTAL &&
    failed.length === 0 &&
    accepted.length === 0 &&
    captureErrors.length === 0;

  return {
    mode: "method-a-remaining-six-lessons-24",
    ok,
    summary: ok
      ? `method-a-remaining-six-lessons-24: ${receipts.length} cells PENDING_HUMAN_REVIEW; Method B 0; Method C 0; other Method A 0; accepted pilot 0; providerCalls=0`
      : `method-a-remaining-six-lessons-24 failed closed: pending=${pending.length} failed=${failed.length}`,
    receipts,
    errors: [
      ...(accepted.length > 0
        ? [`remaining-six must not mark cells ACCEPTED; got ${accepted.length}`]
        : []),
      ...(pending.length !== METHOD_A_REMAINING_SIX_EXPECTED_TOTAL
        ? [
            `expected ${METHOD_A_REMAINING_SIX_EXPECTED_TOTAL} PENDING receipts, got ${pending.length}`,
          ]
        : []),
      ...captureErrors,
      ...failed.map((r) => `${r.cellId}: ${r.reason ?? r.status}`),
    ],
  };
}

/**
 * Exact eight-cell remaining Method B→C replacements:
 * intro-m1-l3-setup-your-ai × 4 + builder-m5-l2-frontend × 4.
 * Receipts remain PENDING / PENDING_HUMAN_REVIEW.
 */
export function runMethodBToCRemainingEight(confirmToken: string | undefined): RunResult {
  if (confirmToken !== METHOD_C_REMAINING_EIGHT_CONFIRM_TOKEN) {
    const msg = `method-c-b-to-c-remaining-eight requires confirm_full_400 === "${METHOD_C_REMAINING_EIGHT_CONFIRM_TOKEN}" exactly; received ${JSON.stringify(confirmToken)}`;
    return {
      mode: "method-c-b-to-c-remaining-eight",
      ok: false,
      summary: msg,
      receipts: [],
      errors: [msg],
    };
  }

  resetRenderTelemetry();
  const classification = loadClassification100();
  const manifest = buildProductionManifest(classification);
  const manifestCheck = validateProductionManifest(manifest);
  if (!manifestCheck.ok) {
    return {
      mode: "method-c-b-to-c-remaining-eight",
      ok: false,
      summary: "manifest validation failed; refusing remaining-eight",
      receipts: [],
      errors: manifestCheck.errors,
    };
  }

  const selection = selectMethodBToCRemainingEight(manifest);
  writeJson(`${ARTIFACTS_REPORTS_DIR}/method-c-b-to-c-remaining-eight-selection.json`, {
    generatedAt: new Date().toISOString(),
    authorizationId: METHOD_C_REMAINING_EIGHT_AUTH_ID,
    ok: selection.ok,
    counts: selection.counts,
    cellIds: selection.cells.map((c) => c.cellId),
    errors: selection.errors,
  });

  if (!selection.ok) {
    return {
      mode: "method-c-b-to-c-remaining-eight",
      ok: false,
      summary: "method-c-b-to-c-remaining-eight selection failed closed",
      receipts: [],
      errors: selection.errors,
    };
  }

  const localeErrors: string[] = [];
  for (const cell of selection.cells) {
    const pkg = resolveLocalePackage(cell.lessonId, cell.locale, cell.title);
    if (!pkg.exists) {
      localeErrors.push(
        `missing locale package for ${cell.cellId}: expected ${pkg.path} (no cross-locale fallback)`,
      );
    }
    if (pkg.locale !== cell.locale) {
      localeErrors.push(`locale package mismatch for ${cell.cellId}`);
    }
  }
  if (localeErrors.length > 0) {
    return {
      mode: "method-c-b-to-c-remaining-eight",
      ok: false,
      summary: "method-c-b-to-c-remaining-eight locale isolation failed closed",
      receipts: [],
      errors: localeErrors,
    };
  }

  if (process.env.CONTROLLED_V1_ZERO_RENDER === "1") {
    writeRunReport("method-c-b-to-c-remaining-eight", {
      generatedAt: new Date().toISOString(),
      confirmToken,
      drySelectOnly: true,
      authorizationId: METHOD_C_REMAINING_EIGHT_AUTH_ID,
      counts: selection.counts,
      selectedCellIds: selection.cells.map((c) => c.cellId),
    });
    return {
      mode: "method-c-b-to-c-remaining-eight",
      ok: true,
      summary: `method-c-b-to-c-remaining-eight dry-select: ${selection.cells.length} cells; Method A 0; accepted four-cell pilot 0; accepted Method C 0; no render`,
      receipts: [],
      errors: [],
    };
  }

  const receipts: CellReceipt[] = [];
  for (const cell of selection.cells) {
    if (cell.route !== "INSTRUCTIONAL_COMPOSITION" || cell.category !== "C") {
      return {
        mode: "method-c-b-to-c-remaining-eight",
        ok: false,
        summary: `refusing non-Method-C cell ${cell.cellId}`,
        receipts,
        errors: [`non-Method-C cell reached renderer: ${cell.cellId}`],
      };
    }
    const receipt = runCell(cell, "method-c-b-to-c-remaining-eight");
    writeReceipt(receipt);
    receipts.push(receipt);
  }

  const counts = receiptCounts(receipts);
  const failed = receipts.filter(
    (r) => r.status === "FAILED" || r.status === "BLOCKED_UNRESOLVED_SPEC",
  );
  const pending = receipts.filter(
    (r) => r.status === "PENDING" && r.reason === "PENDING_HUMAN_REVIEW",
  );
  const accepted = receipts.filter((r) => r.status === "ACCEPTED");

  writeJson(`${ARTIFACTS_RECEIPTS_DIR}/method-c-b-to-c-remaining-eight/_summary.json`, {
    generatedAt: new Date().toISOString(),
    authorizationId: METHOD_C_REMAINING_EIGHT_AUTH_ID,
    counts,
    selection: selection.counts,
    pendingHumanReview: pending.map((r) => r.cellId),
    receipts,
    renderTelemetry: { ...renderTelemetry },
  });
  writeRunReport("method-c-b-to-c-remaining-eight", {
    generatedAt: new Date().toISOString(),
    confirmToken,
    authorizationId: METHOD_C_REMAINING_EIGHT_AUTH_ID,
    drySelectOnly: false,
    counts,
    selectionCounts: selection.counts,
    pendingCount: pending.length,
    failedCount: failed.length,
    acceptedCount: accepted.length,
    renderTelemetry: { ...renderTelemetry },
  });

  const telemetryOk =
    renderTelemetry.paidProviderCalls === 0 && renderTelemetry.rendererCalls === receipts.length;
  const ok =
    receipts.length === METHOD_C_REMAINING_EIGHT_EXPECTED_TOTAL &&
    pending.length === METHOD_C_REMAINING_EIGHT_EXPECTED_TOTAL &&
    failed.length === 0 &&
    accepted.length === 0 &&
    telemetryOk;

  return {
    mode: "method-c-b-to-c-remaining-eight",
    ok,
    summary: `method-c-b-to-c-remaining-eight: ${receipts.length} cells PENDING_HUMAN_REVIEW; Method A 0; accepted four-cell pilot 0; accepted Method C 0; providerCalls=0`,
    receipts,
    errors: [
      ...(accepted.length > 0
        ? [`remaining-eight must not mark cells ACCEPTED; got ${accepted.length}`]
        : []),
      ...(pending.length !== METHOD_C_REMAINING_EIGHT_EXPECTED_TOTAL
        ? [
            `expected ${METHOD_C_REMAINING_EIGHT_EXPECTED_TOTAL} PENDING receipts, got ${pending.length}`,
          ]
        : []),
      ...(!telemetryOk
        ? [
            `telemetry gate failed: renderer=${renderTelemetry.rendererCalls} paid=${renderTelemetry.paidProviderCalls}`,
          ]
        : []),
      ...failed.map((r) => `${r.cellId}: ${r.reason ?? r.status}`),
    ],
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

  const acceptedRecoveries = receipts.filter((r) => r.status === "ACCEPTED").map((r) => r.cellId);
  const stillFailed = receipts.filter((r) => r.status === "FAILED").map((r) => r.cellId);

  if (stillFailed.length > 0) {
    return {
      mode: "failed-only",
      ok: false,
      summary: `failed-only: ${stillFailed.length} cell(s) remain FAILED after rerun`,
      receipts,
      errors: stillFailed.map((id) => `failed-only rerun did not accept ${id}`),
    };
  }

  if (acceptedRecoveries.length === 0) {
    return {
      mode: "failed-only",
      ok: true,
      summary: `failed-only: reran 0 previously FAILED cell(s)`,
      receipts,
      errors: [],
    };
  }

  const classification = loadClassification100();
  const pilotManifest = buildPilotManifest(classification);
  const reconciliation = reconcileFailedOnlyIntoPilot({
    recoveredCellIds: acceptedRecoveries,
    pilotManifest,
  });

  writeJson(`${ARTIFACTS_REPORTS_DIR}/failed-only-reconciliation-report.json`, {
    generatedAt: new Date().toISOString(),
    recoveredCellIds: acceptedRecoveries,
    promotedCellIds: reconciliation.promotedCellIds,
    noopCellIds: reconciliation.noopCellIds,
    inventory: reconciliation.inventory,
    errors: reconciliation.errors,
  });

  if (!reconciliation.ok) {
    return {
      mode: "failed-only",
      ok: false,
      summary: `failed-only: recovery rendered but canonical pilot reconciliation failed`,
      receipts,
      errors: reconciliation.errors,
    };
  }

  return {
    mode: "failed-only",
    ok: true,
    summary: `failed-only: reran ${receipts.length} cell(s); canonical pilot reconciled to ACCEPTED=${reconciliation.inventory.accepted} FAILED=${reconciliation.inventory.failed}`,
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

/**
 * Packaging-only repair: sanitize the locked historical Method-C-remaining artifact
 * into a clean canonical staging tree. Zero renderer / provider calls.
 */
export function runMethodCCanonicalRepair(options: {
  confirmToken: string | undefined;
  sourceArtifactRoot: string;
  stagingRoot?: string;
  priorArtifactRunId?: string;
  sourceExecutionSha?: string | null;
  repairExecutionSha?: string | null;
  sourceArtifactSizeBytes?: number | null;
  historicalApiDigest?: string;
}): RunResult {
  resetRenderTelemetry();

  if (options.confirmToken !== METHOD_C_CANONICAL_REPAIR_CONFIRM_TOKEN) {
    const msg = `method-c-canonical-repair requires confirm_full_400 === "${METHOD_C_CANONICAL_REPAIR_CONFIRM_TOKEN}" exactly; received ${JSON.stringify(options.confirmToken)}`;
    return {
      mode: "method-c-canonical-repair",
      ok: false,
      summary: msg,
      receipts: [],
      errors: [msg],
    };
  }

  if (
    options.priorArtifactRunId &&
    options.priorArtifactRunId !== METHOD_C_CANONICAL_SOURCE_RUN_ID
  ) {
    const msg = `method-c-canonical-repair requires prior_artifact_run_id === "${METHOD_C_CANONICAL_SOURCE_RUN_ID}" exactly; received ${JSON.stringify(options.priorArtifactRunId)}`;
    return {
      mode: "method-c-canonical-repair",
      ok: false,
      summary: msg,
      receipts: [],
      errors: [msg],
    };
  }

  const sourceRoot = options.sourceArtifactRoot;
  if (!sourceRoot || !existsSync(sourceRoot)) {
    const msg = `method-c-canonical-repair source artifact root missing: ${sourceRoot}`;
    return {
      mode: "method-c-canonical-repair",
      ok: false,
      summary: msg,
      receipts: [],
      errors: [msg],
    };
  }

  const cv1 = existsSync(resolve(sourceRoot, "artifacts/controlled-v1"))
    ? resolve(sourceRoot, "artifacts/controlled-v1")
    : resolve(sourceRoot);
  const selectionPath = resolve(cv1, "reports/method-c-remaining-selection.json");

  // Prefer historical selection evidence; fall back to live manifest selection for dry tests.
  let allow = resolveAuthorizedAllowlist({ selectionJsonPath: selectionPath });
  if (!allow.ok || allow.cellIds.length === 0) {
    const classification = loadClassification100();
    const manifest = buildProductionManifest(classification);
    allow = resolveAuthorizedAllowlist({ productionManifest: manifest });
  }
  if (!allow.ok) {
    return {
      mode: "method-c-canonical-repair",
      ok: false,
      summary: "allowlist resolution failed closed",
      receipts: [],
      errors: allow.errors,
    };
  }

  const ledger = buildSourceHashLedger(sourceRoot, allow.cellIds);
  if (!ledger.ok) {
    return {
      mode: "method-c-canonical-repair",
      ok: false,
      summary: "source hash ledger failed closed",
      receipts: [],
      errors: ledger.errors,
    };
  }

  const stagingRoot = options.stagingRoot ?? ARTIFACTS_CANONICAL_STAGING_DIR;
  const staged = stageCanonicalMethodCArtifact({
    sourceArtifactRoot: sourceRoot,
    stagingRoot,
    allowlist: allow.cellIds,
    sourceLedger: ledger.ledger,
    sourceExecutionSha: options.sourceExecutionSha ?? null,
    repairExecutionSha: options.repairExecutionSha ?? null,
    sourceArtifactSizeBytes: options.sourceArtifactSizeBytes ?? null,
    historicalApiDigest: options.historicalApiDigest ?? METHOD_C_CANONICAL_SOURCE_ARTIFACT_DIGEST,
  });

  const sourceCheck = assertSourceUnchanged(sourceRoot, ledger.ledger);
  const errors = [...staged.errors, ...sourceCheck.errors];

  if (
    renderTelemetry.rendererCalls !== 0 ||
    renderTelemetry.browserLaunches !== 0 ||
    renderTelemetry.paidProviderCalls !== 0
  ) {
    errors.push(
      `repair mode must make zero renderer/provider calls; got renderer=${renderTelemetry.rendererCalls} browser=${renderTelemetry.browserLaunches} paid=${renderTelemetry.paidProviderCalls}`,
    );
  }

  writeJson(
    `${stagingRoot}/artifacts/controlled-v1/reports/method-c-canonical-repair-report.json`,
    {
      generatedAt: new Date().toISOString(),
      ok: errors.length === 0,
      mode: "method-c-canonical-repair",
      confirmToken: METHOD_C_CANONICAL_REPAIR_CONFIRM_TOKEN,
      sourceArtifactRoot: sourceRoot,
      stagingRoot,
      allowlistCount: allow.cellIds.length,
      validation: staged.validation.counts,
      rendererCalls: renderTelemetry.rendererCalls,
      browserLaunches: renderTelemetry.browserLaunches,
      paidProviderCalls: renderTelemetry.paidProviderCalls,
      sanitationReportPath: staged.sanitationReportPath,
      provenancePath: staged.provenancePath,
      hashLedgerPath: staged.hashLedgerPath,
      errors,
    },
  );

  return {
    mode: "method-c-canonical-repair",
    ok: errors.length === 0,
    summary:
      errors.length === 0
        ? `method-c-canonical-repair: staged ${allow.cellIds.length} cells (0 renderer / 0 provider); staging=${stagingRoot}`
        : `method-c-canonical-repair failed closed (${errors.length} error(s))`,
    receipts: [],
    errors,
  };
}
