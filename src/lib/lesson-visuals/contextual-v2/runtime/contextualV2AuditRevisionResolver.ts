import ledger from "./contextualV2AuditRevisions.json";
import type { ContextualV2ManifestEntry } from "./contextualV2BrowserResolver";

export type AuditedContextualRevision = (typeof ledger.entries)[number];

/** An explicit reviewed derivative never changes or impersonates the original manifest. */
export function resolveAuditedContextualRevision(
  entry: ContextualV2ManifestEntry,
): { ok: true; revision?: AuditedContextualRevision } | { ok: false } {
  if (
    ledger.role !== "reviewed-contextual-asset-revisions" ||
    ledger.originalManifestPreserved !== true
  )
    return { ok: false };
  const matches = ledger.entries.filter((candidate) => candidate.cellId === entry.cellId);
  if (matches.length === 0) return { ok: true };
  if (matches.length !== 1) return { ok: false };
  const revision = matches[0];
  const exactPath = `/lesson-visuals/audit-revisions/${revision.assetDate}/${entry.lessonId}__${entry.locale}__${revision.revisionId}.png`;
  if (
    revision.lessonId !== entry.lessonId ||
    revision.locale !== entry.locale ||
    revision.basePublicPath !== entry.publicPath ||
    revision.baseAssetSha256 !== entry.assetSha256 ||
    revision.baseSourceSha256 !== entry.sourceSha256 ||
    revision.sourcePath !== entry.sourcePath ||
    revision.reviewStatus !== "agent-reviewed-draft" ||
    revision.actualFormat !== "png" ||
    !/^[a-z0-9-]+$/.test(revision.revisionId) ||
    !/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(revision.assetDate) ||
    revision.publicPath !== exactPath ||
    !/^[a-f0-9]{64}$/.test(revision.assetSha256) ||
    !/^[a-f0-9]{64}$/.test(revision.currentSourceSha256) ||
    !/^[a-f0-9]{40}$/.test(revision.currentSourceBlob) ||
    !revision.title.trim() ||
    !Number.isInteger(revision.assetBytes) ||
    revision.assetBytes <= 0 ||
    revision.assetBytes > 10 * 1024 * 1024 ||
    !Number.isInteger(revision.width) ||
    !Number.isInteger(revision.height) ||
    revision.width <= 0 ||
    revision.height <= 0 ||
    revision.width > 8192 ||
    revision.height > 8192
  )
    return { ok: false };
  return { ok: true, revision };
}
