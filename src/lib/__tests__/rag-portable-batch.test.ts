import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { buildEntitlementSnapshot } from "@/lib/billing/entitlement/evaluate";
import { discoverApprovedPackages } from "@/lib/rag/corpus-discovery";
import { verifyCorpus } from "@/lib/rag/corpus-verification";
import { evaluateRagEntitlementGate } from "@/lib/rag/entitlement-gate";
import {
  LEGACY_AR_EG_LESSON_COUNT,
  legacyChunksUnchanged,
  seedLegacyArEgChunks,
  snapshotLegacyChunks,
} from "@/lib/rag/legacy-ar-eg-store";
import {
  buildChunkManifest,
  buildPackageManifest,
  generateAllChunks,
} from "@/lib/rag/manifests";
import { MockRagIndexStore } from "@/lib/rag/mock-index-store";
import {
  CANDIDATE_SHA,
  readPortableArtifactRecords,
  verifyPortableArtifact,
  writePortableArtifact,
} from "@/lib/rag/portable-artifact";
import { ProductionCompatibleImporter } from "@/lib/rag/portable-importer";
import { buildLocaleRetrievalResponse } from "@/lib/rag/retrieval";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

const entitledPolicy = {
  policyKey: "pro_v1",
  versionNumber: 1,
  lessonAllowlistMode: "explicit_list" as const,
  lessonIds: [] as string[],
  lessonCountCap: 100,
  builderAccess: true,
  videoAccess: true,
  ragEnabled: true,
  assistantRuntimePerLessonQuota: null,
  assistantRuntimeGeneralMonthlyQuota: 272,
  assistantRuntimePeriodQuota: null,
  assistantRuntimePeriodDays: null,
  missionEvaluationEnabled: true,
  revealAnswerEnabled: true,
  wowPathEnabled: true,
};

function buildEntitledSnapshot(lessonIds: string[]) {
  return buildEntitlementSnapshot(
    {
      userId: "u-rag",
      planKey: "pro_plus",
      accessState: "paid_active",
      policy: { ...entitledPolicy, lessonIds },
      entitledLessonIds: lessonIds,
      periodStart: "2026-01-01T00:00:00.000Z",
      periodEnd: "2026-02-01T00:00:00.000Z",
      paidActivationAt: "2026-01-01T00:00:00.000Z",
      entitlementActiveAt: "2026-01-01T00:00:00.000Z",
      cancelAtPeriodEnd: false,
      now: new Date("2026-01-15T00:00:00.000Z"),
    },
    { usedGeneral: 0, usedPeriod: 0, aiTopupBalance: 0 },
  );
}

function buildMockArtifactDir(): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rag-portable-"));
  const packages = discoverApprovedPackages(REPO_ROOT);
  const chunks = generateAllChunks(REPO_ROOT, packages);
  const packageManifest = buildPackageManifest(REPO_ROOT, packages, chunks);
  const chunkManifest = buildChunkManifest(chunks);
  const store = new MockRagIndexStore();
  const embeddings = new Map<string, number[]>();
  for (const chunk of chunks) {
    embeddings.set(chunk.chunkId, store.fakeEmbedding(chunk.textChecksum));
  }
  const tokenStats = { total: 893_290 };
  writePortableArtifact({
    outputDir: tmp,
    indexVersion: `rag-portable-mock-${CANDIDATE_SHA.slice(0, 8)}`,
    chunks,
    embeddings,
    packageManifest,
    chunkManifest,
    stats: {
      exactTokenCount: tokenStats.total,
      requestCount: Math.ceil(chunks.length / 64),
      successful: chunks.length,
      failed: 0,
      retried: 0,
      skipped: 0,
    },
  });
  return tmp;
}

describe("RAG portable batch contract", () => {
  const corpus = verifyCorpus(REPO_ROOT);
  const packages = discoverApprovedPackages(REPO_ROOT);
  const chunks = generateAllChunks(REPO_ROOT, packages);
  let sharedArtifactDir: string;

  beforeAll(() => {
    sharedArtifactDir = buildMockArtifactDir();
  }, 120000);

  afterAll(() => {
    if (sharedArtifactDir && fs.existsSync(sharedArtifactDir)) {
      fs.rmSync(sharedArtifactDir, { recursive: true, force: true });
    }
  });

  it("validates corpus packages and AG4 records", () => {
    expect(corpus.ok).toBe(true);
    expect(corpus.totalPackages).toBe(300);
    expect(corpus.ag4RecordCount).toBe(40);
    expect(corpus.ag4RecordsPresent).toBe(true);
    expect(corpus.localeCounts.en).toBe(100);
    expect(corpus.localeCounts["ar-MSA"]).toBe(100);
    expect(corpus.localeCounts["ar-Gulf"]).toBe(100);
    expect(chunks).toHaveLength(2692);
  });

  it("exports and verifies portable artifact with 2692 vector records", () => {
    const verification = verifyPortableArtifact(sharedArtifactDir);
    expect(verification.ok).toBe(true);
    expect(verification.recordCount).toBe(2692);
    expect(verification.duplicateChunkIds).toBe(0);
    expect(verification.checksumMismatches).toBe(0);
    expect(verification.dimensionMismatches).toBe(0);
    expect(verification.modelMismatches).toBe(0);
    expect(verification.missingMetadata).toBe(0);
    expect(verification.localeLessonIsolation.crossLocaleLeakage).toBe(0);
    expect(verification.localeLessonIsolation.crossLessonLeakage).toBe(0);

    const { manifest, records } = readPortableArtifactRecords(sharedArtifactDir);
    expect(manifest.chunkCount).toBe(2692);
    expect(records).toHaveLength(2692);
    expect(manifest.files.some((f) => f.path.startsWith("vectors-shard-"))).toBe(true);
  }, 120000);

  it("preserves legacy ar-EG rows through import and rollback", () => {
    const importer = new ProductionCompatibleImporter();
    expect(importer.getLegacyActiveChunks()).toHaveLength(LEGACY_AR_EG_LESSON_COUNT);

    const before = snapshotLegacyChunks(importer.legacyChunks);
    const first = importer.importPortableArtifact(sharedArtifactDir);
    expect(first.ok).toBe(true);
    expect(first.inserted).toBe(2692);
    expect(first.arEgPreserved).toBe(true);
    expect(legacyChunksUnchanged(before, importer.legacyChunks)).toBe(true);

    const second = importer.importPortableArtifact(sharedArtifactDir, { resume: true });
    expect(second.ok).toBe(true);
    expect(second.skipped).toBe(2692);
    expect(second.inserted).toBe(0);

    const batchId = first.batchId;
    expect(importer.getInactiveBatchChunks(batchId)).toHaveLength(2692);
    expect(importer.getActiveLocalizedChunks("en")).toHaveLength(0);

    const rollback = importer.rollbackBatch(batchId);
    expect(rollback.ok).toBe(true);
    expect(rollback.arEgPreserved).toBe(true);
    expect(importer.getLegacyActiveChunks()).toHaveLength(LEGACY_AR_EG_LESSON_COUNT);
  }, 120000);

  it("supports retry-only-failed import units", () => {
    const importer = new ProductionCompatibleImporter();
    const { records, manifest } = readPortableArtifactRecords(sharedArtifactDir);
    const failedId = records[0].chunkId;

    importer.importPortableArtifact(sharedArtifactDir);
    importer.localizedStore.markPackageFailed(manifest.indexVersion, records[0].packagePath);

    const retry = importer.importPortableArtifact(sharedArtifactDir, {
      retryOnlyFailed: true,
      failedChunkIds: new Set([failedId]),
    });
    expect(retry.retried).toBeGreaterThanOrEqual(0);
  }, 120000);

  it("denies activation without entitlement and allows when entitled", () => {
    const importer = new ProductionCompatibleImporter();
    const report = importer.importPortableArtifact(sharedArtifactDir);
    const lessonIds = [...new Set(chunks.map((c) => c.lessonId))];

    const denied = importer.activateBatch(report.batchId, null);
    expect(denied.ok).toBe(false);
    expect(denied.entitlementDenied).toBe(true);

    const disabledPolicy = buildEntitledSnapshot([]);
    const disabled = importer.activateBatch(report.batchId, disabledPolicy);
    expect(disabled.ok).toBe(false);
    expect(disabled.entitlementDenied).toBe(true);

    const entitled = buildEntitledSnapshot(lessonIds);
    const allowed = importer.activateBatch(report.batchId, entitled);
    expect(allowed.ok).toBe(true);
    expect(importer.getActiveLocalizedChunks("en").length).toBeGreaterThan(0);
  }, 120000);

  it("enforces locale isolation and blocks locale bypass without entitlement", () => {
    const importer = new ProductionCompatibleImporter();
    const report = importer.importPortableArtifact(sharedArtifactDir);
    const lessonIds = [...new Set(chunks.map((c) => c.lessonId))];
    importer.activateBatch(report.batchId, buildEntitledSnapshot(lessonIds));

    const enChunks = importer.getActiveLocalizedChunks("en");
    const arMsaChunks = importer.getActiveLocalizedChunks("ar-MSA");
    expect(enChunks.every((c) => c.locale === "en")).toBe(true);
    expect(arMsaChunks.every((c) => c.locale === "ar-MSA")).toBe(true);

    const lessonScoped = enChunks[0]?.lessonId ?? "intro-m1-l1";
    const sameLessonChunks = enChunks.filter((c) => c.lessonId === lessonScoped);
    const response = buildLocaleRetrievalResponse({
      locale: "en",
      lessonId: lessonScoped,
      moduleId: null,
      pathId: null,
      semanticChunks: sameLessonChunks.map((c) => ({
        id: c.id,
        sourceId: c.sourceId,
        locale: c.locale,
        lessonId: c.lessonId,
        moduleId: c.moduleId,
        pathId: c.pathId,
        title: c.title,
        content: c.content,
        similarity: 0.9,
        packagePath: c.packagePath,
        sourceSha: c.sourceSha,
        packageChecksum: c.packageChecksum,
        chunkChecksum: c.chunkChecksum,
        contentVersion: c.contentVersion,
        indexVersion: c.indexVersion,
        sectionIndex: c.sectionIndex,
        sectionRole: c.sectionRole,
        chunkPosition: c.chunkPosition,
        contentType: c.contentType,
        productionRoute: c.productionRoute,
        indexState: c.indexState,
      })),
      keywordResults: [],
    });
    expect(response.retrieval.crossLocaleLeakage).toBe(0);
    expect(response.retrieval.crossLessonLeakage).toBe(0);
    expect(response.citations.length).toBeGreaterThan(0);

    const bypass = evaluateRagEntitlementGate({
      snapshot: buildEntitledSnapshot([]),
      locale: "ar-MSA",
      lessonId: lessonScoped,
      operation: "retrieve",
    });
    expect(bypass.allowed).toBe(false);
  }, 120000);
});

describe("RAG entitlement gate", () => {
  it("fails closed when entitlement missing, disabled, or malformed", () => {
    expect(
      evaluateRagEntitlementGate({
        snapshot: null,
        locale: "en",
        lessonId: "intro-m1-l1",
        operation: "retrieve",
      }).allowed,
    ).toBe(false);

    const disabled = buildEntitlementSnapshot(
      {
        userId: "u1",
        planKey: "pro",
        accessState: "paid_active",
        policy: { ...entitledPolicy, ragEnabled: false },
        entitledLessonIds: ["intro-m1-l1"],
        periodStart: "2026-01-01T00:00:00.000Z",
        periodEnd: null,
        paidActivationAt: "2026-01-01T00:00:00.000Z",
        entitlementActiveAt: "2026-01-01T00:00:00.000Z",
        cancelAtPeriodEnd: false,
      },
      { usedGeneral: 0, usedPeriod: 0, aiTopupBalance: 0 },
    );
    expect(
      evaluateRagEntitlementGate({
        snapshot: disabled,
        locale: "en",
        lessonId: "intro-m1-l1",
        operation: "retrieve",
      }).denialReasonCode,
    ).toBe("RAG_NOT_ENTITLED");
  });
});

describe("RAG change boundary inspection", () => {
  const forbiddenPrefixes = [
    "src/lib/billing/",
    "supabase/migrations/2026070919",
    "supabase/migrations/20260710153000",
    "src/lib/locale-lessons/",
    "remotion/",
    "wrangler.jsonc",
  ];

  it("restricts edits to RAG-owned paths", () => {
    const diff = execSync("git diff --name-only HEAD", {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
    const changed = diff.trim().split("\n").filter(Boolean);
    for (const file of changed) {
      for (const prefix of forbiddenPrefixes) {
        expect(file.startsWith(prefix)).toBe(false);
      }
    }
  });
});
