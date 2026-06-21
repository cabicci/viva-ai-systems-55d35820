export const STRICT_JSON_RETRY_INSTRUCTION = `STRICT OUTPUT REMINDER:
- Return ONE valid JSON object only.
- No markdown fences, no commentary, no trailing text before or after the JSON.
- Ensure every object, array, and string is properly closed.
- Do not truncate the response.`;

export const QUALITY_RETRY_QUIZ_RULES = `Fix quiz structure in every Quiz section:
- Include a clear learner-facing quiz.question (not a label like "Correct Answer" or "Quick Check").
- Provide enough quiz.options for the preserved correctIndex (zero-based indexing).
- correctIndex must be an integer >= 0 and strictly less than options.length.
- The correct answer text must appear as one of the options at quiz.options[correctIndex].
- Do not omit the correct option from the options array.
- Use at least 3 options when the source quiz expects a multiple-choice question (correctIndex >= 2 requires at least 3 options).`;

export const QUALITY_RETRY_FORBIDDEN_PHRASES = `No learner-facing metadata leaks:
- No correctIndex, Quiz key, or answer-key notes in contentMarkdown or bullets.
- Never use: "correct answer preserved from Egyptian production" / "preserved from the Egyptian production".
- Never use: "refer to the text above" / "refer to the source".
- Never reference source validation, internal keys, or Egyptian production in learner copy.
- Arabic forbidden: "الإجابة الصحيحة محفوظة من الإنتاج المصري" / "راجع النص أعلاه" / "راجع المصدر".`;

export function buildQualityRetryUserPrompt(input: {
  baseUserPrompt: string;
  qualityErrors: string[];
  attempt: number;
  maxAttempts: number;
  parseError?: string | null;
}): string {
  const sections = [input.baseUserPrompt];

  sections.push(`
QUALITY CORRECTION REQUIRED (attempt ${input.attempt}/${input.maxAttempts}):
Your previous JSON failed finalization/quality validation:
${input.qualityErrors.map((issue) => `- ${issue}`).join("\n")}

Regenerate valid JSON only — one complete AdaptedLessonPackage object.

${QUALITY_RETRY_QUIZ_RULES}

${QUALITY_RETRY_FORBIDDEN_PHRASES}
`);

  if (input.parseError?.trim()) {
    sections.push(`JSON PARSE ERROR FROM PRIOR ATTEMPT:\n${input.parseError.trim()}`);
  }

  sections.push(STRICT_JSON_RETRY_INSTRUCTION);

  return sections.join("\n");
}

export function buildStrictJsonRetryUserPrompt(userPrompt: string): string {
  return `${userPrompt}\n\n${STRICT_JSON_RETRY_INSTRUCTION}`;
}
