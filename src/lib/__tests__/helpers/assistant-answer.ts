/** Fake provider response for existing scope/security tests; no network or model. */
export function groundedAnswerFixture(userPrompt: string, answer: string) {
  const sourceIds = [...new Set([...userPrompt.matchAll(/^\[E#\d+★?\] id=([^|\n]+) \|/gm)].map(match => match[1].trim()))];
  return { ok: true as const, answer: JSON.stringify({ grounding: "supported", answer, sourceIds }) };
}
