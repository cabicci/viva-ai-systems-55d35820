import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AssistantPanel } from "@/components/assistant/AssistantPanel";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { getAssistantSession, resetAssistantSession } from "@/lib/assistant-session-store";

const callRuntime = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { onAuthStateChange: vi.fn() } },
}));
vi.mock("@/lib/assistant-runtime", () => ({
  callAssistantRuntime: (...args: unknown[]) => callRuntime(...args),
}));
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: { id: "experience-test" } }),
}));
vi.mock("@/lib/learner-context", () => ({
  useLearnerContext: () => ({
    currentRoute: "/ai-assistant",
    currentPath: null,
    currentModule: null,
    currentLesson: null,
    currentMission: null,
    completedLessonsCount: 7,
    totalLessonsCount: 7,
    nextLesson: null,
    overallCompletedLessonsCount: 93,
    overallTotalLessonsCount: 100,
    overallNextLesson: null,
    isReady: true,
  }),
}));

describe("assistant page question flow", () => {
  beforeEach(() => {
    callRuntime.mockReset();
    localStorage.clear();
    resetAssistantSession();
  });

  it("keeps the question after a failure and shows grounded sources after retry", async () => {
    callRuntime
      .mockRejectedValueOnce(new Error("Temporary error"))
      .mockResolvedValueOnce({
        answer: "Read the lesson.",
        citations: [
          {
            lessonId: "intro-m1-l1-what-is-ai",
            title: "AI basics",
            excerpt: "A **source** excerpt",
            productionRoute: "/learn/intro/intro-m1-l1-what-is-ai",
          },
        ],
      })
      .mockResolvedValueOnce({ answer: "Take the next lesson.", citations: [] });

    render(
      <LocaleProvider effectiveLocale="en">
        <AssistantPanel />
      </LocaleProvider>,
    );
    const question = screen.getByRole("textbox", { name: "Your question for the assistant" });
    fireEvent.change(question, { target: { value: "What is AI?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("Temporary error");
    expect((question as HTMLTextAreaElement).value).toBe("What is AI?");

    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("Read the lesson.");
    expect(screen.getByRole("link", { name: "AI basics" }).getAttribute("href")).toBe(
      "/learn/intro/intro-m1-l1-what-is-ai?locale=en",
    );
    expect(screen.getByText("source").tagName).toBe("STRONG");
    expect(screen.queryByText(/\*\*source\*\*/)).toBeNull();
    expect(screen.getByText("93 / 100")).toBeTruthy();
    expect(screen.queryByText("Debug · Raw runtime payload")).toBeNull();
    await waitFor(() => expect(getAssistantSession().turns).toHaveLength(1));

    fireEvent.change(question, { target: { value: "And next?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("Take the next lesson.");
    expect(callRuntime.mock.calls[2]?.[0].conversationHistory).toEqual([
      { question: "What is AI?", answer: "Read the lesson." },
    ]);
  });

  it("does not send Egyptian turns as context after switching to English", async () => {
    callRuntime.mockResolvedValue({ answer: "An answer.", citations: [] });
    const { rerender } = render(
      <LocaleProvider effectiveLocale="ar-EG">
        <AssistantPanel />
      </LocaleProvider>,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "سؤالك للمساعد" }), {
      target: { value: "يعني إيه الذكاء الاصطناعي؟" },
    });
    fireEvent.click(screen.getByRole("button", { name: "إرسال" }));
    await screen.findByText("An answer.");

    rerender(
      <LocaleProvider effectiveLocale="en">
        <AssistantPanel />
      </LocaleProvider>,
    );
    await waitFor(() => expect(screen.queryByText("يعني إيه الذكاء الاصطناعي؟")).toBeNull());
    fireEvent.change(screen.getByRole("textbox", { name: "Your question for the assistant" }), {
      target: { value: "What is AI?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(callRuntime).toHaveBeenCalledTimes(2));
    expect(callRuntime.mock.calls[1]?.[0].conversationHistory).toBeUndefined();
  });
});
