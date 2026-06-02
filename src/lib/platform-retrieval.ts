import { useMemo } from "react";
import { LESSONS, type LessonContent } from "@/lib/unified-lessons";
import { PATHS } from "@/lib/curriculum-data";

/**
 * Retrieval Layer — frontend-only internal search across local platform
 * educational content. No AI. No vectors. No backend.
 *
 * Reads from existing modules:
 *   - src/lib/lessons-data.ts  (LESSONS)
 *   - src/lib/curriculum-data.ts  (PATHS → module titles)
 *
 * Output is structured to feed future RAG / Assistant layers.
 */

export type MatchType =
  | "title"
  | "description"
  | "concept"
  | "mentalModel"
  | "models"
  | "comparison"
  | "coreRule"
  | "example"
  | "execution"
  | "failures"
  | "takeaways"
  | "mission"
  | "goal"
  | "tag";

export interface RetrievalChunk {
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  matchType: MatchType;
  text: string;
}

export interface RetrievalResult {
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  matchedText: string;
  matchType: MatchType;
  relevanceScore: number;
}

/* ---------- Module title resolution (per lesson id) ---------- */

const MODULE_INDEX: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const p of PATHS) {
    for (const m of p.modules) {
      for (const l of m.lessons) {
        if (!out[l.id]) out[l.id] = m.title;
      }
    }
  }
  return out;
})();

/* ---------- Lesson → chunks ---------- */

function lessonToChunks(l: LessonContent): RetrievalChunk[] {
  const moduleTitle = MODULE_INDEX[l.id] ?? l.stage;
  const base = { lessonId: l.id, lessonTitle: l.title, moduleTitle };
  const chunks: RetrievalChunk[] = [];

  chunks.push({ ...base, matchType: "title", text: l.title });
  if (l.description)
    chunks.push({ ...base, matchType: "description", text: l.description });

  for (const t of l.tags ?? [])
    chunks.push({ ...base, matchType: "tag", text: t });

  if (l.goal) {
    if (l.goal.intro)
      chunks.push({ ...base, matchType: "goal", text: l.goal.intro });
    for (const it of l.goal.items)
      chunks.push({ ...base, matchType: "goal", text: it });
  }

  if (l.concept) {
    for (const p of l.concept.intro ?? [])
      chunks.push({ ...base, matchType: "concept", text: p });
    for (const c of l.concept.cards ?? [])
      chunks.push({
        ...base,
        matchType: "concept",
        text: `${c.title} — ${c.body}`,
      });
    if (l.concept.quote)
      chunks.push({ ...base, matchType: "concept", text: l.concept.quote });
  }

  if (l.mentalModel) {
    if (l.mentalModel.intro)
      chunks.push({
        ...base,
        matchType: "mentalModel",
        text: l.mentalModel.intro,
      });
    for (const d of l.mentalModel.dialogue)
      chunks.push({
        ...base,
        matchType: "mentalModel",
        text: `${d.who}: ${d.text}`,
      });
    if (l.mentalModel.outro)
      chunks.push({
        ...base,
        matchType: "mentalModel",
        text: l.mentalModel.outro,
      });
  }

  for (const m of l.models ?? [])
    chunks.push({
      ...base,
      matchType: "models",
      text: `${m.name} (${m.vendor}) — قوّته: ${m.strength}. استخدمه لـ: ${m.use}`,
    });

  if (l.comparison) {
    chunks.push({
      ...base,
      matchType: "comparison",
      text: `WRONG — ${l.comparison.wrong.title}: ${l.comparison.wrong.example} ${l.comparison.wrong.note}`,
    });
    chunks.push({
      ...base,
      matchType: "comparison",
      text: `RIGHT — ${l.comparison.right.title}: ${l.comparison.right.example} ${l.comparison.right.note}`,
    });
  }

  if (l.coreRule) {
    chunks.push({
      ...base,
      matchType: "coreRule",
      text: `${l.coreRule.eyebrow} — ${l.coreRule.title}${l.coreRule.subtitle ? " — " + l.coreRule.subtitle : ""}`,
    });
  }

  if (l.example)
    chunks.push({ ...base, matchType: "example", text: l.example });
  if (l.execution)
    chunks.push({ ...base, matchType: "execution", text: l.execution });
  if (l.failures)
    chunks.push({ ...base, matchType: "failures", text: l.failures });

  if (l.takeaways) {
    chunks.push({
      ...base,
      matchType: "takeaways",
      text: `${l.takeaways.headline}${l.takeaways.note ? " — " + l.takeaways.note : ""}`,
    });
  }

  if (l.mission) {
    const m = l.mission;
    const parts = [m.title, m.intro, m.prompt, m.outro].filter(Boolean);
    if (parts.length)
      chunks.push({ ...base, matchType: "mission", text: parts.join(" — ") });
  }

  return chunks;
}

/* Pre-built corpus (cheap to compute once, cached at module-load) */
const CORPUS: RetrievalChunk[] = LESSONS.flatMap(lessonToChunks);

/* ---------- Scoring ---------- */

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "") // strip Arabic diacritics
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .trim();
}

function tokens(s: string): string[] {
  return normalize(s)
    .split(/[\s\p{P}]+/u)
    .filter((t) => t.length >= 2);
}

/* Match-type weights tuned to surface authoritative content first. */
const TYPE_WEIGHT: Record<MatchType, number> = {
  title: 5,
  coreRule: 4,
  description: 3,
  takeaways: 3,
  mission: 2.5,
  concept: 2,
  mentalModel: 2,
  comparison: 2,
  models: 2,
  example: 1.8,
  execution: 1.8,
  failures: 1.5,
  goal: 1.2,
  tag: 1,
};

function scoreChunk(qTokens: string[], qNorm: string, c: RetrievalChunk): number {
  if (qTokens.length === 0) return 0;
  const text = normalize(c.text);
  let score = 0;

  // exact phrase bonus
  if (qNorm.length >= 3 && text.includes(qNorm)) score += 6;

  // token overlap
  let hits = 0;
  for (const t of qTokens) {
    if (!t) continue;
    if (text.includes(t)) {
      hits += 1;
      score += 1.5;
    }
  }
  if (hits === 0 && score === 0) return 0;

  // coverage ratio
  score += (hits / qTokens.length) * 2;

  // type weight
  score *= TYPE_WEIGHT[c.matchType] ?? 1;

  // mild length penalty so we don't always reward huge blobs
  score *= 1 / (1 + Math.log10(Math.max(20, text.length)));

  return score;
}

/* ---------- Public API ---------- */

export interface SearchOptions {
  /** max chunks returned (default 8) */
  limit?: number;
  /** min relevance score to include (default 0.05) */
  minScore?: number;
  /** dedupe so each lesson appears at most N times (default 3) */
  perLessonCap?: number;
}

export function searchPlatformContent(
  query: string,
  opts: SearchOptions = {},
): RetrievalResult[] {
  const q = (query ?? "").trim();
  if (!q) return [];
  const qNorm = normalize(q);
  const qTokens = tokens(q);
  const limit = opts.limit ?? 8;
  const minScore = opts.minScore ?? 0.05;
  const cap = opts.perLessonCap ?? 3;

  const scored: RetrievalResult[] = [];
  for (const c of CORPUS) {
    const s = scoreChunk(qTokens, qNorm, c);
    if (s >= minScore) {
      scored.push({
        lessonId: c.lessonId,
        lessonTitle: c.lessonTitle,
        moduleTitle: c.moduleTitle,
        matchedText: c.text,
        matchType: c.matchType,
        relevanceScore: Math.round(s * 1000) / 1000,
      });
    }
  }

  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // per-lesson cap
  const counts = new Map<string, number>();
  const out: RetrievalResult[] = [];
  for (const r of scored) {
    const n = counts.get(r.lessonId) ?? 0;
    if (n >= cap) continue;
    counts.set(r.lessonId, n + 1);
    out.push(r);
    if (out.length >= limit) break;
  }

  return out;
}

/* ---------- Hook ---------- */

export function usePlatformRetrieval(
  query: string,
  opts: SearchOptions = {},
): RetrievalResult[] {
  const limit = opts.limit;
  const minScore = opts.minScore;
  const perLessonCap = opts.perLessonCap;
  return useMemo(
    () => searchPlatformContent(query, { limit, minScore, perLessonCap }),
    [query, limit, minScore, perLessonCap],
  );
}

/** Total searchable chunks — exposed for the system-state debug panel. */
export const RETRIEVAL_CORPUS_SIZE = CORPUS.length;
