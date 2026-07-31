import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  handleAssistantRuntimeRequest,
  type AssistantRuntimeDeps,
  type BillingRpcResult,
  type SemanticChunk,
} from "../../../supabase/functions/assistant-runtime/handler.ts";
import { CONTENT_FREEZE_SHA, RAG_INDEX_VERSION } from "@/lib/rag/constants";
import { sha256CanonicalHex } from "@/lib/rag/canonical-checksum";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const FIXED_NOW = new Date("2026-01-01T00:00:00.000Z");
const SAMPLE_CHUNK_ID = "en/analyst-m1-l1-from-automation-to-insight/s0/c0";
const HANDLER_SRC = readFileSync(
  path.join(REPO_ROOT, "supabase/functions/assistant-runtime/handler.ts"),
  "utf8",
);
const INDEX_SRC = readFileSync(
  path.join(REPO_ROOT, "supabase/functions/assistant-runtime/index.ts"),
  "utf8",
);

type ChunkArtifact = {
  chunkId: string;
  lessonId: string;
  locale: string;
  moduleId: string;
  trackId: string;
  sectionIndex: number;
  sectionRole: string;
  chunkIndex: number;
  contentType: string;
  displayText: string;
  textChecksum: string;
  packagePath: string;
  productionRoute: string | null;
};

type PackageEntry = {
  lessonId: string;
  locale: string;
  packagePath: string;
  packageChecksum: string;
  productionRoute: string | null;
};

function loadRegisteredSample(chunkId = SAMPLE_CHUNK_ID): SemanticChunk {
  const chunks = JSON.parse(
    readFileSync(path.join(REPO_ROOT, "artifacts/rag/chunks.json"), "utf8"),
  ) as ChunkArtifact[];
  const packages = (
    JSON.parse(
      readFileSync(path.join(REPO_ROOT, "artifacts/rag/package-manifest.json"), "utf8"),
    ) as { packages: PackageEntry[] }
  ).packages;
  const hit = chunks.find((c) => c.chunkId === chunkId);
  if (!hit) throw new Error(`missing chunk ${chunkId}`);
  const pkg = packages.find((p) => p.packagePath === hit.packagePath);
  if (!pkg) throw new Error(`missing package for ${chunkId}`);
  const recomputed = sha256CanonicalHex(hit.displayText);
  if (recomputed !== hit.textChecksum) {
    throw new Error(`artifact content checksum drift for ${chunkId}`);
  }
  return {
    id: "1",
    sourceId: hit.chunkId,
    locale: hit.locale,
    lessonId: hit.lessonId,
    moduleId: hit.moduleId,
    pathId: hit.trackId,
    title: hit.lessonId,
    content: hit.displayText,
    similarity: 0.82,
    packagePath: hit.packagePath,
    sourceSha: CONTENT_FREEZE_SHA,
    packageChecksum: pkg.packageChecksum,
    chunkChecksum: hit.textChecksum,
    contentVersion: "2026-06-18.1-polished",
    indexVersion: RAG_INDEX_VERSION,
    sectionIndex: hit.sectionIndex,
    sectionRole: hit.sectionRole,
    chunkPosition: hit.chunkIndex,
    contentType: hit.contentType,
    productionRoute: hit.productionRoute,
  };
}

function loadArEgSample(): SemanticChunk {
  const chunks = JSON.parse(
    readFileSync(path.join(REPO_ROOT, "artifacts/rag/chunks.json"), "utf8"),
  ) as ChunkArtifact[];
  const ar = chunks.find((c) => c.locale === "ar-EG");
  if (!ar) throw new Error("no ar-EG chunk in artifacts");
  return loadRegisteredSample(ar.chunkId);
}

const RESERVATION_ID = "aaaaaaaa-0000-4000-8000-000000000001";

/** Realistic default billing mock: reserve/register/finalize/commit/release all succeed. */
function createDefaultBillingRpc(): AssistantRuntimeDeps["billingRpc"] {
  let attemptIndex = 0;
  return vi.fn(async (fnName: string, body: Record<string, unknown>): Promise<BillingRpcResult> => {
    switch (fnName) {
      case "reserve_learner_ai_access":
        return {
          ok: true,
          data: { reservation_id: RESERVATION_ID, status: "reserved", idempotent_replay: false },
        };
      case "register_provider_attempt":
        attemptIndex += 1;
        return {
          ok: true,
          data: {
            reservation_id: body.p_reservation_id,
            attempt_index: attemptIndex,
            attempt_status: "registered",
            quota_committed: attemptIndex === 1,
            idempotent_replay: false,
          },
        };
      case "finalize_provider_attempt":
        return {
          ok: true,
          data: {
            reservation_id: body.p_reservation_id,
            attempt_index: body.p_attempt_index,
            attempt_status: body.p_attempt_status,
            idempotent_replay: false,
          },
        };
      case "commit_ai_quota":
        return { ok: true, data: { reservation_id: body.p_reservation_id, action: "committed" } };
      case "release_ai_quota":
        return { ok: true, data: { released: true, idempotent_replay: false } };
      default:
        return { ok: false, status: 404, error: `unknown billing rpc: ${fnName}` };
    }
  });
}

function buildDeps(overrides: Partial<AssistantRuntimeDeps> = {}): AssistantRuntimeDeps {
  return {
    verifyJwt: vi.fn(async () => ({ ok: true as const, userId: "user-1" })),
    consumeRateLimit: vi.fn(async () => ({
      allowed: true,
      resetAt: new Date(FIXED_NOW.getTime() + 3_600_000).toISOString(),
    })),
    billingRpc: createDefaultBillingRpc(),
    embedQuery: vi.fn(async () => [0.1, 0.2, 0.3]),
    localeSemanticRetrieve: vi.fn(async () => ({
      ok: true as const,
      chunks: [] as SemanticChunk[],
    })),
    callLlm: vi.fn(async () => ({ ok: true as const, answer: "default answer" })),
    env: {
      LOVABLE_API_KEY: "lovable-key",
      OPENAI_API_KEY: "openai-key",
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    },
    now: () => FIXED_NOW,
    ...overrides,
  };
}

function buildRequest(
  body: unknown,
  options: { method?: string; skipAuth?: boolean; noBody?: boolean } = {},
): Request {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!options.skipAuth) headers.Authorization = "Bearer test-token";
  return new Request("https://masaarat.ai/functions/v1/assistant-runtime", {
    method: options.method ?? "POST",
    headers,
    body: options.noBody ? undefined : JSON.stringify(body),
  });
}

function callCounts(deps: AssistantRuntimeDeps) {
  return {
    embed: (deps.embedQuery as ReturnType<typeof vi.fn>).mock.calls.length,
    retrieve: (deps.localeSemanticRetrieve as ReturnType<typeof vi.fn>).mock.calls.length,
    llm: (deps.callLlm as ReturnType<typeof vi.fn>).mock.calls.length,
    rateLimit: (deps.consumeRateLimit as ReturnType<typeof vi.fn>).mock.calls.length,
  };
}

function billingCallNames(deps: AssistantRuntimeDeps): string[] {
  return (deps.billingRpc as ReturnType<typeof vi.fn>).mock.calls.map(
    (call: unknown[]) => call[0] as string,
  );
}

async function runWithChunks(chunks: SemanticChunk[]) {
  const deps = buildDeps({
    localeSemanticRetrieve: vi.fn(async () => ({ ok: true as const, chunks })),
  });
  const res = await handleAssistantRuntimeRequest(
    buildRequest({ query: "what is AI?", learnerContext: { locale: "en" } }),
    deps,
  );
  const json = await res.json();
  const llmMock = deps.callLlm as ReturnType<typeof vi.fn>;
  const llmCall = llmMock.mock.calls[0] as [string, string] | undefined;
  return { deps, res, json, systemPrompt: llmCall?.[0] ?? "", userPrompt: llmCall?.[1] ?? "" };
}

describe("handleAssistantRuntimeRequest — transport basics", () => {
  it("responds to OPTIONS without auth", async () => {
    const deps = buildDeps();
    const res = await handleAssistantRuntimeRequest(
      buildRequest(undefined, { method: "OPTIONS", noBody: true }),
      deps,
    );
    expect(res.status).toBe(200);
    expect(callCounts(deps)).toEqual({ embed: 0, retrieve: 0, llm: 0, rateLimit: 0 });
    expect(deps.billingRpc as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it("rejects non-POST methods", async () => {
    const deps = buildDeps();
    const res = await handleAssistantRuntimeRequest(
      buildRequest(undefined, { method: "GET", noBody: true }),
      deps,
    );
    expect(res.status).toBe(405);
  });

  it("rejects unauthenticated requests before touching providers", async () => {
    const deps = buildDeps({ verifyJwt: vi.fn(async () => ({ ok: false as const })) });
    const res = await handleAssistantRuntimeRequest(
      buildRequest({ query: "hi", learnerContext: { locale: "en" } }, { skipAuth: true }),
      deps,
    );
    expect(res.status).toBe(401);
    expect(callCounts(deps)).toEqual({ embed: 0, retrieve: 0, llm: 0, rateLimit: 0 });
    expect(deps.billingRpc as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });
});

describe("handleAssistantRuntimeRequest — integrity cases 1–24", () => {
  const sample = loadRegisteredSample();
  const fabricatedPkg = "c".repeat(64);
  const fabricatedChunk = "d".repeat(64);

  it("1: fully registered chunk enters authoritative subset, evidence, citations, metadata", async () => {
    const { json, userPrompt, res } = await runWithChunks([sample]);
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.citations).toHaveLength(1);
    expect(json.citations[0].chunkId).toBe(sample.sourceId);
    expect(json.citations[0].authoritative).toBe(true);
    expect(json.retrieval.semanticCount).toBe(1);
    expect(userPrompt).toContain(sample.sourceId);
    expect(userPrompt).toContain(sample.content.slice(0, 40));
  });

  it("2: evidence and citation originate from the same registered chunk", async () => {
    const { json, userPrompt } = await runWithChunks([sample]);
    expect(json.citations[0].chunkId).toBe(sample.sourceId);
    expect(userPrompt).toContain(`id=${sample.sourceId}`);
    expect(json.citations[0].chunkChecksum).toBe(sample.chunkChecksum);
  });

  it("3: fabricated package checksum is rejected — fail-closed, no LLM", async () => {
    const { json, deps, res } = await runWithChunks([
      { ...sample, packageChecksum: fabricatedPkg },
    ]);
    expect(res.status).toBe(422);
    expect(json.ok).toBe(false);
    expect(json.reason).toBe("insufficient_grounding");
    expect(json.citations).toHaveLength(0);
    expect(json.retrieval.nonAuthoritativeExcluded).toBe(1);
    expect(callCounts(deps).llm).toBe(0);
    expect(json.answer).toBeUndefined();
  });

  it("4: fabricated chunk checksum is rejected — fail-closed, no LLM", async () => {
    const { json, deps, res } = await runWithChunks([
      { ...sample, chunkChecksum: fabricatedChunk },
    ]);
    expect(res.status).toBe(422);
    expect(json.ok).toBe(false);
    expect(json.citations).toHaveLength(0);
    expect(json.retrieval.nonAuthoritativeExcluded).toBe(1);
    expect(callCounts(deps).llm).toBe(0);
  });

  it("5: content tamper with old checksum is rejected — fail-closed, no LLM", async () => {
    const { json, deps, res } = await runWithChunks([
      { ...sample, content: `${sample.content}\nTAMPERED` },
    ]);
    expect(res.status).toBe(422);
    expect(json.ok).toBe(false);
    expect(json.citations).toHaveLength(0);
    expect(callCounts(deps).llm).toBe(0);
    expect(JSON.stringify(json)).not.toContain("TAMPERED");
  });

  it("6: recomputed checksum mismatch vs registered is rejected — fail-closed", async () => {
    const altered = "entirely different content for mismatch";
    const { json, deps, res } = await runWithChunks([
      {
        ...sample,
        content: altered,
        chunkChecksum: sha256CanonicalHex(altered),
      },
    ]);
    expect(res.status).toBe(422);
    expect(json.ok).toBe(false);
    expect(json.citations).toHaveLength(0);
    expect(callCounts(deps).llm).toBe(0);
  });

  it("7: valid checksums with unknown chunk ID are rejected — fail-closed", async () => {
    const { json, deps, res } = await runWithChunks([
      { ...sample, sourceId: "en/analyst-m1-l1-from-automation-to-insight/s0/c999" },
    ]);
    expect(res.status).toBe(422);
    expect(json.ok).toBe(false);
    expect(json.citations).toHaveLength(0);
    expect(callCounts(deps).llm).toBe(0);
  });

  it("8: valid chunk ID attached to wrong package is rejected — fail-closed", async () => {
    const { json, deps, res } = await runWithChunks([
      {
        ...sample,
        packagePath: "src/lib/locale-lessons/en/lessons/intro-m1-l1-what-is-ai.json",
      },
    ]);
    expect(res.status).toBe(422);
    expect(json.ok).toBe(false);
    expect(json.citations).toHaveLength(0);
    expect(callCounts(deps).llm).toBe(0);
  });

  it("9: valid chunk ID attached to wrong lesson is rejected — fail-closed", async () => {
    const { json, deps, res } = await runWithChunks([
      { ...sample, lessonId: "intro-m1-l1-what-is-ai" },
    ]);
    expect(res.status).toBe(422);
    expect(json.ok).toBe(false);
    expect(json.citations).toHaveLength(0);
    expect(callCounts(deps).llm).toBe(0);
  });

  it("10: valid chunk ID attached to wrong locale is rejected — fail-closed", async () => {
    const { json, deps, res } = await runWithChunks([
      {
        ...sample,
        locale: "ar-MSA",
        packagePath: (sample.packagePath ?? "").replace("/en/", "/ar-MSA/"),
      },
    ]);
    expect(res.status).toBe(422);
    expect(json.ok).toBe(false);
    expect(json.citations).toHaveLength(0);
    expect(json.retrieval.crossLocaleLeakage).toBe(1);
    expect(callCounts(deps).llm).toBe(0);
  });

  it("11: wrong sourceSha is rejected — fail-closed", async () => {
    const { json, deps, res } = await runWithChunks([{ ...sample, sourceSha: "e".repeat(64) }]);
    expect(res.status).toBe(422);
    expect(json.ok).toBe(false);
    expect(json.citations).toHaveLength(0);
    expect(callCounts(deps).llm).toBe(0);
  });

  it("12: wrong indexVersion is rejected — fail-closed", async () => {
    const { json, deps, res } = await runWithChunks([{ ...sample, indexVersion: "rag-index-v0" }]);
    expect(res.status).toBe(422);
    expect(json.ok).toBe(false);
    expect(json.citations).toHaveLength(0);
    expect(callCounts(deps).llm).toBe(0);
  });

  it("13: malformed sourceSha is rejected — fail-closed", async () => {
    const { json, deps, res } = await runWithChunks([{ ...sample, sourceSha: "abc123" }]);
    expect(res.status).toBe(422);
    expect(json.ok).toBe(false);
    expect(json.citations).toHaveLength(0);
    expect(callCounts(deps).llm).toBe(0);
  });

  it("14: malformed package checksum is rejected — fail-closed", async () => {
    const { json, deps, res } = await runWithChunks([{ ...sample, packageChecksum: "abc123" }]);
    expect(res.status).toBe(422);
    expect(json.ok).toBe(false);
    expect(json.citations).toHaveLength(0);
    expect(callCounts(deps).llm).toBe(0);
  });

  it("15: malformed chunk checksum is rejected — fail-closed", async () => {
    const { json, deps, res } = await runWithChunks([{ ...sample, chunkChecksum: "def456" }]);
    expect(res.status).toBe(422);
    expect(json.ok).toBe(false);
    expect(json.citations).toHaveLength(0);
    expect(callCounts(deps).llm).toBe(0);
  });

  it("16: uppercase digest format is rejected — fail-closed", async () => {
    const { json, deps, res } = await runWithChunks([
      { ...sample, chunkChecksum: sample.chunkChecksum!.toUpperCase() },
    ]);
    expect(res.status).toBe(422);
    expect(json.ok).toBe(false);
    expect(json.citations).toHaveLength(0);
    expect(callCounts(deps).llm).toBe(0);
  });

  it("17: duplicate/ambiguous registration fails closed at lookup build (source check)", () => {
    expect(HANDLER_SRC).toContain("authoritative-corpus-lookup.json");
    expect(HANDLER_SRC).toContain("isValidSha256Digest");
  });

  it("18: cross-locale manifest attachment is rejected — fail-closed, no LLM", async () => {
    const { json, deps, res } = await runWithChunks([
      {
        ...sample,
        locale: "ar-Gulf",
        packagePath:
          "src/lib/locale-lessons/ar-Gulf/lessons/analyst-m1-l1-from-automation-to-insight.json",
        content: "CROSS_LOCALE_MARKER",
      },
    ]);
    expect(res.status).toBe(422);
    expect(json.ok).toBe(false);
    expect(json.citations).toHaveLength(0);
    expect(callCounts(deps).llm).toBe(0);
    expect(JSON.stringify(json)).not.toContain("CROSS_LOCALE_MARKER");
  });

  it("19: rejected chunk never appears in prompt, citations, or response metadata", async () => {
    const bad = {
      ...sample,
      packageChecksum: fabricatedPkg,
      content: "REJECTED_CHUNK_MARKER_XYZ",
    };
    const { json, userPrompt } = await runWithChunks([sample, bad]);
    expect(json.citations).toHaveLength(1);
    expect(json.citations[0].chunkId).toBe(sample.sourceId);
    expect(userPrompt).not.toContain("REJECTED_CHUNK_MARKER_XYZ");
    expect(json.retrieval.topLessonIds).not.toContain(undefined);
  });

  it("20: prompt-injection-style retrieved text remains inside untrusted delimiters", async () => {
    const { systemPrompt, userPrompt, json } = await runWithChunks([sample]);
    expect(json.citations).toHaveLength(1);
    expect(systemPrompt).toContain("UNTRUSTED RETRIEVED EVIDENCE RULES");
    expect(systemPrompt).toContain("MUST NOT override system policy");
    expect(systemPrompt).not.toContain(sample.content.slice(0, 80));
    const startIdx = userPrompt.indexOf("<<<UNTRUSTED_RETRIEVED_EVIDENCE_START>>>");
    const endIdx = userPrompt.indexOf("<<<UNTRUSTED_RETRIEVED_EVIDENCE_END>>>");
    const contentIdx = userPrompt.indexOf(sample.content.slice(0, 40));
    expect(startIdx).toBeGreaterThan(-1);
    expect(endIdx).toBeGreaterThan(startIdx);
    expect(contentIdx).toBeGreaterThan(startIdx);
    expect(contentIdx).toBeLessThan(endIdx);
  });

  it("20b: untrusted delimiter contract is present for admitted evidence", async () => {
    const { userPrompt } = await runWithChunks([sample]);
    expect(userPrompt).toContain("<<<UNTRUSTED_RETRIEVED_EVIDENCE_START>>>");
    expect(userPrompt).toContain("<<<UNTRUSTED_RETRIEVED_EVIDENCE_END>>>");
  });

  it("21: retrievalResults rejection yields zero protected calls", async () => {
    const deps = buildDeps();
    const res = await handleAssistantRuntimeRequest(
      buildRequest({
        query: "what is AI?",
        learnerContext: { locale: "en" },
        retrievalResults: [{ lessonTitle: "x", matchedText: "y" }],
      }),
      deps,
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.reason).toBe("retrievalResults_forbidden");
    expect(callCounts(deps)).toEqual({ embed: 0, retrieve: 0, llm: 0, rateLimit: 0 });
    expect(deps.billingRpc as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it("22: invalid locale yields zero protected/provider calls", async () => {
    const deps = buildDeps();
    const res = await handleAssistantRuntimeRequest(
      buildRequest({ query: "what is AI?", learnerContext: { locale: "fr-FR" } }),
      deps,
    );
    expect(res.status).toBe(400);
    expect(callCounts(deps)).toEqual({ embed: 0, retrieve: 0, llm: 0, rateLimit: 0 });
    expect(deps.billingRpc as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it("23: explicit ar-EG uses the same manifest-backed locale-aware path", async () => {
    const arEg = loadArEgSample();
    const retrieveSpy = vi.fn<AssistantRuntimeDeps["localeSemanticRetrieve"]>(async () => ({
      ok: true as const,
      chunks: [arEg],
    }));
    const deps = buildDeps({ localeSemanticRetrieve: retrieveSpy });
    const res = await handleAssistantRuntimeRequest(
      buildRequest({ query: "الذكاء الاصطناعي إيه؟", learnerContext: { locale: "ar-EG" } }),
      deps,
    );
    expect(res.status).toBe(200);
    expect(retrieveSpy).toHaveBeenCalledTimes(1);
    expect(retrieveSpy.mock.calls[0]?.[1]).toBe("ar-EG");
    const json = await res.json();
    expect(json.retrieval.locale).toBe("ar-EG");
    expect(json.citations).toHaveLength(1);
    expect(json.citations[0].locale).toBe("ar-EG");
  });

  it("24: no active legacy retrieval fallback", () => {
    expect(HANDLER_SRC).toContain("localeSemanticRetrieve");
    expect(HANDLER_SRC).not.toContain("match_knowledge_chunks");
    expect(INDEX_SRC).toContain("match_locale_knowledge_chunks");
    expect(INDEX_SRC).not.toContain("match_knowledge_chunks");
    expect(HANDLER_SRC).toContain("no legacy retrieval path");
  });
});

describe("handleAssistantRuntimeRequest — rate limiting and provider gating", () => {
  it("returns 429 when rate limit exhausted, without calling the LLM", async () => {
    const deps = buildDeps({
      consumeRateLimit: vi.fn(async () => ({
        allowed: false,
        resetAt: new Date(FIXED_NOW.getTime() + 120_000).toISOString(),
      })),
    });
    const res = await handleAssistantRuntimeRequest(
      buildRequest({ query: "what is AI?", learnerContext: { locale: "en" } }),
      deps,
    );
    expect(res.status).toBe(429);
    expect((deps.callLlm as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
    expect(deps.billingRpc as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it("returns 500 when LOVABLE_API_KEY is missing, before any reservation", async () => {
    const deps = buildDeps({
      env: {
        OPENAI_API_KEY: "openai-key",
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      },
    });
    const res = await handleAssistantRuntimeRequest(
      buildRequest({ query: "what is AI?", learnerContext: { locale: "en" } }),
      deps,
    );
    expect(res.status).toBe(500);
    expect((deps.callLlm as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
    expect(deps.billingRpc as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it("returns 500 when SUPABASE_SERVICE_ROLE_KEY is missing, before any reservation", async () => {
    const deps = buildDeps({
      env: {
        LOVABLE_API_KEY: "lovable-key",
        OPENAI_API_KEY: "openai-key",
        SUPABASE_URL: "https://project.supabase.co",
      },
    });
    const res = await handleAssistantRuntimeRequest(
      buildRequest({ query: "what is AI?", learnerContext: { locale: "en" } }),
      deps,
    );
    expect(res.status).toBe(500);
    expect((deps.callLlm as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
    expect(deps.billingRpc as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });
});

describe("Chat 4 Billing bridge documentation", () => {
  it("documents the implemented billing lifecycle after JWT, before providers", () => {
    expect(HANDLER_SRC).toContain("CHAT 4 BILLING BRIDGE");
    expect(HANDLER_SRC).toContain("authentication (above) → rate limit → server env checks");
    expect(HANDLER_SRC).toContain("reserve_learner_ai_access");
    expect(HANDLER_SRC).toContain("register_provider_attempt");
    expect(HANDLER_SRC).toContain("finalize_provider_attempt");
    expect(HANDLER_SRC).toContain("commit_ai_quota");
    expect(HANDLER_SRC).toContain("release_ai_quota");
    // Entitlement evaluation (evaluate_access) is a separate edge
    // (billing-entitlement) — assistant-runtime never calls it directly.
    expect(HANDLER_SRC).not.toContain("evaluateAccess");
  });

  it("wires billingRpc over default public PostgREST without billing schema profiles", () => {
    expect(INDEX_SRC).toContain("/rest/v1/rpc/${fnName}");
    expect(INDEX_SRC).toContain("apikey: SERVICE_ROLE");
    expect(INDEX_SRC).toContain("Authorization: `Bearer ${SERVICE_ROLE}`");
    expect(INDEX_SRC).not.toContain('"Accept-Profile": "billing"');
    expect(INDEX_SRC).not.toContain('"Content-Profile": "billing"');
  });
});

describe("Chat 4 Billing bridge — lifecycle", () => {
  const sample = loadRegisteredSample();

  function buildBillingSpy(
    overrides: Record<string, (body: Record<string, unknown>) => BillingRpcResult> = {},
  ) {
    let attemptIndex = 0;
    return vi.fn(
      async (fnName: string, body: Record<string, unknown>): Promise<BillingRpcResult> => {
        if (overrides[fnName]) return overrides[fnName](body);
        switch (fnName) {
          case "reserve_learner_ai_access":
            return { ok: true, data: { reservation_id: RESERVATION_ID } };
          case "register_provider_attempt":
            attemptIndex += 1;
            return {
              ok: true,
              data: { reservation_id: body.p_reservation_id, attempt_index: attemptIndex },
            };
          case "finalize_provider_attempt":
            return { ok: true, data: { reservation_id: body.p_reservation_id } };
          case "commit_ai_quota":
            return {
              ok: true,
              data: { reservation_id: body.p_reservation_id, action: "committed" },
            };
          case "release_ai_quota":
            return { ok: true, data: { released: true } };
          default:
            return { ok: false, status: 404, error: `unknown billing rpc: ${fnName}` };
        }
      },
    );
  }

  it("never calls billingRpc for auth/method/locale/retrievalResults rejections", async () => {
    const cases: Array<{
      body: unknown;
      opts?: Parameters<typeof buildRequest>[1];
      depsOverrides?: Partial<AssistantRuntimeDeps>;
    }> = [
      { body: undefined, opts: { method: "OPTIONS", noBody: true } },
      { body: undefined, opts: { method: "GET", noBody: true } },
      {
        body: { query: "hi", learnerContext: { locale: "en" } },
        opts: { skipAuth: true },
        depsOverrides: { verifyJwt: vi.fn(async () => ({ ok: false as const })) },
      },
      {
        body: {
          query: "hi",
          learnerContext: { locale: "en" },
          retrievalResults: [{ x: 1 }],
        },
      },
      { body: { query: "hi", learnerContext: { locale: "fr-FR" } } },
    ];
    for (const { body, opts, depsOverrides } of cases) {
      const deps = buildDeps(depsOverrides);
      await handleAssistantRuntimeRequest(buildRequest(body, opts), deps);
      expect(deps.billingRpc as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
    }
  });

  it("fails closed before any provider when service-role/Supabase env is missing", async () => {
    const deps = buildDeps({
      env: { LOVABLE_API_KEY: "lovable-key", OPENAI_API_KEY: "openai-key" },
    });
    const res = await handleAssistantRuntimeRequest(
      buildRequest({ query: "what is AI?", learnerContext: { locale: "en" } }),
      deps,
    );
    expect(res.status).toBe(500);
    expect(deps.billingRpc as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
    expect(callCounts(deps)).toMatchObject({ embed: 0, retrieve: 0, llm: 0 });
  });

  it("reserve denial yields zero embed/retrieve/llm calls and propagates status", async () => {
    const billingRpc = buildBillingSpy({
      reserve_learner_ai_access: () => ({ ok: false, status: 403, error: "AI_ACCESS_DENIED" }),
    });
    const deps = buildDeps({ billingRpc });
    const res = await handleAssistantRuntimeRequest(
      buildRequest({ query: "what is AI?", learnerContext: { locale: "en" } }),
      deps,
    );
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe("AI_ACCESS_DENIED");
    expect(callCounts(deps)).toMatchObject({ embed: 0, retrieve: 0, llm: 0 });
    expect(billingCallNames(deps)).toEqual(["reserve_learner_ai_access"]);
  });

  it("reserves with category assistant_runtime and the JWT-verified user id, ignoring client userId", async () => {
    const billingRpc = buildBillingSpy();
    const deps = buildDeps({ billingRpc });
    await handleAssistantRuntimeRequest(
      buildRequest({
        query: "what is AI?",
        learnerContext: { locale: "en" },
        // Not part of the request contract — must never influence billing.
        userId: "attacker-supplied-id",
      } as unknown as Record<string, unknown>),
      deps,
    );
    const reserveCall = (billingRpc as ReturnType<typeof vi.fn>).mock.calls.find(
      (c: unknown[]) => c[0] === "reserve_learner_ai_access",
    );
    expect(reserveCall).toBeDefined();
    const reserveBody = reserveCall![1] as Record<string, unknown>;
    expect(reserveBody.p_category).toBe("assistant_runtime");
    expect(reserveBody.p_user_id).toBe("user-1");
    expect(reserveBody.p_units).toBe(1);
  });

  it("successful order: reserve → register embed → embed → finalize embed → retrieve → register answer → llm → finalize answer → commit", async () => {
    const order: string[] = [];
    let embedAttemptIndex = -1;
    let answerAttemptIndex = -1;
    let nextIndex = 0;
    const billingRpc = vi.fn(
      async (fnName: string, body: Record<string, unknown>): Promise<BillingRpcResult> => {
        switch (fnName) {
          case "reserve_learner_ai_access":
            order.push(fnName);
            return { ok: true, data: { reservation_id: RESERVATION_ID } };
          case "register_provider_attempt": {
            order.push(fnName);
            nextIndex += 1;
            if (body.p_provider === "openai_embedding") embedAttemptIndex = nextIndex;
            if (body.p_provider === "lovable_llm") answerAttemptIndex = nextIndex;
            return {
              ok: true,
              data: { reservation_id: body.p_reservation_id, attempt_index: nextIndex },
            };
          }
          case "finalize_provider_attempt":
            order.push(
              body.p_attempt_index === embedAttemptIndex ? "finalize:embed" : "finalize:answer",
            );
            return { ok: true, data: { reservation_id: body.p_reservation_id } };
          case "commit_ai_quota":
            order.push(fnName);
            return { ok: true, data: { reservation_id: body.p_reservation_id } };
          case "release_ai_quota":
            order.push(fnName);
            return { ok: true, data: { released: true } };
          default:
            return { ok: false, status: 404, error: `unknown rpc ${fnName}` };
        }
      },
    );
    const embedQuery = vi.fn(async () => {
      order.push("embedQuery");
      return [0.1, 0.2, 0.3];
    });
    const localeSemanticRetrieve = vi.fn(async () => {
      order.push("localeSemanticRetrieve");
      return { ok: true as const, chunks: [sample] as SemanticChunk[] };
    });
    const callLlm = vi.fn(async () => {
      order.push("callLlm");
      return { ok: true as const, answer: "ok" };
    });
    const deps = buildDeps({ billingRpc, embedQuery, localeSemanticRetrieve, callLlm });

    const res = await handleAssistantRuntimeRequest(
      buildRequest({ query: "what is AI?", learnerContext: { locale: "en" } }),
      deps,
    );
    expect(res.status).toBe(200);
    expect(order).toEqual([
      "reserve_learner_ai_access",
      "register_provider_attempt",
      "embedQuery",
      "finalize:embed",
      "localeSemanticRetrieve",
      "register_provider_attempt",
      "callLlm",
      "finalize:answer",
      "commit_ai_quota",
    ]);
    expect(embedAttemptIndex).toBe(1);
    expect(answerAttemptIndex).toBe(2);
  });

  it("requires OPENAI_API_KEY and fails closed without LLM when absent", async () => {
    const billingRpc = buildBillingSpy();
    const embedQuery = vi.fn(async () => [0.1, 0.2, 0.3]);
    const localeSemanticRetrieve = vi.fn(async () => ({
      ok: true as const,
      chunks: [] as SemanticChunk[],
    }));
    const callLlm = vi.fn(async () => ({ ok: true as const, answer: "should not run" }));
    const deps = buildDeps({
      billingRpc,
      embedQuery,
      localeSemanticRetrieve,
      callLlm,
      env: {
        LOVABLE_API_KEY: "lovable-key",
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      },
    });
    const res = await handleAssistantRuntimeRequest(
      buildRequest({ query: "what is AI?", learnerContext: { locale: "en" } }),
      deps,
    );
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe("Missing required server configuration");
    expect(embedQuery).not.toHaveBeenCalled();
    expect(localeSemanticRetrieve).not.toHaveBeenCalled();
    expect(callLlm).not.toHaveBeenCalled();
    expect(deps.billingRpc as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it("releases exactly once when embed registration fails before any attempt starts", async () => {
    const billingRpc = buildBillingSpy({
      register_provider_attempt: () => ({
        ok: false,
        status: 500,
        error: "PROVIDER_ATTEMPT_REGISTRATION_FAILED",
      }),
    });
    const callLlm = vi.fn(async () => ({ ok: true as const, answer: "should not be called" }));
    const deps = buildDeps({
      billingRpc,
      callLlm,
    });
    const res = await handleAssistantRuntimeRequest(
      buildRequest({ query: "what is AI?", learnerContext: { locale: "en" } }),
      deps,
    );
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(callLlm).not.toHaveBeenCalled();
    const names = billingCallNames(deps);
    expect(names.filter((n) => n === "release_ai_quota")).toHaveLength(1);
    expect(names).not.toContain("commit_ai_quota");
  });

  it("never releases once a provider started, even when grounding fails closed after embed; commits exactly once", async () => {
    const billingRpc = buildBillingSpy();
    const callLlm = vi.fn(async () => ({
      ok: true as const,
      answer: "should not be called",
    }));
    const deps = buildDeps({
      billingRpc,
      callLlm,
      localeSemanticRetrieve: vi.fn(async () => ({
        ok: true as const,
        chunks: [] as SemanticChunk[],
      })),
    });
    const res = await handleAssistantRuntimeRequest(
      buildRequest({ query: "what is AI?", learnerContext: { locale: "en" } }),
      deps,
    );
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.reason).toBe("insufficient_grounding");
    expect(callLlm).not.toHaveBeenCalled();
    const names = billingCallNames(deps);
    expect(names.filter((n) => n === "commit_ai_quota")).toHaveLength(1);
    expect(names).not.toContain("release_ai_quota");
  });

  it("two provider attempts (embed + answer) result in exactly one commit", async () => {
    const billingRpc = buildBillingSpy();
    const deps = buildDeps({
      billingRpc,
      localeSemanticRetrieve: vi.fn(async () => ({
        ok: true as const,
        chunks: [sample] as SemanticChunk[],
      })),
    });
    const res = await handleAssistantRuntimeRequest(
      buildRequest({ query: "what is AI?", learnerContext: { locale: "en" } }),
      deps,
    );
    expect(res.status).toBe(200);
    const names = billingCallNames(deps);
    expect(names.filter((n) => n === "register_provider_attempt")).toHaveLength(2);
    expect(names.filter((n) => n === "commit_ai_quota")).toHaveLength(1);
    expect(names.filter((n) => n === "release_ai_quota")).toHaveLength(0);
  });
});
