import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { courseStepRoute } from "@/lib/course-system/contract";
import { askCardAssistant } from "@/lib/card-assistant/assistant.functions";
import { registeredStep } from "@/lib/card-assistant/registry";
import type { SupportedLocale } from "@/lib/locale/types";
import { AssistantConversationPanel } from "./AssistantConversationPanel";

/** One source adapter mount for all existing/future registered Kids/Tech cards. */
export function CardPathAssistant({ area, cardId, stepId, locale, profileId, compact }: {
  area: "kids" | "technical"; cardId: string; stepId: string; locale: SupportedLocale; profileId?: string; compact?: boolean;
}) {
  const { user } = useAuth();
  const ask = useServerFn(askCardAssistant);
  registeredStep(area, cardId, stepId);
  return <AssistantConversationPanel accountId={user?.id} compact={compact}
    scope={{ area, cardId, stepId, locale, ...(profileId ? { profileId } : {}) }}
    ask={async ({ query, requestId, history }) => {
      if (!user?.id) return { status: 401 };
      const reply = await ask({ data: {
        scope: { area, cardId, stepId, locale, ...(profileId ? { profileId } : {}) },
        query, requestId, history, expectedAccountId: user.id,
      } });
      return { ...reply, citations: reply.citations?.map(citation => ({ ...citation,
        href: `${courseStepRoute(area, cardId, citation.stepId)}?locale=${encodeURIComponent(locale)}` })) };
    }} />;
}
