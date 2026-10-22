import { callAI } from "@/lib/ai-providers.server";
import { CARD_EMBEDDING_MODEL, CARD_EMBEDDING_DIMENSIONS, sha256, sourceChunks, planChunkUpdates, validVector,
  type SourceDocument, type CardChunk, type IndexedChunk } from "./corpus";
import { registeredCard, registeredStep } from "./registry";
import { runCardQuestion, type CardQuestion } from "./runtime";
import type { SupportedLocale } from "@/lib/locale/types";

type RpcClient = { rpc(name: never, body: never): PromiseLike<{ data: unknown; error: unknown }> };
type Context = { userId: string; supabase: RpcClient };
async function rpc<T>(client: RpcClient, name: string, body: Record<string, unknown>): Promise<T> {
  const result = await client.rpc(name as never, body as never);
  if (result.error) throw new Error("CARD_SERVICE_UNAVAILABLE");
  return result.data as T;
}
async function adminClient() { return (await import("@/integrations/supabase/client.server")).supabaseAdmin; }

async function embeddings(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  if (texts.length > 80) throw new Error("CARD_BATCH_TOO_LARGE");
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("CARD_EMBEDDING_UNAVAILABLE");
  const response = await fetch("https://api.openai.com/v1/embeddings", { method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: CARD_EMBEDDING_MODEL, dimensions: CARD_EMBEDDING_DIMENSIONS, input: texts }),
    signal: AbortSignal.timeout(45000) });
  if (!response.ok) { await response.body?.cancel(); throw new Error("CARD_EMBEDDING_UNAVAILABLE"); }
  const result = await response.json() as { data?: { index: number; embedding: number[] }[] };
  const rows = result.data?.slice().sort((a, b) => a.index - b.index);
  if (!rows || rows.length !== texts.length || rows.some((row, i) => row.index !== i || !validVector(row.embedding)))
    throw new Error("CARD_EMBEDDING_UNAVAILABLE");
  return rows.map(row => row.embedding);
}

/** Read the current protected source, never browser lesson data or cached chunks. */
async function loadSource(area: "kids" | "technical", cardId: string, stepId: string, locale: SupportedLocale): Promise<SourceDocument | null> {
  const step = registeredStep(area, cardId, stepId);
  const admin = await adminClient();
  if (step.source.adapter === "kids") {
    const approval = await admin.from("kids_content_approvals" as never).select("approved_sha256")
      .eq("level_id", step.source.levelId).eq("lesson_number", step.source.lessonNumber).eq("locale", locale).maybeSingle();
    if (approval.error) throw new Error("CARD_SOURCE_UNAVAILABLE");
    if (!approval.data) return null;
    const hash = (approval.data as { approved_sha256: string }).approved_sha256;
    const path = `${step.source.levelId}/lesson-${String(step.source.lessonNumber).padStart(2, "0")}/${locale}.json`;
    const object = await admin.storage.from("kids-lesson-content").download(path);
    if (object.error || !object.data || object.data.size > 200000) throw new Error("CARD_SOURCE_UNAVAILABLE");
    const bytes = new Uint8Array(await object.data.arrayBuffer());
    if (await sha256(bytes) !== hash) throw new Error("CARD_SOURCE_APPROVAL_MISMATCH");
    const payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as Record<string, unknown>;
    return { area, cardId, stepId, locale, sourceSha256: hash, payload, kind: "kids" };
  }
  const row = await admin.from("technical_lesson_content" as never).select("lesson_id,locale,kind,source_sha256,payload")
    .eq("lesson_id", step.source.lessonId).eq("locale", locale).maybeSingle();
  if (row.error) throw new Error("CARD_SOURCE_UNAVAILABLE");
  if (!row.data) return null;
  const source = row.data as { lesson_id: string; locale: string; kind: "lesson" | "cabinet"; source_sha256: string; payload: Record<string, unknown> };
  if (source.lesson_id !== step.source.lessonId || source.locale !== locale || !["lesson", "cabinet"].includes(source.kind)) throw new Error("CARD_SOURCE_MISMATCH");
  // sourceChunks verifies the importer's canonical hash and independently hashes
  // the current payload, including fields deliberately excluded from retrieval.
  return { area, cardId, stepId, locale, sourceSha256: source.source_sha256, payload: source.payload, kind: source.kind };
}
function scopeArgs(data: CardQuestion) {
  return { p_area: data.scope.area, p_card: data.scope.cardId, p_step: data.scope.stepId,
    p_locale: data.scope.locale, p_profile: data.scope.profileId ?? null };
}
export async function runCardAssistant(data: CardQuestion, context: Context) {
  const admin = await adminClient();
  const args = scopeArgs(data);
  return runCardQuestion(data, {
    enabled: async () => {
      const result = await admin.from("card_assistant_policy" as never).select("runtime_enabled")
        .eq("area", data.scope.area).eq("card_id", data.scope.cardId).maybeSingle();
      return !result.error && (result.data as { runtime_enabled?: boolean } | null)?.runtime_enabled === true;
    },
    access: stepId => rpc<boolean>(context.supabase, "card_assistant_access", { ...args, p_step: stepId }),
    takeQuestion: () => rpc<boolean>(context.supabase, "card_assistant_take_question", { ...args, p_request: data.requestId }),
    embed: async query => (await embeddings([query]))[0],
    retrieve: vector => rpc<CardChunk[]>(admin, "card_assistant_match", {
      p_area: data.scope.area, p_card: data.scope.cardId, p_locale: data.scope.locale, p_embedding: JSON.stringify(vector), p_limit: 6,
    }),
    source: stepId => loadSource(data.scope.area, data.scope.cardId, stepId, data.scope.locale),
    generate: async (system, user) => (await callAI({ model: "openai/gpt-4.1-mini-2025-04-14", temperature: 0.2,
      maxTokens: 1800, responseFormat: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: user }] })).content,
  });
}

async function requireAdmin(context: Context) {
  if (await rpc<boolean>(context.supabase, "card_assistant_review_allowed", {}) !== true) throw new Error("CARD_ADMIN_REQUIRED");
}
export async function indexCardBatch(data: { area: "kids" | "technical"; cardId: string; offset: number; batchSize: number }, context: Context) {
  return indexCardBatchWithAuthority(data, { check: () => requireAdmin(context) });
}
/** Server-only shared preparation core. Interactive requests keep their own
 * administrator checks; automatic work supplies a durable, service-owned lease. */
export async function indexCardBatchWithAuthority(data: { area: "kids" | "technical"; cardId: string; offset: number; batchSize: number }, authority: {
  check: () => Promise<void>;
  beforeEmbedding?: () => Promise<void>;
  sources?: { stepId: string; locale: string; sourceSha: string }[];
}) {
  await authority.check();
  const card = registeredCard(data.area, data.cardId);
  const locales: SupportedLocale[] = ["ar-EG", "ar-MSA", "ar-Gulf", "en"];
  const scopes = card.steps.flatMap(step => locales.map(locale => ({ stepId: step.id, locale })));
  const admin = await adminClient();
  let embedded = 0, reused = 0, synchronized = 0;
  const proofs: { stepId: string; locale: string; sourceSha: string; chunks: { id: string; payloadSha: string; contentSha: string }[] }[] = [];
  for (const scope of scopes.slice(data.offset, data.offset + data.batchSize)) {
    const source = await loadSource(data.area, data.cardId, scope.stepId, scope.locale);
    if (authority.sources && !authority.sources.some(expected => expected.stepId === scope.stepId &&
      expected.locale === scope.locale && expected.sourceSha === source?.sourceSha256)) throw new Error("AUTOMATION_SOURCE_CHANGED");
    const chunks = source ? await sourceChunks(source) : [];
    const old = await rpc<IndexedChunk[]>(admin, "card_assistant_existing", {
      p_area: data.area, p_card: data.cardId, p_step: scope.stepId, p_locale: scope.locale,
    });
    const plan = planChunkUpdates(chunks, old);
    const fresh = plan.filter(item => !item.embedding);
    if (fresh.length) await authority.beforeEmbedding?.();
    const vectors = await embeddings(fresh.map(item => item.chunk.content));
    let cursor = 0;
    const rows = plan.map(item => ({ ...item.chunk, embedding: JSON.stringify(item.embedding ?? vectors[cursor++]),
      embeddingModel: CARD_EMBEDDING_MODEL, embeddingDimensions: CARD_EMBEDDING_DIMENSIONS }));
    await authority.check();
    // One transaction verifies current source identity and replaces only this
    // complete source scope, deleting removed sections without touching others.
    await rpc<number>(admin, "card_assistant_sync_source", { p_area: data.area, p_card: data.cardId, p_step: scope.stepId,
      p_locale: scope.locale, p_source_sha: source?.sourceSha256 ?? null, p_payload_sha: chunks[0]?.payloadSha256 ?? null,
      p_payload: source?.payload ?? null, p_rows: rows });
    embedded += fresh.length; reused += plan.length - fresh.length; synchronized++;
    if (source) proofs.push({ stepId: scope.stepId, locale: scope.locale, sourceSha: source.sourceSha256,
      chunks: chunks.map(chunk => ({ id: chunk.chunkId, payloadSha: chunk.payloadSha256, contentSha: chunk.contentSha256 })) });
  }
  return { area: data.area, cardId: data.cardId, synchronized, embedded, reused, proofs,
    nextOffset: data.offset + data.batchSize < scopes.length ? data.offset + data.batchSize : null };
}
