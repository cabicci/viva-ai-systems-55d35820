/**
 * Admin-only knowledge_chunks seed flow for the Assistant runtime.
 *
 * Goals:
 *  - Single deterministic source of truth: PATHS ∩ INTRO_LESSON_CONTENT.
 *  - Hard guarantee of exactly 100 learner lessons.
 *  - Excludes 4 archived Business slugs.
 *  - Dry-run by default — no OpenAI calls, no DB writes.
 *  - Real seed only when caller is admin AND confirmationText equals
 *    "SEED_100_LEARNER_LESSONS".
 *  - Service role (supabaseAdmin) used ONLY inside the real seed branch.
 *  - OPENAI_API_KEY read only inside the handler, never logged or returned.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { PATHS } from "@/lib/curriculum-data";
import { INTRO_LESSON_CONTENT } from "@/components/intro/lessons";
import type { IntroLessonContent } from "@/components/intro/intro-lesson-types";

/* -------------------------------------------------------------- */
/* Constants                                                       */
/* -------------------------------------------------------------- */

export const SEED_CONFIRMATION_TEXT = "SEED_100_LEARNER_LESSONS";
export const EXPECTED_LESSON_COUNT = 100;
export const MAX_EMBEDDING_REQUESTS = 150;
export const EMBEDDING_BATCH_SIZE = 64;
export const CHUNK_MAX_CHARS = 1500;
export const CHUNK_OVERLAP_CHARS = 150;
export const EMBEDDING_MODEL = "text-embedding-3-small";

export const ARCHIVED_BUSINESS_SLUGS = new Set<string>([
  "business-m1-l3-ai-thinking-partner",
  "business-m2-l4-pricing-cash-flow",
  "business-m3-l4-hiring-onboarding",
  "business-m4-l5-business-os-dashboard",
]);

/* -------------------------------------------------------------- */
/* Types                                                           */
/* -------------------------------------------------------------- */

interface PlannedLesson {
  lessonId: string;
  pathId: string;
  moduleId: string;
  title: string;
  chunkCount: number;
  totalChars: number;
}

export interface SeedReport {
  dryRun: boolean;
  executed: boolean;
  plannedLessonCount: number;
  expectedLessonCount: number;
  archivedExcluded: string[];
  missingContent: string[];
  archivedFoundInPlan: string[];
  totalChunks: number;
  totalChars: number;
  estimatedBatches: number;
  maxEmbeddingRequests: number;
  embeddingModel: string;
  warnings: string[];
  ok: boolean;
  // populated only on real seed
  deletedRows?: number;
  insertedRows?: number;
}

/* -------------------------------------------------------------- */
/* Helpers — admin gate                                            */
/* -------------------------------------------------------------- */

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error("Authorization check failed");
  if (!data) throw new Error("Forbidden: admin role required");
}

/* -------------------------------------------------------------- */
/* Helpers — text extraction & chunking                            */
/* -------------------------------------------------------------- */

function pushIfString(out: string[], v: unknown) {
  if (typeof v === "string" && v.trim().length > 0) out.push(v.trim());
}

/**
 * Flatten an IntroLessonContent into plain text segments.
 * Defensive: unknown / future block kinds are skipped, never throw.
 */
function extractLessonText(
  title: string,
  blocks: IntroLessonContent,
): string {
  const parts: string[] = [`# ${title}`];

  for (const section of blocks) {
    if (section.title) parts.push(`## ${section.title}`);
    const b: any = section.block;
    if (!b || typeof b !== "object") continue;

    switch (b.kind) {
      case "paragraphs":
        if (Array.isArray(b.paragraphs)) {
          for (const p of b.paragraphs) pushIfString(parts, p);
        }
        break;
      case "comparison":
        pushIfString(parts, b?.left?.label);
        pushIfString(parts, b?.left?.body);
        pushIfString(parts, b?.right?.label);
        pushIfString(parts, b?.right?.body);
        break;
      case "quote":
        pushIfString(parts, b.quote);
        break;
      case "flow":
        if (Array.isArray(b.steps)) b.steps.forEach((s: unknown) => pushIfString(parts, s));
        break;
      case "mission":
        pushIfString(parts, b.intro);
        pushIfString(parts, b.prompt);
        if (Array.isArray(b.rubric)) {
          for (const r of b.rubric) {
            pushIfString(parts, r?.label);
            if (Array.isArray(r?.criteria)) {
              for (const c of r.criteria) pushIfString(parts, c);
            }
          }
        }
        break;
      case "checklist":
      case "numberedList":
        if (Array.isArray(b.items)) b.items.forEach((s: unknown) => pushIfString(parts, s));
        break;
      case "rule":
        pushIfString(parts, b.statement);
        break;
      case "executionTask":
        pushIfString(parts, b.title);
        if (Array.isArray(b.steps)) b.steps.forEach((s: unknown) => pushIfString(parts, s));
        pushIfString(parts, b.expectedResult);
        break;
      case "toolBlock":
        pushIfString(parts, b.name);
        pushIfString(parts, b.description);
        break;
      case "warning":
        pushIfString(parts, b.title);
        pushIfString(parts, b.body);
        break;
      case "screenshot":
        pushIfString(parts, b.caption);
        pushIfString(parts, b.alt);
        break;
      case "concepts":
        if (Array.isArray(b.items)) {
          for (const it of b.items) {
            pushIfString(parts, it?.term);
            pushIfString(parts, it?.meaning);
            pushIfString(parts, it?.example);
          }
        }
        break;
      case "diagram":
        pushIfString(parts, b.caption);
        break;
      case "quiz":
        if (Array.isArray(b.items)) {
          for (const q of b.items) {
            pushIfString(parts, q?.question);
            if (Array.isArray(q?.options)) {
              for (const o of q.options) pushIfString(parts, o);
            }
            pushIfString(parts, q?.explanation);
          }
        }
        break;
      case "caseStudy":
        pushIfString(parts, b.title);
        pushIfString(parts, b.body);
        break;
      case "lessonVideo":
      case "video":
        pushIfString(parts, b.caption);
        break;
      default:
        // unknown block — try common text fields defensively
        pushIfString(parts, b.title);
        pushIfString(parts, b.body);
        pushIfString(parts, b.caption);
        break;
    }
  }

  return parts.join("\n\n");
}

function chunkText(text: string): string[] {
  const clean = text.replace(/\s+\n/g, "\n").trim();
  if (clean.length <= CHUNK_MAX_CHARS) return [clean];
  const out: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(i + CHUNK_MAX_CHARS, clean.length);
    out.push(clean.slice(i, end));
    if (end >= clean.length) break;
    i = end - CHUNK_OVERLAP_CHARS;
  }
  return out;
}

/* -------------------------------------------------------------- */
/* Plan builder — pure, no IO                                      */
/* -------------------------------------------------------------- */

interface PlannedChunk {
  lessonId: string;
  pathId: string;
  moduleId: string;
  title: string;
  chunkIndex: number;
  content: string;
}

function buildPlan(): {
  lessons: PlannedLesson[];
  chunks: PlannedChunk[];
  missing: string[];
  archivedFound: string[];
} {
  const lessons: PlannedLesson[] = [];
  const chunks: PlannedChunk[] = [];
  const missing: string[] = [];
  const archivedFound: string[] = [];
  const seen = new Set<string>();

  for (const path of PATHS) {
    for (const mod of path.modules) {
      for (const lesson of mod.lessons) {
        const id = lesson.id;
        if (seen.has(id)) continue;
        if (ARCHIVED_BUSINESS_SLUGS.has(id)) {
          archivedFound.push(id);
          continue;
        }
        const blocks = INTRO_LESSON_CONTENT[id];
        if (!blocks) {
          // Only count as "missing" if the curriculum considers it shipped.
          // Since the unified-lessons adapter skips lessons without blocks,
          // we mirror that behaviour: skip silently here too.
          continue;
        }
        seen.add(id);
        const text = extractLessonText(lesson.title, blocks);
        if (!text || text.trim().length === 0) {
          missing.push(id);
          continue;
        }
        const lessonChunks = chunkText(text);
        lessons.push({
          lessonId: id,
          pathId: path.id,
          moduleId: mod.id,
          title: lesson.title,
          chunkCount: lessonChunks.length,
          totalChars: text.length,
        });
        lessonChunks.forEach((content, idx) => {
          chunks.push({
            lessonId: id,
            pathId: path.id,
            moduleId: mod.id,
            title: lesson.title,
            chunkIndex: idx,
            content,
          });
        });
      }
    }
  }

  return { lessons, chunks, missing, archivedFound };
}

function summarize(
  plan: ReturnType<typeof buildPlan>,
  opts: { dryRun: boolean; executed: boolean },
): SeedReport {
  const totalChunks = plan.chunks.length;
  const totalChars = plan.lessons.reduce((s, l) => s + l.totalChars, 0);
  const estimatedBatches = Math.ceil(totalChunks / EMBEDDING_BATCH_SIZE);
  const warnings: string[] = [];

  const archivedIncluded = plan.lessons
    .map((l) => l.lessonId)
    .filter((id) => ARCHIVED_BUSINESS_SLUGS.has(id));

  if (plan.lessons.length !== EXPECTED_LESSON_COUNT) {
    warnings.push(
      `Planned lesson count = ${plan.lessons.length}, expected ${EXPECTED_LESSON_COUNT}`,
    );
  }
  if (archivedIncluded.length > 0) {
    warnings.push(`Archived slugs in plan: ${archivedIncluded.join(", ")}`);
  }
  if (plan.missing.length > 0) {
    warnings.push(`Lessons with empty extracted content: ${plan.missing.join(", ")}`);
  }
  if (estimatedBatches > MAX_EMBEDDING_REQUESTS) {
    warnings.push(
      `Estimated embedding batches ${estimatedBatches} > MAX_EMBEDDING_REQUESTS ${MAX_EMBEDDING_REQUESTS}`,
    );
  }

  const ok =
    plan.lessons.length === EXPECTED_LESSON_COUNT &&
    archivedIncluded.length === 0 &&
    plan.missing.length === 0 &&
    estimatedBatches <= MAX_EMBEDDING_REQUESTS;

  return {
    dryRun: opts.dryRun,
    executed: opts.executed,
    plannedLessonCount: plan.lessons.length,
    expectedLessonCount: EXPECTED_LESSON_COUNT,
    archivedExcluded: Array.from(ARCHIVED_BUSINESS_SLUGS),
    missingContent: plan.missing,
    archivedFoundInPlan: archivedIncluded,
    totalChunks,
    totalChars,
    estimatedBatches,
    maxEmbeddingRequests: MAX_EMBEDDING_REQUESTS,
    embeddingModel: EMBEDDING_MODEL,
    warnings,
    ok,
  };
}

/* -------------------------------------------------------------- */
/* Public server fn 1 — Dry-run preview                           */
/* -------------------------------------------------------------- */

export const previewAssistantSeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SeedReport> => {
    await assertAdmin(context);
    const plan = buildPlan();
    return summarize(plan, { dryRun: true, executed: false });
  });

/* -------------------------------------------------------------- */
/* Public server fn 2 — Real seed (guarded)                       */
/* -------------------------------------------------------------- */

const runSeedInput = z.object({
  dryRun: z.boolean().default(true),
  confirmationText: z.string().default(""),
});

export const runAssistantSeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => runSeedInput.parse(input))
  .handler(async ({ context, data }): Promise<SeedReport> => {
    await assertAdmin(context);

    const plan = buildPlan();
    const summary = summarize(plan, { dryRun: data.dryRun, executed: false });

    // Default path = dry-run. No OpenAI, no writes.
    if (data.dryRun) return summary;

    // Hard guards before any paid / destructive operation.
    if (data.confirmationText !== SEED_CONFIRMATION_TEXT) {
      throw new Error(
        `Refusing real seed: confirmationText must be exactly "${SEED_CONFIRMATION_TEXT}"`,
      );
    }
    if (!summary.ok) {
      throw new Error(
        "Refusing real seed: plan failed validation. " +
          summary.warnings.join(" | "),
      );
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      throw new Error("Missing OPENAI_API_KEY on server");
    }

    // Lazy import service-role client only inside the real-seed branch.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const allowedIds = plan.lessons.map((l) => l.lessonId);

    // Embed in batches.
    const allEmbeddings: number[][] = new Array(plan.chunks.length);
    let batchCount = 0;
    for (let i = 0; i < plan.chunks.length; i += EMBEDDING_BATCH_SIZE) {
      batchCount += 1;
      if (batchCount > MAX_EMBEDDING_REQUESTS) {
        throw new Error("Exceeded MAX_EMBEDDING_REQUESTS — aborting seed");
      }
      const slice = plan.chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
      const resp = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: slice.map((c) => c.content),
        }),
      });
      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(`OpenAI embeddings failed (${resp.status}): ${body.slice(0, 300)}`);
      }
      const json = (await resp.json()) as {
        data: Array<{ index: number; embedding: number[] }>;
      };
      for (const row of json.data) {
        allEmbeddings[i + row.index] = row.embedding;
      }
    }

    // Delete only source_type='lesson' rows for allowed slugs (match by lesson_id
    // column so it works regardless of source_id formatting).
    const { error: delErr, count: deletedCount } = await supabaseAdmin
      .from("knowledge_chunks")
      .delete({ count: "exact" })
      .eq("source_type", "lesson")
      .in("lesson_id", allowedIds);
    if (delErr) throw new Error(`Delete failed: ${delErr.message}`);

    // Insert in modest batches to keep payloads small.
    const insertRows = plan.chunks.map((c, idx) => ({
      source_type: "lesson",
      // Unique constraint is (source_type, source_id); include chunk index so
      // multiple chunks per lesson don't collide.
      source_id: `${c.lessonId}#${c.chunkIndex}`,
      path_id: c.pathId,
      module_id: c.moduleId,
      lesson_id: c.lessonId,
      title: c.title,
      content: c.content,
      embedding: allEmbeddings[idx],
      metadata: { chunk_index: c.chunkIndex, lesson_slug: c.lessonId },
    }));

    let inserted = 0;
    const INSERT_BATCH = 100;
    for (let i = 0; i < insertRows.length; i += INSERT_BATCH) {
      const slice = insertRows.slice(i, i + INSERT_BATCH);
      // pgvector column accepts string form "[n,n,...]" via supabase-js.
      const payload = slice.map((r) => ({
        ...r,
        embedding: `[${(r.embedding as number[]).join(",")}]`,
      })) as unknown as never;
      const { error: insErr } = await supabaseAdmin
        .from("knowledge_chunks")
        .insert(payload);
      if (insErr) throw new Error(`Insert failed: ${insErr.message}`);
      inserted += slice.length;
    }

    return {
      ...summary,
      dryRun: false,
      executed: true,
      deletedRows: deletedCount ?? 0,
      insertedRows: inserted,
    };
  });
