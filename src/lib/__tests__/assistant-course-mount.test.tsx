import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CourseLessonAssistant } from "@/components/assistant/CourseLessonAssistant";
import type { ReactNode } from "react";
const auth = vi.hoisted(() => ({ user: { id: "lesson-user" } as { id: string } | null }));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => auth }));
vi.mock("@/components/assistant/LessonAssistantAccess", () => ({ LessonAssistantAccess: ({ children }: { children: ReactNode }) => <>{children}</> }));

vi.mock("@/components/learn/FloatingAssistantLauncher", () => ({ FloatingAssistantLauncher: ({ children }: { children: ReactNode }) => <aside data-testid="shared-launcher">{children}</aside> }));
vi.mock("@/components/assistant/AssistantPanel", () => ({ AssistantPanel: (props: { compact: boolean; contextOverride: { currentPathId: string; currentLessonId: string } }) =>
  <div data-testid="ai-transport" data-compact={props.compact} data-card={props.contextOverride.currentPathId} data-step={props.contextOverride.currentLessonId} /> }));
vi.mock("@/components/assistant/CardPathAssistant", () => ({ CardPathAssistant: (props: { area: string; cardId: string; profileId?: string }) =>
  <div data-testid="protected-transport" data-area={props.area} data-card={props.cardId} data-profile={props.profileId} /> }));
vi.mock("@/components/academic-education/AcademicAssistantPanel", () => ({ AcademicAssistantPanel: (props: { courseId: string }) => <div data-testid="academic-transport" data-card={props.courseId} /> }));
afterEach(cleanup);
beforeEach(() => { auth.user = { id: "lesson-user" }; });
const context = {
  currentPathId: "intro", currentModuleId: "intro-m1", currentLessonId: "intro-m1-l1-what-is-ai",
  currentPathTitle: "Intro", currentModuleTitle: "Module 1", currentLessonTitle: "What is AI?",
  nextLessonTitle: null, currentMission: null,
};

it("mounts the AI assistant in the generic lesson engine without authored assistant configuration", () => {
  render(<CourseLessonAssistant area="ai" locale="en" pathId="intro" lessonId={context.currentLessonId} contextOverride={context} />);
  expect(screen.getByTestId("shared-launcher")).toContainElement(screen.getByTestId("ai-transport"));
  expect(screen.getByTestId("ai-transport")).toHaveAttribute("data-card", "intro");
  expect(screen.getByTestId("ai-transport")).toHaveAttribute("data-step", context.currentLessonId);
  expect(screen.getByTestId("ai-transport")).toHaveAttribute("data-compact", "true");
  expect(screen.queryByRole("combobox")).toBeNull();
});
it("keeps the exact child profile and card when a Kids card inherits its assistant", () => {
  render(<CourseLessonAssistant area="kids" locale="en" cardId="level-2" stepId="3" profileId="child-profile" />);
  expect(screen.getByTestId("protected-transport")).toHaveAttribute("data-profile", "child-profile");
  expect(screen.getByTestId("protected-transport")).toHaveAttribute("data-card", "level-2");
});
it("inherits the Technical transport without borrowing a child scope", () => {
  render(<CourseLessonAssistant area="technical" locale="en" cardId="registered-card" stepId="M01-L02" />);
  expect(screen.getByTestId("protected-transport")).toHaveAttribute("data-card", "registered-card");
  expect(screen.getByTestId("protected-transport")).not.toHaveAttribute("data-profile");
});
it("uses the same shared entry point for a newly registered Academic card", () => {
  render(<CourseLessonAssistant area="academic" locale="en" cardId="AC-NEW" stepId="AC-NEW-M01-L01" />);
  expect(screen.getByTestId("academic-transport")).toHaveAttribute("data-card", "AC-NEW");
  expect(screen.queryByTestId("protected-transport")).not.toBeInTheDocument();
});
it.each([null, { ...context, currentPathId: "other-course" }, { ...context, currentLessonId: "other-step" }])(
  "refuses missing or displaced lesson context without entering an AI transport", (contextOverride) => {
    render(<CourseLessonAssistant area="ai" locale="en" pathId="intro" lessonId={context.currentLessonId} contextOverride={contextOverride} />);
    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.queryByTestId("ai-transport")).toBeNull();
  },
);
it("refuses to mount a transport when the account is absent", () => {
  auth.user = null;
  render(<CourseLessonAssistant area="ai" locale="en" pathId="intro" lessonId={context.currentLessonId} contextOverride={context} />);
  expect(screen.getByRole("alert")).toBeVisible();
  expect(screen.queryByTestId("ai-transport")).toBeNull();
});
