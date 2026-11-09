import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FurniturePilotLesson } from "./FurniturePilotLesson";
import type { PilotCopy } from "../../../scripts/technical-education/source/furniture-pilot/content";
import type { SupportedLocale } from "@/lib/locale/types";
import { getTechnicalCopy } from "@/lib/technical-education/copy";

const mock = vi.hoisted(() => ({ rpc: vi.fn(), actor: "actor", generation: { value: 1 } }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: mock.rpc } }));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({
  user: mock.actor ? { id: mock.actor } : null,
  authGeneration: mock.generation,
  isAuthGenerationCurrent: (captured: object) => captured === mock.generation,
}) }));
vi.mock("../technical-education/TechnicalDiagram", () => ({ TechnicalDiagram: () => null }));
// Real technicalCommand/useTechnicalProgress/React Query; only RPC transport is
// deferred. Completion order models server writes, not a synchronous return stub.
type CommandData = { _technicalCommand?: { requestId:string;actorId:string;expectedRevision:number }; answers?: Record<string, number>; values?: Record<string,string>; criteria?: boolean[] };
type RpcInput = { p_action: string; p_lesson: string | null; p_locale: string | null; p_data: CommandData };
type Request = { action: string; lesson: string | null; locale: string | null; data: CommandData;
  done: (allowed?: boolean) => void; fail: () => void; commit: () => void; lostAck: () => void };
let serverRevision:number;let receipts:Map<string,any>;let statusFails:boolean;let requests: Request[], passed: boolean, clients: QueryClient[], sequence = 0;
const copy = getTechnicalCopy("en");
const synthetic = {
 title:"Synthetic furniture fixture",intro:"Synthetic",draft:"Draft",eyebrow:"Fixture navigation",scope:"Synthetic scope",goalsTitle:"Goals",goals:[],prerequisites:"None",faq:[],
 sections:Array.from({length:5},(_,i)=>({id:"section"+i,title:"Section"+i,body:"Synthetic text",note:"Synthetic note"})),
 quiz:[{id:"q1",question:"Synthetic question",options:["Answer A","Answer B"]}],
 downloadNames:{workbook:"fixture.pdf",cutList:"fixture-cut.pdf",drawings:"fixture-draw.pdf"},
 labels:Object.fromEntries(["assignment", "assignmentNote", "assistant", "bodyDepth", "calculator", "check", "correct", "cost", "costNote", "downloadDrawing", "downloadPack", "downloadParts", "downloads", "drawings", "guideNote", "ids", "innerWidth", "invalid", "length", "markRead", "mm", "opening", "panelThickness", "panelWidth", "part", "practicalDone", "progress", "progressNote", "quantity", "quiz", "quizMissing", "quizPassed", "quizReview", "readDone", "reading", "reset", "revise", "rubric", "video", "videoNote", "videoPending", "videoReady", "worksheet", "zoom"].map(key=>[key,key]))
} as unknown as PilotCopy;
const flush = async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); }); };
beforeEach(() => {
  mock.actor = "11111111-1111-4111-8111-"+String(++sequence).padStart(12,"0"); mock.generation = { value: sequence };
  sessionStorage.clear();receipts=new Map();statusFails=false;serverRevision=0;requests = []; passed = false; clients = []; mock.rpc.mockReset();
  mock.rpc.mockImplementation((_rpc: string, input: RpcInput) => {
    if (input.p_action === "status" && statusFails) return Promise.resolve({data:null,error:{message:"status unavailable"}});
    if (input.p_action === "status") return Promise.resolve({ data: { paid: true, progress: { [input.p_lesson ?? "M04-L02"]: { quizPassed: passed,quizRevision:serverRevision } } }, error: null });
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
function mount(initial:SupportedLocale="en") {
 const client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});clients.push(client);
 const view=(locale:SupportedLocale)=><QueryClientProvider client={client}><FurniturePilotLesson locale={locale} copy={synthetic} video="" files={[]}/></QueryClientProvider>;
 const result=render(view(initial));return {client,unmount:result.unmount,rerender:(locale:SupportedLocale="en")=>result.rerender(view(locale))};
}
function selectAnswer(answer = "Answer A") {
  fireEvent.click(screen.getByRole("button", { name: "quiz" }));
  fireEvent.click(screen.getByLabelText(answer));
}
const submit = () => fireEvent.click(screen.getByRole("button", { name: "check" }));
const actions = () => requests.map(request => request.action);
async function complete(index: number, allowed = true) { await act(async () => requests[index].done(allowed)); await flush(); }
async function fail(index: number) { await act(async () => requests[index].fail()); await flush(); }

describe("actual FurniturePilotLesson versioned ordering",()=>{
 it("orders reset before grade with versioned wire and coalesces double submit",async()=>{
  mount();await flush();selectAnswer();await flush();submit();submit();await flush();expect(actions()).toEqual(["reset_quiz"]);
  expect(requests[0].data._technicalCommand).toMatchObject({actorId:mock.actor,expectedRevision:0});await complete(0);expect(actions()).toEqual(["reset_quiz","quiz"]);expect(requests[1].data._technicalCommand?.expectedRevision).toBe(1);expect(requests[1].data.answers).toEqual({q1:0});await complete(1);expect(screen.getByText("Server grade")).toBeInTheDocument();
 });
 it("serializes multiple edits and hides an earlier accepted pass",async()=>{
  mount();await flush();selectAnswer();await flush();await complete(0);submit();await flush();await complete(1);selectAnswer("Answer B");await flush();expect(screen.queryByText("Server grade")).toBeNull();expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext","0/3");selectAnswer();submit();await flush();await complete(2);await complete(3);expect(requests[4].data.answers).toEqual({q1:0});await complete(4);
 });
 it("retains an ambiguous reset identity even if its original commits late",async()=>{
  mount();await flush();selectAnswer();await flush();await fail(0);expect(screen.getByRole("alert")).toBeInTheDocument();submit();await flush();expect(requests[1].data).toEqual(requests[0].data);requests[0].commit();await complete(1);expect(serverRevision).toBe(1);await complete(2);expect(serverRevision).toBe(2);
 });
 it("hides a historical grade and requires explicit reconciliation",async()=>{
  mount();await flush();selectAnswer();await flush();await complete(0);submit();await flush();await act(async()=>requests[1].lostAck());await flush();serverRevision=4;passed=false;submit();await flush();expect(requests[2].data).toEqual(requests[1].data);await complete(2);expect(screen.queryByText("Server grade")).toBeNull();submit();await flush();expect(requests).toHaveLength(3);fireEvent.click(screen.getByRole("button",{name:copy.retry}));await flush();expect(requests).toHaveLength(3);submit();await flush();expect(requests[3].data._technicalCommand?.expectedRevision).toBe(4);await complete(3);
 });
 it("recovers old answer payload before dispatching a changed-answer reset",async()=>{
  mount();await flush();selectAnswer();await flush();await complete(0);submit();await flush();await fail(1);selectAnswer("Answer B");await flush();expect(requests[2].data).toEqual(requests[1].data);await complete(2);expect(screen.queryByText("Server grade")).toBeNull();expect(requests[3].action).toBe("reset_quiz");await complete(3);submit();await flush();expect(requests[4].data.answers).toEqual({q1:1});await complete(4);
 });
 it.each(["actor","generation","locale"])("ignores late grade across %s scope change",async kind=>{
  const view=mount();await flush();selectAnswer();await flush();await complete(0);submit();await flush();
  if(kind==="actor")mock.actor="22222222-2222-4222-8222-222222222222";
  if(kind!=="locale")mock.generation={value:999};view.rerender(kind==="locale"?"ar-EG":"en");await complete(1);expect(screen.queryByText("Server grade")).toBeNull();fireEvent.click(screen.getByRole("button",{name:"quiz"}));expect(screen.getByRole("button",{name:"check"})).toBeDisabled();
 });
 it("cancels queued submission on synchronous auth invalidation",async()=>{
  mount();await flush();selectAnswer();await flush();submit();mock.generation={value:999};await complete(0);expect(actions()).toEqual(["reset_quiz"]);
 });
 it("keeps pending identity after remount",async()=>{
  const first=mount();await flush();selectAnswer();await flush();await fail(0);first.unmount();mount();await flush();selectAnswer();await flush();expect(requests[1].data).toEqual(requests[0].data);await complete(1);submit();await flush();await complete(2);expect(passed).toBe(true);
 });
 it("serializes locale changes against the same progress revision",async()=>{
  const view=mount();await flush();selectAnswer();await flush();view.rerender("ar-EG");await flush();selectAnswer();submit();await flush();expect(requests).toHaveLength(1);await complete(0);expect(requests[1]).toMatchObject({action:"reset_quiz",locale:"ar-EG"});await complete(1);expect(requests[2].data._technicalCommand?.expectedRevision).toBe(2);await complete(2);
 });
 it("does not silently rebase a conflict",async()=>{
  mount();await flush();selectAnswer();await flush();serverRevision=3;await complete(0);selectAnswer("Answer B");await flush();expect(requests).toHaveLength(1);fireEvent.click(screen.getByRole("button",{name:copy.retry}));await flush();submit();await flush();expect(requests[1].data._technicalCommand?.expectedRevision).toBe(3);await complete(1);await complete(2);
 });
 it("failed initial status cannot become revision zero",async()=>{
  statusFails=true;mount();await flush();selectAnswer();await flush();expect(requests).toHaveLength(0);expect(screen.getByRole("alert")).toBeInTheDocument();statusFails=false;fireEvent.click(screen.getByRole("button",{name:copy.retry}));await flush();submit();await flush();await complete(0);await complete(1);
 });
 it("keeps committed grade and exposes a real refresh error",async()=>{
  mount();await flush();selectAnswer();await flush();await complete(0);submit();await flush();statusFails=true;await complete(1);expect(screen.getByText("Server grade")).toBeInTheDocument();expect(screen.getByRole("alert")).toBeInTheDocument();
 });
 it("preserves dirty practice across refresh and drops it on actor switch",async()=>{
  const view=mount();fireEvent.click(screen.getByRole("button",{name:"assignment"}));fireEvent.change(screen.getByLabelText("innerWidth (mm)"),{target:{value:"123"}});await flush();expect(actions()).toEqual(["reset_practice"]);await complete(0);expect(screen.getByLabelText("innerWidth (mm)")).toHaveValue(123);submit();await flush();expect(requests[1].data.values).toMatchObject({innerWidth:"123"});await fail(1);expect(screen.getByLabelText("innerWidth (mm)")).toHaveValue(123);expect(screen.getByRole("alert")).toBeInTheDocument();mock.actor="33333333-3333-4333-8333-333333333333";mock.generation={value:999};view.rerender();fireEvent.click(screen.getByRole("button",{name:"assignment"}));expect(screen.getByLabelText("innerWidth (mm)")).toHaveValue(null);
 });
 it("does not refresh or dispatch queued grade after unmount",async()=>{
  const view=mount();await flush();selectAnswer();await flush();submit();view.unmount();const n=mock.rpc.mock.calls.filter(c=>c[1].p_action==="status").length;await complete(0);expect(actions()).toEqual(["reset_quiz"]);expect(mock.rpc.mock.calls.filter(c=>c[1].p_action==="status")).toHaveLength(n);
 });
});

describe("action-time version boundary",()=>{
 it("queued old edit cannot adopt a later external pass through delayed status refresh",async()=>{
  mount();await flush();fireEvent.click(screen.getByRole("button",{name:"markRead"}));await flush();expect(actions()).toEqual(["read"]);
  selectAnswer();await flush();serverRevision=1;passed=true;await complete(0);
  expect(actions()).toEqual(["read","reset_quiz"]);expect(requests[1].data._technicalCommand?.expectedRevision).toBe(0);
  await complete(1);expect(passed).toBe(true);expect(serverRevision).toBe(1);expect(screen.getByRole("alert")).toBeInTheDocument();
 });
 it("unconfirmed initial status blocks mutation even if status later succeeds",async()=>{
  let release!:(v:unknown)=>void;mock.rpc.mockImplementationOnce(()=>new Promise(resolve=>{release=resolve;}));
  mount();selectAnswer();await flush();expect(requests).toHaveLength(0);expect(screen.getByRole("alert")).toBeInTheDocument();
  serverRevision=3;passed=true;await act(async()=>release({data:{progress:{"M04-L02":{quizPassed:true,quizRevision:3}}},error:null}));await flush();expect(requests).toHaveLength(0);expect(passed).toBe(true);
  submit();await flush();expect(requests[0].data._technicalCommand?.expectedRevision).toBe(3);await complete(0);await complete(1);
 });
});
