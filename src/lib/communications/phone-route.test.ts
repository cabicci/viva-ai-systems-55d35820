import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "@tanstack/react-router";
const mocks = vi.hoisted(() => ({ requireAuth: vi.fn() }));
vi.mock("@/lib/auth-route-guard", () => ({ requireAuthBeforeLoad: mocks.requireAuth }));
import { requirePhoneAccount } from "./phone-route";

beforeEach(() => {
  mocks.requireAuth.mockReset();
});

describe("phone page authentication return", () => {
  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"])(
    "preserves the page and locale for a guest in %s using the actual router redirect",
    async (locale) => {
      mocks.requireAuth.mockRejectedValue(redirect({ to: "/login", replace: true }));
      await expect(requirePhoneAccount({ locale })).rejects.toMatchObject({
        options: {
          to: "/login",
          search: { locale, returnTo: "/verify-phone" },
          replace: true,
        },
      });
    },
  );
  it("allows a current ordinary session without requiring an admin or existing phone", async () => {
    mocks.requireAuth.mockResolvedValue(undefined);
    await expect(requirePhoneAccount({ locale: "en" })).resolves.toBeUndefined();
    expect(mocks.requireAuth).toHaveBeenCalledOnce();
  });
  it("does not disguise a session lookup failure as a redirect", async () => {
    const failure = new Error("session lookup unavailable");
    mocks.requireAuth.mockRejectedValue(failure);
    await expect(requirePhoneAccount({ locale: "en" })).rejects.toBe(failure);
  });
});
