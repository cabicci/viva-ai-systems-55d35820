import { useLayoutEffect, useRef, useState, useId, type FormEvent } from "react";
import { useAuth, type AuthGeneration } from "@/lib/auth-context";
import { type AssistantAdapter, type AssistantCitation, type AssistantScope } from "@/lib/card-assistant/types";
import { getUiString } from "@/lib/locale/ui-strings";
import { historyKey, type ConversationTurn } from "@/lib/card-assistant/history";
import { AssistantAnswer } from "./AssistantAnswer";
import { AssistantRequestError } from "@/lib/card-assistant/errors";

export type AssistantConversationPanelProps = {
  scope: AssistantScope;
  accountId?: string | null;
  cardTitle?: string;
  ask: AssistantAdapter;
  disabledReason?: string;
  onCitation?: (citation: AssistantCitation) => void;
  compact?: boolean;
};

type Current = () => boolean;
type Selected = Readonly<{ scope: Readonly<AssistantScope> | null; account: string | null;
  disabled: string | undefined; user: string | null; loading: unknown; generation: AuthGeneration | null;
  predicate: ((generation: AuthGeneration) => boolean) | null; ready: boolean }>;
type Frame = { selected: Selected; key: number; retired: boolean; checking: boolean; current: Current };
type Life = { retired: boolean };
type Action = { life: Life; pending: boolean };
type View = { owner: Life | null; query: string; busy: boolean; error: string; turns: readonly ConversationTurn[] };
const stale = Symbol("retired conversation");
const nativeThen = Promise.prototype.then;

function own(value: unknown, key: string): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor && "value" in descriptor ? descriptor.value : undefined;
}
function select(props: AssistantConversationPanelProps, auth: ReturnType<typeof useAuth>): Selected {
  let scope: Readonly<AssistantScope> | null = null, account: string | null = null, disabled: string | undefined;
  let user: string | null = null, generation: AuthGeneration | null = null, predicate: Selected["predicate"] = null;
  let loading: unknown = true, malformed = false;
  try {
    const area = own(props.scope, "area"), cardId = own(props.scope, "cardId"), stepId = own(props.scope, "stepId");
    const locale = own(props.scope, "locale"), profileId = own(props.scope, "profileId");
    if ((area === "ai" || area === "kids" || area === "technical" || area === "academic") && typeof cardId === "string" && cardId &&
      (stepId === undefined || typeof stepId === "string") && (profileId === undefined || typeof profileId === "string") &&
      (locale === "en" || locale === "ar-EG" || locale === "ar-MSA" || locale === "ar-Gulf")) {
      scope = Object.freeze({ area, cardId, ...(stepId === undefined ? {} : { stepId }), locale, ...(profileId === undefined ? {} : { profileId }) });
    }
    account = typeof props.accountId === "string" && props.accountId ? props.accountId : null;
    if (props.disabledReason !== undefined && typeof props.disabledReason !== "string") malformed = true;
    else disabled = props.disabledReason;
    const actualUser = auth.user;observeEager(actualUser);
    const id = actualUser?.id;observeEager(id);user = typeof id === "string" && id ? id : null;
    loading = auth.loading;observeEager(loading);
    const captured = auth.authGeneration;observeEager(captured);
    const value = captured?.value;observeEager(value);
    if (captured && typeof captured === "object" && !Array.isArray(captured) && Object.isFrozen(captured) &&
      typeof value === "number" && Number.isSafeInteger(value)) generation = captured;
    const check = auth.isAuthGenerationCurrent;observeEager(check);
    if (typeof check === "function") predicate = check;
  } catch (error) { observeEager(error);malformed = true; }
  return Object.freeze({ scope, account, disabled, user, loading, generation, predicate,
    ready: !malformed && !!scope && !!account && account === user && loading === false && !!generation && !!predicate && !disabled });
}
function same(a: Selected, b: Selected): boolean {
  return a.account === b.account && a.user === b.user && a.loading === b.loading && a.generation === b.generation &&
    a.disabled === b.disabled && a.ready === b.ready && a.scope?.area === b.scope?.area && a.scope?.cardId === b.scope?.cardId &&
    a.scope?.stepId === b.scope?.stepId && a.scope?.profileId === b.scope?.profileId && a.scope?.locale === b.scope?.locale;
}

function liveAuth(auth: ReturnType<typeof useAuth>, selected: Selected, owner: Current): boolean {
  const captured = selected.generation;
  if (!captured || !selected.user || selected.account !== selected.user || !owner()) return false;
  function read<T>(get: () => T): T {
    if (!owner()) throw stale;
    let value: T;
    try { value = get(); } catch (error) { observeEager(error);throw error; }
    observeEager(value);
    if (!owner()) throw stale;
    return value;
  }
  function actor(): boolean {
    const user = read(() => auth.user);
    const id = read(() => user?.id);
    return typeof id === "string" && id === selected.user && id === selected.account;
  }
  function state(): boolean {
    if (!actor()) return false;
    const loading = read(() => auth.loading);
    if (!actor() || loading !== false) return false;
    const generation = read(() => auth.authGeneration);
    if (!actor() || generation !== captured) return false;
    const afterLoading = read(() => auth.loading);
    return actor() && afterLoading === false && read(() => auth.authGeneration) === captured && actor();
  }
  try {
    if (!state()) return false;
    const value = read(() => captured.value);
    if (!Number.isSafeInteger(value) || !Object.isFrozen(captured) || !state()) return false;
    const predicate = read(() => auth.isAuthGenerationCurrent);
    if (!state() || typeof predicate !== "function") return false;
    const answer: unknown = read(() => Reflect.apply(predicate, auth, [captured]));
    return answer === true && state() && owner();
  } catch (error) { observeEager(error);return false; }
}


/** Local equality/lifetime fences only; adapters still own server access and grounding. */
export function AssistantConversationPanel(props: AssistantConversationPanelProps) {
  const auth = useAuth();
  const actualAuth = useRef(auth);actualAuth.current = auth;
  const gate = useRef<Selected | null>(null), frame = useRef<Frame | null>(null);
  const selected = select(props, auth);gate.current = selected;
  if (!frame.current || frame.current.retired || !same(frame.current.selected, selected)) {
    if (frame.current) frame.current.retired = true;
    const next: Frame = { selected, key: (frame.current?.key ?? 0) + 1, retired: false, checking: false, current: () => {
      const observed = gate.current;
      const owner = () => frame.current === next && !next.retired && gate.current === observed &&
        !!observed && observed.ready && same(next.selected, observed);
      // Reentrant checks cannot temporarily admit a nested callback. Once an
      // invalid owner is observed, restoring its fields cannot revive it.
      if (next.checking || !owner()) { next.retired = true;return false; }
      next.checking = true;
      try {
        if (!liveAuth(actualAuth.current, next.selected, owner) || !owner()) { next.retired = true;return false; }
        return true;
      } catch (error) { observeEager(error);next.retired = true;return false; }
      finally { next.checking = false; }
    } };
    frame.current = next;
  }

  // This key is private React mount identity, never serialized or a permission epoch.
  return <Conversation {...props} key={frame.current.key} frame={frame.current} />;
}

function field(value: unknown, key: PropertyKey, current: Current): unknown {
  if (!current()) throw stale;
  if (!value || (typeof value !== "object" && typeof value !== "function")) return undefined;
  let result: unknown;
  try { result = Reflect.get(value, key); } catch (error) { observeEager(error);throw error; }
  observeEager(result);
  if (!current()) throw stale;
  return result;
}
function citations(value: unknown, current: Current): AssistantCitation[] | null {
  if (!Array.isArray(value)) return null;
  const length = field(value, "length", current);
  if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || length > 12) return null;
  const result: AssistantCitation[] = [];
  for (let index = 0; index < length; index++) {
    const item = field(value, index, current);
    const id = field(item, "id", current), label = field(item, "label", current);
    const stepId = field(item, "stepId", current), sourceId = field(item, "sourceId", current), href = field(item, "href", current);
    if (typeof id !== "string" || typeof label !== "string" || typeof stepId !== "string" || typeof sourceId !== "string" ||
      [id, label, stepId, sourceId].some(text => text.length > 500) || (href !== undefined && (typeof href !== "string" || href.length > 2000))) return null;
    result.push(Object.freeze({ id, label, stepId, sourceId, ...(href === undefined ? {} : { href }) }));
  }
  return Object.freeze(result) as unknown as AssistantCitation[];
}

// Preserve the real historyKey namespace, JSON format and readHistory/writeHistory
// limits. Those helpers do not accept a currentness guard; fence their individual
// storage/parser operations here so retirement during argument preparation cannot
// enter a later getItem/setItem/removeItem. Tests use the unchanged real helpers.
function loadHistory(key: string | null, current: Current): readonly ConversationTurn[] {
  if (!key || typeof window === "undefined" || !current()) return [];
  try {
    const storage = window.localStorage;observeEager(storage);if (!current()) return [];
    const get = storage.getItem;observeEager(get);if (!current()) return [];
    const raw: unknown = Reflect.apply(get, storage, [key]);observeEager(raw);if (!current() || (raw !== null && typeof raw !== "string")) return [];
    const parse = field(JSON, "parse", current);if (typeof parse !== "function" || !current()) return [];
    const parsed: unknown = Reflect.apply(parse, JSON, [raw ?? "[]"]);observeEager(parsed);if (!current() || !Array.isArray(parsed)) return [];
    const length = field(parsed, "length", current);if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || length > 20) return [];
    const result: ConversationTurn[] = [];
    for (let index = 0; index < length; index++) {
      const row = field(parsed, index, current), question = field(row, "question", current), answer = field(row, "answer", current);
      if (typeof question !== "string" || question.length > 1500 || typeof answer !== "string" || answer.length > 16000) continue;
      const copied = citations(field(row, "citations", current), current);
      if (copied) result.push(Object.freeze({ question, answer, citations: copied }));
    }
    return Object.freeze(result);
  } catch (error) { observeEager(error);return []; }
}
function saveHistory(key: string | null, turns: readonly ConversationTurn[], current: Current): void {
  if (!key || typeof window === "undefined" || !current()) return;
  try {
    let raw: string | null = null;
    if (turns.length) {
      const stringify = field(JSON, "stringify", current);if (typeof stringify !== "function" || !current()) return;
      const encoded: unknown = Reflect.apply(stringify, JSON, [turns.slice(-20)]);observeEager(encoded);if (!current() || typeof encoded !== "string") return;raw = encoded;
    }
    const storage = window.localStorage;observeEager(storage);if (!current()) return;
    const method = raw === null ? storage.removeItem : storage.setItem;observeEager(method);if (!current()) return;
    observeEager(Reflect.apply(method, storage, raw === null ? [key] : [key, raw]));
  } catch (error) { observeEager(error);/* A current in-memory conversation still works without device storage. */ }
}
function observeEager(value: unknown): void {
  // Intrinsic native/derived Promise observation never calls a lazy .then getter.
  try { void Reflect.apply(nativeThen, value, [() => {}, () => {}]); } catch { /* Not a native Promise. */ }
}
function adopt(value: unknown, current: Current): Promise<{ value: unknown } | null> {
  return new Promise((resolve, reject) => {
    const seen = new Set<unknown>();
    function enter(raw: unknown) {
      observeEager(raw);
      if (!current()) { resolve(null);return; }
      if (seen.has(raw)) { reject(new TypeError("Cyclic assistant result"));return; }
      try {
        const derived: unknown = Reflect.apply(nativeThen, raw, [(next: unknown) => enter(next),
          (error: unknown) => { observeEager(error);reject(error); }]);
        seen.add(raw);observeEager(derived);return;
      } catch (error) { observeEager(error);if (raw instanceof Promise) { reject(error);return; } }
      try {
        const then = field(raw, "then", current);
        if (!current()) { resolve(null);return; }
        if (typeof then !== "function") { resolve(Object.assign(Object.create(null), { value: raw }));return; }
        if (seen.has(raw)) { reject(new TypeError("Cyclic assistant result"));return; }seen.add(raw);
        queueMicrotask(() => {
          if (!current()) { observeEager(raw);resolve(null);return; }
          let settled = false;
          try {
            const derived = Reflect.apply(then, raw, [(next: unknown) => { if (!settled) { settled = true;enter(next); } },
              (error: unknown) => { observeEager(error);if (!settled) { settled = true;reject(error); } }]);
            observeEager(derived);
          } catch (error) { observeEager(error);if (!settled) { settled = true;reject(error); } }
        });
      } catch (error) { observeEager(error);reject(error); }
    }
    enter(value);
  });
}

function Conversation({ frame, cardTitle, ask, onCitation, compact }: AssistantConversationPanelProps & { frame: Frame }) {
  const { scope, account, disabled } = frame.selected;
  const t = (key: Parameters<typeof getUiString>[1]) => getUiString(scope?.locale ?? "en", key);
  const copy = { title: t("sidebar.assistant"), scope: t("assistant.panel.scope.note"), question: t("assistant.panel.query.label"),
    send: t("assistant.panel.submit.cta"), loading: t("assistant.panel.submit.loading"), sources: t("assistant.panel.response.sources"),
    unavailable: t("assistant.panel.error.connection"), signIn: t("assistant.panel.error.auth"), limited: t("assistant.panel.error.quota"),
    denied: t("assistant.panel.error.access"), grounding: t("assistant.panel.error.grounding") };
  const id = useId(), lifeRef = useRef<Life | null>(null), actionRef = useRef<Action | null>(null);
  const callbacks = useRef({ ask, onCitation });callbacks.current = { ask, onCitation };
  const [life, setLife] = useState<Life | null>(null);
  const [view, setView] = useState<View>({ owner: null, query: "", busy: false, error: "", turns: [] });
  const viewRef = useRef(view);viewRef.current = view;
  const storage = useRef<string | null>(null);
  function current(captured: Life | null, action?: Action): boolean {
    return !!captured && !captured.retired && lifeRef.current === captured && (!action || actionRef.current === action) &&
      frame.current() && !captured.retired && lifeRef.current === captured && (!action || actionRef.current === action);
  }
  useLayoutEffect(() => {
    const captured: Life = { retired: false };lifeRef.current = captured;actionRef.current = null;
    const check = () => current(captured);
    if (check()) {
      setLife(previous => check() ? captured : previous);
      let key: string | null = null;
      try { if (scope && account && check()) key = historyKey(scope, account); } catch (error) { observeEager(error);/* Storage unavailable. */ }
      if (check()) {
        storage.current = key;
        const turns = loadHistory(key, check);
        if (check()) setView(previous => check() ? { owner: captured, query: "", busy: false, error: "", turns } : previous);
      }
    }
    return () => { captured.retired = true;if (lifeRef.current === captured) lifeRef.current = null; };
  }, [frame]);
  function update(captured: Life, action: Action | undefined, change: (previous: View) => View, owner: Current = () => true) {
    if (!current(captured, action) || !owner()) return;
    setView(previous => {
      if (!current(captured, action) || !owner() || previous.owner !== captured) return previous;
      const next = change(previous);return current(captured, action) && owner() ? next : previous;
    });
  }
  const renderedAction = actionRef.current;
  const callbackCurrent = () => current(life) && view.owner === life && viewRef.current === view && actionRef.current === renderedAction;
  const ready = current(life) && view.owner === life;
  const turns = ready ? view.turns : [], query = ready ? view.query : "", busy = ready && view.busy;
  const blocked = disabled || (!ready ? copy.signIn : undefined);
  async function submit(event: FormEvent) {
    // Cancelling a stale native form's default navigation is a deny action only.
    if (!callbackCurrent()) { try { observeEager(event.preventDefault()); } catch (error) { observeEager(error);/* Stale event. */ }return; }
    try {
      const prevent = field(event, "preventDefault", callbackCurrent);if (typeof prevent !== "function") return;
      observeEager(Reflect.apply(prevent, event, []));if (!callbackCurrent()) return;
    } catch (error) { observeEager(error);return; }
    if (actionRef.current?.pending || !life || !scope) return;
    const question = query.trim();if (question.length < 2 || !callbackCurrent()) return;
    const action: Action = { life, pending: true };actionRef.current = action;
    const check = () => current(life, action);
    update(life, action, previous => ({ ...previous, busy: true, error: "" }));
    try {
      if (!check()) return;
      const history = Object.freeze(turns.slice(-3).map(turn => Object.freeze({ question: turn.question.slice(0, 500), answer: turn.answer.slice(0, 1200) })));
      if (!check()) return;
      const ids = globalThis.crypto;if (!check()) return;
      const createId = field(ids, "randomUUID", check);if (typeof createId !== "function" || !check()) return;
      const requestId: unknown = Reflect.apply(createId, ids, []);observeEager(requestId);if (!check()) return;
      if (typeof requestId !== "string") throw new Error("Invalid assistant request identity");
      const args = { scope: Object.freeze({ ...scope }), query: question, requestId, history: [...history] };
      const adapter = callbacks.current.ask;if (!check() || typeof adapter !== "function") return;
      const pending = Reflect.apply(adapter, undefined, [args]);
      const result = await adopt(pending, check);if (!result || !check()) return;
      const status = field(result.value, "status", check);
      if (status !== 200) {
        const message = status === 401 ? copy.signIn : status === 403 ? copy.denied : status === 429 ? copy.limited : status === 422 ? copy.grounding : copy.unavailable;
        update(life, action, previous => ({ ...previous, error: message }));return;
      }
      const answer = field(result.value, "answer", check);
      if (typeof answer !== "string" || !answer.trim() || answer.length > 16000) throw new Error("Invalid assistant response");
      const copied = citations(field(result.value, "citations", check), check);if (!copied) throw new Error("Invalid assistant citations");
      const next = Object.freeze([...turns.slice(-19), Object.freeze({ question, answer, citations: copied })]);
      if (!check()) return;saveHistory(storage.current, next, check);if (!check()) return;
      update(life, action, previous => ({ ...previous, turns: next, query: "" }));
    } catch (cause) {
      observeEager(cause);
      if (check()) {
        let message = copy.unavailable;
        try { if (cause instanceof AssistantRequestError) { const detail = field(cause, "message", check);if (typeof detail === "string") message = detail; } } catch { /* Retired or malformed error. */ }
        update(life, action, previous => ({ ...previous, error: message }));
      }
    } finally {
      if (check()) { action.pending = false;update(life, action, previous => ({ ...previous, busy: false })); }
    }
  }
  function clear() {
    if (!callbackCurrent() || actionRef.current?.pending || busy || !life) return;
    const action: Action = { life, pending: true };actionRef.current = action;const check = () => current(life, action);
    saveHistory(storage.current, [], check);
    if (check()) { update(life, action, previous => ({ ...previous, turns: [] }));action.pending = false; }
  }
  function navigate(citation: AssistantCitation) {
    if (!callbackCurrent()) return;
    const callback = callbacks.current.onCitation;
    if (typeof callback !== "function" || !callbackCurrent()) return;
    try { observeEager(callback({ ...citation })); } catch (error) { observeEager(error);/* A caller cannot revive a retired conversation. */ }
  }
  return <section aria-label={copy.title} dir={scope?.locale === "en" ? "ltr" : "rtl"} className={compact ? "space-y-3" : "space-y-4"}>
    <header><h2 className="text-lg font-bold">{copy.title}</h2>
      {cardTitle && <p className="mt-1 font-semibold">{cardTitle}</p>}
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{copy.scope}</p></header>
    <div role="log" aria-live="polite" aria-relevant="additions" className="space-y-4">
      {current(life) && turns.map((turn, index) => <article key={index} className="space-y-3 rounded-xl border p-4">
        <p className="font-semibold whitespace-pre-wrap">{turn.question}</p><AssistantAnswer text={turn.answer} />
        {turn.citations.length > 0 && <div className="text-sm"><p className="font-semibold">{copy.sources}</p>
          <ul className="mt-2 list-inside list-disc space-y-1">{turn.citations.map((citation, i) => <li key={`${citation.id}:${i}`}>
            {onCitation ? <button type="button" onClick={() => navigate(citation)} className="text-primary underline">{citation.label}</button>
              : typeof citation.href === "string" && /^\/(?!\/)/.test(citation.href) && !/[\\\u0000-\u0020]/.test(citation.href)
                ? <a href={citation.href} onClick={event => { if (!callbackCurrent()) event.preventDefault(); }} className="text-primary underline">{citation.label}</a> : citation.label}
          </li>)}</ul></div>}
      </article>)}
    </div>
    {current(life) && turns.length > 0 && <button type="button" disabled={busy || !!blocked} className="text-sm underline" onClick={clear}>{t("assistant.panel.history.clear")}</button>}
    <p className="text-xs text-muted-foreground">{t("assistant.panel.history.independent")}</p>
    {blocked && <p role="status" className="text-sm">{blocked}</p>}
    <form onSubmit={event => void submit(event)} className="space-y-3">
      <label htmlFor={id} className="block font-semibold">{copy.question}</label>
      <textarea id={id} value={current(life) ? query : ""} onChange={event => {
        if (!callbackCurrent() || actionRef.current?.pending || !life) return;
        try { const value = field(field(event, "target", callbackCurrent), "value", callbackCurrent);
          if (typeof value === "string" && callbackCurrent()) update(life, undefined, previous => ({ ...previous, query: value }), callbackCurrent); } catch (error) { observeEager(error);/* Retired event. */ }
      }} maxLength={1500} rows={3} disabled={busy || !!blocked} placeholder={t("assistant.panel.query.placeholder")}
        className="w-full resize-y rounded-xl border bg-background p-3 disabled:opacity-60" />
      <button type="submit" disabled={busy || !!blocked || query.trim().length < 2} className="min-h-11 rounded-full bg-primary px-5 font-bold text-primary-foreground disabled:opacity-50">{busy ? copy.loading : copy.send}</button>
    </form>
    {current(life) && busy && <p role="status" className="text-sm">{copy.loading}</p>}
    {current(life) && ready && view.error && <p role="alert" className="text-sm text-destructive">{view.error}</p>}
  </section>;
}
