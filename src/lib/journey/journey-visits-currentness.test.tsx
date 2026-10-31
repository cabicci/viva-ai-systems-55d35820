import { StrictMode, Suspense, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useJourneyVisits, visitsKey } from "./client";

const auth = vi.hoisted(() => ({
  actor: "actor-a", loading: false, generation: Object.freeze({ value: 0 }) as object | undefined,
  renderedActor: "actor-a", renderedLoading: false, renderedGeneration: undefined as object | undefined,
  renderedPredicate: undefined as ((value: object) => unknown) | undefined,
  admission: true as unknown, predicate: undefined as ((value: object) => unknown) | undefined,
  readActor: undefined as (() => void) | undefined,
  sdk: undefined as object | undefined,
}));
// A real context keeps its published snapshot until its provider renders.
// Only its mandatory live predicate observes retirement before that render.
vi.mock("@/lib/auth-context", () => ({ useAuth: () => {
  const actor=auth.renderedActor, loading=auth.renderedLoading, generation=auth.renderedGeneration, predicate=auth.renderedPredicate;
  return {
    user: actor ? { get id() { auth.readActor?.(); return actor; } } : null,
    loading, authGeneration: generation,
    isAuthGenerationCurrent: predicate ? (captured: object) => auth.actor === actor && !auth.loading ? predicate(captured) : false : undefined,
    session: null, authError: null, signOut: async () => {},
  };
} }));
vi.mock("@/integrations/supabase/client", () => ({ get supabase() { return auth.sdk; } }));
// Only JR25 enables this instrumentation. Each queued updater is eventually
// passed unchanged to the real React setter and evaluated by genuine React.
const setterProbe=vi.hoisted(()=>({defer:false,queued:[] as Array<()=>void>}));
vi.mock("react",async(load)=>{
  const actual=await load<typeof import("react")>();
  return {...actual,useState:function<S>(initial:S|(()=>S)) {
    const [value,update]=actual.useState(initial);
    const dispatch:typeof update=(next)=>{
      if(setterProbe.defer && typeof next === "function")setterProbe.queued.push(()=>update(next));
      else update(next);
    };
    return [value,dispatch] as const;
  }};
});
const clients: QueryClient[] = [];
beforeEach(() => {
  setterProbe.defer=false;setterProbe.queued.length=0;
  auth.actor = "actor-a"; auth.loading = false; auth.generation = Object.freeze({ value: 0 });
  auth.admission = true; auth.predicate = (value) => value === auth.generation ? auth.admission : false;
  auth.readActor = undefined; auth.sdk = undefined;
});
afterEach(() => { cleanup(); for (const client of clients) client.clear(); clients.length = 0; });
function rotate(actor = "actor-a") { auth.generation = Object.freeze({ token: {} }); auth.actor = actor; }
function deferred<T = unknown>() {
  let resolve!: (value: T) => void, reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes,no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const row = () => ({ line: "kids", course_id: "course", subject_id: "child", profile_id: "child", lesson_id: "step", locale: "unknown-original-language", visited_at: "unknown-original-time" });
async function turn(work: () => void = () => undefined) {
  await act(async () => { work(); for (let n=0;n<16;n++) await Promise.resolve();
    await new Promise<void>((r) => setTimeout(r, 0)); await new Promise<void>((r) => setImmediate(r)); });
}
function fixture(strict = false) {
  const trace = { from: [] as unknown[], select: [] as unknown[], eq: [] as unknown[], receivers: [] as boolean[], thenReads: 0, dispatches: 0 };
  const control: { finish: () => unknown; boundary?: (name: string) => void; suspended?: Promise<void> } = { finish: () => Promise.resolve({ data: [row()], error: null }) };
  const eq = function(this: object, ...args: unknown[]) { trace.receivers.push(this === selected); trace.eq.push(args); control.boundary?.("eq.call"); return control.finish(); };
  const selected = { get eq() { control.boundary?.("eq.get"); return eq; } };
  const select = function(this: object, ...args: unknown[]) { trace.receivers.push(this === table); trace.select.push(args); control.boundary?.("select.call"); return selected; };
  const table = { get select() { control.boundary?.("select.get"); return select; } };
  const from = function(this: object, ...args: unknown[]) { trace.receivers.push(this === sdk); trace.from.push(args); control.boundary?.("from.call"); return table; };
  const sdk = { get from() { control.boundary?.("from.get"); return from; } }; auth.sdk = sdk;
  for (const [name, fn] of [["from", from], ["select", select], ["eq", eq]] as const) {
    const bind = fn.bind;
    Object.defineProperty(fn,"bind",{get() { control.boundary?.(name+".bind"); return bind; }});
    expect(vi.isMockFunction(fn)).toBe(false);
  }
  function newClient() {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
    clients.push(qc); return qc;
  }
  const qc = newClient(); let activeClient = qc;
  function Provider({children}: {children: ReactNode}) {
    const inside = <Suspense fallback={<span>Opening history</span>}><QueryClientProvider client={activeClient}>{children}</QueryClientProvider></Suspense>;
    return strict ? <StrictMode>{inside}</StrictMode> : inside;
  }
  const publishAuth = () => {
    auth.renderedActor=auth.actor;auth.renderedLoading=auth.loading;
    auth.renderedGeneration=auth.generation;auth.renderedPredicate=auth.predicate;
  };
  const mount = () => {
    publishAuth();
    const mounted=renderHook(() => { const value = useJourneyVisits(); if (control.suspended) throw control.suspended; return value; },{wrapper:Provider,reactStrictMode:strict});
    return {...mounted,rerender:()=>{publishAuth();mounted.rerender();}};
  };
  return { trace, control, qc, mount, newClient, changeClient: (v: QueryClient) => { activeClient = v; } };
}
async function checked(id: string, f: ReturnType<typeof fixture>, work: () => Promise<void>) {
  const events: string[] = []; const listener = (error: unknown) => { events.push(error instanceof Error ? error.message : String(error)); };
  process.on("unhandledRejection",listener);
  try { await work(); await turn(); expect(events).toEqual([]); }
  finally { console.info("JOURNEY_READ_EVENTS "+JSON.stringify({id,events,thenReads:f.trace.thenReads,dispatches:f.trace.dispatches,targetFunctionsPlain:true,fixtureTargetObserver:false})); process.off("unhandledRejection",listener); }
}
describe("Journey read decisive", () => {
  it("JR01 live same UUID retirement hides a saved successful result before React cleanup", async () => {
    const f=fixture(); await checked("JR01",f,async()=> {
      const h=f.mount(); await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));
      const saved=h.result.current; expect(saved.data?.[0].locale).toBe("unknown-original-language");
      rotate(); expect(saved.data).toBeUndefined(); expect(saved.isSuccess).toBe(false); expect(saved.error).toBeNull();
    });
  });
  it("JR02 retirement inside eq does not adopt a returned lazy query", async () => {
    const f=fixture(); const lazy={get then() { f.trace.thenReads++; return function(this: object, yes: (v: unknown)=>void) { expect(this).toBe(lazy); f.trace.dispatches++; yes({data:[row()],error:null}); }; }};
    f.control.finish=()=>{rotate();return lazy;};
    await checked("JR02",f,async()=> { const h=f.mount(); await turn(); expect(f.trace.eq).toHaveLength(1); expect(f.trace.thenReads).toBe(0); expect(f.trace.dispatches).toBe(0); expect(h.result.current.data).toBeUndefined(); });
  });
});

function unreadThen(promise: object, f: ReturnType<typeof fixture>) {
  Object.defineProperty(promise,"then",{get(){ f.trace.thenReads++; throw new Error("Protected retired native then read"); }});
}
describe("Journey read closure",()=> {
  it("JR03 current rows snapshot exactly seven fields and preserve unknown values and all subjects",async()=> {
    const f=fixture(); let extras=0; const original=row();
    Object.defineProperty(original,"private_extra",{get(){extras++;throw new Error("unselected");}});
    f.control.finish=()=>Promise.resolve({data:[original,{...row(),line:"academic",subject_id:"actor-a",profile_id:null}],error:null});
    await checked("JR03",f,async()=> {const h=f.mount(); await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));
      expect(f.trace.from).toEqual([["journey_visits"]]);expect(f.trace.select).toEqual([["line,course_id,subject_id,profile_id,lesson_id,locale,visited_at"]]);expect(f.trace.eq).toEqual([["user_id","actor-a"]]);expect(f.trace.receivers).toEqual([true,true,true]);
      expect(h.result.current.data).toEqual([row(),{...row(),line:"academic",subject_id:"actor-a",profile_id:null}]);expect(extras).toBe(0);
      original.locale="changed externally";expect(h.result.current.data?.[0].locale).toBe("unknown-original-language");
      expect(Object.keys(h.result.current.data![0])).toEqual(["line","course_id","subject_id","profile_id","lesson_id","locale","visited_at"]);
      expect(Object.isFrozen(h.result.current.data)).toBe(true);
    });
  });
  it("JR04 current empty rows are honest success and manual refetch returns genuine success",async()=> {
    const f=fixture();f.control.finish=()=>Promise.resolve({data:[],error:null});
    await checked("JR04",f,async()=> {const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(h.result.current.data).toEqual([]);
      f.control.finish=()=>Promise.resolve({data:[row()],error:null});let returned:Awaited<ReturnType<typeof h.result.current.refetch>>|undefined;
      await act(async()=>{returned=await h.result.current.refetch();});expect(returned?.isSuccess).toBe(true);expect(returned?.data).toEqual([row()]);expect(f.trace.eq).toHaveLength(2);
    });
  });
  it.each(["sdk-error","reject","throw","invalid-data"])("JR05 current %s remains a failure and explicit refetch recovers",async(kind)=> {
    const f=fixture(); const failure=new Error("current selected failure");
    f.control.finish=()=>{if(kind==="throw")throw failure;if(kind==="reject")return Promise.reject(failure);return Promise.resolve(kind==="sdk-error"?{data:null,error:failure}:{data:null,error:null});};
    await checked("JR05-"+kind,f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isError).toBe(true));expect(h.result.current.isSuccess).toBe(false);expect(h.result.current.data).toBeUndefined();if(kind!=="invalid-data")expect(h.result.current.error).toBe(failure);
      f.control.finish=()=>Promise.resolve({data:[],error:null});await act(async()=>{await h.result.current.refetch();});await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(h.result.current.error).toBeNull();expect(h.result.current.data).toEqual([]);
    });
  });
  it.each(["signedout","loading","unknown-generation","no-predicate","false","undefined","truthy-number","truthy-object"])("JR06 %s cannot dispatch or manually refetch",async(kind)=> {
    const f=fixture();if(kind==="signedout")auth.actor="";if(kind==="loading")auth.loading=true;if(kind==="unknown-generation")auth.generation=undefined;if(kind==="no-predicate")auth.predicate=undefined;
    if(kind==="false")auth.admission=false;if(kind==="undefined")auth.admission=undefined;if(kind==="truthy-number")auth.admission=1;if(kind==="truthy-object")auth.admission={};
    await checked("JR06-"+kind,f,async()=>{const h=f.mount();await turn();expect(h.result.current.isSuccess).toBe(false);expect(h.result.current.isError).toBe(false);expect(h.result.current.data).toBeUndefined();void h.result.current.refetch();await turn();expect(f.trace.eq).toHaveLength(0);});
  });
  it.each(["sameUUID","actor","logout","loading"])("JR07 live %s retirement hides saved data/status and denies saved refetch before render",async(kind)=> {
    const f=fixture();await checked("JR07-"+kind,f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));const saved=h.result.current, refetch=saved.refetch;
      if(kind==="sameUUID")rotate();if(kind==="actor")auth.actor="actor-b";if(kind==="logout")auth.actor="";if(kind==="loading")auth.loading=true;
      expect(saved.data).toBeUndefined();expect(saved.error).toBeNull();expect(saved.status).toBe("pending");expect(saved.isSuccess).toBe(false);expect(saved.fetchStatus).toBe("idle");void refetch();await turn();expect(f.trace.eq).toHaveLength(1);void saved.promise;
    });
  });
  it("JR08 saved error retires before cleanup and cannot enqueue a refetch",async()=>{
    const f=fixture();f.control.finish=()=>Promise.resolve({data:null,error:new Error("old failure")});
    await checked("JR08",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isError).toBe(true));const saved=h.result.current, retry=saved.refetch;rotate();expect(saved.error).toBeNull();expect(saved.isError).toBe(false);void retry();await turn();expect(f.trace.eq).toHaveLength(1);});
  });
  it.each(["immediate","queued","delayed"])("JR09 %s retired native rejection is observed without protected own then",async(kind)=>{
    const f=fixture(),d=deferred();
    f.control.finish=()=>{let promise:Promise<unknown>;if(kind==="immediate")promise=Promise.reject(new Error("retired eager"));else promise=d.promise;unreadThen(promise,f);rotate();if(kind==="queued")queueMicrotask(()=>d.reject(new Error("retired queued")));return promise;};
    await checked("JR09-"+kind,f,async()=>{const h=f.mount();await turn();if(kind==="delayed")await turn(()=>d.reject(new Error("retired delayed")));expect(f.trace.eq).toHaveLength(1);expect(f.trace.thenReads).toBe(0);expect(h.result.current.isError).toBe(false);expect(h.result.current.data).toBeUndefined();});
  });
  it("JR10 queued retirement stops lazy lookup and nested current lazy values preserve receivers",async()=>{
    const f=fixture();const lazy={get then(){f.trace.thenReads++;return function(this:object,yes:(v:unknown)=>void){expect(this).toBe(lazy);f.trace.dispatches++;yes({data:[],error:null});};}};
    f.control.finish=()=>{queueMicrotask(()=>rotate());return lazy;};
    await checked("JR10",f,async()=>{const h=f.mount();await turn();expect(f.trace.thenReads).toBe(0);expect(f.trace.dispatches).toBe(0);
      const outer={get then(){f.trace.thenReads++;return function(this:object,yes:(v:unknown)=>void){expect(this).toBe(outer);f.trace.dispatches++;yes(lazy);};}};f.control.finish=()=>outer;h.rerender();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(h.result.current.data).toEqual([]);expect(f.trace.thenReads).toBe(2);expect(f.trace.dispatches).toBe(2);
    });
  });
  it("JR11 a reentrant nested then getter prevents its callback and observes derived eager rejection",async()=>{
    const f=fixture();const inner={get then(){f.trace.thenReads++;rotate();return ()=>{f.trace.dispatches++;};}};
    const outer={then(yes:(v:unknown)=>void){yes(inner);return Promise.reject(new Error("derived entered"));}};f.control.finish=()=>outer;
    await checked("JR11",f,async()=>{const h=f.mount();await turn();expect(f.trace.thenReads).toBe(1);expect(f.trace.dispatches).toBe(0);expect(h.result.current.isError).toBe(false);});
  });
  it.each(["from.get","from.bind","from.call","select.get","select.bind","select.call","eq.get","eq.bind"])("JR12 retirement at %s prevents query dispatch",async(boundary)=>{
    const f=fixture();f.control.boundary=(name)=>{if(name===boundary)rotate();};
    await checked("JR12-"+boundary,f,async()=>{const h=f.mount();await turn();expect(f.trace.eq).toHaveLength(0);expect(h.result.current.data).toBeUndefined();expect(h.result.current.isError).toBe(false);});
  });
  it.each(["error","data","length","index","line","course_id","subject_id","profile_id","lesson_id","locale","visited_at"])("JR13 retirement in response/array/row %s stops projection",async(field)=>{
    const f=fixture();let reads=0;const item=row();let rows:unknown=[item];
    if(field==="length"||field==="index")rows=new Proxy([item],{get(target,key,receiver){if(key===(field==="length"?"length":"0")){reads++;rotate();}return Reflect.get(target,key,receiver);}});
    else if(!["error","data"].includes(field)) { const value=Reflect.get(item,field);Object.defineProperty(item,field,{get(){reads++;rotate();return value;}}); }
    const reply={error:null,data:rows};if(field==="error"||field==="data"){const value=Reflect.get(reply,field);Object.defineProperty(reply,field,{get(){reads++;rotate();return value;}});}
    f.control.finish=()=>Promise.resolve(reply);
    await checked("JR13-"+field,f,async()=>{const h=f.mount();await turn();expect(reads).toBe(1);expect(h.result.current.data).toBeUndefined();expect(h.result.current.isSuccess).toBe(false);expect(h.result.current.isError).toBe(false);});
  });
  it("JR14 a retired getter native value is intrinsically observed without own then",async()=>{
    const f=fixture();auth.sdk={get from(){const pending=Promise.reject(new Error("getter native"));unreadThen(pending,f);rotate();return pending;}};
    await checked("JR14",f,async()=>{const h=f.mount();await turn();expect(f.trace.thenReads).toBe(0);expect(f.trace.eq).toHaveLength(0);expect(h.result.current.isError).toBe(false);});
  });
  it("JR15 legacy cached history stays intact and cannot become owned history",async()=>{
    const f=fixture(),pending=deferred();const legacy=[{...row(),lesson_id:"legacy-unowned"}];f.qc.setQueryData(visitsKey("actor-a"),legacy);f.qc.setQueryData(visitsKey("other-actor"),[row()]);f.control.finish=()=>pending.promise;
    await checked("JR15",f,async()=>{const h=f.mount();await turn();expect(h.result.current.data).toBeUndefined();expect(h.result.current.isSuccess).toBe(false);expect(f.qc.getQueryData(visitsKey("actor-a"))).toBe(legacy);expect(f.qc.getQueryData(visitsKey("other-actor"))).toEqual([row()]);
      rotate();f.control.finish=()=>Promise.resolve({data:[{...row(),lesson_id:"fresh"}],error:null});h.rerender();await waitFor(()=>expect(h.result.current.data?.[0].lesson_id).toBe("fresh"));expect(f.trace.eq).toHaveLength(2);await turn(()=>pending.resolve({data:[{...row(),lesson_id:"retired"}],error:null}));expect(h.result.current.data?.[0].lesson_id).toBe("fresh");expect(f.qc.getQueryData(visitsKey("actor-a"))).toBe(legacy);
    });
  });
  it("JR16 old cache errors are unowned and genuine prefix invalidation still refetches current query",async()=>{
    const f=fixture();const old=f.qc.getQueryCache().build(f.qc,{queryKey:visitsKey("actor-a")});old.setState({error:new Error("legacy cache"),status:"error"});
    await checked("JR16",f,async()=>{const h=f.mount();expect(h.result.current.isError).toBe(false);await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));
      expect(f.qc.getQueryCache().findAll({queryKey:visitsKey("actor-a")}).every(q=>JSON.stringify(q.queryKey)===JSON.stringify(visitsKey("actor-a")))).toBe(true);
      await act(async()=>{await f.qc.invalidateQueries({queryKey:visitsKey("actor-a")});});expect(f.trace.eq).toHaveLength(2);expect(old.state.error?.message).toBe("legacy cache");
    });
  });
  it("JR17 harmless Auth object/predicate callback churn retains one query and a current refetch",async()=>{
    const f=fixture();await checked("JR17",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));const saved=h.result.current.refetch;
      for(let n=0;n<4;n++){auth.predicate=(token)=>token===auth.generation;h.rerender();}await turn();expect(f.trace.eq).toHaveLength(1);await act(async()=>{await saved();});expect(f.trace.eq).toHaveLength(2);expect(h.result.current.isSuccess).toBe(true);
    });
  });
  it("JR18 generation ABA never revives an old result/refetch or waits for retired pending work",async()=>{
    const f=fixture(),pending=deferred();const first=auth.generation;f.control.finish=()=>pending.promise;
    await checked("JR18",f,async()=>{const h=f.mount();await turn();const saved=h.result.current,refetch=saved.refetch;rotate();f.control.finish=()=>Promise.resolve({data:[],error:null});h.rerender();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));auth.generation=first;h.rerender();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(f.trace.eq).toHaveLength(3);void refetch();await turn();expect(f.trace.eq).toHaveLength(3);expect(saved.data).toBeUndefined();await turn(()=>pending.reject(new Error("old pending")));expect(h.result.current.isSuccess).toBe(true);});
  });
  it("JR19 replacing QueryClient retires old views and starts independent current cache",async()=>{
    const f=fixture();await checked("JR19",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));const saved=h.result.current,refetch=saved.refetch;const next=f.newClient();f.changeClient(next);h.rerender();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(f.trace.eq).toHaveLength(2);expect(saved.data).toBeUndefined();void refetch();await turn();expect(f.trace.eq).toHaveLength(2);expect(f.qc.getQueryCache().findAll({queryKey:visitsKey("actor-a")}).some(q=>q.state.data!==undefined)).toBe(true);});
  });
  it("JR20 unmount retires a saved successful result and its refetch",async()=>{
    const f=fixture();await checked("JR20",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));const saved=h.result.current,refetch=saved.refetch;h.unmount();expect(saved.data).toBeUndefined();expect(saved.isSuccess).toBe(false);void refetch();await turn();expect(f.trace.eq).toHaveLength(1);});
  });
  it("JR21 StrictMode admits one current query and one explicit refetch",async()=>{
    const f=fixture(true);await checked("JR21",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(f.trace.eq).toHaveLength(1);await act(async()=>{await h.result.current.refetch();});expect(f.trace.eq).toHaveLength(2);});
  });
  it("JR22 suspended generation ABA creates a fresh read and cannot revive an old callback",async()=>{
    const f=fixture(),resource=deferred<void>();const first=auth.generation;
    await checked("JR22",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));const saved=h.result.current,refetch=saved.refetch;f.control.suspended=resource.promise;rotate();h.rerender();await turn();expect(saved.data).toBeUndefined();auth.generation=first;f.control.suspended=undefined;h.rerender();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(f.trace.eq).toHaveLength(2);void refetch();await turn();expect(f.trace.eq).toHaveLength(2);expect(saved.data).toBeUndefined();});
  });
  it("JR23 a refetch retired during dispatch returns a masked result and observes native rejection",async()=>{
    const f=fixture();await checked("JR23",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));f.control.finish=()=>{const promise=Promise.reject(new Error("retired refetch"));unreadThen(promise,f);rotate();return promise;};let returned:Awaited<ReturnType<typeof h.result.current.refetch>>|undefined;
      await act(async()=>{returned=await h.result.current.refetch();});expect(returned?.data).toBeUndefined();expect(returned?.isSuccess).toBe(false);expect(returned?.isError).toBe(false);expect(f.trace.thenReads).toBe(0);
    });
  });
  it("JR24 superseded refetch outcome cannot replace newer rows or expose old success",async()=>{
    const f=fixture(),a=deferred(),b=deferred();await checked("JR24",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));f.control.finish=()=>a.promise;const first=h.result.current.refetch();await turn();f.control.finish=()=>b.promise;const second=h.result.current.refetch();await turn();await turn(()=>b.resolve({data:[{...row(),lesson_id:"newest"}],error:null}));await act(async()=>{await second;});await turn(()=>a.resolve({data:[{...row(),lesson_id:"oldest"}],error:null}));let old:Awaited<typeof first>|undefined;await act(async()=>{old=await first;});expect(h.result.current.data?.[0].lesson_id).toBe("newest");expect(old?.isSuccess).toBe(false);expect(old?.data).toBeUndefined();});
  });
});

describe("Journey read extra controls",()=>{
  it("JR25 delayed retired mount updater cannot enable a query and latest updater uses genuine React",async()=>{
    const f=fixture(true);setterProbe.defer=true;
    await checked("JR25",f,async()=>{const h=f.mount();await turn();expect(f.trace.eq).toHaveLength(0);expect(setterProbe.queued.length).toBe(2);const [old,last]=setterProbe.queued;setterProbe.defer=false;
      await turn(()=>old());expect(f.trace.eq).toHaveLength(0);await turn(()=>last());await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(f.trace.eq).toHaveLength(1);h.unmount();await turn(()=>old());expect(f.trace.eq).toHaveLength(1);
    });
  });
  it("JR26 injected unowned data in private cache is masked without purging history",async()=>{
    const f=fixture();await checked("JR26",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));
      const query=f.qc.getQueryCache().findAll({queryKey:visitsKey("actor-a")}).find(q=>q.state.data!==undefined);expect(query).toBeDefined();const injected=[{...row(),lesson_id:"injected"}];await turn(()=>query!.setData(injected));expect(query!.state.data).toBe(injected);expect(h.result.current.isSuccess).toBe(false);expect(h.result.current.data).toBeUndefined();await act(async()=>{await h.result.current.refetch();});await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(h.result.current.data?.[0].lesson_id).toBe("step");
    });
  });
  it("JR27 current manual refetch throwOnError keeps honest failure and owned prior rows",async()=>{
    const f=fixture();await checked("JR27",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));const error=new Error("manual current failure");f.control.finish=()=>Promise.reject(error);let caught:unknown;
      await act(async()=>{try{await h.result.current.refetch({throwOnError:true});}catch(value){caught=value;}});expect(caught).toBe(error);await waitFor(()=>expect(h.result.current.isError).toBe(true));expect(h.result.current.error).toBe(error);expect(h.result.current.data).toEqual([row()]);
    });
  });
});

describe("Journey read settlement",()=>{
  it("JR28 a current thenable fulfillment wins over its later synchronous throw",async()=>{
    const f=fixture();const value={then(yes:(v:unknown)=>void){yes({data:[row()],error:null});throw new Error("after fulfillment");}};f.control.finish=()=>value;
    await checked("JR28",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(h.result.current.data).toEqual([row()]);expect(f.trace.eq).toHaveLength(1);});
  });
});

describe("Journey read settlement controls",()=>{
  it("JR29 duplicate fulfillment/rejection and derived native rejection are observed without changing first success",async()=>{
    const f=fixture();const value={then(yes:(v:unknown)=>void,no:(v:unknown)=>void){yes({data:[],error:null});const duplicate=Promise.reject(new Error("ignored fulfillment native"));unreadThen(duplicate,f);yes(duplicate);const ignored=Promise.reject(new Error("ignored rejection native"));unreadThen(ignored,f);no(ignored);return Promise.reject(new Error("derived native"));}};f.control.finish=()=>value;
    await checked("JR29",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(h.result.current.data).toEqual([]);expect(f.trace.eq).toHaveLength(1);expect(f.trace.thenReads).toBe(0);});
  });
  it("JR30 first rejection wins over later fulfillment/throw and current manual retry recovers",async()=>{
    const f=fixture(),error=new Error("first rejection");const value={then(yes:(v:unknown)=>void,no:(v:unknown)=>void){no(error);yes({data:[row()],error:null});throw new Error("late throw");}};f.control.finish=()=>value;
    await checked("JR30",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isError).toBe(true));expect(h.result.current.error).toBe(error);expect(h.result.current.data).toBeUndefined();f.control.finish=()=>Promise.resolve({data:[],error:null});await act(async()=>{await h.result.current.refetch();});await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));});
  });
});

describe("Journey read saved-view boundary",()=>{
  it.each(["refetch","promise"])("JR31 saved view %s getter cannot dispatch/adopt after reentrant action replacement",async(field)=>{
    const f=fixture();await checked("JR31-"+field,f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));let saved:Awaited<ReturnType<typeof h.result.current.refetch>>|undefined;
      await act(async()=>{saved=await h.result.current.refetch();});const original=saved!.refetch,fresh=h.result.current.refetch;
      const lazy={get then(){f.trace.thenReads++;return (yes:(v:unknown)=>void)=>{f.trace.dispatches++;yes([]);};}};
      Object.defineProperty(saved!,field,{configurable:true,get(){void fresh();return field==="refetch"?original:lazy;}});
      if(field==="refetch")void saved!.refetch();else void saved!.promise;await turn();await turn();expect(f.trace.eq).toHaveLength(3);expect(f.trace.thenReads).toBe(0);expect(f.trace.dispatches).toBe(0);
    });
  });
  it("JR32 a refetch from a current returned result retains throwOnError for its own new action",async()=>{
    const f=fixture();await checked("JR32",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));let saved:Awaited<ReturnType<typeof h.result.current.refetch>>|undefined;await act(async()=>{saved=await h.result.current.refetch();});const error=new Error("returned-view current failure");f.control.finish=()=>Promise.reject(error);let caught:unknown;await act(async()=>{try{await saved!.refetch({throwOnError:true});}catch(value){caught=value;}});expect(caught).toBe(error);await waitFor(()=>expect(h.result.current.isError).toBe(true));
    });
  });
});
