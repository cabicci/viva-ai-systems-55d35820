import { sha256Hex } from "./checksum";
import { EMBEDDING_DIMENSIONS } from "./constants";

export type LegacyArEgChunkMap = Map<string, LegacyArEgChunk>;

/** Legacy production ar-EG row — separate from locale_lesson indexed batches. */
export interface LegacyArEgChunk {
  id: string;
  sourceType: "lesson";
  sourceId: string;
  locale: "ar-EG";
  lessonId: string;
  moduleId: string;
  pathId: string;
  title: string;
  content: string;
  packagePath: string;
  sourceSha: string;
  packageChecksum: string;
  chunkChecksum: string;
  contentVersion: string | null;
  indexVersion: string | null;
  indexState: "active";
  sectionIndex: number;
  sectionRole: string;
  chunkPosition: number;
  contentType: string;
  productionRoute: string | null;
  indexingFailed: boolean;
  embedding: number[];
}

/** Production Egyptian corpus size — preserved unchanged by localized batch import. */
export const LEGACY_AR_EG_LESSON_COUNT = 100;

/** Deterministic legacy ar-EG lesson IDs mirroring production seed shape. */
export function legacyArEgLessonIds(): string[] {
  const ids: string[] = [];
  for (let m = 1; m <= 10; m++) {
    for (let l = 1; l <= 10; l++) {
      ids.push(`intro-m${m}-l${l}`);
    }
  }
  return ids.slice(0, LEGACY_AR_EG_LESSON_COUNT);
}

function legacyEmbedding(seed: string): number[] {
  const out = new Array<number>(EMBEDDING_DIMENSIONS);
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    const slice = seed.slice(i % 32, (i % 32) + 8);
    out[i] = (parseInt(slice, 16) % 1000) / 1000;
  }
  return out;
}

/** Seed immutable production-compatible ar-EG rows (legacy path, no locale index version). */
export function seedLegacyArEgChunks(): LegacyArEgChunkMap {
  const chunks = new Map<string, LegacyArEgChunk>();
  for (const lessonId of legacyArEgLessonIds()) {
    const sourceId = `legacy-eg/${lessonId}`;
    const content = `Egyptian lesson corpus content for ${lessonId}`;
    const chunkChecksum = sha256Hex(content);
    chunks.set(sourceId, {
      id: `legacy-${lessonId}`,
      sourceType: "lesson",
      sourceId,
      locale: "ar-EG",
      lessonId,
      moduleId: lessonId.split("-l")[0].replace("intro-", "intro"),
      pathId: "intro",
      title: lessonId,
      content,
      packagePath: `src/lib/lessons/${lessonId}.ts`,
      sourceSha: "legacy-ar-eg-production",
      packageChecksum: sha256Hex(lessonId),
      chunkChecksum,
      contentVersion: null,
      indexVersion: null,
      indexState: "active",
      sectionIndex: 0,
      sectionRole: "explanation",
      chunkPosition: 0,
      contentType: "explanation",
      productionRoute: `/learn/${lessonId}`,
      indexingFailed: false,
      embedding: legacyEmbedding(chunkChecksum),
    });
  }
  return chunks;
}

export function snapshotLegacyChunks(
  chunks: LegacyArEgChunkMap,
): LegacyArEgChunkMap {
  return new Map(
    [...chunks.entries()].map(([k, v]) => [k, { ...v, embedding: [...v.embedding] }]),
  );
}

export function legacyChunksUnchanged(
  before: LegacyArEgChunkMap,
  after: LegacyArEgChunkMap,
): boolean {
  if (before.size !== after.size) return false;
  for (const [key, prev] of before) {
    const next = after.get(key);
    if (!next) return false;
    if (JSON.stringify(prev) !== JSON.stringify(next)) return false;
  }
  return true;
}
