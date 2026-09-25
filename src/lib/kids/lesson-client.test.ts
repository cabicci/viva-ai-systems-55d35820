import { describe, expect, it } from "vitest";
import { kidsSignupRedirect, parseAuthIntentSearch } from "./auth-intent";
import { parseProtectedLesson, parseProtectedPlayback } from "./lesson-client";

const accepted = {
  lesson: {
    locale: "ar-EG",
    title: "درس معتمد",
    quiz: [{ id: "q1", question: "سؤال", options: ["أ", "ب"] }],
  },
  citation: {
    product: "kids",
    levelId: "level-1",
    lessonNumber: 1,
    locale: "ar-EG",
    sourceSha256: "a".repeat(64),
  },
};

describe("Kids parent intent and protected lesson contract", () => {
  it("preserves only the Kids intent and routes email verification to a fixed internal path", () => {
    expect(parseAuthIntentSearch({ intent: "kids", locale: "en" })).toEqual({
      intent: "kids",
      locale: "en",
    });
    expect(
      parseAuthIntentSearch({ intent: "https://evil.test", locale: "en" }).intent,
    ).toBeUndefined();
    expect(kidsSignupRedirect("https://masaarat.ai", { intent: "kids", locale: "en" })).toBe(
      "https://masaarat.ai/kids?locale=en",
    );
  });

  it("rejects raw drafts, cross-level responses, and leaked educator notes or answer keys", () => {
    expect(parseProtectedLesson(accepted.lesson, "level-1", 1, "ar-EG")).toBeNull();
    expect(parseProtectedLesson(accepted, "level-1", 1, "ar-EG")?.title).toBe("درس معتمد");
    expect(parseProtectedLesson(accepted, "level-2", 1, "ar-EG")).toBeNull();
    expect(
      parseProtectedLesson(
        { ...accepted, lesson: { ...accepted.lesson, educatorNotes: "secret" } },
        "level-1",
        1,
        "ar-EG",
      ),
    ).toBeNull();
    expect(
      parseProtectedLesson(
        {
          ...accepted,
          lesson: {
            ...accepted.lesson,
            quiz: [{ ...accepted.lesson.quiz[0], answer: 0 }],
          },
        },
        "level-1",
        1,
        "ar-EG",
      ),
    ).toBeNull();
    expect(
      parseProtectedLesson(
        { ...accepted, lesson: { ...accepted.lesson, sampleAnswer: "secret" } },
        "level-1",
        1,
        "ar-EG",
      ),
    ).toBeNull();
  });

  it("accepts only a short-lived signed Kids library embed from Bunny", () => {
    const expires = Math.floor(Date.now() / 1000) + 250;
    const suffix = `/embed/761387/123e4567-e89b-12d3-a456-426614174000?token=${"a".repeat(64)}&expires=${expires}`;
    const good = { embedUrl: `https://player.mediadelivery.net${suffix}`, expires };
    expect(parseProtectedPlayback(good)).toBe(good.embedUrl);
    expect(
      parseProtectedPlayback({ ...good, embedUrl: `https://example.com${suffix}` }),
    ).toBeNull();
    expect(
      parseProtectedPlayback({ ...good, embedUrl: good.embedUrl + "&next=https://example.com" }),
    ).toBeNull();
    expect(parseProtectedPlayback({ ...good, expires: expires - 251 })).toBeNull();
  });
});
