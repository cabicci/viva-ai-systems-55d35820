/**
 * Focused SHA contract separation: immutable content vs authorized execution.
 * Offline only — dry-run mock, no network.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  AUTHORITATIVE_BASE_SOURCE_SHA,
  AUTHORIZED_MANIFEST_RELATIVE_PATH,
  EXPECTED_CELL_COUNT,
  EXPECTED_PILOT_CELL_COUNT,
} from "../../../src/lib/lesson-visuals/v1/constants";
import { validateDispatchAuthorization } from "../../../src/lib/lesson-visuals/v1/dispatch/authorizationContract";
import { loadProductionConfig } from "../../../src/lib/lesson-visuals/v1/production/config";
import { runProductionCell } from "../../../src/lib/lesson-visuals/v1/production/cellRunner";
import { createMockProvider } from "../../../src/lib/lesson-visuals/v1/production/mockProvider";
import { runGlobalPreflight } from "../../../src/lib/lesson-visuals/v1/production/preflight";
import { buildRuntimeQuotaContext } from "../../../src/lib/lesson-visuals/v1/production/quotaContext";
import { buildMappingFromAcceptedReceipt } from "../../../src/lib/lesson-visuals/v1/production/mappings";
import { buildRunSummary } from "../../../src/lib/lesson-visuals/v1/production/runSummary";
import { validatePilotManifest } from "../../../src/lib/lesson-visuals/v1/production/pilotManifest";
import { validateRepinState } from "../../../src/lib/lesson-visuals/v1/scripts/repin_source_sha";
import type { ProductionEnv } from "../../../src/lib/lesson-visuals/v1/production/config";

const repoRoot = resolve(__dirname, "../../..");
const EXECUTION_SHA = "2c441e449d57dd834366c260a2dd37b251a5583b";
const MANIFEST_BYTES = readFileSync(resolve(repoRoot, AUTHORIZED_MANIFEST_RELATIVE_PATH));
const MANIFEST_SHA256 = createHash("sha256").update(MANIFEST_BYTES).digest("hex");
const MANIFEST = JSON.parse(MANIFEST_BYTES.toString("utf8")) as {
  sourceSha: string;
  cells: { cellId: string }[];
};

function dryEnv(): ProductionEnv {
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
  };
}

function pad400(seed: string[]): string[] {
  const out = [...seed];
  let i = 0;
  while (out.length < 400) {
    out.push(`pad-lesson-${i}__en`);
    i += 1;
  }
  return out;
}

function dispatchBase(over: Record<string, unknown> = {}) {
  return {
    controlRoomAuthorizationId: "CR-SHA-CONTRACT-001",
    approvedContentSha: AUTHORITATIVE_BASE_SOURCE_SHA,
    approvedExecutionSha: EXECUTION_SHA,
    approvedManifestSha256: MANIFEST_SHA256,
    runMode: "full" as const,
    dispatchActor: "lovable",
    githubActor: "lovable",
    actualExecutionSha: EXECUTION_SHA,
    actualManifestSha256: MANIFEST_SHA256,
    allowedDispatchActors: ["lovable"] as const,
    maxParallel: 4,
    ...over,
  };
}

describe("SHA contract separation", () => {
  describe("valid separation", () => {
    it("execution commit may differ from approved content SHA", () => {
      expect(EXECUTION_SHA).not.toBe(AUTHORITATIVE_BASE_SOURCE_SHA);
      const r = validateDispatchAuthorization(dispatchBase());
      expect(r.ok, r.errors.join("; ")).toBe(true);
    });

    it("valid execution + valid content passes dispatch + preflight (dry-run env)", () => {
      const dispatch = validateDispatchAuthorization(dispatchBase());
      expect(dispatch.ok).toBe(true);

      const pre = runGlobalPreflight({
        repoRoot,
        env: dryEnv(),
        mode: "full",
        maxParallel: 4,
        dispatch: dispatchBase(),
      });
      expect(pre.ok, pre.errors.join("; ")).toBe(true);
      expect(pre.contentSha).toBe(AUTHORITATIVE_BASE_SOURCE_SHA);
      expect(pre.executionSha).toBe(EXECUTION_SHA);
    });

    it("manifest sourceSha remains pinned to content SHA only", () => {
      expect(MANIFEST.sourceSha).toBe(AUTHORITATIVE_BASE_SOURCE_SHA);
      const repin = validateRepinState();
      expect(repin.ok, repin.errors.join("; ")).toBe(true);
      expect(repin.sourceSha).toBe(AUTHORITATIVE_BASE_SOURCE_SHA);
    });
  });

  describe("content mismatch", () => {
    it("wrong approvedContentSha fails dispatch when non-hex ref", () => {
      const r = validateDispatchAuthorization(dispatchBase({ approvedContentSha: "main" }));
      expect(r.ok).toBe(false);
      expect(r.errors.join(" ")).toMatch(/approvedContentSha/);
    });

    it("full repin / manifest content mismatch fails", () => {
      const repin = validateRepinState();
      expect(repin.ok).toBe(true);
      const pre = runGlobalPreflight({
        repoRoot,
        env: dryEnv(),
        mode: "full",
        maxParallel: 4,
        dispatch: dispatchBase({ approvedContentSha: "0".repeat(40) }),
      });
      expect(pre.ok).toBe(false);
      expect(pre.errors.join(" ")).toMatch(/approvedContentSha|manifest sourceSha/);
    });

    it("tampered manifest digest fails dispatch", () => {
      const r = validateDispatchAuthorization(
        dispatchBase({ actualManifestSha256: "b".repeat(64) }),
      );
      expect(r.ok).toBe(false);
      expect(r.errors.join(" ")).toMatch(/AUTHORIZED_MANIFEST/);
    });

    it("pilot manifest wrong content sourceSha fails validatePilotManifest", () => {
      const pilotPath = resolve(repoRoot, "docs/lesson-visuals/v1/AUTHORIZED_PILOT_12.json");
      const pilot = JSON.parse(readFileSync(pilotPath, "utf8"));
      const v = validatePilotManifest(pilot, {
        sourceSha: "0".repeat(40),
        fullManifestSha256: MANIFEST_SHA256,
        fullCellIds: MANIFEST.cells.map((c) => c.cellId),
      });
      expect(v.ok).toBe(false);
    });
  });

  describe("execution mismatch", () => {
    it("HEAD != approvedExecutionSha fails", () => {
      const r = validateDispatchAuthorization(
        dispatchBase({ actualExecutionSha: "0".repeat(40) }),
      );
      expect(r.ok).toBe(false);
      expect(r.errors.join(" ")).toMatch(/execution_sha mismatch/);
    });

    it("missing actualExecutionSha fails full preflight when required", () => {
      const pre = runGlobalPreflight({
        repoRoot,
        env: dryEnv(),
        mode: "full",
        maxParallel: 4,
        requireActualExecutionSha: true,
        dispatch: {
          ...dispatchBase(),
          actualExecutionSha: undefined,
        },
      });
      expect(pre.ok).toBe(false);
      expect(pre.errors.join(" ")).toMatch(/actualExecutionSha/);
    });

    it("branch-name execution SHA fails dispatch", () => {
      const r = validateDispatchAuthorization(dispatchBase({ approvedExecutionSha: "main" }));
      expect(r.ok).toBe(false);
      expect(r.errors.join(" ")).toMatch(/approvedExecutionSha/);
    });

    it("unauthorized dispatch actor fails", () => {
      const r = validateDispatchAuthorization(dispatchBase({ dispatchActor: "cursor" }));
      expect(r.ok).toBe(false);
    });
  });

  describe("runtime propagation", () => {
    it("buildRuntimeQuotaContext carries distinct contentSha and executionSha", () => {
      const built = buildRuntimeQuotaContext({
        runId: "run-prop",
        controlRoomAuthorizationId: "CR-PROP",
        contentSha: AUTHORITATIVE_BASE_SOURCE_SHA,
        executionSha: EXECUTION_SHA,
        approvedManifestSha256: MANIFEST_SHA256,
        mode: "full",
        allCellIds: pad400(["intro-m1-l1-what-is-ai__en"]),
        skippedCellIds: [],
        maxRetries: 1,
        configuredProviderAttemptQuota: 800,
      });
      expect(built.ok, built.errors.join("; ")).toBe(true);
      expect(built.context!.contentSha).toBe(AUTHORITATIVE_BASE_SOURCE_SHA);
      expect(built.context!.executionSha).toBe(EXECUTION_SHA);
      expect(built.context!.contentSha).not.toBe(built.context!.executionSha);
    });

    it("receipt/mapping/summary carry distinct contentSha and executionSha", async () => {
      const loaded = loadProductionConfig(dryEnv());
      expect(loaded.ok).toBe(true);
      const config = loaded.config!;
      const quota = buildRuntimeQuotaContext({
        runId: "run-cell-prop",
        controlRoomAuthorizationId: "CR-PROP",
        contentSha: AUTHORITATIVE_BASE_SOURCE_SHA,
        executionSha: EXECUTION_SHA,
        approvedManifestSha256: MANIFEST_SHA256,
        mode: "full",
        allCellIds: pad400(["intro-m1-l1-what-is-ai__en"]),
        skippedCellIds: [],
        maxRetries: 1,
        configuredProviderAttemptQuota: 800,
      });
      const tmp = resolve(repoRoot, "artifacts", "sha-contract-test");
      const result = await runProductionCell({
        artifactsRoot: tmp,
        config,
        transport: createMockProvider({
          providerName: config.providerName,
          model: config.providerModel,
          accountId: config.providerAccountId,
          projectId: config.providerProjectId || null,
          authId: config.providerAuthId,
          width: 64,
          height: 36,
          costMicros: "1000",
        }),
        runId: "run-cell-prop",
        controlRoomAuthorizationId: "CR-PROP",
        contentSha: AUTHORITATIVE_BASE_SOURCE_SHA,
        executionSha: EXECUTION_SHA,
        approvedManifestSha256: MANIFEST_SHA256,
        cellId: "intro-m1-l1-what-is-ai__en",
        lessonId: "intro-m1-l1-what-is-ai",
        locale: "en",
        method: 1,
        promptOrRenderingSpec: "greenfield",
        attemptNumber: 1,
        remainingRunBudgetMicros: config.runCostCeilingMicros,
        seenProviderRequestIds: new Set(),
        quotaContext: quota.context,
      });
      expect(result.receipt.status).toBe("ACCEPTED");
      expect(result.receipt.contentSha).toBe(AUTHORITATIVE_BASE_SOURCE_SHA);
      expect(result.receipt.executionSha).toBe(EXECUTION_SHA);
      const mapping = buildMappingFromAcceptedReceipt(result.receipt);
      expect(mapping).not.toBeNull();
      expect(mapping!.contentSha).toBe(AUTHORITATIVE_BASE_SOURCE_SHA);
      expect(mapping!.executionSha).toBe(EXECUTION_SHA);
      const summary = buildRunSummary({
        runId: "run-cell-prop",
        contentSha: AUTHORITATIVE_BASE_SOURCE_SHA,
        executionSha: EXECUTION_SHA,
        approvedManifestSha256: MANIFEST_SHA256,
        mode: "full",
        executionMode: "dry-run",
        expectedCells: 400,
        receipts: [result.receipt],
        mappings: mapping ? [mapping] : [],
        totalCostMicros: result.costMicros,
        runCostCeilingMicros: config.runCostCeilingMicros,
        providerAttemptQuota: config.providerAttemptQuota,
        providerAttemptsUsed: 1,
      });
      expect(summary.contentSha).toBe(AUTHORITATIVE_BASE_SOURCE_SHA);
      expect(summary.executionSha).toBe(EXECUTION_SHA);
    });
  });

  describe("non-regression", () => {
    it("pilot 12 and full 400 matrix sizes from authoritative manifests", () => {
      expect(MANIFEST.cells.length).toBe(EXPECTED_CELL_COUNT);
      const pilotPath = resolve(repoRoot, "docs/lesson-visuals/v1/AUTHORIZED_PILOT_12.json");
      const pilot = JSON.parse(readFileSync(pilotPath, "utf8")) as { cells: unknown[] };
      expect(pilot.cells.length).toBe(EXPECTED_PILOT_CELL_COUNT);
    });
  });
});
