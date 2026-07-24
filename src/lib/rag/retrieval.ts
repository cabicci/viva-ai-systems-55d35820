import type { RagCitation, RagCitationResponseContract } from "./citation-contract";
import { buildCitationId, CITATION_EXCERPT_MAX_CHARS } from "./citation-contract";

export const APPROVED_PACKAGE_LOCALES = ["ar-EG", "en", "ar-MSA", "ar-Gulf"] as const;
export type PackageLocale = (typeof APPROVED_PACKAGE_LOCALES)[number];

export interface SemanticChunkInput {
  id: string;
  sourceId: string;
  locale: string | null;
  lessonId: string | null;
  moduleId: string | null;
  pathId: string | null;
  title: string;
  content: string;
  similarity: number;
  packagePath?: string | null;
  sourceSha?: string | null;
  packageChecksum?: string | null;
  chunkChecksum?: string | null;
  contentVersion?: string | null;
  indexVersion?: string | null;
  sectionIndex?: number | null;
  sectionRole?: string | null;
  chunkPosition?: number | null;
  contentType?: string | null;
  productionRoute?: string | null;
  indexState?: string | null;
  sameLessonRank?: number;
}

export interface KeywordResultInput {
  lessonId?: string;
  lessonTitle?: string;
  moduleTitle?: string;
  matchedText?: string;
  matchType?: string;
  relevanceScore?: number;
}

export interface LocaleRetrievalRequest {
  locale: string | null;
  lessonId: string | null;
  moduleId: string | null;
  pathId: string | null;
  contentVersion?: string | null;
  allowModuleFallback?: boolean;
  semanticChunks: SemanticChunkInput[];
  keywordResults: KeywordResultInput[];
  minSimilarity?: number;
}

export function isValidPackageLocale(locale: string | null | undefined): locale is PackageLocale {
  return (
    typeof locale === "string" && (APPROVED_PACKAGE_LOCALES as readonly string[]).includes(locale)
  );
}

function citationDedupeKey(c: Pick<RagCitation, "chunkId" | "lessonId" | "excerpt">): string {
  return `${c.lessonId ?? ""}::${c.chunkId}::${c.excerpt.slice(0, 80)}`;
}

/** Apply strict locale-aware retrieval filters and build citation contract. */
export function buildLocaleRetrievalResponse(
  req: LocaleRetrievalRequest,
): RagCitationResponseContract {
  const minSimilarity = req.minSimilarity ?? 0.35;
  let staleVersionsExcluded = 0;
  let crossLocaleLeakage = 0;
  let crossLessonLeakage = 0;

  if (!isValidPackageLocale(req.locale)) {
    return {
      citations: [],
      retrieval: {
        locale: req.locale,
        lessonScoped: Boolean(req.lessonId),
        moduleFallbackAllowed: false,
        activeIndexOnly: true,
        semanticCount: 0,
        keywordCount: 0,
        citationCount: 0,
        duplicateSourcesSuppressed: 0,
        staleVersionsExcluded: 0,
        crossLocaleLeakage: 0,
        crossLessonLeakage: 0,
        noResultReason: "invalid_or_missing_locale",
      },
    };
  }

  const lessonScoped = Boolean(req.lessonId);
  const allowModuleFallback = req.allowModuleFallback === true && !lessonScoped;

  const filteredSemantic = req.semanticChunks.filter((chunk) => {
    if (chunk.indexState && chunk.indexState !== "active") {
      staleVersionsExcluded += 1;
      return false;
    }
    if (chunk.locale !== req.locale) {
      crossLocaleLeakage += 1;
      return false;
    }
    if (chunk.similarity < minSimilarity) return false;
    if (req.contentVersion && chunk.contentVersion !== req.contentVersion) {
      staleVersionsExcluded += 1;
      return false;
    }
    if (lessonScoped) {
      if (chunk.lessonId !== req.lessonId) {
        crossLessonLeakage += 1;
        return false;
      }
    } else if (allowModuleFallback && req.moduleId) {
      if (chunk.moduleId !== req.moduleId) return false;
    } else if (req.moduleId && !allowModuleFallback) {
      if (chunk.moduleId !== req.moduleId) return false;
    }
    if (req.pathId && chunk.pathId !== req.pathId && !lessonScoped) return false;
    return true;
  });

  filteredSemantic.sort((a, b) => {
    const rankA = a.sameLessonRank ?? (a.lessonId === req.lessonId ? 0 : 1);
    const rankB = b.sameLessonRank ?? (b.lessonId === req.lessonId ? 0 : 1);
    if (rankA !== rankB) return rankA - rankB;
    return b.similarity - a.similarity;
  });

  const semanticCitations: RagCitation[] = filteredSemantic.map((chunk) => ({
    citationId: buildCitationId(chunk.sourceId, chunk.indexVersion ?? null),
    chunkId: chunk.sourceId,
    locale: chunk.locale ?? req.locale!,
    lessonId: chunk.lessonId ?? "",
    moduleId: chunk.moduleId,
    trackId: chunk.pathId,
    packagePath: chunk.packagePath ?? null,
    sourceSha: chunk.sourceSha ?? null,
    packageChecksum: chunk.packageChecksum ?? null,
    chunkChecksum: chunk.chunkChecksum ?? null,
    contentVersion: chunk.contentVersion ?? null,
    indexVersion: chunk.indexVersion ?? null,
    sectionIndex: chunk.sectionIndex ?? null,
    sectionRole: chunk.sectionRole ?? null,
    sectionHeading: null,
    chunkIndex: chunk.chunkPosition ?? null,
    contentType: chunk.contentType ?? null,
    productionRoute: chunk.productionRoute ?? null,
    title: chunk.title,
    excerpt: chunk.content.slice(0, CITATION_EXCERPT_MAX_CHARS),
    similarity: chunk.similarity,
    sameLesson: chunk.lessonId === req.lessonId,
    retrievalChannel: "semantic",
  }));

  const semanticKeys = new Set(semanticCitations.map(citationDedupeKey));

  const keywordCitations: RagCitation[] = req.keywordResults
    .filter((k) => {
      if (lessonScoped && k.lessonId && k.lessonId !== req.lessonId) {
        crossLessonLeakage += 1;
        return false;
      }
      return true;
    })
    .map((k, idx) => ({
      citationId: `keyword::${k.lessonId ?? "unknown"}::${idx}`,
      chunkId: `keyword/${k.lessonId ?? "unknown"}/${idx}`,
      locale: req.locale!,
      lessonId: k.lessonId ?? "",
      moduleId: null,
      trackId: null,
      packagePath: null,
      sourceSha: null,
      packageChecksum: null,
      chunkChecksum: null,
      contentVersion: null,
      indexVersion: null,
      sectionIndex: null,
      sectionRole: null,
      sectionHeading: null,
      chunkIndex: null,
      contentType: "keyword",
      productionRoute: null,
      title: k.lessonTitle ?? "—",
      excerpt: (k.matchedText ?? "").slice(0, CITATION_EXCERPT_MAX_CHARS),
      similarity: k.relevanceScore ?? 0,
      sameLesson: k.lessonId === req.lessonId,
      retrievalChannel: "keyword" as const,
    }))
    .filter((c) => !semanticKeys.has(citationDedupeKey(c)));

  const allCitations = [...semanticCitations, ...keywordCitations];
  const seen = new Set<string>();
  const deduped: RagCitation[] = [];
  let duplicateSourcesSuppressed = 0;

  for (const c of allCitations) {
    const key = citationDedupeKey(c);
    if (seen.has(key)) {
      duplicateSourcesSuppressed += 1;
      continue;
    }
    seen.add(key);
    deduped.push(c);
  }

  const noResultReason =
    deduped.length === 0 ? (lessonScoped ? "no_lesson_scoped_results" : "no_locale_results") : null;

  return {
    citations: deduped,
    retrieval: {
      locale: req.locale,
      lessonScoped,
      moduleFallbackAllowed: allowModuleFallback,
      activeIndexOnly: true,
      semanticCount: semanticCitations.length,
      keywordCount: keywordCitations.length,
      citationCount: deduped.length,
      duplicateSourcesSuppressed,
      staleVersionsExcluded,
      crossLocaleLeakage,
      crossLessonLeakage,
      noResultReason,
    },
  };
}
