import { describe, expect, it } from "vitest";
import { buildLocaleRetrievalResponse } from "@/lib/rag/retrieval";
import type { SemanticChunkInput } from "@/lib/rag/retrieval";

const baseChunk = (overrides: Partial<SemanticChunkInput>): SemanticChunkInput => ({
  id: "1",
  sourceId: "en/intro-m1-l1/s0/c0",
  locale: "en",
  lessonId: "intro-m1-l1-what-is-ai",
  moduleId: "intro-m1",
  pathId: "intro",
  title: "What Is AI",
  content: "AI is a helpful tool.",
  similarity: 0.8,
  indexState: "active",
  indexVersion: "v1",
  packagePath: "src/lib/locale-lessons/en/lessons/intro-m1-l1-what-is-ai.json",
  sourceSha: "sha",
  packageChecksum: "pkg",
  chunkChecksum: "chk",
  contentVersion: "1.0",
  ...overrides,
});

describe("RAG locale retrieval contract", () => {
  it("filters by locale strictly with zero cross-locale leakage", () => {
    const res = buildLocaleRetrievalResponse({
      locale: "en",
      lessonId: null,
      moduleId: null,
      pathId: null,
      semanticChunks: [
        baseChunk({ locale: "en" }),
        baseChunk({ locale: "ar-MSA", sourceId: "ar-MSA/intro/s0/c0" }),
      ],
      keywordResults: [],
    });
    expect(res.citations).toHaveLength(1);
    expect(res.citations[0].locale).toBe("en");
    expect(res.retrieval.crossLocaleLeakage).toBe(1);
  });

  it("prevents cross-lesson leakage when lesson-scoped", () => {
    const res = buildLocaleRetrievalResponse({
      locale: "en",
      lessonId: "intro-m1-l1-what-is-ai",
      moduleId: "intro-m1",
      pathId: "intro",
      semanticChunks: [
        baseChunk({ lessonId: "intro-m1-l1-what-is-ai", sameLessonRank: 0 }),
        baseChunk({
          lessonId: "intro-m1-l2-first-prompt",
          sourceId: "en/intro-m1-l2/s0/c0",
          sameLessonRank: 1,
        }),
      ],
      keywordResults: [],
    });
    expect(res.citations).toHaveLength(1);
    expect(res.citations[0].lessonId).toBe("intro-m1-l1-what-is-ai");
    expect(res.retrieval.crossLessonLeakage).toBe(1);
    expect(res.retrieval.lessonScoped).toBe(true);
  });

  it("returns complete citation metadata", () => {
    const res = buildLocaleRetrievalResponse({
      locale: "en",
      lessonId: "intro-m1-l1-what-is-ai",
      moduleId: "intro-m1",
      pathId: "intro",
      semanticChunks: [baseChunk({})],
      keywordResults: [],
    });
    const c = res.citations[0];
    expect(c.chunkId).toBeTruthy();
    expect(c.packagePath).toBeTruthy();
    expect(c.sourceSha).toBeTruthy();
    expect(c.packageChecksum).toBeTruthy();
    expect(c.chunkChecksum).toBeTruthy();
    expect(c.indexVersion).toBeTruthy();
    expect(c.retrievalChannel).toBe("semantic");
  });

  it("suppresses duplicate citations", () => {
    const res = buildLocaleRetrievalResponse({
      locale: "en",
      lessonId: null,
      moduleId: null,
      pathId: null,
      semanticChunks: [baseChunk({}), baseChunk({})],
      keywordResults: [
        {
          lessonId: "intro-m1-l1-what-is-ai",
          lessonTitle: "What Is AI",
          matchedText: "AI is a helpful tool.",
        },
      ],
    });
    expect(res.retrieval.duplicateSourcesSuppressed).toBeGreaterThan(0);
  });

  it("excludes stale non-active index versions", () => {
    const res = buildLocaleRetrievalResponse({
      locale: "en",
      lessonId: null,
      moduleId: null,
      pathId: null,
      semanticChunks: [
        baseChunk({ indexState: "staging" }),
        baseChunk({ indexState: "active", sourceId: "en/active/s0/c0" }),
      ],
      keywordResults: [],
    });
    expect(res.citations).toHaveLength(1);
    expect(res.retrieval.staleVersionsExcluded).toBe(1);
  });

  it("returns explicit no-result for invalid locale", () => {
    const res = buildLocaleRetrievalResponse({
      locale: "fr-FR",
      lessonId: null,
      moduleId: null,
      pathId: null,
      semanticChunks: [],
      keywordResults: [],
    });
    expect(res.citations).toHaveLength(0);
    expect(res.retrieval.noResultReason).toBe("invalid_or_missing_locale");
  });
});
