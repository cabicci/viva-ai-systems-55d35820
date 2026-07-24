import {
  CHUNK_MAX_CHARS,
  CHUNK_MIN_CHARS,
  CHUNK_OVERLAP_CHARS,
  CHUNK_SOFT_MAX_CHARS,
} from "./constants";
import { normalizeText, sha256Hex } from "./checksum";
import { extractPackageSegments } from "./section-extraction";
import type { ApprovedPackageRecord, ChunkQualityReport, RagChunkRecord } from "./types";
import type { RagLocalizedLessonPackage } from "@/lib/locale-lessons/types";

export function buildChunkId(
  locale: string,
  lessonId: string,
  sectionIndex: number,
  chunkIndex: number,
): string {
  return `${locale}/${lessonId}/s${sectionIndex}/c${chunkIndex}`;
}

/** Deterministic character-based text splitting with fixed overlap. */
export function splitTextIntoChunks(text: string): string[] {
  const clean = normalizeText(text);
  if (!clean) return [];
  if (clean.length <= CHUNK_MAX_CHARS) return [clean];

  const chunks: string[] = [];
  let start = 0;

  while (start < clean.length) {
    const end = Math.min(start + CHUNK_MAX_CHARS, clean.length);
    chunks.push(clean.slice(start, end));
    if (end >= clean.length) break;
    start = end - CHUNK_OVERLAP_CHARS;
    if (start < 0) start = 0;
  }

  return chunks;
}

/** Generate deterministic chunks for a single approved package. */
export function generateChunksForPackage(
  pkg: RagLocalizedLessonPackage,
  record: ApprovedPackageRecord,
): RagChunkRecord[] {
  const segments = extractPackageSegments(pkg);
  const chunks: RagChunkRecord[] = [];

  for (const seg of segments) {
    const textChunks = splitTextIntoChunks(seg.text);
    textChunks.forEach((displayText, chunkIndex) => {
      chunks.push({
        chunkId: buildChunkId(record.locale, record.lessonId, seg.sectionIndex, chunkIndex),
        lessonId: record.lessonId,
        locale: record.locale,
        moduleId: record.moduleId,
        trackId: record.trackId,
        sectionIndex: seg.sectionIndex,
        sectionRole: seg.sectionRole,
        sectionHeading: seg.sectionHeading,
        chunkIndex,
        contentType: seg.contentType,
        displayText,
        textChecksum: sha256Hex(displayText),
        charCount: displayText.length,
        packagePath: record.packagePath,
        productionRoute: record.productionRoute,
      });
    });
  }

  return chunks;
}

/** Analyze chunk quality issues. */
export function analyzeChunkQuality(chunks: RagChunkRecord[]): ChunkQualityReport {
  const emptyChunks: string[] = [];
  const duplicateChunks: string[] = [];
  const oversizedChunks: string[] = [];
  const undersizedChunks: string[] = [];
  const crossLocaleViolations: string[] = [];
  const crossLessonViolations: string[] = [];

  const idSet = new Set<string>();
  const localeLessonChunks = new Map<string, RagChunkRecord[]>();

  for (const chunk of chunks) {
    if (!chunk.displayText.trim()) {
      emptyChunks.push(chunk.chunkId);
    }
    if (chunk.charCount < CHUNK_MIN_CHARS) {
      undersizedChunks.push(chunk.chunkId);
    }
    if (chunk.charCount > CHUNK_SOFT_MAX_CHARS) {
      oversizedChunks.push(chunk.chunkId);
    }
    if (idSet.has(chunk.chunkId)) {
      duplicateChunks.push(chunk.chunkId);
    }
    idSet.add(chunk.chunkId);

    const key = `${chunk.locale}/${chunk.lessonId}`;
    const group = localeLessonChunks.get(key) ?? [];
    group.push(chunk);
    localeLessonChunks.set(key, group);
  }

  for (const [, group] of localeLessonChunks) {
    const locales = new Set(group.map((c) => c.locale));
    const lessons = new Set(group.map((c) => c.lessonId));
    if (locales.size > 1) {
      crossLocaleViolations.push(group[0].chunkId);
    }
    if (lessons.size > 1) {
      crossLessonViolations.push(group[0].chunkId);
    }
  }

  return {
    emptyChunks: [...new Set(emptyChunks)].sort(),
    duplicateChunks: [...new Set(duplicateChunks)].sort(),
    oversizedChunks: [...new Set(oversizedChunks)].sort(),
    undersizedChunks: [...new Set(undersizedChunks)].sort(),
    crossLocaleViolations: [...new Set(crossLocaleViolations)].sort(),
    crossLessonViolations: [...new Set(crossLessonViolations)].sort(),
  };
}
