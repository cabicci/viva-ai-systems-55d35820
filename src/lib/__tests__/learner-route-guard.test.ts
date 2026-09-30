import { beforeEach, describe, expect, it, vi } from "vitest";

const { assertLearnerSession } = vi.hoisted(() => ({ assertLearnerSession: vi.fn() }));
vi.mock("@/lib/learner-auth.functions", () => ({ assertLearnerSession }));

import { requireLearnerBeforeLoad } from "@/lib/learner-route-guard";

describe("learner route access", () => {
  beforeEach(() => assertLearnerSession.mockReset());

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
});
