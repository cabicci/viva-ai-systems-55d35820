import { useId, useLayoutEffect, useRef, useState, type ChangeEvent } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth, type AuthGeneration } from "@/lib/auth-context";
import { PATHS } from "@/lib/curriculum-data";
import { useLearnerContext } from "@/lib/learner-context";
import { useLocale } from "@/lib/locale/locale-context";
import { getUiString } from "@/lib/locale/ui-strings";
import { getCurriculumPathLabel } from "@/lib/locale-curriculum/resolve-curriculum-label";
import { buildAssistantRuntimePayload, resolveAssistantLearnerContext,
  type AssistantContextOverride, type ResolvedAssistantLearnerContext } from "@/lib/assistant/resolve-assistant-learner-context";
import { callGuardedAssistantRuntimeBoxed } from "@/lib/assistant-runtime";
import { AssistantConversationPanel } from "./AssistantConversationPanel";
import { AssistantRequestError } from "@/lib/card-assistant/errors";
import type { AssistantAdapter, AssistantQuestion, AssistantReply, AssistantCitation } from "@/lib/card-assistant/types";

interface Props { compact?: boolean; contextOverride?: AssistantContextOverride | null }

type Auth = ReturnType<typeof useAuth>;
type Principal = { actor: string; generation: AuthGeneration };
type Current = () => boolean;
type Input = { auth: Auth; ctx: ReturnType<typeof useLearnerContext>; locale: ReturnType<typeof useLocale>;
  compact: boolean; override: AssistantContextOverride | null; selected: string };
type Snapshot = { resolved: ResolvedAssistantLearnerContext; signature: readonly unknown[] };
type Frame = { key: number; signature: readonly unknown[]; principal: Principal | null; retired: boolean;
  active: boolean; queued: boolean; preparing: boolean; action: object | null };
const stale = Symbol("retired assistant adapter");
const nativeThen = Promise.prototype.then;
const authChecks = new WeakSet<object>();

function observe(value: unknown): void {
  try { void Reflect.apply(nativeThen, value, [() => {}, () => {}]); } catch { /* Not an entered native promise. */ }
}
function read<T>(get: () => T, current: Current): T {
  if (!current()) throw stale;
  let value: T;
  try { value = get(); } catch (error) { observe(error);throw error; }
  observe(value);
  if (!current()) throw stale;
  return value;
}
function field(value: unknown, key: PropertyKey, current: Current): unknown {
  return read(() => value && (typeof value === "object" || typeof value === "function") ? Reflect.get(value, key) : undefined, current);
}
function principal(auth: Auth): Principal | null {
  try {
    const user = auth.user;observe(user);
    const actor = user?.id;observe(actor);
    const generation = auth.authGeneration;observe(generation);
    const value = generation?.value;observe(value);
    const captured = typeof actor === "string" && actor && generation && typeof generation === "object" && Number.isSafeInteger(value)
      ? { actor, generation } : null;
    return captured && live(auth, captured) ? captured : null;
  } catch (error) { observe(error);return null; }
}
function live(auth: Auth, captured: Principal): boolean {
  if (authChecks.has(auth)) return false;
  authChecks.add(auth);
  try {
    const actorMatches = () => {
      const user = auth.user;observe(user);
      const id = user?.id;observe(id);
      return typeof id === "string" && id === captured.actor;
    };
    if (!actorMatches()) return false;
    const loading = auth.loading;observe(loading);
    if (!actorMatches() || loading !== false) return false;
    const generation = auth.authGeneration;observe(generation);
    if (!actorMatches() || generation !== captured.generation) return false;
    const value = generation.value;observe(value);
    if (!actorMatches() || !Number.isSafeInteger(value)) return false;
    const predicate = auth.isAuthGenerationCurrent;observe(predicate);
    if (!actorMatches() || typeof predicate !== "function") return false;
    const answer: unknown = Reflect.apply(predicate, auth, [captured.generation]);observe(answer);
    if (!actorMatches() || answer !== true) return false;
    const afterLoading = auth.loading;observe(afterLoading);
    if (!actorMatches() || afterLoading !== false) return false;
    const afterGeneration = auth.authGeneration;observe(afterGeneration);
    return actorMatches() && afterGeneration === captured.generation;
  } catch (error) { observe(error);return false; }
  finally { authChecks.delete(auth); }
}
// Only the real resolver's consumed fields are visited, once per snapshot. The
// typed proxy preserves its actual API without copying unrelated learner data.
function snapshotObject<T extends object>(source: T, current: Current): T {
  const cached = new Map<PropertyKey, unknown>();
  return new Proxy<T>(Object.create(source), { get(_shadow, key) {
    if (!current()) throw stale;
    if (cached.has(key)) return cached.get(key);
    const value: unknown = read(() => Reflect.get(source, key), current);
    const copied = value && typeof value === "object" ? snapshotObject(value, current) : value;
    cached.set(key, copied);return copied;
  } });
}
function snapshot(input: Input, current: Current): Snapshot {
  const locale = read(() => input.locale.locale, current);
  const ctx = snapshotObject(input.ctx, current);
  const override = input.override ? snapshotObject(input.override, current) : null;
  const resolve = read(() => resolveAssistantLearnerContext, current);
  const raw = read(() => resolve(locale, ctx, override), current);
  const path = !input.compact && !override ? PATHS.find(item => item.id === input.selected && item.status === "open") : undefined;
  const resolved = input.compact || override ? raw : { ...raw, currentPath: path?.id ?? null,
    currentPathTitle: path ? read(() => getCurriculumPathLabel(locale, path.id, "title"), current) : null,
    currentModule: null, currentModuleTitle: null, currentLesson: null, currentLessonTitle: null,
    currentMission: null, nextLessonTitle: null, preferPathId: path?.id ?? null, preferLessonId: null };
  const mission = resolved.currentMission;
  const signature = [input.compact, !!override, input.selected, locale, ctx.currentRoute, ctx.currentUser.id,
    resolved.locale, resolved.currentPath, resolved.currentModule, resolved.currentLesson, resolved.currentPathTitle,
    resolved.currentModuleTitle, resolved.currentLessonTitle, resolved.completedLessonsCount, resolved.totalLessonsCount,
    resolved.nextLessonTitle, mission?.intro, mission?.prompt, resolved.preferPathId, resolved.preferLessonId];
  if (!current()) throw stale;
  return { resolved, signature };
}
function equal(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
}
// Every entered native/derived rejection is observed before denial. Lazy
// thenables are read and invoked only while this action still owns its frame.
function adopt(value: unknown, current: Current): Promise<{ value: unknown } | null> {
  return new Promise((resolve, reject) => {
    const seen = new Set<unknown>();
    function enter(raw: unknown): void {
      observe(raw);
      if (!current()) { resolve(null);return; }
      if (raw && (typeof raw === "object" || typeof raw === "function")) {
        if (seen.has(raw)) { reject(new TypeError("Cyclic assistant result"));return; }
        seen.add(raw);
        let native = false;
        try {
          const derived: unknown = Reflect.apply(nativeThen, raw, [(next: unknown) => enter(next), (error: unknown) => { observe(error);reject(error); }]);
          native = true;observe(derived);
        } catch (error) {
          observe(error);
          if (raw instanceof Promise) { reject(error);return; }
        }
        if (native) return;
      }
      try {
        const then = field(raw, "then", current);
        if (typeof then !== "function") { resolve(Object.assign(Object.create(null), { value: raw }));return; }
        queueMicrotask(() => {
          if (!current()) { observe(raw);resolve(null);return; }
          let settled = false;
          try {
            const derived: unknown = Reflect.apply(then, raw, [(next: unknown) => { if (!settled) { settled = true;enter(next); } },
              (error: unknown) => { observe(error);if (!settled) { settled = true;reject(error); } }]);
            observe(derived);
          } catch (error) { observe(error);if (!settled) { settled = true;reject(error); } }
        });
      } catch (error) { observe(error);reject(error); }
    }
    enter(value);
  });
}


/** Area adapter only. Every card uses the shared conversation and history implementation. */
export function AssistantPanel({ compact = false, contextOverride = null }: Props) {
  const ctx = useLearnerContext();
  const auth = useAuth();
  const localeContext = useLocale();
  const { locale, dir } = localeContext;
  const [selectedCardId, setSelectedCardId] = useState<string>(() => {
    try { return ctx.currentPath?.id ?? ""; } catch (error) { observe(error);return ""; }
  });
  const cardSelectId = useId();
  const [epoch, setEpoch] = useState(0);
  const inputs = useRef<Input>({ auth, ctx, locale: localeContext, compact, override: contextOverride, selected: selectedCardId });
  inputs.current = { auth, ctx, locale: localeContext, compact, override: contextOverride, selected: selectedCardId };
  const frames = useRef<Frame | null>(null);
  const mounted = useRef(false);
  const captured = principal(auth);
  let selected: Snapshot | null = null;
  try { selected = snapshot(inputs.current, () => !captured || live(auth, captured)); } catch (error) { observe(error); }
  const signature = [captured?.actor, captured?.generation, ...(selected?.signature ?? [])];
  if (!frames.current || frames.current.retired || !equal(frames.current.signature, signature)) {
    if (frames.current) frames.current.retired = true;
    frames.current = { key: (frames.current?.key ?? 0) + 1, signature, principal: captured,
      retired: false, active: false, queued: false, preparing: false, action: null };
  }
  const frame = frames.current;
  function refresh(): void {
    if (frame.queued || frames.current !== frame || !mounted.current) return;
    frame.queued = true;
    queueMicrotask(() => {
      if (mounted.current && frames.current === frame && frame.retired) {
        setEpoch(previous => mounted.current && frames.current === frame && frame.retired ? previous + 1 : previous);
      }
    });
  }
  function current(action?: object): boolean {
    if (frames.current !== frame || (action && frame.action !== action)) return false;
    const base = () => frames.current === frame && !frame.retired && frame.active &&
      (!action || frame.action === action) && !!frame.principal && live(inputs.current.auth, frame.principal);
    try {
      if (!base()) { frame.retired = true;refresh();return false; }
      const latest = snapshot(inputs.current, base);
      if (!equal(frame.signature, [frame.principal?.actor, frame.principal?.generation, ...latest.signature]) || !base()) {
        frame.retired = true;refresh();return false;
      }
      return true;
    } catch (error) { observe(error);frame.retired = true;refresh();return false; }
  }
  useLayoutEffect(() => {
    mounted.current = true;
    if (frame.retired) refresh();else frame.active = true;
    return () => { mounted.current = false;frame.active = false;frame.retired = true; };
  }, [frame, epoch]);
  const ask: AssistantAdapter = input => {
    const pending = run(input);observe(pending);return pending;
  };
  async function run(input: AssistantQuestion): Promise<AssistantReply> {
    if (frame.preparing) { frame.retired = true;refresh();throw new AssistantRequestError(""); }
    if (!current()) throw new AssistantRequestError("");
    const action = {};frame.action = action;frame.preparing = true;
    const check = () => current(action);
    try {
      const resolved = snapshot(inputs.current, check).resolved;
      if (!resolved.currentPath) return { status: 403 };
      const query = read(() => input.query, check);
      const history = read(() => input.history, check);
      let copied: { question: string; answer: string }[] | undefined;
      if (history !== undefined) {
        if (!Array.isArray(history)) throw new TypeError("Invalid assistant history");
        copied = [];
        const length = read(() => history.length, check);
        for (let index = 0; index < length; index++) {
          const row = read(() => history[index], check);
          copied.push({ question: read(() => row.question, check), answer: read(() => row.answer, check) });
        }
      }
      const builder = read(() => buildAssistantRuntimePayload, check);
      const payload = read(() => builder(query, resolved, copied), check);
      const helper = read(() => callGuardedAssistantRuntimeBoxed, check);
      if (!check()) throw stale;
      const raw: unknown = helper(payload, check);observe(raw);
      frame.preparing = false;
      const box = await adopt(raw, check);
      if (!box || !check()) throw stale;
      const reply = field(box.value, "reply", check);
      if (reply === null || reply === undefined) throw new TypeError("Invalid assistant response");
      if (field(reply, "ok", check) === false) return { status: 503 };
      const answerValue = field(reply, "answer", check);
      const answer = answerValue ?? field(reply, "message", check);
      if (answer !== undefined && typeof answer !== "string") throw new TypeError("Invalid assistant answer");
      const rawCitations = field(reply, "citations", check) ?? [];
      if (!Array.isArray(rawCitations)) throw new TypeError("Invalid assistant citations");
      const length = field(rawCitations, "length", check);
      if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0) throw new TypeError("Invalid assistant citations");
      const citations: AssistantCitation[] = [];
      for (let index = 0; index < length; index++) {
        const row = field(rawCitations, index, check);
        const lessonId = field(row, "lessonId", check), title = field(row, "title", check), route = field(row, "productionRoute", check);
        if (typeof lessonId !== "string" || typeof title !== "string") throw new TypeError("Invalid assistant citation");
        const sourceId = field(row, "chunkId", check) ?? lessonId;
        const citationId = field(row, "citationId", check) ?? lessonId;
        if (typeof sourceId !== "string" || typeof citationId !== "string") throw new TypeError("Invalid assistant citation");
        citations.push({ id: citationId, label: title, stepId: lessonId, sourceId,
          ...(typeof route === "string" && /^\/learn\/[a-z0-9-]+\/[a-z0-9-]+$/.test(route)
            ? { href: `${route}?locale=${locale}` } : {}) });
      }
      if (!check()) throw stale;
      return { status: 200, answer, citations };
    } catch (error) {
      observe(error);
      if (error === stale || !check()) throw new AssistantRequestError("");
      throw error;
    } finally {
      if (frame.action === action) frame.preparing = false;
    }
  }
  function selectCard(event: ChangeEvent<HTMLSelectElement>): void {
    if (!current()) return;
    try {
      const value = read(() => event.target.value, current);
      if (!current()) return;
      setSelectedCardId(previous => current() ? value : previous);
    } catch (error) { observe(error); }
  }
  if (!selected) return null;
  const resolvedContext = selected.resolved;
  const user = captured ? { id: captured.actor } : null;

  const completedLabel = getUiString(locale, "assistant.panel.context.completedValue")
    .replace("{completed}", String(resolvedContext.completedLessonsCount))
    .replace("{total}", String(resolvedContext.totalLessonsCount));
  return <div dir={dir} className="space-y-6">
    {!compact && !contextOverride && <div className="space-y-2">
      <label htmlFor={cardSelectId} className="block text-sm font-medium">{getUiString(locale, "assistant.panel.scope.choose")}</label>
      <select id={cardSelectId} value={selectedCardId} onChange={selectCard}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-base">
        <option value="">{getUiString(locale, "assistant.panel.scope.empty")}</option>
        {PATHS.filter(path => path.status === "open").map(path => <option key={path.id} value={path.id}>
          {getCurriculumPathLabel(locale, path.id, "title")}</option>)}
      </select>
    </div>}
      {!compact && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {getUiString(locale, "assistant.panel.context.title")}
            </h2>
            <Badge variant={ctx.isReady ? "secondary" : "outline"} className="text-[10px]">
              {ctx.isReady
                ? getUiString(locale, "assistant.panel.context.ready")
                : getUiString(locale, "assistant.panel.context.loading")}
            </Badge>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {!resolvedContext.currentLesson && (
              <p className="sm:col-span-2 text-sm text-muted-foreground">
                {getUiString(locale, "assistant.panel.context.noLesson")}
              </p>
            )}
            {resolvedContext.currentPath && (
              <ContextRow
                label={getUiString(locale, "assistant.panel.context.path")}
                value={resolvedContext.currentPathTitle ?? "—"}
              />
            )}
            {resolvedContext.currentModule && (
              <ContextRow
                label={getUiString(locale, "assistant.panel.context.module")}
                value={resolvedContext.currentModuleTitle ?? "—"}
              />
            )}
            {resolvedContext.currentLesson && (
              <ContextRow
                label={getUiString(locale, "assistant.panel.context.lesson")}
                value={resolvedContext.currentLessonTitle ?? "—"}
              />
            )}
            <ContextRow
              label={getUiString(locale, "assistant.panel.context.overallCompleted")}
              value={completedLabel}
            />
            {resolvedContext.nextLessonTitle && (
              <div className="sm:col-span-2">
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {getUiString(locale, "assistant.panel.context.next")}
                </dt>
                <dd className="mt-0.5">
                  {resolvedContext.nextLessonTitle}
                </dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      {compact && (
        <div className="text-xs text-muted-foreground border border-border/60 rounded-md px-3 py-2 bg-muted/20">
          {resolvedContext.currentLessonTitle ? (
            <>
              {getUiString(locale, "assistant.panel.context.compactPrefix")}{" "}
              <span className="text-foreground">
                {resolvedContext.currentModuleTitle ?? "—"} / {resolvedContext.currentLessonTitle}
              </span>
            </>
          ) : (
            <>{getUiString(locale, "assistant.panel.context.compactEmpty")}</>
          )}
        </div>
      )}

    <AssistantConversationPanel key={frame.key} scope={{ area: "ai", cardId: resolvedContext.currentPath ?? "",
      stepId: resolvedContext.currentLesson ?? undefined, locale }} accountId={user?.id}
      cardTitle={resolvedContext.currentPathTitle ?? undefined} compact={compact} ask={ask}
      disabledReason={resolvedContext.currentPath ? undefined : getUiString(locale, "assistant.panel.scope.open")} />
    <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-6">
      {getUiString(locale, "assistant.panel.footer.note")}</p>
  </div>;
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
    <dd className="mt-0.5 text-foreground">{value}</dd></div>;
}
