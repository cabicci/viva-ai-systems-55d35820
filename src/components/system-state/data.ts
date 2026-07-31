import type { UiStringKey } from "@/lib/locale/ui-strings";
import type { Status } from "./types";

export const ROUTES: {
  path: string;
  titleKey: UiStringKey;
  purposeKey: UiStringKey;
  status: Status;
}[] = [
  {
    path: "/",
    titleKey: "systemState.route.landing.title",
    purposeKey: "systemState.route.landing.purpose",
    status: "live",
  },
  {
    path: "/login",
    titleKey: "systemState.route.login.title",
    purposeKey: "systemState.route.login.purpose",
    status: "live",
  },
  {
    path: "/signup",
    titleKey: "systemState.route.signup.title",
    purposeKey: "systemState.route.signup.purpose",
    status: "live",
  },
  {
    path: "/onboarding",
    titleKey: "systemState.route.onboarding.title",
    purposeKey: "systemState.route.onboarding.purpose",
    status: "partial",
  },
  {
    path: "/dashboard",
    titleKey: "systemState.route.dashboard.title",
    purposeKey: "systemState.route.dashboard.purpose",
    status: "live",
  },
  {
    path: "/curriculum",
    titleKey: "systemState.route.curriculum.title",
    purposeKey: "systemState.route.curriculum.purpose",
    status: "live",
  },
  {
    path: "/learn/$pathId/$lessonId",
    titleKey: "systemState.route.learn.title",
    purposeKey: "systemState.route.learn.purpose",
    status: "live",
  },
  {
    path: "/ai-assistant",
    titleKey: "systemState.route.aiAssistant.title",
    purposeKey: "systemState.route.aiAssistant.purpose",
    status: "live",
  },
  {
    path: "/system-state",
    titleKey: "systemState.route.systemState.title",
    purposeKey: "systemState.route.systemState.purpose",
    status: "live",
  },
  {
    path: "/assistant-runtime",
    titleKey: "systemState.route.assistantRuntime.title",
    purposeKey: "systemState.route.assistantRuntime.purpose",
    status: "live",
  },
];

export const GAPS: {
  titleKey: UiStringKey;
  bodyKey: UiStringKey;
}[] = [
  {
    titleKey: "systemState.gap.sequentialUnlocks.title",
    bodyKey: "systemState.gap.sequentialUnlocks.body",
  },
  {
    titleKey: "systemState.gap.pathIntegration.title",
    bodyKey: "systemState.gap.pathIntegration.body",
  },
  {
    titleKey: "systemState.gap.missionPersistence.title",
    bodyKey: "systemState.gap.missionPersistence.body",
  },
  {
    titleKey: "systemState.gap.buildLogs.title",
    bodyKey: "systemState.gap.buildLogs.body",
  },
  {
    titleKey: "systemState.gap.workflow.title",
    bodyKey: "systemState.gap.workflow.body",
  },
  {
    titleKey: "systemState.gap.multimodal.title",
    bodyKey: "systemState.gap.multimodal.body",
  },
];
