// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { redirect, isRedirect } from "@tanstack/react-router";
import { guardPaymentLink, parsePaymentLoginSearch, parsePaymentSearch } from "./payment-links";
const order = "00000000-0000-4000-8000-000000000009";
describe("private payment deep links", () => {
  it.each(["customer", "admin"] as const)(
    "returns a signed-out %s to the same order after login",
    async (paymentView) => {
      const guard = vi.fn().mockRejectedValue(redirect({ to: "/login" }));
      try {
        await guardPaymentLink(guard, order, paymentView);
        throw new Error("expected redirect");
      } catch (error) {
        expect(isRedirect(error)).toBe(true);
        if (!isRedirect(error)) throw error;
        expect(error.options).toMatchObject({ to: "/login", search: { order, paymentView } });
        expect(
          parsePaymentLoginSearch(error.options.search as unknown as Record<string, unknown>),
        ).toEqual({
          order,
          paymentView,
        });
      }
    },
  );
  it("preserves authorization failures and non-admin redirects", async () => {
    const denied = redirect({ to: "/dashboard" });
    await expect(
      guardPaymentLink(
        async () => {
          throw denied;
        },
        order,
        "admin",
      ),
    ).rejects.toBe(denied);
    const failure = new Error("denied");
    await expect(
      guardPaymentLink(
        async () => {
          throw failure;
        },
        order,
        "customer",
      ),
    ).rejects.toBe(failure);
    const allow = vi.fn().mockResolvedValue(undefined);
    await guardPaymentLink(allow, order, "admin");
    expect(allow).toHaveBeenCalledOnce();
  });
  it.each([
    "https://evil.example",
    "//evil.example",
    "../admin",
    "javascript:alert(1)",
    "not-a-uuid",
  ])("rejects arbitrary return destinations: %s", (invalid) => {
    expect(parsePaymentSearch({ order: invalid }).order).toBeUndefined();
    expect(parsePaymentLoginSearch({ order, paymentView: invalid })).toEqual({});
    expect(parsePaymentLoginSearch({ order: invalid, paymentView: "admin" })).toEqual({});
  });
});
