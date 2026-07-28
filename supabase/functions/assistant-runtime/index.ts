// Assistant Runtime — secure backend entry point.
//
// Thin Deno wiring layer: builds real (network-calling) dependencies and
// delegates all request handling / RAG security logic to handler.ts, which
// is unit-testable in isolation with injected mock deps.
//
// See handler.ts for the full RAG security contract.

import {
  handleAssistantRuntimeRequest,
  type AssistantRuntimeDeps,
  type BillingRpcResult,
  type LocaleRetrieveResult,
  type LlmResult,
  type SemanticChunk,
} from "./handler.ts";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIM = 1536;
const SEMANTIC_MAX = 5;
const SEMANTIC_MIN_SIMILARITY = 0.35;

async function verifyJwt(req: Request): Promise<{ ok: true; userId: string } | { ok: false }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return { ok: false };
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!SUPABASE_URL || !ANON) return { ok: false };
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: ANON },
    });
    if (!res.ok) return { ok: false };
    const u = await res.json();
    if (!u?.id) return { ok: false };
    return { ok: true, userId: u.id as string };
  } catch {
    return { ok: false };
  }
}

// Server-side rate limit via consume_rate_limit RPC (atomic).
async function consumeRateLimit(
  userId: string,
  bucketKey: string,
  maxCalls: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; resetAt: string }> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error("[assistant-runtime] rate-limit unavailable: missing supabase env");
    return { allowed: false, resetAt: new Date().toISOString() };
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/consume_rate_limit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
      },
      body: JSON.stringify({
        p_user_id: userId,
        p_bucket_key: bucketKey,
        p_max_calls: maxCalls,
        p_window_seconds: windowSeconds,
      }),
    });
    if (!res.ok) {
      console.error("[assistant-runtime] rate-limit rpc failed", res.status);
      return { allowed: false, resetAt: new Date().toISOString() };
    }
    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : rows;
    return {
      allowed: Boolean(row?.allowed),
      resetAt: String(row?.reset_at ?? new Date().toISOString()),
    };
  } catch (e) {
    console.error("[assistant-runtime] rate-limit exception", (e as Error).message);
    return { allowed: false, resetAt: new Date().toISOString() };
  }
}

// Invokes a public PostgREST RPC that thin-wraps the private billing.*
// Chat-4 contract (see migration 20260728140000_public_billing_rpc_bridge).
// Default public schema only — no Accept-Profile / Content-Profile headers
// (Lovable Cloud cannot expose custom schemas in Data API db-schemas).
// Never throws — failures (missing env, network error, non-2xx from PostgREST)
// surface as `{ ok: false }` so the handler can fail closed without leaking
// the service-role key.
async function billingRpc(
  fnName: string,
  body: Record<string, unknown>,
): Promise<BillingRpcResult> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return { ok: false, status: 500, error: "Billing RPC unavailable: missing supabase env" };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let message = `Billing RPC ${fnName} failed (${res.status})`;
      try {
        const errJson = await res.json();
        if (typeof errJson?.message === "string") message = errJson.message;
      } catch {
        // Non-JSON error body — keep the generic message above.
      }
      console.error(`[assistant-runtime] billing rpc ${fnName} failed`, res.status, message);
      return { ok: false, status: res.status, error: message };
    }

    const data = (await res.json()) as Record<string, unknown> | null;
    return { ok: true, data: data ?? {} };
  } catch (e) {
    console.error(`[assistant-runtime] billing rpc ${fnName} exception`, (e as Error).message);
    return { ok: false, status: 500, error: "Billing RPC unavailable" };
  }
}

async function embedQuery(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
    });
    if (!res.ok) {
      console.warn(
        "[assistant-runtime] embed failed",
        res.status,
        (await res.text()).slice(0, 200),
      );
      return null;
    }
    const json = await res.json();
    const v: number[] = json?.data?.[0]?.embedding;
    if (!Array.isArray(v) || v.length !== EMBEDDING_DIM) return null;
    return v;
  } catch (e) {
    console.warn("[assistant-runtime] embed exception", (e as Error).message);
    return null;
  }
}

// Locale-aware semantic retrieval — the only retrieval path (unified
// 400-package contract). Invokes match_locale_knowledge_chunks with
// service_role only (least privilege). Takes an already-computed embedding —
// embedding happens once, as its own billed provider attempt, in the handler.
// RPC failures must not be collapsed into an empty success list.
async function localeSemanticRetrieve(
  embedding: number[],
  locale: string,
  pathId: string | null,
  moduleId: string | null,
  lessonId: string | null,
  contentVersion: string | null,
  allowModuleFallback: boolean,
): Promise<LocaleRetrieveResult> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.warn("[assistant-runtime] locale semantic disabled: missing supabase env");
    return { ok: false, status: 500, error: "Missing required server configuration" };
  }

  try {
    // PostgREST pgvector args are accepted as a JSON-encoded vector string.
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_locale_knowledge_chunks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
      },
      body: JSON.stringify({
        query_embedding: JSON.stringify(embedding),
        p_locale: locale,
        match_count: SEMANTIC_MAX,
        p_lesson_id: lessonId,
        p_module_id: moduleId,
        p_path_id: pathId,
        p_content_version: contentVersion,
        min_similarity: SEMANTIC_MIN_SIMILARITY,
        p_allow_module_fallback: allowModuleFallback,
      }),
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 200);
      console.warn("[assistant-runtime] locale semantic rpc failed", res.status, detail);
      return {
        ok: false,
        status: res.status >= 400 ? res.status : 502,
        error: "Retrieval RPC failed",
      };
    }
    const rows = await res.json();
    if (!Array.isArray(rows)) {
      return { ok: false, status: 502, error: "Malformed retrieval RPC response" };
    }
    const chunks: SemanticChunk[] = rows
      .slice(0, SEMANTIC_MAX)
      .map((r: Record<string, unknown>) => ({
        id: String(r.id ?? ""),
        sourceId: String(r.source_id ?? ""),
        locale: (r.locale as string) ?? null,
        lessonId: (r.lesson_id as string) ?? null,
        moduleId: (r.module_id as string) ?? null,
        pathId: (r.path_id as string) ?? null,
        title: String(r.title ?? ""),
        content: String(r.content ?? ""),
        similarity: Number(r.similarity ?? 0),
        packagePath: (r.package_path as string) ?? null,
        sourceSha: (r.source_sha as string) ?? null,
        packageChecksum: (r.package_checksum as string) ?? null,
        chunkChecksum: (r.chunk_checksum as string) ?? null,
        contentVersion: (r.content_version as string) ?? null,
        indexVersion: (r.index_version as string) ?? null,
        sectionIndex: (r.section_index as number) ?? null,
        sectionRole: (r.section_role as string) ?? null,
        chunkPosition: (r.chunk_position as number) ?? null,
        contentType: (r.content_type as string) ?? null,
        productionRoute: (r.production_route as string) ?? null,
        indexState: "active",
        sameLessonRank: Number(r.same_lesson_rank ?? 1),
      }));
    return { ok: true, chunks };
  } catch (e) {
    console.warn("[assistant-runtime] locale semantic exception", (e as Error).message);
    return { ok: false, status: 500, error: "Retrieval RPC exception" };
  }
}

async function callLlm(
  systemPrompt: string,
  userPrompt: string,
  lovableKey: string,
): Promise<LlmResult> {
  try {
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      if (aiRes.status === 429) {
        return {
          ok: false,
          status: 429,
          error: "وصلنا الحد الأقصى من الطلبات، حاول تاني بعد شوية.",
        };
      }
      if (aiRes.status === 402) {
        return {
          ok: false,
          status: 402,
          error: "الرصيد خلص — لازم تشحن workspace الـ Lovable AI.",
        };
      }
      return {
        ok: false,
        status: 502,
        error: `AI provider error (${aiRes.status})`,
        detail: errText.slice(0, 500),
      };
    }

    const aiJson = await aiRes.json();
    const answer: string = aiJson?.choices?.[0]?.message?.content?.trim() ?? "لم يتم توليد إجابة.";
    return { ok: true, answer };
  } catch (err) {
    return {
      ok: false,
      status: 500,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

function buildRealDeps(): AssistantRuntimeDeps {
  return {
    verifyJwt,
    consumeRateLimit,
    billingRpc,
    embedQuery,
    localeSemanticRetrieve,
    callLlm,
    env: {
      LOVABLE_API_KEY: Deno.env.get("LOVABLE_API_KEY") ?? undefined,
      OPENAI_API_KEY: Deno.env.get("OPENAI_API_KEY") ?? undefined,
      SUPABASE_URL: Deno.env.get("SUPABASE_URL") ?? undefined,
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? undefined,
    },
  };
}

Deno.serve((req) => handleAssistantRuntimeRequest(req, buildRealDeps()));
