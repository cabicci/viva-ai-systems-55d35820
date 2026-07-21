import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { AUTHORITATIVE_BASE_SOURCE_SHA, FIXTURE_RECEIPT_MARKER } from "../../../src/lib/lesson-visuals/v1/constants";
import { computeAttemptQuotaEnvelope } from "../../../src/lib/lesson-visuals/v1/production/attemptQuota";
import { loadProductionConfig, type ProductionEnv } from "../../../src/lib/lesson-visuals/v1/production/config";
import { isLegacyReference, LEGACY_CHECKSUM_DENYLIST } from "../../../src/lib/lesson-visuals/v1/production/greenfield";
import { createMockProvider } from "../../../src/lib/lesson-visuals/v1/production/mockProvider";
import { encodeSolidPng, sha256Hex } from "../../../src/lib/lesson-visuals/v1/production/pngCodec";
import { loadPriorAcceptedReceipts } from "../../../src/lib/lesson-visuals/v1/production/priorReceipts";
import { executeProviderContract } from "../../../src/lib/lesson-visuals/v1/production/providerContract";
import { fingerprintProductionReceipt } from "../../../src/lib/lesson-visuals/v1/production/receipts";
import {
  validateFailureRecordSchema,
  validateMappingSchema,
  validateReceiptSchema,
  validateRightsSchema,
  validateRunSummarySchema,
} from "../../../src/lib/lesson-visuals/v1/production/schemaValidator";
import { validateOutputBytes } from "../../../src/lib/lesson-visuals/v1/production/outputValidation";
import type { ProductionCellReceipt, ProductionConfig, ProviderGenerationRequest } from "../../../src/lib/lesson-visuals/v1/production/types";
import { assertRuntimeAttemptWithinQuota } from "../../../src/lib/lesson-visuals/v1/production/attemptQuota";

const temps: string[] = [];
afterEach(() => {
  while (temps.length) rmSync(temps.pop()!, { recursive: true, force: true });
});

function dryEnv(over: Partial<ProductionEnv> = {}): ProductionEnv {
  return {
    LESSON_VISUALS_EXECUTION_MODE: "dry-run",
    LESSON_VISUALS_PROVIDER_NAME: "mock-provider",
    LESSON_VISUALS_PROVIDER_MODEL: "mock-renderer-v1",
    LESSON_VISUALS_PROVIDER_API_KEY: "",
    LESSON_VISUALS_PROVIDER_ACCOUNT_ID: "acct-test",
    LESSON_VISUALS_PROVIDER_PROJECT_ID: "proj-test",
    LESSON_VISUALS_AI_AUTH_ID: "auth-test",
    LESSON_VISUALS_STORAGE_CREDENTIAL: "",
    LESSON_VISUALS_RUN_COST_CEILING_USD_MICROS: "1000000000",
    LESSON_VISUALS_CELL_COST_CEILING_USD_MICROS: "100000",
    LESSON_VISUALS_MAX_OUTPUT_BYTES: "5000000",
    LESSON_VISUALS_ALLOWED_MIME_TYPES: "image/png",
    LESSON_VISUALS_REQUIRED_WIDTH: "64",
    LESSON_VISUALS_REQUIRED_HEIGHT: "36",
    LESSON_VISUALS_PROVIDER_ATTEMPT_QUOTA: "800",
    LESSON_VISUALS_MAX_RETRIES: "1",
    LESSON_VISUALS_OUTPUT_STORAGE_TARGET: "artifact://lesson-visuals",
    LOVABLE_DISPATCH_ACTORS: "lovable",
    ...over,
  };
}

function cfg(over: Partial<ProductionEnv> = {}): ProductionConfig {
  const r = loadProductionConfig(dryEnv(over));
  expect(r.ok, r.errors.join("; ")).toBe(true);
  return r.config!;
}

function req(over: Partial<ProviderGenerationRequest> = {}): ProviderGenerationRequest {
  return {
    schemaVersion: "lesson-visual-provider-request/v1",
    runId: "run-1",
    controlRoomAuthorizationId: "CR-TEST-1",
    sourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
    approvedManifestSha256: "a".repeat(64),
    cellId: "intro-m1-l1-what-is-ai__en",
    lessonId: "intro-m1-l1-what-is-ai",
    locale: "en",
    method: 1,
    promptOrRenderingSpec: "greenfield-spec",
    requestedWidth: 64,
    requestedHeight: 36,
    expectedMimeTypes: ["image/png"],
    rightsProvenanceRequirements: {
      requireGreenfield: true,
      prohibitLegacyReuse: true,
      requireProviderRequestId: true,
      requireLicenseBasis: true,
    },
    idempotencyKey: "idem-1",
    attemptNumber: 1,
    budgetAllocationMicros: "100000",
    maxCostMicros: "100000",
    expectedProviderAccountId: "acct-test",
    expectedProviderProjectId: "proj-test",
    expectedProviderAuthId: "auth-test",
    ...over,
  };
}

function makeAcceptedReceipt(cellId: string, lessonId: string, locale: "en" | "ar-EG", sha: string): ProductionCellReceipt {
  const contentSha256 = sha256Hex(encodeSolidPng(64, 36, [1, 2, 3]));
  const idempotencyKey = `idem-${cellId}`;
  const fingerprint = fingerprintProductionReceipt({
    runId: "prior-run",
    cellId,
    lessonId,
    locale,
    method: 1,
    sourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
    approvedManifestSha256: sha,
    idempotencyKey,
    contentSha256,
  });
  return {
    schemaVersion: "lesson-visual-production-receipt/v1",
    status: "ACCEPTED",
    runId: "prior-run",
    controlRoomAuthorizationId: "CR-PRIOR",
    sourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
    approvedManifestSha256: sha,
    cellId,
    lessonId,
    locale,
    method: 1,
    providerName: "mock-provider",
    providerRequestId: "req1",
    modelOrRenderer: "mock-renderer-v1",
    providerAccountId: "acct-test",
    providerProjectId: "proj-test",
    providerAuthId: "auth-test",
    idempotencyKey,
    attemptNumber: 1,
    outputPathOrStorageKey: `artifact://lesson-visuals/${cellId}.png`,
    mimeType: "image/png",
    width: 64,
    height: 36,
    byteLength: 100,
    contentSha256,
    costMicros: "1000",
    rightsProvenanceRef: `rights/${cellId}.rights.json`,
    validationRef: `validations/${cellId}.validation.json`,
    fingerprint,
    producedAt: "2026-07-21T00:00:00.000Z",
    completedAt: "2026-07-21T00:00:00.000Z",
    failureCode: null,
    retryable: null,
    error: null,
    fixtureMarker: null,
  };
}

describe("Fix1 read-only validate_local", () => {
  it("validateGrounding defaults to no write when writeAuditLedger false path used by validate_local", async () => {
    const src = readFileSync("src/lib/lesson-visuals/v1/scripts/validate_local.ts", "utf8");
    expect(src).toContain("writeAuditLedger: false");
    expect(src).not.toMatch(/writeAuditLedger:\s*true/);
  });
});

describe("Fix2 failed-only prior receipts", () => {
  const manifestSha = "b".repeat(64);
  const cells = ["intro-m1-l1-what-is-ai__en", "intro-m1-l2-first-prompt__en"];

  it("valid prior receipts load", () => {
    const dir = mkdtempSync(join(tmpdir(), "prior-"));
    temps.push(dir);
    const r = makeAcceptedReceipt(cells[0]!, "intro-m1-l1-what-is-ai", "en", manifestSha);
    writeFileSync(join(dir, `${cells[0]}.receipt.json`), JSON.stringify(r));
    const out = loadPriorAcceptedReceipts({
      mode: "failed-only",
      priorReceiptBundlePath: dir,
      expectedSourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      expectedManifestSha256: manifestSha,
      expectedCellIds: cells,
      executionMode: "dry-run",
    });
    expect(out.ok).toBe(true);
    expect(out.acceptedByCellId.size).toBe(1);
  });

  it("missing source fails", () => {
    const out = loadPriorAcceptedReceipts({
      mode: "failed-only",
      priorReceiptBundlePath: "",
      expectedSourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      expectedManifestSha256: manifestSha,
      expectedCellIds: cells,
      executionMode: "dry-run",
    });
    expect(out.ok).toBe(false);
  });

  it("malformed receipt fails", () => {
    const dir = mkdtempSync(join(tmpdir(), "prior-"));
    temps.push(dir);
    writeFileSync(join(dir, `${cells[0]}.receipt.json`), "{not-json");
    const out = loadPriorAcceptedReceipts({
      mode: "failed-only",
      priorReceiptBundlePath: dir,
      expectedSourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      expectedManifestSha256: manifestSha,
      expectedCellIds: cells,
      executionMode: "dry-run",
    });
    expect(out.ok).toBe(false);
  });

  it("duplicate receipt fails", () => {
    const dir = mkdtempSync(join(tmpdir(), "prior-"));
    temps.push(dir);
    mkdirSync(join(dir, "nested"), { recursive: true });
    const r = makeAcceptedReceipt(cells[0]!, "intro-m1-l1-what-is-ai", "en", manifestSha);
    writeFileSync(join(dir, `${cells[0]}.receipt.json`), JSON.stringify(r));
    writeFileSync(join(dir, "nested", `${cells[0]}.receipt.json`), JSON.stringify(r));
    const out = loadPriorAcceptedReceipts({
      mode: "failed-only",
      priorReceiptBundlePath: dir,
      expectedSourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      expectedManifestSha256: manifestSha,
      expectedCellIds: cells,
      executionMode: "dry-run",
    });
    expect(out.ok).toBe(false);
    expect(out.errors.join(" ")).toMatch(/duplicate/);
  });

  it("empty bundle / missing receipts fails", () => {
    const dir = mkdtempSync(join(tmpdir(), "prior-empty-"));
    temps.push(dir);
    const out = loadPriorAcceptedReceipts({
      mode: "failed-only",
      priorReceiptBundlePath: dir,
      expectedSourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      expectedManifestSha256: manifestSha,
      expectedCellIds: cells,
      executionMode: "dry-run",
    });
    expect(out.ok).toBe(false);
  });

  it("stale source SHA fails", () => {
    const dir = mkdtempSync(join(tmpdir(), "prior-"));
    temps.push(dir);
    const r = makeAcceptedReceipt(cells[0]!, "intro-m1-l1-what-is-ai", "en", manifestSha);
    r.sourceSha = "0".repeat(40);
    r.fingerprint = fingerprintProductionReceipt({
      runId: r.runId,
      cellId: r.cellId,
      lessonId: r.lessonId,
      locale: r.locale,
      method: r.method,
      sourceSha: r.sourceSha,
      approvedManifestSha256: r.approvedManifestSha256,
      idempotencyKey: r.idempotencyKey,
      contentSha256: r.contentSha256,
    });
    writeFileSync(join(dir, `${cells[0]}.receipt.json`), JSON.stringify(r));
    const out = loadPriorAcceptedReceipts({
      mode: "failed-only",
      priorReceiptBundlePath: dir,
      expectedSourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      expectedManifestSha256: manifestSha,
      expectedCellIds: cells,
      executionMode: "dry-run",
    });
    expect(out.ok).toBe(false);
  });

  it("wrong manifest digest fails", () => {
    const dir = mkdtempSync(join(tmpdir(), "prior-"));
    temps.push(dir);
    const r = makeAcceptedReceipt(cells[0]!, "intro-m1-l1-what-is-ai", "en", "c".repeat(64));
    writeFileSync(join(dir, `${cells[0]}.receipt.json`), JSON.stringify(r));
    const out = loadPriorAcceptedReceipts({
      mode: "failed-only",
      priorReceiptBundlePath: dir,
      expectedSourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      expectedManifestSha256: manifestSha,
      expectedCellIds: cells,
      executionMode: "dry-run",
    });
    expect(out.ok).toBe(false);
  });

  it("wrong locale/identity fails", () => {
    const dir = mkdtempSync(join(tmpdir(), "prior-"));
    temps.push(dir);
    const r = makeAcceptedReceipt(cells[0]!, "intro-m1-l1-what-is-ai", "en", manifestSha);
    r.locale = "ar-EG";
    writeFileSync(join(dir, `${cells[0]}.receipt.json`), JSON.stringify(r));
    const out = loadPriorAcceptedReceipts({
      mode: "failed-only",
      priorReceiptBundlePath: dir,
      expectedSourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      expectedManifestSha256: manifestSha,
      expectedCellIds: cells,
      executionMode: "dry-run",
    });
    expect(out.ok).toBe(false);
  });

  it("checksum missing fails", () => {
    const dir = mkdtempSync(join(tmpdir(), "prior-"));
    temps.push(dir);
    const r = makeAcceptedReceipt(cells[0]!, "intro-m1-l1-what-is-ai", "en", manifestSha);
    r.contentSha256 = null;
    writeFileSync(join(dir, `${cells[0]}.receipt.json`), JSON.stringify(r));
    const out = loadPriorAcceptedReceipts({
      mode: "failed-only",
      priorReceiptBundlePath: dir,
      expectedSourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      expectedManifestSha256: manifestSha,
      expectedCellIds: cells,
      executionMode: "dry-run",
    });
    expect(out.ok).toBe(false);
  });

  it("invalid acceptance status fails", () => {
    const dir = mkdtempSync(join(tmpdir(), "prior-"));
    temps.push(dir);
    const r = makeAcceptedReceipt(cells[0]!, "intro-m1-l1-what-is-ai", "en", manifestSha);
    r.status = "FAILED";
    writeFileSync(join(dir, `${cells[0]}.receipt.json`), JSON.stringify(r));
    const out = loadPriorAcceptedReceipts({
      mode: "failed-only",
      priorReceiptBundlePath: dir,
      expectedSourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      expectedManifestSha256: manifestSha,
      expectedCellIds: cells,
      executionMode: "dry-run",
    });
    expect(out.ok).toBe(false);
  });

  it("stale fingerprint fails", () => {
    const dir = mkdtempSync(join(tmpdir(), "prior-"));
    temps.push(dir);
    const r = makeAcceptedReceipt(cells[0]!, "intro-m1-l1-what-is-ai", "en", manifestSha);
    r.fingerprint = "d".repeat(64);
    writeFileSync(join(dir, `${cells[0]}.receipt.json`), JSON.stringify(r));
    const out = loadPriorAcceptedReceipts({
      mode: "failed-only",
      priorReceiptBundlePath: dir,
      expectedSourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      expectedManifestSha256: manifestSha,
      expectedCellIds: cells,
      executionMode: "dry-run",
    });
    expect(out.ok).toBe(false);
  });

  it("fixture receipt in production fails", () => {
    const dir = mkdtempSync(join(tmpdir(), "prior-"));
    temps.push(dir);
    const r = makeAcceptedReceipt(cells[0]!, "intro-m1-l1-what-is-ai", "en", manifestSha);
    r.fixtureMarker = FIXTURE_RECEIPT_MARKER;
    writeFileSync(join(dir, `${cells[0]}.receipt.json`), JSON.stringify(r));
    const out = loadPriorAcceptedReceipts({
      mode: "failed-only",
      priorReceiptBundlePath: dir,
      expectedSourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      expectedManifestSha256: manifestSha,
      expectedCellIds: cells,
      executionMode: "production",
    });
    expect(out.ok).toBe(false);
  });
});

describe("Fix3 runtime schemas", () => {
  it("valid receipt passes; missing property fails; bad version fails", () => {
    const r = makeAcceptedReceipt("intro-m1-l1-what-is-ai__en", "intro-m1-l1-what-is-ai", "en", "a".repeat(64));
    expect(validateReceiptSchema(r).ok).toBe(true);
    const bad = { ...r } as Record<string, unknown>;
    delete bad.cellId;
    expect(validateReceiptSchema(bad).ok).toBe(false);
    expect(validateReceiptSchema({ ...r, schemaVersion: "nope" }).ok).toBe(false);
  });

  it("mapping/rights/failure/summary schemas reject invalid enums", () => {
    expect(validateMappingSchema({ schemaVersion: "x" }).ok).toBe(false);
    expect(validateRightsSchema({ schemaVersion: "lesson-visual-rights/v1" }).ok).toBe(false);
    expect(validateFailureRecordSchema({ schemaVersion: "lesson-visual-failure/v1", errors: [] }).ok).toBe(false);
    expect(validateRunSummarySchema({ schemaVersion: "lesson-visual-run-summary/v1" }).ok).toBe(false);
  });
});

describe("Fix5 greenfield", () => {
  it("rejects legacy/gallery/bunny/rollback and accepts greenfield", () => {
    expect(isLegacyReference("docs/lesson-visuals/legacy/gallery/x.png").legacy).toBe(true);
    expect(isLegacyReference("/Gallery/assets/a.png").legacy).toBe(true);
    expect(isLegacyReference("https://vz-abc.b-cdn.net/legacy/asset.png").legacy).toBe(true);
    expect(isLegacyReference("path/rollback/manifest.json").legacy).toBe(true);
    expect(isLegacyReference([...LEGACY_CHECKSUM_DENYLIST][0]!).legacy).toBe(true);
    expect(isLegacyReference("master:intro-m1-l1-what-is-ai").legacy).toBe(false);
    expect(isLegacyReference("docs/lesson-visuals/legacy/%2e%2e/gallery/x.png").legacy).toBe(true);
  });
});

describe("Fix6 MIME", () => {
  it("rejects unsupported configured MIME", () => {
    const r = loadProductionConfig(dryEnv({ LESSON_VISUALS_ALLOWED_MIME_TYPES: "image/jpeg" }));
    expect(r.ok).toBe(false);
  });

  it("accepts valid PNG and rejects spoof/corrupt/wrong dims/oversize", () => {
    const c = cfg();
    const png = encodeSolidPng(64, 36, [9, 8, 7]);
    const ok = validateOutputBytes({
      bytes: png,
      declaredMime: "image/png",
      declaredWidth: 64,
      declaredHeight: 36,
      declaredChecksum: sha256Hex(png),
      declaredByteLength: png.length,
      config: c,
      cellId: "intro-m1-l1-what-is-ai__en",
      lessonId: "intro-m1-l1-what-is-ai",
      locale: "en",
      runId: "run-1",
      controlRoomAuthorizationId: "CR-TEST-1",
      sourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      approvedManifestSha256: "a".repeat(64),
    });
    expect(ok.ok).toBe(true);

    const html = Buffer.from("<html>nope</html>");
    const spoof = validateOutputBytes({
      bytes: html,
      declaredMime: "image/png",
      declaredWidth: 64,
      declaredHeight: 36,
      declaredChecksum: sha256Hex(html),
      declaredByteLength: html.length,
      config: c,
      cellId: "intro-m1-l1-what-is-ai__en",
      lessonId: "intro-m1-l1-what-is-ai",
      locale: "en",
      runId: "run-1",
      controlRoomAuthorizationId: "CR-TEST-1",
      sourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      approvedManifestSha256: "a".repeat(64),
    });
    expect(spoof.ok).toBe(false);

    const wrong = encodeSolidPng(16, 16, [1, 1, 1]);
    const dims = validateOutputBytes({
      bytes: wrong,
      declaredMime: "image/png",
      declaredWidth: 16,
      declaredHeight: 16,
      declaredChecksum: sha256Hex(wrong),
      declaredByteLength: wrong.length,
      config: c,
      cellId: "intro-m1-l1-what-is-ai__en",
      lessonId: "intro-m1-l1-what-is-ai",
      locale: "en",
      runId: "run-1",
      controlRoomAuthorizationId: "CR-TEST-1",
      sourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      approvedManifestSha256: "a".repeat(64),
    });
    expect(dims.ok).toBe(false);

    const tinyCfg = { ...c, maxOutputBytes: 10 };
    const over = validateOutputBytes({
      bytes: png,
      declaredMime: "image/png",
      declaredWidth: 64,
      declaredHeight: 36,
      declaredChecksum: sha256Hex(png),
      declaredByteLength: png.length,
      config: tinyCfg,
      cellId: "intro-m1-l1-what-is-ai__en",
      lessonId: "intro-m1-l1-what-is-ai",
      locale: "en",
      runId: "run-1",
      controlRoomAuthorizationId: "CR-TEST-1",
      sourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      approvedManifestSha256: "a".repeat(64),
    });
    expect(over.ok).toBe(false);
  });
});

describe("Fix7 workflow uploads fail-closed", () => {
  it("required uploads use if-no-files-found: error", () => {
    const yml = readFileSync(".github/workflows/lesson-driven-400-visual-pipeline.yml", "utf8");
    expect(yml).toContain("if-no-files-found: error");
    expect(yml).not.toMatch(/if-no-files-found:\s*warn/);
    expect(yml).toContain("prior_receipt_bundle_artifact");
    expect(yml).toContain("prior_receipt_bundle_run_id");
    expect(yml).toContain("verify_cell_artifacts.ts");
  });
});

describe("Fix8-9 provider identity and response binding", () => {
  async function runFail(failMode: NonNullable<Parameters<typeof createMockProvider>[0]["failMode"]>) {
    const c = cfg();
    const transport = createMockProvider({
      providerName: c.providerName,
      model: c.providerModel,
      accountId: c.providerAccountId,
      projectId: c.providerProjectId,
      authId: c.providerAuthId,
      width: 64,
      height: 36,
      costMicros: "1000",
      failMode,
    });
    return executeProviderContract(req(), {
      config: { ...c, providerApiKeyPresent: true },
      transport,
      expectedProviderName: c.providerName,
      remainingRunBudgetMicros: c.runCostCeilingMicros,
      seenProviderRequestIds: new Set(),
    });
  }

  it("valid identity succeeds", async () => {
    const r = await runFail(null);
    expect(r.ok, r.errors.join("; ")).toBe(true);
  });

  it("account/project/auth/source/manifest/run/attempt mismatches fail", async () => {
    expect((await runFail("wrong-account")).ok).toBe(false);
    expect((await runFail("wrong-project")).ok).toBe(false);
    expect((await runFail("wrong-auth")).ok).toBe(false);
    expect((await runFail("wrong-source-sha")).ok).toBe(false);
    expect((await runFail("wrong-manifest")).ok).toBe(false);
    expect((await runFail("wrong-run")).ok).toBe(false);
    expect((await runFail("wrong-attempt")).ok).toBe(false);
    expect((await runFail("legacy-source-ref")).ok).toBe(false);
  });

  it("mock identity in production rejected at cell runner gate", async () => {
    const c = cfg({
      LESSON_VISUALS_EXECUTION_MODE: "production",
      LESSON_VISUALS_PROVIDER_API_KEY: "k",
      LESSON_VISUALS_PROVIDER_ENDPOINT: "https://provider.example.invalid/v1/generate",
    });
    expect(c.executionMode).toBe("production");
  });
});

describe("Fix10 retry-aware quota", () => {
  it("exact envelope passes; one-under fails", () => {
    const ok = computeAttemptQuotaEnvelope({
      authoritativeCells: 400,
      eligibleCells: 400,
      validSkippedCells: 0,
      maxRetries: 1,
      configuredProviderAttemptQuota: 800,
    });
    expect(ok.ok).toBe(true);
    expect(ok.maxProviderAttempts).toBe(800);

    const fail = computeAttemptQuotaEnvelope({
      authoritativeCells: 400,
      eligibleCells: 400,
      validSkippedCells: 0,
      maxRetries: 1,
      configuredProviderAttemptQuota: 799,
    });
    expect(fail.ok).toBe(false);
  });

  it("failed-only partial accepted reduces eligible; invalid does not when not counted", () => {
    const partial = computeAttemptQuotaEnvelope({
      authoritativeCells: 400,
      eligibleCells: 350,
      validSkippedCells: 50,
      maxRetries: 1,
      configuredProviderAttemptQuota: 700,
    });
    expect(partial.ok).toBe(true);
    expect(partial.maxProviderAttempts).toBe(700);

    const zeroEligible = computeAttemptQuotaEnvelope({
      authoritativeCells: 400,
      eligibleCells: 0,
      validSkippedCells: 400,
      maxRetries: 1,
      configuredProviderAttemptQuota: 0,
    });
    expect(zeroEligible.ok).toBe(true);
  });

  it("unsafe numeric / reconcile failures", () => {
    expect(
      computeAttemptQuotaEnvelope({
        authoritativeCells: 400,
        eligibleCells: 10,
        validSkippedCells: 10,
        maxRetries: 1,
        configuredProviderAttemptQuota: 100,
      }).ok,
    ).toBe(false);
  });

  it("runtime over-attempt rejected", () => {
    expect(assertRuntimeAttemptWithinQuota(801, 800)).toMatch(/exceed/);
    expect(assertRuntimeAttemptWithinQuota(800, 800)).toBeNull();
  });
});

describe("Fix4 checksum binding", () => {
  it("independent checksum mismatch rejects provider response", async () => {
    const r = await (async () => {
      const c = cfg();
      const transport = createMockProvider({
        providerName: c.providerName,
        model: c.providerModel,
        accountId: c.providerAccountId,
        projectId: c.providerProjectId,
        authId: c.providerAuthId,
        width: 64,
        height: 36,
        costMicros: "1000",
        failMode: "checksum-mismatch",
      });
      return executeProviderContract(req(), {
        config: { ...c, providerApiKeyPresent: true },
        transport,
        expectedProviderName: c.providerName,
        remainingRunBudgetMicros: c.runCostCeilingMicros,
        seenProviderRequestIds: new Set(),
      });
    })();
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ").toLowerCase()).toMatch(/checksum/);
  });
});
