import { supabase } from "@/integrations/supabase/client";
import type { RagPackageLocale } from "@/lib/locale-lessons/types";
import { validateRuntimeLocale } from "@/lib/rag/runtime-locale";
import { getUiString } from "@/lib/locale/ui-strings";
import { AssistantRequestError } from "@/lib/card-assistant/errors";
export type AssistantCitation = { citationId?: string; chunkId?: string; lessonId: string; title: string; productionRoute: string | null; excerpt: string };

/**
 * Assistant Runtime — frontend service.
 *
 * Calls the `assistant-runtime` Edge Function. No API keys are sent from the
 * frontend — all future model providers are reached from the backend only.
 */

export interface AssistantRuntimeRequestPayload {
  query: string;
  conversationHistory?: Array<{ question: string; answer: string }>;
  learnerContext: {
    locale: RagPackageLocale;
    currentPath?: string | null;
    currentModule?: string | null;
    currentLesson?: string | null;
    currentPathTitle?: string | null;
    currentModuleTitle?: string | null;
    currentLessonTitle?: string | null;
    completedLessonsCount?: number | null;
    totalLessonsCount?: number | null;
    nextLessonTitle?: string | null;
    currentMission?: {
      intro?: string | null;
      prompt?: string | null;
    } | null;
  };
}

export interface AssistantRuntimeResponsePayload {
  ok: boolean;
  runtime: "connected" | "disconnected";
  receivedQuery: string;
  retrievalCount: number;
  contextDetected: boolean;
  learnerContext: {
    currentPath: string | null;
    currentModule: string | null;
    currentLesson: string | null;
  };
  message: string;
  ts: string;
  answer?: string;
  citations?: AssistantCitation[];
}

function assertCanonicalRequestLocale(locale: unknown): asserts locale is RagPackageLocale {
  const result = validateRuntimeLocale(locale);
  if (!result.ok) {
    throw new Error(`Invalid assistant runtime locale: ${result.reason}`);
  }
}

export async function callAssistantRuntime(
  payload: AssistantRuntimeRequestPayload,
): Promise<AssistantRuntimeResponsePayload> {
  assertCanonicalRequestLocale(payload.learnerContext?.locale);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;
  const locale = payload.learnerContext.locale;
  if (!accessToken) {
    throw new AssistantRequestError(getUiString(locale, "assistant.panel.error.auth"));
  }

  const { data, error } = await supabase.functions.invoke<AssistantRuntimeResponsePayload>(
    "assistant-runtime",
    {
      body: payload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (error) {
    // Expected denials (no AI access / quota) come back as non-2xx with a JSON body.
    let code: string | undefined;
    let reason: string | undefined;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.clone === "function") {
        const body = (await ctx.clone().json()) as { error?: string; reason?: string };
        code = body?.error;
        reason = body?.reason;
      }
    } catch {
      /* body not JSON — fall through */
    }
    const status = (error as { context?: Response }).context?.status;
    if (status === 401 || code === "UNAUTHORIZED") {
      throw new AssistantRequestError(getUiString(locale, "assistant.panel.error.auth"));
    }
    if (code === "AI_ACCESS_DENIED") {
      throw new AssistantRequestError(getUiString(locale, "assistant.panel.error.access"));
    }
    if (reason === "card_scope_required" || reason === "card_scope_invalid") {
      throw new AssistantRequestError(getUiString(locale, "assistant.panel.scope.open"));
    }
    if (code?.includes("QUOTA_EXCEEDED") || status === 429) {
      throw new AssistantRequestError(getUiString(locale, "assistant.panel.error.quota"));
    }
    if (reason === "insufficient_grounding") {
      throw new AssistantRequestError(getUiString(locale, "assistant.panel.error.grounding"));
    }
    throw new AssistantRequestError(getUiString(locale, "assistant.panel.error.connection"));
  }
  if (!data) {
    throw new AssistantRequestError(getUiString(locale, "assistant.panel.error.connection"));
  }
  return data;
}

/** Local ownership only. The legacy one-argument route above remains unprotected. */
export type AssistantRuntimeOwnedResult = Readonly<{ reply: AssistantRuntimeResponsePayload }>;
type RuntimeValueBox<T> = Readonly<{ value: T }>;
type RuntimeEntered<T> = { raw: T | PromiseLike<T>; native: Promise<RuntimeValueBox<T>> | null };
const runtimePromise = Promise;
const runtimeThen = Promise.prototype.then;
const runtimeCall = Function.prototype.call;
const runtimePrototype = Promise.prototype;
const runtimeRetired = Symbol("retired assistant runtime call");

function runtimeBox<T>(value: T): RuntimeValueBox<T> {
  const box = { value };
  Object.setPrototypeOf(box, null);
  return Object.freeze(box);
}
const runtimeVoid = runtimeBox(undefined);
function runtimeObject(value: unknown): value is object {
  return value !== null && (typeof value === "object" || typeof value === "function");
}
function runtimeThenable<T>(value: T | PromiseLike<T>, then: unknown): value is PromiseLike<T> {
  return typeof then === "function";
}
function runtimeProperty(value: unknown, key: PropertyKey): unknown {
  if (value === null || value === undefined) {
    throw new TypeError(`Cannot read properties of ${value} (reading '${String(key)}')`);
  }
  return Reflect.get(Object(value), key);
}
function runtimeApply(method: unknown, receiver: unknown, args: readonly unknown[]): unknown {
  // Borrow the intrinsic call without looking up a foreign .call/.apply/.bind.
  return Reflect.apply(runtimeCall, method, [receiver, ...args]);
}

function runtimeOwnership(isCurrent: () => unknown) {
  let retired = false;
  let checking = false;
  let returnOwner: object | null = null;
  const observed = new WeakSet<object>();

  // Success is the genuine intrinsic Promise brand check. Prototype inspection
  // on failure only refuses a suspicious native-shaped value; it is not a brand
  // proof. Hostile constructors/species/proxies/cross-realm/global mutations are
  // outside the admitted domain. A failed attachment is never called observed.
  function nativeShaped(value: object): boolean {
    const visited = new Set<object>();
    let next: object | null = value;
    while (next !== null) {
      if (next === runtimePrototype) return true;
      if (visited.has(next)) return true;
      visited.add(next);
      next = Reflect.getPrototypeOf(next);
    }
    return false;
  }
  function observe(value: unknown): void {
    if (!runtimeObject(value) || observed.has(value)) return;
    observed.add(value);
    try {
      void Reflect.apply(runtimeThen, value, [() => runtimeVoid, (error: unknown) => {
        // Observation callbacks never feed a foreign value into their derived
        // promise. Cyclic rejection reasons stop at the per-call seen marker.
        try { observe(error); } catch { /* Unsupported observer attachment; no proof claimed. */ }
        return runtimeVoid;
      }]);
    } catch (error) {
      observed.delete(value);
      if (nativeShaped(value)) throw error;
    }
  }
  function check(): void {
    if (retired) throw runtimeRetired;
    if (checking) { retired = true;throw runtimeRetired; }
    checking = true;
    let answer: unknown;
    try { answer = isCurrent();observe(answer); }
    catch (error) {
      try { observe(error); } finally { retired = true; }
    } finally { checking = false; }
    if (answer !== true) retired = true;
    if (retired) throw runtimeRetired;
  }
  function read<T>(get: () => T): T {
    check();
    let value: T;
    try { value = get(); }
    catch (error) { observe(error);check();throw error; }
    observe(value);check();return value;
  }
  function capture<T>(get: () => T | PromiseLike<T>): RuntimeEntered<T> {
    check();
    let raw: T | PromiseLike<T>;
    try { raw = get(); }
    catch (error) { observe(error);check();throw error; }
    let native: Promise<RuntimeValueBox<T>> | null = null;
    if (runtimeObject(raw)) {
      // This single entered record serves both eager rejection observation and
      // subsequent native Await. No observer-then-adopter duplicate attachment.
      let accept: (value: RuntimeValueBox<T>) => void = () => {};
      let decline: (reason: unknown) => void = () => {};
      const pending = new runtimePromise<RuntimeValueBox<T>>((resolve, reject) => { accept = resolve;decline = reject; });
      observe(pending);
      observed.add(raw);
      try {
        const derived: unknown = Reflect.apply(runtimeThen, raw, [(next: T) => {
          try { observe(next);check();accept(runtimeBox(next)); }
          catch (error) { decline(error); }
          return runtimeVoid;
        }, (error: unknown) => {
          try { observe(error);check();decline(error); }
          catch (retirement) { decline(retirement); }
          return runtimeVoid;
        }]);
        native = pending;observe(derived);
      } catch (error) {
        observed.delete(raw);
        if (nativeShaped(raw)) { observe(error);check();throw error; }
      }
    }
    check();return { raw, native };
  }
  function text(value: unknown): string {
    check();
    let primitive: unknown = value;
    if (runtimeObject(value)) {
      const exotic = read(() => Reflect.get(value, Symbol.toPrimitive));
      if (exotic !== null && exotic !== undefined) {
        primitive = read(() => runtimeApply(exotic, value, ["string"]));
        if (runtimeObject(primitive)) throw new TypeError("Cannot convert object to primitive value");
      } else {
        let converted = false;
        // Template interpolation uses the string hint: toString before valueOf.
        for (const name of ["toString", "valueOf"]) {
          const method = read(() => Reflect.get(value, name));
          if (typeof method !== "function") continue;
          const next = read(() => runtimeApply(method, value, []));
          if (!runtimeObject(next)) { primitive = next;converted = true;break; }
        }
        if (!converted) throw new TypeError("Cannot convert object to primitive value");
      }
    }
    // Unlike String(symbol), this preserves template interpolation's TypeError.
    return read(() => `${primitive}`);
  }
  function returnResolution<T>(raw: T | PromiseLike<T>, self: object | null = null): Promise<RuntimeValueBox<T>> {
    const pending = new runtimePromise<RuntimeValueBox<T>>((resolve, reject) => {
      function fail(error: unknown): void {
        try { observe(error);check();reject(error); }
        catch (retirement) { reject(retirement); }
      }
      function enter(value: T | PromiseLike<T>): void {
        try {
          observe(value);check();
          // Only genuine final-promise self-resolution, never a repeated-object
          // thenable/cycle budget. Await's temporary resolving promise differs.
          if (self !== null && value === self) throw new TypeError("Chaining cycle detected for promise #<Promise>");
          const then: unknown = runtimeObject(value) ? read(() => Reflect.get(value, "then")) : undefined;
          if (!runtimeThenable(value, then)) { check();resolve(runtimeBox(value));return; }
          queueMicrotask(() => {
            let settled = false;
            try {
              check();
              const returned = runtimeApply(then, value, [(next: T | PromiseLike<T>) => {
                try {
                  observe(next);
                  if (settled) return runtimeVoid;
                  settled = true;check();enter(next);
                } catch (error) { fail(error); }
                return runtimeVoid;
              }, (error: unknown) => {
                try {
                  observe(error);
                  if (settled) return runtimeVoid;
                  settled = true;fail(error);
                } catch (retirement) { reject(retirement); }
                return runtimeVoid;
              }]);
              observe(returned);check();
            } catch (error) {
              try { observe(error);check(); }
              catch (retirement) { reject(retirement);return; }
              if (!settled) { settled = true;fail(error); }
            }
          });
        } catch (error) { fail(error); }
      }
      enter(raw);
    });
    observe(pending);return pending;
  }
  function awaitEntered<T>(entry: RuntimeEntered<T>): Promise<RuntimeValueBox<T>> {
    check();
    const raw = entry.raw;
    // Native Await's constructor optimization does NOT apply to return data or
    // resolve(next) callbacks. Those always use returnResolution, even for native.
    if (entry.native && runtimeObject(raw) && read(() => Reflect.get(raw, "constructor")) === runtimePromise) {
      return entry.native;
    }
    return returnResolution(raw);
  }
  function resolveReturn<T>(raw: T | PromiseLike<T>): Promise<RuntimeValueBox<T>> {
    return returnResolution(raw, returnOwner);
  }
  return { check, read, capture, text, awaitEntered, resolveReturn, observe,
    setReturnOwner: (value: object) => { returnOwner = value; }, isRetired: () => retired };
}

/**
 * Mandatory local action ownership; never an authorization/server-session grant.
 * Ordinary native constructor/species/intrinsic integrity is the bounded domain.
 */
export function callGuardedAssistantRuntimeBoxed(
  payload: AssistantRuntimeRequestPayload,
  isCurrent: () => unknown,
): Promise<AssistantRuntimeOwnedResult> {
  const owner = runtimeOwnership(isCurrent);
  let accept: (value: AssistantRuntimeOwnedResult) => void = () => {};
  let decline: (reason: unknown) => void = () => {};
  const exported = new runtimePromise<AssistantRuntimeOwnedResult>((resolve, reject) => { accept = resolve;decline = reject; });
  owner.setReturnOwner(exported);owner.observe(exported);
  function failExport(error: unknown): void {
    let failure = error;
    try { owner.observe(error);owner.check(); }
    catch (caught) { failure = owner.isRetired() ? new AssistantRequestError("") : caught; }
    decline(failure);
  }
  const running = run();owner.observe(running);
  const forwarded: unknown = Reflect.apply(runtimeThen, running, [(result: AssistantRuntimeOwnedResult) => {
    try { owner.check();accept(result); }
    catch (error) { failExport(error); }
    return runtimeVoid;
  }, (error: unknown) => {
    failExport(error);
    return runtimeVoid;
  }]);
  owner.observe(forwarded);return exported;
  async function run(): Promise<AssistantRuntimeOwnedResult> {
  try {
    const initialContext = owner.read(() => payload.learnerContext);
    const initialLocale = owner.read(() => initialContext?.locale);
    owner.read(() => assertCanonicalRequestLocale(initialLocale));
    const authClient = owner.read(() => supabase);
    const auth = owner.read(() => authClient.auth);
    const getSession = owner.read(() => auth.getSession);
    type SessionResult = Awaited<ReturnType<typeof getSession>>;
    const sessionEntry = owner.capture<SessionResult>(() => Reflect.apply<typeof auth, [], ReturnType<typeof getSession>>(getSession, auth, []));
    const sessionResult = await owner.awaitEntered(sessionEntry);owner.check();
    const sessionData = owner.read(() => sessionResult.value.data);
    const session = owner.read(() => sessionData.session);
    const accessToken = owner.read(() => session?.access_token);
    const currentContext = owner.read(() => payload.learnerContext);
    const locale = owner.read(() => currentContext.locale);
    if (!accessToken) throw new AssistantRequestError(owner.read(() => getUiString(locale, "assistant.panel.error.auth")));

    const functionsClient = owner.read(() => supabase);
    const functions = owner.read(() => functionsClient.functions);
    const invoke = owner.read(() => functions.invoke<AssistantRuntimeResponsePayload>);
    const tokenText = owner.text(accessToken);
    const authorization = owner.read(() => `Bearer ${tokenText}`);
    const args: Parameters<typeof invoke> = ["assistant-runtime", { body: payload, headers: { Authorization: authorization } }];
    type InvokeResult = Awaited<ReturnType<typeof invoke>>;
    const invokeEntry = owner.capture<InvokeResult>(() => Reflect.apply<typeof functions, Parameters<typeof invoke>, ReturnType<typeof invoke>>(invoke, functions, args));
    const result = await owner.awaitEntered(invokeEntry);owner.check();
    const data = owner.read(() => result.value.data);
    const error = owner.read(() => result.value.error);
    if (error) {
      let code: unknown;
      let reason: unknown;
      try {
        const ctx = owner.read(() => runtimeProperty(error, "context"));
        if (ctx) {
          const firstClone = owner.read(() => runtimeProperty(ctx, "clone"));
          if (typeof firstClone === "function") {
            const secondClone = owner.read(() => runtimeProperty(ctx, "clone"));
            const cloned = owner.read(() => runtimeApply(secondClone, ctx, []));
            const json = owner.read(() => runtimeProperty(cloned, "json"));
            const jsonEntry = owner.capture<unknown>(() => runtimeApply(json, cloned, []));
            const parsed = await owner.awaitEntered(jsonEntry);owner.check();
            code = parsed.value == null ? undefined : owner.read(() => runtimeProperty(parsed.value, "error"));
            reason = parsed.value == null ? undefined : owner.read(() => runtimeProperty(parsed.value, "reason"));
          }
        }
      } catch {
        owner.check(); // Current parse failures fall through; retirement never does.
      }
      const statusContext = owner.read(() => runtimeProperty(error, "context"));
      const status = statusContext == null ? undefined : owner.read(() => runtimeProperty(statusContext, "status"));
      if (status === 401 || code === "UNAUTHORIZED") {
        throw new AssistantRequestError(owner.read(() => getUiString(locale, "assistant.panel.error.auth")));
      }
      if (code === "AI_ACCESS_DENIED") {
        throw new AssistantRequestError(owner.read(() => getUiString(locale, "assistant.panel.error.access")));
      }
      if (reason === "card_scope_required" || reason === "card_scope_invalid") {
        throw new AssistantRequestError(owner.read(() => getUiString(locale, "assistant.panel.scope.open")));
      }
      let quota: unknown;
      if (code != null) {
        const includes = owner.read(() => runtimeProperty(code, "includes"));
        quota = owner.read(() => runtimeApply(includes, code, ["QUOTA_EXCEEDED"]));
      }
      if (quota || status === 429) {
        throw new AssistantRequestError(owner.read(() => getUiString(locale, "assistant.panel.error.quota")));
      }
      if (reason === "insufficient_grounding") {
        throw new AssistantRequestError(owner.read(() => getUiString(locale, "assistant.panel.error.grounding")));
      }
      throw new AssistantRequestError(owner.read(() => getUiString(locale, "assistant.panel.error.connection")));
    }
    if (!data) throw new AssistantRequestError(owner.read(() => getUiString(locale, "assistant.panel.error.connection")));
    const adopted = await owner.resolveReturn(data);owner.check();
    const replyBox = { reply: adopted.value };
    Object.setPrototypeOf(replyBox, null);
    return Object.freeze(replyBox);
  } catch (error) {
    try { owner.observe(error);owner.check(); }
    catch (caught) {
      if (owner.isRetired()) throw new AssistantRequestError("");
      throw caught;
    }
    throw error;
  }
}
}
