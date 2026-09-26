import { useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { PATHS } from "@/lib/curriculum-data";
import { useLearnerContext } from "@/lib/learner-context";
import { useLocale } from "@/lib/locale/locale-context";
import { getUiString } from "@/lib/locale/ui-strings";
import {
  buildAssistantRuntimePayload,
  resolveAssistantLearnerContext,
  type AssistantContextOverride,
} from "@/lib/assistant/resolve-assistant-learner-context";
import { callAssistantRuntime } from "@/lib/assistant-runtime";
import {
  appendAssistantTurn,
  clearAssistantHistory,
  getAssistantSessionVersion,
  loadAssistantHistory,
  setAssistantSession,
  useAssistantSession,
  type AssistantCitation,
  type AssistantTurn,
} from "@/lib/assistant-session-store";

interface Props {
  /** When true, hides the Context Status Card (e.g. when used inside a lesson sheet). */
  compact?: boolean;
  /** Localized package page override — titles and mission from active JSON package. */
  contextOverride?: AssistantContextOverride | null;
}

export function AssistantPanel({ compact = false, contextOverride = null }: Props) {
  const ctx = useLearnerContext();
  const { user } = useAuth();
  const { locale, dir } = useLocale();
  const { query, loading, error, response, turns = [] } = useAssistantSession();

  const resolvedContext = useMemo(
    () => resolveAssistantLearnerContext(locale, ctx, contextOverride),
    [locale, ctx, contextOverride],
  );

  useEffect(() => {
    if (!compact && user?.id) loadAssistantHistory(user.id);
  }, [compact, user?.id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading) return;
    const version = getAssistantSessionVersion();
    setAssistantSession({ loading: true, error: null });
    try {
      const res = await callAssistantRuntime(buildAssistantRuntimePayload(q, resolvedContext));
      if (version !== getAssistantSessionVersion()) return;
      setAssistantSession({ response: res, query: "" });
      if (!compact && user?.id) {
        const seenLessons = new Set<string>();
        const citations: AssistantCitation[] = (res.citations ?? [])
          .filter(
            (citation) =>
              typeof citation.lessonId === "string" &&
              typeof citation.title === "string" &&
              typeof citation.excerpt === "string",
          )
          .filter((citation) => {
            if (seenLessons.has(citation.lessonId)) return false;
            seenLessons.add(citation.lessonId);
            return true;
          })
          .map((citation) => ({
            lessonId: citation.lessonId,
            title: citation.title,
            excerpt: citation.excerpt,
            productionRoute: citation.productionRoute,
          }));
        appendAssistantTurn(user.id, { query: q, answer: res.answer ?? res.message, citations });
      }
    } catch (err) {
      if (version !== getAssistantSessionVersion()) return;
      setAssistantSession({
        error:
          err instanceof Error
            ? err.message
            : getUiString(locale, "assistant.panel.error.connection"),
      });
    } finally {
      if (version === getAssistantSessionVersion()) setAssistantSession({ loading: false });
    }
  }

  const completedLabel = getUiString(locale, "assistant.panel.context.completedValue")
    .replace("{completed}", String(resolvedContext.completedLessonsCount))
    .replace("{total}", String(resolvedContext.totalLessonsCount));
  const nextLesson = !compact ? ctx.overallNextLesson : null;
  const nextPath = nextLesson
    ? PATHS.find((path) =>
        path.modules.some((module) => module.lessons.some((lesson) => lesson.id === nextLesson.id)),
      )
    : null;

  return (
    <div dir={dir} className="space-y-6">
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
                  {nextLesson && nextPath ? (
                    <Link
                      to="/learn/$pathId/$lessonId"
                      params={{ pathId: nextPath.id, lessonId: nextLesson.id }}
                      search={{ locale }}
                      className="text-primary underline"
                    >
                      {resolvedContext.nextLessonTitle}
                    </Link>
                  ) : (
                    resolvedContext.nextLessonTitle
                  )}
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

      <form onSubmit={onSubmit} className="space-y-3">
        <label htmlFor="assistant-query" className="block text-sm font-medium">
          {getUiString(locale, "assistant.panel.query.label")}
        </label>
        <Textarea
          id="assistant-query"
          value={query}
          onChange={(e) => setAssistantSession({ query: e.target.value })}
          placeholder={getUiString(locale, "assistant.panel.query.placeholder")}
          rows={compact ? 3 : 4}
          className="resize-none text-base"
          dir={dir}
        />
        <div className="flex justify-end">
          <Button type="submit" variant="hero" disabled={loading || !query.trim()}>
            {loading
              ? getUiString(locale, "assistant.panel.submit.loading")
              : getUiString(locale, "assistant.panel.submit.cta")}
          </Button>
        </div>
      </form>

      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5 text-sm text-destructive">
          {error}
        </Card>
      )}

      {!compact && turns.length > 0 && (
        <section
          aria-label={getUiString(locale, "assistant.panel.history.title")}
          className="space-y-4"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold">
              {getUiString(locale, "assistant.panel.history.title")}
            </h2>
            {user?.id && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => clearAssistantHistory(user.id)}
              >
                {getUiString(locale, "assistant.panel.history.clear")}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {getUiString(locale, "assistant.panel.history.independent")}
          </p>
          {turns.map((turn, index) => (
            <AssistantTurnCard key={index} turn={turn} locale={locale} />
          ))}
        </section>
      )}

      {compact && response && (
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {getUiString(locale, "assistant.panel.response.title")}
          </h2>

          {response.answer ? (
            <div className="rounded-md bg-muted/30 p-4 text-sm leading-loose whitespace-pre-wrap text-foreground">
              {response.answer}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">{response.message}</div>
          )}
          <AssistantSources citations={response.citations ?? []} locale={locale} />
        </Card>
      )}

      <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-6">
        {getUiString(locale, "assistant.panel.footer.note")}
      </p>
    </div>
  );
}

function AssistantTurnCard({
  turn,
  locale,
}: {
  turn: AssistantTurn;
  locale: import("@/lib/locale/types").SupportedLocale;
}) {
  return (
    <Card className="p-5 space-y-4">
      <p className="rounded-md bg-muted/30 p-3 text-sm whitespace-pre-wrap">{turn.query}</p>
      <div
        className="text-sm leading-loose whitespace-pre-wrap"
        aria-label={getUiString(locale, "assistant.panel.response.title")}
      >
        {turn.answer}
      </div>
      <AssistantSources citations={turn.citations} locale={locale} />
    </Card>
  );
}

function AssistantSources({
  citations,
  locale,
}: {
  citations: AssistantCitation[];
  locale: import("@/lib/locale/types").SupportedLocale;
}) {
  if (citations.length === 0) return null;
  return (
    <div className="border-t border-border pt-3 space-y-2">
      <h3 className="text-sm font-semibold">
        {getUiString(locale, "assistant.panel.response.sources")}
      </h3>
      <ul className="space-y-2 text-sm">
        {citations.map((citation, index) => {
          const route = citation.productionRoute;
          const href =
            route && /^\/learn\/[a-z0-9-]+\/[a-z0-9-]+$/.test(route)
              ? `${route}?locale=${locale}`
              : null;
          return (
            <li key={`${citation.lessonId}-${index}`}>
              {href ? (
                <a className="text-primary underline" href={href}>
                  {citation.title}
                </a>
              ) : (
                <span>{citation.title}</span>
              )}
              <p className="text-xs text-muted-foreground line-clamp-2">{citation.excerpt}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-foreground">{value}</dd>
    </div>
  );
}
