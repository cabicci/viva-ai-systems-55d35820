import { describe, expect, it } from "vitest";
import {
  AdaptedLessonJsonParseError,
  extractAdaptedJsonText,
  formatAdaptationJsonParseFailure,
  parseAdaptedLessonJson,
} from "../../../scripts/locale-lessons/lib/parse-adapted-json.ts";

const SYNTHETIC_CREDENTIAL = "synthetic-parser-test-credential";

describe("adapted lesson JSON parsing", () => {
  it("parses raw JSON objects", () => {
    const parsed = parseAdaptedLessonJson('{"locale":"en","lessonId":"intro-m1-l1-what-is-ai"}');
    expect(parsed.lessonId).toBe("intro-m1-l1-what-is-ai");
  });

  it("extracts JSON from ```json fences", () => {
    const raw = 'Here is the package:\n```json\n{"locale":"en","lessonId":"x"}\n```';
    expect(extractAdaptedJsonText(raw)).toBe('{"locale":"en","lessonId":"x"}');
    expect(parseAdaptedLessonJson(raw).lessonId).toBe("x");
  });

  it("extracts JSON from first { to last } when prose wraps the object", () => {
    const raw = 'Notes:\n{"locale":"en","lessonId":"x","title":"What Is AI"}\nDone.';
    expect(extractAdaptedJsonText(raw)).toBe('{"locale":"en","lessonId":"x","title":"What Is AI"}');
  });

  it("does not fake-repair incomplete JSON", () => {
    expect(() => parseAdaptedLessonJson('{"locale":"en","lessonId":}')).toThrow(
      AdaptedLessonJsonParseError,
    );
  });

  it("formats final parse failures with locale, lessonId, and attempt", () => {
    const message = formatAdaptationJsonParseFailure({
      targetLocale: "en",
      lessonId: "intro-m1-l1-what-is-ai",
      attempt: 3,
      maxAttempts: 3,
      parseError: "Expected '}'",
    });
    expect(message).toContain("locale=en");
    expect(message).toContain("lessonId=intro-m1-l1-what-is-ai");
    expect(message).toContain("attempt=3/3");
    expect(message).toContain("Expected '}'");
    expect(message).not.toContain(SYNTHETIC_CREDENTIAL);
    expect(message).not.toMatch(/x-api-key/i);
  });
});
