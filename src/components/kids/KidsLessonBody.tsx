import { JourneyVisitRecorder } from "@/components/journey/JourneyVisitRecorder";
import { KidsStepCompletion } from "@/components/journey/KidsStepCompletion";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getKidsJourneyCopy } from "@/lib/kids/journey-copy";
import type { KidsLesson } from "@/lib/kids/lesson-client";
import type { KidsLevelId } from "@/lib/kids/catalogue";
import type { SupportedLocale } from "@/lib/locale/types";
import { CourseLessonAssistant } from "@/components/assistant/CourseLessonAssistant";

type Props = {
  lesson: KidsLesson;
  embedUrl: string;
  locale: SupportedLocale;
  levelId: KidsLevelId;
  lessonNumber: number;
  profileId: string;
  actionContext: KidsBodyActionContext;
};

export type KidsBodyActionContext = Readonly<{
  incarnation: object;
  kind: "administrator_preview" | "kids_profile";
  isCurrent: () => boolean;
}>;
type BodyScope = {
  incarnation: object | null; kind: KidsBodyActionContext["kind"] | null;
  lesson: KidsLesson; embedUrl: string; locale: SupportedLocale;
  levelId: KidsLevelId; lessonNumber: number; profileId: string;
};
type ActionTicket = {
  model: BodyModel; kind: "quiz" | "hint"; key: string; selection: object;
  active: boolean; pending: boolean;
};
type QuizValue = { correct: boolean; explanation?: string };
type BodyModel = {
  scope: BodyScope; life: object; active: boolean;
  choices: Record<string, number>; choiceVersions: Record<string, object>;
  latestQuiz: Record<string, ActionTicket>;
  checked: Record<string, { selection: object; value: QuizValue }>;
  quizBusy: ActionTicket | null; quizError: ActionTicket | null;
  hintVersion: object; hintLatest: ActionTicket | null;
  hint: { ticket: ActionTicket; id: string; answer: string } | null;
  hintError: ActionTicket | null; hintBusy: ActionTicket | null;
};
type BodyView = BodyModel & { model: BodyModel };

/** Fence lazy adoption itself, not only the continuation after await. */
function adoptBodyAction<T>(
  pending: T | PromiseLike<T>, requireCurrent: () => void,
): Promise<{ value: T }> {
  return new Promise((resolve, reject) => {
    const fail = (error: unknown) => {
      try { Reflect.apply(Promise.prototype.then, pending, [() => undefined, () => undefined]); }
      catch { /* Only an already-started native Promise passes the intrinsic brand check. */ }
      reject(error);
    };
    try { requireCurrent(); } catch (error) { fail(error); return; }
    queueMicrotask(() => {
      try {
        requireCurrent();
        const then = pending !== null &&
          (typeof pending === "object" || typeof pending === "function")
          ? (pending as PromiseLike<T>).then : undefined;
        requireCurrent();
        if (typeof then === "function") {
          const derived = Reflect.apply(then, pending, [(value: T) => resolve({ value }), reject]);
          try { Reflect.apply(Promise.prototype.then, derived, [() => undefined, () => undefined]); }
          catch { /* Never adopt an arbitrary lazy return value just to observe it. */ }
        } else resolve({ value: pending as T });
      } catch (error) { fail(error); }
    });
  });
}

export function KidsLessonBody({
  lesson, embedUrl, locale, levelId, lessonNumber, profileId, actionContext,
}: Props) {
  const copy = getKidsJourneyCopy(locale);
  let incarnation: object | null = null;
  let kind: KidsBodyActionContext["kind"] | null = null;
  try {
    if (actionContext && typeof actionContext.incarnation === "object" &&
      actionContext.incarnation !== null) incarnation = actionContext.incarnation;
    if (actionContext?.kind === "administrator_preview" || actionContext?.kind === "kids_profile")
      kind = actionContext.kind;
  } catch { /* No missing/unreadable context success fallback. */ }
  const scope = useMemo<BodyScope>(() => ({
    incarnation, kind, lesson, embedUrl, locale, levelId, lessonNumber, profileId,
  }), [incarnation, kind, lesson, embedUrl, locale, levelId, lessonNumber, profileId]);
  const latest = useRef({ scope, context: actionContext });
  latest.current = { scope, context: actionContext };
  const life = useRef<object | null>(null);
  const model = useRef<BodyModel | null>(null);
  const [view, setView] = useState<BodyView | null>(null);
  const modelCurrent = (captured: BodyModel) => {
    const owned = () => captured.active && model.current === captured &&
      life.current === captured.life && latest.current.scope === captured.scope;
    if (!owned() || !captured.scope.incarnation || !captured.scope.kind) return false;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const context = latest.current.context;
        if (!context || !owned()) return false;
        const identity = context.incarnation;
        if (!owned()) return false;
        const selector = context.kind;
        if (!owned()) return false;
        const predicate = context.isCurrent;
        if (!owned() || identity !== captured.scope.incarnation ||
          selector !== captured.scope.kind || typeof predicate !== "function") return false;
        const current = Reflect.apply(predicate, context, []) === true;
        if (!owned()) return false;
        // Identity is only a reason to reread the live predicate, never permission.
        if (latest.current.context !== context) continue;
        return current;
      } catch { return false; }
    }
    return false;
  };
  const ticketCurrent = (ticket: ActionTicket) => {
    const matches = () => ticket.active && (ticket.kind === "quiz"
      ? ticket.model.latestQuiz[ticket.key] === ticket &&
        ticket.model.choiceVersions[ticket.key] === ticket.selection
      : ticket.model.hintLatest === ticket && ticket.model.hintVersion === ticket.selection);
    return matches() && modelCurrent(ticket.model) && matches();
  };
  const publish = (captured: BodyModel, ticket?: ActionTicket) => {
    if (!modelCurrent(captured) || (ticket && !ticketCurrent(ticket))) return;
    setView((previous) => {
      // Guard actual updater execution, then copy latest private channel state.
      if (!modelCurrent(captured) || (ticket && !ticketCurrent(ticket))) return previous;
      return { ...captured, model: captured, choices: { ...captured.choices },
        choiceVersions: { ...captured.choiceVersions }, latestQuiz: { ...captured.latestQuiz },
        checked: { ...captured.checked } };
    });
  };
  const retire = (captured: BodyModel) => {
    captured.active = false;
    for (const ticket of Object.values(captured.latestQuiz)) ticket.active = false;
    if (captured.hintLatest) captured.hintLatest.active = false;
    if (model.current === captured) model.current = null;
  };
  useEffect(() => {
    const mounted = {};
    life.current = mounted;
    return () => {
      if (life.current !== mounted) return;
      life.current = null;
      if (model.current) retire(model.current);
    };
  }, []);
  useEffect(() => {
    const mounted = life.current;
    if (!mounted) return;
    const current: BodyModel = {
      scope, life: mounted, active: true, choices: {}, choiceVersions: {}, latestQuiz: {},
      checked: {}, quizBusy: null, quizError: null, hintVersion: {}, hintLatest: null,
      hint: null, hintError: null, hintBusy: null,
    };
    model.current = current;
    publish(current);
    return () => retire(current);
  }, [scope]);
  const requireModel = (captured: BodyModel) => {
    if (!modelCurrent(captured)) throw new Error("Retired Kids body action");
  };
  const requireTicket = (ticket: ActionTicket) => {
    if (!ticketCurrent(ticket)) throw new Error("Retired Kids body action");
  };
  const field = (value: unknown, key: string | number, current: () => void): unknown => {
    current();
    const found = value !== null && (typeof value === "object" || typeof value === "function")
      ? Reflect.get(value, key) : undefined;
    current();
    return found;
  };
  const invoke = async (
    ticket: ActionTicket, name: "kids-lesson-help" | "kids-lesson-content",
    body: Record<string, unknown>,
  ) => {
    const current = () => requireTicket(ticket);
    current();
    const functions = supabase.functions;
    current();
    const call = functions.invoke;
    current();
    const started = Reflect.apply(call, functions, [name, { body }]);
    const response = await adoptBodyAction(started, current);
    current();
    return response;
  };
  const changeChoice = (
    captured: BodyModel, key: string, selectedIndex: number,
    expectedChoice: object | undefined, expectedRequest: ActionTicket | undefined,
  ) => {
    const current = () => modelCurrent(captured) &&
      captured.choiceVersions[key] === expectedChoice && captured.latestQuiz[key] === expectedRequest;
    try {
      if (!current()) return;
      const quiz = field(captured.scope.lesson, "quiz", () => { if (!current()) throw new Error("Retired choice"); });
      if (!current() || !Array.isArray(quiz)) return;
      const question = quiz.find((candidate) => candidate?.id === key);
      if (!current() || !question || !Number.isInteger(selectedIndex) ||
        selectedIndex < 0 || selectedIndex >= question.options.length) return;
      if (!current()) return;
      const old = captured.latestQuiz[key];
      if (old) old.active = false;
      if (captured.quizBusy === old) captured.quizBusy = null;
      captured.choiceVersions[key] = {};
      captured.choices[key] = selectedIndex;
      delete captured.checked[key];
      captured.quizError = null;
      publish(captured);
    } catch { /* Retired/unreadable authored selections cannot mutate a newer view. */ }
  };
  async function showHint(captured: BodyModel, index: number, expectedVersion: object) {
    let ticket: ActionTicket | null = null;
    try {
      const current = () => {
        requireModel(captured);
        if (captured.hintVersion !== expectedVersion) throw new Error("Retired hint selection");
      };
      current();
      if (captured.hintBusy?.pending && ticketCurrent(captured.hintBusy)) return;
      const hints = field(captured.scope.lesson, "hints", current);
      const authored = field(hints, index, current);
      const sourceScene = field(authored, "sourceScene", current);
      const sourceId = sourceScene ?? field(authored, "source", current);
      const question = field(authored, "question", current);
      current();
      if (captured.hintLatest) captured.hintLatest.active = false;
      const selection = {};
      captured.hintVersion = selection;
      ticket = { model: captured, kind: "hint", key: "hint-" + (index + 1),
        selection, active: true, pending: true };
      captured.hintLatest = ticket;
      captured.hintBusy = ticket;
      captured.hint = null;
      captured.hintError = null;
      publish(captured, ticket);
      const owned = () => requireTicket(ticket!);
      const { value: response } = await invoke(ticket, "kids-lesson-help", {
        profileId: captured.scope.profileId, levelId: captured.scope.levelId,
        lessonNumber: captured.scope.lessonNumber, locale: captured.scope.locale, hintId: ticket.key,
      });
      owned();
      const error = field(response, "error", owned);
      const data = field(response, "data", owned);
      const citation = field(data, "citation", owned);
      const answer = field(data, "answer", owned);
      const returnedQuestion = field(data, "question", owned);
      const product = field(citation, "product", owned);
      const returnedLevel = field(citation, "levelId", owned);
      const returnedLesson = field(citation, "lessonNumber", owned);
      const returnedLocale = field(citation, "locale", owned);
      const returnedSource = field(citation, "sourceId", owned);
      owned();
      if (error || typeof answer !== "string" || !answer.trim() ||
        typeof sourceId !== "string" || returnedQuestion !== question ||
        product !== "kids" || returnedLevel !== captured.scope.levelId ||
        returnedLesson !== captured.scope.lessonNumber || returnedLocale !== captured.scope.locale ||
        returnedSource !== sourceId) throw new Error("Invalid protected hint");
      owned();
      captured.hint = { ticket, id: ticket.key, answer };
      publish(captured, ticket);
    } catch {
      if (ticket && ticketCurrent(ticket)) {
        captured.hintError = ticket;
        publish(captured, ticket);
      }
    } finally {
      if (ticket && ticketCurrent(ticket)) {
        ticket.pending = false;
        if (captured.hintBusy === ticket) captured.hintBusy = null;
        publish(captured, ticket);
      }
    }
  }
  async function checkQuiz(
    captured: BodyModel, questionId: string, selectedIndex: number,
    expectedChoice: object | undefined, expectedRequest: ActionTicket | undefined,
  ) {
    let ticket: ActionTicket | null = null;
    try {
      const current = () => {
        requireModel(captured);
        if (captured.choiceVersions[questionId] !== expectedChoice ||
          captured.latestQuiz[questionId] !== expectedRequest ||
          captured.choices[questionId] !== selectedIndex) throw new Error("Retired quiz selection");
      };
      current();
      if (!expectedChoice || (captured.quizBusy?.pending && ticketCurrent(captured.quizBusy))) return;
      const quiz = field(captured.scope.lesson, "quiz", current);
      current();
      const authored = Array.isArray(quiz) ? quiz.find((candidate) => candidate?.id === questionId) : undefined;
      current();
      const authoredId = field(authored, "id", current);
      const options = field(authored, "options", current);
      field(authored, "question", current);
      current();
      if (authoredId !== questionId || !Array.isArray(options) || !Number.isInteger(selectedIndex) ||
        selectedIndex < 0 || selectedIndex >= options.length) return;
      if (expectedRequest) expectedRequest.active = false;
      ticket = { model: captured, kind: "quiz", key: questionId,
        selection: expectedChoice, active: true, pending: true };
      captured.latestQuiz[questionId] = ticket;
      captured.quizBusy = ticket;
      captured.quizError = null;
      publish(captured, ticket);
      const owned = () => requireTicket(ticket!);
      const { value: response } = await invoke(ticket, "kids-lesson-content", {
        profileId: captured.scope.profileId, levelId: captured.scope.levelId,
        lessonNumber: captured.scope.lessonNumber, locale: captured.scope.locale,
        action: "quiz-check", questionId: authoredId, selectedIndex,
      });
      owned();
      const error = field(response, "error", owned);
      const data = field(response, "data", owned);
      const citation = field(data, "citation", owned);
      const correct = field(data, "correct", owned);
      const explanation = field(data, "explanation", owned);
      const product = field(citation, "product", owned);
      const returnedLevel = field(citation, "levelId", owned);
      const returnedLesson = field(citation, "lessonNumber", owned);
      const returnedLocale = field(citation, "locale", owned);
      owned();
      if (error || typeof correct !== "boolean" || product !== "kids" ||
        returnedLevel !== captured.scope.levelId || returnedLesson !== captured.scope.lessonNumber ||
        returnedLocale !== captured.scope.locale) throw new Error("Invalid protected quiz result");
      owned();
      captured.checked[questionId] = { selection: expectedChoice, value: {
        correct, explanation: typeof explanation === "string" ? explanation : undefined,
      } };
      publish(captured, ticket);
    } catch {
      if (ticket && ticketCurrent(ticket)) {
        captured.quizError = ticket;
        publish(captured, ticket);
      }
    } finally {
      if (ticket && ticketCurrent(ticket)) {
        ticket.pending = false;
        if (captured.quizBusy === ticket) captured.quizBusy = null;
        publish(captured, ticket);
      }
    }
  }
  const visible = view && modelCurrent(view.model) && view.scope === scope ? view : null;
  const choices = visible?.choices ?? {};
  const checked: Record<string, QuizValue> = {};
  if (visible) for (const [key, answer] of Object.entries(visible.checked))
    if (visible.model.choiceVersions[key] === answer.selection) checked[key] = answer.value;
  const checkingKey = visible?.quizBusy && ticketCurrent(visible.quizBusy) && visible.quizBusy.pending
    ? visible.quizBusy.key : null;
  const quizError = visible?.quizError && ticketCurrent(visible.quizError) ? visible.quizError.key : null;
  const hint = visible?.hint && ticketCurrent(visible.hint.ticket) ? visible.hint : null;
  const hintError = !!(visible?.hintError && ticketCurrent(visible.hintError));
  const loadingHint = !!(visible?.hintBusy && ticketCurrent(visible.hintBusy) && visible.hintBusy.pending);
  if (!visible || !modelCurrent(visible.model)) return null;
  const playerUrl = new URL(embedUrl);
  playerUrl.searchParams.set("autoplay", "false");
  if (!modelCurrent(visible.model)) return null;


  const content = (
    <div className="space-y-8">
      <JourneyVisitRecorder
        line="kids"
        course={levelId}
        lesson={String(lessonNumber)}
        locale={locale}
        profile={profileId}
      />
      <header className="rounded-3xl border border-primary/20 bg-[var(--pastel-lavender)] p-6 md:p-9">
        <p className="text-sm font-bold text-primary">
          {copy.level} {Number(levelId.slice(-1))} · {copy.lesson} {lessonNumber}
        </p>
        <h1 className="mt-3 text-3xl font-black md:text-4xl">{lesson.title}</h1>
        {lesson.subtitle && (
          <p className="mt-3 text-base text-muted-foreground">{lesson.subtitle}</p>
        )}
      </header>
      <section
        aria-label={copy.watch}
        className="overflow-hidden rounded-3xl border border-border/60 bg-card"
      >
        <h2 className="p-5 text-xl font-bold">{copy.watch}</h2>
        <div className="aspect-video bg-black">
          <iframe
            key={embedUrl}
            src={playerUrl.toString()}
            title={`${copy.watch}: ${lesson.title}`}
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </section>
      {Array.isArray(lesson.objectives) && lesson.objectives.length > 0 && (
        <section className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="text-xl font-bold">{copy.objectives}</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-relaxed">
            {lesson.objectives.map((goal, index) => (
              <li key={index}>{goal}</li>
            ))}
          </ul>
        </section>
      )}
      {Array.isArray(lesson.scenes) && lesson.scenes.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">{copy.scenes}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {lesson.scenes.map((scene, index) => (
              <article
                key={scene.id ?? index}
                className="rounded-2xl border border-border/60 bg-card p-5"
              >
                <h3 className="font-bold">{scene.title}</h3>
                {scene.display && <p className="mt-2 text-sm text-primary">{scene.display}</p>}
                {scene.narration && (
                  <p className="mt-3 text-sm leading-relaxed">{scene.narration}</p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
      {Array.isArray(lesson.reading) && lesson.reading.length > 0 && (
        <section className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="text-xl font-bold">{copy.reading}</h2>
          {lesson.reading.map((section, index) => (
            <article key={section.id ?? index} className="mt-5">
              {section.title && <h3 className="font-bold">{section.title}</h3>}
              {section.text && (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{section.text}</p>
              )}
            </article>
          ))}
        </section>
      )}
      {lesson.activity && (
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
          <h2 className="text-xl font-bold">{lesson.activity.title ?? copy.practice}</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">
            {lesson.activity.instructions}
          </p>
          <p className="mt-4 text-xs font-semibold text-muted-foreground">{copy.privacy}</p>
        </section>
      )}
      {Array.isArray(lesson.quiz) && lesson.quiz.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">{copy.quiz}</h2>
          <div className="space-y-4">
            {lesson.quiz.map((question, index) => {
              const key = question.id ?? String(index);
              const selected = choices[key];
              return (
                <fieldset key={key} className="rounded-2xl border border-border/60 bg-card p-5">
                  <legend className="px-2 font-bold">
                    {index + 1}. {question.question}
                  </legend>
                  <div className="mt-3 space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 p-3 text-sm"
                      >
                        <input
                          type="radio"
                          name={`kids-quiz-${key}`}
                          checked={selected === optionIndex}
                          disabled={checkingKey === key}
                          onChange={() => changeChoice(visible.model, key, optionIndex,
                            visible.choiceVersions[key], visible.latestQuiz[key])}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={selected === undefined || checkingKey !== null}
                    onClick={() => {
                      if (selected !== undefined) void checkQuiz(visible.model, key, selected,
                        visible.choiceVersions[key], visible.latestQuiz[key]);
                    }}
                    className="mt-4 min-h-11 rounded-full border border-primary px-5 text-sm font-bold text-primary disabled:opacity-50"
                  >
                    {copy.checkAnswer}
                  </button>
                  {quizError === key && (
                    <p role="alert" className="mt-3 text-sm text-destructive">
                      {copy.unavailableLesson}
                    </p>
                  )}
                  {checked[key] && (
                    <p role="status" className="mt-3 text-sm">
                      {checked[key].correct ? copy.correct : copy.retry}
                      {checked[key].explanation && (
                        <span className="mt-1 block">{checked[key].explanation}</span>
                      )}
                    </p>
                  )}
                </fieldset>
              );
            })}
          </div>
        </section>
      )}
      {lesson.mission && (
        <section className="rounded-2xl border border-primary/20 bg-[var(--pastel-lavender)] p-6">
          <h2 className="text-xl font-bold">{lesson.mission.title ?? copy.mission}</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">
            {lesson.mission.instructions}
          </p>
          {Array.isArray(lesson.mission.rubric) && (
            <ul className="mt-4 list-inside list-disc space-y-2 text-sm">
              {lesson.mission.rubric.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs font-semibold text-muted-foreground">{copy.privacy}</p>
        </section>
      )}
      {Array.isArray(lesson.hints) && lesson.hints.length > 0 && (
        <section className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="text-xl font-bold">{copy.hint}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {lesson.hints.map((item, index) => (
              <button
                key={index}
                type="button"
                disabled={loadingHint}
                onClick={() => { void showHint(visible.model, index, visible.hintVersion); }}
                className="min-h-11 rounded-full border border-primary px-4 text-sm font-semibold text-primary disabled:opacity-50"
              >
                {item.question ?? `${copy.loadHint} ${index + 1}`}
              </button>
            ))}
          </div>
          {hint && (
            <p role="status" className="mt-4 rounded-xl bg-primary/5 p-4 text-sm">
              {hint.answer}
            </p>
          )}
          {hintError && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {copy.unavailableLesson}
            </p>
          )}
        </section>
      )}
      <KidsStepCompletion
        profile={profileId}
        level={levelId}
        lesson={lessonNumber}
        locale={locale}
      />
      <CourseLessonAssistant area="kids" cardId={levelId} stepId={String(lessonNumber)} locale={locale} profileId={profileId} />
    </div>
  );
  return modelCurrent(visible.model) ? content : null;
}
