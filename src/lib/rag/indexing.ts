import path from "node:path";
import { discoverApprovedPackages } from "./corpus-discovery";
import {
  generateAllChunks,
  buildChunkManifest,
  buildPackageManifest,
} from "./manifests";
import { MockRagIndexStore, defaultVersionKey } from "./mock-index-store";
import { planReindex } from "./reindex-planning";
import type { RagChunkRecord } from "./types";

export interface MockIndexingReport {
  versionKey: string;
  packageCount: number;
  chunkCount: number;
  inserted: number;
  skipped: number;
  retried: number;
  activationOk: boolean;
  rollbackOk: boolean;
  activeVersionKey: string | null;
  supersededCleanupIds: string[];
  singleActiveEnforced: boolean;
  failedActivationDenied: boolean;
}

function retryFailedPackage(
  store: MockRagIndexStore,
  versionKey: string,
  packagePath: string,
  chunks: RagChunkRecord[],
  opts: {
    packageChecksums: Map<string, string>;
    contentVersions: Map<string, string | null>;
  },
): void {
  const failedChunks = chunks.filter((c) => c.packagePath === packagePath);
  store.insertChunksIdempotent(versionKey, failedChunks, {
    ...opts,
    retryOnlyFailed: true,
    failedPackagePaths: new Set([packagePath]),
  });
}

/** Full local mock indexing + activation + rollback flow. */
export function runMockIndexingFlow(
  repoRoot: string,
  chunks?: RagChunkRecord[],
  options?: {
    versionKey?: string;
    simulateFailedPackage?: string;
  },
): MockIndexingReport {
  const packages = discoverApprovedPackages(repoRoot);
  const allChunks = chunks ?? generateAllChunks(repoRoot, packages);
  const chunkManifest = buildChunkManifest(allChunks);
  const packageManifest = buildPackageManifest(repoRoot, packages, allChunks);

  const store = new MockRagIndexStore();
  const versionKey = options?.versionKey ?? defaultVersionKey();

  store.createStagingVersion({
    versionKey,
    packageCount: packages.length,
    chunkCount: allChunks.length,
    chunkManifestChecksum: chunkManifest.manifestChecksum,
  });

  const pkgChecksums = new Map(
    packageManifest.packages.map((p) => [p.packagePath, p.packageChecksum]),
  );
  const contentVersions = new Map(
    packageManifest.packages.map((p) => [p.packagePath, p.canonicalVersion]),
  );

  const firstInsert = store.insertChunksIdempotent(versionKey, allChunks, {
    packageChecksums: pkgChecksums,
    contentVersions,
  });

  const secondInsert = store.insertChunksIdempotent(versionKey, allChunks, {
    packageChecksums: pkgChecksums,
    contentVersions,
  });

  let activationOk = false;
  let failedActivationDenied = false;

  if (options?.simulateFailedPackage) {
    store.markPackageFailed(versionKey, options.simulateFailedPackage);
    failedActivationDenied = !store.activateVersion(versionKey).ok;
    retryFailedPackage(store, versionKey, options.simulateFailedPackage, allChunks, {
      packageChecksums: pkgChecksums,
      contentVersions,
    });
    activationOk = store.activateVersion(versionKey).ok;
  } else {
    activationOk = store.activateVersion(versionKey).ok;
  }

  const activeBeforeSecond = store.getActiveVersion()?.versionKey ?? null;

  const v2Key = `${versionKey}-v2`;
  store.createStagingVersion({
    versionKey: v2Key,
    packageCount: packages.length,
    chunkCount: allChunks.length,
    chunkManifestChecksum: chunkManifest.manifestChecksum,
  });
  store.insertChunksIdempotent(v2Key, allChunks, {
    packageChecksums: pkgChecksums,
    contentVersions,
  });
  store.activateVersion(v2Key);

  const rollbackTarget = activeBeforeSecond ?? versionKey;
  const rollbackOk = store.rollbackVersion(rollbackTarget).ok;

  const activeVersions = [...store.versions.values()].filter((v) => v.status === "active");

  return {
    versionKey,
    packageCount: packages.length,
    chunkCount: allChunks.length,
    inserted: firstInsert.inserted,
    skipped: secondInsert.skipped,
    retried: firstInsert.retried,
    activationOk,
    rollbackOk,
    activeVersionKey: store.getActiveVersion()?.versionKey ?? null,
    supersededCleanupIds: store.planSupersededCleanup(),
    singleActiveEnforced: activeVersions.length === 1,
    failedActivationDenied,
  };
}

/** Reindex planning wrapper for CLI. */
export function runReindexPlan(
  repoRoot: string,
  options?: { retryOnlyFailed?: boolean; failedUnits?: string[] },
) {
  const packages = discoverApprovedPackages(repoRoot);
  const chunks = generateAllChunks(repoRoot, packages);
  const current = buildPackageManifest(repoRoot, packages, chunks);
  return planReindex(current, current, {
    dryRun: true,
    retryOnlyFailed: options?.retryOnlyFailed,
    failedUnits: options?.failedUnits,
  });
}

export function resolveRepoRoot(): string {
  return path.resolve(import.meta.dirname, "../../..");
}
