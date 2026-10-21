import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ userId: "user-a", ask: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/academic-education/assistant.functions", () => ({ askAcademicAssistant: state.ask }));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: { id: state.userId } }) }));
vi.mock("@/components/ui/button", () => ({ Button: (props: React.ComponentProps<"button">) => <button {...props} /> }));
import { AcademicAssistantPanel } from "@/components/academic-education/AcademicAssistantPanel";

const initial = { courseId: "AC-NEW", lessonId: "AC-NEW-M01-L01", locale: "en" as const };
const answer = (text: string) => ({ status: 200, answer: text, sources: [{ lessonId: "AC-NEW-M02-L03", sectionId: "concept-1" }] });
beforeEach(() => { window.localStorage.clear(); state.userId = "user-a"; state.ask.mockReset().mockResolvedValue(answer("Fresh answer")); });
afterEach(cleanup);
const submit = (text = "Explain this concept") => {
  fireEvent.change(screen.getByRole("textbox"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
};

it("uses the actual card identity and explains the whole-card boundary", async () => {
  render(<AcademicAssistantPanel {...initial} />);
  submit();
  await screen.findByText("Fresh answer");
  expect(state.ask).toHaveBeenCalledWith({ data: expect.objectContaining(initial) });
  expect(screen.getByText(/all stations and steps in this path/)).toBeVisible();
  expect(screen.getByRole("link")).toHaveAttribute("href", "/academic/learn/AC-NEW-M02-L03?locale=en");
});

it("drops an old card response when a request finishes after switching cards", async () => {
  let finish!: (value: ReturnType<typeof answer>) => void;
  state.ask.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const view = render(<AcademicAssistantPanel {...initial} />);
  submit();
  view.rerender(<AcademicAssistantPanel {...initial} courseId="AC-OTHER" lessonId="AC-OTHER-M01-L01" />);
  expect(screen.getByRole("textbox")).toHaveValue("");
  await act(async () => { finish(answer("OLD_CARD_RESPONSE")); });
  expect(screen.queryByText("OLD_CARD_RESPONSE")).not.toBeInTheDocument();
  state.ask.mockResolvedValueOnce({ status: 200, answer: "Fresh answer", sources: [{ lessonId: "AC-OTHER-M02-L03", sectionId: "concept-1" }] });
  submit("A question for the new card");
  await screen.findByText("Fresh answer");
  expect(state.ask.mock.calls[1][0].data.courseId).toBe("AC-OTHER");
});

it.each(["account", "locale"])("clears answers and question drafts when the %s changes", async kind => {
  const view = render(<AcademicAssistantPanel {...initial} />);
  submit();
  await screen.findByText("Fresh answer");
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "PRIVATE_DRAFT" } });
  if (kind === "account") state.userId = "user-b";
  view.rerender(<AcademicAssistantPanel {...initial}
    locale={kind === "locale" ? "ar-EG" : "en"} />);
  expect(screen.queryByText("Fresh answer")).not.toBeInTheDocument();
  expect(screen.getByRole("textbox")).toHaveValue("");
});

it("does not carry a permission denial into another card", async () => {
  state.ask.mockResolvedValueOnce({ status: 403, error: "ACADEMIC_ASSISTANT_ACCESS_REQUIRED" });
  const view = render(<AcademicAssistantPanel {...initial} />);
  submit();
  await screen.findByRole("alert");
  view.rerender(<AcademicAssistantPanel {...initial} courseId="AC-OTHER" lessonId="AC-OTHER-M01-L01" />);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByRole("textbox")).toBeEnabled();
});

it("uses path terminology in the Arabic form and busy state", async () => {
  state.ask.mockImplementation(() => new Promise(() => {}));
  const view = render(<AcademicAssistantPanel {...initial} locale="ar-EG" />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "اشرح الفكرة" } });
  fireEvent.click(screen.getByRole("button", { name: "إرسال" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "جارٍ الإرسال..." })).toBeDisabled());
  expect(view.container.textContent).not.toContain("منهج");
  expect(view.container.textContent).toContain("كل محطات وخطوات المسار ده");
});

it("shares bounded follow-up history across steps of the same card", async () => {
  const view = render(<AcademicAssistantPanel {...initial} />);
  submit("Explain the first concept");
  await screen.findByText("Fresh answer");
  view.rerender(<AcademicAssistantPanel {...initial} lessonId="AC-NEW-M03-L02" />);
  expect(screen.getByText("Fresh answer")).toBeVisible();
  submit("Give an illustrative example");
  await waitFor(() => expect(state.ask).toHaveBeenCalledTimes(2));
  expect(state.ask.mock.calls[1][0].data).toMatchObject({ courseId: "AC-NEW", lessonId: "AC-NEW-M03-L02",
    history: [{ question: "Explain the first concept", answer: "Fresh answer" }] });
});

it("rejects sources from another card before displaying the answer", async () => {
  state.ask.mockResolvedValueOnce({ status: 200, answer: "FOREIGN_CARD_ANSWER", sources: [{ lessonId: "AC-OTHER-M01-L01", sectionId: "concept" }] });
  render(<AcademicAssistantPanel {...initial} />);
  submit();
  await screen.findByRole("alert");
  expect(screen.queryByText("FOREIGN_CARD_ANSWER")).not.toBeInTheDocument();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});
