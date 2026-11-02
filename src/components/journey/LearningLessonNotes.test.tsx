import { afterEach, beforeEach, expect, it, vi } from "vitest";
/* eslint-disable @typescript-eslint/no-explicit-any -- Mock RPC actions intentionally return heterogeneous SQL DTOs. */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LearningLessonNotes } from "./LearningLessonNotes";
import { noteDraftKey } from "@/lib/learning/drafts";
const m = vi.hoisted(() => ({ user: "a", generation: {}, rpc: vi.fn(), current: vi.fn() }));
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: m.user },
    loading: false,
    authGeneration: m.generation,
    isAuthGenerationCurrent: m.current,
  }),
}));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: "en" }) }));
vi.mock("@/lib/learning/client", () => ({ learningCommand: m.rpc }));
const scope = { area: "academic" as const, course: "AC-T", lesson: "L1" };
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const tree = () => (
    <QueryClientProvider client={client}>
      <LearningLessonNotes scope={scope} />
    </QueryClientProvider>
  );
  const result = render(tree());
  return { ...result, client, refresh: () => result.rerender(tree()) };
}
beforeEach(() => {
  m.user = "a";
  m.generation = {};
  localStorage.clear();
  m.rpc.mockReset();
  m.current.mockImplementation((g) => g === m.generation);
  m.rpc.mockImplementation(async (action: string, data: any) => {
    if (action === "records")
      return [
        {
          id: `record-${m.user}`,
          subject_id: m.user,
          area: "academic",
          course: "AC-T",
          learning_model: { activities: ["notes"] },
        },
      ];
    if (action === "note") return { content: `cloud-${m.user}`, revision: 1 };
    return { content: data.content, revision: 2 };
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("keeps an offline account-scoped draft readable when the cloud cannot load", async () => {
  localStorage.setItem(
    noteDraftKey("a", "a", "academic", "AC-T", "L1"),
    JSON.stringify({ content: "offline work", revision: 1 }),
  );
  m.rpc.mockImplementation(async (action: string) => {
    if (action === "records")
      return [
        {
          id: "r",
          subject_id: "a",
          area: "academic",
          course: "AC-T",
          learning_model: { activities: ["notes"] },
        },
      ];
    throw new Error("offline");
  });
  mount();
  expect(await screen.findByRole("textbox")).toHaveValue("offline work");
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "continued offline work" } });
  expect(
    JSON.parse(localStorage.getItem(noteDraftKey("a", "a", "academic", "AC-T", "L1"))!).content,
  ).toBe("continued offline work");
  expect(m.rpc.mock.calls.some(([action]) => action === "save_note")).toBe(false);
});
it("does not impose notes on a curriculum that only defines exams", async () => {
  m.rpc.mockImplementation(async (action: string) =>
    action === "records"
      ? [
          {
            id: "r",
            subject_id: "a",
            area: "academic",
            course: "AC-T",
            learning_model: { activities: ["exam"] },
          },
        ]
      : { content: "", revision: 0 },
  );
  const view = mount();
  await waitFor(() => expect(view.container).toBeEmptyDOMElement());
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(m.rpc.mock.calls.some(([action]) => action === "save_note")).toBe(false);
});
it("retains both versions when another device updated the note", async () => {
  localStorage.setItem(
    noteDraftKey("a", "a", "academic", "AC-T", "L1"),
    JSON.stringify({ content: "local work", revision: 0 }),
  );
  mount();
  expect(await screen.findByRole("textbox")).toHaveValue("local work");
  expect(await screen.findByText("cloud-a")).toBeVisible();
  expect(screen.getByRole("button", { name: "Save my draft after review" })).toBeVisible();
  expect(m.rpc.mock.calls.some(([action]) => action === "save_note")).toBe(false);
});
it("retries an unacknowledged write with the same request identity", async () => {
  let writes = 0;
  const base = m.rpc.getMockImplementation()!;
  m.rpc.mockImplementation(async (action: string, data: any) => {
    if (action === "save_note" && ++writes === 1) throw new Error("lost acknowledgement");
    return base(action, data);
  });
  mount();
  fireEvent.change(await screen.findByRole("textbox"), { target: { value: "my note" } });
  await screen.findByRole("button", { name: "Retry" }, { timeout: 2500 });
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(writes).toBe(2), { timeout: 2500 });
  const requests = m.rpc.mock.calls.filter(([action]) => action === "save_note");
  expect(requests[0][1].requestId).toBe(requests[1][1].requestId);
  await waitFor(() => expect(screen.getByText("Save confirmed")).toBeVisible());
});
it("never displays the former account's draft after an account transition", async () => {
  const view = mount();
  expect(await screen.findByRole("textbox")).toHaveValue("cloud-a");
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "private-a" } });
  m.user = "b";
  m.generation = {};
  view.refresh();
  expect(await screen.findByRole("textbox")).toHaveValue("cloud-b");
  expect(screen.queryByDisplayValue("private-a")).not.toBeInTheDocument();
});
it("recovers a pending note after the same account receives a new session generation", async () => {
  const base = m.rpc.getMockImplementation()!;
  let writes = 0;
  m.rpc.mockImplementation((action: string, data: any) => {
    if (action === "save_note" && ++writes === 1) return new Promise(() => {});
    return base(action, data);
  });
  const view = mount();
  fireEvent.change(await screen.findByRole("textbox"), { target: { value: "session-safe note" } });
  await waitFor(() => expect(writes).toBe(1), { timeout: 2500 });
  m.generation = {};
  view.refresh();
  await waitFor(() => expect(writes).toBe(2), { timeout: 2500 });
  expect(await screen.findByText("Save confirmed")).toBeVisible();
  const requests = m.rpc.mock.calls.filter(([action]) => action === "save_note");
  expect(requests[0][1].requestId).toBe(requests[1][1].requestId);
});
it("reports when this browser cannot retain a local draft", async () => {
  mount();
  const textbox = await screen.findByRole("textbox");
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });
  fireEvent.change(textbox, { target: { value: "not yet saved" } });
  expect(screen.getAllByText(/could not keep a local copy/).length).toBeGreaterThan(0);
  expect(
    screen.queryByText("Saved on this device; cloud save is not confirmed."),
  ).not.toBeInTheDocument();
});
it("keeps unsaved in-memory text during cloud refetch even when browser storage failed", async () => {
  const view = mount();
  const textbox = await screen.findByRole("textbox");
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });
  fireEvent.change(textbox, { target: { value: "only remaining local copy" } });
  const base = m.rpc.getMockImplementation()!;
  m.rpc.mockImplementation((action: string, data: any) =>
    action === "note"
      ? Promise.resolve({ content: "changed on another device", revision: 2 })
      : base(action, data),
  );
  await view.client.invalidateQueries({ queryKey: ["learning-note"] });
  expect(await screen.findByText("changed on another device")).toBeVisible();
  expect(screen.getByRole("textbox")).toHaveValue("only remaining local copy");
  expect(screen.getByRole("button", { name: "Save my draft after review" })).toBeVisible();
});
