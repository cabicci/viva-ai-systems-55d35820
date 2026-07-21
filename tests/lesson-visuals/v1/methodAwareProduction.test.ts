/**
 * Method-aware production router: Methods 2/3/4 contracts + full 400 routing + pilot E2E.
 * No live paid provider calls.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  AUTHORITATIVE_BASE_SOURCE_SHA,
  DEFAULT_REQUIRED_HEIGHT,
  DEFAULT_REQUIRED_WIDTH,
} from "../../../src/lib/lesson-visuals/v1/constants";
import { loadProductionConfig, type ProductionEnv } from "../../../src/lib/lesson-visuals/v1/production/config";
import { runProductionCell } from "../../../src/lib/lesson-visuals/v1/production/cellRunner";
import { loadLessonMaster } from "../../../src/lib/lesson-visuals/v1/production/masterLoader";
import {
  classifyMethodRoute,
  selectMethodAwareTransport,
} from "../../../src/lib/lesson-visuals/v1/production/methodRouter";
import {
  assertOpenAIRequestDoesNotLeakInternalSchema,
  mapOpenAIImagesResponseToInternal,
  toOpenAIImagesRequest,
} from "../../../src/lib/lesson-visuals/v1/production/openaiImagesAdapter";
import { createOpenAIImagesTransport } from "../../../src/lib/lesson-visuals/v1/production/openaiImagesTransport";
import { inspectPng, encodeSolidPng, sha256Hex } from "../../../src/lib/lesson-visuals/v1/production/pngCodec";
import { buildRuntimeQuotaContext } from "../../../src/lib/lesson-visuals/v1/production/quotaContext";
import {
  buildLocaleRenderingSpec,
  serializeRenderingSpec,
} from "../../../src/lib/lesson-visuals/v1/production/renderingSpec";
import {
  createScreenshotCaptureTransport,
  looksLikeLoginRedirectUrl,
} from "../../../src/lib/lesson-visuals/v1/production/screenshotCapture";
import type {
  ProductionConfig,
  ProviderGenerationRequest,
} from "../../../src/lib/lesson-visuals/v1/production/types";
import type { Method } from "../../../src/lib/lesson-visuals/v1/types";

const repoRoot = resolve(import.meta.dirname, "../../..");
const EXECUTION_SHA = "11e964b3aabc63baf85e3808219ed75bf685df3d";
const PILOT_PATH = resolve(repoRoot, "docs/lesson-visuals/v1/AUTHORIZED_PILOT_12.json");
const MANIFEST_PATH = resolve(repoRoot, "docs/lesson-visuals/v1/AUTHORIZED_MANIFEST.json");

const dirs: string[] = [];
afterEach(() => {
  while (dirs.length) {
    const d = dirs.pop();
    if (d) rmSync(d, { recursive: true, force: true });
  }
});

function prodEnv(overrides: Partial<ProductionEnv> = {}): ProductionEnv {
  return {
    LESSON_VISUALS_EXECUTION_MODE: "production",
    LESSON_VISUALS_PROVIDER_NAME: "openai",
    LESSON_VISUALS_PROVIDER_MODEL: "gpt-image-1",
    LESSON_VISUALS_PROVIDER_API_KEY: "sk-test-not-real",
    LESSON_VISUALS_PROVIDER_ACCOUNT_ID: "acct-test",
    LESSON_VISUALS_PROVIDER_PROJECT_ID: "proj-test",
    LESSON_VISUALS_AI_AUTH_ID: "auth-test",
    LESSON_VISUALS_PROVIDER_ENDPOINT: "https://api.openai.com/v1/images/generations",
    LESSON_VISUALS_PROVIDER_TIMEOUT_MS: "30000",
    LESSON_VISUALS_STORAGE_CREDENTIAL: "",
    LESSON_VISUALS_RUN_COST_CEILING_USD_MICROS: "1000000000",
    LESSON_VISUALS_CELL_COST_CEILING_USD_MICROS: "100000",
    LESSON_VISUALS_MAX_OUTPUT_BYTES: "5000000",
    LESSON_VISUALS_ALLOWED_MIME_TYPES: "image/png",
    LESSON_VISUALS_REQUIRED_WIDTH: String(DEFAULT_REQUIRED_WIDTH),
    LESSON_VISUALS_REQUIRED_HEIGHT: String(DEFAULT_REQUIRED_HEIGHT),
    LESSON_VISUALS_PROVIDER_ATTEMPT_QUOTA: "800",
    LESSON_VISUALS_MAX_RETRIES: "1",
    LESSON_VISUALS_OUTPUT_STORAGE_TARGET: "artifact://lesson-visuals",
    LOVABLE_DISPATCH_ACTORS: "lovable",
    ...overrides,
  };
}

function requireConfig(env: ProductionEnv = prodEnv()): ProductionConfig {
  const loaded = loadProductionConfig(env);
  if (!loaded.ok || !loaded.config) throw new Error(loaded.errors.join("; "));
  return loaded.config;
}

function baseRequest(
  overrides: Partial<ProviderGenerationRequest> = {},
): ProviderGenerationRequest {
  return {
    schemaVersion: "lesson-visual-provider-request/v1",
    runId: "run-method-router",
    controlRoomAuthorizationId: "CR-MR-1",
    contentSha: AUTHORITATIVE_BASE_SOURCE_SHA,
    executionSha: EXECUTION_SHA,
    approvedManifestSha256: "b".repeat(64),
    cellId: "analyst-m1-l1-from-automation-to-insight__en",
    lessonId: "analyst-m1-l1-from-automation-to-insight",
    locale: "en",
    method: 2,
    promptOrRenderingSpec: '{"schemaVersion":"lesson-visual-rendering-spec/v1"}',
    requestedWidth: DEFAULT_REQUIRED_WIDTH,
    requestedHeight: DEFAULT_REQUIRED_HEIGHT,
    expectedMimeTypes: ["image/png"],
    rightsProvenanceRequirements: {
      requireGreenfield: true,
      prohibitLegacyReuse: true,
      requireProviderRequestId: true,
      requireLicenseBasis: true,
    },
    idempotencyKey: "idem-mr-1",
    attemptNumber: 1,
    budgetAllocationMicros: "100000",
    maxCostMicros: "100000",
    expectedProviderAccountId: "acct-test",
    expectedProviderProjectId: "proj-test",
    expectedProviderAuthId: "auth-test",
    ...overrides,
  };
}

describe("Method routing coverage (full 400-cell manifest)", () => {
  it("routes every authorized cell to the correct method transport class", () => {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as {
      cells: Array<{ cellId: string; lessonId: string; locale: string; method: Method }>;
    };
    expect(manifest.cells).toHaveLength(400);

    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const cell of manifest.cells) {
      const route = classifyMethodRoute(cell.method);
      counts[cell.method] += 1;
      if (cell.method === 1) {
        expect(route.kind).toBe("local-deterministic");
        expect(route.zeroProviderCalls).toBe(true);
      } else if (cell.method === 2) {
        expect(route.kind).toBe("openai-images");
        expect(route.zeroProviderCalls).toBe(false);
      } else if (cell.method === 3) {
        expect(route.kind).toBe("screenshot");
        expect(route.zeroProviderCalls).toBe(false);
      } else if (cell.method === 4) {
        expect(route.kind).toBe("local-hybrid");
        expect(route.zeroProviderCalls).toBe(true);
      }
    }
    expect(counts[1] + counts[2] + counts[3] + counts[4]).toBe(400);
    expect(counts[1]).toBeGreaterThan(0);
    expect(counts[2]).toBeGreaterThan(0);
    expect(counts[3]).toBeGreaterThan(0);
    expect(counts[4]).toBeGreaterThan(0);
  });
});

describe("Method 2 OpenAI Images contract (offline)", () => {
  it("converts to official OpenAI request without leaking internal schema", () => {
    const master = loadLessonMaster({
      lessonId: "intro-m1-l4-ai-can-cannot",
      repoRoot,
    });
    // Force method-2 style prompt conversion even if master method differs — adapter unit test.
    const body = toOpenAIImagesRequest({
      model: "gpt-image-1",
      master,
      locale: "en",
      width: DEFAULT_REQUIRED_WIDTH,
      height: DEFAULT_REQUIRED_HEIGHT,
    });
    expect(body).toEqual(
      expect.objectContaining({
        model: "gpt-image-1",
        n: 1,
        response_format: "b64_json",
        size: "1792x1024",
        prompt: expect.stringContaining("No embedded text"),
      }),
    );
    expect(body.prompt).toContain("Instructional illustration");
    expect(body).not.toHaveProperty("schemaVersion");
    expect(body).not.toHaveProperty("controlRoomAuthorizationId");
    assertOpenAIRequestDoesNotLeakInternalSchema(body);
  });

  it("maps OpenAI response into internal receipt fields without fabricating request id", async () => {
    const master = loadLessonMaster({
      lessonId: "intro-m1-l4-ai-can-cannot",
      repoRoot,
    });
    const png = encodeSolidPng(1792, 1024, [10, 20, 30]);
    let httpCalls = 0;
    const transport = createOpenAIImagesTransport({
      apiKey: "sk-test-not-real",
      endpoint: "https://api.openai.com/v1/images/generations",
      timeoutMs: 5000,
      providerName: "openai",
      model: "gpt-image-1",
      accountId: "acct-test",
      projectId: "proj-test",
      authId: "auth-test",
      master,
      requiredWidth: DEFAULT_REQUIRED_WIDTH,
      requiredHeight: DEFAULT_REQUIRED_HEIGHT,
      fetchImpl: (async (_url, init) => {
        httpCalls += 1;
        const sent = JSON.parse(String(init?.body ?? "{}"));
        assertOpenAIRequestDoesNotLeakInternalSchema(sent);
        expect(sent).not.toHaveProperty("promptOrRenderingSpec");
        return new Response(
          JSON.stringify({
            created: 1_700_000_000,
            data: [{ b64_json: png.toString("base64") }],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json", "x-request-id": "req_openai_test_1" },
          },
        );
      }) as typeof fetch,
      nowIso: () => "2026-07-21T12:00:00.000Z",
    });

    const response = await transport.generate(baseRequest({ method: 2, lessonId: master.lessonId }));
    expect(httpCalls).toBe(1);
    expect(response.providerRequestId).toBe("req_openai_test_1");
    expect(response.providerReportedCostMicros).toBe("0");
    expect(response.providerMetadata.costSource).toBe("openai-images-api-no-cost-field");
    expect(response.width).toBe(DEFAULT_REQUIRED_WIDTH);
    expect(response.height).toBe(DEFAULT_REQUIRED_HEIGHT);
    const bytes = Buffer.from(response.outputBytesBase64!, "base64");
    const info = inspectPng(bytes);
    expect(info?.width).toBe(DEFAULT_REQUIRED_WIDTH);
    expect(info?.height).toBe(DEFAULT_REQUIRED_HEIGHT);
    expect(response.contentChecksumSha256).toBe(sha256Hex(bytes));
  });

  it("fails closed when OpenAI omits x-request-id (no fabrication)", () => {
    const mapped = mapOpenAIImagesResponseToInternal({
      request: baseRequest(),
      openaiBody: {
        created: 1,
        data: [{ b64_json: encodeSolidPng(64, 36, [1, 2, 3]).toString("base64") }],
      },
      responseRequestId: null,
      providerName: "openai",
      model: "gpt-image-1",
      accountId: "a",
      projectId: null,
      authId: "auth",
      requiredWidth: 64,
      requiredHeight: 36,
      generatedAt: "2026-07-21T12:00:00.000Z",
    });
    expect(mapped.ok).toBe(false);
    expect(mapped.errors.join(" ")).toMatch(/request id/i);
  });
});

describe("Method 3 screenshot contract (offline)", () => {
  it("accepts allowlisted capture and rejects login redirects", async () => {
    const master = loadLessonMaster({
      lessonId: "builder-m6-l3-first-prompt-to-lovable",
      repoRoot,
    });
    expect(master.method).toBe(3);
    expect(looksLikeLoginRedirectUrl("https://lovable.dev/login")).toBe(true);
    expect(looksLikeLoginRedirectUrl("https://lovable.dev/")).toBe(false);

    const config = requireConfig();
    let captureCalls = 0;
    const selected = selectMethodAwareTransport({
      config,
      method: 3,
      apiKey: "sk-test-not-real",
      master,
      screenshotCapture: async () => {
        captureCalls += 1;
        return {
          png: encodeSolidPng(1440, 900, [5, 6, 7]),
          finalUrl: "https://lovable.dev/",
          httpStatus: 200,
        };
      },
    });
    expect(selected.ok, selected.errors.join("; ")).toBe(true);
    expect(selected.kind).toBe("screenshot");

    const response = await selected.transport!.generate(
      baseRequest({
        method: 3,
        lessonId: master.lessonId,
        cellId: `${master.lessonId}__en`,
      }),
    );
    expect(captureCalls).toBe(1);
    expect(response.width).toBe(DEFAULT_REQUIRED_WIDTH);
    expect(response.height).toBe(DEFAULT_REQUIRED_HEIGHT);
    expect(response.rightsProvenance.screenshotSiteIdentity).toBe("https://lovable.dev/");

    const rejectTransport = createScreenshotCaptureTransport({
      master,
      providerName: "screenshot-capture",
      model: "playwright-chromium-png-v1",
      accountId: "acct-test",
      projectId: "proj-test",
      authId: "auth-test",
      requiredWidth: DEFAULT_REQUIRED_WIDTH,
      requiredHeight: DEFAULT_REQUIRED_HEIGHT,
      timeoutMs: 5000,
      captureFn: async () => ({
        png: encodeSolidPng(100, 100, [1, 1, 1]),
        finalUrl: "https://lovable.dev/login",
        httpStatus: 200,
      }),
    });
    await expect(
      rejectTransport.generate(
        baseRequest({
          method: 3,
          lessonId: master.lessonId,
          cellId: `${master.lessonId}__en`,
        }),
      ),
    ).rejects.toThrow(/login|auth redirect/i);
  });
});

describe("Method 4 hybrid local contract (offline)", () => {
  it("renders deterministic hybrid PNG with zero HTTP calls", async () => {
    const master = loadLessonMaster({
      lessonId: "analyst-m4-automated-dashboard",
      repoRoot,
    });
    expect(master.method).toBe(4);
    const config = requireConfig();
    let fetchCalls = 0;
    const selected = selectMethodAwareTransport({
      config,
      method: 4,
      apiKey: "sk-test-not-real",
      master,
      fetchImpl: (async () => {
        fetchCalls += 1;
        throw new Error("HTTP must not be called for Method 4");
      }) as typeof fetch,
    });
    expect(selected.ok).toBe(true);
    expect(selected.kind).toBe("local-hybrid");
    expect(selected.countsAsExternalProviderAttempt).toBe(false);

    const response = await selected.transport!.generate(
      baseRequest({
        method: 4,
        lessonId: master.lessonId,
        cellId: `${master.lessonId}__en`,
        locale: "en",
        promptOrRenderingSpec: serializeRenderingSpec(
          buildLocaleRenderingSpec(master, "en", 4),
        ),
      }),
    );
    expect(fetchCalls).toBe(0);
    expect(selected.transport!.httpCallCount).toBe(0);
    expect(response.providerName).toBe("local-master-renderer");
    expect(response.modelOrRenderer).toBe("hybrid-master-png-v1");
    const info = inspectPng(Buffer.from(response.outputBytesBase64!, "base64"));
    expect(info?.width).toBe(DEFAULT_REQUIRED_WIDTH);
    expect(info?.height).toBe(DEFAULT_REQUIRED_HEIGHT);
    expect(info?.decodable).toBe(true);
  });
});

describe("Pilot E2E production-like Method 1 (exact 12 cells)", () => {
  it("produces 12 PNGs, 12 ACCEPTED receipts+mappings, zero HTTP/provider calls", async () => {
    const pilot = JSON.parse(readFileSync(PILOT_PATH, "utf8")) as {
      cells: Array<{
        cellId: string;
        lessonId: string;
        locale: string;
        method: Method;
        masterRelativePath: string;
      }>;
    };
    expect(pilot.cells).toHaveLength(12);
    expect(pilot.cells.every((c) => c.method === 1)).toBe(true);

    const config = requireConfig();
    const artifactsRoot = mkdtempSync(join(tmpdir(), "li-pilot-e2e-"));
    dirs.push(artifactsRoot);

    let httpCalls = 0;
    const fetchImpl = (async () => {
      httpCalls += 1;
      throw new Error("HTTP must not be called for Method 1 pilot");
    }) as typeof fetch;

    const cellIds = pilot.cells.map((c) => c.cellId);
    const pilotBytes = readFileSync(PILOT_PATH);
    const pilotDigest = createHash("sha256").update(pilotBytes).digest("hex");
    const quota = buildRuntimeQuotaContext({
      runId: "run-pilot-e2e",
      controlRoomAuthorizationId: "CR-PILOT-E2E",
      contentSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      executionSha: EXECUTION_SHA,
      approvedManifestSha256: "c".repeat(64),
      mode: "pilot",
      allCellIds: cellIds,
      skippedCellIds: [],
      maxRetries: 1,
      configuredProviderAttemptQuota: 24,
      approvedPilotManifestSha256: pilotDigest,
    });
    expect(quota.ok, quota.errors.join("; ")).toBe(true);

    let externalAttempts = 0;
    const seenIds = new Set<string>();

    for (const cell of pilot.cells) {
      const master = loadLessonMaster({
        lessonId: cell.lessonId,
        repoRoot,
        masterRelativePath: cell.masterRelativePath,
      });
      expect(master.method).toBe(1);
      const spec = serializeRenderingSpec(
        buildLocaleRenderingSpec(master, cell.locale as "en", 1),
      );
      expect(spec).not.toContain("lesson-visual:");
      expect(spec).toContain(master.titles[cell.locale as "en"]);

      const selected = selectMethodAwareTransport({
        config,
        method: 1,
        apiKey: "sk-test-not-real",
        master,
        fetchImpl,
      });
      expect(selected.ok, selected.errors.join("; ")).toBe(true);
      expect(selected.kind).toBe("local-deterministic");
      expect(selected.countsAsExternalProviderAttempt).toBe(false);

      const result = await runProductionCell({
        artifactsRoot,
        config,
        transport: selected.transport!,
        runId: "run-pilot-e2e",
        controlRoomAuthorizationId: "CR-PILOT-E2E",
        contentSha: AUTHORITATIVE_BASE_SOURCE_SHA,
        executionSha: EXECUTION_SHA,
        approvedManifestSha256: quota.context!.approvedManifestSha256,
        cellId: cell.cellId,
        lessonId: cell.lessonId,
        locale: cell.locale as "en",
        method: 1,
        promptOrRenderingSpec: spec,
        attemptNumber: 1,
        remainingRunBudgetMicros: config.runCostCeilingMicros,
        seenProviderRequestIds: seenIds,
        quotaContext: quota.context!,
        countsAsExternalProviderAttempt: false,
        expectedProviderName: selected.expectedProviderName!,
        expectedModel: selected.expectedModel!,
        onProviderAttempt: () => {
          externalAttempts += 1;
        },
      });

      expect(result.receipt.status).toBe("ACCEPTED");
      expect(result.mapping).not.toBeNull();
      expect(result.providerAttempted).toBe(false);
      expect(selected.transport!.httpCallCount ?? 0).toBe(0);

      const pngPath = join(artifactsRoot, "cells", cell.cellId, "output.png");
      expect(existsSync(pngPath)).toBe(true);
      const pngInfo = inspectPng(readFileSync(pngPath));
      expect(pngInfo?.decodable).toBe(true);
      expect(pngInfo?.width).toBe(DEFAULT_REQUIRED_WIDTH);
      expect(pngInfo?.height).toBe(DEFAULT_REQUIRED_HEIGHT);

      expect(existsSync(join(artifactsRoot, "receipts", `${cell.cellId}.receipt.json`))).toBe(
        true,
      );
      expect(existsSync(join(artifactsRoot, "mappings", `${cell.cellId}.mapping.json`))).toBe(
        true,
      );
    }

    expect(httpCalls).toBe(0);
    expect(externalAttempts).toBe(0);
  });
});
