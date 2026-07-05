import type { UiStringKey } from "./ui-strings";

/** Curriculum page card chrome keys (not path/module/lesson titles). */
export const CURRICULUM_UI_KEYS = [
  "curriculum.path.startHereBadge",
  "curriculum.path.introHelper",
  "curriculum.path.introductionEyebrow",
  "curriculum.path.pathEyebrow",
  "curriculum.path.comingSoon",
  "curriculum.path.progressLabel",
  "curriculum.path.emptyModule",
  "curriculum.module.eyebrow",
  "curriculum.module.technicalBadge",
  "curriculum.lesson.masteryLocked",
  "curriculum.footer.builderPrompt",
  "curriculum.footer.builderCta",
] as const satisfies readonly UiStringKey[];

export const LEARN_GATE_UI_KEYS = [
  "learn.paywall.title",
  "learn.paywall.body",
  "learn.paywall.activatePro",
  "learn.paywall.backToDashboard",
  "learn.paywall.pathFooter",
  "learn.introGate.title",
  "learn.introGate.body",
  "learn.introGate.remaining",
  "learn.introGate.startIntro",
] as const satisfies readonly UiStringKey[];

export const LEARNER_CHROME_12_5D_A_KEYS = [
  ...CURRICULUM_UI_KEYS,
  ...LEARN_GATE_UI_KEYS,
  "dashboard.progress.percentValue",
] as const satisfies readonly UiStringKey[];
