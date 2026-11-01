import { assistantAuthFixture } from "@/test/assistant-auth-fixture";
import { boxedAssistantFixture } from "@/test/boxed-assistant-runtime-fixture";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AssistantPanel } from "@/components/assistant/AssistantPanel";
import { LocaleProvider } from "@/lib/locale/locale-context";

const { callRuntime, account } = vi.hoisted(() => ({
  callRuntime: vi.fn(), account: { id: "scope-user" },
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { onAuthStateChange: vi.fn() } },
}));
vi.mock("@/lib/assistant-runtime", () => ({
  callGuardedAssistantRuntimeBoxed: (...args: unknown[]) => boxedAssistantFixture(callRuntime(...args)),
}));
const auth = assistantAuthFixture(() => account.id);
vi.mock("@/lib/auth-context", () => ({ useAuth: () => auth }));
vi.mock("@/lib/curriculum-data", () => ({
  PATHS: ["intro", "future-card"].map((id) => ({ id, title: id, status: "open", modules: [] })),
}));
vi.mock("@/lib/locale-curriculum/resolve-curriculum-label", () => ({
  getCurriculumPathLabel: (_locale: string, id: string) => id,
  getCurriculumLessonLabel: (_locale: string, id: string) => id,
}));
vi.mock("@/lib/learner-context", () => ({ useLearnerContext: () => ({
  currentUser: { id: account.id, email: null, isAuthenticated: true },
  currentRoute: "/ai-assistant", currentPath: null, currentModule: null, currentLesson: null,
  currentMission: null, completedLessonsCount: 0, totalLessonsCount: 0, nextLesson: null,
  overallNextLesson: { id: "other-card-step", title: "Other card" },
  isReady: true,
}) }));

const override = (card: string, lesson = "step-1") => ({
  currentPathId: card, currentModuleId: `${card}-station`, currentLessonId: `${card}-${lesson}`,
  currentPathTitle: card, currentModuleTitle: "station", currentLessonTitle: lesson,
  nextLessonTitle: null, currentMission: null,
});
function panel(card?: string, lesson?: string, locale: "en" | "ar-EG" = "en") {
  return <LocaleProvider effectiveLocale={locale}>
    <AssistantPanel compact={!!card} contextOverride={card ? override(card, lesson) : null} />
  </LocaleProvider>;
}
function ask(query = "Explain this concept") {
  fireEvent.change(screen.getByRole("textbox"), { target: { value: query } });
  fireEvent.submit(screen.getByRole("textbox").closest("form")!);
}
describe("assistant card isolation", () => {
  beforeEach(() => {
    callRuntime.mockReset(); localStorage.clear(); account.id = "scope-user";
  });
  it("requires explicit card selection and includes a newly registered card without a hardcoded list", async () => {
    callRuntime.mockResolvedValue({ answer: "Future answer", citations: [] });
    render(panel());
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(callRuntime).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "future-card" } });
    ask();
    await screen.findByText("Future answer");
    expect(callRuntime.mock.calls[0][0].learnerContext).toMatchObject({
      currentPath: "future-card", currentModule: null, currentLesson: null, nextLessonTitle: null,
    });
  });
  it("does not send another card's history, but restores the first card's own history", async () => {
    callRuntime.mockResolvedValue({ answer: "First card answer", citations: [] });
    render(panel());
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "intro" } });
    ask("First question"); await screen.findByText("First card answer");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "future-card" } });
    expect(screen.queryByText("First card answer")).toBeNull();
    callRuntime.mockResolvedValue({ answer: "Second card answer", citations: [] });
    ask("Second question"); await screen.findByText("Second card answer");
    expect(callRuntime.mock.calls[1][0].conversationHistory).toBeUndefined();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "intro" } });
    await screen.findByText("First card answer");
    expect(screen.queryByText("Second card answer")).toBeNull();
  });
  it.each(["card", "step", "account", "locale"])("discards pending compact responses after a %s change", async (change) => {
    let finish!: (value: unknown) => void;
    callRuntime.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const view = render(panel("intro")); ask();
    expect(callRuntime).toHaveBeenCalledTimes(1);
    if (change === "account") account.id = "other-user";
    view.rerender(panel(change === "card" ? "future-card" : "intro",
      change === "step" ? "step-2" : "step-1", change === "locale" ? "ar-EG" : "en"));
    await act(async () => finish({ answer: "STALE ANSWER", citations: [] }));
    await waitFor(() => expect(screen.queryByText("STALE ANSWER")).toBeNull());
    expect(screen.getByRole("textbox")).toHaveValue("");
  });
});
