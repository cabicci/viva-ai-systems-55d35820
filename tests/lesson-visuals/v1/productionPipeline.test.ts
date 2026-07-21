import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { AUTHORITATIVE_BASE_SOURCE_SHA } from "../../../src/lib/lesson-visuals/v1/constants";
import { validateDispatchAuthorization } from "../../../src/lib/lesson-visuals/v1/dispatch/authorizationContract";
import { preflightBudgetAndQuota } from "../../../src/lib/lesson-visuals/v1/production/budget";
import { loadProductionConfig, type ProductionEnv } from "../../../src/lib/lesson-visuals/v1/production/config";
import { runProductionCell } from "../../../src/lib/lesson-visuals/v1/production/cellRunner";
import { createMockProvider } from "../../../src/lib/lesson-visuals/v1/production/mockProvider";
import { executeProviderContract } from "../../../src/lib/lesson-visuals/v1/production/providerContract";
import { validateOutputBytes } from "../../../src/lib/lesson-visuals/v1/production/outputValidation";
import { encodeSolidPng, sha256Hex } from "../../../src/lib/lesson-visuals/v1/production/pngCodec";
import { validateRepinState } from "../../../src/lib/lesson-visuals/v1/scripts/repin_source_sha";
import { fingerprintProductionReceipt } from "../../../src/lib/lesson-visuals/v1/production/receipts";
import { buildMappingFromAcceptedReceipt } from "../../../src/lib/lesson-visuals/v1/production/mappings";
import { buildRuntimeQuotaContext } from "../../../src/lib/lesson-visuals/v1/production/quotaContext";
import type { ProductionConfig, ProviderGenerationRequest } from "../../../src/lib/lesson-visuals/v1/production/types";

const MANIFEST_PATH = "docs/lesson-visuals/v1/AUTHORIZED_MANIFEST.json";

function padCellIds(seed: string[]): string[] {
  const out = [...seed];
  let i = 0;
  while (out.length < 400) {
    out.push(`pad-lesson-${i}__en`);
    i += 1;
  }
  return out;
}

function quotaCtx(cellIds: string[] = ["intro-m1-l1-what-is-ai__en", "intro-m1-l2-first-prompt__en"]) {
  const built = buildRuntimeQuotaContext({
    runId: "run-test-1",
    controlRoomAuthorizationId: "CR-TEST-001",
    sourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
    approvedManifestSha256: "a".repeat(64),
    mode: "full",
    allCellIds: padCellIds(cellIds),
    skippedCellIds: [],
    maxRetries: 1,
    configuredProviderAttemptQuota: 800,
  });
  if (!built.ok || !built.context) throw new Error(built.errors.join("; "));
  return built.context;
}

function dryRunEnv(overrides: Partial<ProductionEnv> = {}): ProductionEnv {
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
    ...overrides,
  };
}

function mockOpts(
  config: ProductionConfig,
  over: Partial<Parameters<typeof createMockProvider>[0]> = {},
) {
  return {
    providerName: config.providerName,
    model: config.providerModel,
    accountId: config.providerAccountId,
    projectId: config.providerProjectId || null,
    authId: config.providerAuthId,
    width: 64,
    height: 36,
    costMicros: "1000",
    ...over,
  };
}

function requireConfig(env: ProductionEnv = dryRunEnv()): ProductionConfig {
  const loaded = loadProductionConfig(env);
  expect(loaded.ok, loaded.errors.join("; ")).toBe(true);
  return loaded.config!;
}

function baseRequest(overrides: Partial<ProviderGenerationRequest> = {}): ProviderGenerationRequest {
  return {
    schemaVersion: "lesson-visual-provider-request/v1",
    runId: "run-test-1",
    controlRoomAuthorizationId: "CR-TEST-001",
    sourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
    approvedManifestSha256: "a".repeat(64),
    cellId: "intro-m1-l1-what-is-ai__en",
    lessonId: "intro-m1-l1-what-is-ai",
    locale: "en",
    method: 1,
    promptOrRenderingSpec: "test",
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
    ...overrides,
  };
}

const tempDirs: string[] = [];
afterEach(() => {
  while (tempDirs.length) {
    const d = tempDirs.pop()!;
    rmSync(d, { recursive: true, force: true });
  }
});

describe("deterministic repinning + 400-cell manifest", () => {
  it("validates repinned manifest/masters against base SHA", () => {
    const r = validateRepinState();
    expect(r.ok, r.errors.join("; ")).toBe(true);
    expect(r.sourceSha).toBe(AUTHORITATIVE_BASE_SOURCE_SHA);
    expect(r.cellCount).toBe(400);
    expect(r.masterCount).toBe(100);
    expect(r.perLocale["ar-EG"]).toBe(100);
    expect(r.perLocale["ar-MSA"]).toBe(100);
    expect(r.perLocale["ar-Gulf"]).toBe(100);
    expect(r.perLocale.en).toBe(100);
    const bytes = readFileSync(MANIFEST_PATH);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(r.manifestSha256);
  });
});

describe("dispatch authorization fail-closed", () => {
  const sha = AUTHORITATIVE_BASE_SOURCE_SHA;
  const manifestSha = "b".repeat(64);
  const base = {
    controlRoomAuthorizationId: "CR-2026-07-21-TEST",
    approvedSourceSha: sha,
    approvedManifestSha256: manifestSha,
    runMode: "full" as const,
    dispatchActor: "lovable",
    githubActor: "lovable",
    actualSourceSha: sha,
    actualManifestSha256: manifestSha,
    allowedDispatchActors: ["lovable"] as const,
    maxParallel: 20,
  };

  it("rejects missing actor allowlist", () => {
    const r = validateDispatchAuthorization({ ...base, allowedDispatchActors: [] });
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/allowlist is empty/);
  });

  it("rejects invalid actor", () => {
    const r = validateDispatchAuthorization({ ...base, dispatchActor: "cursor" });
    expect(r.ok).toBe(false);
  });

  it("rejects source SHA mismatch", () => {
    const r = validateDispatchAuthorization({
      ...base,
      actualSourceSha: "0".repeat(40),
    });
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/source_sha mismatch/);
  });

  it("rejects manifest digest mismatch", () => {
    const r = validateDispatchAuthorization({
      ...base,
      actualManifestSha256: "c".repeat(64),
    });
    expect(r.ok).toBe(false);
  });

  it("rejects unsupported mode", () => {
    const r = validateDispatchAuthorization({
      ...base,
      // @ts-expect-error intentional
      runMode: "subset",
    });
    expect(r.ok).toBe(false);
  });

  it("accepts pilot mode", () => {
    const r = validateDispatchAuthorization({
      ...base,
      runMode: "pilot",
    });
    expect(r.ok).toBe(true);
  });
});

describe("budget and quota", () => {
  it("fails when projected max cost exceeds run ceiling", () => {
    const r = preflightBudgetAndQuota({
      eligibleCellCount: 400,
      cellCostCeilingMicros: 10_000n,
      runCostCeilingMicros: 1000n,
      providerAttemptQuota: 800,
      maxRetries: 1,
      authoritativeCells: 400,
      validSkippedCells: 0,
    });
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/projected maximum cost/);
  });

  it("fails when attempt envelope above provider-attempt quota", () => {
    const r = preflightBudgetAndQuota({
      eligibleCellCount: 400,
      cellCostCeilingMicros: 1n,
      runCostCeilingMicros: 1_000_000n,
      providerAttemptQuota: 399,
      maxRetries: 0,
      authoritativeCells: 400,
      validSkippedCells: 0,
    });
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/attempt-quota|exceeds quota/);
  });

  it("fails when run budget missing/non-positive", () => {
    const r = preflightBudgetAndQuota({
      eligibleCellCount: 400,
      cellCostCeilingMicros: 1n,
      runCostCeilingMicros: 0n,
      providerAttemptQuota: 400,
      maxRetries: 0,
      authoritativeCells: 400,
      validSkippedCells: 0,
    });
    expect(r.ok).toBe(false);
  });
});

describe("provider contract + output validation (offline mock)", () => {
  it("valid mocked provider success", async () => {
    const config = requireConfig();
    const transport = createMockProvider(mockOpts(config));
    const cfg = { ...config, providerApiKeyPresent: true };
    const result = await executeProviderContract(baseRequest(), {
      config: cfg,
      transport,
      expectedProviderName: config.providerName,
      remainingRunBudgetMicros: config.runCostCeilingMicros,
      seenProviderRequestIds: new Set(),
    });
    expect(result.ok, result.errors.join("; ")).toBe(true);
    expect(result.bytes?.length).toBeGreaterThan(0);
  });

  it("rejects missing credentials in production", async () => {
    const config = requireConfig({
      ...dryRunEnv(),
      LESSON_VISUALS_EXECUTION_MODE: "production",
      LESSON_VISUALS_PROVIDER_API_KEY: "k",
      LESSON_VISUALS_PROVIDER_ENDPOINT: "https://provider.example.invalid/v1/generate",
    });
    const broken = { ...config, providerApiKeyPresent: false, executionMode: "production" as const };
    const transport = createMockProvider(mockOpts(broken, { costMicros: "1" }));
    const result = await executeProviderContract(baseRequest(), {
      config: broken,
      transport,
      expectedProviderName: broken.providerName,
      remainingRunBudgetMicros: broken.runCostCeilingMicros,
      seenProviderRequestIds: new Set(),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/missing provider credentials/);
  });

  it("rejects empty output", async () => {
    const config = requireConfig();
    const transport = createMockProvider(mockOpts(config, { costMicros: "1", failMode: "empty-bytes" }));
    const result = await executeProviderContract(baseRequest(), {
      config: { ...config, providerApiKeyPresent: true },
      transport,
      expectedProviderName: config.providerName,
      remainingRunBudgetMicros: config.runCostCeilingMicros,
      seenProviderRequestIds: new Set(),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/empty output bytes/);
  });

  it("rejects MIME spoof", async () => {
    const config = requireConfig();
    const transport = createMockProvider(mockOpts(config, { costMicros: "1", failMode: "wrong-mime" }));
    const result = await executeProviderContract(baseRequest(), {
      config: { ...config, providerApiKeyPresent: true },
      transport,
      expectedProviderName: config.providerName,
      remainingRunBudgetMicros: config.runCostCeilingMicros,
      seenProviderRequestIds: new Set(),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ").toLowerCase()).toMatch(/mime|html|png|detect/);
  });

  it("rejects invalid dimensions", async () => {
    const config = requireConfig();
    const transport = createMockProvider(
      mockOpts(config, { costMicros: "1", failMode: "wrong-dimensions" }),
    );
    const result = await executeProviderContract(baseRequest(), {
      config: { ...config, providerApiKeyPresent: true },
      transport,
      expectedProviderName: config.providerName,
      remainingRunBudgetMicros: config.runCostCeilingMicros,
      seenProviderRequestIds: new Set(),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/dimensions/);
  });

  it("rejects checksum mismatch", async () => {
    const config = requireConfig();
    const transport = createMockProvider(
      mockOpts(config, { costMicros: "1", failMode: "checksum-mismatch" }),
    );
    const result = await executeProviderContract(baseRequest(), {
      config: { ...config, providerApiKeyPresent: true },
      transport,
      expectedProviderName: config.providerName,
      remainingRunBudgetMicros: config.runCostCeilingMicros,
      seenProviderRequestIds: new Set(),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/checksum mismatch/);
  });

  it("rejects cell identity mismatch", async () => {
    const config = requireConfig();
    const transport = createMockProvider(mockOpts(config, { costMicros: "1", failMode: "wrong-cell" }));
    const result = await executeProviderContract(baseRequest(), {
      config: { ...config, providerApiKeyPresent: true },
      transport,
      expectedProviderName: config.providerName,
      remainingRunBudgetMicros: config.runCostCeilingMicros,
      seenProviderRequestIds: new Set(),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/cellId mismatch/);
  });

  it("rejects locale mismatch", async () => {
    const config = requireConfig();
    const transport = createMockProvider(
      mockOpts(config, { costMicros: "1", failMode: "wrong-locale" }),
    );
    const result = await executeProviderContract(baseRequest(), {
      config: { ...config, providerApiKeyPresent: true },
      transport,
      expectedProviderName: config.providerName,
      remainingRunBudgetMicros: config.runCostCeilingMicros,
      seenProviderRequestIds: new Set(),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ").toLowerCase()).toMatch(/locale/);
  });

  it("rejects missing rights/provenance", async () => {
    const config = requireConfig();
    const transport = createMockProvider(
      mockOpts(config, { costMicros: "1", failMode: "missing-rights" }),
    );
    const result = await executeProviderContract(baseRequest(), {
      config: { ...config, providerApiKeyPresent: true },
      transport,
      expectedProviderName: config.providerName,
      remainingRunBudgetMicros: config.runCostCeilingMicros,
      seenProviderRequestIds: new Set(),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ").toLowerCase()).toMatch(/license|rights/);
  });

  it("rejects high provider cost / budget failure", async () => {
    const config = requireConfig();
    const transport = createMockProvider(mockOpts(config, { costMicros: "1", failMode: "high-cost" }));
    const result = await executeProviderContract(baseRequest(), {
      config: { ...config, providerApiKeyPresent: true },
      transport,
      expectedProviderName: config.providerName,
      remainingRunBudgetMicros: config.runCostCeilingMicros,
      seenProviderRequestIds: new Set(),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ").toLowerCase()).toMatch(/cost|ceiling|budget/);
  });

  it("production mode rejects fixture marker bytes", () => {
    const config = requireConfig({
      ...dryRunEnv(),
      LESSON_VISUALS_EXECUTION_MODE: "production",
      LESSON_VISUALS_PROVIDER_API_KEY: "k",
      LESSON_VISUALS_PROVIDER_ENDPOINT: "https://provider.example.invalid/v1/generate",
    });
    const png = encodeSolidPng(64, 36, [1, 2, 3]);
    const tainted = Buffer.concat([png, Buffer.from("LESSON_VISUALS_FIXTURE_MARKER")]);
    const v = validateOutputBytes({
      bytes: tainted,
      declaredMime: "image/png",
      declaredWidth: 64,
      declaredHeight: 36,
      declaredChecksum: sha256Hex(tainted),
      declaredByteLength: tainted.length,
      config,
      cellId: "intro-m1-l1-what-is-ai__en",
      lessonId: "intro-m1-l1-what-is-ai",
      locale: "en",
      runId: "run-test-1",
      controlRoomAuthorizationId: "CR-TEST-001",
      sourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      approvedManifestSha256: "a".repeat(64),
      forceProductionGates: true,
    });
    expect(v.ok).toBe(false);
    expect(v.fixtureRejected).toBe(true);
  });
});

describe("receipts and mappings", () => {
  it("accepted receipt creates exactly one mapping; failed creates none", async () => {
    const config = requireConfig();
    const dir = mkdtempSync(join(tmpdir(), "lv-prod-"));
    tempDirs.push(dir);
    const transport = createMockProvider(mockOpts(config));
    const ok = await runProductionCell({
      artifactsRoot: dir,
      config,
      transport,
      runId: "run-map-1",
      controlRoomAuthorizationId: "CR-MAP-1",
      sourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      approvedManifestSha256: "d".repeat(64),
      cellId: "intro-m1-l1-what-is-ai__en",
      lessonId: "intro-m1-l1-what-is-ai",
      locale: "en",
      method: 1,
      promptOrRenderingSpec: "master:intro-m1-l1-what-is-ai",
      attemptNumber: 1,
      remainingRunBudgetMicros: config.runCostCeilingMicros,
      seenProviderRequestIds: new Set(),
      quotaContext: (() => {
        const b = buildRuntimeQuotaContext({
          runId: "run-map-1",
          controlRoomAuthorizationId: "CR-MAP-1",
          sourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
          approvedManifestSha256: "d".repeat(64),
          mode: "full",
          allCellIds: padCellIds([
            "intro-m1-l1-what-is-ai__en",
            "intro-m1-l2-first-prompt__en",
          ]),
          skippedCellIds: [],
          maxRetries: 1,
          configuredProviderAttemptQuota: 800,
        });
        if (!b.context) throw new Error(b.errors.join("; "));
        return b.context;
      })(),
    });
    expect(ok.receipt.status).toBe("ACCEPTED");
    expect(ok.mapping).not.toBeNull();
    expect(buildMappingFromAcceptedReceipt(ok.receipt)?.cellId).toBe(ok.receipt.cellId);

    const badTransport = createMockProvider(
      mockOpts(config, { costMicros: "1", failMode: "empty-bytes" }),
    );
    const fail = await runProductionCell({
      artifactsRoot: dir,
      config,
      transport: badTransport,
      runId: "run-map-2",
      controlRoomAuthorizationId: "CR-MAP-2",
      sourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      approvedManifestSha256: "d".repeat(64),
      cellId: "intro-m1-l2-first-prompt__en",
      lessonId: "intro-m1-l2-first-prompt",
      locale: "en",
      method: 1,
      promptOrRenderingSpec: "master:intro-m1-l2-first-prompt",
      attemptNumber: 1,
      remainingRunBudgetMicros: config.runCostCeilingMicros,
      seenProviderRequestIds: new Set(),
      quotaContext: (() => {
        const b = buildRuntimeQuotaContext({
          runId: "run-map-2",
          controlRoomAuthorizationId: "CR-MAP-2",
          sourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
          approvedManifestSha256: "d".repeat(64),
          mode: "full",
          allCellIds: padCellIds([
            "intro-m1-l1-what-is-ai__en",
            "intro-m1-l2-first-prompt__en",
          ]),
          skippedCellIds: [],
          maxRetries: 1,
          configuredProviderAttemptQuota: 800,
        });
        if (!b.context) throw new Error(b.errors.join("; "));
        return b.context;
      })(),
    });
    expect(fail.receipt.status).not.toBe("ACCEPTED");
    expect(fail.mapping).toBeNull();
    expect(buildMappingFromAcceptedReceipt(fail.receipt)).toBeNull();
  });

  it("rejects reused receipt with mismatched fingerprint", () => {
    const fp = fingerprintProductionReceipt({
      runId: "r1",
      cellId: "intro-m1-l1-what-is-ai__en",
      lessonId: "intro-m1-l1-what-is-ai",
      locale: "en",
      method: 1,
      sourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      approvedManifestSha256: "e".repeat(64),
      idempotencyKey: "k1",
      contentSha256: "f".repeat(64),
    });
    const other = fingerprintProductionReceipt({
      runId: "r1",
      cellId: "intro-m1-l1-what-is-ai__en",
      lessonId: "intro-m1-l1-what-is-ai",
      locale: "en",
      method: 1,
      sourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      approvedManifestSha256: "e".repeat(64),
      idempotencyKey: "k1",
      contentSha256: "0".repeat(64),
    });
    expect(fp).not.toBe(other);
  });

  it("production mode rejects mock transport", async () => {
    const config = requireConfig({
      ...dryRunEnv(),
      LESSON_VISUALS_EXECUTION_MODE: "production",
      LESSON_VISUALS_PROVIDER_API_KEY: "k",
      LESSON_VISUALS_PROVIDER_ENDPOINT: "https://provider.example.invalid/v1/generate",
    });
    const dir = mkdtempSync(join(tmpdir(), "lv-prod-mock-"));
    tempDirs.push(dir);
    const transport = createMockProvider(mockOpts(config, { costMicros: "1" }));
    const result = await runProductionCell({
      artifactsRoot: dir,
      config,
      transport,
      runId: "run-prod-mock",
      controlRoomAuthorizationId: "CR-P",
      sourceSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      approvedManifestSha256: "a".repeat(64),
      cellId: "intro-m1-l1-what-is-ai__en",
      lessonId: "intro-m1-l1-what-is-ai",
      locale: "en",
      method: 1,
      promptOrRenderingSpec: "master:intro-m1-l1-what-is-ai",
      attemptNumber: 1,
      remainingRunBudgetMicros: config.runCostCeilingMicros,
      seenProviderRequestIds: new Set(),
      quotaContext: quotaCtx(),
    });
    expect(result.receipt.status).toBe("NON_RETRYABLE_FAILURE");
    expect(result.receipt.failureCode).toBe("MOCK_IN_PRODUCTION");
  });
});
