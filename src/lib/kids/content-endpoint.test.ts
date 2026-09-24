import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { handleKidsLessonContent } from "../../../supabase/functions/kids-lesson-content/handler";

const parent = "11111111-1111-4111-8111-111111111111";
const input = { profileId: parent, levelId: "level-2", lessonNumber: 7, locale: "ar-EG" };
const source = {
  locale: "ar-EG",
  title: "Learning safely",
  subtitle: "Practice",
  objectives: ["Try a plan"],
  educatorNotes: { sampleAnswer: "secret teacher solution" },
  quiz: [
    { id: "q1", question: "Choose", options: ["A", "B"], answer: 1, explanation: "Answer is B" },
  ],
  hints: [{ question: "How?", answer: "Use a plan", source: "concept" }],
};
const raw = JSON.stringify(source);
const sha = createHash("sha256").update(raw).digest("hex");
const env = (key: string) =>
  ({
    SUPABASE_URL: "https://db.example",
    SUPABASE_ANON_KEY: "anon",
    SUPABASE_SERVICE_ROLE_KEY: "service",
  })[key as "SUPABASE_URL"];
function request(body: unknown = input, authorization = "Bearer parent") {
  return new Request("https://db.example/functions/v1/kids-lesson-content", {
    method: "POST",
    headers: { Authorization: authorization, Origin: "https://masaarat.ai" },
    body: JSON.stringify(body),
  });
}
const json = (obj: unknown) => new Response(JSON.stringify(obj), { status: 200 });
function fetches(digest = sha) {
  return vi
    .fn()
    .mockResolvedValueOnce(json({ id: parent }))
    .mockResolvedValueOnce(json(true))
    .mockResolvedValueOnce(json([{ approved_sha256: digest }]))
    .mockResolvedValueOnce(new Response(raw, { status: 200 }));
}
describe("private Kids lesson delivery", () => {
  it("stops before storage on missing parent or access grant", async () => {
    const fetcher = vi.fn();
    expect((await handleKidsLessonContent(request(input, ""), env, fetcher)).status).toBe(401);
    expect(fetcher).not.toHaveBeenCalled();
    const denied = vi
      .fn()
      .mockResolvedValueOnce(json({ id: parent }))
      .mockResolvedValueOnce(json(false));
    expect((await handleKidsLessonContent(request(), env, denied)).status).toBe(403);
    expect(denied).toHaveBeenCalledTimes(2);
    expect(denied.mock.calls[1][1].headers.Authorization).toBe("Bearer parent");
  });
  it("does not release content when approval digest is missing or mismatched", async () => {
    const missing = fetches("");
    expect((await handleKidsLessonContent(request(), env, missing)).status).toBe(503);
    expect(missing).toHaveBeenCalledTimes(3);
    const bad = fetches("f".repeat(64));
    expect((await handleKidsLessonContent(request(), env, bad)).status).toBe(503);
    expect(bad).toHaveBeenCalledTimes(4);
  });
  it("returns verified student fields and citation, without teacher answers or hint solutions", async () => {
    const fetcher = fetches();
    const response = await handleKidsLessonContent(request(), env, fetcher);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(fetcher.mock.calls[1][1].headers.Authorization).toBe("Bearer parent");
    expect(fetcher.mock.calls[2][1].headers.Authorization).toBe("Bearer service");
    expect(String(fetcher.mock.calls[3][0])).toContain(
      "/storage/v1/object/kids-lesson-content/level-2/lesson-07/ar-EG.json",
    );
    const data = await response.json();
    expect(data.citation).toEqual({
      product: "kids",
      levelId: "level-2",
      lessonNumber: 7,
      locale: "ar-EG",
      sourceSha256: sha,
    });
    expect(data.lesson.quiz[0]).toEqual({ id: "q1", question: "Choose", options: ["A", "B"] });
    expect(data.lesson.hints[0]).toEqual({ question: "How?", source: "concept" });
    expect(JSON.stringify(data)).not.toContain("secret teacher solution");
    expect(JSON.stringify(data)).not.toContain("Answer is B");
    expect(JSON.stringify(data)).not.toContain("Use a plan");
  });
  it("grades a submitted quiz choice after the same parent and SHA checks", async () => {
    const fetcher = fetches();
    const response = await handleKidsLessonContent(
      request({
        ...input,
        action: "quiz-check",
        questionId: "q1",
        selectedIndex: 1,
      }),
      env,
      fetcher,
    );
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.correct).toBe(true);
    expect(result.explanation).toBe("Answer is B");
    expect(JSON.stringify(result)).not.toContain('"answer":1');
    expect(fetcher).toHaveBeenCalledTimes(4);
  });
});
