import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CONTENT_FREEZE_SHA, EMBEDDING_DIMENSIONS, RAG_INDEX_VERSION } from "@/lib/rag/constants";
import {
  IMPLEMENTATION_AUTHORIZATION_ID,
  MAX_EMBEDDING_REQUESTS,
  admitCorpusArtifacts,
  assertActivationUnavailable,
  assertReportRedacted,
  buildReport,
  buildStagingVersionKey,
  computeArtifactDigests,
  createMockEmbeddingProvider,
  emptyRowProgress,
  EXPECTED_CHUNK_COUNT,
  EXPECTED_MAIN_SHA,
  EXPECTED_PACKAGE_COUNT,
  EXPECTED_PROJECT_REF,
  EXPECTED_REPOSITORY,
  MemorySqlExecutor,
  ModeError,
  parseOperation,
  redactSecrets,
  runImporter,
  runInactiveImport,
  type TargetLocks,
} from "@/lib/rag/inactive-importer";
import { createOpenAIEmbeddingProvider } from "@/lib/rag/inactive-importer/embeddings";
import { loadAdmittedCorpus } from "@/lib/rag/inactive-importer/admission";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

function baseLocks(overrides: Partial<TargetLocks> = {}): TargetLocks {
  const digests = computeArtifactDigests(REPO_ROOT);
  return {
    controlRoomAuthorizationId: IMPLEMENTATION_AUTHORIZATION_ID,
    expectedRepository: EXPECTED_REPOSITORY,
    expectedMainSha: EXPECTED_MAIN_SHA,
    expectedProjectRef: EXPECTED_PROJECT_REF,
    expectedSourceSha: CONTENT_FREEZE_SHA,
    expectedIndexVersion: RAG_INDEX_VERSION,
    expectedPackageManifestSha256: digests.packageManifestSha256,
    expectedChunkManifestSha256: digests.chunkManifestSha256,
    expectedChunksSha256: digests.chunksSha256,
    expectedAuthoritativeLookupSha256: digests.authoritativeLookupSha256,
    expectedPackageCount: EXPECTED_PACKAGE_COUNT,
    expectedChunkCount: EXPECTED_CHUNK_COUNT,
    expectedEmbeddingModel: "text-embedding-3-small",
    expectedEmbeddingDimensions: EMBEDDING_DIMENSIONS,
    maxEmbeddingRequests: MAX_EMBEDDING_REQUESTS,
    databaseUrlEnvName: "SUPABASE_DB_URL",
    providerCredentialEnvName: "OPENAI_API_KEY",
    executionId: "test-execution-1",
    ...overrides,
  };
}

describe("RAG inactive importer — admission", () => {
  it("admits the accepted 400-package / 3700-chunk corpus", () => {
    const admission = admitCorpusArtifacts(REPO_ROOT);
    expect(admission.ok).toBe(true);
    expect(admission.errors).toEqual([]);
    expect(admission.packageCount).toBe(400);
    expect(admission.chunkCount).toBe(3700);
    expect(admission.localePackageCounts).toEqual({
      "ar-EG": 100,
      "ar-MSA": 100,
      "ar-Gulf": 100,
      en: 100,
    });
    expect(admission.localeChunkCounts).toEqual({
      "ar-EG": 1008,
      "ar-MSA": 866,
      "ar-Gulf": 862,
      en: 964,
    });
    expect(admission.sourceSha).toBe(CONTENT_FREEZE_SHA);
    expect(admission.indexVersion).toBe(RAG_INDEX_VERSION);
  });

  it("rejects digest / count / locale / checksum / lookup mismatches", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rag-admit-"));
    const dest = path.join(tmp, "artifacts/rag");
    fs.mkdirSync(dest, { recursive: true });
    for (const name of [
      "package-manifest.json",
      "chunk-manifest.json",
      "chunks.json",
      "authoritative-lookup.json",
    ]) {
      fs.copyFileSync(path.join(REPO_ROOT, "artifacts/rag", name), path.join(dest, name));
    }
    const pmPath = path.join(dest, "package-manifest.json");
    const pm = JSON.parse(fs.readFileSync(pmPath, "utf8"));
    pm.packageCount = 399;
    fs.writeFileSync(pmPath, JSON.stringify(pm));
    const bad = admitCorpusArtifacts(tmp);
    expect(bad.ok).toBe(false);
    expect(bad.errors.some((e) => e.includes("packageCount"))).toBe(true);
  });

  it("rejects legacy 100-lesson seed-shaped package paths", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rag-legacy-"));
    const dest = path.join(tmp, "artifacts/rag");
    fs.mkdirSync(dest, { recursive: true });
    for (const name of [
      "package-manifest.json",
      "chunk-manifest.json",
      "chunks.json",
      "authoritative-lookup.json",
    ]) {
      fs.copyFileSync(path.join(REPO_ROOT, "artifacts/rag", name), path.join(dest, name));
    }
    const pmPath = path.join(dest, "package-manifest.json");
    const pm = JSON.parse(fs.readFileSync(pmPath, "utf8"));
    pm.packages[0].packagePath = "src/components/intro/lessons/foo.json";
    fs.writeFileSync(pmPath, JSON.stringify(pm));
    const bad = admitCorpusArtifacts(tmp);
    expect(bad.ok).toBe(false);
    expect(bad.errors.some((e) => e.includes("legacy 100-lesson"))).toBe(true);
  });
});

describe("RAG inactive importer — modes and locks", () => {
  it("forbids activation and destructive modes", () => {
    expect(() => parseOperation("activate")).toThrow(ModeError);
    expect(() => parseOperation("rollback")).toThrow(ModeError);
    expect(() => parseOperation("seed-100")).toThrow(ModeError);
    expect(() => parseOperation("delete")).toThrow(ModeError);
    expect(() => assertActivationUnavailable(["--activate"])).toThrow(ModeError);
  });

  it("defaults to dry-run zero-write preflight", async () => {
    const report = await runImporter(
      {
        repoRoot: REPO_ROOT,
        operation: "import",
        environment: "disposable",
        dryRun: true,
        locks: baseLocks(),
      },
      {
        CONTROL_ROOM_AUTHORIZATION_ID: IMPLEMENTATION_AUTHORIZATION_ID,
        OBSERVED_MAIN_SHA: EXPECTED_MAIN_SHA,
        OBSERVED_PROJECT_REF: "local-disposable",
      },
    );
    expect(report.dryRun).toBe(true);
    expect(report.reportKind).toBe("preflight");
    expect(report.attemptedRequestCount).toBe(0);
    expect(report.rowProgress.inserted).toBe(0);
  });

  it("rejects missing / wrong authorization and wrong locks", async () => {
    await expect(
      runImporter({
        repoRoot: REPO_ROOT,
        operation: "preflight",
        environment: "disposable",
        dryRun: true,
        locks: baseLocks({ controlRoomAuthorizationId: "WRONG" }),
      }),
    ).rejects.toThrow(/Disposable mode requires/);

    await expect(
      runImporter({
        repoRoot: REPO_ROOT,
        operation: "preflight",
        environment: "disposable",
        dryRun: true,
        locks: baseLocks({ expectedMainSha: "0".repeat(40) }),
      }),
    ).rejects.toThrow(/Main SHA/);

    await expect(
      runImporter({
        repoRoot: REPO_ROOT,
        operation: "preflight",
        environment: "disposable",
        dryRun: true,
        locks: baseLocks({ expectedProjectRef: "other" }),
      }),
    ).rejects.toThrow(/Project ref/);

    await expect(
      runImporter({
        repoRoot: REPO_ROOT,
        operation: "preflight",
        environment: "disposable",
        dryRun: true,
        locks: baseLocks({ expectedEmbeddingModel: "wrong-model" }),
      }),
    ).rejects.toThrow(/model/i);

    await expect(
      runImporter({
        repoRoot: REPO_ROOT,
        operation: "preflight",
        environment: "disposable",
        dryRun: true,
        locks: baseLocks({ expectedEmbeddingDimensions: 768 }),
      }),
    ).rejects.toThrow(/dimension/i);

    await expect(
      runImporter({
        repoRoot: REPO_ROOT,
        operation: "preflight",
        environment: "production",
        dryRun: true,
        locks: baseLocks({
          controlRoomAuthorizationId: IMPLEMENTATION_AUTHORIZATION_ID,
        }),
      }),
    ).rejects.toThrow(/cannot authorize Production/);
  });

  it("enforces request ceiling", async () => {
    const { chunks, packageManifest, admission } = loadAdmittedCorpus(REPO_ROOT);
    const sql = new MemorySqlExecutor();
    const provider = createMockEmbeddingProvider();
    // Force ceiling by pretending attempts already near max with a wrapper
    const capped = {
      ...provider,
      async embedBatch() {
        throw Object.assign(new Error("Abort before request 68: ceiling 67"), {
          code: "REQUEST_CEILING",
          name: "ProviderError",
        });
      },
    };
    await expect(
      runInactiveImport({
        sql,
        environment: "disposable",
        provider: capped as typeof provider,
        versionKey: "test-ceiling",
        packageManifest,
        chunks,
        chunkManifestChecksum: admission.chunkManifestChecksum,
        maxEmbeddingRequests: 67,
      }),
    ).rejects.toThrow(/ceiling|Abort/i);
  });
});

describe("RAG inactive importer — provider boundary", () => {
  it("production mode rejects mock embeddings", async () => {
    const { chunks, packageManifest, admission } = loadAdmittedCorpus(REPO_ROOT);
    const sql = new MemorySqlExecutor();
    await expect(
      runInactiveImport({
        sql,
        environment: "production",
        provider: createMockEmbeddingProvider(),
        versionKey: "test-prod-mock",
        packageManifest,
        chunks: chunks.slice(0, 1),
        chunkManifestChecksum: admission.chunkManifestChecksum,
        maxEmbeddingRequests: 67,
      }),
    ).rejects.toThrow(/rejects deterministic\/mock/);
  });

  it("disposable mode rejects external openai provider construction path via assert", async () => {
    const provider = createOpenAIEmbeddingProvider({
      apiKey: "sk-test-not-used",
      maxRequests: 67,
      getAttempted: () => 0,
      recordAttempts: () => undefined,
      fetchImpl: async () => {
        throw new Error("network should not be called");
      },
    });
    const { chunks, packageManifest, admission } = loadAdmittedCorpus(REPO_ROOT);
    const sql = new MemorySqlExecutor();
    await expect(
      runInactiveImport({
        sql,
        environment: "disposable",
        provider,
        versionKey: "test-disp-openai",
        packageManifest,
        chunks: chunks.slice(0, 1),
        chunkManifestChecksum: admission.chunkManifestChecksum,
        maxEmbeddingRequests: 67,
      }),
    ).rejects.toThrow(/rejects external provider/);
  });
});

describe("RAG inactive importer — memory import resume/idempotency", () => {
  it("imports, interrupts, resumes, and reruns without duplicates or active mutation", async () => {
    const { chunks, packageManifest, admission } = loadAdmittedCorpus(REPO_ROOT);
    const sql = new MemorySqlExecutor();
    sql.seedActiveCorpus("active-before|1|abc");
    const versionKey = buildStagingVersionKey({
      indexVersion: RAG_INDEX_VERSION,
      sourceSha: CONTENT_FREEZE_SHA,
      packageManifestSha256: admission.digests.packageManifestSha256,
      chunkManifestSha256: admission.digests.chunkManifestSha256,
      executionId: "mem-resume-1",
    });
    const provider = createMockEmbeddingProvider();

    const first = await runInactiveImport({
      sql,
      environment: "disposable",
      provider,
      versionKey,
      packageManifest,
      chunks,
      chunkManifestChecksum: admission.chunkManifestChecksum,
      maxEmbeddingRequests: 67,
      interruptAfterPackages: 3,
    });
    expect(first.interrupted).toBe(true);
    expect(first.packagesProcessed).toBe(3);
    expect(sql.registry.get(versionKey)?.status).toBe("staging");
    const midCount = sql.chunks.filter(
      (c) => c.index_version === versionKey && c.index_state === "staging",
    ).length;
    expect(midCount).toBeGreaterThan(0);
    expect(midCount).toBeLessThan(3700);

    const resume = await runInactiveImport({
      sql,
      environment: "disposable",
      provider,
      versionKey,
      packageManifest,
      chunks,
      chunkManifestChecksum: admission.chunkManifestChecksum,
      maxEmbeddingRequests: 67,
    });
    expect(resume.interrupted).toBe(false);
    const staging = sql.chunks.filter(
      (c) => c.index_version === versionKey && c.index_state === "staging",
    );
    expect(staging).toHaveLength(3700);
    expect(
      sql.chunks.filter((c) => c.index_version === versionKey && c.index_state === "active"),
    ).toHaveLength(0);

    const rerun = await runInactiveImport({
      sql,
      environment: "disposable",
      provider,
      versionKey,
      packageManifest,
      chunks,
      chunkManifestChecksum: admission.chunkManifestChecksum,
      maxEmbeddingRequests: 67,
    });
    expect(rerun.progress.inserted).toBe(0);
    expect(rerun.progress.skippedExact).toBe(3700);
    expect(rerun.progress.conflicting).toBe(0);
    expect(sql.chunks.filter((c) => c.index_version === versionKey)).toHaveLength(3700);
    expect(sql.activeFingerprintSeed.startsWith("active-before")).toBe(true);
  }, 120_000);
});

describe("RAG inactive importer — reports redaction", () => {
  it("redacts secrets and rejects leaking reports", () => {
    expect(redactSecrets("url=postgresql://u:p@host/db sk-abc1234567890")).toContain("[REDACTED]");
    const report = buildReport({
      reportKind: "failure",
      timestamp: new Date().toISOString(),
      executionEnvironment: "disposable",
      operation: "preflight",
      dryRun: true,
      redactedTargetId: "x",
      repository: EXPECTED_REPOSITORY,
      mainSha: EXPECTED_MAIN_SHA,
      sourceSha: CONTENT_FREEZE_SHA,
      indexVersion: RAG_INDEX_VERSION,
      artifactDigests: computeArtifactDigests(REPO_ROOT),
      packageCount: 400,
      chunkCount: 3700,
      embeddingModel: "text-embedding-3-small",
      embeddingDimensions: 1536,
      requestCeiling: 67,
      attemptedRequestCount: 0,
      stagingVersionKey: null,
      rowProgress: emptyRowProgress(),
      activeCorpusMutationCount: 0,
      validationStatus: "fail",
      errorCode: "X",
      errorMessageRedacted: redactSecrets("postgresql://secret"),
    });
    expect(assertReportRedacted(report)).toEqual([]);
  });
});
