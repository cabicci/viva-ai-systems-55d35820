import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ assert: vi.fn() }));
vi.mock("@/lib/admin.functions", () => ({ assertAdminAccess: mocks.assert }));
vi.mock("@tanstack/react-router", () => ({ redirect: (options: unknown) => options }));
vi.mock("@/lib/auth-route-guard", () => ({
  isRedirect: (err: unknown) => !!err && typeof err === "object" && "to" in err,
}));
import { requireAdminBeforeLoad } from "@/lib/admin-route-guard";
import { authReturnNavigation } from "@/lib/auth-return";
import { isSafeAuthReturn } from "@/lib/kids/auth-intent";
beforeEach(() => vi.clearAllMocks());
it.each(["en", "ar-EG", "ar-MSA", "ar-Gulf"])(
  "preserves %s and only the exact build-logs return when the server rejects identity",
  async (locale) => {
    mocks.assert.mockRejectedValue(new Error("Expired"));
    await expect(
      requireAdminBeforeLoad({
        location: { pathname: "/build-logs", search: { locale, returnTo: "https://evil.test" } },
      }),
    ).rejects.toEqual({
      to: "/login",
      search: { locale, returnTo: "/build-logs" },
      replace: true,
    });
    expect(mocks.assert).toHaveBeenCalledTimes(1);
  },
);
it("returns a non-admin to the same-locale dashboard after the mandatory server check", async () => {
  mocks.assert.mockResolvedValue({ isAdmin: false });
  await expect(
    requireAdminBeforeLoad({ location: { pathname: "/build-logs", search: { locale: "en" } } }),
  ).rejects.toEqual({
    to: "/dashboard",
    search: { locale: "en" },
    replace: true,
  });
  expect(mocks.assert).toHaveBeenCalledTimes(1);
});
it("checks the server again for an admin returning from login", async () => {
  mocks.assert.mockResolvedValue({ isAdmin: true });
  expect(authReturnNavigation({ returnTo: "/build-logs", locale: "en" }).to).toBe("/build-logs");
  await expect(
    requireAdminBeforeLoad({ location: { pathname: "/build-logs", search: { locale: "en" } } }),
  ).resolves.toBeUndefined();
  expect(mocks.assert).toHaveBeenCalledTimes(1);
});
it.each([
  "/build-logs/extra",
  "/admin",
  "https://evil.test",
  "//evil.test",
  "/build-logs?next=evil",
  "/%62uild-logs",
])("does not add an unapproved return for %s", async (pathname) => {
  mocks.assert.mockRejectedValue(new Error("Expired"));
  await expect(
    requireAdminBeforeLoad({
      location: { pathname, search: { locale: "invalid", returnTo: "/build-logs" } },
    }),
  ).rejects.toEqual({
    to: "/login",
    search: {},
    replace: true,
  });
  expect(isSafeAuthReturn(pathname)).toBe(false);
});
