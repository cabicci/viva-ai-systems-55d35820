/**
 * Focused tests: authoritative 12-cell pilot + production HTTP transport selection.
 * Offline only — no network, no workflow dispatch, no secrets printed.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { AUTHORITATIVE_BASE_SOURCE_SHA } from "../../../src/lib/lesson-visuals/v1/constants";
import { loadProductionConfig, type ProductionEnv } from "../../../src/lib/lesson-visuals/v1/production/config";
import { createHttpProvider } from "../../../src/lib/lesson-visuals/v1/production/httpProvider";
import {
  AUTHORIZED_PILOT_MANIFEST_RELATIVE_PATH,
  EXPECTED_PILOT_CELL_COUNT,
  PILOT_SELECTION_ALGORITHM,
  buildPilotManifest,
  generatePilotManifestFromRepo,
  loadFullManifest,
  selectPilotCellsFromFull,
  validatePilotManifest,
  verifyCheckedInPilotManifest,
} from "../../../src/lib/lesson-visuals/v1/production/pilotManifest";
import { runGlobalPreflight } from "../../../src/lib/lesson-visuals/v1/production/preflight";
import { buildGreenfieldRights } from "../../../src/lib/lesson-visuals/v1/production/rights";
import { encodeSolidPng, sha256Hex } from "../../../src/lib/lesson-visuals/v1/production/pngCodec";
import { selectProviderTransport } from "../../../src/lib/lesson-visuals/v1/production/selectTransport";
import type {
  ProviderGenerationRequest,
  ProviderGenerationResponse,
} from "../../../src/lib/lesson-visuals/v1/production/types";

const repoRoot = resolve(__dirname, "../../..");
const EXECUTION_SHA = "2c441e449d57dd834366c260a2dd37b251a5583b";

function dryEnv(over: Partial<ProductionEnv> = {}): ProductionEnv {
  return {
    LESSON_VISUALS_EXECUTION_MODE: "dry-run",
    LESSON_VISUALS_PROVIDER_NAME: "mock-provider",
    LESSON_VISUALS_PROVIDER_MODEL: "mock-renderer-v1",
    LESSON_VISUALS_PROVIDER_API_KEY: "",
    LESSON_VISUALS_PROVIDER_ACCOUNT_ID: "acct-test",
    LESSON_VISUALS_PROVIDER_PROJECT_ID: "proj-test",
    LESSON_VISUALS_AI_AUTH_ID: "auth-test",
    LESSON_VISUALS_PROVIDER_ENDPOINT: "",
    LESSON_VISUALS_PROVIDER_TIMEOUT_MS: "5000",
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

function prodEnv(over: Partial<ProductionEnv> = {}): ProductionEnv {
  return dryEnv({
    LESSON_VISUALS_EXECUTION_MODE: "production",
    LESSON_VISUALS_PROVIDER_API_KEY: "test-key-not-real",
    LESSON_VISUALS_PROVIDER_ENDPOINT: "https://provider.example.invalid/v1/generate",
    LESSON_VISUALS_PROVIDER_ATTEMPT_QUOTA: "36",
    ...over,
  });
}

describe("Pilot 12-cell authoritative selection", () => {
  it("selects exactly 12 cells, 3 per locale, deterministic, all in full 400", () => {
    const full = loadFullManifest(repoRoot);
    expect(full.ok).toBe(true);
    const a = selectPilotCellsFromFull(full.cells);
    const b = selectPilotCellsFromFull(full.cells);
    expect(a.ok).toBe(true);
    expect(a.cells).toHaveLength(EXPECTED_PILOT_CELL_COUNT);
    expect(a.cells.map((c) => c.cellId)).toEqual(b.cells.map((c) => c.cellId));
    const per: Record<string, number> = {};
    for (const c of a.cells) per[c.locale] = (per[c.locale] ?? 0) + 1;
    expect(per).toEqual({ "ar-EG": 3, "ar-MSA": 3, "ar-Gulf": 3, en: 3 });
    const fullIds = new Set(full.cells.map((c) => c.cellId));
    expect(new Set(a.cells.map((c) => c.cellId)).size).toBe(12);
    for (const c of a.cells) expect(fullIds.has(c.cellId)).toBe(true);
  });

  it("checked-in pilot digest is deterministic across two verify runs", () => {
    const v1 = verifyCheckedInPilotManifest(repoRoot);
    const v2 = verifyCheckedInPilotManifest(repoRoot);
    expect(v1.ok).toBe(true);
    expect(v2.ok).toBe(true);
    expect(v1.sha256).toBe(v2.sha256);
    expect(v1.cellIds).toHaveLength(12);
    expect(v1.cellIds).toEqual(v2.cellIds);
  });

  it("regeneration is byte-identical to checked-in file", () => {
    const gen = generatePilotManifestFromRepo(repoRoot);
    expect(gen.ok).toBe(true);
    const onDisk = readFileSync(resolve(repoRoot, AUTHORIZED_PILOT_MANIFEST_RELATIVE_PATH), "utf8");
    expect(gen.json).toBe(onDisk);
    expect(gen.manifest?.selectionAlgorithm).toBe(PILOT_SELECTION_ALGORITHM);
  });

  it("wrong pilot digest / full digest / sourceSha / counts fail", () => {
    const full = loadFullManifest(repoRoot);
    const built = buildPilotManifest({
      sourceSha: full.sourceSha!,
      fullManifestSha256: full.sha256!,
      fullCells: full.cells,
    });
    expect(built.ok).toBe(true);
    const m = structuredClone(built.manifest!);

    expect(
      validatePilotManifest({ ...m, sourceSha: "0".repeat(40) }, { sourceSha: full.sourceSha! }).ok,
    ).toBe(false);
    expect(
      validatePilotManifest(
        { ...m, fullManifestSha256: "b".repeat(64) },
        { fullManifestSha256: full.sha256! },
      ).ok,
    ).toBe(false);
    expect(validatePilotManifest({ ...m, pilotCount: 11 as 12 }).ok).toBe(false);
    expect(validatePilotManifest({ ...m, cells: m.cells.slice(0, 11) }).ok).toBe(false);
    expect(validatePilotManifest({ ...m, cells: [...m.cells, m.cells[0]!] }).ok).toBe(false);
    const dup = structuredClone(m);
    dup.cells[1] = { ...dup.cells[0]! };
    expect(validatePilotManifest(dup, { fullCellIds: full.cells.map((c) => c.cellId) }).ok).toBe(
      false,
    );
    const unknown = structuredClone(m);
    unknown.cells[0] = { ...unknown.cells[0]!, cellId: "not-a-real-cell__en" };
    expect(
      validatePilotManifest(unknown, { fullCellIds: full.cells.map((c) => c.cellId) }).ok,
    ).toBe(false);
  });

  it("preflight pilot matrix is exactly 12; full remains 400; no arbitrary subset", () => {
    const full = loadFullManifest(repoRoot);
    const pilotCheck = verifyCheckedInPilotManifest(repoRoot);
    expect(pilotCheck.ok).toBe(true);

    const pilot = runGlobalPreflight({
      repoRoot,
      env: dryEnv({ LESSON_VISUALS_PROVIDER_ATTEMPT_QUOTA: "36" }),
      mode: "pilot",
      maxParallel: 4,
      approvedPilotManifestSha256: pilotCheck.sha256,
      requireContentShaEqualsBase: true,
      requireActualExecutionSha: false,
      dispatch: {
        controlRoomAuthorizationId: "CR-PILOT-1",
        approvedContentSha: AUTHORITATIVE_BASE_SOURCE_SHA,
        approvedExecutionSha: EXECUTION_SHA,
        approvedManifestSha256: full.sha256!,
        runMode: "pilot",
        dispatchActor: "lovable",
        allowedDispatchActors: ["lovable"],
        actualManifestSha256: full.sha256!,
        actualExecutionSha: EXECUTION_SHA,
        maxParallel: 4,
        maxParallelMin: 1,
        maxParallelMax: 50,
      },
    });
    expect(pilot.ok, JSON.stringify(pilot.errors)).toBe(true);
    expect(pilot.cellCount).toBe(12);
    expect(pilot.matrixCellIds).toHaveLength(12);
    expect(pilot.eligibleCells).toBe(12);
    expect(pilot.pilotManifestSha256).toBe(pilotCheck.sha256);

    const fullMode = runGlobalPreflight({
      repoRoot,
      env: dryEnv(),
      mode: "full",
      maxParallel: 4,
      requireContentShaEqualsBase: true,
      dispatch: {
        controlRoomAuthorizationId: "CR-FULL-1",
        approvedContentSha: AUTHORITATIVE_BASE_SOURCE_SHA,
        approvedExecutionSha: EXECUTION_SHA,
        approvedManifestSha256: full.sha256!,
        runMode: "full",
        dispatchActor: "lovable",
        allowedDispatchActors: ["lovable"],
        actualManifestSha256: full.sha256!,
        actualExecutionSha: EXECUTION_SHA,
        maxParallel: 4,
        maxParallelMin: 1,
        maxParallelMax: 50,
      },
    });
    expect(fullMode.ok, JSON.stringify(fullMode.errors)).toBe(true);
    expect(fullMode.cellCount).toBe(400);
    expect(fullMode.matrixCellIds).toHaveLength(400);

    const wrongDigest = runGlobalPreflight({
      repoRoot,
      env: dryEnv({ LESSON_VISUALS_PROVIDER_ATTEMPT_QUOTA: "36" }),
      mode: "pilot",
      maxParallel: 4,
      approvedPilotManifestSha256: "a".repeat(64),
      requireContentShaEqualsBase: true,
      requireActualExecutionSha: false,
      dispatch: {
        controlRoomAuthorizationId: "CR-PILOT-2",
        approvedContentSha: AUTHORITATIVE_BASE_SOURCE_SHA,
        approvedExecutionSha: EXECUTION_SHA,
        approvedManifestSha256: full.sha256!,
        runMode: "pilot",
        dispatchActor: "lovable",
        allowedDispatchActors: ["lovable"],
        actualManifestSha256: full.sha256!,
        actualExecutionSha: EXECUTION_SHA,
        maxParallel: 4,
        maxParallelMin: 1,
        maxParallelMax: 50,
      },
    });
    expect(wrongDigest.ok).toBe(false);
  });

  it("workflow yaml includes pilot mode and forbids arbitrary cell lists", () => {
    const yml = readFileSync(
      resolve(repoRoot, ".github/workflows/lesson-driven-400-visual-pipeline.yml"),
      "utf8",
    );
    expect(yml).toContain("- pilot");
    expect(yml).toContain("approved_pilot_manifest_sha256");
    expect(yml).toContain("AUTHORIZED_PILOT_12.json");
    expect(yml).toContain("pilot mode must not expand to 400 cells");
    expect(yml).not.toMatch(/inputs:\s*[\s\S]*cell_list/);
  });
});

describe("Production HTTP transport selection", () => {
  it("dry-run selects mock; production selects http; production cannot use mock path", () => {
    const dry = loadProductionConfig(dryEnv());
    expect(dry.ok).toBe(true);
    const drySel = selectProviderTransport({ config: dry.config!, apiKey: "" });
    expect(drySel.ok).toBe(true);
    expect(drySel.kind).toBe("mock");
    expect(drySel.transport?.isMock).toBe(true);

    const prod = loadProductionConfig(prodEnv());
    expect(prod.ok).toBe(true);
    const prodSel = selectProviderTransport({
      config: prod.config!,
      apiKey: "test-key-not-real",
      fetchImpl: (async () => {
        throw new Error("should not call without invoke");
      }) as typeof fetch,
    });
    expect(prodSel.ok).toBe(true);
    expect(prodSel.kind).toBe("http");
    expect(prodSel.transport?.isMock).toBe(false);

    const missing = loadProductionConfig(
      prodEnv({ LESSON_VISUALS_PROVIDER_API_KEY: "", LESSON_VISUALS_PROVIDER_ENDPOINT: "" }),
    );
    expect(missing.ok).toBe(false);
  });

  it("missing endpoint/key fails before transport invoke; successful mocked HTTP validates", async () => {
    const prod = loadProductionConfig(prodEnv());
    expect(prod.ok).toBe(true);
    let fetchCalls = 0;
    const png = encodeSolidPng(64, 36, [9, 8, 7]);
    const checksum = sha256Hex(png);
    const request: ProviderGenerationRequest = {
      schemaVersion: "lesson-visual-provider-request/v1",
      runId: "run-1",
      controlRoomAuthorizationId: "CR-1",
      contentSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      executionSha: EXECUTION_SHA,
      approvedManifestSha256: "a".repeat(64),
      cellId: "intro-m1-l1-what-is-ai__en",
      lessonId: "intro-m1-l1-what-is-ai",
      locale: "en",
      method: 1,
      promptOrRenderingSpec: "x",
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
      budgetAllocationMicros: "1000",
      maxCostMicros: "1000",
      expectedProviderAccountId: "acct-test",
      expectedProviderProjectId: "proj-test",
      expectedProviderAuthId: "auth-test",
    };

    const transport = createHttpProvider({
      endpoint: "https://provider.example.invalid/v1/generate",
      apiKey: "test-key-not-real",
      timeoutMs: 5000,
      expectedProviderName: "mock-provider",
      expectedModel: "mock-renderer-v1",
      expectedAccountId: "acct-test",
      expectedProjectId: "proj-test",
      expectedAuthId: "auth-test",
      fetchImpl: (async () => {
        fetchCalls += 1;
        const body: ProviderGenerationResponse = {
          schemaVersion: "lesson-visual-provider-response/v1",
          providerName: "mock-provider",
          providerRequestId: "req-1",
          modelOrRenderer: "mock-renderer-v1",
          providerAccountId: "acct-test",
          providerProjectId: "proj-test",
          providerAuthId: "auth-test",
          outputBytesBase64: png.toString("base64"),
          secureByteReference: null,
          mimeType: "image/png",
          width: 64,
          height: 36,
          byteLength: png.length,
          providerReportedCostMicros: "1000",
          generationTimestamp: "2026-07-21T00:00:00.000Z",
          providerMetadata: {},
          rightsProvenance: buildGreenfieldRights({
            method: 1,
            providerName: "mock-provider",
            model: "mock-renderer-v1",
            providerRequestId: "req-1",
            generatedAt: "2026-07-21T00:00:00.000Z",
            cellId: request.cellId,
            contentSha: request.contentSha,
            executionSha: request.executionSha,
            approvedManifestSha256: request.approvedManifestSha256,
            outputContentSha256: checksum,
          }),
          contentChecksumSha256: checksum,
          cellId: request.cellId,
          lessonId: request.lessonId,
          locale: request.locale,
          method: request.method,
          runId: request.runId,
          controlRoomAuthorizationId: request.controlRoomAuthorizationId,
          contentSha: request.contentSha,
          executionSha: request.executionSha,
          approvedManifestSha256: request.approvedManifestSha256,
          idempotencyKey: request.idempotencyKey,
          attemptNumber: request.attemptNumber,
        };
        return new Response(JSON.stringify(body), { status: 200 });
      }) as typeof fetch,
    });

    const ok = await transport.generate(request);
    expect(ok.providerRequestId).toBe("req-1");
    expect(fetchCalls).toBe(1);

    const timeoutTransport = createHttpProvider({
      endpoint: "https://provider.example.invalid/v1/generate",
      apiKey: "test-key-not-real",
      timeoutMs: 10,
      expectedProviderName: "mock-provider",
      expectedModel: "mock-renderer-v1",
      expectedAccountId: "acct-test",
      expectedProjectId: "proj-test",
      expectedAuthId: "auth-test",
      fetchImpl: (async (_url, init) => {
        await new Promise((_, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
        return new Response("", { status: 200 });
      }) as typeof fetch,
    });
    await expect(timeoutTransport.generate(request)).rejects.toThrow(/timed out/);

    const httpFail = createHttpProvider({
      endpoint: "https://provider.example.invalid/v1/generate",
      apiKey: "test-key-not-real",
      timeoutMs: 5000,
      expectedProviderName: "mock-provider",
      expectedModel: "mock-renderer-v1",
      expectedAccountId: "acct-test",
      expectedProjectId: "proj-test",
      expectedAuthId: "auth-test",
      fetchImpl: (async () => new Response("nope", { status: 500 })) as typeof fetch,
    });
    await expect(httpFail.generate(request)).rejects.toThrow(/HTTP 500/);

    const malformed = createHttpProvider({
      endpoint: "https://provider.example.invalid/v1/generate",
      apiKey: "test-key-not-real",
      timeoutMs: 5000,
      expectedProviderName: "mock-provider",
      expectedModel: "mock-renderer-v1",
      expectedAccountId: "acct-test",
      expectedProjectId: "proj-test",
      expectedAuthId: "auth-test",
      fetchImpl: (async () => new Response("not-json", { status: 200 })) as typeof fetch,
    });
    await expect(malformed.generate(request)).rejects.toThrow(/not valid JSON/);

    const missingId = createHttpProvider({
      endpoint: "https://provider.example.invalid/v1/generate",
      apiKey: "secret-should-not-leak",
      timeoutMs: 5000,
      expectedProviderName: "mock-provider",
      expectedModel: "mock-renderer-v1",
      expectedAccountId: "acct-test",
      expectedProjectId: "proj-test",
      expectedAuthId: "auth-test",
      fetchImpl: (async () =>
        new Response(
          JSON.stringify({
            schemaVersion: "lesson-visual-provider-response/v1",
            providerName: "mock-provider",
            providerRequestId: "",
          }),
          { status: 200 },
        )) as typeof fetch,
    });
    await expect(missingId.generate(request)).rejects.toThrow(/request ID/);
    try {
      await missingId.generate(request);
    } catch (e) {
      expect(String(e)).not.toContain("secret-should-not-leak");
    }
  });

  it("identity mismatch and empty output fail closed", async () => {
    const request: ProviderGenerationRequest = {
      schemaVersion: "lesson-visual-provider-request/v1",
      runId: "run-1",
      controlRoomAuthorizationId: "CR-1",
      contentSha: AUTHORITATIVE_BASE_SOURCE_SHA,
      executionSha: EXECUTION_SHA,
      approvedManifestSha256: "a".repeat(64),
      cellId: "intro-m1-l1-what-is-ai__en",
      lessonId: "intro-m1-l1-what-is-ai",
      locale: "en",
      method: 1,
      promptOrRenderingSpec: "x",
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
      budgetAllocationMicros: "1000",
      maxCostMicros: "1000",
      expectedProviderAccountId: "acct-test",
      expectedProviderProjectId: "proj-test",
      expectedProviderAuthId: "auth-test",
    };

    const wrongAccount = createHttpProvider({
      endpoint: "https://provider.example.invalid/v1/generate",
      apiKey: "test-key-not-real",
      timeoutMs: 5000,
      expectedProviderName: "mock-provider",
      expectedModel: "mock-renderer-v1",
      expectedAccountId: "acct-test",
      expectedProjectId: "proj-test",
      expectedAuthId: "auth-test",
      fetchImpl: (async () =>
        new Response(
          JSON.stringify({
            schemaVersion: "lesson-visual-provider-response/v1",
            providerName: "mock-provider",
            providerRequestId: "r1",
            modelOrRenderer: "mock-renderer-v1",
            providerAccountId: "wrong",
            providerProjectId: "proj-test",
            providerAuthId: "auth-test",
            outputBytesBase64: "YQ==",
            secureByteReference: null,
            mimeType: "image/png",
            width: 64,
            height: 36,
            byteLength: 1,
            providerReportedCostMicros: "1",
            generationTimestamp: "2026-07-21T00:00:00.000Z",
            providerMetadata: {},
            rightsProvenance: {},
            contentChecksumSha256: "a".repeat(64),
            cellId: request.cellId,
            lessonId: request.lessonId,
            locale: request.locale,
            method: request.method,
            runId: request.runId,
            controlRoomAuthorizationId: request.controlRoomAuthorizationId,
            contentSha: request.contentSha,
            executionSha: request.executionSha,
            approvedManifestSha256: request.approvedManifestSha256,
            idempotencyKey: request.idempotencyKey,
            attemptNumber: request.attemptNumber,
          }),
          { status: 200 },
        )) as typeof fetch,
    });
    await expect(wrongAccount.generate(request)).rejects.toThrow(/account mismatch/);

    const empty = createHttpProvider({
      endpoint: "https://provider.example.invalid/v1/generate",
      apiKey: "test-key-not-real",
      timeoutMs: 5000,
      expectedProviderName: "mock-provider",
      expectedModel: "mock-renderer-v1",
      expectedAccountId: "acct-test",
      expectedProjectId: "proj-test",
      expectedAuthId: "auth-test",
      fetchImpl: (async () =>
        new Response(
          JSON.stringify({
            schemaVersion: "lesson-visual-provider-response/v1",
            providerName: "mock-provider",
            providerRequestId: "r1",
            modelOrRenderer: "mock-renderer-v1",
            providerAccountId: "acct-test",
            providerProjectId: "proj-test",
            providerAuthId: "auth-test",
            outputBytesBase64: "",
            secureByteReference: null,
            mimeType: "image/png",
            width: 64,
            height: 36,
            byteLength: 0,
            providerReportedCostMicros: "1",
            generationTimestamp: "2026-07-21T00:00:00.000Z",
            providerMetadata: {},
            rightsProvenance: {},
            contentChecksumSha256: "a".repeat(64),
            cellId: request.cellId,
            lessonId: request.lessonId,
            locale: request.locale,
            method: request.method,
            runId: request.runId,
            controlRoomAuthorizationId: request.controlRoomAuthorizationId,
            contentSha: request.contentSha,
            executionSha: request.executionSha,
            approvedManifestSha256: request.approvedManifestSha256,
            idempotencyKey: request.idempotencyKey,
            attemptNumber: request.attemptNumber,
          }),
          { status: 200 },
        )) as typeof fetch,
    });
    await expect(empty.generate(request)).rejects.toThrow(/empty output|missing image/);
  });
});

describe("GitHub Actions matrix output delimiter safety", () => {
  const workflowPath = resolve(
    repoRoot,
    ".github/workflows/lesson-driven-400-visual-pipeline.yml",
  );

  function writeGithubOutputLine(key: string, jsonBody: string): string {
    // Mirrors workflow: printf 'key=%s\n' "$(cat file)" >> "$GITHUB_OUTPUT"
    return `${key}=${jsonBody}\n`;
  }

  function parseGithubOutput(raw: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const line of raw.split("\n")) {
      if (!line) continue;
      const eq = line.indexOf("=");
      expect(eq).toBeGreaterThan(0);
      out[line.slice(0, eq)] = line.slice(eq + 1);
    }
    return out;
  }

  it("writes newline-free compact JSON as valid single-line GITHUB_OUTPUT for all_cell_ids_json and matrix", () => {
    const allCellIds = JSON.stringify(["a__en", "b__en"]);
    const matrix = JSON.stringify([{ cellId: "a__en", lessonId: "a", locale: "en", method: 1 }]);
    expect(allCellIds.includes("\n")).toBe(false);
    expect(matrix.includes("\n")).toBe(false);
    expect(allCellIds.endsWith("\n")).toBe(false);
    expect(matrix.endsWith("\n")).toBe(false);

    const githubOutput =
      writeGithubOutputLine("all_cell_ids_json", allCellIds) +
      writeGithubOutputLine("matrix", matrix);

    // Broken <<EOF pattern would concatenate: ...json]EOF with no standalone delimiter line.
    expect(githubOutput.includes("<<EOF")).toBe(false);
    expect(githubOutput.split("\n").some((l) => l === "EOF")).toBe(false);

    const parsed = parseGithubOutput(githubOutput);
    expect(JSON.parse(parsed.all_cell_ids_json)).toEqual(["a__en", "b__en"]);
    expect(JSON.parse(parsed.matrix)).toEqual([
      { cellId: "a__en", lessonId: "a", locale: "en", method: 1 },
    ]);
  });

  it("workflow no longer uses <<EOF for all_cell_ids_json or matrix; uses printf instead", () => {
    const yaml = readFileSync(workflowPath, "utf8");
    expect(yaml).not.toMatch(/all_cell_ids_json<<EOF/);
    expect(yaml).not.toMatch(/matrix<<EOF/);
    expect(yaml).toMatch(
      /printf 'all_cell_ids_json=%s\\n' "\$\(cat all-cell-ids\.json\)" >> "\$GITHUB_OUTPUT"/,
    );
    expect(yaml).toMatch(/printf 'matrix=%s\\n' "\$\(cat matrix\.json\)" >> "\$GITHUB_OUTPUT"/);
  });
});
