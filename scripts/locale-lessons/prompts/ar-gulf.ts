import type { LocalizedLessonPackage } from "../../../src/lib/locale-lessons/types.ts";
import {
  ADAPTATION_PROMPT_VERSION,
  ADAPTATION_SYSTEM_RULES,
} from "./adaptation-system.ts";

export const AR_GULF_PROMPT_VERSION = ADAPTATION_PROMPT_VERSION;

export const AR_GULF_SYSTEM_PROMPT = `${ADAPTATION_SYSTEM_RULES}

TARGET LOCALE: Gulf Arabic (ar-Gulf)

TONE & REGISTER:
- Natural Gulf Arabic suitable for learners in the GCC — warm, clear, conversational MSA-Gulf blend.
- Avoid Egyptian dialect surface forms (e.g. إيه، دلوقتي، عايز، كده).
- Prefer Gulf-natural phrasing while staying professional and beginner-friendly.
- Keep English product terms where Gulf learners commonly use them (ChatGPT, API, Dashboard) with brief Arabic gloss on first use when helpful.

ADAPTATION (NOT translation):
- Rewrite each section so it sounds like it was originally written for Gulf learners.
- Preserve the same teaching beats: orientation → tension → core → glossary → quiz → mission → close.
- Mission and rubric criteria must remain evaluatively equivalent to the Arabic Fusha source.`;

export function buildArGulfUserPrompt(source: LocalizedLessonPackage): string {
  return `# Contextual adaptation task

## Metadata
- sourceLocale: ar-MSA
- targetLocale: ar-Gulf
- lessonId: ${source.lessonId}
- pathId: ${source.pathId ?? "unknown"}
- moduleId: ${source.moduleId ?? "unknown"}
- canonicalVersion: ${source.canonicalVersion}
- nextLessonId: ${source.nextLessonId ?? "none"}

## Arabic Fusha source package (JSON)
Adapt every learner-facing string field. Preserve structure, roles, quiz correctIndex, and rubric weights.

\`\`\`json
${JSON.stringify(source, null, 2)}
\`\`\`

Return JSON only: a complete AdaptedLessonPackage for locale "ar-Gulf".`;
}

export const AR_GULF_PROMPT_META = {
  targetLocale: "ar-Gulf" as const,
  promptVersion: AR_GULF_PROMPT_VERSION,
  systemTemplate: "scripts/locale-lessons/prompts/ar-gulf.ts",
  userTemplate: "buildArGulfUserPrompt(sourcePackage)",
};
