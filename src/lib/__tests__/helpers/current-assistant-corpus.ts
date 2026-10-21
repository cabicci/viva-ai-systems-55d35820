import fs from "node:fs";
import path from "node:path";
import type { SemanticChunk } from "../../../../supabase/functions/assistant-runtime/handler.ts";
import type { AuthoritativeGroundingCandidate } from "../../rag/assistant-grounding-security";
import type { CurrentAiApproval } from "../../rag/current-source-release";
import type { PackageManifest, RagChunkRecord } from "../../rag/types";

const root = path.resolve(import.meta.dirname, "../../../..");
const read = <T>(relative: string): T => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
export const CURRENT_CORPUS = read<CurrentAiApproval>("artifacts/rag/current/approval-snapshot.json");
export const CURRENT_CHUNKS = read<RagChunkRecord[]>("artifacts/rag/current/chunks.json");
const currentPackages = read<PackageManifest>("artifacts/rag/current/package-manifest.json");
const historicalPackages = read<PackageManifest>("artifacts/rag/package-manifest.json");
const historicalChunks = read<RagChunkRecord[]>("artifacts/rag/chunks.json");

type GroundedFixture = SemanticChunk & AuthoritativeGroundingCandidate;
function candidate(chunk: RagChunkRecord, manifest: PackageManifest): GroundedFixture {
  const pkg = manifest.packages.find(record => record.packagePath === chunk.packagePath);
  if (!pkg) throw new Error(`Missing fixture package: ${chunk.packagePath}`);
  return {
    id: "fixture-row", sourceId: chunk.chunkId, locale: chunk.locale, lessonId: chunk.lessonId,
    moduleId: chunk.moduleId, pathId: chunk.trackId, title: chunk.lessonId,
    content: chunk.displayText, similarity: 0.82, packagePath: chunk.packagePath,
    sourceSha: manifest.sourceSha, packageChecksum: pkg.packageChecksum,
    chunkChecksum: chunk.textChecksum, contentVersion: pkg.canonicalVersion,
    indexVersion: manifest.indexVersion, sectionIndex: chunk.sectionIndex,
    sectionRole: chunk.sectionRole, chunkPosition: chunk.chunkIndex,
    contentType: chunk.contentType, productionRoute: chunk.productionRoute,
    indexState: "active", sameLessonRank: 0,
  };
}

export function currentSample(chunkId = "en/analyst-m1-l1-from-automation-to-insight/s0/c0"): GroundedFixture {
  const chunk = CURRENT_CHUNKS.find(record => record.chunkId === chunkId);
  if (!chunk) throw new Error(`Missing current fixture: ${chunkId}`);
  return candidate(chunk, currentPackages);
}

/** Real historical rows exercise compatibility separately from current rows. */
export function legacySample(changedPackage = false): GroundedFixture {
  const chunk = historicalChunks.find(record => {
    const pkg = historicalPackages.packages.find(p => p.packagePath === record.packagePath);
    const current = CURRENT_CORPUS.packages[`${record.locale}|${record.lessonId}`];
    const currentChunk = CURRENT_CORPUS.chunks[record.chunkId];
    return record.locale === "en" && pkg && current &&
      (current.packageChecksum !== pkg.packageChecksum) === changedPackage &&
      (changedPackage || currentChunk?.textChecksum === record.textChecksum);
  });
  if (!chunk) throw new Error(`Missing historical fixture; changed=${changedPackage}`);
  return candidate(chunk, historicalPackages);
}
