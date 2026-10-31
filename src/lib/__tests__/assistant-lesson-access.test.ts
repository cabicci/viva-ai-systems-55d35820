// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ verify: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/ssr-request-auth.server", () => ({ resolveVerifiedRequestUser: state.verify }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc: state.rpc } }));
import { readLessonAssistantAccess } from "@/lib/lesson-assistant-access.server";
const scope = { pathId: "intro", lessonId: "intro-m1-l1-what-is-ai" };
beforeEach(() => {
  state.verify.mockReset().mockResolvedValue({ userId: "verified-user" });
  state.rpc.mockReset().mockImplementation(async (name: string) => ({ error: null,
    data: name === "assistant_card_content_access" ? { card_id: "intro", lessons: { entitled_lesson_ids: [scope.lessonId] } }
      : { allowed: true },
  }));
});
it("never performs privileged reads without a verified request user", async () => {
  state.verify.mockResolvedValue(null);
  expect(await readLessonAssistantAccess(scope)).toEqual({ state: "unauthenticated" });
  expect(state.rpc).not.toHaveBeenCalled();
});
it("rejects a different course/lesson binding before privileged reads", async () => {
  expect(await readLessonAssistantAccess({ ...scope, pathId: "builder" })).toEqual({ state: "denied", reason: "lesson" });
  expect(state.rpc).not.toHaveBeenCalled();
});
it("uses only the verified account and existing read decisions, never a reservation or provider", async () => {
  expect(await readLessonAssistantAccess({ ...scope, userId: "forged-user" } as typeof scope)).toEqual({ state: "allowed" });
  expect(state.rpc.mock.calls.map((c) => c[0])).toEqual(["assistant_card_content_access", "evaluate_access"]);
  expect(state.rpc.mock.calls[0][1]).toEqual({ p_user_id: "verified-user", p_card_id: "intro" });
  expect(state.rpc.mock.calls[1][1]).toEqual({ p_user_id: "verified-user", p_resource_type: "assistant_runtime", p_resource_id: scope.lessonId });
});
it("does not confuse an incorrect content binding with the Free plan's AI denial", async () => {
  state.rpc.mockResolvedValue({ data: { card_id: "other", lessons: { entitled_lesson_ids: [scope.lessonId] } }, error: null });
  expect(await readLessonAssistantAccess(scope)).toEqual({ state: "denied", reason: "lesson" });
  expect(state.rpc).toHaveBeenCalledTimes(1);
});
it.each([
  ["AI_ACCESS_DENIED", "access"], ["ASSISTANT_QUOTA_EXCEEDED", "quota"],
] as const)("preserves the backend %s decision without granting anything", async (code, reason) => {
  state.rpc.mockImplementation(async (name: string) => ({ error: null, data: name === "assistant_card_content_access"
    ? { card_id: "intro", lessons: { entitled_lesson_ids: [scope.lessonId] } }
    : { allowed: false, denial_reason_code: code } }));
  expect(await readLessonAssistantAccess(scope)).toEqual({ state: "denied", reason });
});
it.each([null, {}, { allowed: "true" }, { allowed: false, denial_reason_code: "ENTITLEMENT_UNAVAILABLE" }])(
  "fails closed for an unavailable/malformed allowance %j", async (data) => {
    state.rpc.mockResolvedValueOnce({ data: { card_id: "intro", lessons: { entitled_lesson_ids: [scope.lessonId] } }, error: null })
      .mockResolvedValueOnce({ data, error: null });
    expect(await readLessonAssistantAccess(scope)).toEqual({ state: "unavailable" });
  },
);
