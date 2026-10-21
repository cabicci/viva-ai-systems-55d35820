import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AssistantConversationPanel } from "@/components/assistant/AssistantConversationPanel";
import { historyKey, readHistory, writeHistory, type ConversationTurn } from "@/lib/card-assistant/history";
import type { AssistantReply, AssistantScope } from "@/lib/card-assistant/types";

const scope: AssistantScope = { area: "academic", cardId: "AC-ONE", stepId: "AC-ONE-M01-L01", locale: "en" };
const turn = (n: number): ConversationTurn => ({ question: `Question ${n}`, answer: `Answer ${n}`, citations: [] });
const reply = (answer = "Current answer"): AssistantReply => ({ status: 200, answer, citations: [] });
const ask = vi.fn();
const send = (query = "Explain this concept") => {
  fireEvent.change(screen.getByRole("textbox"), { target: { value: query } });
  // A real form supports native keyboard submission through its submit control.
  fireEvent.submit(screen.getByRole("textbox").closest("form")!);
};
beforeEach(() => { window.localStorage.clear(); ask.mockReset().mockResolvedValue(reply()); });
afterEach(cleanup);

it.each(["account", "area", "card", "locale", "profile"])("isolates persisted answers and drafts when %s changes", async dimension => {
  const initialScope = { ...scope, profileId: "profile-a" };
  const view = render(<AssistantConversationPanel scope={initialScope} accountId="account-a" ask={ask} />);
  send();
  await screen.findByText("Current answer");
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "PRIVATE_DRAFT" } });
  const nextScope: AssistantScope = { ...initialScope,
    area: dimension === "area" ? "technical" : initialScope.area,
    cardId: dimension === "card" ? "AC-TWO" : initialScope.cardId,
    locale: dimension === "locale" ? "ar-EG" : initialScope.locale,
    profileId: dimension === "profile" ? "profile-b" : initialScope.profileId };
  view.rerender(<AssistantConversationPanel scope={nextScope} accountId={dimension === "account" ? "account-b" : "account-a"} ask={ask} />);
  expect(screen.queryByText("Current answer")).not.toBeInTheDocument();
  expect(screen.getByRole("textbox")).toHaveValue("");
  view.rerender(<AssistantConversationPanel scope={initialScope} accountId="account-a" ask={ask} />);
  expect(screen.getByText("Current answer")).toBeVisible();
});

it("keeps current-card conversation across steps but discards old-step pending responses", async () => {
  writeHistory(historyKey(scope, "account-a"), [turn(1)]);
  let finish!: (value: AssistantReply) => void;
  ask.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const view = render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);
  send("Old-step question");
  const nextScope = { ...scope, stepId: "AC-ONE-M02-L03" };
  view.rerender(<AssistantConversationPanel scope={nextScope} accountId="account-a" ask={ask} />);
  expect(screen.getByText("Answer 1")).toBeVisible();
  expect(screen.getByRole("textbox")).toHaveValue("");
  expect(screen.getByRole("textbox")).toBeEnabled();
  await act(async () => { finish(reply("STALE_RESPONSE")); });
  expect(screen.queryByText("STALE_RESPONSE")).not.toBeInTheDocument();
  expect(readHistory(historyKey(scope, "account-a"))).toEqual([turn(1)]);
  send("New-step question");
  await screen.findByText("Current answer");
  expect(ask.mock.calls[1][0]).toMatchObject({ scope: nextScope, history: [{ question: "Question 1", answer: "Answer 1" }] });
});

it("sends only three bounded follow-up turns and retains at most twenty on the device", async () => {
  const saved = Array.from({ length: 20 }, (_, i) => ({ ...turn(i), question: `${i}:` + "q".repeat(900), answer: `${i}:` + "a".repeat(2000) }));
  const key = historyKey(scope, "account-a");
  writeHistory(key, saved);
  render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);
  send("Follow-up question");
  await screen.findByText("Current answer");
  expect(ask).toHaveBeenCalledTimes(1);
  expect(ask.mock.calls[0][0].history).toEqual(saved.slice(-3).map(t => ({ question: t.question.slice(0, 500), answer: t.answer.slice(0, 1200) })));
  const history = readHistory(key);
  expect(history).toHaveLength(20);
  expect(history[0]).toEqual(saved[1]);
  expect(history.at(-1)).toEqual({ question: "Follow-up question", answer: "Current answer", citations: [] });
  fireEvent.click(screen.getByRole("button", { name: "Clear history from this device" }));
  expect(window.localStorage.getItem(key)).toBeNull();
  expect(within(screen.getByRole("log")).queryAllByRole("article")).toHaveLength(0);
});

it.each([401, 403, 429, 500])("rejects an answer returned with error status %s", async status => {
  ask.mockResolvedValue({ status, answer: "ERROR_RESPONSE_MUST_NOT_RENDER", citations: [] });
  render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);
  send();
  expect(await screen.findByRole("alert")).toBeVisible();
  expect(screen.queryByText("ERROR_RESPONSE_MUST_NOT_RENDER")).not.toBeInTheDocument();
  expect(readHistory(historyKey(scope, "account-a"))).toEqual([]);
  expect(screen.getByRole("textbox")).toBeEnabled();
});

it("blocks duplicate form submission while the provider request is pending", async () => {
  let finish!: (value: AssistantReply) => void;
  ask.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);
  send();
  fireEvent.submit(screen.getByRole("textbox").closest("form")!);
  expect(ask).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Sending..." })).toHaveAttribute("type", "submit");
  expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();
  await act(async () => { finish(reply()); });
});

it("renders Markdown as safe text and only links internal citation paths", async () => {
  const hrefs = ["/academic/learn/AC-ONE-M01-L01?locale=en", "//evil.invalid", "https://evil.invalid", "javascript:alert(1)", "/\\evil.invalid", "/bad path", "/bad\npath"];
  ask.mockResolvedValue({ status: 200,
    answer: "## Explanation\n**Grounded concept**\n<img src=x onerror=alert(1)>\n[Click](javascript:alert(1))",
    citations: hrefs.map((href, i) => ({ id: String(i), label: `Source ${i}`, stepId: scope.stepId!, sourceId: "concept", href })) });
  const view = render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);
  send();
  await screen.findByRole("heading", { name: "Explanation" });
  expect(screen.getByText("Grounded concept").tagName).toBe("STRONG");
  expect(view.container.querySelector("img, script")).toBeNull();
  expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeVisible();
  expect(screen.getAllByRole("link")).toHaveLength(1);
  expect(screen.getByRole("link", { name: "Source 0" })).toHaveAttribute("href", hrefs[0]);
  hrefs.slice(1).forEach((_, i) => expect(screen.getByText(`Source ${i + 1}`).tagName).not.toBe("A"));
});

it("ignores malformed saved citations and does not expose historical global sessions", () => {
  window.localStorage.setItem("assistant-history", JSON.stringify([turn(9)]));
  window.localStorage.setItem(historyKey(scope, "account-a"), JSON.stringify([{ ...turn(1), citations: [{ id: "1", label: "Bad", stepId: "x", sourceId: "x", href: {} }] }]));
  render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);
  expect(screen.queryByText("Answer 1")).not.toBeInTheDocument();
  expect(screen.queryByText("Answer 9")).not.toBeInTheDocument();
});

it("routes citations through the caller's supported navigation callback", async () => {
  const citation = { id: "one", label: "Grounded step", stepId: scope.stepId!, sourceId: "concept" };
  ask.mockResolvedValue({ ...reply(), citations: [citation] });
  const onCitation = vi.fn();
  render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} onCitation={onCitation} />);
  send();
  fireEvent.click(await screen.findByRole("button", { name: "Grounded step" }));
  expect(onCitation).toHaveBeenCalledWith(citation);
});
