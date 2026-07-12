import { useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useLearnerContext } from "@/lib/learner-context";
import { useLocale } from "@/lib/locale/locale-context";
import { getUiString } from "@/lib/locale/ui-strings";
import {
  buildAssistantRuntimePayload,
  resolveAssistantLearnerContext,
  type AssistantContextOverride,
} from "@/lib/assistant/resolve-assistant-learner-context";
import { searchPlatformContent } from "@/lib/platform-retrieval";
import { callAssistantRuntime } from "@/lib/assistant-runtime";
import {
  setAssistantSession,
  useAssistantSession,
} from "@/lib/assistant-session-store";

interface Props {
  /** When true, hides the Context Status Card (e.g. when used inside a lesson sheet). */
  compact?: boolean;
  /** Localized package page override — titles and mission from active JSON package. */
  contextOverride?: AssistantContextOverride | null;
}

export function AssistantPanel({ compact = false, contextOverride = null }: Props) {
  const ctx = useLearnerContext();
  const { locale, dir } = useLocale();
  const { query, loading, error, response, matches } = useAssistantSession();

  const resolvedContext = useMemo(
    () => resolveAssistantLearnerContext(locale, ctx, contextOverride),
    [locale, ctx, contextOverride],
  );

  useEffect(() => {
    setAssistantSession({ query: "" });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading) return;
    setAssistantSession({ loading: true, error: null, query: "" });
    try {
      const retrievalResults = searchPlatformContent(q, {
        limit: 5,
        preferLessonId: resolvedContext.preferLessonId,
        preferPathId: resolvedContext.preferPathId,
      });
      const res = await callAssistantRuntime(
        buildAssistantRuntimePayload(q, resolvedContext, retrievalResults),
      );
      setAssistantSession({ matches: retrievalResults, response: res });
    } catch (err) {
      setAssistantSession({
        error:
          err instanceof Error
            ? err.message
            : getUiString(locale, "assistant.panel.error.connection"),
        response: null,
      });
    } finally {
      setAssistantSession({ loading: false });
    }
  }

  const completedLabel = getUiString(locale, "assistant.panel.context.completedValue")
    .replace("{completed}", String(resolvedContext.completedLessonsCount))
    .replace("{total}", String(resolvedContext.totalLessonsCount));

  return (
    <div dir={dir} className="space-y-6">
      {!compact && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {getUiString(locale, "assistant.panel.context.title")}
            </h2>
            <Badge
              variant={ctx.isReady ? "secondary" : "outline"}
              className="text-[10px]"
            >
              {ctx.isReady
                ? getUiString(locale, "assistant.panel.context.ready")
                : getUiString(locale, "assistant.panel.context.loading")}
            </Badge>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <ContextRow
              label={getUiString(locale, "assistant.panel.context.path")}
              value={resolvedContext.currentPathTitle ?? "—"}
            />
            <ContextRow
              label={getUiString(locale, "assistant.panel.context.module")}
              value={resolvedContext.currentModuleTitle ?? "—"}
            />
            <ContextRow
              label={getUiString(locale, "assistant.panel.context.lesson")}
              value={resolvedContext.currentLessonTitle ?? "—"}
            />
            <ContextRow
              label={getUiString(locale, "assistant.panel.context.completed")}
              value={completedLabel}
            />
            <ContextRow
              label={getUiString(locale, "assistant.panel.context.next")}
              value={resolvedContext.nextLessonTitle ?? "—"}
              full
            />
          </dl>
        </Card>
      )}

      {compact && (
        <div className="text-xs text-muted-foreground border border-border/60 rounded-md px-3 py-2 bg-muted/20">
          {resolvedContext.currentLessonTitle ? (
            <>
              {getUiString(locale, "assistant.panel.context.compactPrefix")}{" "}
              <span className="text-foreground">
                {resolvedContext.currentModuleTitle ?? "—"} /{" "}
                {resolvedContext.currentLessonTitle}
              </span>
            </>
          ) : (
            <>{getUiString(locale, "assistant.panel.context.compactEmpty")}</>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <Textarea
          value={query}
          onChange={(e) => setAssistantSession({ query: e.target.value })}
          placeholder={getUiString(locale, "assistant.panel.query.placeholder")}
          rows={compact ? 3 : 4}
          className="resize-none text-base"
          dir={dir}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="hero"
            disabled={loading || !query.trim()}
          >
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

      {response && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {getUiString(locale, "assistant.panel.response.title")}
            </h2>
            {!compact && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge
                  variant={response.contextDetected ? "secondary" : "outline"}
                  className="text-[10px]"
                >
                  {response.contextDetected ? "CONTEXT ✓" : "NO CONTEXT"}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  RETRIEVAL: {response.retrievalCount}
                </Badge>
                <Badge
                  variant={response.runtime === "connected" ? "secondary" : "outline"}
                  className="text-[10px]"
                >
                  {response.runtime.toUpperCase()}
                </Badge>
              </div>
            )}
          </div>

          {response.answer ? (
            <div className="rounded-md bg-muted/30 p-4 text-sm leading-loose whitespace-pre-wrap text-foreground">
              {response.answer}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">{response.message}</div>
          )}

          {!compact && matches.length > 0 && (
            <div className="pt-3 border-t border-border space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground">
                {getUiString(locale, "assistant.panel.response.related")}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {getUiString(locale, "assistant.panel.response.matchCount").replace(
                  "{count}",
                  String(matches.length),
                )}
              </p>
              <ul className="space-y-3">
                {matches.map((m, i) => (
                  <li
                    key={`${m.lessonId}-${i}`}
                    className="rounded-md border border-border/60 bg-muted/20 p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {m.lessonTitle}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {m.moduleTitle}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" className="text-[10px]">
                          {m.matchType}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-[10px] tabular-nums"
                        >
                          {m.relevanceScore.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {m.matchedText}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!compact && (
            <details className="pt-3 border-t border-border">
              <summary className="text-[11px] uppercase tracking-wider text-muted-foreground cursor-pointer select-none">
                Debug · Raw runtime payload
              </summary>
              <pre
                className="mt-2 text-[11px] text-muted-foreground bg-muted/20 p-3 rounded-md overflow-x-auto leading-relaxed"
                dir="ltr"
              >
                {JSON.stringify(response, null, 2)}
              </pre>
            </details>
          )}
        </Card>
      )}

      <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-6">
        {getUiString(locale, "assistant.panel.footer.note")}
      </p>
    </div>
  );
}

function ContextRow({
  label,
  value,
  full,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-foreground">{value}</dd>
    </div>
  );
}
