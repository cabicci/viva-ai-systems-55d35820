/** Stable citation metadata returned by locale-aware assistant retrieval. */
export interface RagCitation {
  citationId: string;
  chunkId: string;
  locale: string;
  lessonId: string;
  moduleId: string | null;
  trackId: string | null;
  packagePath: string | null;
  sourceSha: string | null;
  packageChecksum: string | null;
  chunkChecksum: string | null;
  contentVersion: string | null;
  indexVersion: string | null;
  sectionIndex: number | null;
  sectionRole: string | null;
  sectionHeading: string | null;
  chunkIndex: number | null;
  contentType: string | null;
  productionRoute: string | null;
  title: string;
  excerpt: string;
  similarity: number;
  sameLesson: boolean;
  retrievalChannel: "semantic" | "keyword";
}

export interface RagRetrievalMeta {
  locale: string | null;
  lessonScoped: boolean;
  moduleFallbackAllowed: boolean;
  activeIndexOnly: true;
  semanticCount: number;
  keywordCount: number;
  citationCount: number;
  duplicateSourcesSuppressed: number;
  staleVersionsExcluded: number;
  crossLocaleLeakage: number;
  crossLessonLeakage: number;
  noResultReason: string | null;
}

export interface RagCitationResponseContract {
  citations: RagCitation[];
  retrieval: RagRetrievalMeta;
}

export const CITATION_EXCERPT_MAX_CHARS = 500;

export function buildCitationId(
  chunkId: string,
  indexVersion: string | null,
): string {
  return `${indexVersion ?? "unknown"}::${chunkId}`;
}
