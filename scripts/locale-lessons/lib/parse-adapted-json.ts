import type { AdaptedLessonPackage } from "../../../src/lib/locale-lessons/types.ts";

export class AdaptedLessonJsonParseError extends Error {
  readonly parseMessage: string;

  constructor(parseMessage: string) {
    super(parseMessage);
    this.name = "AdaptedLessonJsonParseError";
    this.parseMessage = parseMessage;
  }
}

export function extractAdaptedJsonText(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new AdaptedLessonJsonParseError("Provider response was empty");
  }

  const fenced = trimmed.match(/```(?:json)?\s*\r?\n([\s\S]*?)```/i);
  if (fenced?.[1]?.trim()) {
    return fenced[1].trim();
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new AdaptedLessonJsonParseError(
      "Provider response did not contain a JSON object",
    );
  }

  return trimmed.slice(start, end + 1);
}

export function parseAdaptedLessonJson(raw: string): AdaptedLessonPackage {
  const jsonText = extractAdaptedJsonText(raw);
  try {
    return JSON.parse(jsonText) as AdaptedLessonPackage;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new AdaptedLessonJsonParseError(message);
  }
}

export function formatAdaptationJsonParseFailure(input: {
  targetLocale: string;
  lessonId: string;
  attempt: number;
  maxAttempts: number;
  parseError: string;
  provider?: string;
}): string {
  const provider = input.provider ?? "Anthropic";
  return (
    `${provider} adaptation JSON parse failed for ` +
    `locale=${input.targetLocale} ` +
    `lessonId=${input.lessonId} ` +
    `attempt=${input.attempt}/${input.maxAttempts}: ` +
    input.parseError
  );
}
