import type { CurrentAiApproval } from "../current-source-release";
import type { RagChunkRecord } from "../types";
import { normalizeCanonicalText, sha256CanonicalHex, sha256CanonicalJson, stableCanonicalStringify } from "../canonical-checksum";
import { CURRENT_EMBEDDING_DIMENSIONS, CURRENT_EMBEDDING_MODEL, type CurrentRelease } from "./contracts";

/** Validate the independent content-hash release; never substitute a Git freeze. */
export function validateCurrentRelease(approval: CurrentAiApproval, input: RagChunkRecord[]): CurrentRelease {
  if (!approval || approval.schemaVersion !== "current-ai-corpus-v1" ||
    approval.embeddingModel !== CURRENT_EMBEDDING_MODEL || approval.embeddingDimensions !== CURRENT_EMBEDDING_DIMENSIONS ||
    !/^[a-f0-9]{64}$/.test(approval.releaseId) || approval.indexVersion !== `rag-current-v1-${approval.releaseId}` ||
    !approval.packages || !approval.chunks || !Array.isArray(input) || !input.length || input.length > 100000)
    throw new Error("CURRENT_RELEASE_INVALID");
  const body = { schemaVersion: approval.schemaVersion, embeddingModel: approval.embeddingModel,
    embeddingDimensions: approval.embeddingDimensions, packages: approval.packages, chunks: approval.chunks };
  if (sha256CanonicalJson(body) !== approval.releaseId) throw new Error("CURRENT_RELEASE_DIGEST_MISMATCH");
  if (Object.keys(approval.chunks).length !== input.length) throw new Error("CURRENT_RELEASE_COUNT_MISMATCH");
  const ids = new Set<string>(), counts = new Map<string, number>(), owners = new Map<string, string>();
  for (const chunk of input) {
    const expected = approval.chunks[chunk.chunkId], key = `${chunk.locale}|${chunk.lessonId}`, pkg = approval.packages[key];
    if (!expected || !pkg || ids.has(chunk.chunkId) || expected.packageKey !== key ||
      !["ar-EG", "ar-MSA", "ar-Gulf", "en"].includes(chunk.locale) ||
      chunk.chunkId !== `${chunk.locale}/${chunk.lessonId}/s${chunk.sectionIndex}/c${chunk.chunkIndex}` ||
      chunk.trackId !== pkg.trackId || chunk.moduleId !== pkg.moduleId || chunk.packagePath !== pkg.packagePath ||
      chunk.productionRoute !== pkg.productionRoute || chunk.textChecksum !== expected.textChecksum ||
      typeof chunk.displayText !== "string" || chunk.displayText !== normalizeCanonicalText(chunk.displayText) || sha256CanonicalHex(chunk.displayText) !== expected.textChecksum ||
      new TextDecoder().decode(new TextEncoder().encode(chunk.displayText)) !== chunk.displayText ||
      chunk.displayText.length !== expected.charCount || chunk.charCount !== expected.charCount || chunk.charCount < 1 || chunk.charCount > 1200 ||
      chunk.sectionHeading !== expected.sectionHeading || chunk.sectionIndex !== expected.sectionIndex ||
      chunk.sectionRole !== expected.sectionRole || chunk.chunkIndex !== expected.chunkIndex || chunk.contentType !== expected.contentType)
      throw new Error("CURRENT_RELEASE_CHUNK_MISMATCH");
    ids.add(chunk.chunkId); counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  for (const [key, pkg] of Object.entries(approval.packages)) {
    if (key !== `${pkg.locale}|${pkg.lessonId}` || pkg.chunkCount !== counts.get(key) || !pkg.trackId || !pkg.moduleId ||
      !/^[a-f0-9]{64}$/.test(pkg.packageChecksum) || !/^[a-f0-9]{64}$/.test(pkg.payloadChecksum) ||
      !/^[a-z0-9-]{1,80}$/.test(pkg.trackId) || !/^[a-z0-9-]{1,160}$/.test(pkg.lessonId) ||
      !Array.isArray(pkg.contextModuleIds) || !pkg.contextModuleIds.includes(pkg.moduleId) ||
      (owners.has(pkg.lessonId) && owners.get(pkg.lessonId) !== pkg.trackId) ||
      (pkg.productionRoute !== null && (!pkg.productionRoute.startsWith(`/learn/${pkg.trackId}/`) || /[\\\u0000-\u0020]/.test(pkg.productionRoute))))
      throw new Error("CURRENT_RELEASE_PACKAGE_MISMATCH");
    owners.set(pkg.lessonId, pkg.trackId);
  }
  for (const lesson of owners.keys()) for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf", "en"])
    if (!approval.packages[`${locale}|${lesson}`]) throw new Error("CURRENT_RELEASE_LOCALE_MISSING");
  // Code-point sorting is stable across hosts and matches PostgreSQL COLLATE C
  // for the ASCII source IDs admitted by the release generator.
  const chunks = input.slice().sort((a, b) => a.chunkId < b.chunkId ? -1 : a.chunkId > b.chunkId ? 1 : 0);
  if (chunks.some(c => !/^[\x21-\x7e]+$/.test(c.chunkId))) throw new Error("CURRENT_RELEASE_ID_INVALID");
  return { approval, chunks, material: stableCanonicalStringify(body) };
}
