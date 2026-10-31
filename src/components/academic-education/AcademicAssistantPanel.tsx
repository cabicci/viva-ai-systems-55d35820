import { useServerFn } from "@tanstack/react-start";
import { AssistantConversationPanel } from "@/components/assistant/AssistantConversationPanel";
import { askAcademicAssistant } from "@/lib/academic-education/assistant.functions";
import { useAuth } from "@/lib/auth-context";
import type { SupportedLocale } from "@/lib/locale/types";

/** Academic transport adapter; conversation, history and rendering are shared by all areas. */
export function AcademicAssistantPanel({ courseId, lessonId, locale }: {
  courseId: string; lessonId: string; locale: SupportedLocale;
}) {
  const { user } = useAuth();
  const askQuestion = useServerFn(askAcademicAssistant);
  return <AssistantConversationPanel accountId={user?.id}
    scope={{ area: "academic", cardId: courseId, stepId: lessonId, locale }}
    ask={async ({ scope, query, requestId, history }) => {
      if (!user?.id) return { status: 401 };
      if (scope.area !== "academic" || !scope.stepId) return { status: 400 };
      const data = await askQuestion({ data: { courseId: scope.cardId, lessonId: scope.stepId,
        locale: scope.locale, query, requestId, history, expectedAccountId: user.id } });
      const sources = Array.isArray(data.sources) ? data.sources : [];
      if (sources.some(source => !source || typeof source.lessonId !== "string" ||
        !/^AC-[A-Z0-9]+-M\d{2}-L\d{2}$/.test(source.lessonId) ||
        !source.lessonId.startsWith(`${scope.cardId}-`) || typeof source.sectionId !== "string"))
        return { status: 503 };
      return { status: data.status, answer: data.answer, error: data.error,
        citations: sources.map(source => ({ id: `${source.lessonId}:${source.sectionId}`,
          label: source.label || `${source.lessonId} — ${source.sectionId}`,
          stepId: source.lessonId, sourceId: source.sectionId,
          href: `/academic/learn/${encodeURIComponent(source.lessonId)}?locale=${scope.locale}` })) };
    }} />;
}
