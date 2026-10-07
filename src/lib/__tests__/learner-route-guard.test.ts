import { beforeEach, describe, expect, it, vi } from "vitest";

const { assertLearnerSession } = vi.hoisted(() => ({ assertLearnerSession: vi.fn() }));
vi.mock("@/lib/learner-auth.functions", () => ({ assertLearnerSession }));

import { requireLearnerBeforeLoad } from "@/lib/learner-route-guard";

describe("learner route access", () => {
  beforeEach(() => {
    assertLearnerSession.mockReset();
  });

  it("redirects a visitor before lesson content can be loaded", async () => {
    assertLearnerSession.mockResolvedValue(null);
    await expect(requireLearnerBeforeLoad()).rejects.toMatchObject({
      options: { to: "/login", replace: true },
    });
  });

  it("allows a verified account to continue to the lesson loader", async () => {
    assertLearnerSession.mockResolvedValue({ userId: "account" });
    await expect(requireLearnerBeforeLoad()).resolves.toBeUndefined();
  });

  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"])(
    "keeps %s and the lesson destination when session verification fails",
    async (locale) => {
      assertLearnerSession.mockRejectedValue(new Error("session unavailable"));
      const pathname = "/learn/builder/builder-m1-l1-what-is-llm";
      await expect(
        requireLearnerBeforeLoad({ location: { pathname }, search: { locale } }),
      ).rejects.toMatchObject({
        options: { to: "/login", replace: true, search: { locale, returnTo: pathname } },
      });
    },
  );
});
