import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CourseLessonAssistant } from "@/components/assistant/CourseLessonAssistant";
import type { ReactNode } from "react";

vi.mock("@/components/learn/FloatingAssistantLauncher", () => ({ FloatingAssistantLauncher: ({ children }: { children: ReactNode }) => <aside data-testid="shared-launcher">{children}</aside> }));
vi.mock("@/components/assistant/AssistantPanel", () => ({ AssistantPanel: () => <div data-testid="ai-transport" /> }));
vi.mock("@/components/assistant/CardPathAssistant", () => ({ CardPathAssistant: (props: { area: string; cardId: string; profileId?: string }) =>
  <div data-testid="protected-transport" data-area={props.area} data-card={props.cardId} data-profile={props.profileId} /> }));
vi.mock("@/components/academic-education/AcademicAssistantPanel", () => ({ AcademicAssistantPanel: (props: { courseId: string }) => <div data-testid="academic-transport" data-card={props.courseId} /> }));
afterEach(cleanup);

it("mounts the AI assistant in the generic lesson engine without authored assistant configuration", () => {
  render(<CourseLessonAssistant area="ai" locale="en" contextOverride={null} />);
  expect(screen.getByTestId("shared-launcher")).toContainElement(screen.getByTestId("ai-transport"));
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
