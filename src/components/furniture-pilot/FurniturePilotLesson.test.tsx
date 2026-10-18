import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { getPilotCopy } from "../../../scripts/technical-education/source/furniture-pilot/content";
import { FurniturePilotLesson } from "./FurniturePilotLesson";

const state = vi.hoisted(() => ({
  progress: {} as Record<string, unknown>,
  command: vi.fn(),
  save: vi.fn(),
}));
vi.mock("@/lib/technical-education/client", () => ({
  technicalCommand: state.command,
  technicalDownload: vi.fn(),
  useTechnicalProgress: () => ({ progress: state.progress, update: state.save }),
}));
vi.mock("../technical-education/TechnicalDiagram", () => ({ TechnicalDiagram: () => null }));
const fullCopy = getPilotCopy("en");
const copy = { ...fullCopy, quiz: fullCopy.quiz.slice(0, 2) };
function setup() {
  return render(<FurniturePilotLesson locale="en" copy={copy} video="" files={[]} />);
}
function openQuiz() {
  fireEvent.click(screen.getByRole("button", { name: copy.labels.quiz, exact: true }));
}
function answerAll() {
  for (const group of screen.getAllByRole("group")) {
    fireEvent.click(within(group).getAllByRole("radio")[0]);
  }
}
beforeEach(() => {
  state.progress = {};
  state.command.mockReset();
  state.save.mockReset().mockResolvedValue(undefined);
  state.command.mockResolvedValue({
    allowed: true,
    score: 2,
    total: 2,
    passed: true,
    feedback: [],
  });
});
afterEach(cleanup);

it("shows three consistent saved completion marks without sending an attempt", () => {
  state.progress = { "M04-L02": { read: true, quizPassed: true, practiceReviewed: true } };
  setup();
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "3/3");
  expect(screen.getByText("✓ " + copy.labels.reading)).toBeTruthy();
  expect(screen.getByText("✓ " + copy.labels.quiz)).toBeTruthy();
  expect(screen.getByText("✓ " + copy.labels.assignment)).toBeTruthy();
  expect(state.command).not.toHaveBeenCalled();
  expect(state.save).not.toHaveBeenCalled();
});
it("explains incomplete input and never sends it, including direct form submission", () => {
  setup();
  openQuiz();
  const submit = screen.getByRole("button", { name: copy.labels.check, exact: true });
  expect(submit).toBeDisabled();
  expect(screen.getByText(copy.labels.quizMissing)).toBeTruthy();
  fireEvent.submit(submit.closest("form")!);
  expect(state.command).not.toHaveBeenCalled();
  expect(state.save).not.toHaveBeenCalled();
  fireEvent.click(screen.getAllByRole("radio")[0]);
  expect(submit).toBeDisabled();
  fireEvent.submit(submit.closest("form")!);
  expect(state.command).not.toHaveBeenCalled();
});
it("clears the previous storage failure on answer change and a successful later quiz", async () => {
  state.command.mockRejectedValueOnce(new Error("Synthetic storage failure"));
  setup();
  openQuiz();
  answerAll();
  fireEvent.click(screen.getByRole("button", { name: copy.labels.check, exact: true }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Could not save");
  fireEvent.click(screen.getAllByRole("radio")[1]);
  expect(screen.queryByRole("alert")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: copy.labels.check, exact: true }));
  await screen.findByText(copy.labels.quizPassed);
  expect(screen.queryByRole("alert")).toBeNull();
  expect(state.command).toHaveBeenCalledTimes(2);
});
it("clears the old failure after a successful practice without inventing a quiz result", async () => {
  state.command.mockRejectedValueOnce(new Error("Synthetic storage failure"));
  setup();
  openQuiz();
  answerAll();
  fireEvent.click(screen.getByRole("button", { name: copy.labels.check, exact: true }));
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: copy.labels.assignment, exact: true }));
  for (const field of screen.getAllByRole("spinbutton")) {
    fireEvent.change(field, { target: { value: "100" } });
  }
  expect(screen.queryByRole("alert")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: copy.labels.check, exact: true }));
  await screen.findByText(copy.labels.practicalDone);
  expect(screen.queryByRole("alert")).toBeNull();
  expect(state.command).toHaveBeenLastCalledWith("practice", "M04-L02", "en", {
    values: { innerWidth: "100", bodyDepth: "100", opening: "100" },
  });
});
it("does not send duplicate quiz requests while the current save is pending", async () => {
  let finish!: (value: unknown) => void;
  state.command.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  setup();
  openQuiz();
  answerAll();
  const submit = screen.getByRole("button", { name: copy.labels.check, exact: true });
  fireEvent.click(submit);
  expect(submit).toBeDisabled();
  fireEvent.click(submit);
  expect(state.command).toHaveBeenCalledTimes(1);
  finish({ allowed: true, score: 2, total: 2, passed: true, feedback: [] });
  await waitFor(() => expect(submit).toBeEnabled());
});
