import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { assistantScopeKey, type AssistantAdapter, type AssistantCitation,
  type AssistantScope } from "@/lib/card-assistant/types";
import { getUiString } from "@/lib/locale/ui-strings";
import { historyKey, readHistory, writeHistory, type ConversationTurn } from "@/lib/card-assistant/history";
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

/** The same learner interface for every area; adapters own access and grounding. */
export function AssistantConversationPanel(props: AssistantConversationPanelProps) {
  return <Conversation key={assistantScopeKey(props.scope, props.accountId)} {...props} />;
}

function Conversation({ scope, accountId, cardTitle, ask, disabledReason, onCitation, compact }: AssistantConversationPanelProps) {
  const t = (key: Parameters<typeof getUiString>[1]) => getUiString(scope.locale, key);
  const copy = { title: t("sidebar.assistant"), scope: t("assistant.panel.scope.note"),
    question: t("assistant.panel.query.label"), send: t("assistant.panel.submit.cta"), loading: t("assistant.panel.submit.loading"),
    sources: t("assistant.panel.response.sources"), unavailable: t("assistant.panel.error.connection"),
    signIn: t("assistant.panel.error.auth"), limited: t("assistant.panel.error.quota"), denied: t("assistant.panel.error.access") };
  const id = useId();
  const alive = useRef(true);
  const pending = useRef(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const storageKey = accountId ? historyKey(scope, accountId) : null;
  const [turns, setTurns] = useState<ConversationTurn[]>(() => readHistory(storageKey));
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const question = query.trim();
    if (pending.current || !accountId || disabledReason || question.length < 2) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const reply = await ask({ scope, query: question, requestId: crypto.randomUUID(),
        history: turns.slice(-3).map(({ question, answer }) => ({ question: question.slice(0, 500), answer: answer.slice(0, 1200) })) });
      if (!alive.current) return;
      if (reply.status !== 200 || typeof reply.answer !== "string" || !reply.answer.trim() || reply.answer.length > 16000 ||
        !Array.isArray(reply.citations) || reply.citations.length > 12 || reply.citations.some(citation => !citation ||
          [citation.id, citation.label, citation.stepId, citation.sourceId].some(value => typeof value !== "string" || value.length > 500))) {
        setError(reply.status === 401 ? copy.signIn : reply.status === 403 ? copy.denied : reply.status === 429 ? copy.limited
          : reply.status === 422 ? t("assistant.panel.error.grounding") : copy.unavailable);
        return;
      }
      const next = [...turns.slice(-19), { question, answer: reply.answer, citations: reply.citations }];
      writeHistory(storageKey, next);
      setTurns(next);
      setQuery("");
    } catch (cause) {
      if (alive.current) setError(cause instanceof AssistantRequestError ? cause.message : copy.unavailable);
    } finally {
      if (alive.current) { pending.current = false; setBusy(false); }
    }
  }
  const blocked = disabledReason || (!accountId ? copy.signIn : undefined);
  return <section aria-label={copy.title} dir={scope.locale === "en" ? "ltr" : "rtl"} className={compact ? "space-y-3" : "space-y-4"}>
    <header><h2 className="text-lg font-bold">{copy.title}</h2>
      {cardTitle && <p className="mt-1 font-semibold">{cardTitle}</p>}
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{copy.scope}</p></header>
    <div role="log" aria-live="polite" aria-relevant="additions" className="space-y-4">
      {turns.map((turn, index) => <article key={index} className="space-y-3 rounded-xl border p-4">
        <p className="font-semibold whitespace-pre-wrap">{turn.question}</p>
        <AssistantAnswer text={turn.answer} />
        {turn.citations.length > 0 && <div className="text-sm"><p className="font-semibold">{copy.sources}</p>
          <ul className="mt-2 list-inside list-disc space-y-1">{turn.citations.map((citation, i) => <li key={`${citation.id}:${i}`}>
            {onCitation ? <button type="button" onClick={() => onCitation(citation)} className="text-primary underline">{citation.label}</button>
              : typeof citation.href === "string" && /^\/(?!\/)/.test(citation.href) && !/[\\\u0000-\u0020]/.test(citation.href)
                ? <a href={citation.href} className="text-primary underline">{citation.label}</a> : citation.label}
          </li>)}</ul></div>}
      </article>)}
    </div>
    {turns.length > 0 && <button type="button" disabled={busy} className="text-sm underline"
      onClick={() => { writeHistory(storageKey, []); setTurns([]); }}>{t("assistant.panel.history.clear")}</button>}
    <p className="text-xs text-muted-foreground">{t("assistant.panel.history.independent")}</p>
    {blocked && <p role="status" className="text-sm">{blocked}</p>}
    <form onSubmit={event => void submit(event)} className="space-y-3">
      <label htmlFor={id} className="block font-semibold">{copy.question}</label>
      <textarea id={id} value={query} onChange={event => setQuery(event.target.value)} maxLength={1500}
        rows={3} disabled={busy || !!blocked} placeholder={t("assistant.panel.query.placeholder")}
        className="w-full resize-y rounded-xl border bg-background p-3 disabled:opacity-60" />
      <button type="submit" disabled={busy || !!blocked || query.trim().length < 2}
        className="min-h-11 rounded-full bg-primary px-5 font-bold text-primary-foreground disabled:opacity-50">{busy ? copy.loading : copy.send}</button>
    </form>
    {busy && <p role="status" className="text-sm">{copy.loading}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </section>;
}
