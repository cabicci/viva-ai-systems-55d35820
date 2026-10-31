import { StrictMode, Suspense, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupportedLocale } from "@/lib/locale/types";
import { useKidsCompletion } from "./client";

const live=vi.hoisted(()=>({
  actor:"parent-a" as string|null, loading:false, generation:Object.freeze({value:0}) as object|undefined,
  predicate:undefined as ((token:object)=>unknown)|undefined, snapshot:undefined as object|undefined,
  sdk:undefined as object|undefined, userRead:undefined as (()=>void)|undefined,
  idRead:undefined as (()=>void)|undefined, loadingRead:undefined as (()=>void)|undefined,
  predicateRead:undefined as (()=>void)|undefined,
}));
vi.mock("@/lib/auth-context",()=>({useAuth:()=>live.snapshot}));
vi.mock("@/integrations/supabase/client",()=>({get supabase(){return live.sdk;}}));
function publishAuth() {
  const generation=live.generation;
  live.snapshot=Object.freeze({
    get user(){live.userRead?.();return live.actor===null?null:Object.freeze({get id(){live.idRead?.();return live.actor;}});},
    get loading(){live.loadingRead?.();return live.loading;},authGeneration:generation,
    get isAuthGenerationCurrent(){live.predicateRead?.();return live.predicate;},
    session:null,authError:null,signOut:async()=>{},
  });
}
const clients:QueryClient[]=[];
beforeEach(()=>{
  live.actor="parent-a";live.loading=false;live.generation=Object.freeze({value:0});
  // This normal predicate checks identity ONLY. It never hides actor/loading retirement.
  live.predicate=(token)=>token===live.generation;
  live.userRead=live.idRead=live.loadingRead=live.predicateRead=undefined;live.sdk=undefined;publishAuth();
});
afterEach(()=>{cleanup();for(const q of clients)q.clear();clients.length=0;});
function rotate(){live.generation=Object.freeze({value:0});}
type Props={profile:string;level:string;locale:SupportedLocale;enabled?:boolean};
const start:Props={profile:"child-a",level:"level-a",locale:"ar-EG",enabled:true};
const key=(actor:string|undefined="parent-a",props:Props=start)=>["kids-completion",actor,props.profile,props.level,props.locale];
const row=()=>({profile_id:"child-a",level_id:"level-a",lesson_number:-2.5,locale:"original-unknown-locale"});
function deferred<T=unknown>(){let resolve!:(value:T)=>void,reject!:(error:unknown)=>void;const promise=new Promise<T>((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};}
async function turn(work:()=>void=()=>{}){await act(async()=>{work();for(let n=0;n<16;n++)await Promise.resolve();await new Promise<void>(r=>setTimeout(r,0));await new Promise<void>(r=>setImmediate(r));});}
function fixture(strict=false,initial:Props=start){
  const trace={from:[] as unknown[],select:[] as unknown[],eq:[] as unknown[],receivers:[] as boolean[],thenReads:0,dispatches:0};
  const control:{finish:()=>unknown;boundary?:(name:string)=>void;suspend?:Promise<void>}={finish:()=>Promise.resolve({data:[row()],error:null})};
  const eq3=function(this:object,...args:unknown[]){trace.receivers.push(this===afterLevel);trace.eq.push(args);control.boundary?.("eq3.call");return control.finish();};
  const afterLevel={get eq(){control.boundary?.("eq3.get");return eq3;}};
  const eq2=function(this:object,...args:unknown[]){trace.receivers.push(this===afterProfile);trace.eq.push(args);control.boundary?.("eq2.call");return afterLevel;};
  const afterProfile={get eq(){control.boundary?.("eq2.get");return eq2;}};
  const eq1=function(this:object,...args:unknown[]){trace.receivers.push(this===selected);trace.eq.push(args);control.boundary?.("eq1.call");return afterProfile;};
  const selected={get eq(){control.boundary?.("eq1.get");return eq1;}};
  const select=function(this:object,...args:unknown[]){trace.receivers.push(this===table);trace.select.push(args);control.boundary?.("select.call");return selected;};
  const table={get select(){control.boundary?.("select.get");return select;}};
  const from=function(this:object,...args:unknown[]){trace.receivers.push(this===sdk);trace.from.push(args);control.boundary?.("from.call");return table;};
  const sdk={get from(){control.boundary?.("from.get");return from;}};live.sdk=sdk;
  for(const [name,method] of [["from",from],["select",select],["eq1",eq1],["eq2",eq2],["eq3",eq3]] as const){
    const bind=method.bind;Object.defineProperty(method,"bind",{get(){control.boundary?.(name+".bind.get");return function(this:object,...args:unknown[]){control.boundary?.(name+".bind.call");return Reflect.apply(bind,this,args);};}});expect(vi.isMockFunction(method)).toBe(false);
  }
  function newClient(){const q=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:Infinity},mutations:{retry:false}}});clients.push(q);return q;}
  const qc=newClient();let activeClient=qc;
  function Provider({children}:{children:ReactNode}){const body=<Suspense fallback={<span>Opening completion</span>}><QueryClientProvider client={activeClient}>{children}</QueryClientProvider></Suspense>;return strict?<StrictMode>{body}</StrictMode>:body;}
  const mount=()=>{publishAuth();let props=initial;const h=renderHook((p:Props)=>{const result=useKidsCompletion(p.profile,p.level,p.locale,p.enabled);if(control.suspend)throw control.suspend;return result;},{wrapper:Provider,reactStrictMode:strict,initialProps:props});return{...h,rerender:(next=props)=>{props=next;publishAuth();h.rerender(props);}};};
  return{trace,control,qc,mount,newClient,changeClient:(next:QueryClient)=>{activeClient=next;}};
}
async function checked(id:string,f:ReturnType<typeof fixture>,work:()=>Promise<void>){
  const events:string[]=[];const listener=(error:unknown)=>{events.push(error instanceof Error?error.message:String(error));};process.on("unhandledRejection",listener);
  try{await work();await turn();expect(events).toEqual([]);}finally{console.info("KIDS_READ_EVENTS "+JSON.stringify({id,events,thenReads:f.trace.thenReads,dispatches:f.trace.dispatches,targetReturningFunctionsPlain:true,fixtureRawTargetObserver:false,pureIdentityPredicateByDefault:true}));process.off("unhandledRejection",listener);}
}
describe("Kids completion decisive",()=>{
  it("KC01 same UUID new generation object retires saved rows before React cleanup",async()=>{
    const f=fixture();await checked("KC01",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));const saved=h.result.current;expect(saved.data).toEqual([row()]);rotate();expect(saved.data).toBeUndefined();expect(saved.isSuccess).toBe(false);});
  });
  it("KC02 live actor replacement retires saved rows even with fixed generation and true identity predicate",async()=>{
    const f=fixture();await checked("KC02",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));const saved=h.result.current,token=live.generation!;live.actor="parent-b";expect(live.predicate!(token)).toBe(true);expect(saved.data).toBeUndefined();expect(saved.isSuccess).toBe(false);});
  });
  it("KC03 eq3 reentrant retirement never adopts the returned lazy query",async()=>{
    const f=fixture();const lazy={get then(){f.trace.thenReads++;return function(this:object,yes:(value:unknown)=>void){expect(this).toBe(lazy);f.trace.dispatches++;yes({data:[row()],error:null});};}};f.control.finish=()=>{rotate();return lazy;};
    await checked("KC03",f,async()=>{const h=f.mount();await turn();expect(f.trace.eq).toHaveLength(3);expect(f.trace.thenReads).toBe(0);expect(f.trace.dispatches).toBe(0);expect(h.result.current.data).toBeUndefined();});
  });
});

// Only KC25 enables this probe; real React evaluates every unchanged updater.
const setterProbe=vi.hoisted(()=>({defer:false,queued:[] as Array<()=>void>}));
vi.mock("react",async(load)=>{const actual=await load<typeof import("react")>();return{...actual,useState:function<S>(initial:S|(()=>S)){
  const [value,update]=actual.useState(initial);const dispatch:typeof update=(next)=>{if(setterProbe.defer&&typeof next==="function")setterProbe.queued.push(()=>update(next));else update(next);};return[value,dispatch] as const;
}};});
beforeEach(()=>{setterProbe.defer=false;setterProbe.queued.length=0;});
function unreadThen(promise:object,f:ReturnType<typeof fixture>){Object.defineProperty(promise,"then",{get(){f.trace.thenReads++;throw new Error("Protected retired native then");}});}
describe("Kids completion ownership",()=>{
  it("KC04 exact current four-field snapshots preserve receivers and raw historical values without extra traversal",async()=>{
    const f=fixture();let extras=0;const original=row();Object.defineProperty(original,"recorded_at",{get(){extras++;throw new Error("unselected recorded_at");}});Object.defineProperty(original,"private_extra",{get(){extras++;throw new Error("private extra");}});f.control.finish=()=>Promise.resolve({data:[original,{...row(),lesson_number:0,locale:""}],error:null});
    await checked("KC04",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(f.trace.from).toEqual([["kids_lesson_progress"]]);expect(f.trace.select).toEqual([["profile_id,level_id,lesson_number,locale"]]);expect(f.trace.eq).toEqual([["profile_id","child-a"],["level_id","level-a"],["locale","ar-EG"]]);expect(f.trace.receivers).toEqual([true,true,true,true,true]);expect(h.result.current.data).toEqual([row(),{...row(),lesson_number:0,locale:""}]);expect(Object.keys(h.result.current.data![0])).toEqual(["profile_id","level_id","lesson_number","locale"]);expect(extras).toBe(0);original.locale="external mutation";expect(h.result.current.data?.[0].locale).toBe("original-unknown-locale");expect(Object.isFrozen(h.result.current.data)).toBe(true);});
  });
  it("KC05 genuine empty success and explicit refetch preserve Query-result API",async()=>{
    const f=fixture();f.control.finish=()=>Promise.resolve({data:[],error:null});await checked("KC05",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(h.result.current.data).toEqual([]);f.control.finish=()=>Promise.resolve({data:[row()],error:null});let returned:Awaited<ReturnType<typeof h.result.current.refetch>>|undefined;await act(async()=>{returned=await h.result.current.refetch();});expect(returned?.isSuccess).toBe(true);expect(returned?.data).toEqual([row()]);await waitFor(()=>expect(h.result.current.data).toEqual([row()]));expect(f.trace.eq).toHaveLength(6);});
  });
  it("KC06 default enabled and empty level retain existing admission without a new domain rule",async()=>{
    const f=fixture(false,{...start,level:"",enabled:undefined});await checked("KC06",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(f.trace.eq).toEqual([["profile_id","child-a"],["level_id",""],["locale","ar-EG"]]);});
  });
  it.each(["sdk-error","reject","throw","not-array","missing-fields","wrong-field-type"])("KC07 current %s fails honestly and explicit refetch recovers",async(kind)=>{
    const f=fixture(),error=new Error("current completion failure");f.control.finish=()=>{if(kind==="throw")throw error;if(kind==="reject")return Promise.reject(error);return Promise.resolve(kind==="sdk-error"?{data:null,error}:{data:kind==="not-array"?null:kind==="missing-fields"?[{}]:[{...row(),lesson_number:"not numeric"}],error:null});};
    await checked("KC07-"+kind,f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isError).toBe(true));expect(h.result.current.data).toBeUndefined();expect(h.result.current.isSuccess).toBe(false);if(["sdk-error","reject","throw"].includes(kind))expect(h.result.current.error).toBe(error);f.control.finish=()=>Promise.resolve({data:[],error:null});await act(async()=>{await h.result.current.refetch();});await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(h.result.current.data).toEqual([]);expect(h.result.current.error).toBeNull();});
  });
  it.each(["signedout","loading","unknown-generation","no-predicate","false","undefined","truthy-number","truthy-object","missing-profile","self-profile","disabled"])("KC08 %s cannot query or manually refetch",async(kind)=>{
    const props={...start};const f=fixture(false,props);if(kind==="signedout")live.actor=null;if(kind==="loading")live.loading=true;if(kind==="unknown-generation")live.generation=undefined;if(kind==="no-predicate")live.predicate=undefined;if(kind==="false")live.predicate=()=>false;if(kind==="undefined")live.predicate=()=>undefined;if(kind==="truthy-number")live.predicate=()=>1;if(kind==="truthy-object")live.predicate=()=>({});if(kind==="missing-profile")props.profile="";if(kind==="self-profile")props.profile="parent-a";if(kind==="disabled")props.enabled=false;
    await checked("KC08-"+kind,f,async()=>{const h=f.mount();await turn();expect(h.result.current.data).toBeUndefined();expect(h.result.current.isSuccess).toBe(false);expect(h.result.current.isError).toBe(false);void h.result.current.refetch();await turn();expect(f.trace.eq).toHaveLength(0);});
  });
  it.each(["actor","logout","loading"])("KC09 live %s retires all saved view access with fixed generation and true pure predicate",async(kind)=>{
    const f=fixture();await checked("KC09-"+kind,f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));const saved=h.result.current,refetch=saved.refetch,token=live.generation!;if(kind==="actor")live.actor="parent-b";if(kind==="logout")live.actor=null;if(kind==="loading")live.loading=true;expect(live.predicate!(token)).toBe(true);expect(saved.data).toBeUndefined();expect(saved.error).toBeNull();expect(saved.isSuccess).toBe(false);expect(saved.isError).toBe(false);expect(saved.status).toBe("pending");expect(saved.fetchStatus).toBe("idle");void refetch();void saved.promise;await turn();expect(f.trace.eq).toHaveLength(3);});
  });
  it("KC10 a saved current error and retry retire on loading without changing generation/predicate",async()=>{
    const f=fixture();f.control.finish=()=>Promise.resolve({data:null,error:new Error("saved old error")});await checked("KC10",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isError).toBe(true));const saved=h.result.current,retry=saved.refetch;live.loading=true;expect(live.predicate!(live.generation!)).toBe(true);expect(saved.error).toBeNull();expect(saved.isError).toBe(false);void retry();await turn();expect(f.trace.eq).toHaveLength(3);});
  });
  it.each(["user","id","loading","predicate"])("KC11 initial %s getter throw is fail-closed",async(field)=>{
    const f=fixture();const fail=()=>{throw new Error("unreadable live Auth");};if(field==="user")live.userRead=fail;if(field==="id")live.idRead=fail;if(field==="loading")live.loadingRead=fail;if(field==="predicate")live.predicateRead=fail;
    await checked("KC11-"+field,f,async()=>{const h=f.mount();await turn();expect(h.result.current.data).toBeUndefined();expect(h.result.current.isSuccess).toBe(false);void h.result.current.refetch();await turn();expect(f.trace.eq).toHaveLength(0);});
  });
  it.each(["getter-actor","getter-logout","getter-loading","call-actor","call-logout","call-loading"])("KC12 predicate %s reentry cannot hide live actor/loading retirement",async(kind)=>{
    const f=fixture();await checked("KC12-"+kind,f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));const saved=h.result.current;let once=false,calls=0;const change=()=>{if(once)return;once=true;if(kind.endsWith("actor"))live.actor="parent-b";if(kind.endsWith("logout"))live.actor=null;if(kind.endsWith("loading"))live.loading=true;};live.predicate=(token)=>{calls++;if(kind.startsWith("call"))change();return token===live.generation;};if(kind.startsWith("getter"))live.predicateRead=change;expect(saved.data).toBeUndefined();expect(saved.isSuccess).toBe(false);expect(calls).toBe(kind.startsWith("getter")?0:1);expect(live.generation).toBeDefined();});
  });
  it.each(["immediate","queued","delayed","loading-only"])("KC13 %s retired native rejection is observed with protected own then unread",async(kind)=>{
    const f=fixture(),d=deferred();f.control.finish=()=>{const p=kind==="immediate"||kind==="loading-only"?Promise.reject(new Error("retired native")):d.promise;if(kind==="loading-only")live.loading=true;else rotate();unreadThen(p,f);if(kind==="queued")queueMicrotask(()=>d.reject(new Error("queued native")));return p;};
    await checked("KC13-"+kind,f,async()=>{const h=f.mount();await turn();if(kind==="delayed")await turn(()=>d.reject(new Error("delayed native")));expect(f.trace.thenReads).toBe(0);expect(h.result.current.isError).toBe(false);expect(h.result.current.data).toBeUndefined();expect(f.trace.eq).toHaveLength(3);});
  });
  it("KC14 queued lazy retirement and fresh current nested adoption preserve receivers",async()=>{
    const f=fixture();const inner={get then(){f.trace.thenReads++;return function(this:object,yes:(v:unknown)=>void){expect(this).toBe(inner);f.trace.dispatches++;yes({data:[],error:null});};}};f.control.finish=()=>{queueMicrotask(rotate);return inner;};await checked("KC14",f,async()=>{const h=f.mount();await turn();expect(f.trace.thenReads).toBe(0);const outer={get then(){f.trace.thenReads++;return function(this:object,yes:(v:unknown)=>void){expect(this).toBe(outer);f.trace.dispatches++;yes(inner);};}};f.control.finish=()=>outer;h.rerender();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(h.result.current.data).toEqual([]);expect(f.trace.thenReads).toBe(2);expect(f.trace.dispatches).toBe(2);});
  });
  it("KC15 nested then getter loading retirement denies callback and observes derived rejection",async()=>{
    const f=fixture();const inner={get then(){f.trace.thenReads++;live.loading=true;return()=>{f.trace.dispatches++;};}};f.control.finish=()=>({then(yes:(v:unknown)=>void){yes(inner);return Promise.reject(new Error("derived native"));}});await checked("KC15",f,async()=>{const h=f.mount();await turn();expect(f.trace.thenReads).toBe(1);expect(f.trace.dispatches).toBe(0);expect(h.result.current.isError).toBe(false);});
  });
  const boundaries=["from.get","from.bind.get","from.bind.call","from.call","select.get","select.bind.get","select.bind.call","select.call","eq1.get","eq1.bind.get","eq1.bind.call","eq1.call","eq2.get","eq2.bind.get","eq2.bind.call","eq2.call","eq3.get","eq3.bind.get","eq3.bind.call"];
  it.each(boundaries)("KC16 %s retirement stops later three-filter dispatch",async(boundary)=>{
    const f=fixture();let crossed=false;f.control.boundary=(name)=>{if(!crossed&&name===boundary){crossed=true;rotate();}};await checked("KC16-"+boundary,f,async()=>{const h=f.mount();await turn();expect(crossed).toBe(true);expect(f.trace.eq.length).toBeLessThan(3);expect(h.result.current.data).toBeUndefined();expect(h.result.current.isError).toBe(false);});
  });
  it("KC17 retired from getter native value is observed without its protected own then",async()=>{
    const f=fixture();live.sdk={get from(){const p=Promise.reject(new Error("native getter value"));rotate();unreadThen(p,f);return p;}};await checked("KC17",f,async()=>{const h=f.mount();await turn();expect(f.trace.eq).toHaveLength(0);expect(f.trace.thenReads).toBe(0);expect(h.result.current.isError).toBe(false);});
  });
  it.each(["error","data","length","index","profile_id","level_id","lesson_number","locale"])("KC18 %s getter live loading retirement stops snapshot once",async(field)=>{
    const f=fixture();let reads=0;const item=row();let data:unknown=[item];if(field==="length"||field==="index")data=new Proxy([item],{get(target,key,receiver){if(key===(field==="length"?"length":"0")){reads++;live.loading=true;}return Reflect.get(target,key,receiver);}});else if(field!=="error"&&field!=="data"){const v=Reflect.get(item,field);Object.defineProperty(item,field,{get(){reads++;live.loading=true;return v;}});}const reply={data,error:null};if(field==="error"||field==="data"){const v=Reflect.get(reply,field);Object.defineProperty(reply,field,{get(){reads++;live.loading=true;return v;}});}f.control.finish=()=>Promise.resolve(reply);
    await checked("KC18-"+field,f,async()=>{const h=f.mount();await turn();expect(reads).toBe(1);expect(h.result.current.data).toBeUndefined();expect(h.result.current.isError).toBe(false);expect(h.result.current.isSuccess).toBe(false);});
  });
  it("KC19 row getter native rejection after retirement is observed without extra field traversal",async()=>{
    const f=fixture(),item=row();Object.defineProperty(item,"locale",{get(){const p=Promise.reject(new Error("row native"));live.loading=true;unreadThen(p,f);return p;}});f.control.finish=()=>Promise.resolve({data:[item],error:null});await checked("KC19",f,async()=>{const h=f.mount();await turn();expect(f.trace.thenReads).toBe(0);expect(h.result.current.data).toBeUndefined();expect(h.result.current.isError).toBe(false);});
  });
  it("KC20 legacy history and unrelated cache remain intact while fresh frame bypasses retired pending read",async()=>{
    const f=fixture(),old=deferred(),legacy=[{...row(),lesson_number:99}];f.qc.setQueryData(key(),legacy);const otherKey=key("other-parent");f.qc.setQueryData(otherKey,[row()]);f.control.finish=()=>old.promise;
    await checked("KC20",f,async()=>{const h=f.mount();await turn();expect(h.result.current.data).toBeUndefined();expect(h.result.current.isSuccess).toBe(false);expect(f.qc.getQueryData(key())).toBe(legacy);const saved=h.result.current,refetch=saved.refetch;rotate();unreadThen(old.promise,f);f.control.finish=()=>Promise.resolve({data:[],error:null});h.rerender();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(h.result.current.data).toEqual([]);expect(f.trace.eq).toHaveLength(6);void refetch();await turn(()=>old.reject(new Error("old pending rejection")));expect(f.trace.eq).toHaveLength(6);expect(f.trace.thenReads).toBe(0);expect(f.qc.getQueryData(key())).toBe(legacy);expect(f.qc.getQueryData(otherKey)).toEqual([row()]);expect(h.result.current.isSuccess).toBe(true);});
  });
  it("KC21 legacy and injected unowned cache errors/rows are masked without purging",async()=>{
    const f=fixture();const legacy=f.qc.getQueryCache().build(f.qc,{queryKey:key()});legacy.setState({error:new Error("legacy error"),status:"error"});await checked("KC21",f,async()=>{const h=f.mount();expect(h.result.current.isError).toBe(false);await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));const owned=f.qc.getQueryCache().findAll({queryKey:key()}).find(q=>q.state.data!==undefined)!;const injected=[{...row(),lesson_number:101}];await turn(()=>owned.setData(injected));expect(owned.state.data).toBe(injected);expect(h.result.current.data).toBeUndefined();expect(h.result.current.isSuccess).toBe(false);await turn(()=>owned.setState({error:new Error("injected error"),status:"error"}));expect(h.result.current.error).toBeNull();expect(h.result.current.isError).toBe(false);await act(async()=>{await h.result.current.refetch();});await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(legacy.state.error?.message).toBe("legacy error");});
  });
  it("KC22 genuine exact five-part key and three-part prefix invalidation remain compatible",async()=>{
    const f=fixture();await checked("KC22",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(f.qc.getQueryCache().findAll({queryKey:key().slice(0,3)}).every(q=>JSON.stringify(q.queryKey)===JSON.stringify(key()))).toBe(true);await act(async()=>{await f.qc.invalidateQueries({queryKey:key().slice(0,3)});});expect(f.trace.eq).toHaveLength(6);expect(h.result.current.isSuccess).toBe(true);});
  });
  it.each(["profile","level","locale","enabled"])("KC23 selected %s ABA never revives old callbacks/results or stalls a fresh read",async(field)=>{
    const f=fixture(),old=deferred();f.control.finish=()=>old.promise;await checked("KC23-"+field,f,async()=>{const h=f.mount();await turn();const saved=h.result.current,refetch=saved.refetch;const different:Props={...start};if(field==="profile")different.profile="child-b";if(field==="level")different.level="level-b";if(field==="locale")different.locale="en";if(field==="enabled")different.enabled=false;f.control.finish=()=>Promise.resolve({data:[],error:null});h.rerender(different);await turn();h.rerender({...start});await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));const calls=f.trace.eq.length;expect(calls).toBe(field==="enabled"?6:9);void refetch();await turn(()=>old.reject(new Error("retired selection")));expect(f.trace.eq).toHaveLength(calls);expect(saved.data).toBeUndefined();expect(h.result.current.data).toEqual([]);});
  });
  it("KC24 QueryClient ABA preserves old entries and retires callbacks when returning to the original client",async()=>{
    const f=fixture();await checked("KC24",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));const saved=h.result.current,refetch=saved.refetch,next=f.newClient();f.changeClient(next);h.rerender();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));f.changeClient(f.qc);h.rerender();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(f.trace.eq).toHaveLength(9);void refetch();await turn();expect(f.trace.eq).toHaveLength(9);expect(saved.data).toBeUndefined();expect(f.qc.getQueryCache().findAll({queryKey:key()}).filter(q=>q.state.data!==undefined).length).toBe(2);});
  });
  it("KC25 root StrictMode and delayed real functional mount updates permit only the latest lifetime",async()=>{
    const f=fixture(true);setterProbe.defer=true;await checked("KC25",f,async()=>{const h=f.mount();await turn();expect(f.trace.eq).toHaveLength(0);expect(setterProbe.queued).toHaveLength(2);const [old,last]=setterProbe.queued;setterProbe.defer=false;await turn(old);expect(f.trace.eq).toHaveLength(0);await turn(last);await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(f.trace.eq).toHaveLength(3);await act(async()=>{await h.result.current.refetch();});expect(f.trace.eq).toHaveLength(6);h.unmount();await turn(old);expect(f.trace.eq).toHaveLength(6);});
  });
  it("KC26 unmount retires a saved failure and its refetch callback",async()=>{
    const f=fixture();f.control.finish=()=>Promise.resolve({data:null,error:new Error("unmounted failure")});await checked("KC26",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isError).toBe(true));const saved=h.result.current,refetch=saved.refetch;h.unmount();expect(saved.error).toBeNull();expect(saved.isError).toBe(false);void refetch();await turn();expect(f.trace.eq).toHaveLength(3);});
  });
  it("KC27 abandoned Suspense profile ABA obtains a fresh action without reviving old saved data/refetch",async()=>{
    const f=fixture(),resource=deferred<void>();await checked("KC27",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));const saved=h.result.current,refetch=saved.refetch;f.control.suspend=resource.promise;h.rerender({...start,profile:"child-b"});await turn();expect(saved.data).toBeUndefined();expect(document.body.textContent).toContain("Opening completion");f.control.suspend=undefined;h.rerender({...start});await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(f.trace.eq).toHaveLength(6);void refetch();await turn();expect(f.trace.eq).toHaveLength(6);expect(saved.data).toBeUndefined();});
  });
  it.each(["refetch","promise"])("KC28 returned view %s getter action replacement denies retired dispatch/adoption",async(field)=>{
    const f=fixture();await checked("KC28-"+field,f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));let saved:Awaited<ReturnType<typeof h.result.current.refetch>>|undefined;await act(async()=>{saved=await h.result.current.refetch();});const original=saved!.refetch,fresh=h.result.current.refetch;const lazy={get then(){f.trace.thenReads++;return(yes:(v:unknown)=>void)=>{f.trace.dispatches++;yes([]);};}};Object.defineProperty(saved!,field,{configurable:true,get(){void fresh();return field==="refetch"?original:lazy;}});if(field==="refetch")void saved!.refetch();else void saved!.promise;await turn();await turn();expect(f.trace.eq).toHaveLength(9);expect(f.trace.thenReads).toBe(0);expect(f.trace.dispatches).toBe(0);});
  });
  it("KC29 a current genuine Query promise resolves owned rows with explicit private experimental option",async()=>{
    const f=fixture();f.qc.setDefaultOptions({queries:{retry:false,gcTime:Infinity,experimental_prefetchInRender:true},mutations:{retry:false}});await checked("KC29",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));let data:unknown;await act(async()=>{data=await h.result.current.promise;});expect(data).toEqual([row()]);expect(f.trace.eq).toHaveLength(3);});
  });
  it("KC30 first fulfillment beats late throw/duplicate native work and derives no unhandled rejection",async()=>{
    const f=fixture();f.control.finish=()=>({then(yes:(v:unknown)=>void,no:(v:unknown)=>void){yes({data:[],error:null});const duplicate=Promise.reject(new Error("ignored duplicate"));unreadThen(duplicate,f);yes(duplicate);const ignored=Promise.reject(new Error("ignored rejection"));unreadThen(ignored,f);no(ignored);throw new Error("after fulfillment");}});await checked("KC30",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(h.result.current.data).toEqual([]);expect(f.trace.eq).toHaveLength(3);expect(f.trace.thenReads).toBe(0);});
  });
  it("KC31 first rejection beats late fulfillment and a returned-result refetch keeps current throwOnError",async()=>{
    const f=fixture(),error=new Error("first error");f.control.finish=()=>({then(yes:(v:unknown)=>void,no:(v:unknown)=>void){no(error);yes({data:[],error:null});return Promise.reject(new Error("derived rejection"));}});await checked("KC31",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isError).toBe(true));expect(h.result.current.error).toBe(error);f.control.finish=()=>Promise.resolve({data:[],error:null});let saved:Awaited<ReturnType<typeof h.result.current.refetch>>|undefined;await act(async()=>{saved=await h.result.current.refetch();});expect(saved?.isSuccess).toBe(true);f.control.finish=()=>Promise.reject(error);let caught:unknown;await act(async()=>{try{await saved!.refetch({throwOnError:true});}catch(value){caught=value;}});expect(caught).toBe(error);await waitFor(()=>expect(h.result.current.isError).toBe(true));expect(h.result.current.data).toEqual([]);});
  });
  it("KC32 harmless frozen Auth/user/predicate callback churn does not reset the frame or duplicate reads",async()=>{
    const f=fixture();await checked("KC32",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));const refetch=h.result.current.refetch;for(let n=0;n<4;n++){live.predicate=(token)=>token===live.generation;h.rerender();expect(Object.isFrozen(live.snapshot)).toBe(true);}await turn();expect(f.trace.eq).toHaveLength(3);await act(async()=>{await refetch();});await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(f.trace.eq).toHaveLength(6);});
  });
});

describe("Kids completion client affinity",()=>{
  it("KC33 fresh selected QueryClient owns the active query and its genuine prefix invalidation",async()=>{
    const f=fixture();await checked("KC33",f,async()=>{const h=f.mount();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));const second=f.newClient();f.changeClient(second);h.rerender();await waitFor(()=>expect(h.result.current.isSuccess).toBe(true));expect(second.getQueryCache().findAll({queryKey:key()}).filter(q=>q.state.data!==undefined)).toHaveLength(1);expect(f.qc.getQueryCache().findAll({queryKey:key()}).filter(q=>q.state.data!==undefined)).toHaveLength(1);await act(async()=>{await second.invalidateQueries({queryKey:key().slice(0,3)});});expect(f.trace.eq).toHaveLength(9);});
  });
});
