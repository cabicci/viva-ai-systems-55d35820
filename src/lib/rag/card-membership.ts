import fs from "node:fs";
import path from "node:path";
import { CONTENT_FREEZE_SHA, RAG_ARTIFACTS_DIR, RAG_INDEX_VERSION } from "./constants";
import { buildAuthoritativeLookupFromManifests } from "./authoritative-manifest-lookup";
import type { ChunkManifest, PackageManifest } from "./types";

export interface CardMembershipRecord {
  locale: string;
  lessonId: string;
  trackId: string;
  moduleId: string;
  /** Exact lesson's station IDs observed in approved locale packages. */
  contextModuleIds: string[];
  packagePath: string;
  packageChecksum: string;
  productionRoute: string | null;
}

export interface CardMembershipJson {
  schemaVersion: "card-membership-v1";
  sourceSha: string;
  indexVersion: string;
  records: Record<string, CardMembershipRecord>;
}

/** An additive runtime map; frozen content lookup artifacts stay byte-identical. */
export function buildCardMembership(packages: PackageManifest, chunks: ChunkManifest): CardMembershipJson {
  buildAuthoritativeLookupFromManifests(packages, chunks);
  const byPath = new Map(packages.packages.map((pkg) => [pkg.packagePath, pkg]));
  const records = new Map<string, CardMembershipRecord>();
  const owners = new Map<string, string>();
  const stations = new Map<string, Set<string>>();
  for (const chunk of chunks.chunks) {
    const pkg = byPath.get(chunk.packagePath)!;
    if (!chunk.trackId || !chunk.moduleId || chunk.trackId !== pkg.trackId || chunk.moduleId !== pkg.moduleId) {
      throw new Error(`Card/station metadata mismatch: ${chunk.chunkId}`);
    }
    const previousOwner = owners.get(chunk.lessonId);
    if (previousOwner !== undefined && previousOwner !== chunk.trackId) throw new Error(`Ambiguous card: ${chunk.lessonId}`);
    owners.set(chunk.lessonId, chunk.trackId);
    const moduleIds = stations.get(chunk.lessonId) ?? new Set<string>();
    moduleIds.add(chunk.moduleId);
    stations.set(chunk.lessonId, moduleIds);
    const key = `${chunk.locale}|${chunk.lessonId}`;
    const previous = records.get(key);
    if (previous && (previous.moduleId !== chunk.moduleId || previous.packagePath !== chunk.packagePath)) {
      throw new Error(`Ambiguous localized lesson: ${key}`);
    }
    if (pkg.productionRoute != null && !pkg.productionRoute.startsWith(`/learn/${pkg.trackId}/`)) {
      throw new Error(`Cross-card production route: ${key}`);
    }
    records.set(key, { locale: pkg.locale, lessonId: pkg.lessonId, trackId: pkg.trackId,
      moduleId: pkg.moduleId, contextModuleIds: [], packagePath: pkg.packagePath,
      packageChecksum: pkg.packageChecksum, productionRoute: pkg.productionRoute });
  }
  return { schemaVersion: "card-membership-v1", sourceSha: CONTENT_FREEZE_SHA, indexVersion: RAG_INDEX_VERSION,
    records: Object.fromEntries([...records.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, record]) => [key,
      { ...record, contextModuleIds: [...stations.get(record.lessonId)!].sort() }])) };
}

export function loadCardMembershipFromRepo(repoRoot: string): CardMembershipJson {
  const read = (name: string) => JSON.parse(fs.readFileSync(path.join(repoRoot, RAG_ARTIFACTS_DIR, name), "utf8"));
  return buildCardMembership(read("package-manifest.json"), read("chunk-manifest.json"));
}
