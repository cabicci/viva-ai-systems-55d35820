import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TechnicalLessonView } from "./TechnicalJourney";
import type { TechnicalLesson } from "@/lib/technical-education/types";
import { getTechnicalCopy } from "@/lib/technical-education/copy";

const mock = vi.hoisted(() => ({ rpc: vi.fn(), actor: "actor", generation: { value: 1 } }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: mock.rpc } }));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({
  user: mock.actor ? { id: mock.actor } : null,
  authGeneration: mock.generation,
  isAuthGenerationCurrent: (captured: object) => captured === mock.generation,
}) }));
vi.mock("./TechnicalDiagram", () => ({ TechnicalDiagram: () => null }));
// Real technicalCommand/useTechnicalProgress/React Query; only RPC transport is
// deferred. Completion order models server writes, not a synchronous return stub.
type CommandData = { _technicalCommand?: { requestId:string;actorId:string;expectedRevision:number }; answers?: Record<string, number>; values?: string[]; criteria?: boolean[] };
type RpcInput = { p_action: string; p_lesson: string | null; p_locale: string | null; p_data: CommandData };
type Request = { action: string; lesson: string | null; locale: string | null; data: CommandData;
  done: (allowed?: boolean) => void; fail: () => void; commit: () => void; lostAck: () => void };
let serverRevision:number;let receipts:Map<string,any>;let statusFails:boolean;let requests: Request[], passed: boolean, clients: QueryClient[], sequence = 0;
const copy = getTechnicalCopy("en");
const lesson = (patch: Partial<TechnicalLesson> = {}): TechnicalLesson => ({
  id: "M01-L01", locale: "en", title: "Synthetic technical lesson", intro: "Synthetic",
  goals: [], sections: [], example: { title: "Example", text: "Text", decision: "Review" },
  quiz: [{ id: "q1", question: "Synthetic question", options: ["Answer A", "Answer B"] }],
  assignment: { prompt: "Synthetic practice", fields: ["Notes"], criteria: ["Reviewed"] }, faq: [], ...patch,
});
const flush = async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); }); };
beforeEach(() => {
  mock.actor = "11111111-1111-4111-8111-"+String(++sequence).padStart(12,"0"); mock.generation = { value: sequence };
  sessionStorage.clear();receipts=new Map();statusFails=false;serverRevision=0;requests = []; passed = false; clients = []; mock.rpc.mockReset();
  mock.rpc.mockImplementation((_rpc: string, input: RpcInput) => {
    if (input.p_action === "status" && statusFails) return Promise.resolve({data:null,error:{message:"status unavailable"}});
    if (input.p_action === "status") return Promise.resolve({ data: { paid: true, progress: { [input.p_lesson ?? "M01-L01"]: { quizPassed: passed,quizRevision:serverRevision } } }, error: null });
    return new Promise(resolve => {
      const intent=input.p_data._technicalCommand;
      const commit=(allowed=true)=>{
        if(intent&&receipts.has(intent.requestId)) {
          const prior=receipts.get(intent.requestId);
          return {data:{...prior,command:{...prior.command,currentRevision:serverRevision,replayed:true}},error:null};
        }
        if(allowed&&intent&&intent.expectedRevision!==serverRevision)return {data:null,error:{message:"TECHNICAL_COMMAND_CONFLICT"}};
        if(allowed&&input.p_action==="reset_quiz")passed=false;
        if(allowed&&input.p_action==="quiz")passed=input.p_data.answers?.q1===0;
        if(allowed&&intent)serverRevision++;
        const data={allowed,passed,score:passed?1:0,total:1,feedback:[{id:"q1",correct:passed,explanation:"Server grade"}],...(intent?{command:{requestId:intent.requestId,appliedRevision:serverRevision,currentRevision:serverRevision,replayed:false}}:{})};
        if(allowed&&intent)receipts.set(intent.requestId,data);
        return {data,error:null};
      };
      requests.push({action:input.p_action,lesson:input.p_lesson,locale:input.p_locale,data:input.p_data,
        done:(allowed=true)=>resolve(commit(allowed)),commit:()=>{commit();},lostAck:()=>{commit();resolve({data:null,error:{message:"lost ack"}});},
        fail:()=>resolve({data:null,error:{message:"synthetic transport failure"}}),
      });
    });
  });
});
afterEach(async () => {
  cleanup(); requests.forEach(request => request.done(false)); await flush();
  clients.forEach(client => client.clear()); vi.restoreAllMocks();
});
function mount(initial = lesson()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  clients.push(client);
  const view = (value: TechnicalLesson) => <QueryClientProvider client={client}>
    <TechnicalLessonView lesson={value} video="" files={[]} />
  </QueryClientProvider>;
  const result = render(view(initial));
  return { client, unmount: result.unmount, rerender: (next: TechnicalLesson) => result.rerender(view(next)) };
}
function selectAnswer(answer = "Answer A") {
  fireEvent.click(screen.getByRole("button", { name: copy.quiz }));
  fireEvent.click(screen.getByLabelText(answer));
}
const submit = () => fireEvent.click(screen.getByRole("button", { name: copy.check }));
const actions = () => requests.map(request => request.action);
async function complete(index: number, allowed = true) { await act(async () => requests[index].done(allowed)); await flush(); }
async function fail(index: number) { await act(async () => requests[index].fail()); await flush(); }

describe("technical quiz command ordering", () => {
  it("does not dispatch a newer pass while an older reset could still arrive", async () => {
    mount(); await flush(); selectAnswer(); await flush(); submit(); await flush();
    expect(actions()).toEqual(["reset_quiz"]);
    expect(screen.getByRole("button", { name: copy.check })).toBeDisabled();
    await complete(0); expect(actions()).toEqual(["reset_quiz", "quiz"]);
    await complete(1); expect(passed).toBe(true); expect(screen.getByText("Server grade", { exact: false })).toBeInTheDocument();
  });
  it("serializes multiple answer resets before the final answer snapshot", async () => {
    mount(); await flush(); selectAnswer("Answer B"); await flush(); selectAnswer(); submit(); await flush();
    expect(actions()).toEqual(["reset_quiz"]);
    await complete(0); expect(actions()).toEqual(["reset_quiz", "reset_quiz"]);
    await complete(1); expect(actions()).toEqual(["reset_quiz", "reset_quiz", "quiz"]);
    expect(requests[2].data.answers).toEqual({ q1: 0 });expect(requests[2].data._technicalCommand).toMatchObject({actorId:mock.actor,expectedRevision:2}); await complete(2); expect(passed).toBe(true);
  });
  it("coalesces double submit while waiting and while grading", async () => {
    mount(); await flush(); selectAnswer(); await flush(); submit(); submit(); await flush();
    expect(actions()).toEqual(["reset_quiz"]); await complete(0); submit(); await flush();
    expect(actions()).toEqual(["reset_quiz", "quiz"]); await complete(1);
  });
  it("queues an edit behind an in-flight grade and never shows that stale result", async () => {
    mount(); await flush(); selectAnswer(); await flush(); await complete(0); submit(); await flush();
    selectAnswer("Answer B"); await flush(); expect(actions()).toEqual(["reset_quiz", "quiz"]);
    await complete(1); expect(actions()).toEqual(["reset_quiz", "quiz", "reset_quiz"]);
    expect(screen.queryByText("Server grade", { exact: false })).toBeNull();
    submit(); await flush(); expect(requests).toHaveLength(3); await complete(2);
    expect(requests[3].data.answers).toEqual({ q1: 1 }); await complete(3); expect(passed).toBe(false);
  });
  it("cancels a queued submission if answers change before it starts", async () => {
    mount(); await flush(); selectAnswer(); await flush(); submit(); selectAnswer("Answer B");
    await complete(0); expect(actions()).toEqual(["reset_quiz", "reset_quiz"]);
    await complete(1); expect(actions()).not.toContain("quiz"); expect(screen.getByRole("button", { name: copy.check })).toBeEnabled();
    submit(); await flush(); expect(requests[2].data.answers).toEqual({ q1: 1 }); await complete(2);
  });
  it("editing an accepted pass resets it before another submission", async () => {
    mount(); await flush(); selectAnswer(); await flush(); await complete(0); submit(); await flush(); await complete(1);
    expect(passed).toBe(true); selectAnswer("Answer B"); await flush(); expect(screen.queryByText("Server grade", { exact: false })).toBeNull();
    expect(requests[2].action).toBe("reset_quiz"); await complete(2); expect(passed).toBe(false);
  });
  it("preserves reset failures and retries an acknowledged reset before allowing a quiz", async () => {
    mount(); await flush(); selectAnswer(); await flush(); await fail(0); expect(screen.getByRole("alert")).toBeInTheDocument();
    submit(); await flush(); expect(actions()).toEqual(["reset_quiz", "reset_quiz"]);
    await fail(1); expect(actions()).not.toContain("quiz"); expect(screen.getByRole("alert")).toBeInTheDocument();
    submit(); await flush(); await complete(2); expect(requests[3].action).toBe("quiz"); await complete(3); expect(passed).toBe(true);
  });
  it.each(["denied", "transport"])("preserves a %s grade failure and allows retry", async failure => {
    mount(); await flush(); selectAnswer(); await flush(); await complete(0); submit(); await flush();
    if (failure === "denied") await complete(1, false); else await fail(1);
    expect(screen.getByRole("alert")).toBeInTheDocument(); expect(screen.queryByText("Server grade", { exact: false })).toBeNull();
    submit(); await flush(); expect(requests[2].action).toBe("quiz"); await complete(2); expect(passed).toBe(true);
  });
  it("retains the confirmed grade if refreshing progress fails", async () => {
    const { client } = mount(); await flush(); selectAnswer(); await flush(); await complete(0); submit(); await flush();
    vi.spyOn(client, "invalidateQueries").mockRejectedValueOnce(new Error("synthetic refresh failure"));
    await complete(1); expect(passed).toBe(true); expect(screen.getByText("Server grade", { exact: false })).toBeInTheDocument(); expect(screen.getByRole("alert")).toBeInTheDocument();
  });
  it.each(["actor", "locale", "lesson", "revision", "generation"])("drops queued work and result state after %s changes", async kind => {
    const first = lesson(), view = mount(first); await flush(); selectAnswer(); await flush(); submit(); await flush();
    let next = first;
    if (kind === "actor") mock.actor = "another-actor";
    if (kind === "generation" || kind === "actor") mock.generation = { value: 999 };
    if (kind === "locale") next = lesson({ locale: "ar-EG" });
    if (kind === "lesson") next = lesson({ id: "M02-L02" });
    if (kind === "revision") next = lesson({ quiz: [{ ...first.quiz[0], question: "Revised question" }] });
    view.rerender(next); await complete(0); expect(actions()).toEqual(["reset_quiz"]);
    expect(screen.queryByText("Server grade", { exact: false })).toBeNull();
    const c = getTechnicalCopy(next.locale); fireEvent.click(screen.getByRole("button", { name: c.quiz }));
    expect(screen.getByRole("button", { name: c.check })).toBeDisabled();
  });
  it.each(["actor", "locale", "lesson", "revision", "generation"])("ignores an already-dispatched grade after %s changes", async kind => {
    const first = lesson(), view = mount(first); await flush(); selectAnswer(); await flush(); await complete(0); submit(); await flush();
    expect(requests[1].action).toBe("quiz"); let next = first;
    if (kind === "actor") mock.actor = "another-actor";
    if (kind === "actor" || kind === "generation") mock.generation = { value: 999 };
    if (kind === "locale") next = lesson({ locale: "ar-EG" });
    if (kind === "lesson") next = lesson({ id: "M02-L02" });
    if (kind === "revision") next = lesson({ title: "Revised delivery" });
    view.rerender(next); await complete(1);
    expect(screen.queryByText("Server grade", { exact: false })).toBeNull();
    const c = getTechnicalCopy(next.locale); fireEvent.click(screen.getByRole("button", { name: c.quiz }));
    expect(screen.getByRole("button", { name: c.check })).toBeDisabled();
  });
  it("orders locale changes on the same server progress row", async () => {
    const view = mount(); await flush(); selectAnswer(); await flush();
    view.rerender(lesson({ locale: "ar-EG" })); await flush(); const c = getTechnicalCopy("ar-EG");
    fireEvent.click(screen.getByRole("button", { name: c.quiz })); fireEvent.click(screen.getByLabelText("Answer A"));
    fireEvent.click(screen.getByRole("button", { name: c.check })); await flush(); expect(requests).toHaveLength(1);
    await complete(0); expect(requests[1]).toMatchObject({ action: "reset_quiz", locale: "ar-EG" });
    await complete(1); expect(requests[2]).toMatchObject({ action: "quiz", locale: "ar-EG" }); await complete(2); expect(passed).toBe(true);
  });
  it("drops practice acknowledgement and local draft when the actor changes", async () => {
    const view = mount(); fireEvent.click(screen.getByRole("button", { name: copy.assignment }));
    fireEvent.change(screen.getByLabelText("Notes"), { target: { value: "Private draft" } });
    fireEvent.click(screen.getByRole("button", { name: copy.save })); await flush();
    mock.actor = "other-actor"; mock.generation = { value: 999 }; view.rerender(lesson()); await complete(0);
    fireEvent.click(screen.getByRole("button", { name: copy.assignment })); expect(screen.getByLabelText("Notes")).toHaveValue(""); expect(screen.queryByText(copy.saved)).toBeNull();
  });
  it("checks synchronous auth invalidation before queued work even without a render", async () => {
    mount(); await flush(); selectAnswer(); await flush(); submit(); mock.generation = { value: 999 };
    await complete(0); expect(actions()).toEqual(["reset_quiz"]); expect(screen.queryByText("Server grade", { exact: false })).toBeNull();
  });
  it("keeps an in-flight reset ahead of the same actor/lesson after a remount", async () => {
    const first = mount(); await flush(); selectAnswer(); await flush(); first.unmount();
    mount(); await flush(); selectAnswer(); submit(); await flush(); expect(actions()).toEqual(["reset_quiz"]);
    await complete(0); expect(actions()).toEqual(["reset_quiz", "reset_quiz"]);
    await complete(1); expect(requests[2].action).toBe("quiz"); await complete(2); expect(passed).toBe(true);
  });
  it("does not send queued work or refresh after unmount", async () => {
    const view = mount(); await flush(); selectAnswer(); await flush(); submit(); view.unmount();
    const statusBefore = mock.rpc.mock.calls.filter(call => call[1].p_action === "status").length;
    await complete(0); expect(actions()).toEqual(["reset_quiz"]);
    expect(mock.rpc.mock.calls.filter(call => call[1].p_action === "status")).toHaveLength(statusBefore);
  });
  it("does not acknowledge edits made during practice save and preserves retry after failure", async () => {
    mount(); fireEvent.click(screen.getByRole("button", { name: copy.assignment }));
    fireEvent.change(screen.getByLabelText("Notes"), { target: { value: "First draft" } });
    fireEvent.click(screen.getByRole("button", { name: copy.save })); fireEvent.click(screen.getByRole("button", { name: copy.save })); await flush();
    expect(actions()).toEqual(["practice"]);
    fireEvent.change(screen.getByLabelText("Notes"), { target: { value: "Later draft" } });
    await complete(0); expect(screen.queryByText(copy.saved)).toBeNull(); expect(screen.getByLabelText("Notes")).toHaveValue("Later draft");
    fireEvent.click(screen.getByRole("button", { name: copy.save })); await flush(); expect(requests[1].data.values).toEqual(["Later draft"]);
    await fail(1); expect(screen.getByText(/Storage is unavailable/)).toBeInTheDocument(); expect(screen.getByLabelText("Notes")).toHaveValue("Later draft");
    fireEvent.click(screen.getByRole("button", { name: copy.save })); await flush(); await complete(2); expect(screen.getByText(copy.saved)).toBeInTheDocument();
  });
  it("retains a confirmed practice save when progress refresh fails", async () => {
    const { client } = mount(); fireEvent.click(screen.getByRole("button", { name: copy.assignment }));
    fireEvent.change(screen.getByLabelText("Notes"), { target: { value: "Saved draft" } });
    fireEvent.click(screen.getByRole("button", { name: copy.save })); await flush();
    vi.spyOn(client, "invalidateQueries").mockRejectedValueOnce(new Error("synthetic refresh failure"));
    await complete(0); expect(screen.getByText(copy.saved)).toBeInTheDocument(); expect(screen.getByRole("alert")).toBeInTheDocument(); expect(screen.queryByText(/Storage is unavailable/)).toBeNull();
  });
});

describe("versioned command recovery through actual technical UI",()=>{
 it("lost reset transport cannot replace its UUID; a late original commit is replayed exactly once",async()=>{
  mount();await flush();selectAnswer();await flush();await fail(0);const original=structuredClone(requests[0].data._technicalCommand);submit();await flush();expect(requests[1].data._technicalCommand).toEqual(original);
  requests[0].commit();await complete(1);expect(serverRevision).toBe(1);expect(requests[2].data._technicalCommand?.expectedRevision).toBe(1);await complete(2);expect(serverRevision).toBe(2);expect(passed).toBe(true);
 });
 it("historical replay after later changes hides its grade until explicit reconciliation",async()=>{
  mount();await flush();selectAnswer();await flush();await complete(0);submit();await flush();await act(async()=>requests[1].lostAck());await flush();
  serverRevision=4;passed=false;submit();await flush();expect(requests[2].data).toEqual(requests[1].data);await complete(2);expect(screen.queryByText("Server grade",{exact:false})).toBeNull();expect(screen.getByRole("alert")).toBeInTheDocument();
  submit();await flush();expect(requests).toHaveLength(3);fireEvent.click(screen.getByRole("button",{name:copy.retry}));await flush();expect(requests).toHaveLength(3);expect(screen.queryByRole("alert")).toBeNull();
  submit();await flush();expect(requests[3].data._technicalCommand?.expectedRevision).toBe(4);await complete(3);expect(passed).toBe(true);
 });
 it("new answers after an ambiguous quiz recover its old snapshot before resetting",async()=>{
  mount();await flush();selectAnswer();await flush();await complete(0);submit();await flush();await fail(1);selectAnswer("Answer B");await flush();expect(requests[2].data).toEqual(requests[1].data);await complete(2);expect(screen.queryByText("Server grade",{exact:false})).toBeNull();expect(requests[3].action).toBe("reset_quiz");expect(requests[3].data._technicalCommand?.expectedRevision).toBe(2);await complete(3);submit();await flush();expect(requests[4].data.answers).toEqual({q1:1});await complete(4);
 });
 it("remount recovers unresolved reset identity instead of silently replacing it",async()=>{
  const first=mount();await flush();selectAnswer();await flush();await fail(0);first.unmount();mount();await flush();selectAnswer();await flush();expect(requests[1].data).toEqual(requests[0].data);await complete(1);submit();await flush();await complete(2);expect(passed).toBe(true);
 });
 it("a revision conflict cannot be auto-rebased by another edit",async()=>{
  mount();await flush();selectAnswer();await flush();serverRevision=2;await complete(0);expect(screen.getByRole("alert")).toBeInTheDocument();selectAnswer("Answer B");await flush();expect(requests).toHaveLength(1);
  fireEvent.click(screen.getByRole("button",{name:copy.retry}));await flush();submit();await flush();expect(requests[1].data._technicalCommand?.expectedRevision).toBe(2);await complete(1);await complete(2);
 });
 it("unknown failed status blocks writes instead of treating absent progress as zero",async()=>{
  statusFails=true;mount();await flush();selectAnswer();await flush();expect(requests).toHaveLength(0);expect(screen.getByRole("alert")).toBeInTheDocument();statusFails=false;fireEvent.click(screen.getByRole("button",{name:copy.retry}));await flush();submit();await flush();expect(requests[0].data._technicalCommand?.expectedRevision).toBe(0);await complete(0);await complete(1);
 });
 it("actual rejected status refresh surfaces error without erasing a committed grade",async()=>{
  mount();await flush();selectAnswer();await flush();await complete(0);submit();await flush();statusFails=true;await complete(1);expect(screen.getByText("Server grade",{exact:false})).toBeInTheDocument();expect(screen.getByRole("alert")).toBeInTheDocument();
 });
});

describe("action-time version boundary",()=>{
 it("queued old edit cannot adopt a later external pass through delayed status refresh",async()=>{
  mount();await flush();fireEvent.click(screen.getByRole("button",{name:copy.markRead}));await flush();expect(actions()).toEqual(["read"]);
  selectAnswer();await flush();serverRevision=1;passed=true;await complete(0);
  expect(actions()).toEqual(["read","reset_quiz"]);expect(requests[1].data._technicalCommand?.expectedRevision).toBe(0);
  await complete(1);expect(passed).toBe(true);expect(serverRevision).toBe(1);expect(screen.getByRole("alert")).toBeInTheDocument();
 });
 it("unconfirmed initial status blocks mutation even if status later succeeds",async()=>{
  let release!:(v:unknown)=>void;mock.rpc.mockImplementationOnce(()=>new Promise(resolve=>{release=resolve;}));
  mount();selectAnswer();await flush();expect(requests).toHaveLength(0);expect(screen.getByRole("alert")).toBeInTheDocument();
  serverRevision=3;passed=true;await act(async()=>release({data:{progress:{"M01-L01":{quizPassed:true,quizRevision:3}}},error:null}));await flush();expect(requests).toHaveLength(0);expect(passed).toBe(true);
  submit();await flush();expect(requests[0].data._technicalCommand?.expectedRevision).toBe(3);await complete(0);await complete(1);
 });
});
