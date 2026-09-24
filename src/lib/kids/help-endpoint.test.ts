import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { handleKidsLessonHelp } from "../../../supabase/functions/kids-lesson-help/handler";

const profileId = "11111111-1111-4111-8111-111111111111";
const scope = { profileId, levelId: "level-1", lessonNumber: 1, locale: "en", hintId: "hint-1" };
const env = (name: string) =>
  ({
    SUPABASE_URL: "https://db.example",
    SUPABASE_ANON_KEY: "anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "service-key",
  })[name as "SUPABASE_URL"];
function request(value: unknown = scope, bearer = "Bearer parent-token") {
  return new Request("https://db.example/functions/v1/kids-lesson-help", {
    method: "POST",
    headers: { Authorization: bearer, Origin: "https://masaarat.ai" },
    body: JSON.stringify(value),
  });
}
const lesson = {
  locale: "en",
  scenes: [{ id: "start", narration: "Choose a task." }],
  hints: [{ question: "Where do I start?", answer: "Choose a task.", sourceScene: "start" }],
  educatorNotes: { sampleAnswer: "Never sent to children" },
};
function mocks(doc: Record<string, unknown> = lesson, allowed = true, shaOverride?: string) {
  const bytes = Buffer.from(JSON.stringify(doc));
  const digest = shaOverride ?? createHash("sha256").update(bytes).digest("hex");
  const fetcher = vi.fn(async (url: URL | RequestInfo) => {
    const pathname = String(url);
    if (pathname.includes("/auth/v1/user"))
      return new Response(JSON.stringify({ id: "parent-id" }));
    if (pathname.includes("/rpc/kids_can_access_lesson"))
      return new Response(JSON.stringify(allowed));
    if (pathname.includes("/storage/v1/object/")) return new Response(bytes);
    if (pathname.includes("/rest/v1/kids_content_approvals"))
      return new Response(JSON.stringify([{ approved_sha256: digest }]));
    throw new Error("Unexpected outbound request: " + pathname);
  });
  return fetcher;
}

describe("Kids-only authored lesson help", () => {
  it("rejects no JWT, unbounded text, locale/lesson errors before any retrieval", async () => {
    const fetcher = vi.fn();
    expect(
      (await handleKidsLessonHelp(request(scope, ""), env, fetcher as typeof fetch)).status,
    ).toBe(401);
    for (const value of [
      { ...scope, query: "my school and name" },
      { ...scope, retrievalResults: [] },
      { ...scope, locale: "fr" },
      { ...scope, lessonNumber: 13 },
      { ...scope, hintId: "hint-0" },
      { ...scope, profileId: "../another" },
    ]) {
      expect(
        (await handleKidsLessonHelp(request(value), env, fetcher as typeof fetch)).status,
      ).toBe(400);
    }
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("uses caller JWT for parent/profile gate; no service role read after denial", async () => {
    const fetcher = mocks(lesson, false);
    const response = await handleKidsLessonHelp(request(), env, fetcher as typeof fetch);
    expect(response.status).toBe(403);
    expect(fetcher).toHaveBeenCalledTimes(2);
    const rpc = fetcher.mock.calls[1] as unknown as [URL, RequestInit];
    expect(rpc[1].headers).toMatchObject({
      Authorization: "Bearer parent-token",
      apikey: "anon-key",
    });
    expect(JSON.parse(rpc[1].body as string)).toEqual({
      requested_profile: profileId,
      requested_level: "level-1",
      requested_lesson: 1,
      requested_locale: "en",
    });
  });

  it("requires a matching approved source digest and denies changed objects", async () => {
    const fetcher = mocks(lesson, true, "0".repeat(64));
    const response = await handleKidsLessonHelp(request(), env, fetcher as typeof fetch);
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("Choose a task");
  });
  it("retrieves only the authorized locale and hint from private Storage", async () => {
    const fetcher = mocks();
    const response = await handleKidsLessonHelp(request(), env, fetcher as typeof fetch);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const payload = (await response.json()) as Record<string, unknown>;
    expect(payload).toMatchObject({
      question: "Where do I start?",
      answer: "Choose a task.",
      citation: {
        product: "kids",
        levelId: "level-1",
        lessonNumber: 1,
        locale: "en",
        sourceId: "start",
      },
    });
    expect(JSON.stringify(payload)).not.toContain("sampleAnswer");
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(String(fetcher.mock.calls[2][0])).toContain(
      "/storage/v1/object/kids-lesson-content/level-1/lesson-01/en.json",
    );
    const object = fetcher.mock.calls[2] as unknown as [URL, RequestInit];
    expect(object[1].headers).toMatchObject({ Authorization: "Bearer service-key" });
  });
  it("rejects cross-locale object and ungrounded hint, even after access", async () => {
    const wrongLocale = mocks({ ...lesson, locale: "ar-EG" });
    expect((await handleKidsLessonHelp(request(), env, wrongLocale as typeof fetch)).status).toBe(
      503,
    );
    const ungrounded = mocks({
      ...lesson,
      hints: [{ question: "Where?", answer: "Wrong.", sourceScene: "adult-path" }],
    });
    expect((await handleKidsLessonHelp(request(), env, ungrounded as typeof fetch)).status).toBe(
      503,
    );
    const absent = mocks();
    expect(
      (
        await handleKidsLessonHelp(
          request({ ...scope, hintId: "hint-2" }),
          env,
          absent as typeof fetch,
        )
      ).status,
    ).toBe(503);
  });
});
