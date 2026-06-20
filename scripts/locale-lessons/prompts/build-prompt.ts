import type {
  AdaptationTargetLocale,
  LocalizedLessonPackage,
} from "../../../src/lib/locale-lessons/types.ts";
import {
  AR_GULF_PROMPT_META,
  AR_GULF_SYSTEM_PROMPT,
  buildArGulfUserPrompt,
} from "./ar-gulf.ts";
import {
  EN_PROMPT_META,
  EN_SYSTEM_PROMPT,
  buildEnUserPrompt,
} from "./en.ts";

export interface AdaptationPromptBundle {
  targetLocale: AdaptationTargetLocale;
  systemPrompt: string;
  userPrompt: string;
  meta: typeof AR_GULF_PROMPT_META | typeof EN_PROMPT_META;
}

export function buildAdaptationPrompt(
  targetLocale: AdaptationTargetLocale,
  source: LocalizedLessonPackage,
): AdaptationPromptBundle {
  if (targetLocale === "ar-Gulf") {
    return {
      targetLocale,
      systemPrompt: AR_GULF_SYSTEM_PROMPT,
      userPrompt: buildArGulfUserPrompt(source),
      meta: AR_GULF_PROMPT_META,
    };
  }

  return {
    targetLocale,
    systemPrompt: EN_SYSTEM_PROMPT,
    userPrompt: buildEnUserPrompt(source),
    meta: EN_PROMPT_META,
  };
}
