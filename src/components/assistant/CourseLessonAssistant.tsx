import { inheritedCoursePlatform } from "@/lib/course-system/contract";
import type { SupportedLocale } from "@/lib/locale/types";
import type { AssistantContextOverride } from "@/lib/assistant/resolve-assistant-learner-context";
import { getUiString } from "@/lib/locale/ui-strings";
import { FloatingAssistantLauncher } from "@/components/learn/FloatingAssistantLauncher";
import { AcademicAssistantPanel } from "@/components/academic-education/AcademicAssistantPanel";
import { AssistantPanel } from "./AssistantPanel";
import { CardPathAssistant } from "./CardPathAssistant";
import { useAuth } from "@/lib/auth-context";
import { LessonAssistantAccess } from "./LessonAssistantAccess";

type Props = { locale: SupportedLocale } & (
  | { area: "ai"; contextOverride: AssistantContextOverride | null; pathId: string; lessonId: string }
  | { area: "kids"; cardId: string; stepId: string; profileId: string;
      assistantInitiallyOpen?: boolean; onAssistantOpenChange?: (open: boolean) => void;
      assistantAvailable?: boolean; assistantIsCurrent?: () => boolean; assistantDeliveryKey?: number }
  | { area: "technical"; cardId: string; stepId: string }
  | { area: "academic"; cardId: string; stepId: string }
);

/** Installed by generic lesson engines, never supplied by course content.
 * The native authenticated transports remain authoritative for all access. */
export function CourseLessonAssistant(props: Props) {
  const { user } = useAuth();
  inheritedCoursePlatform(props.area);
  const scopeMissing = props.area === "ai"
    ? !props.contextOverride || !props.contextOverride.currentModuleId ||
      props.contextOverride.currentPathId !== props.pathId ||
      props.contextOverride.currentLessonId !== props.lessonId
    : !props.cardId || !props.stepId || (props.area === "kids" && !props.profileId);
  const scopeKey = JSON.stringify([user?.id ?? null, props.area, props.locale,
    props.area === "ai" ? props.pathId ?? props.contextOverride?.currentPathId : props.cardId,
    props.area === "ai" ? props.lessonId ?? props.contextOverride?.currentLessonId : props.stepId,
    props.area === "kids" ? props.profileId : null]);
  return <FloatingAssistantLauncher key={scopeKey} fabLabel={getUiString(props.locale, "learn.assistant.fab")}
    fabAriaLabel={getUiString(props.locale, "learn.assistant.fabAria")} panelTitle={getUiString(props.locale, "sidebar.assistant")}
    {...(props.area === "kids" ? { initialOpen: props.assistantInitiallyOpen, onOpenChange: props.onAssistantOpenChange,
      panelAvailable: props.assistantAvailable, isPanelAvailable: props.assistantIsCurrent } : {})}>
    {props.area === "kids" && props.assistantAvailable === false ? null : !user?.id || scopeMissing ? <p role="alert">{getUiString(props.locale, !user?.id
      ? "assistant.panel.error.auth" : "assistant.panel.scope.open")}</p> :
    props.area === "academic" ? <AcademicAssistantPanel courseId={props.cardId} lessonId={props.stepId} locale={props.locale} /> :
      props.area === "ai" ? <LessonAssistantAccess pathId={props.pathId} lessonId={props.lessonId} locale={props.locale}>
        <AssistantPanel compact contextOverride={props.contextOverride} />
      </LessonAssistantAccess> :
      <CardPathAssistant key={props.area === "kids" ? props.assistantDeliveryKey : undefined} area={props.area} cardId={props.cardId} stepId={props.stepId} locale={props.locale}
        {...(props.area === "kids" ? { profileId: props.profileId } : {})} compact />}
  </FloatingAssistantLauncher>;
}
