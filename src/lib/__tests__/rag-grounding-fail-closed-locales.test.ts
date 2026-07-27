/**
 * Four-locale regression for P0 grounding fail-closed.
 * Authorization: CR-RAG-GROUNDING-P0-CORRECTIVE-PR-20260728-01
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  handleAssistantRuntimeRequest,
  type AssistantRuntimeDeps,
  type BillingRpcResult,
  type SemanticChunk,
  INSUFFICIENT_GROUNDING_REASON,
  insufficientGroundingMessage,
  mustFailClosedForGrounding,
} from "../../../supabase/functions/assistant-runtime/handler.ts";
import {
  INSUFFICIENT_GROUNDING_REASON as SHARED_REASON,
  insufficientGroundingMessage as sharedInsufficientMessage,
  mustFailClosedForGrounding as sharedMustFailClosed,
  RUNTIME_SUPPORTED_LOCALES,
} from "@/lib/rag/assistant-grounding-security";
import { CONTENT_FREEZE_SHA, RAG_INDEX_VERSION } from "@/lib/rag/constants";
import { sha256CanonicalHex } from "@/lib/rag/canonical-checksum";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const FIXED_NOW = new Date("2026-01-01T00:00:00.000Z");
const LOCALES = [...RUNTIME_SUPPORTED_LOCALES] as const;
const RESERVATION_ID = "bbbbbbbb-0000-4000-8000-000000000002";

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

function loadRegisteredSampleForLocale(locale: (typeof LOCALES)[number]): SemanticChunk {
  const chunks = JSON.parse(
    readFileSync(path.join(REPO_ROOT, "artifacts/rag/chunks.json"), "utf8"),
  ) as ChunkArtifact[];
  const packages = (
    JSON.parse(
      readFileSync(path.join(REPO_ROOT, "artifacts/rag/package-manifest.json"), "utf8"),
    ) as { packages: PackageEntry[] }
  ).packages;
  const hit = chunks.find((c) => c.locale === locale);
  if (!hit) throw new Error(`missing chunk for locale ${locale}`);
  const pkg = packages.find((p) => p.packagePath === hit.packagePath);
  if (!pkg) throw new Error(`missing package for ${hit.chunkId}`);
  const recomputed = sha256CanonicalHex(hit.displayText);
  if (recomputed !== hit.textChecksum) {
    throw new Error(`artifact content checksum drift for ${hit.chunkId}`);
  }
  return {
    id: `id-${locale}`,
    sourceId: hit.chunkId,
    locale: hit.locale,
    lessonId: hit.lessonId,
    moduleId: hit.moduleId,
    pathId: hit.trackId,
    title: hit.lessonId,
    content: hit.displayText,
    similarity: 0.88,
    packagePath: hit.packagePath,
    sourceSha: CONTENT_FREEZE_SHA,
    packageChecksum: pkg.packageChecksum,
    chunkChecksum: hit.textChecksum,
    contentVersion: null,
    indexVersion: RAG_INDEX_VERSION,
    sectionIndex: hit.sectionIndex,
    sectionRole: hit.sectionRole,
    chunkPosition: hit.chunkIndex,
    contentType: hit.contentType,
    productionRoute: hit.productionRoute,
    indexState: "active",
    sameLessonRank: 0,
  };
}

function createBillingRpc(): AssistantRuntimeDeps["billingRpc"] {
  let attemptIndex = 0;
  return vi.fn(async (fnName: string, body: Record<string, unknown>): Promise<BillingRpcResult> => {
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
      case "commit_ai_quota":
        return { ok: true, data: { reservation_id: body.p_reservation_id } };
      case "release_ai_quota":
        return { ok: true, data: { released: true } };
      default:
        return { ok: false, status: 404, error: `unknown ${fnName}` };
    }
  });
}

function buildDeps(overrides: Partial<AssistantRuntimeDeps> = {}): AssistantRuntimeDeps {
  return {
    verifyJwt: vi.fn(async () => ({ ok: true as const, userId: "user-1" })),
    consumeRateLimit: vi.fn(async () => ({
      allowed: true,
      resetAt: "2099-01-01T00:00:00.000Z",
    })),
    billingRpc: createBillingRpc(),
    embedQuery: vi.fn(async () => [0.1, 0.2, 0.3]),
    localeSemanticRetrieve: vi.fn(async () => ({
      ok: true as const,
      chunks: [] as SemanticChunk[],
    })),
    callLlm: vi.fn(async () => ({ ok: true as const, answer: "grounded answer" })),
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

function request(locale: string, query = "what is AI in the curriculum?") {
  return new Request("https://masaarat.ai/functions/v1/assistant-runtime", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer test-token",
    },
    body: JSON.stringify({ query, learnerContext: { locale } }),
  });
}

function callCounts(deps: AssistantRuntimeDeps) {
  return {
    embed: (deps.embedQuery as ReturnType<typeof vi.fn>).mock.calls.length,
    retrieve: (deps.localeSemanticRetrieve as ReturnType<typeof vi.fn>).mock.calls.length,
    llm: (deps.callLlm as ReturnType<typeof vi.fn>).mock.calls.length,
  };
}

describe("shared fail-closed helpers", () => {
  it("mirrors handler and shared security module contracts", () => {
    expect(INSUFFICIENT_GROUNDING_REASON).toBe(SHARED_REASON);
    expect(mustFailClosedForGrounding(0, 0)).toBe(true);
    expect(mustFailClosedForGrounding(1, 0)).toBe(true);
    expect(mustFailClosedForGrounding(0, 1)).toBe(true);
    expect(mustFailClosedForGrounding(1, 1)).toBe(false);
    expect(sharedMustFailClosed(0, 1)).toBe(true);
    for (const locale of LOCALES) {
      expect(insufficientGroundingMessage(locale)).toBe(sharedInsufficientMessage(locale));
      expect(insufficientGroundingMessage(locale).length).toBeGreaterThan(20);
    }
  });
});

describe.each(LOCALES)("locale %s — grounding fail-closed regressions", (locale) => {
  it("grounded same-locale retrieval yields citations and calls generation once", async () => {
    const sample = loadRegisteredSampleForLocale(locale);
    const deps = buildDeps({
      localeSemanticRetrieve: vi.fn(async (_e, requestedLocale) => {
        expect(requestedLocale).toBe(locale);
        return { ok: true as const, chunks: [sample] };
      }),
    });
    const res = await handleAssistantRuntimeRequest(request(locale), deps);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.citations).toHaveLength(1);
    expect(json.citations[0].locale).toBe(locale);
    expect(json.citations[0].chunkId).toBe(sample.sourceId);
    expect(json.retrieval.locale).toBe(locale);
    expect(json.retrieval.citationCount).toBe(1);
    expect(json.retrieval.crossLocaleLeakage).toBe(0);
    expect(json.answer).toBe("grounded answer");
    expect(callCounts(deps)).toEqual({ embed: 1, retrieve: 1, llm: 1 });
    const llmPrompt = (deps.callLlm as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;
    expect(llmPrompt).toContain(sample.sourceId);
    expect(llmPrompt).toContain("citationCount: 1");
  });

  it("rejects cross-locale chunks and citations with no fallback", async () => {
    const sample = loadRegisteredSampleForLocale(locale);
    const other = LOCALES.find((l) => l !== locale)!;
    const foreign = {
      ...sample,
      locale: other,
      packagePath: (sample.packagePath ?? "").replace(`/${locale}/`, `/${other}/`),
      content: "FOREIGN_LOCALE_MARKER",
    };
    const deps = buildDeps({
      localeSemanticRetrieve: vi.fn(async () => ({ ok: true as const, chunks: [foreign] })),
    });
    const res = await handleAssistantRuntimeRequest(request(locale), deps);
    const json = await res.json();
    expect(res.status).toBe(422);
    expect(json.ok).toBe(false);
    expect(json.reason).toBe(INSUFFICIENT_GROUNDING_REASON);
    expect(json.citations).toEqual([]);
    expect(json.retrieval.crossLocaleLeakage).toBe(1);
    expect(json.retrieval.locale).toBe(locale);
    expect(json.answer).toBeUndefined();
    expect(json.message).toBe(insufficientGroundingMessage(locale));
    expect(callCounts(deps).llm).toBe(0);
    expect(JSON.stringify(json)).not.toContain("FOREIGN_LOCALE_MARKER");
  });

  it("zero-retrieval fail-closed — no generation, no lesson attribution", async () => {
    const deps = buildDeps({
      localeSemanticRetrieve: vi.fn(async () => ({ ok: true as const, chunks: [] })),
    });
    const res = await handleAssistantRuntimeRequest(request(locale), deps);
    const json = await res.json();
    expect(res.status).toBe(422);
    expect(json.ok).toBe(false);
    expect(json.reason).toBe(INSUFFICIENT_GROUNDING_REASON);
    expect(json.retrievalCount).toBe(0);
    expect(json.retrieval.citationCount).toBe(0);
    expect(json.citations).toEqual([]);
    expect(json.answer).toBeUndefined();
    expect(json.message).toBe(insufficientGroundingMessage(locale));
    expect(json.providersCalled).toEqual({
      embedding: true,
      retrievalRpc: true,
      llm: false,
    });
    expect(callCounts(deps)).toEqual({ embed: 1, retrieve: 1, llm: 0 });
  });

  it("zero-valid-citation fail-closed when checksums are fabricated", async () => {
    const sample = loadRegisteredSampleForLocale(locale);
    const bad = { ...sample, packageChecksum: "c".repeat(64), content: "BAD_ATTRIBUTION_CLAIM" };
    const deps = buildDeps({
      localeSemanticRetrieve: vi.fn(async () => ({ ok: true as const, chunks: [bad] })),
    });
    const res = await handleAssistantRuntimeRequest(request(locale), deps);
    const json = await res.json();
    expect(res.status).toBe(422);
    expect(json.ok).toBe(false);
    expect(json.reason).toBe(INSUFFICIENT_GROUNDING_REASON);
    expect(json.citations).toEqual([]);
    expect(json.retrieval.nonAuthoritativeExcluded).toBe(1);
    expect(callCounts(deps).llm).toBe(0);
    expect(JSON.stringify(json)).not.toContain("BAD_ATTRIBUTION_CLAIM");
  });

  it("retrieval RPC failure fail-closed — generation provider not called", async () => {
    const deps = buildDeps({
      localeSemanticRetrieve: vi.fn(async () => ({
        ok: false as const,
        status: 502,
        error: "Retrieval RPC failed",
      })),
    });
    const res = await handleAssistantRuntimeRequest(request(locale), deps);
    const json = await res.json();
    expect(res.status).toBe(502);
    expect(json.ok).toBe(false);
    expect(json.reason).toBe("retrieval_rpc_failed");
    expect(json.citations).toEqual([]);
    expect(callCounts(deps).llm).toBe(0);
    expect(json.providersCalled.llm).toBe(false);
  });

  it("embedding failure fail-closed — generation provider not called", async () => {
    const deps = buildDeps({
      embedQuery: vi.fn(async () => null),
    });
    const res = await handleAssistantRuntimeRequest(request(locale), deps);
    const json = await res.json();
    expect(res.status).toBe(502);
    expect(json.ok).toBe(false);
    expect(json.reason).toBe("embedding_failed");
    expect(callCounts(deps)).toEqual({ embed: 1, retrieve: 0, llm: 0 });
  });
});
