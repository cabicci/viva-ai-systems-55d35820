import { sha256CanonicalHex, sha256CanonicalJson } from "./canonical-checksum.ts";

/** Shared by Edge and Node. This snapshot describes current approved source, not index state. */
export type CurrentCorpusApproval = {
  schemaVersion: string; releaseId: string; indexVersion: string;
  embeddingModel: string; embeddingDimensions: number;
  packages: Record<string, { locale: string; lessonId: string; trackId: string; moduleId: string;
    packagePath: string; packageChecksum: string; productionRoute: string | null }>;
  chunks: Record<string, { packageKey: string; textChecksum: string; sectionIndex: number;
    sectionRole: string; sectionHeading: string; chunkIndex: number; contentType: string; charCount: number }>;
};
export type CurrentCandidate = {
  sourceId: string; locale?: string | null; lessonId?: string | null; pathId?: string | null;
  moduleId?: string | null; packagePath?: string | null; packageChecksum?: string | null;
  chunkChecksum?: string | null; content: string; sourceSha?: string | null; indexVersion?: string | null;
  indexState?: string | null; sectionIndex?: number | null; sectionRole?: string | null;
  chunkPosition?: number | null; contentType?: string | null;
};

export function isValidCurrentApproval(approval: CurrentCorpusApproval): boolean {
  if (!approval || typeof approval !== "object" || Array.isArray(approval) ||
    !approval.packages || !approval.chunks || typeof approval.packages !== "object" || typeof approval.chunks !== "object" ||
    approval.embeddingModel !== "text-embedding-3-small" || approval.embeddingDimensions !== 1536) return false;
  const { releaseId, indexVersion, ...body } = approval;
  return approval.schemaVersion === "current-ai-corpus-v1" && /^[a-f0-9]{64}$/.test(releaseId) &&
    indexVersion === `rag-current-v1-${releaseId}` && sha256CanonicalJson(body) === releaseId;
}

/** A changed or deleted package is rejected even while an older index is still active. */
export function matchesCurrentApprovedContent(
  chunk: CurrentCandidate, locale: string, approval: CurrentCorpusApproval,
): boolean {
  if (chunk.locale !== locale || !chunk.lessonId || !chunk.sourceId ||
    (chunk.indexState != null && chunk.indexState !== "active")) return false;
  const key = `${locale}|${chunk.lessonId}`;
  const pkg = approval.packages[key];
  const registered = approval.chunks[chunk.sourceId];
  if (!pkg || !registered || registered.packageKey !== key || pkg.locale !== locale ||
    pkg.lessonId !== chunk.lessonId || pkg.trackId !== chunk.pathId || pkg.moduleId !== chunk.moduleId ||
    pkg.packagePath !== chunk.packagePath || pkg.packageChecksum !== chunk.packageChecksum ||
    registered.textChecksum !== chunk.chunkChecksum || registered.sectionIndex !== chunk.sectionIndex ||
    registered.sectionRole !== chunk.sectionRole || registered.chunkIndex !== chunk.chunkPosition ||
    registered.contentType !== chunk.contentType || registered.charCount !== chunk.content.length) return false;
  return sha256CanonicalHex(chunk.content) === registered.textChecksum;
}

export function isCurrentReleaseRow(chunk: CurrentCandidate, approval: CurrentCorpusApproval): boolean {
  return chunk.sourceSha === approval.releaseId && chunk.indexVersion === approval.indexVersion;
}
