import * as React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale/locale-context";
import type { SupportedLocale } from "@/lib/locale/types";
import type { useLessonProgress, LessonProgressWriteOutcome } from "@/lib/lesson-progress";

export type AiCompletionContext = Readonly<{
  userId: string;
  lessonId: string;
  operationId: number;
  actionContextKey: string;
  isCurrent: () => boolean;
}>;
type Props = {
  progress: Pick<ReturnType<typeof useLessonProgress>, "isLoaded" | "setStatusWithOutcome">;
  lessonId: string;
  actionContextKey: string;
  completeLabel: string;
  continueLabel: string;
  disabled?: boolean;
  onRecordActivity: (context: AiCompletionContext) => void;
  onLessonCompleted: (context: AiCompletionContext) => void;
  onContinue?: (context: AiCompletionContext) => void;
  onConfirmed?: (context: AiCompletionContext) => void;
};
type Scope = { userId: string | null; loading: boolean; lessonId: string; key: string; disabled: boolean };
type Ticket = {
  scope: Scope; life: object; active: boolean; pending: boolean;
  wantsContinue: boolean; effectsIssued: boolean; navigated: boolean;
  receipt?: LessonProgressWriteOutcome;
};
type View = { ticket: Ticket; state: "pending" | "unconfirmed" | "confirmed"; outcome?: LessonProgressWriteOutcome };
const COPY: Record<SupportedLocale, { pending: string; unconfirmed: string; confirmed: string }> = {
  "ar-EG": { pending: "بنحفظ إكمال الدرس…", unconfirmed: "ما قدرناش نأكد حفظ إكمال الدرس.", confirmed: "اتأكد حفظ إكمال الدرس." },
  "ar-MSA": { pending: "جارٍ حفظ إكمال الدرس…", unconfirmed: "تعذر تأكيد حفظ إكمال الدرس.", confirmed: "تأكد حفظ إكمال الدرس." },
  "ar-Gulf": { pending: "نحفظ إكمال الدرس…", unconfirmed: "ما قدرنا نأكد حفظ إكمال الدرس.", confirmed: "تأكد حفظ إكمال الدرس." },
  en: { pending: "Saving lesson completion…", unconfirmed: "We could not confirm lesson completion was saved.", confirmed: "Lesson completion save confirmed." },
};

/** Owns this explicit completion action, not the whole route or the optimistic cache. */
export function AiLessonCompletionAction(props: Props) {
  const { user, loading } = useAuth();
  const { locale } = useLocale();
  const scope = React.useMemo<Scope>(() => ({
    userId: user?.id ?? null, loading, lessonId: props.lessonId,
    key: props.actionContextKey, disabled: !!props.disabled,
  }), [user?.id, loading, props.lessonId, props.actionContextKey, props.disabled]);
  const currentScope = React.useRef(scope);
  currentScope.current = scope;
  const life = React.useRef<object | null>(null);
  const latest = React.useRef<Ticket | null>(null);
  const liveProps = React.useRef(props);
  liveProps.current = props;
  const [view, setView] = React.useState<View | null>(null);
  const current = (ticket: Ticket) => ticket.active && life.current === ticket.life &&
    latest.current === ticket && currentScope.current === ticket.scope;
  const outcomeCurrent = (ticket: Ticket, outcome: LessonProgressWriteOutcome) => {
    if (!current(ticket) || outcome.userId !== ticket.scope.userId ||
      outcome.lessonId !== ticket.scope.lessonId || outcome.status !== "completed") return false;
    try { return outcome.isCurrent() === true && current(ticket); } catch { return false; }
  };
  const retire = (ticket: Ticket | null) => {
    if (!ticket) return;
    ticket.active = false;
    if (latest.current === ticket) latest.current = null;
  };
  React.useLayoutEffect(() => {
    const mounted = {};
    life.current = mounted;
    return () => {
      if (life.current === mounted) life.current = null;
      retire(latest.current);
    };
  }, []);
  React.useLayoutEffect(() => () => {
    if (latest.current?.scope === scope) retire(latest.current);
  }, [scope]);
  const publish = (ticket: Ticket, state: View["state"], outcome?: LessonProgressWriteOutcome) => {
    const allowed = () => current(ticket) && (!outcome || outcomeCurrent(ticket, outcome));
    if (!allowed()) return;
    setView(previous => allowed() ? { ticket, state, outcome } : previous);
  };
  const context = (ticket: Ticket, outcome: LessonProgressWriteOutcome): AiCompletionContext => ({
    userId: outcome.userId!, lessonId: outcome.lessonId, operationId: outcome.operationId!,
    actionContextKey: ticket.scope.key,
    isCurrent: () => outcomeCurrent(ticket, outcome),
  });
  const invoke = (ticket: Ticket, outcome: LessonProgressWriteOutcome, effect?: (value: AiCompletionContext) => void) => {
    if (!effect || !outcomeCurrent(ticket, outcome)) return;
    // Callback transports are separate from the already acknowledged progress write.
    try { effect(context(ticket, outcome)); } catch { /* Do not relabel the progress receipt. */ }
  };
  const navigate = (ticket: Ticket, outcome: LessonProgressWriteOutcome) => {
    if (ticket.navigated || !liveProps.current.onContinue || !outcomeCurrent(ticket, outcome)) return;
    ticket.navigated = true;
    publish(ticket, "confirmed", outcome);
    invoke(ticket, outcome, liveProps.current.onContinue);
  };
  async function complete(wantsContinue: boolean) {
    const mounted = life.current;
    if (!mounted || !scope.userId || scope.loading || scope.disabled || !props.progress.isLoaded) return;
    const previous = latest.current;
    if (previous && current(previous)) {
      if (previous.pending) return;
      if (previous.receipt?.kind === "acknowledged" && outcomeCurrent(previous, previous.receipt)) {
        if (wantsContinue) navigate(previous, previous.receipt);
        return;
      }
    }
    retire(previous);
    const ticket: Ticket = { scope, life: mounted, active: true, pending: true,
      wantsContinue, effectsIssued: false, navigated: false };
    latest.current = ticket;
    publish(ticket, "pending");
    let outcome: LessonProgressWriteOutcome;
    try {
      outcome = await props.progress.setStatusWithOutcome(scope.lessonId, "completed");
    } catch {
      if (current(ticket)) {
        ticket.pending = false;
        publish(ticket, "unconfirmed");
      }
      return;
    }
    if (!current(ticket)) return;
    ticket.pending = false;
    if (!outcomeCurrent(ticket, outcome)) {
      retire(ticket);
      setView(previousView => previousView?.ticket === ticket ? null : previousView);
      return;
    }
    if (outcome.kind !== "acknowledged" || outcome.operationId === null) {
      publish(ticket, "unconfirmed", outcome);
      return;
    }
    ticket.receipt = outcome;
    publish(ticket, "confirmed", outcome);
    if (!ticket.effectsIssued) {
      ticket.effectsIssued = true;
      invoke(ticket, outcome, liveProps.current.onRecordActivity);
      invoke(ticket, outcome, liveProps.current.onLessonCompleted);
      invoke(ticket, outcome, liveProps.current.onConfirmed);
    }
    if (ticket.wantsContinue) navigate(ticket, outcome);
  }
  const visible = view && current(view.ticket) &&
    (!view.outcome || outcomeCurrent(view.ticket, view.outcome)) &&
    (view.state !== "pending" || view.ticket.pending) ? view : null;
  const state = visible?.state ?? "idle";
  const ready = !!scope.userId && !scope.loading && !scope.disabled && props.progress.isLoaded;
  const copy = COPY[locale];
  return (
    <section data-owned-completion-state={state} dir={locale === "en" ? "ltr" : "rtl"}>
      {state === "unconfirmed" ? <p role="alert">{copy.unconfirmed}</p> :
        state !== "idle" ? <p role="status" aria-live="polite">{state === "pending" ? copy.pending : copy.confirmed}</p> : null}
      <div className="flex gap-2">
        <Button type="button" variant="glass" size="sm"
          disabled={!ready || state === "pending" || state === "confirmed"}
          onClick={() => { void complete(false); }}>{props.completeLabel}</Button>
        {props.onContinue && <Button type="button" variant="violet" size="sm"
          disabled={!ready || state === "pending" || !!visible?.ticket.navigated}
          onClick={() => { void complete(true); }}>{props.continueLabel}</Button>}
      </div>
    </section>
  );
}
