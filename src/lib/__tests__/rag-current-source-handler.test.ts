// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  handleAssistantRuntimeRequest,
  type AssistantRuntimeDeps,
  type SemanticChunk,
} from "../../../supabase/functions/assistant-runtime/handler.ts";
import { generateChunksForPackage } from "../rag/chunking";
import { sha256CanonicalHex, normalizeCanonicalText } from "../rag/canonical-checksum";
import type { CurrentAiApproval } from "../rag/current-source-release";
import type { RagChunkRecord, ApprovedPackageRecord } from "../rag/types";

const network = vi.fn(async () => {
  throw new Error("Unexpected network call from the local source composition test");
});
beforeEach(() => {
  network.mockClear();
  vi.stubGlobal("fetch", network);
});
afterEach(() => {
  vi.unstubAllGlobals();
  expect(network).not.toHaveBeenCalled();
});

const approval = JSON.parse(
  readFileSync("artifacts/rag/current/approval-snapshot.json", "utf8"),
) as CurrentAiApproval;
const records = JSON.parse(
  readFileSync("artifacts/rag/current/chunks.json", "utf8"),
) as RagChunkRecord[];
const key = "en/analyst-m1-l1-from-automation-to-insight/s0/c0";
const selected = records.find((x) => x.chunkId === key)!;
const pkg = approval.packages[`en|${selected.lessonId}`];
const sourceBytes = readFileSync(pkg.packagePath, "utf8");
const payload = JSON.parse(sourceBytes);
const record: ApprovedPackageRecord = {
  lessonId: pkg.lessonId,
  locale: "en",
  moduleId: pkg.moduleId,
  trackId: pkg.trackId,
  packagePath: pkg.packagePath,
  productionRoute: pkg.productionRoute,
  sourceSha: approval.releaseId,
  packageChecksum: pkg.packageChecksum,
  canonicalVersion: pkg.canonicalVersion,
  title: payload.title,
};
const sample: SemanticChunk = {
  id: "local-source-row",
  sourceId: selected.chunkId,
  locale: "en",
  lessonId: selected.lessonId,
  moduleId: selected.moduleId,
  pathId: selected.trackId,
  title: payload.title,
  content: selected.displayText,
  similarity: 0.9,
  packagePath: selected.packagePath,
  sourceSha: approval.releaseId,
  packageChecksum: pkg.packageChecksum,
  chunkChecksum: selected.textChecksum,
  contentVersion: pkg.canonicalVersion,
  indexVersion: approval.indexVersion,
  indexState: "active",
  sectionIndex: selected.sectionIndex,
  sectionRole: selected.sectionRole,
  chunkPosition: selected.chunkIndex,
  contentType: selected.contentType,
  productionRoute: pkg.productionRoute,
};
const request = (locale = "en") =>
  new Request("http://localhost/assistant-runtime", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer explicit-local-fixture" },
    body: JSON.stringify({
      requestId: "33333333-3333-4333-8333-333333333333",
      query: "Explain this approved lesson passage.",
      learnerContext: {
        product: "adult",
        locale,
        currentPath: pkg.trackId,
        currentModule: pkg.moduleId,
        currentLesson: pkg.lessonId,
        contentVersion: pkg.canonicalVersion,
      },
    }),
  });

function fixture(
  options: {
    corrupt?: boolean;
    withdraw?: boolean;
    throwModel?: boolean;
    empty?: boolean;
    loseSettlementReply?: boolean;
  } = {},
) {
  let allowed = true,
    calls = 0;
  let savedResponse: unknown;
  const balance = { monthly_remaining: 9, purchased_remaining: 0 };
  const meterCalls: { name: string; args: Record<string, unknown> }[] = [];
  const deps: AssistantRuntimeDeps = {
    // Explicit TEST identities/billing/provider boundaries. No real JWT/model or
    // deployed RLS is certified. The full real corpus admission prefix executes.
    verifyJwt: async () => ({ ok: true, userId: "11111111-1111-4111-8111-111111111111" }),
    consumeRateLimit: async () => ({ allowed: true, resetAt: new Date().toISOString() }),
    env: {
      OPENAI_API_KEY: "fixture-only",
      SUPABASE_URL: "https://fixture.invalid",
      SUPABASE_SERVICE_ROLE_KEY: "fixture-only",
    },
    billingRpc: async (name, args) => {
      meterCalls.push({ name, args });
      if (name === "assistant_card_content_access")
        return {
          ok: true,
          data: {
            card_id: pkg.trackId,
            admin_review: false,
            lessons: { entitled_lesson_ids: allowed ? [pkg.lessonId] : [] },
          },
        };
      if (name === "reserve_assistant_question") {
        return savedResponse === undefined
          ? { ok: true, data: { status: "reserved", allowed: true } }
          : { ok: true, data: { status: "replay", response: savedResponse, balance } };
      }
      if (name === "assistant_question_provider_attempt") return { ok: true, data: { ok: true } };
      if (name === "settle_assistant_question") {
        if (options.loseSettlementReply) {
          savedResponse = args.p_response;
          return { ok: false, status: 503, error: "ASSISTANT_SETTLEMENT_UNAVAILABLE" };
        }
        return {
          ok: true,
          data: {
            status: "settled",
            response: args.p_response,
            charged_units: args.p_outcome === "answered" ? 1 : 0,
            balance,
          },
        };
      }
      throw new Error(`Unexpected metering contract: ${name}`);
    },
    embedQuery: async () => Array.from({ length: 1536 }, (_, i) => (i === 0 ? 1 : 0)),
    localeSemanticRetrieve: async () => {
      if (options.withdraw) allowed = false;
      return {
        ok: true,
        chunks: options.empty
          ? []
          : [
              options.corrupt
                ? { ...sample, content: sample.content + " unauthorized edit" }
                : sample,
            ],
      };
    },
    callLlm: async (_system, user) => {
      calls++;
      expect(user).toContain(selected.displayText.slice(0, 60));
      if (options.throwModel) throw new Error("PRIVATE_PROVIDER_DIAGNOSTIC_MUST_NOT_ESCAPE");
      return {
        ok: true,
        answer: JSON.stringify({
          grounding: "supported",
          answer: "Explicit local model fixture, not a real provider response.",
          sourceIds: [key],
        }),
      };
    },
  };
  return { deps, calls: () => calls, meterCalls };
}

it("derives the selected passage from actual committed lesson bytes and current approval without inventing source approval", () => {
  expect(sha256CanonicalHex(sourceBytes)).toBe(pkg.packageChecksum);
  const generated = generateChunksForPackage(payload, record).find((x) => x.chunkId === key)!;
  expect(normalizeCanonicalText(generated.displayText)).toBe(sample.content);
  expect(sha256CanonicalHex(sample.content)).toBe(approval.chunks[key].textChecksum);
});

it("joins that REAL admitted source to the FULL handler/citations while keeping test provider and identity boundaries explicit", async () => {
  const f = fixture();
  const res = await handleAssistantRuntimeRequest(request(), f.deps);
  const body = await res.json();
  expect(res.status).toBe(200);
  expect(f.calls()).toBe(1);
  expect(body.citations).toHaveLength(1);
  expect(body.citations[0].sourceSha).toBe(approval.releaseId);
  expect(body.citations[0].chunkId).toBe(key);
  expect(body.citations[0].packageChecksum).toBe(pkg.packageChecksum);
  expect(body.answerGrounding).toBe("supported");
  expect(body.chargedUnits).toBe(1);
  expect(f.meterCalls.map((call) => call.name)).not.toContain("reserve_learner_ai_access");
  const reserve = f.meterCalls.filter((call) => call.name === "reserve_assistant_question");
  const settle = f.meterCalls.filter((call) => call.name === "settle_assistant_question");
  expect(reserve).toHaveLength(1);
  expect(settle).toHaveLength(1);
  expect(settle[0].args).toMatchObject({
    p_request_id: reserve[0].args.p_request_id,
    p_fingerprint: reserve[0].args.p_fingerprint,
    p_outcome: "answered",
  });
  expect(
    f.meterCalls
      .filter((call) => call.name === "assistant_question_provider_attempt")
      .map((call) => [call.args.p_model, call.args.p_status]),
  ).toEqual([
    ["openai_embedding", "started"],
    ["openai_embedding", "succeeded"],
    ["openai_llm", "started"],
    ["openai_llm", "succeeded"],
  ]);
});

it("replays the persisted grounded answer after a lost settlement reply without new provider work or charge", async () => {
  const f = fixture({ loseSettlementReply: true });
  const first = await handleAssistantRuntimeRequest(request(), f.deps);
  expect(first.status).toBe(503);
  expect(await first.json()).not.toHaveProperty("answer");

  const retry = await handleAssistantRuntimeRequest(request(), f.deps);
  expect(retry.status).toBe(200);
  expect(await retry.json()).toMatchObject({
    replay: true,
    answerGrounding: "supported",
    citations: [{ chunkId: key, sourceSha: approval.releaseId }],
  });
  expect(f.calls()).toBe(1);
  const reservations = f.meterCalls.filter((call) => call.name === "reserve_assistant_question");
  expect(reservations).toHaveLength(2);
  expect(reservations[1].args).toEqual(reservations[0].args);
  expect(f.meterCalls.filter((call) => call.name === "settle_assistant_question")).toHaveLength(1);
  expect(
    f.meterCalls.filter(
      (call) =>
        call.name === "assistant_question_provider_attempt" && call.args.p_status === "started",
    ),
  ).toHaveLength(2);
});

it.each([
  [{ corrupt: true }, 422],
  [{ empty: true }, 422],
  [{ withdraw: true }, 403],
] as const)(
  "blocks unapproved/empty/withdrawn source without generation: %j",
  async (options, status) => {
    const f = fixture(options);
    const response = await handleAssistantRuntimeRequest(request(), f.deps);
    expect(response.status).toBe(status);
    expect(f.calls()).toBe(0);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.citations ?? []).toHaveLength(0);
    expect(body.chargedUnits).toBe(0);
  },
);

it("contains raw provider exceptions with truthful attempted-call flags and no diagnostic disclosure", async () => {
  const f = fixture({ throwModel: true });
  const response = await handleAssistantRuntimeRequest(request(), f.deps);
  const body = await response.json();
  expect(response.status).toBe(500);
  expect(f.calls()).toBe(1);
  expect(JSON.stringify(body)).not.toContain("PRIVATE_PROVIDER");
  expect(body.providersCalled.llm).toBe(true);
  expect(body.chargedUnits).toBe(0);
  expect(
    f.meterCalls.find((call) => call.name === "settle_assistant_question")?.args.p_outcome,
  ).toBe("system_failure");
});

it("fails closed without configured nonproduction provider capabilities", async () => {
  const f = fixture();
  f.deps.env = {};
  const response = await handleAssistantRuntimeRequest(request(), f.deps);
  expect(response.status).toBe(500);
  expect(f.calls()).toBe(0);
});
