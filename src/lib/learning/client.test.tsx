import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { learningCommand } from "./client";
import { LearningLessonNotes } from "@/components/journey/LearningLessonNotes";
import { noteDraftKey } from "./drafts";

const state = vi.hoisted(() => ({ rpc: vi.fn(), generation: {} }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: state.rpc } }));
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: "test-account" },
    loading: false,
    authGeneration: state.generation,
    isAuthGenerationCurrent: (value: object) => value === state.generation,
  }),
}));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: "en" }) }));

beforeEach(() => {
  state.rpc.mockReset();
  localStorage.clear();
});
afterEach(() => cleanup());

describe("learning note response boundary", () => {
  it.each(["note", "save_note"])(
    "preserves valid %s responses and request parameters",
    async (action) => {
      const result = { content: "saved text", revision: 4, extra: "preserved" };
      const input = { recordId: "record", lesson: "lesson", revision: 3, content: "saved text" };
      state.rpc.mockResolvedValue({ data: result, error: null });
      expect(await learningCommand(action, input)).toBe(result);
      expect(state.rpc).toHaveBeenCalledTimes(1);
      expect(state.rpc).toHaveBeenCalledWith("learning_command", {
        p_action: action,
        p_data: input,
      });
    },
  );

  it("preserves the empty initial note", async () => {
    const result = { content: "", revision: 0 };
    state.rpc.mockResolvedValue({ data: result, error: null });
    expect(await learningCommand("note")).toBe(result);
  });

  const invalid = [
    ["null", null],
    ["array", []],
    ["empty object", {}],
    ["string", "text"],
    ["absent content", { revision: 1 }],
    ["absent revision", { content: "text" }],
    ["non-string content", { content: 4, revision: 1 }],
    ["string revision", { content: "text", revision: "1" }],
    ["negative revision", { content: "text", revision: -1 }],
    ["fractional revision", { content: "text", revision: 1.5 }],
    ["unsafe revision", { content: "text", revision: Number.MAX_SAFE_INTEGER + 1 }],
    ["non-finite revision", { content: "text", revision: Infinity }],
  ] as const;
  it.each(invalid)("rejects %s for note reads and acknowledgments", async (_name, value) => {
    state.rpc.mockResolvedValue({ data: value, error: null });
    for (const action of ["note", "save_note"]) {
      await expect(learningCommand(action)).rejects.toThrow("LEARNING_RESPONSE_INVALID");
    }
  });

  it("keeps RPC errors distinguishable and takes no second action", async () => {
    state.rpc.mockResolvedValue({ data: {}, error: { message: "LEARNING_NOTE_CONFLICT" } });
    await expect(learningCommand("save_note")).rejects.toThrow("LEARNING_NOTE_CONFLICT");
    expect(state.rpc).toHaveBeenCalledTimes(1);
  });

  it("preserves an empty save_position acknowledgment", async () => {
    const result = {};
    state.rpc.mockResolvedValue({ data: result, error: null });
    expect(await learningCommand("save_position")).toBe(result);
  });

  it("keeps the draft after an invalid save acknowledgment and retries the same request", async () => {
    let writes = 0;
    state.rpc.mockImplementation(
      async (_name: string, parameters: { p_action: string; p_data: { content?: string } }) => {
        const { p_action: action, p_data: input } = parameters;
        if (action === "records")
          return {
            error: null,
            data: [
              {
                id: "record",
                subject_id: "test-account",
                area: "academic",
                course: "AC-T",
                learning_model: { activities: ["notes"] },
              },
            ],
          };
        if (action === "note") return { error: null, data: { content: "cloud text", revision: 1 } };
        if (action === "save_note")
          return {
            error: null,
            data: ++writes === 1 ? {} : { content: input.content, revision: 2 },
          };
        throw new Error("UNEXPECTED_ACTION");
      },
    );
    const query = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={query}>
        <LearningLessonNotes scope={{ area: "academic", course: "AC-T", lesson: "L1" }} />
      </QueryClientProvider>,
    );
    const textbox = await screen.findByRole("textbox");
    await waitFor(() => expect(textbox).toHaveValue("cloud text"));
    fireEvent.change(textbox, { target: { value: "my unsaved work" } });
    const retry = await screen.findByRole("button", { name: "Retry" }, { timeout: 2500 });
    expect(textbox).toHaveValue("my unsaved work");
    expect(screen.queryByText("Save confirmed")).toBeNull();
    const key = noteDraftKey("test-account", "test-account", "academic", "AC-T", "L1");
    expect(JSON.parse(localStorage.getItem(key)!)).toMatchObject({
      content: "my unsaved work",
      revision: 1,
    });
    fireEvent.click(retry);
    await screen.findByText("Save confirmed", {}, { timeout: 2500 });
    expect(localStorage.getItem(key)).toBeNull();
    const requests = state.rpc.mock.calls.filter(
      ([, parameters]) => parameters.p_action === "save_note",
    );
    expect(requests).toHaveLength(2);
    expect(requests[1][1].p_data).toEqual(requests[0][1].p_data);
    query.clear();
  });
});
