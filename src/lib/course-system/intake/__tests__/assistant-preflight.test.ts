// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  rpc: vi.fn(),
  embed: vi.fn(),
  llm: vi.fn(),
  provider: vi.fn(),
  events: [] as string[],
  replay: null as null | { status: number; proof?: unknown },
}));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc: mock.rpc } }));
vi.mock("../index.server", () => ({ courseEmbeddings: mock.embed }));
vi.mock("@/lib/ai-providers.server", () => ({ callAI: mock.llm }));
vi.mock("../../../../../supabase/functions/_shared/assistant-question-contract", () => ({
  questionRpcFailure: () => {
    throw new Error("UNEXPECTED_BILLING_RPC");
  },
}));
vi.mock("../../../../../supabase/functions/assistant-runtime/question-metering", () => ({
  runMeteredQuestion: (
    _identity: unknown,
    _rpc: unknown,
    work: (fingerprint: string) => Promise<unknown>,
    replayAllowed: (response: { status: number; proof?: unknown }) => Promise<boolean>,
  ) => (mock.replay ? replayAllowed(mock.replay) : work("synthetic-fingerprint")),
  recordedQuestionProvider: (
    _rpc: unknown,
    _owner: unknown,
    model: string,
    work: () => Promise<unknown>,
  ) => {
    mock.events.push("provider:" + model);
    mock.provider(model);
    return work();
  },
}));
import { askCurriculum } from "../assistant.server";
import { curriculumChunks } from "../corpus";
import { intakeCanonical } from "../package";
import { sha256 } from "@/lib/card-assistant/corpus";
const identity = {
  area: "kids",
  course: "synthetic-course",
  lesson: "synthetic-lesson",
  locale: "en",
  userId: "00000000-0000-4000-8000-000000000001",
  childId: "00000000-0000-4000-8000-000000000002",
  requestId: "00000000-0000-4000-8000-000000000003",
  query: "Synthetic learner question",
  history: [],
};
const lesson = {
  id: identity.lesson,
  title: "Synthetic teaching lesson",
  sections: [
    {
      id: "synthetic-explanation",
      kind: "explanation",
      title: "Synthetic explanation",
      paragraphs: ["A synthetic teaching passage"],
      required: true,
    },
  ],
  assets: [],
};
const admitted = { version: "synthetic-v1", source: lesson };
const ok = (data: unknown) => ({ data, error: null });
async function retrievalChunk() {
  const [chunk] = await curriculumChunks(lesson);
  return {
    ...chunk,
    lesson: identity.lesson,
    title: lesson.title,
    sourceSha: await sha256(intakeCanonical(lesson)),
  };
}
const invoke = (value: unknown = identity) =>
  askCurriculum(value as Parameters<typeof askCurriculum>[0]);
beforeEach(() => {
  vi.resetAllMocks();
  mock.events.length = 0;
  mock.replay = null;
  mock.rpc.mockImplementation(async () => {
    mock.events.push("source");
    return ok(admitted);
  });
  mock.embed.mockImplementation(async () => {
    mock.events.push("embed");
    throw new Error("STOP_AT_SYNTHETIC_EMBEDDING");
  });
  mock.llm.mockImplementation(async () => {
    throw new Error("UNEXPECTED_LLM");
  });
});
describe("M08 protected source preflight", () => {
  it("rejects an existing source-access refusal before any provider invocation", async () => {
    mock.rpc.mockResolvedValue({ data: null, error: { message: "ASSISTANT_ACCESS_DENIED" } });
    await expect(invoke()).rejects.toThrow("CURRICULUM_SOURCE_UNAVAILABLE");
    expect(mock.rpc).toHaveBeenCalledOnce();
    expect(mock.provider).not.toHaveBeenCalled();
    expect(mock.embed).not.toHaveBeenCalled();
    expect(mock.llm).not.toHaveBeenCalled();
  });
  it.each([
    null,
    {},
    { version: "synthetic-v1" },
    { version: null, source: lesson },
    { version: "", source: lesson },
    { version: "synthetic-v1", source: {} },
    { version: "synthetic-v1", source: { ...lesson, id: "other-lesson" } },
  ])("rejects a missing protected document or version before external work: %j", async (data) => {
    mock.rpc.mockResolvedValue({ data, error: null });
    await expect(invoke()).rejects.toThrow("CURRICULUM_SOURCE_UNAVAILABLE");
    expect(mock.provider).not.toHaveBeenCalled();
    expect(mock.embed).not.toHaveBeenCalled();
    expect(mock.llm).not.toHaveBeenCalled();
  });
  it("does not query or embed when lesson identity is absent", async () => {
    await expect(invoke({ ...identity, lesson: null })).rejects.toThrow(
      "CURRICULUM_SOURCE_UNAVAILABLE",
    );
    expect(mock.rpc).not.toHaveBeenCalled();
    expect(mock.provider).not.toHaveBeenCalled();
    expect(mock.embed).not.toHaveBeenCalled();
  });
  it("preserves a permitted source path and binds the existing lookup identity before embedding", async () => {
    await expect(invoke()).rejects.toThrow("STOP_AT_SYNTHETIC_EMBEDDING");
    expect(mock.events).toEqual(["source", "provider:openai_embedding", "embed"]);
    expect(mock.rpc).toHaveBeenCalledExactlyOnceWith("curriculum_assistant_source", {
      p_user: identity.userId,
      p_area: identity.area,
      p_course: identity.course,
      p_locale: identity.locale,
      p_child: identity.childId,
      p_lesson: identity.lesson,
    });
    expect(mock.embed).toHaveBeenCalledExactlyOnceWith([identity.query]);
    expect(mock.llm).not.toHaveBeenCalled();
  });
  it("retains the later source refusal after permitted embedding without starting answer generation", async () => {
    mock.rpc
      .mockResolvedValueOnce(ok(admitted))
      .mockResolvedValueOnce({ data: null, error: { message: "ASSISTANT_ACCESS_DENIED" } });
    mock.embed.mockResolvedValue([[0, 1]]);
    await expect(invoke()).rejects.toThrow("CURRICULUM_SOURCE_UNAVAILABLE");
    expect(mock.rpc).toHaveBeenCalledTimes(2);
    expect(mock.provider).toHaveBeenCalledExactlyOnceWith("openai_embedding");
    expect(mock.embed).toHaveBeenCalledOnce();
    expect(mock.llm).not.toHaveBeenCalled();
  });
});

describe("same-version source proof", () => {
  it("does not generate an answer after the active version changes during embedding", async () => {
    mock.rpc.mockResolvedValueOnce(ok(admitted)).mockResolvedValueOnce(
      ok({
        version: "synthetic-v2",
        chunks: [await retrievalChunk()],
      }),
    );
    mock.embed.mockResolvedValue([[0, 1]]);
    await expect(invoke()).rejects.toThrow("CURRICULUM_SOURCE_CHANGED");
    expect(mock.llm).not.toHaveBeenCalled();
    expect(mock.provider).toHaveBeenCalledExactlyOnceWith("openai_embedding");
  });

  it.each(["sourceSha", "title"] as const)(
    "rejects a mismatched %s before generation",
    async (field) => {
      const chunk = await retrievalChunk();
      const changed = field === "sourceSha" ? "f".repeat(64) : "Unverified title";
      mock.rpc.mockResolvedValueOnce(ok(admitted)).mockResolvedValueOnce(
        ok({
          version: admitted.version,
          chunks: [{ ...chunk, [field]: changed }],
        }),
      );
      mock.embed.mockResolvedValue([[0, 1]]);
      await expect(invoke()).rejects.toThrow("CURRICULUM_SOURCE_CHANGED");
      expect(mock.llm).not.toHaveBeenCalled();
    },
  );

  it("returns only the matching admitted source as a citation", async () => {
    const chunk = await retrievalChunk();
    mock.rpc
      .mockResolvedValueOnce(ok(admitted))
      .mockResolvedValueOnce(
        ok({
          version: admitted.version,
          chunks: [chunk],
        }),
      )
      .mockResolvedValue(ok(admitted));
    mock.embed.mockResolvedValue([[0, 1]]);
    mock.llm.mockResolvedValue({
      content: JSON.stringify({
        grounding: "supported",
        answer: "Synthetic answer",
        sourceIds: ["S1"],
      }),
    });
    expect(await invoke()).toMatchObject({
      status: 200,
      body: {
        answer: "Synthetic answer",
        citations: [{ label: lesson.title, stepId: lesson.id, sourceId: chunk.id }],
      },
      proof: [{ sourceSha: chunk.sourceSha, version: admitted.version }],
    });
    expect(mock.rpc).toHaveBeenCalledTimes(4);
  });

  it("does not return a generated answer if the course changes during generation", async () => {
    mock.rpc
      .mockResolvedValueOnce(ok(admitted))
      .mockResolvedValueOnce(
        ok({
          version: admitted.version,
          chunks: [await retrievalChunk()],
        }),
      )
      .mockResolvedValueOnce(ok(admitted))
      .mockResolvedValueOnce(
        ok({
          ...admitted,
          version: "synthetic-v2",
        }),
      );
    mock.embed.mockResolvedValue([[0, 1]]);
    mock.llm.mockResolvedValue({
      content: JSON.stringify({
        grounding: "supported",
        answer: "Synthetic answer",
        sourceIds: ["S1"],
      }),
    });
    await expect(invoke()).rejects.toThrow("CURRICULUM_GROUNDING_INVALID");
    expect(mock.llm).toHaveBeenCalledOnce();
  });
});

it("does not replay an answer after its indexed source is replaced", async () => {
  const chunk = await retrievalChunk();
  mock.replay = { status: 200, proof: [{ ...chunk, version: admitted.version }] };
  expect(await invoke()).toBe(true);
  mock.rpc.mockResolvedValueOnce(ok({ ...admitted, version: "synthetic-v2" }));
  expect(await invoke()).toBe(false);
  expect(mock.provider).not.toHaveBeenCalled();
});

it("requires current lesson authorization for a stored out-of-scope response", async () => {
  mock.replay = { status: 422 };
  mock.rpc.mockResolvedValueOnce(ok({ version: admitted.version, source: null }));
  await expect(invoke()).rejects.toThrow("CURRICULUM_SOURCE_UNAVAILABLE");
  expect(mock.provider).not.toHaveBeenCalled();
});
