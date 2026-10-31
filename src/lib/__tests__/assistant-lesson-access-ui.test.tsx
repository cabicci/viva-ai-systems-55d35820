import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { assistantAuthFixture } from "@/test/assistant-auth-fixture";
const state = vi.hoisted(() => ({ actor: "first", read: vi.fn(), opaque: false, generation: Object.freeze({ value: 1 }) }));
const auth = assistantAuthFixture(() => state.actor);
vi.mock("@/lib/auth-context", () => ({ useAuth: () => state.opaque ? {
  user: { id: state.actor }, loading: false, authGeneration: state.generation,
  isAuthGenerationCurrent: (captured: object) => captured === state.generation,
} : auth }));
vi.mock("@/lib/lesson-assistant-access.functions", () => ({ getLessonAssistantAccess: state.read }));
import { LessonAssistantAccess } from "@/components/assistant/LessonAssistantAccess";
let client: QueryClient;
beforeEach(() => {
  state.actor = "first"; state.read.mockReset(); state.opaque = false; state.generation = Object.freeze({ value: 1 });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => { cleanup(); client.clear(); });
function view() {
  return <QueryClientProvider client={client}><LessonAssistantAccess pathId="intro" lessonId="intro-m1-l1-what-is-ai" locale="en">
    <textarea aria-label="permitted question" />
  </LessonAssistantAccess></QueryClientProvider>;
}
it("keeps the question unavailable until the authenticated allowance has resolved", async () => {
  let finish!: (value: unknown) => void;
  state.read.mockReturnValue(new Promise((r) => { finish = r; }));
  render(view());
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(screen.getByRole("status")).toBeVisible();
  await act(async () => finish({ state: "allowed" }));
  expect(await screen.findByRole("textbox")).toBeEnabled();
});
it("shows an actual denied decision without offering a question and can recheck existing access", async () => {
  state.read.mockResolvedValueOnce({ state: "denied", reason: "access" }).mockResolvedValueOnce({ state: "allowed" });
  render(view());
  expect(await screen.findByRole("alert")).toBeVisible();
  expect(screen.queryByRole("textbox")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Check again" }));
  expect(await screen.findByRole("textbox")).toBeEnabled();
  expect(state.read).toHaveBeenCalledTimes(2);
});
it("does not expose a retired account's permission after the account changes", async () => {
  let finish!: (value: unknown) => void;
  state.read.mockReturnValueOnce(new Promise((r) => { finish = r; })).mockResolvedValue({ state: "denied", reason: "access" });
  const ui = render(view());
  state.actor = "second"; ui.rerender(view());
  await act(async () => finish({ state: "allowed" }));
  expect(await screen.findByRole("alert")).toBeVisible();
  expect(screen.queryByRole("textbox")).toBeNull();
});
it("rechecks a new opaque auth generation even if its local numeric hint is reused", async () => {
  state.opaque = true;
  state.read.mockResolvedValueOnce({ state: "allowed" }).mockResolvedValueOnce({ state: "denied", reason: "access" });
  const ui = render(view());
  expect(await screen.findByRole("textbox")).toBeEnabled();
  state.generation = Object.freeze({ value: 1 });
  ui.rerender(view());
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(await screen.findByRole("alert")).toBeVisible();
  expect(state.read).toHaveBeenCalledTimes(2);
});
