// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { CARD_REGISTRY, validateCardRegistry } from "../card-assistant/registry";
import { sourceChunks, sha256, technicalSourceJson, planChunkUpdates, CARD_EMBEDDING_MODEL, type SourceDocument } from "../card-assistant/corpus";
import { runCardQuestion, type CardAssistantDependencies, type CardQuestion } from "../card-assistant/runtime";

const vector = () => Array.from({ length: 1536 }, (_, i) => i ? 0 : 1);
const input: CardQuestion = { scope: { area: "kids", cardId: "level-1", stepId: "1", locale: "en", profileId: "profile" },
  query: "Explain the next step", requestId: "request" };
const source = (stepId = "3"): SourceDocument => ({ area: "kids", cardId: "level-1", stepId, locale: "en", kind: "kids",
  sourceSha256: "a".repeat(64), payload: { title: "Safe lesson", locale: "en", reading: [{ title: "Learn", text: "An approved concept." }],
    quiz: [{ question: "Test", correct: 3, explanation: "SECRET_KEY" }], educatorNotes: "PRIVATE_NOTES", production: "PRIVATE_PRODUCTION" } });
async function fixture() {
  const chunks = await sourceChunks(source());
  const deps: CardAssistantDependencies = { enabled: vi.fn(async () => true), access: vi.fn(async () => true),
    takeQuestion: vi.fn(async () => true), embed: vi.fn(async () => vector()), retrieve: vi.fn(async () => chunks),
    source: vi.fn(async () => source()), generate: vi.fn(async () => JSON.stringify({ answer: "An explanation.", sourceIds: ["S1"] })) };
  return { deps, chunks };
}
describe("shared card registry and safe corpus", () => {
  it("seeds only real Kids cards and all 80 furniture steps", () => {
    expect(CARD_REGISTRY.map(c => [c.area, c.id, c.steps.length])).toEqual([
      ["kids", "level-1", 12], ["kids", "level-2", 12], ["kids", "level-3", 12], ["technical", "furniture", 80],
    ]);
  });
  it("rejects a future card claiming another card's source and duplicate steps", () => {
    expect(() => validateCardRegistry([...CARD_REGISTRY, { ...CARD_REGISTRY[3], id: "another-card" }])).toThrow("COLLISION");
    const card = CARD_REGISTRY[0];
    expect(() => validateCardRegistry([{ ...card, steps: [...card.steps, card.steps[0]] }])).toThrow("COLLISION");
  });
  it("never embeds private notes or assessment solutions", async () => {
    const text = (await sourceChunks(source())).map(c => c.content).join("\n");
    expect(text).toContain("approved concept");
    expect(text).not.toMatch(/SECRET|PRIVATE|correct/);
  });
  it("requires exact Technical import hash, locale and step", async () => {
    const payload = { id: "M01-L02", locale: "en", title: "Survey", sections: [{ title: "Check", text: "Measure the wall." }] };
    const s: SourceDocument = { area: "technical", cardId: "furniture", stepId: "M01-L02", locale: "en", kind: "lesson", payload,
      sourceSha256: await sha256(technicalSourceJson(payload)) };
    expect(await sourceChunks(s)).toHaveLength(1);
    await expect(sourceChunks({ ...s, payload: { ...payload, title: "Unapproved change" } })).rejects.toThrow("APPROVAL");
    await expect(sourceChunks({ ...s, locale: "ar-EG" })).rejects.toThrow("LOCALE");
    await expect(sourceChunks({ ...s, stepId: "M01-L03" })).rejects.toThrow("STEP");
  });
  it("reuses unchanged text only with exact model/dimensions and replaces provenance", async () => {
    const [chunk] = await sourceChunks(source());
    const old = { ...chunk, embedding: vector(), embeddingModel: CARD_EMBEDDING_MODEL, embeddingDimensions: 1536 };
    const changed = { ...chunk, sourceSha256: "b".repeat(64), payloadSha256: "c".repeat(64) };
    expect(planChunkUpdates([changed], [old])[0]).toEqual({ chunk: changed, embedding: vector() });
    expect(planChunkUpdates([{ ...changed, chunkId: "reading-2-1" }], [old])[0].embedding).toEqual(vector());
    expect(planChunkUpdates([changed], [{ ...old, embeddingModel: "other" }])[0].embedding).toBeNull();
    expect(planChunkUpdates([changed], [{ ...old, embedding: [0] }])[0].embedding).toBeNull();
    expect(planChunkUpdates([{ ...changed, content: "Changed" }], [old])[0].embedding).toBeNull();
    expect(planChunkUpdates([], [old])).toEqual([]);
  });
});
describe("whole-card grounded runtime", () => {
  it("answers from another authorized step in the same card, with server citations", async () => {
    const { deps } = await fixture();
    expect(await runCardQuestion(input, deps)).toMatchObject({ status: 200, citations: [{ id: "S1", stepId: "3", sourceId: "reading-1-1" }] });
    expect(deps.access).toHaveBeenCalledWith("3");
    expect(deps.source).toHaveBeenCalledTimes(2);
  });
  it.each(["disabled", "access", "limit"])("does not call paid providers when %s", async mode => {
    const { deps } = await fixture();
    if (mode === "disabled") deps.enabled = vi.fn(async () => false);
    if (mode === "access") deps.access = vi.fn(async () => false);
    if (mode === "limit") deps.takeQuestion = vi.fn(async () => false);
    const reply = await runCardQuestion(input, deps);
    expect(reply.status).toBe(mode === "disabled" ? 503 : mode === "access" ? 403 : 429);
    expect(deps.embed).not.toHaveBeenCalled(); expect(deps.generate).not.toHaveBeenCalled();
  });
  it.each(["enabled", "access", "takeQuestion"] as const)("fails closed for malformed truthy %s decisions", async gate => {
    const { deps } = await fixture();
    deps[gate] = vi.fn(async () => "false" as unknown as boolean);
    expect((await runCardQuestion(input, deps)).status).not.toBe(200);
    expect(deps.embed).not.toHaveBeenCalled();
  });
  it.each(["card", "locale", "hash", "content", "denied"])("excludes invalid %s evidence before generation", async mode => {
    const { deps, chunks } = await fixture();
    if (mode === "card") deps.retrieve = vi.fn(async () => [{ ...chunks[0], cardId: "level-2" }]);
    if (mode === "locale") deps.retrieve = vi.fn(async () => [{ ...chunks[0], locale: "ar-EG" as const }]);
    if (mode === "hash") deps.source = vi.fn(async () => ({ ...source(), sourceSha256: "b".repeat(64) }));
    if (mode === "content") deps.source = vi.fn(async () => ({ ...source(), payload: { ...source().payload, title: "Changed" } }));
    if (mode === "denied") deps.access = vi.fn(async step => step === "1");
    expect((await runCardQuestion(input, deps)).status).not.toBe(200);
    expect(deps.generate).not.toHaveBeenCalled();
  });
  it("suppresses in-flight answer after a source is removed", async () => {
    const { deps } = await fixture();
    let removed = false;
    deps.source = vi.fn(async () => removed ? null : source());
    deps.generate = vi.fn(async () => { removed = true; return JSON.stringify({ answer: "Old", sourceIds: ["S1"] }); });
    expect(await runCardQuestion(input, deps)).toEqual({ status: 422, error: "CARD_GROUNDING_REQUIRED" });
  });
  it("rejects invented citations, and sends bounded history as untrusted context", async () => {
    const { deps } = await fixture();
    deps.generate = vi.fn(async () => JSON.stringify({ answer: "Invented", sourceIds: ["FOREIGN"] }));
    expect((await runCardQuestion({ ...input, history: [{ question: "q".repeat(900), answer: "a".repeat(2000) }] }, deps)).status).toBe(503);
    const payload = JSON.parse(vi.mocked(deps.generate).mock.calls[0][1]);
    expect(payload.previousExchanges[0].question).toHaveLength(500);
    expect(payload.previousExchanges[0].answer).toHaveLength(1200);
  });
});
