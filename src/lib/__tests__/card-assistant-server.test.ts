// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi, type Mock } from "vitest";
import { sha256, sourceChunks, CARD_EMBEDDING_MODEL, type SourceDocument } from "../card-assistant/corpus";
import { runCardAssistant, indexCardBatch } from "../card-assistant/assistant.server";
import type { CardQuestion } from "../card-assistant/runtime";

const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn(), download: vi.fn(), ai: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: mocks.from, rpc: mocks.rpc,
  storage: { from: () => ({ download: mocks.download }) } } }));
vi.mock("@/lib/ai-providers.server", () => ({ callAI: mocks.ai }));
const vector = Array.from({ length: 1536 }, (_, i) => i ? 0 : 1);
const input: CardQuestion = { scope: { area: "kids", cardId: "level-1", stepId: "1", locale: "en",
  profileId: "22222222-2222-4222-8222-222222222222" }, query: "Explain the idea", requestId: "33333333-3333-4333-8333-333333333333" };
let context: { userId: string; supabase: { rpc: Mock<(...args: unknown[]) => Promise<{ data: boolean; error: null }>> } };
let document: SourceDocument;
beforeEach(async () => {
  vi.clearAllMocks();
  const payload = { locale: "en", title: "Approved step", reading: [{ title: "Concept", text: "Explain one supported concept." }] };
  const raw = JSON.stringify(payload), hash = await sha256(raw);
  document = { area: "kids", cardId: "level-1", stepId: "1", locale: "en", kind: "kids", sourceSha256: hash, payload };
  const chunks = await sourceChunks(document);
  const query = (data: unknown) => { const chain = { select: vi.fn(() => chain), eq: vi.fn(() => chain), maybeSingle: vi.fn(async () => ({ data, error: null })) }; return chain; };
  mocks.from.mockImplementation((table: string) => query(table === "card_assistant_policy" ? { runtime_enabled: true } : { approved_sha256: hash }));
  mocks.download.mockResolvedValue({ data: new Blob([raw]), error: null });
  mocks.rpc.mockImplementation(async (name: string) => ({ data: name === "card_assistant_match" ? chunks : name === "card_assistant_existing" ? [] : 1, error: null }));
  mocks.ai.mockResolvedValue({ content: JSON.stringify({ answer: "Supported explanation", sourceIds: ["S1"] }) });
  context = { userId: "11111111-1111-4111-8111-111111111111", supabase: { rpc: vi.fn(async () => ({ data: true, error: null })) } };
  vi.stubEnv("OPENAI_API_KEY", "test-not-a-secret");
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: [{ index: 0, embedding: vector }] }), { status: 200 })));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("authenticated server adapter without provider or network calls", () => {
  it("passes exact caller profile and current scope to existing access gate", async () => {
    expect((await runCardAssistant(input, context)).status).toBe(200);
    expect(context.supabase.rpc).toHaveBeenCalledWith("card_assistant_access", {
      p_area: "kids", p_card: "level-1", p_step: "1", p_locale: "en", p_profile: input.scope.profileId,
    });
    expect(mocks.download).toHaveBeenCalledWith("level-1/lesson-01/en.json");
    expect(mocks.ai).toHaveBeenCalledOnce();
  });
  it("rejects replaced private Storage bytes even when approval and indexed hashes still match", async () => {
    mocks.download.mockResolvedValue({ data: new Blob([JSON.stringify({ ...document.payload, title: "Unapproved replacement" })]), error: null });
    expect((await runCardAssistant(input, context)).status).toBe(503);
    expect(mocks.ai).not.toHaveBeenCalled();
  });
  it("does not fetch content or call embeddings when source access is denied", async () => {
    context.supabase.rpc.mockResolvedValue({ data: false, error: null });
    expect((await runCardAssistant(input, context)).status).toBe(403);
    expect(fetch).not.toHaveBeenCalled(); expect(mocks.download).not.toHaveBeenCalled(); expect(mocks.ai).not.toHaveBeenCalled();
  });
  it("indexes unchanged sources with zero embedding calls and full transactional replacement", async () => {
    const chunks = await sourceChunks({ ...document, locale: "ar-EG", payload: { ...document.payload, locale: "ar-EG" } });
    const raw = JSON.stringify({ ...document.payload, locale: "ar-EG" }), hash = await sha256(raw);
    const actual = chunks.map(chunk => ({ ...chunk, sourceSha256: hash, embedding: vector, embeddingModel: CARD_EMBEDDING_MODEL, embeddingDimensions: 1536 }));
    mocks.from.mockImplementation(() => { const chain = { select: () => chain, eq: () => chain, maybeSingle: async () => ({ data: { approved_sha256: hash }, error: null }) }; return chain; });
    mocks.download.mockResolvedValue({ data: new Blob([raw]), error: null });
    mocks.rpc.mockImplementation(async (name: string) => ({ data: name === "card_assistant_existing" ? actual : 1, error: null }));
    const result = await indexCardBatch({ area: "kids", cardId: "level-1", offset: 0, batchSize: 1 }, context);
    expect(result).toMatchObject({ embedded: 0, reused: 1, synchronized: 1 });
    expect(fetch).not.toHaveBeenCalled();
    const sync = mocks.rpc.mock.calls.find(([name]) => name === "card_assistant_sync_source")!;
    expect(sync[1].p_rows).toHaveLength(1);
    expect(sync[1].p_source_sha).toBe(hash);
  });
  it("requires a current admin check before any indexing source read", async () => {
    context.supabase.rpc.mockResolvedValue({ data: false, error: null });
    await expect(indexCardBatch({ area: "kids", cardId: "level-1", offset: 0, batchSize: 1 }, context)).rejects.toThrow("ADMIN_REQUIRED");
    expect(mocks.download).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
});
