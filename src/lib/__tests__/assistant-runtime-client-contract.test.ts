import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AssistantRuntimeRequestPayload } from "@/lib/assistant-runtime";
import {
  buildAssistantRuntimePayload,
  resolveAssistantLearnerContext,
  type ResolvedAssistantLearnerContext,
} from "@/lib/assistant/resolve-assistant-learner-context";
import type { LearnerContext } from "@/lib/learner-context";
import type { RagPackageLocale } from "@/lib/locale-lessons/types";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

const CANONICAL_LOCALES = ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const;

const getSession = vi.fn();
const invoke = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => getSession(...args),
    },
    functions: {
      invoke: (...args: unknown[]) => invoke(...args),
    },
  },
}));

function read(rel: string): string {
  return readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

function baseCtx(): Pick<
  LearnerContext,
  | "currentPath"
  | "currentModule"
  | "currentLesson"
  | "currentMission"
  | "completedLessonsCount"
  | "totalLessonsCount"
  | "nextLesson"
> {
  return {
    currentPath: { id: "intro", title: "Path Title" } as LearnerContext["currentPath"],
    currentModule: {
      id: "intro-m1",
      title: "Module Title",
    } as LearnerContext["currentModule"],
    currentLesson: {
      id: "intro-m1-l1-what-is-ai",
      title: "Lesson Title",
      mission: { intro: "intro", prompt: "prompt" },
    } as LearnerContext["currentLesson"],
    currentMission: {
      intro: "intro",
      prompt: "prompt",
    } as LearnerContext["currentMission"],
    completedLessonsCount: 1,
    totalLessonsCount: 10,
    nextLesson: {
      id: "next",
      title: "Next Title",
    } as LearnerContext["nextLesson"],
  };
}

function resolvedFor(locale: RagPackageLocale): ResolvedAssistantLearnerContext {
  return resolveAssistantLearnerContext(locale, baseCtx(), null);
}

describe("AssistantRuntimeRequestPayload type contract", () => {
  it("does not own a retrievalResults property on the request payload type", () => {
    const source = read("src/lib/assistant-runtime.ts");
    expect(source).not.toMatch(/retrievalResults\??\s*:/);
  });

  it("requires learnerContext.locale as RagPackageLocale", () => {
    const source = read("src/lib/assistant-runtime.ts");
    expect(source).toMatch(/locale:\s*RagPackageLocale\b/);
    expect(source).not.toMatch(/locale\?\s*:\s*string\s*\|\s*null/);
  });
});

describe("ResolvedAssistantLearnerContext locale contract", () => {
  it("requires locale as RagPackageLocale not nullable", () => {
    const source = read("src/lib/assistant/resolve-assistant-learner-context.ts");
    expect(source).toMatch(/locale:\s*RagPackageLocale\b/);
    expect(source).not.toMatch(/locale:\s*RagPackageLocale\s*\|\s*null/);
  });
});

describe("buildAssistantRuntimePayload serialization", () => {
  for (const locale of CANONICAL_LOCALES) {
    it(`emits canonical locale ${locale} without retrievalResults`, () => {
      const payload = buildAssistantRuntimePayload("hello", resolvedFor(locale));
      expect(payload.learnerContext.locale).toBe(locale);
      expect(Object.prototype.hasOwnProperty.call(payload, "retrievalResults")).toBe(false);
      expect(payload).not.toHaveProperty("retrievalResults");
    });
  }

  it("keeps path/module/lesson IDs separate from title fields", () => {
    const payload = buildAssistantRuntimePayload("hello", resolvedFor("en"));
    expect(payload.learnerContext.currentPath).toBe("intro");
    expect(payload.learnerContext.currentModule).toBe("intro-m1");
    expect(payload.learnerContext.currentLesson).toBe("intro-m1-l1-what-is-ai");
    expect(payload.learnerContext.currentPathTitle).toBe("Path Title");
    expect(payload.learnerContext.currentModuleTitle).toBe("Module Title");
    expect(payload.learnerContext.currentLessonTitle).toBe("Lesson Title");
  });

  it("does not accept retrievalResults on the built request object", () => {
    const payload = buildAssistantRuntimePayload("hello", resolvedFor("en"));
    expect("retrievalResults" in payload).toBe(false);
  });
});

describe("callAssistantRuntime invoke boundary", () => {
  beforeEach(() => {
    getSession.mockReset();
    invoke.mockReset();
    getSession.mockResolvedValue({
      data: { session: { access_token: "test-token" } },
    });
    invoke.mockResolvedValue({
      data: {
        ok: true,
        runtime: "connected",
        receivedQuery: "hello",
        retrievalCount: 0,
        contextDetected: true,
        learnerContext: {
          currentPath: null,
          currentModule: null,
          currentLesson: null,
        },
        message: "ok",
        ts: new Date().toISOString(),
      },
      error: null,
    });
  });

  it("serializes canonical locale and omits retrievalResults at invoke", async () => {
    const { callAssistantRuntime } = await import("@/lib/assistant-runtime");
    const payload = buildAssistantRuntimePayload("hello", resolvedFor("ar-MSA"));
    await callAssistantRuntime(payload);

    expect(invoke).toHaveBeenCalledTimes(1);
    const [, options] = invoke.mock.calls[0]!;
    const body = options.body as AssistantRuntimeRequestPayload;
    expect(body.learnerContext.locale).toBe("ar-MSA");
    expect(Object.prototype.hasOwnProperty.call(body, "retrievalResults")).toBe(false);
  });

  it("localizes quota and grounding errors from the server", async () => {
    const { callAssistantRuntime } = await import("@/lib/assistant-runtime");
    invoke.mockResolvedValueOnce({
      data: null,
      error: { context: new Response(JSON.stringify({ error: "rate limited" }), { status: 429 }) },
    });
    await expect(
      callAssistantRuntime(buildAssistantRuntimePayload("hello", resolvedFor("en"))),
    ).rejects.toThrow(/limit/i);

    invoke.mockResolvedValueOnce({
      data: null,
      error: {
        context: new Response(JSON.stringify({ reason: "insufficient_grounding" }), {
          status: 422,
        }),
      },
    });
    await expect(
      callAssistantRuntime(buildAssistantRuntimePayload("hello", resolvedFor("en"))),
    ).rejects.toThrow(/lesson content/i);
  });

  it("fails before session acquisition when locale is missing", async () => {
    const { callAssistantRuntime } = await import("@/lib/assistant-runtime");
    const payload = {
      query: "hello",
      learnerContext: {},
    } as AssistantRuntimeRequestPayload;

    await expect(callAssistantRuntime(payload)).rejects.toThrow();
    expect(getSession).not.toHaveBeenCalled();
    expect(invoke).not.toHaveBeenCalled();
  });

  it("fails before session acquisition when locale is null", async () => {
    const { callAssistantRuntime } = await import("@/lib/assistant-runtime");
    const payload = {
      query: "hello",
      learnerContext: { locale: null },
    } as unknown as AssistantRuntimeRequestPayload;

    await expect(callAssistantRuntime(payload)).rejects.toThrow();
    expect(getSession).not.toHaveBeenCalled();
    expect(invoke).not.toHaveBeenCalled();
  });

  it("fails before session acquisition when locale is blank", async () => {
    const { callAssistantRuntime } = await import("@/lib/assistant-runtime");
    const payload = {
      query: "hello",
      learnerContext: { locale: "" },
    } as unknown as AssistantRuntimeRequestPayload;

    await expect(callAssistantRuntime(payload)).rejects.toThrow();
    expect(getSession).not.toHaveBeenCalled();
    expect(invoke).not.toHaveBeenCalled();
  });

  it("fails before session acquisition when locale is whitespace-only", async () => {
    const { callAssistantRuntime } = await import("@/lib/assistant-runtime");
    const payload = {
      query: "hello",
      learnerContext: { locale: "   " },
    } as unknown as AssistantRuntimeRequestPayload;

    await expect(callAssistantRuntime(payload)).rejects.toThrow();
    expect(getSession).not.toHaveBeenCalled();
    expect(invoke).not.toHaveBeenCalled();
  });

  it("fails before session acquisition when locale has surrounding whitespace", async () => {
    const { callAssistantRuntime } = await import("@/lib/assistant-runtime");
    const payload = {
      query: "hello",
      learnerContext: { locale: " en " },
    } as unknown as AssistantRuntimeRequestPayload;

    await expect(callAssistantRuntime(payload)).rejects.toThrow();
    expect(getSession).not.toHaveBeenCalled();
    expect(invoke).not.toHaveBeenCalled();
  });

  it("fails before session acquisition when locale case differs", async () => {
    const { callAssistantRuntime } = await import("@/lib/assistant-runtime");
    const payload = {
      query: "hello",
      learnerContext: { locale: "EN" },
    } as unknown as AssistantRuntimeRequestPayload;

    await expect(callAssistantRuntime(payload)).rejects.toThrow();
    expect(getSession).not.toHaveBeenCalled();
    expect(invoke).not.toHaveBeenCalled();
  });

  it("fails before session acquisition when locale is unsupported", async () => {
    const { callAssistantRuntime } = await import("@/lib/assistant-runtime");
    const payload = {
      query: "hello",
      learnerContext: { locale: "fr-FR" },
    } as unknown as AssistantRuntimeRequestPayload;

    await expect(callAssistantRuntime(payload)).rejects.toThrow();
    expect(getSession).not.toHaveBeenCalled();
    expect(invoke).not.toHaveBeenCalled();
  });
});

describe("shared production builder and transport wiring", () => {
  it("AssistantPanel uses shared builder and transport without sending retrievalResults", () => {
    const source = read("src/components/assistant/AssistantPanel.tsx");
    expect(source).toContain("buildAssistantRuntimePayload");
    expect(source).toContain("callAssistantRuntime");
    expect(source).not.toContain("searchPlatformContent");
    expect(source).toMatch(/buildAssistantRuntimePayload\(\s*q\s*,\s*resolvedContext\s*\)/);
    expect(source).not.toMatch(
      /buildAssistantRuntimePayload\(\s*q\s*,\s*resolvedContext\s*,\s*retrievalResults\s*\)/,
    );
  });

  it("administrative assistant-runtime route uses shared builder and transport", () => {
    const source = read("src/routes/assistant-runtime.tsx");
    expect(source).toContain("buildAssistantRuntimePayload");
    expect(source).toContain("resolveAssistantLearnerContext");
    expect(source).toContain("callAssistantRuntime");
    expect(source).toContain("useLocale");
    expect(source).not.toMatch(/retrievalResults\s*:/);
  });

  it("administrative caller sends canonical IDs in ID fields and titles in title fields", () => {
    const source = read("src/routes/assistant-runtime.tsx");
    expect(source).toContain("resolveAssistantLearnerContext");
    expect(source).toContain("buildAssistantRuntimePayload");
    expect(source).not.toMatch(/currentPath:\s*ctx\.currentPath\?\.title/);
    expect(source).not.toMatch(/currentModule:\s*ctx\.currentModule\?\.title/);
    expect(source).not.toMatch(
      /currentLesson:\s*ctx\.currentLesson\s*\n?\s*\?\s*`\$\{ctx\.currentLesson\.title\}/,
    );
  });

  it("uses only server-authoritative citations for display", () => {
    const panel = read("src/components/assistant/AssistantPanel.tsx");
    expect(panel).not.toContain("searchPlatformContent");
    expect(panel).toContain("res.citations");
    expect(panel).toMatch(/buildAssistantRuntimePayload\(\s*q\s*,\s*resolvedContext\s*\)/);

    const builder = read("src/lib/assistant/resolve-assistant-learner-context.ts");
    expect(builder).toContain("export function buildAssistantRuntimePayload");
    expect(builder).not.toMatch(/retrievalResults/);
  });
});
