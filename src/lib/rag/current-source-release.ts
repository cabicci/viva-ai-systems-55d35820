import fs from "node:fs";
import path from "node:path";
import { discoverApprovedPackages, loadPackageByPath, runtimePackagePath } from "./corpus-discovery";
import { generateChunksForPackage } from "./chunking";
import { APPROVED_LOCALES, EMBEDDING_DIMENSIONS, EMBEDDING_MODEL_PLACEHOLDER } from "./constants";
import { normalizeCanonicalText, sha256CanonicalHex, sha256CanonicalJson } from "./canonical-checksum";
import type { ApprovedPackageRecord, ChunkManifest, PackageManifest, RagChunkRecord } from "./types";
import type { RagLocalizedLessonPackage } from "@/lib/locale-lessons/types";

export type CurrentAiPackage = {
  locale: string; lessonId: string; trackId: string; moduleId: string; contextModuleIds: string[];
  packagePath: string; packageChecksum: string; payloadChecksum: string;
  canonicalVersion: string | null; productionRoute: string | null; chunkCount: number;
};
export type CurrentAiChunk = {
  packageKey: string; textChecksum: string; sectionIndex: number; sectionRole: string;
  sectionHeading: string; chunkIndex: number; contentType: string; charCount: number;
};
export type CurrentAiApproval = {
  schemaVersion: "current-ai-corpus-v1"; releaseId: string; indexVersion: string;
  embeddingModel: string; embeddingDimensions: number;
  packages: Record<string, CurrentAiPackage>; chunks: Record<string, CurrentAiChunk>;
};
export type CurrentAiSource = { record: ApprovedPackageRecord; payload: RagLocalizedLessonPackage; raw: string };
const sorted = <T>(entries: Array<[string, T]>): Record<string, T> => Object.fromEntries(entries.sort(([a], [b]) => a.localeCompare(b)));
const counts = (items: { locale: string }[]) => Object.fromEntries(APPROVED_LOCALES.map(locale => [locale, items.filter(x => x.locale === locale).length])) as PackageManifest["localeCounts"];

/** A new content-hash release. Historical Git freezes and importer locks are untouched. */
export function buildCurrentAiRelease(sources: CurrentAiSource[]) {
  if (!sources.length) throw new Error("CURRENT_AI_EMPTY_CORPUS");
  const packages = new Map<string, CurrentAiPackage>();
  const owners = new Map<string, string>();
  const stations = new Map<string, Set<string>>();
  const payload: RagChunkRecord[] = [];
  for (const { record: r, payload: p, raw } of sources) {
    if (!(APPROVED_LOCALES as readonly string[]).includes(r.locale) || p.locale !== r.locale ||
      p.lessonId !== r.lessonId || p.pathId !== r.trackId || p.moduleId !== r.moduleId ||
      !r.trackId || r.trackId === "unknown" || !r.moduleId || r.moduleId === "unknown" ||
      r.packagePath !== runtimePackagePath(r.locale, r.lessonId) ||
      sha256CanonicalHex(raw) !== r.packageChecksum || sha256CanonicalJson(JSON.parse(raw)) !== sha256CanonicalJson(p) ||
      (r.productionRoute !== null && !r.productionRoute.startsWith(`/learn/${r.trackId}/`)))
      throw new Error(`CURRENT_AI_SOURCE_IDENTITY:${r.packagePath}`);
    const key = `${r.locale}|${r.lessonId}`;
    if (packages.has(key) || (owners.has(r.lessonId) && owners.get(r.lessonId) !== r.trackId))
      throw new Error(`CURRENT_AI_DUPLICATE_OR_CROSS_CARD:${key}`);
    owners.set(r.lessonId, r.trackId);
    const aliases = stations.get(r.lessonId) ?? new Set<string>();
    aliases.add(r.moduleId); stations.set(r.lessonId, aliases);
    // Preserve semantic checksums while making stored UTF-8 bytes canonical.
    // Historical generators/snapshots remain unchanged.
    const chunks = generateChunksForPackage(p, r).map(chunk => {
      const displayText = normalizeCanonicalText(chunk.displayText);
      return { ...chunk, displayText, charCount: displayText.length };
    });
    if (!chunks.length) throw new Error(`CURRENT_AI_NO_CONTENT:${key}`);
    payload.push(...chunks);
    packages.set(key, { locale: r.locale, lessonId: r.lessonId, trackId: r.trackId, moduleId: r.moduleId,
      contextModuleIds: [], packagePath: r.packagePath, packageChecksum: r.packageChecksum,
      payloadChecksum: sha256CanonicalJson(p), canonicalVersion: r.canonicalVersion,
      productionRoute: r.productionRoute, chunkCount: chunks.length });
  }
  for (const [lesson, aliases] of stations) {
    for (const locale of APPROVED_LOCALES) {
      const pkg = packages.get(`${locale}|${lesson}`);
      if (!pkg) throw new Error(`CURRENT_AI_MISSING_LOCALE:${locale}|${lesson}`);
      pkg.contextModuleIds = [...aliases].sort();
    }
  }
  payload.sort((a, b) => a.chunkId.localeCompare(b.chunkId));
  const chunks = new Map<string, CurrentAiChunk>();
  for (const chunk of payload) {
    if (chunks.has(chunk.chunkId) || sha256CanonicalHex(chunk.displayText) !== chunk.textChecksum ||
      /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(chunk.displayText))
      throw new Error(`CURRENT_AI_CHUNK_IDENTITY:${chunk.chunkId}`);
    chunks.set(chunk.chunkId, { packageKey: `${chunk.locale}|${chunk.lessonId}`, textChecksum: chunk.textChecksum,
      sectionIndex: chunk.sectionIndex, sectionRole: chunk.sectionRole, chunkIndex: chunk.chunkIndex,
      sectionHeading: chunk.sectionHeading, contentType: chunk.contentType, charCount: chunk.charCount });
  }
  const body = { schemaVersion: "current-ai-corpus-v1" as const, embeddingModel: EMBEDDING_MODEL_PLACEHOLDER,
    embeddingDimensions: EMBEDDING_DIMENSIONS, packages: sorted([...packages]), chunks: sorted([...chunks]) };
  const releaseId = sha256CanonicalJson(body);
  const approval: CurrentAiApproval = { ...body, releaseId, indexVersion: `rag-current-v1-${releaseId}` };
  const packageBody = { schemaVersion: "package-manifest-v1" as const, indexVersion: approval.indexVersion,
    sourceSha: releaseId, generatedAt: "1970-01-01T00:00:00.000Z", packageCount: packages.size,
    localeCounts: counts([...packages.values()]), packages: Object.values(body.packages).map(p => ({
      locale: p.locale as ApprovedPackageRecord["locale"], lessonId: p.lessonId, trackId: p.trackId, moduleId: p.moduleId,
      packagePath: p.packagePath, packageChecksum: p.packageChecksum, canonicalVersion: p.canonicalVersion,
      productionRoute: p.productionRoute, chunkCount: p.chunkCount, sourceSha: releaseId })) };
  const packageManifest: PackageManifest = { ...packageBody, manifestChecksum: sha256CanonicalJson(packageBody) };
  const chunkBody = { schemaVersion: "chunk-manifest-v1" as const, indexVersion: approval.indexVersion, sourceSha: releaseId,
    generatedAt: "1970-01-01T00:00:00.000Z", embeddingModel: approval.embeddingModel,
    embeddingDimensions: approval.embeddingDimensions, chunkCount: payload.length, localeCounts: counts(payload),
    chunks: payload.map(({ displayText: _text, sectionHeading: _heading, productionRoute: _route, ...chunk }) => chunk) };
  const chunkManifest: ChunkManifest = { ...chunkBody, manifestChecksum: sha256CanonicalJson(chunkBody) };
  const membership = { schemaVersion: "card-membership-v1" as const, sourceSha: releaseId, indexVersion: approval.indexVersion,
    records: Object.fromEntries(Object.entries(body.packages).map(([key, p]) => [key, { locale: p.locale, lessonId: p.lessonId,
      trackId: p.trackId, moduleId: p.moduleId, contextModuleIds: p.contextModuleIds, packagePath: p.packagePath,
      packageChecksum: p.packageChecksum, productionRoute: p.productionRoute }])) };
  return { approval, chunks: payload, packageManifest, chunkManifest, membership };
}

export type CurrentAiRelease = ReturnType<typeof buildCurrentAiRelease>;

export function loadCurrentAiSources(root: string): CurrentAiSource[] {
  return discoverApprovedPackages(root).map(record => ({ record,
    payload: loadPackageByPath(root, record.packagePath), raw: fs.readFileSync(path.join(root, record.packagePath), "utf8") }));
}

export function writeCurrentAiRelease(root: string) {
  const release = buildCurrentAiRelease(loadCurrentAiSources(root));
  const files: Record<string, unknown> = {
    "artifacts/rag/current/approval-snapshot.json": release.approval,
    "artifacts/rag/current/chunks.json": release.chunks,
    "artifacts/rag/current/package-manifest.json": release.packageManifest,
    "artifacts/rag/current/chunk-manifest.json": release.chunkManifest,
    "supabase/functions/assistant-runtime/current-corpus-approval.json": release.approval,
    "supabase/functions/assistant-runtime/current-card-membership.json": release.membership,
  };
  for (const [relative, value] of Object.entries(files)) {
    const target = path.join(root, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
  }
  return release;
}
