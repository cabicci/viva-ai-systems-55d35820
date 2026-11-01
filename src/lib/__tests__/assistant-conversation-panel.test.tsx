import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { StrictMode, startTransition } from "react";
import { AssistantRequestError } from "@/lib/card-assistant/errors";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import dns from "node:dns";
import dgram from "node:dgram";
import { syncBuiltinESMExports } from "node:module";
import type { useAuth, AuthGeneration } from "@/lib/auth-context";
import { AssistantConversationPanel } from "@/components/assistant/AssistantConversationPanel";
import { historyKey, readHistory, writeHistory, type ConversationTurn } from "@/lib/card-assistant/history";
import type { AssistantReply, AssistantScope } from "@/lib/card-assistant/types";

// Actual public Auth shape, mocked before the real panel import. Equality is a
// controlled local incarnation only, never a server grant or permission epoch.
const auth = vi.hoisted(() => ({ value: undefined as ReturnType<typeof useAuth> | undefined,
  live: null as AuthGeneration | null, available: true }));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => auth.value }));
vi.mock("@/integrations/supabase/client", () => { throw new Error("Real SDK initialization forbidden"); });
vi.mock("@supabase/supabase-js", () => { throw new Error("Real SDK import forbidden"); });
function currentAuth(account = "account-a") {
  const generation = Object.freeze({ value: 1 });auth.live = generation;auth.available = true;
  auth.value = { user: { id: account, aud: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" },
    session: null, loading: false, signOut: async () => {}, authContinuity: Object.freeze({ continuity: 0 }), authGeneration: generation,
    isAuthGenerationCurrent: captured => auth.available && auth.live === captured, authError: null };
}
function retire() { auth.live = Object.freeze({ value: 1 }); }
const memory = new Map<string, string>();
const storage: Storage = {
  get length() { return memory.size; }, clear: () => memory.clear(), key: index => [...memory.keys()][index] ?? null,
  getItem: key => memory.get(key) ?? null, setItem: (key, value) => { memory.set(key, value); }, removeItem: key => { memory.delete(key); },
};
let storageDescriptor: PropertyDescriptor | undefined;
let environment: NodeJS.ProcessEnv;
let forbidden: string[];
let restores: Array<() => void>;
beforeEach(() => {
  forbidden = [];restores = [];environment = process.env;
  currentAuth();storageDescriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
  Object.defineProperty(window, "localStorage", { configurable: true, get: () => storage });
  const deny = (name: string) => () => { forbidden.push(name);throw new Error("Network/provider/environment boundary forbidden"); };
  for (const name of ["fetch", "XMLHttpRequest", "WebSocket", "EventSource"]) vi.stubGlobal(name, deny(name));
  for (const target of [http, https]) for (const name of ["request", "get"] as const) vi.spyOn(target, name).mockImplementation(deny(name) as never);
  vi.spyOn(net, "connect").mockImplementation(deny("TCP") as never);vi.spyOn(net, "createConnection").mockImplementation(deny("TCP") as never);
  vi.spyOn(net.Socket.prototype, "connect").mockImplementation(deny("socket") as never);vi.spyOn(tls, "connect").mockImplementation(deny("TLS") as never);
  vi.spyOn(dgram, "createSocket").mockImplementation(deny("UDP") as never);
  for (const target of [dns, dns.promises]) for (const name of Object.keys(target).filter(key => /^(lookup|resolve)/.test(key))) descriptor(target, name, { value: deny("DNS"), writable: true });
  syncBuiltinESMExports();
  const diagnostics = new Set(["FORCE_COLOR", "NO_COLOR", "NODE_DISABLE_COLORS", "NODE_V8_COVERAGE", "WATCH_REPORT_DEPENDENCIES", "NODE_TEST_CONTEXT", "DEBUG_PRINT_LIMIT", "COLORS", "CI", "TERM", "UPDATE_EXPECT", "JEST_WORKER_ID"]);
  process.env = new Proxy(Object.create(null) as NodeJS.ProcessEnv, { get(_target, key) {
    if (key === "NODE_ENV") return "test";
    if (key === "VITEST") return "true";
    if (typeof key === "string" && (diagnostics.has(key) || key.startsWith("VITEST_"))) return undefined;
    return deny("env:" + String(key))();
  }, set: deny("env:set"), ownKeys: deny("env:keys"), has: deny("env:has"), getOwnPropertyDescriptor: deny("env:descriptor") });
});
afterEach(() => {
  process.env = environment;
  for (const restore of restores.reverse()) restore();
  if (storageDescriptor) Object.defineProperty(window, "localStorage", storageDescriptor);
  vi.unstubAllGlobals();vi.restoreAllMocks();syncBuiltinESMExports();expect(forbidden).toEqual([]);
});
function domCallback(element: Element, name: string): (...args: any[]) => any {
  const key = Object.keys(element).find(key => key.startsWith("__reactProps$"));
  if (!key) throw new Error("No actual mounted React DOM props");
  return (element as unknown as Record<string, Record<string, (...args: any[]) => any>>)[key][name];
}

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
  if (dimension === "account") currentAuth("account-b");
  view.rerender(<AssistantConversationPanel scope={nextScope} accountId={dimension === "account" ? "account-b" : "account-a"} ask={ask} />);
  expect(screen.queryByText("Current answer")).not.toBeInTheDocument();
  expect(screen.getByRole("textbox")).toHaveValue("");
  if (dimension === "account") currentAuth("account-a");
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

it("[AC.pre.sameUUID] retired same-UUID request cannot publish or overwrite history before rerender", async () => {
  let finish!: (value: AssistantReply) => void;ask.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);send();
  retire();await act(async () => { finish(reply("RETIRED_PRIVATE_ANSWER")); });
  expect(screen.queryByText("RETIRED_PRIVATE_ANSWER")).not.toBeInTheDocument();
  expect(readHistory(historyKey(scope, "account-a"))).toEqual([]);
});
it("[AC.pre.savedClear] saved old clear callback cannot delete newer same-account history", () => {
  const key = historyKey(scope, "account-a");writeHistory(key, [turn(1)]);
  const view = render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);
  const clear = domCallback(screen.getByRole("button", { name: "Clear history from this device" }), "onClick");
  currentAuth();writeHistory(key, [turn(2)]);view.rerender(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);
  act(() => { clear(); });expect(readHistory(key)).toEqual([turn(2)]);expect(screen.getByText("Answer 2")).toBeVisible();
});
it("[AC.pre.uuid] UUID reentrancy retiring the incarnation prevents provider invocation", () => {
  vi.spyOn(crypto, "randomUUID").mockImplementation(() => { retire();return "11111111-1111-4111-8111-111111111111"; });
  render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);send();expect(ask).not.toHaveBeenCalled();
});

function deferred<T>() { let resolve!: (value: T) => void, reject!: (cause: unknown) => void;const promise = new Promise<T>((yes, no) => { resolve = yes;reject = no; });return { promise, resolve, reject }; }
const citation = () => ({ id: "one", label: "Grounded step", stepId: scope.stepId!, sourceId: "concept", href: "/academic/learn/one" });
const cited = (): ConversationTurn => ({ ...turn(1), citations: [citation()] });
function descriptor(target: object, key: string, next: PropertyDescriptor) {
  const old = Object.getOwnPropertyDescriptor(target, key);Object.defineProperty(target, key, { configurable: true, ...next });
  restores.push(() => { if (old) Object.defineProperty(target, key, old);else Reflect.deleteProperty(target, key); });
}
const flush = async () => { await act(async () => { await Promise.resolve();await Promise.resolve(); }); };

it.each(["signedOut", "loading", "mismatch", "missingContext", "mutableGeneration", "missingPredicate", "truthyPredicate"])("[AC01.%s] noncurrent actual auth cannot read, submit or clear as current", state => {
  const original = auth.value!;
  if (state === "signedOut") auth.value = { ...original, user: null };
  if (state === "loading") auth.value = { ...original, loading: true };
  if (state === "mismatch") auth.value = { ...original, user: { ...original.user!, id: "other" } };
  if (state === "missingContext") auth.value = undefined;
  if (state === "mutableGeneration") auth.value = { ...original, authGeneration: { value: 1 } };
  if (state === "missingPredicate") auth.value = { ...original, isAuthGenerationCurrent: undefined as never };
  if (state === "truthyPredicate") auth.value = { ...original, isAuthGenerationCurrent: () => "true" as never };
  const get = vi.spyOn(storage, "getItem"), set = vi.spyOn(storage, "setItem"), remove = vi.spyOn(storage, "removeItem");
  render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);send();
  expect(ask).not.toHaveBeenCalled();expect(get).not.toHaveBeenCalled();expect(set).not.toHaveBeenCalled();expect(remove).not.toHaveBeenCalled();
  expect(screen.getByRole("textbox")).toBeDisabled();
});
it("[AC02] new same-account object incarnation reads saved scoped history without automatic deletion", async () => {
  const key = historyKey(scope, "account-a");writeHistory(key, [turn(1)]);const remove = vi.spyOn(storage, "removeItem");
  const pending = deferred<AssistantReply>();ask.mockReturnValueOnce(pending.promise);
  const view = render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);send();
  const prior = auth.value!.authGeneration;currentAuth();expect(auth.value!.authGeneration.value).toBe(prior.value);expect(auth.value!.authGeneration).not.toBe(prior);
  view.rerender(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);
  expect(screen.getByText("Answer 1")).toBeVisible();expect(remove).not.toHaveBeenCalled();expect(screen.getByRole("textbox")).toBeEnabled();
  await act(async () => { pending.resolve(reply("OLD_GENERATION")); });expect(screen.queryByText("OLD_GENERATION")).not.toBeInTheDocument();expect(readHistory(key)).toEqual([turn(1)]);
  send("New incarnation question");await screen.findByText("Current answer");
});
it.each(["account", "area", "card", "step", "profile", "locale", "disabled"])("[AC03.%s] ABA retires saved DOM actions and old finally cannot release new busy state", async dimension => {
  const initial = { ...scope, profileId: "profile-a" };const key = historyKey(initial, "account-a");writeHistory(key, [cited()]);
  const old = deferred<AssistantReply>(), next = deferred<AssistantReply>();ask.mockReturnValueOnce(old.promise).mockReturnValueOnce(next.promise);const navigate = vi.fn();
  const view = render(<AssistantConversationPanel scope={initial} accountId="account-a" ask={ask} onCitation={navigate} />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Original pending question" } });
  const input = domCallback(screen.getByRole("textbox"), "onChange"), submit = domCallback(screen.getByRole("textbox").closest("form")!, "onSubmit");
  const clear = domCallback(screen.getByRole("button", { name: "Clear history from this device" }), "onClick"), click = domCallback(screen.getByRole("button", { name: "Grounded step" }), "onClick");
  fireEvent.submit(screen.getByRole("textbox").closest("form")!);
  const changed: AssistantScope = { ...initial, area: dimension === "area" ? "technical" : initial.area, cardId: dimension === "card" ? "OTHER" : initial.cardId,
    stepId: dimension === "step" ? "OTHER-STEP" : initial.stepId, profileId: dimension === "profile" ? "profile-b" : initial.profileId, locale: dimension === "locale" ? "ar-EG" : initial.locale };
  if (dimension === "account") currentAuth("account-b");
  view.rerender(<AssistantConversationPanel scope={changed} accountId={dimension === "account" ? "account-b" : "account-a"} ask={ask} onCitation={navigate} disabledReason={dimension === "disabled" ? "Unavailable now" : undefined} />);
  if (dimension === "account") currentAuth("account-a");
  view.rerender(<AssistantConversationPanel scope={initial} accountId="account-a" ask={ask} onCitation={navigate} />);
  act(() => { input({ target: { value: "OLD_DRAFT" } });submit({ preventDefault() {} });clear();click(); });
  expect(screen.getByRole("textbox")).toHaveValue("");expect(readHistory(key)).toEqual([cited()]);expect(navigate).not.toHaveBeenCalled();expect(ask).toHaveBeenCalledTimes(1);
  send("New current request");expect(ask).toHaveBeenCalledTimes(2);
  await act(async () => { old.reject(new Error("OLD_PRIVATE_ERROR")); });
  expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  await act(async () => { next.resolve(reply("NEW_CURRENT")); });expect(screen.getByText("NEW_CURRENT")).toBeVisible();expect(readHistory(key).at(-1)?.question).toBe("New current request");
});
it("[AC04] saved input/submit/clear/citation callbacks retire before any auth rerender", () => {
  const key = historyKey(scope, "account-a");writeHistory(key, [cited()]);const navigate = vi.fn();
  render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} onCitation={navigate} />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Ready query" } });
  const input = domCallback(screen.getByRole("textbox"), "onChange"), submit = domCallback(screen.getByRole("textbox").closest("form")!, "onSubmit");
  const clear = domCallback(screen.getByRole("button", { name: "Clear history from this device" }), "onClick"), click = domCallback(screen.getByRole("button", { name: "Grounded step" }), "onClick");
  const set = vi.spyOn(storage, "setItem"), remove = vi.spyOn(storage, "removeItem");retire();
  act(() => { input({ target: { value: "STALE_DRAFT" } });submit({ preventDefault() {} });clear();click(); });
  expect(ask).not.toHaveBeenCalled();expect(navigate).not.toHaveBeenCalled();expect(set).not.toHaveBeenCalled();expect(remove).not.toHaveBeenCalled();expect(readHistory(key)).toEqual([cited()]);
});
it("[AC05] input value getter retirement cannot enqueue a new draft", () => {
  const view = render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);const change = domCallback(screen.getByRole("textbox"), "onChange");
  const target = { get value() { retire();return "PRIVATE_DRAFT"; } };act(() => { change({ target }); });
  currentAuth();view.rerender(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);expect(screen.getByRole("textbox")).toHaveValue("");expect(ask).not.toHaveBeenCalled();
});
it("[AC06] current submit event getter retirement stops before UUID/history/provider work", () => {
  render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);fireEvent.change(screen.getByRole("textbox"), { target: { value: "Ready query" } });
  const submit = domCallback(screen.getByRole("textbox").closest("form")!, "onSubmit"), uuid = vi.spyOn(crypto, "randomUUID");let reads = 0;
  act(() => { submit({ get preventDefault() { reads++;retire();return () => {}; } }); });expect(reads).toBe(1);expect(uuid).not.toHaveBeenCalled();expect(ask).not.toHaveBeenCalled();
});
it.each(["status", "answer", "citations", "length", "index", "id", "label", "stepId", "sourceId", "href"])("[AC07.%s] response getter/parser retirement cannot publish or persist", async target => {
  const value = { ...reply("PRIVATE_RESPONSE"), citations: [citation()] };let reads = 0;
  if (["status", "answer", "citations"].includes(target)) {
    const before = (value as unknown as Record<string, unknown>)[target];Object.defineProperty(value, target, { get() { reads++;retire();return before; } });
  } else if (target === "length") value.citations = new Proxy(value.citations, { get(array, key, receiver) { if (key === "length") { reads++;retire(); }return Reflect.get(array, key, receiver); } });
  else if (target === "index") Object.defineProperty(value.citations, "0", { get() { reads++;retire();return citation(); } });
  else { const item = value.citations[0];const before = (item as unknown as Record<string, unknown>)[target];Object.defineProperty(item, target, { get() { reads++;retire();return before; } }); }
  ask.mockResolvedValue(value);render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);send();await flush();
  expect(reads).toBe(1);expect(screen.queryByText("PRIVATE_RESPONSE")).not.toBeInTheDocument();expect(readHistory(historyKey(scope, "account-a"))).toEqual([]);
});
it("[AC08] accepted answer/citations are copied before later caller mutation", async () => {
  const item = citation(), value = { ...reply("Original accepted answer"), citations: [item] };ask.mockResolvedValue(value);
  render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);send();await screen.findByText("Original accepted answer");
  value.answer = "MUTATED_ANSWER";item.label = "MUTATED_LABEL";item.href = "https://bad.invalid";value.citations.length = 0;
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Draft after success" } });
  expect(screen.getByText("Original accepted answer")).toBeVisible();expect(screen.getByRole("link", { name: "Grounded step" })).toHaveAttribute("href", "/academic/learn/one");expect(readHistory(historyKey(scope, "account-a"))[0].citations).toEqual([citation()]);
});
it("[AC09] selected scope is copied, not retargeted by later caller object mutation", async () => {
  const original = { ...scope }, initial = { ...scope };const pending = deferred<AssistantReply>();ask.mockReturnValueOnce(pending.promise);
  render(<AssistantConversationPanel scope={original} accountId="account-a" ask={ask} />);send();Object.assign(original, { cardId: "MUTATED", stepId: "OTHER", locale: "ar-EG" });
  expect(ask.mock.calls[0][0].scope).toEqual(initial);await act(async () => { pending.resolve(reply()); });expect(readHistory(historyKey(initial, "account-a"))).toHaveLength(1);expect(readHistory(historyKey(original, "account-a"))).toEqual([]);
});
it.each(["native", "derived"])("[AC10.%s] already eager rejected work returned during retirement stays observed", async kind => {
  ask.mockImplementation(() => { retire();return kind === "native" ? Promise.reject(new Error("OLD_EAGER")) : Promise.resolve().then(() => { throw new Error("OLD_DERIVED"); }); });
  render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);send();await flush();expect(screen.queryByRole("alert")).not.toBeInTheDocument();expect(readHistory(historyKey(scope, "account-a"))).toEqual([]);
});
it("[AC11] lazy then getter retirement prevents later then/provider invocation", async () => {
  const then = vi.fn();let reads = 0;ask.mockReturnValue({ get then() { reads++;retire();return then; } } as never);
  render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);send();await flush();expect(reads).toBe(1);expect(then).not.toHaveBeenCalled();expect(ask).toHaveBeenCalledTimes(1);
});
it("[AC12] queued thenable adoption checks again after earlier microtask retirement", async () => {
  const then = vi.fn();ask.mockReturnValue({ get then() { queueMicrotask(retire);return then; } } as never);
  render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);send();await flush();expect(then).not.toHaveBeenCalled();expect(readHistory(historyKey(scope, "account-a"))).toEqual([]);
});
it("[AC13] current thenable uses real receiver/once, observes derived rejection, accepts one reply", async () => {
  let gets = 0, calls = 0;
  const value = { get then() { gets++;return function(this: unknown, resolve: (value: AssistantReply) => void, reject: (error: unknown) => void) {
    expect(this).toBe(value);calls++;resolve(reply("FIRST_ACCEPTED"));resolve(reply("SECOND_IGNORED"));reject(Promise.reject(new Error("IGNORED_EAGER")));return Promise.reject(new Error("DERIVED_IGNORED"));
  }; } };ask.mockReturnValue(value as never);
  render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);send();await screen.findByText("FIRST_ACCEPTED");expect(gets).toBe(1);expect(calls).toBe(1);expect(readHistory(historyKey(scope, "account-a"))).toHaveLength(1);expect(screen.queryByText("SECOND_IGNORED")).not.toBeInTheDocument();
});
it.each(["lazy", "eager"])("[AC14.%s] nested value retired before adoption is not started and eager rejection is observed", async kind => {
  const lazy = vi.fn();ask.mockReturnValue({ then(resolve: (value: unknown) => void) { retire();resolve(kind === "lazy" ? { then: lazy } : Promise.reject(new Error("NESTED_EAGER"))); } } as never);
  render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);send();await flush();expect(lazy).not.toHaveBeenCalled();expect(screen.queryByRole("alert")).not.toBeInTheDocument();expect(readHistory(historyKey(scope, "account-a"))).toEqual([]);
});
it("[AC15] unmount permanently retires pending work and saved DOM callbacks", async () => {
  const key = historyKey(scope, "account-a");writeHistory(key, [cited()]);const pending = deferred<AssistantReply>();ask.mockReturnValueOnce(pending.promise);const navigate = vi.fn();
  const view = render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} onCitation={navigate} />);
  const clear = domCallback(screen.getByRole("button", { name: "Clear history from this device" }), "onClick"), click = domCallback(screen.getByRole("button", { name: "Grounded step" }), "onClick");send();view.unmount();
  act(() => { clear();click(); });await act(async () => { pending.resolve(reply("AFTER_UNMOUNT")); });expect(readHistory(key)).toEqual([cited()]);expect(navigate).not.toHaveBeenCalled();expect(document.body.textContent).not.toContain("AFTER_UNMOUNT");
});
it("[AC16] StrictMode cleanup-replay does not revive early callbacks; current replay incarnation works", async () => {
  const key = historyKey(scope, "account-a");writeHistory(key, [turn(1)]);const early: Array<(...args: any[]) => any> = [];
  const get = storage.getItem;vi.spyOn(storage, "getItem").mockImplementation(value => {
    const input = screen.queryByRole("textbox");if (input) early.push(domCallback(input, "onChange"));return Reflect.apply(get, storage, [value]);
  });
  render(<StrictMode><AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} /></StrictMode>);
  expect(early.length).toBeGreaterThanOrEqual(2);act(() => { for (const change of early) change({ target: { value: "EARLY_PRIVATE_DRAFT" } }); });expect(screen.getByRole("textbox")).toHaveValue("");
  send("Current strict replay question");await screen.findByText("Current answer");expect(ask).toHaveBeenCalledTimes(1);expect(readHistory(key)).toHaveLength(2);
});
it("[AC17] queued input updater cannot restore draft into a newer auth incarnation", () => {
  const view = render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);const change = domCallback(screen.getByRole("textbox"), "onChange");
  act(() => { startTransition(() => change({ target: { value: "DEFERRED_PRIVATE_DRAFT" } }));currentAuth();view.rerender(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />); });
  expect(screen.getByRole("textbox")).toHaveValue("");send("Current question");expect(ask).toHaveBeenCalledTimes(1);
});
it.each(["storage", "method", "get", "parse", "parsedGetter", "key"])("[AC18.%s] history read/parser reentrancy stops before later storage or publication", stage => {
  const key = historyKey(scope, "account-a");writeHistory(key, [turn(1)]);const originalGet = storage.getItem, originalParse = JSON.parse, originalStringify = JSON.stringify;let entered = 0;
  if (stage === "storage") vi.spyOn(window, "localStorage", "get").mockImplementation(() => { retire();return storage; });
  if (stage === "method") descriptor(storage, "getItem", { get() { retire();return originalGet; } });
  if (stage === "get") vi.spyOn(storage, "getItem").mockImplementation(value => { entered++;retire();return Reflect.apply(originalGet, storage, [value]); });
  if (stage === "parse") vi.spyOn(JSON, "parse").mockImplementation((...args) => { const value = Reflect.apply(originalParse, JSON, args);retire();return value; });
  if (stage === "parsedGetter") vi.spyOn(JSON, "parse").mockImplementation((...args) => { const value = Reflect.apply(originalParse, JSON, args);if (Array.isArray(value) && value[0]) Object.defineProperty(value[0], "question", { get() { retire();return "Question 1"; } });return value; });
  if (stage === "key") vi.spyOn(JSON, "stringify").mockImplementation((...args: Parameters<typeof JSON.stringify>) => { const value = Reflect.apply(originalStringify, JSON, args);if (Array.isArray(args[0]) && args[0][0] === "account-a") retire();return value; });
  render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);expect(screen.queryByText("Answer 1")).not.toBeInTheDocument();expect(ask).not.toHaveBeenCalled();expect(entered).toBe(stage === "get" ? 1 : 0);
});
it.each(["serialize", "storage", "method", "entered"])("[AC19.%s] write preparation is fenced, already entered storage cannot be undone", async stage => {
  render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);
  const originalSet = storage.setItem, originalStringify = JSON.stringify;let writes = 0;
  if (stage === "serialize") vi.spyOn(JSON, "stringify").mockImplementation((...args: Parameters<typeof JSON.stringify>) => { const value = Reflect.apply(originalStringify, JSON, args);if (Array.isArray(args[0]) && args[0][0]?.question) retire();return value; });
  if (stage === "storage") vi.spyOn(window, "localStorage", "get").mockImplementation(() => { retire();return storage; });
  if (stage === "method") descriptor(storage, "setItem", { get() { retire();return (key: string, value: string) => { writes++;Reflect.apply(originalSet, storage, [key, value]); }; } });
  else vi.spyOn(storage, "setItem").mockImplementation((key, value) => { writes++;if (stage === "entered") retire();Reflect.apply(originalSet, storage, [key, value]); });
  send();await flush();expect(writes).toBe(stage === "entered" ? 1 : 0);expect(screen.queryByText("Current answer")).not.toBeInTheDocument();
});
it.each(["storage", "method"])("[AC20.%s] explicit clear retirement cannot enter removeItem", stage => {
  const key = historyKey(scope, "account-a");writeHistory(key, [turn(1)]);render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);
  let removes = 0;
  if (stage === "storage") vi.spyOn(window, "localStorage", "get").mockImplementation(() => { retire();return storage; });
  if (stage === "method") descriptor(storage, "removeItem", { get() { retire();return () => { removes++;memory.delete(key); }; } });
  fireEvent.click(screen.getByRole("button", { name: "Clear history from this device" }));expect(removes).toBe(0);expect(JSON.parse(memory.get(key)!)).toEqual([turn(1)]);
});
it("[AC21] ask/navigation callback identity churn preserves draft and pending current work", async () => {
  const pending = deferred<AssistantReply>();ask.mockReturnValueOnce(pending.promise);const one = vi.fn(), two = vi.fn(), replacement = vi.fn().mockResolvedValue(reply());
  const view = render(<AssistantConversationPanel scope={{ ...scope }} accountId="account-a" ask={ask} onCitation={one} />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Retained draft" } });view.rerender(<AssistantConversationPanel scope={{ ...scope }} accountId="account-a" ask={replacement} onCitation={two} />);expect(screen.getByRole("textbox")).toHaveValue("Retained draft");
  view.rerender(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} onCitation={two} />);fireEvent.submit(screen.getByRole("textbox").closest("form")!);
  view.rerender(<AssistantConversationPanel scope={{ ...scope }} accountId="account-a" ask={replacement} onCitation={two} />);expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();
  await act(async () => { pending.resolve({ ...reply(), citations: [citation()] }); });fireEvent.click(screen.getByRole("button", { name: "Grounded step" }));expect(two).toHaveBeenCalledTimes(1);expect(one).not.toHaveBeenCalled();expect(replacement).not.toHaveBeenCalled();
});
it("[AC22] stale saved link prevents native navigation after incarnation retirement", async () => {
  ask.mockResolvedValue({ ...reply(), citations: [citation()] });render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);send();const link = await screen.findByRole("link", { name: "Grounded step" });const click = domCallback(link, "onClick"), preventDefault = vi.fn();retire();act(() => { click({ preventDefault }); });expect(preventDefault).toHaveBeenCalledTimes(1);
});
it.each([401, 403, 422, 429])("[AC23.%s] current status error preserves distinct message without touching answer getters", async status => {
  const value = { status, get answer() { throw new Error("Error answer must not be inspected"); }, get citations() { throw new Error("Error citations must not be inspected"); } };ask.mockResolvedValue(value);
  render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);send();expect(await screen.findByRole("alert")).toBeVisible();expect(readHistory(historyKey(scope, "account-a"))).toEqual([]);expect(screen.getByRole("textbox")).toBeEnabled();
});
it("[AC24] current typed request errors retain safe existing message", async () => {
  ask.mockRejectedValue(new AssistantRequestError("Known bounded message", 403));render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);send();expect(await screen.findByRole("alert")).toHaveTextContent("Known bounded message");expect(screen.getByRole("textbox")).toBeEnabled();
});
it.each(["empty", "tooLong", "noCitations", "invalidCitation"])("[AC25.%s] malformed current payload remains bounded unavailable and does not persist", async kind => {
  const value = kind === "empty" ? reply(" ") : kind === "tooLong" ? reply("x".repeat(16001)) : kind === "noCitations" ? { status: 200, answer: "NOT_ACCEPTED" } : { status: 200, answer: "NOT_ACCEPTED", citations: [{ id: 1 }] };ask.mockResolvedValue(value);
  render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);send();expect(await screen.findByRole("alert")).toBeVisible();expect(readHistory(historyKey(scope, "account-a"))).toEqual([]);expect(screen.getByRole("textbox")).toBeEnabled();
});
it.each(["fetch", "HTTP", "TCP", "TLS", "UDP", "DNS", "environment"])("[AC26.%s] real mounted boundary blocks attempted external operation before any access", async boundary => {
  ask.mockImplementation(() => {
    if (boundary === "fetch") return fetch("https://never.invalid") as never;
    if (boundary === "HTTP") return http.get("http://never.invalid") as never;
    if (boundary === "TCP") return net.connect(443, "never.invalid") as never;
    if (boundary === "TLS") return tls.connect(443, "never.invalid") as never;
    if (boundary === "UDP") return dgram.createSocket("udp4") as never;
    if (boundary === "DNS") return dns.lookup("never.invalid", () => {}) as never;
    return process.env.SUPABASE_SERVICE_ROLE_KEY as never;
  });
  render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);send();expect(await screen.findByRole("alert")).toBeVisible();
  expect(forbidden).toEqual([boundary === "HTTP" ? "get" : boundary === "environment" ? "env:SUPABASE_SERVICE_ROLE_KEY" : boundary]);
  forbidden = [];expect(readHistory(historyKey(scope, "account-a"))).toEqual([]);
});
it.each(["crypto", "method"])("[AC27.%s] UUID source/method getter retirement prevents invocation", stage => {
  const ids = globalThis.crypto, create = vi.fn(() => "11111111-1111-4111-8111-111111111111" as const);let reads = 0;
  if (stage === "crypto") { vi.spyOn(ids, "randomUUID").mockImplementation(create);descriptor(globalThis, "crypto", { get() { reads++;retire();return ids; } }); }
  else descriptor(ids, "randomUUID", { get() { reads++;retire();return create; } });
  render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);send();expect(reads).toBe(1);expect(create).not.toHaveBeenCalled();expect(ask).not.toHaveBeenCalled();
});
it("[AC28.parse] JSON parser method getter retirement stops before parser invocation", () => {
  const key = historyKey(scope, "account-a");writeHistory(key, [turn(1)]);const parse = vi.fn(JSON.parse);
  descriptor(JSON, "parse", { get() { retire();return parse; } });render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);
  expect(parse).not.toHaveBeenCalled();expect(screen.queryByText("Answer 1")).not.toBeInTheDocument();
});
it("[AC28.stringify] JSON serializer method getter retirement stops before invocation/storage", async () => {
  render(<AssistantConversationPanel scope={scope} accountId="account-a" ask={ask} />);const stringify = vi.fn(JSON.stringify), set = vi.spyOn(storage, "setItem");
  descriptor(JSON, "stringify", { get() { retire();return stringify; } });send();await flush();expect(stringify).not.toHaveBeenCalled();expect(set).not.toHaveBeenCalled();expect(screen.queryByText("Current answer")).not.toBeInTheDocument();
});

it("[AC29.frame] undeclared caller frame cannot replace the actual private Auth selection", () => {
  const key = historyKey(scope, "account-a");writeHistory(key, [turn(1)]);
  auth.value = { ...auth.value!, loading: true };
  const get = vi.spyOn(storage, "getItem");
  const props = { scope, accountId: "account-a", ask,
    frame: { key: 999, selected: { scope, account: "account-a", disabled: undefined }, current: () => true } };
  render(<AssistantConversationPanel {...props} />);
  expect(get).not.toHaveBeenCalled();expect(screen.queryByText("Answer 1")).not.toBeInTheDocument();
  send();expect(ask).not.toHaveBeenCalled();expect(screen.getByRole("textbox")).toBeDisabled();
});
