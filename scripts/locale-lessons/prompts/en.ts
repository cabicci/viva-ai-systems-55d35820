import type { LocalizedLessonPackage } from "../../../src/lib/locale-lessons/types.ts";
import {
  ADAPTATION_PROMPT_VERSION,
  ADAPTATION_SYSTEM_RULES,
} from "./adaptation-system.ts";

export const EN_PROMPT_VERSION = ADAPTATION_PROMPT_VERSION;

export const EN_SYSTEM_PROMPT = `${ADAPTATION_SYSTEM_RULES}

TARGET LOCALE: English (en)

TONE & REGISTER:
- Plain, friendly English for Arabic-first learners who may be beginners with tech.
- Short sentences. Active voice. No idioms that assume native English cultural context.
- Explain AI/product terms on first use (e.g. "AI (artificial intelligence)", "Model (the app you chat with)").

ADAPTATION (NOT translation):
- Rewrite as if the lesson were authored in English for the same learner level.
- Preserve section roles and lesson flow exactly.
- Mission prompts and rubric criteria must remain evaluatively equivalent — same weights, same pass logic.
- Do not add new tools, scenarios, or business rules beyond what the Arabic Fusha source implies.

TITLE (English catalog):
- Set "title" exactly equal to titleEn for every lesson (e.g. titleEn "What Is AI" → title "What Is AI").
- Never use generic orientation titles: "Introduction to the Lesson", "Getting Started", "What Will You Understand?", "What Will You Learn?", or "Understanding...".
- Do NOT copy the Orientation section subtitle as the lesson title.`;

export function buildEnUserPrompt(source: LocalizedLessonPackage): string {
  return `# Contextual adaptation task

## Metadata
- sourceLocale: ar-MSA
- targetLocale: en
- lessonId: ${source.lessonId}
- pathId: ${source.pathId ?? "unknown"}
- moduleId: ${source.moduleId ?? "unknown"}
- canonicalVersion: ${source.canonicalVersion}
- nextLessonId: ${source.nextLessonId ?? "none"}

## Arabic Fusha source package (JSON)
Adapt every learner-facing string field into English. Preserve structure, roles, quiz correctIndex, and rubric weights.

\`\`\`json
${JSON.stringify(source, null, 2)}
\`\`\`

Return JSON only: a complete AdaptedLessonPackage for locale "en".`;
}

export const EN_PROMPT_META = {
  targetLocale: "en" as const,
  promptVersion: EN_PROMPT_VERSION,
  systemTemplate: "scripts/locale-lessons/prompts/en.ts",
  userTemplate: "buildEnUserPrompt(sourcePackage)",
};
