import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Profiler } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { inspect } from "node:util";
import type { User } from "@supabase/supabase-js";
import type { useAuth, AuthGeneration } from "@/lib/auth-context";
import type { LearnerContext } from "@/lib/learner-context";
import type { useLocale } from "@/lib/locale/locale-context";
import type { SupportedLocale } from "@/lib/locale/types";
import type { AssistantRuntimeRequestPayload, AssistantRuntimeResponsePayload } from "@/lib/assistant-runtime";

type CaseState = {
  name: string; current: boolean; trace: string[]; hooks: Map<string, () => void>;
  ownThen: Record<string, number>; events: { kind: string; reason: string }[];
  getSessionCalls: number; invokeCalls: number; guardCalls: number; commits: number;
  token: unknown; response: unknown; failure: unknown;
  getSessionFactory: () => unknown; invokeFactory: () => unknown;
  sdkAuth: object; sdkFunctions: object; receivers: boolean[]; lastArgs: unknown[];
  generation: AuthGeneration; liveUser: User; loading: boolean; transient: "actor" | "loading" | null;
  transientCommits: number[]; authPublic: ReturnType<typeof useAuth>;
  learner: LearnerContext; localePublic: ReturnType<typeof useLocale>;
  storage: Storage; storageOps: { op: string; key: string; value?: string }[];
  network: number; uuid: number; hit: (point: string) => void;
};
const slot = vi.hoisted(() => {
  const holder: { current?: CaseState } = {};
  function current(): CaseState { if (!holder.current) throw new Error("Missing own case fixture");return holder.current; }
  const sdk = {
    get auth() { const c = current();c.hit("auth:get");return c.sdkAuth; },
    get functions() { const c = current();c.hit("functions:get");return c.sdkFunctions; },
  };
  return { holder, sdk, current };
});
// Whole public client module, before imports. No real lazy Proxy/env/storage/SDK.
vi.mock("@/integrations/supabase/client", () => ({ supabase: slot.sdk }));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => slot.current().authPublic }));
vi.mock("@/lib/learner-context", () => ({ useLearnerContext: () => slot.current().learner }));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => slot.current().localePublic }));

import { callGuardedAssistantRuntimeBoxed } from "@/lib/assistant-runtime";
import { AssistantRequestError } from "@/lib/card-assistant/errors";
import { AssistantPanel } from "@/components/assistant/AssistantPanel";
import { getPath } from "@/lib/curriculum-data";
import { getUiString } from "@/lib/locale/ui-strings";
import { LOCALE_META } from "@/lib/locale/types";
import { validateRuntimeLocale } from "@/lib/rag/runtime-locale";

const userA: User = { id: "00000000-0000-4000-8000-000000000001", aud: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "2026-10-25T00:00:00Z" };
const userB: User = { ...userA, id: "00000000-0000-4000-8000-000000000002" };
function native(value: unknown): Promise<unknown> { return new Promise(resolve => resolve(value)); }
function rejected(reason: unknown): Promise<unknown> { return new Promise((_resolve, reject) => reject(reason)); }
function deferred() {
  let resolve: (value: unknown) => void = () => {};
  let reject: (reason: unknown) => void = () => {};
  const promise = new Promise<unknown>((yes, no) => { resolve = yes;reject = no; });
  return { promise, resolve, reject };
}
function ownThen(c: CaseState, promise: Promise<unknown>, label: string, value: unknown, throws = false): void {
  c.ownThen[label] = 0;
  Object.defineProperty(promise, "then", { configurable: true, get() {
    c.ownThen[label]++;if (throws) throw value;return value;
  } });
}
function payload(locale: SupportedLocale = "en"): AssistantRuntimeRequestPayload {
  return { query: "fixture question", learnerContext: { locale, currentPath: "intro" }, conversationHistory: [{ question: "own earlier question", answer: "own earlier answer" }] };
}
function reply(): AssistantRuntimeResponsePayload {
  return { ok: true, runtime: "connected", receivedQuery: "fixture question", retrievalCount: 1, contextDetected: true,
    learnerContext: { currentPath: "intro", currentModule: null, currentLesson: null }, message: "fixture message", ts: "2026-10-25T00:00:00Z",
    answer: "# Owned heading\n\n**owned answer** with `code`\n\n- fixture item",
    citations: [{ lessonId: "fixture-step", title: "Owned source", productionRoute: "/learn/intro/fixture-step", excerpt: "fixture only" }] };
}
function sessionEnvelope(c: CaseState) {
  const session = { get access_token() { c.hit("token:get");return c.token; } };
  const data = { get session() { c.hit("session:get");return session; } };
  return { get data() { c.hit("session.data:get");return data; }, get error() { c.hit("UNUSED-session.error");throw new Error("Unused SDK error was traversed"); } };
}
function invokeEnvelope(c: CaseState) {
  return { get data() { c.hit("invoke.data:get");return c.response; }, get error() { c.hit("invoke.error:get");return c.failure; } };
}
function denial(c: CaseState, status: unknown, code: unknown, reason: unknown, bodyFactory?: () => unknown) {
  const body = { get error() { c.hit("body.error:get");return code; }, get reason() { c.hit("body.reason:get");return reason; } };
  const cloned = { get json() { c.hit("json:get");return function(this: unknown) {
    c.receivers.push(this === cloned);c.hit("json:call");return bodyFactory ? bodyFactory() : native(body);
  }; } };
  const ctx = {
    get clone() { c.hit("clone:get");return function(this: unknown) { c.receivers.push(this === ctx);c.hit("clone:call");return cloned; }; },
    get status() { c.hit("status:get");return status; },
  };
  return { get context() { c.hit("error.context:get");return ctx; } };
}
function newCase(name: string): CaseState {
  const intro = getPath("intro");if (!intro) throw new Error("Actual intro PATHS missing");
  const values = new Map<string, string>(), generation = Object.freeze({ value: 17 });
  const c: CaseState = {
    name, current: true, trace: [], hooks: new Map(), ownThen: {}, events: [], getSessionCalls: 0, invokeCalls: 0, guardCalls: 0, commits: 0,
    token: "fixture-token", response: reply(), failure: null, getSessionFactory: () => undefined, invokeFactory: () => undefined,
    sdkAuth: {}, sdkFunctions: {}, receivers: [], lastArgs: [], generation, liveUser: userA, loading: false, transient: null, transientCommits: [],
    authPublic: Object.freeze({
      get user() {
        if (c.transient === "actor") { c.transient = null;c.transientCommits.push(c.commits);c.hit("live.actor:B-once");return userB; }
        c.hit("live.actor:A");return c.liveUser;
      },
      session: null, authContinuity: Object.freeze({ continuity: 0 }),
      get loading() { if (c.transient === "loading") { c.transient = null;c.transientCommits.push(c.commits);c.hit("live.loading:true-once");return true; }return c.loading; },
      signOut: () => { throw new Error("Real Auth boot/signout excluded"); },
      get authGeneration() { return c.generation; },
      isAuthGenerationCurrent: (captured: AuthGeneration) => captured === c.generation,
      authError: null,
    }),
    learner: { currentUser: { id: userA.id, email: null, isAuthenticated: true }, currentRoute: "/paths/intro", currentPath: intro,
      currentModule: intro.modules[0] ?? null, currentLesson: null, currentLessonStatus: null, currentMission: null,
      completedLessonsCount: 0, totalLessonsCount: 1, overallCompletedLessonsCount: 0, overallTotalLessonsCount: 1,
      overallNextLesson: null, lastCompletedLesson: null, nextLesson: null, isReady: true, contentError: null, resolvedAt: "fixture" },
    localePublic: { locale: "en", setLocale: () => {}, ...LOCALE_META.en },
    storageOps: [], network: 0, uuid: 0,
    storage: { get length() { return values.size; }, key(index) { return [...values.keys()][index] ?? null; },
      clear() { throw new Error("Unscoped storage clear forbidden"); },
      getItem(key) { c.storageOps.push({ op: "get", key });return values.get(key) ?? null; },
      setItem(key, value) { c.storageOps.push({ op: "set", key, value });values.set(key, value); },
      removeItem(key) { c.storageOps.push({ op: "remove", key });values.delete(key); } },
    hit(point) { c.trace.push(point);c.hooks.get(point)?.(); },
  };
  c.sdkAuth = { get getSession() { c.hit("getSession:get");return function(this: unknown) {
    c.receivers.push(this === c.sdkAuth);c.getSessionCalls++;c.hit("getSession:call");return c.getSessionFactory();
  }; } };
  c.sdkFunctions = { get invoke() { c.hit("invoke:get");return function(this: unknown, ...args: unknown[]) {
    c.receivers.push(this === c.sdkFunctions);c.invokeCalls++;c.lastArgs = args;c.hit("invoke:call");return c.invokeFactory();
  }; } };
  c.getSessionFactory = () => native(sessionEnvelope(c));c.invokeFactory = () => native(invokeEnvelope(c));return c;
}
function guard(c: CaseState): () => unknown { return () => { c.guardCalls++;return c.current; }; }
type Outcome = { ok: true; value: unknown } | { ok: false; error: unknown };
async function outcome(api: Promise<unknown>): Promise<Outcome> {
  let box: Outcome;
  try { box = { ok: true, value: await api }; } catch (error) { box = { ok: false, error }; }
  Object.setPrototypeOf(box, null);return Object.freeze(box); // never adopt a thrown raw native reason
}
async function errorOf(api: Promise<unknown>): Promise<Readonly<{ error: unknown }>> {
  const result = await outcome(api);if (result.ok) throw new Error("Expected exported API failure");
  const box = { error: result.error };Object.setPrototypeOf(box, null);return Object.freeze(box);
}
function empty(error: unknown): void { expect(error).toBeInstanceOf(AssistantRequestError);if (!(error instanceof AssistantRequestError)) throw new Error("Missing existing bridge");expect(error.message).toBe(""); }
const pulse = () => new Promise<void>(resolve => setTimeout(resolve, 0));
let priorStorage: PropertyDescriptor | undefined, priorFetch: PropertyDescriptor | undefined;
let priorUUIDs: { owner: object; descriptor: PropertyDescriptor | undefined }[];
let priorXHRs: { owner: object; descriptor: PropertyDescriptor | undefined }[];
let onUnhandled: (reason: unknown) => void, onHandled: (promise: Promise<unknown>) => void, onWindow: (event: PromiseRejectionEvent) => void;
beforeEach(context => {
  const c = newCase(context.task.name);slot.holder.current = c;
  priorStorage = Object.getOwnPropertyDescriptor(window, "localStorage");Object.defineProperty(window, "localStorage", { configurable: true, get: () => c.storage });
  priorFetch = Object.getOwnPropertyDescriptor(globalThis, "fetch");Object.defineProperty(globalThis, "fetch", { configurable: true, value: function() { c.network++;throw new Error("Network excluded"); } });
  priorUUIDs=[];
  for(const owner of new Set([window.crypto,globalThis.crypto])){
    priorUUIDs.push({owner,descriptor:Object.getOwnPropertyDescriptor(owner,"randomUUID")});
    Object.defineProperty(owner,"randomUUID",{configurable:true,value:function(){c.uuid++;return `00000000-0000-4000-8000-${String(c.uuid).padStart(12,"0")}`;}});
  }
  priorXHRs=[];
  for(const owner of new Set<object>([window,globalThis])){
    priorXHRs.push({owner,descriptor:Object.getOwnPropertyDescriptor(owner,"XMLHttpRequest")});
    Object.defineProperty(owner,"XMLHttpRequest",{configurable:true,value:function(){c.network++;c.hit("network:XHR");throw new Error("XHR excluded");}});
  }
  const event = (kind: string, reason: unknown) => c.events.push({ kind, reason: inspect(reason, { getters: false, customInspect: false, depth: 1 }) });
  onUnhandled = reason => event("unhandledRejection", reason);onHandled = promise => event("rejectionHandled", promise);onWindow = e => event("window.unhandledrejection", e.reason);
  process.on("unhandledRejection", onUnhandled);process.on("rejectionHandled", onHandled);window.addEventListener("unhandledrejection", onWindow);
});
afterEach(async () => {
  const c = slot.current();cleanup();c.current = false;c.loading = true;await pulse();await pulse();
  try { expect(c.events).toEqual([]);expect(c.network).toBe(0); }
  finally {
    process.stdout.write("R37_CASE "+JSON.stringify({ name: c.name, node: { version: process.version, execPath: process.execPath, versions: process.versions }, trace: c.trace,
      getSessionCalls: c.getSessionCalls, invokeCalls: c.invokeCalls, guardCalls: c.guardCalls, receivers: c.receivers, ownThen: c.ownThen,
      events: c.events, network: c.network, storage: c.storageOps, uuid: c.uuid, commits: c.commits, transientCommits: c.transientCommits })+"\n");
    process.off("unhandledRejection", onUnhandled);process.off("rejectionHandled", onHandled);window.removeEventListener("unhandledrejection", onWindow);
    if (priorStorage) Object.defineProperty(window,"localStorage",priorStorage);else Reflect.deleteProperty(window,"localStorage");
    if (priorFetch) Object.defineProperty(globalThis,"fetch",priorFetch);else Reflect.deleteProperty(globalThis,"fetch");
    for(const saved of priorUUIDs){if(saved.descriptor)Object.defineProperty(saved.owner,"randomUUID",saved.descriptor);else Reflect.deleteProperty(saved.owner,"randomUUID");}
    for(const saved of priorXHRs){if(saved.descriptor)Object.defineProperty(saved.owner,"XMLHttpRequest",saved.descriptor);else Reflect.deleteProperty(saved.owner,"XMLHttpRequest");}
  }
});

describe("R37 actual guarded helper ordinary-native domain", () => {
  it.each<SupportedLocale>(["ar-EG","ar-MSA","ar-Gulf","en"])("P01 current wire and own frozen reply box %s", async locale => {
    const c=slot.current(),p=payload(locale),answer=c.response;const result=await callGuardedAssistantRuntimeBoxed(p,guard(c));
    expect(result.reply).toBe(answer);expect(Object.getPrototypeOf(result)).toBe(null);expect(Object.isFrozen(result)).toBe(true);
    expect(Object.getOwnPropertyDescriptor(result,"reply")).toMatchObject({ writable:false,configurable:false });expect(Reflect.get(result,"then")).toBeUndefined();
    expect(c.lastArgs[0]).toBe("assistant-runtime");const options=c.lastArgs[1];if (!options || typeof options!=="object") throw new Error("Missing actual invocation args");
    expect(Reflect.get(options,"body")).toBe(p);expect(Reflect.get(options,"headers")).toEqual({Authorization:"Bearer fixture-token"});
    expect(c.receivers.every(Boolean)).toBe(true);expect(c.getSessionCalls).toBe(1);expect(c.invokeCalls).toBe(1);
    expect(c.trace.indexOf("invoke.data:get")).toBeLessThan(c.trace.indexOf("invoke.error:get"));expect(c.trace).not.toContain("UNUSED-session.error");
    expect(validateRuntimeLocale(locale).ok).toBe(true);
  });
  it.each([undefined,null,0,"","  "," en","EN","unsupported"])("P02 canonical invalid locale %j before SDK", async bad => {
    const c=slot.current(),p=payload();Object.defineProperty(p.learnerContext,"locale",{value:bad});const result=await errorOf(callGuardedAssistantRuntimeBoxed(p,guard(c)));
    expect(result.error).toBeInstanceOf(Error);if (!(result.error instanceof Error)) throw new Error("Missing canonical error");expect(result.error.message).toContain("Invalid assistant runtime locale:");expect(c.getSessionCalls).toBe(0);expect(c.trace).not.toContain("auth:get");
  });
  it.each([false,undefined,1,{}])("P03 literaltrue only %j", async answer => { const c=slot.current();empty((await errorOf(callGuardedAssistantRuntimeBoxed(payload(),()=>answer))).error);expect(c.getSessionCalls).toBe(0); });
  it("P04 guard throwing rejected native is observed before quiet retirement",async()=>{
    const c=slot.current(),p=rejected(new Error("guard native rejection"));ownThen(c,p,"guard-error",new Error("own then must not run"),true);
    empty((await errorOf(callGuardedAssistantRuntimeBoxed(payload(),()=>{throw p;}))).error);expect(c.ownThen["guard-error"]).toBe(0);expect(c.getSessionCalls).toBe(0);
  });
  it("P05 reentrant guard through entered lazy resolve cannot revive with true",async()=>{
    const c=slot.current();let resume: ((value:unknown)=>unknown)|undefined;let armed=true;
    c.getSessionFactory=()=>({then(resolve:(value:unknown)=>unknown){resume=resolve;}});
    const current=()=>{c.guardCalls++;if(resume&&armed){armed=false;resume(sessionEnvelope(c));}return true;};
    empty((await errorOf(callGuardedAssistantRuntimeBoxed(payload(),current))).error);expect(c.getSessionCalls).toBe(1);expect(c.invokeCalls).toBe(0);expect(armed).toBe(false);
  });
  it("P06 entered pending getSession sees retirement then restoration and never invokes",async()=>{
    const c=slot.current(),d=deferred();c.getSessionFactory=()=>d.promise;const api=callGuardedAssistantRuntimeBoxed(payload(),guard(c));
    c.current=false;d.resolve(sessionEnvelope(c));queueMicrotask(()=>{c.current=true;});empty((await errorOf(api)).error);expect(c.current).toBe(true);expect(c.getSessionCalls).toBe(1);expect(c.invokeCalls).toBe(0);
  });
  for (const [point,next,errorPath] of [
    ["auth:get","getSession:get",false],["getSession:get","getSession:call",false],["session.data:get","session:get",false],["session:get","token:get",false],
    ["token:get","functions:get",false],["functions:get","invoke:get",false],["invoke:get","invoke:call",false],["invoke.data:get","invoke.error:get",false],
    ["error.context:get","clone:get",true],["clone:get","clone:call",true],["json:get","json:call",true],["body.reason:get","status:get",true],
  ] as const) it(`P07 getter fence ${point} denies ${next}`,async()=>{
    const c=slot.current();if(errorPath)c.failure=denial(c,429,"QUOTA_EXCEEDED",undefined);
    c.hooks.set(point,()=>{c.current=false;queueMicrotask(()=>{c.current=true;});});empty((await errorOf(callGuardedAssistantRuntimeBoxed(payload(),guard(c)))).error);expect(c.trace).not.toContain(next);
  });
  it("P08 SDK thrown native rejection retains current identity without own then",async()=>{
    const c=slot.current(),p=rejected(new Error("entered SDK reason"));ownThen(c,p,"SDK-thrown",new Error("own then"),true);c.getSessionFactory=()=>{throw p;};
    expect((await errorOf(callGuardedAssistantRuntimeBoxed(payload(),guard(c)))).error).toBe(p);expect(c.ownThen["SDK-thrown"]).toBe(0);
  });
  it("P09 SDK thrown native rejection observed even when SDK retires before throw",async()=>{
    const c=slot.current(),p=rejected(new Error("entered SDK then retired"));ownThen(c,p,"SDK-retired",new Error("own then"),true);c.getSessionFactory=()=>{c.current=false;throw p;};
    empty((await errorOf(callGuardedAssistantRuntimeBoxed(payload(),guard(c)))).error);expect(c.ownThen["SDK-retired"]).toBe(0);expect(c.invokeCalls).toBe(0);
  });
  it("P10 second learnerContext getter retirement denies locale reread",async()=>{
    const c=slot.current(),p=payload();let parent=0,locale=0;const context={get locale(){locale++;return "en";}};
    Object.defineProperty(p,"learnerContext",{get(){parent++;if(parent===2)c.current=false;return context;}});
    empty((await errorOf(callGuardedAssistantRuntimeBoxed(p,guard(c)))).error);expect(parent).toBe(2);expect(locale).toBe(1);expect(c.invokeCalls).toBe(0);
  });
  it("P11 original locale reread chooses updated current auth copy",async()=>{
    const c=slot.current(),p=payload("en");c.token="";c.getSessionFactory=()=>{p.learnerContext.locale="ar-MSA";return native(sessionEnvelope(c));};
    expect((await errorOf(callGuardedAssistantRuntimeBoxed(p,guard(c)))).error).toMatchObject({message:getUiString("ar-MSA","assistant.panel.error.auth"),status:500});expect(c.invokeCalls).toBe(0);
  });
  it("P12 token primitive lookup retirement prevents its method and invoke entry",async()=>{
    const c=slot.current();let entered=0;c.token={get [Symbol.toPrimitive](){c.current=false;return function(){entered++;return "fixture";};}};
    empty((await errorOf(callGuardedAssistantRuntimeBoxed(payload(),guard(c)))).error);expect(entered).toBe(0);expect(c.invokeCalls).toBe(0);
  });
  it("P13 token string hint preserves receivers and toString before valueOf",async()=>{
    const c=slot.current(),token={get toString(){c.hit("token.toString:get");return function(this:unknown){c.receivers.push(this===token);c.hit("token.toString:call");return "fixture-coerced";};},get valueOf(){throw new Error("valueOf must not be reached");}};c.token=token;
    await callGuardedAssistantRuntimeBoxed(payload(),guard(c));expect(c.receivers.every(Boolean)).toBe(true);const options=c.lastArgs[1];if(!options||typeof options!=="object")throw new Error("missing invocation");expect(Reflect.get(options,"headers")).toEqual({Authorization:"Bearer fixture-coerced"});
  });
  for(const edge of ["getSession","invoke","json"] as const)it(`P14 native AWAIT ignores own then at ${edge}`,async()=>{
    const c=slot.current();const poison=new Error("raw native own then must not be read");
    if(edge==="getSession")c.getSessionFactory=()=>{const p=native(sessionEnvelope(c));ownThen(c,p,edge,poison,true);return p;};
    if(edge==="invoke")c.invokeFactory=()=>{const p=native(invokeEnvelope(c));ownThen(c,p,edge,poison,true);return p;};
    if(edge==="json")c.failure=denial(c,401,"UNAUTHORIZED",undefined,()=>{const p=native({error:"UNAUTHORIZED"});ownThen(c,p,edge,poison,true);return p;});
    if(edge==="json")expect((await errorOf(callGuardedAssistantRuntimeBoxed(payload(),guard(c)))).error).toMatchObject({message:getUiString("en","assistant.panel.error.auth")});else await callGuardedAssistantRuntimeBoxed(payload(),guard(c));
    expect(c.ownThen[edge]).toBe(0);
  });
  it("P15 native fulfilled envelope becoming thenable is not readopted",async()=>{
    const c=slot.current();let reads=0,entered=0,active=false;const base=sessionEnvelope(c),value={get then(){reads++;return active?function(){entered++;}:undefined;},get data(){return base.data;}};
    const p=native(value);active=true;c.getSessionFactory=()=>p;await callGuardedAssistantRuntimeBoxed(payload(),guard(c));expect(reads).toBe(1);expect(entered).toBe(0);
  });
  for(const edge of ["getSession","invoke","json","success"] as const)it(`P16 queued lazy ${edge} entry denied after getter`,async()=>{
    const c=slot.current();let entered=0;const lazy={get then(){queueMicrotask(()=>{c.current=false;});return function(){entered++;};}};
    if(edge==="getSession")c.getSessionFactory=()=>lazy;if(edge==="invoke")c.invokeFactory=()=>lazy;
    if(edge==="json")c.failure=denial(c,429,"QUOTA_EXCEEDED",undefined,()=>lazy);if(edge==="success")c.response=lazy;
    empty((await errorOf(callGuardedAssistantRuntimeBoxed(payload(),guard(c)))).error);expect(entered).toBe(0);if(edge==="getSession")expect(c.invokeCalls).toBe(0);
  });
  it("P17 first resolve locks pending nested result before late reject/throw",async()=>{
    const c=slot.current(),answer=reply();let calls=0;c.response={then(resolve:(v:unknown)=>unknown,reject:(e:unknown)=>unknown){resolve({then(next:(v:unknown)=>unknown){calls++;next(answer);}});reject(new Error("ignored late reject"));throw new Error("ignored late throw");}};
    expect((await callGuardedAssistantRuntimeBoxed(payload(),guard(c))).reply).toBe(answer);expect(calls).toBe(1);
  });
  it("P18 finite stateful self revisit is not an invented cycle error",async()=>{
    const c=slot.current(),answer=reply();let entries=0;const lazy={then(resolve:(v:unknown)=>unknown){entries++;resolve(entries===1?lazy:answer);}};c.response=lazy;
    expect((await callGuardedAssistantRuntimeBoxed(payload(),guard(c))).reply).toBe(answer);expect(entries).toBe(2);
  });
  it("P19 entered ignored derived native rejection is intrinsically observed",async()=>{
    const c=slot.current(),answer=reply();c.response={then(resolve:(v:unknown)=>unknown){resolve(answer);const p=rejected(new Error("ignored entered derived"));ownThen(c,p,"derived",new Error("derived then"),true);return p;}};
    expect((await callGuardedAssistantRuntimeBoxed(payload(),guard(c))).reply).toBe(answer);expect(c.ownThen.derived).toBe(0);
  });
  it("P20 success RETURN reads native own then and preserves thrown identity",async()=>{
    const c=slot.current(),poison=new Error("current return own then"),p=native(reply());ownThen(c,p,"success",poison,true);c.response=p;
    expect((await errorOf(callGuardedAssistantRuntimeBoxed(payload(),guard(c)))).error).toBe(poison);expect(c.ownThen.success).toBe(1);
  });
  it("P21 success native noncallable then preserves native object identity",async()=>{
    const c=slot.current(),p=native(reply());ownThen(c,p,"noncallable",0);c.response=p;
    expect((await callGuardedAssistantRuntimeBoxed(payload(),guard(c))).reply).toBe(p);expect(c.ownThen.noncallable).toBe(1);
  });
  it("P22 resolve(next native) keeps RETURN own-then semantics",async()=>{
    const c=slot.current(),p=native(reply());ownThen(c,p,"nested-native",undefined);c.response={then(resolve:(v:unknown)=>unknown){resolve(p);}};
    expect((await callGuardedAssistantRuntimeBoxed(payload(),guard(c))).reply).toBe(p);expect(c.ownThen["nested-native"]).toBe(1);
  });
  it("P23 genuine exported promise self-resolution remains a TypeError",async()=>{
    const c=slot.current();let api:Promise<unknown>|undefined;c.invokeFactory=()=>{c.response=api;return native(invokeEnvelope(c));};api=callGuardedAssistantRuntimeBoxed(payload(),guard(c));expect((await errorOf(api)).error).toBeInstanceOf(TypeError);
  });
  it.each([false,0,null,undefined])("P24 truthy lazy returning %j is not checked as raw falsy data again",async value=>{
    const c=slot.current();c.response={then(resolve:(v:unknown)=>unknown){resolve(value);}};expect((await callGuardedAssistantRuntimeBoxed(payload(),guard(c))).reply).toBe(value);
  });
  it("P25 raw falsy data still uses current connection copy",async()=>{const c=slot.current();c.response=0;expect((await errorOf(callGuardedAssistantRuntimeBoxed(payload(),guard(c)))).error).toMatchObject({message:getUiString("en","assistant.panel.error.connection")});});
  for(const locale of ["ar-EG","ar-MSA","ar-Gulf","en"] as const)for(const [label,status,code,reason,key] of [
    ["auth",401,"QUOTA_EXCEEDED","insufficient_grounding","assistant.panel.error.auth"],
    ["access",403,"AI_ACCESS_DENIED","card_scope_required","assistant.panel.error.access"],
    ["scope",429,"QUOTA_EXCEEDED","card_scope_invalid","assistant.panel.scope.open"],
    ["quota",429,"LIMIT_QUOTA_EXCEEDED", "insufficient_grounding","assistant.panel.error.quota"],
    ["grounding",500,"OTHER","insufficient_grounding","assistant.panel.error.grounding"],
    ["bare403",403,"OTHER",undefined,"assistant.panel.error.connection"],
  ] as const)it(`P26 current ${label} precedence and copy ${locale}`,async()=>{
    const c=slot.current();c.failure=denial(c,status,code,reason);expect((await errorOf(callGuardedAssistantRuntimeBoxed(payload(locale),guard(c)))).error).toMatchObject({message:getUiString(locale,key),status:500});
    expect(c.trace.filter(x=>x==="clone:get")).toHaveLength(2);expect(c.trace.filter(x=>x==="error.context:get")).toHaveLength(2);expect(c.trace.filter(x=>x==="status:get")).toHaveLength(1);expect(c.receivers.every(Boolean)).toBe(true);
  });
  it("P27 current reason getter failure retains already assigned code",async()=>{
    const c=slot.current();c.failure=denial(c,500,undefined,undefined,()=>native({get error(){return "UNAUTHORIZED";},get reason(){throw new Error("current reason read");}}));
    expect((await errorOf(callGuardedAssistantRuntimeBoxed(payload(),guard(c)))).error).toMatchObject({message:getUiString("en","assistant.panel.error.auth")});
  });
  it("P28 second context status getter remains outside parse catch",async()=>{
    const c=slot.current(),poison=new Error("current outside status");let reads=0;const first={clone(){return{json(){return native({error:"OTHER"});}}}};
    c.failure={get context(){reads++;if(reads===2)throw poison;return first;}};expect((await errorOf(callGuardedAssistantRuntimeBoxed(payload(),guard(c)))).error).toBe(poison);expect(reads).toBe(2);
  });
  it("P29 nonstring includes failure is not swallowed by status429",async()=>{const c=slot.current();c.failure=denial(c,429,0,undefined);expect((await errorOf(callGuardedAssistantRuntimeBoxed(payload(),guard(c)))).error).toBeInstanceOf(TypeError);});
  it("P30 clone result stays synchronous and its then is not adopted",async()=>{
    const c=slot.current();let then=0;const clone={get then(){then++;throw new Error("clone was incorrectly awaited");},json(){return native({error:"UNAUTHORIZED"});}};
    c.failure={context:{clone(){return clone;},status:401}};expect((await errorOf(callGuardedAssistantRuntimeBoxed(payload(),guard(c)))).error).toMatchObject({message:getUiString("en","assistant.panel.error.auth")});expect(then).toBe(0);
  });
  it("P31 second clone getter is not collapsed into first",async()=>{
    const c=slot.current();let reads=0,calls=0;const ctx={get clone(){reads++;return reads===1?function(){calls++;}:0;},status:401};c.failure={context:ctx};
    expect((await errorOf(callGuardedAssistantRuntimeBoxed(payload(),guard(c)))).error).toMatchObject({message:getUiString("en","assistant.panel.error.auth")});expect(reads).toBe(2);expect(calls).toBe(0);
  });
  it("P32 entered json retirement cannot fall through to stale status/copy",async()=>{
    const c=slot.current(),d=deferred();c.failure=denial(c,401,"UNAUTHORIZED",undefined,()=>{c.current=false;return d.promise;});empty((await errorOf(callGuardedAssistantRuntimeBoxed(payload(),guard(c)))).error);expect(c.trace).toContain("json:call");expect(c.trace).not.toContain("status:get");d.reject(new Error("already entered json rejection"));
  });
  it("P33 already entered invoke1 is not falsely claimed undone",async()=>{
    const c=slot.current(),d=deferred();c.invokeFactory=()=>{c.current=false;return d.promise;};empty((await errorOf(callGuardedAssistantRuntimeBoxed(payload(),guard(c)))).error);expect(c.invokeCalls).toBe(1);d.reject(new Error("already entered invoke rejection"));
  });
  it("P34 current SDK failure remains original, not empty retirement",async()=>{
    const c=slot.current(),error=new Error("genuine current native failure");c.invokeFactory=()=>rejected(error);expect((await errorOf(callGuardedAssistantRuntimeBoxed(payload(),guard(c)))).error).toBe(error);expect(c.current).toBe(true);
  });
});

function mountCurrent(c:CaseState) { return render(<Profiler id="r37-real" onRender={()=>{c.commits++;}}><AssistantPanel compact /></Profiler>); }
function submit(view:ReturnType<typeof render>,query:string): void {
  const input=view.container.querySelector("textarea"),form=view.container.querySelector("form");if(!input||!form)throw new Error("Actual accessible assistant form missing");fireEvent.change(input,{target:{value:query}});fireEvent.submit(form);
}
describe("R37 actual AI/common connection with public provider fixtures",()=>{
  it("U01 current form uses real Markdown citations and owned history",async()=>{
    const c=slot.current(),view=mountCurrent(c);submit(view,"fixture current form");await waitFor(()=>expect(screen.getByText("owned answer").tagName).toBe("STRONG"));
    expect(screen.getByText("Owned heading").tagName).toBe("H3");expect(screen.getByText("code").tagName).toBe("CODE");
    const link=screen.getByRole("link",{name:/Owned source/});expect(link.getAttribute("href")).toBe("/learn/intro/fixture-step?locale=en");
    expect(c.invokeCalls).toBe(1);expect(c.storageOps.some(x=>x.op==="set"&&x.key.includes(userA.id))).toBe(true);expect(c.storageOps.every(x=>x.op!=="remove")).toBe(true);
  });
  for(const kind of ["actor","loading"] as const)it(`U02 frozen generation pure predicate observes ${kind} invalidity restored before render`,async()=>{
    const c=slot.current();let atEntry=0;c.getSessionFactory=()=>{atEntry=c.commits;c.transient=kind;return native(sessionEnvelope(c));};const view=mountCurrent(c);submit(view,"fixture stale form");
    await act(async()=>{await pulse();await pulse();});expect(c.getSessionCalls).toBe(1);expect(c.invokeCalls).toBe(0);expect(c.transient).toBe(null);expect(c.transientCommits).toEqual([atEntry]);expect(Object.isFrozen(c.authPublic)).toBe(true);expect(Object.isFrozen(c.generation)).toBe(true);expect(c.authPublic.isAuthGenerationCurrent(c.generation)).toBe(true);expect(c.storageOps.filter(x=>x.op==="set")).toHaveLength(0);
    // Exhaustive accessor traces now include the real owned SDK helper. Allow
    // its instrumented checks to settle; this test asserts ownership, not latency.
    cleanup();c.generation=Object.freeze({value:18});c.getSessionFactory=()=>native(sessionEnvelope(c));const fresh=mountCurrent(c);submit(fresh,"fixture fresh owner");await waitFor(()=>expect(screen.getByText("owned answer")).toBeDefined(), { timeout: 10_000 });expect(c.invokeCalls).toBe(1);
  }, 30_000);
  it("U03 genuine current failure remains visible and retry can answer",async()=>{
    const c=slot.current();let fail=true;c.invokeFactory=()=>fail?rejected(new Error("current transport failure")):native(invokeEnvelope(c));const view=mountCurrent(c);submit(view,"fixture retry");
    await waitFor(()=>expect(screen.getByText(getUiString("en","assistant.panel.error.connection"))).toBeDefined());expect(c.invokeCalls).toBe(1);
    fail=false;submit(view,"fixture retry again");await waitFor(()=>expect(screen.getByText("owned answer")).toBeDefined(), { timeout: 10_000 });expect(c.invokeCalls).toBe(2);
  }, 30_000);
  it("U04 truthy ok:false preserves actual caller503 without invented success",async()=>{
    const c=slot.current();c.response={...reply(),ok:false};const view=mountCurrent(c);submit(view,"fixture not-ok");await act(async()=>{await pulse();await pulse();});expect(c.invokeCalls).toBe(1);expect(screen.queryByText("owned answer")).toBeNull();expect(c.storageOps.filter(x=>x.op==="set")).toHaveLength(0);
  }, 30_000);
});
