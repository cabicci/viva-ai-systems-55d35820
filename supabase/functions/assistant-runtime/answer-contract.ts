/** Provider output is a decision about this question, never a source of citation metadata. */
export type AssistantAnswerDecision = {
  grounding: "supported" | "insufficient" | "out_of_scope";
  answer: string;
  sourceIds: string[];
};

export const ASSISTANT_ANSWER_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "masaarat_grounded_answer",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        grounding: { type: "string", enum: ["supported", "insufficient", "out_of_scope"] },
        answer: { type: "string", minLength: 1, maxLength: 16000 },
        sourceIds: { type: "array", items: { type: "string" }, maxItems: 8 },
      },
      required: ["grounding", "answer", "sourceIds"],
    },
  },
} as const;

/** Per-request strict schema: sourceIds may only be exact admitted chunk IDs, so the
 * provider cannot emit lookalike IDs. The handler still rejects any unknown ID. */
export function buildAssistantAnswerFormat(admittedSourceIds: readonly string[]) {
  const ids = [...new Set(admittedSourceIds.filter(id => typeof id === "string" && id.trim() !== "" && id.length <= 512))];
  if (ids.length === 0) return ASSISTANT_ANSWER_FORMAT;
  const base = ASSISTANT_ANSWER_FORMAT.json_schema;
  return {
    type: "json_schema",
    json_schema: {
      ...base,
      schema: {
        ...base.schema,
        properties: {
          ...base.schema.properties,
          sourceIds: { type: "array", items: { type: "string", enum: ids }, maxItems: Math.min(8, ids.length) },
        },
      },
    },
  } as const;
}

/** Validate independently of provider schema enforcement; no legacy text fallback. */
export function parseAssistantAnswer(raw: string): AssistantAnswerDecision | null {
  try {
    if (typeof raw !== "string" || raw.length > 24000) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const obj = value as Record<string, unknown>;
    if (Object.keys(obj).length !== 3 ||
      (obj.grounding !== "supported" && obj.grounding !== "insufficient" && obj.grounding !== "out_of_scope") ||
      typeof obj.answer !== "string" || !obj.answer.trim() || obj.answer.length > 16000 ||
      !Array.isArray(obj.sourceIds) || obj.sourceIds.length > 8 ||
      obj.sourceIds.some(id => typeof id !== "string" || !id.trim() || id.length > 512) ||
      new Set(obj.sourceIds).size !== obj.sourceIds.length) return null;
    if ((obj.grounding === "supported") !== (obj.sourceIds.length > 0)) return null;
    return { grounding: obj.grounding, answer: obj.answer.trim(), sourceIds: obj.sourceIds as string[] };
  } catch { return null; }
}

export const ASSISTANT_ANSWER_POLICY = `ANSWER CONTRACT (mandatory):
- Return only JSON {"grounding":"supported"|"insufficient"|"out_of_scope","answer":string,"sourceIds":string[]}.
- Decide whether the CURRENT QUESTION can be answered from the supplied lesson evidence. Retrieval similarity or the presence of sources alone does not establish answerability.
- First decide whether the CURRENT QUESTION concerns the selected course subject. If it is clearly unrelated, you MUST return grounding="out_of_scope" with sourceIds=[]. Do not label a clearly unrelated question "insufficient". If the question concerns the course but its requested answer is absent, use "insufficient" instead. Weak retrieval alone does not make a relevant question outside-course.
- Use grounding="insufficient" for a relevant question with missing or insufficient evidence, or whenever scope is uncertain. For both non-supported outcomes, give a brief refusal/clarification and sourceIds=[]. Never cite lessons merely to explain a refusal or suggest a different topic.
- Use grounding="supported" only when the evidence actually supplies the fact or explanation requested by the CURRENT QUESTION. A statement that the requested information is missing is a refusal, not a supported answer. If a requested name, number, identity or other detail is absent, return grounding="insufficient" and sourceIds=[], even if a source explicitly says that detail is not named. Never cite a passage merely to confirm that it does not answer the question.
- For supported answers, sourceIds must contain only the exact id values of evidence items used to answer the question, never titles, E# labels, links, or invented IDs. Omit unused retrieved items.
- Previous exchanges may clarify a follow-up, but cannot supply facts, answerability, or citations. A new unrelated question must not inherit the previous answer's support.
- Never add an unsupported answer to a refusal. Preserve all scope, locale, untrusted-data and learning-safety rules above.`;
