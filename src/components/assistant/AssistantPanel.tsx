import { useId, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { PATHS } from "@/lib/curriculum-data";
import { useLearnerContext } from "@/lib/learner-context";
import { useLocale } from "@/lib/locale/locale-context";
import { getUiString } from "@/lib/locale/ui-strings";
import { getCurriculumPathLabel } from "@/lib/locale-curriculum/resolve-curriculum-label";
import { buildAssistantRuntimePayload, resolveAssistantLearnerContext,
  type AssistantContextOverride } from "@/lib/assistant/resolve-assistant-learner-context";
import { callAssistantRuntime } from "@/lib/assistant-runtime";
import { AssistantConversationPanel } from "./AssistantConversationPanel";
import type { AssistantAdapter } from "@/lib/card-assistant/types";

interface Props { compact?: boolean; contextOverride?: AssistantContextOverride | null }

/** Area adapter only. Every card uses the shared conversation and history implementation. */
export function AssistantPanel({ compact = false, contextOverride = null }: Props) {
  const ctx = useLearnerContext();
  const { user } = useAuth();
  const { locale, dir } = useLocale();
  const [selectedCardId, setSelectedCardId] = useState<string>(ctx.currentPath?.id ?? "");
  const cardSelectId = useId();
  const resolvedContext = useMemo(() => {
    const resolved = resolveAssistantLearnerContext(locale, ctx, contextOverride);
    if (compact || contextOverride) return resolved;
    const path = PATHS.find(item => item.id === selectedCardId && item.status === "open");
    return { ...resolved, currentPath: path?.id ?? null,
      currentPathTitle: path ? getCurriculumPathLabel(locale, path.id, "title") : null,
      currentModule: null, currentModuleTitle: null, currentLesson: null, currentLessonTitle: null,
      currentMission: null, nextLessonTitle: null, preferPathId: path?.id ?? null, preferLessonId: null };
  }, [locale, ctx, contextOverride, compact, selectedCardId]);
  const ask: AssistantAdapter = async ({ query, history }) => {
    if (!resolvedContext.currentPath) return { status: 403 };
    const reply = await callAssistantRuntime(buildAssistantRuntimePayload(query, resolvedContext, history));
    if (reply.ok === false) return { status: 503 };
    return { status: 200, answer: reply.answer ?? reply.message,
      citations: (reply.citations ?? []).map(citation => ({
        id: citation.lessonId, label: citation.title, stepId: citation.lessonId, sourceId: citation.lessonId,
        ...(citation.productionRoute && /^\/learn\/[a-z0-9-]+\/[a-z0-9-]+$/.test(citation.productionRoute)
          ? { href: `${citation.productionRoute}?locale=${locale}` } : {}),
      })) };
  };
  const completedLabel = getUiString(locale, "assistant.panel.context.completedValue")
    .replace("{completed}", String(resolvedContext.completedLessonsCount))
    .replace("{total}", String(resolvedContext.totalLessonsCount));
  return <div dir={dir} className="space-y-6">
    {!compact && !contextOverride && <div className="space-y-2">
      <label htmlFor={cardSelectId} className="block text-sm font-medium">{getUiString(locale, "assistant.panel.scope.choose")}</label>
      <select id={cardSelectId} value={selectedCardId} onChange={event => setSelectedCardId(event.target.value)}
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

    <AssistantConversationPanel scope={{ area: "ai", cardId: resolvedContext.currentPath ?? "",
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
