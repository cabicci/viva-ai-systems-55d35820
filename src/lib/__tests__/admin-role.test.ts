import { describe, expect, it, vi } from "vitest";
import { assertAdminRole } from "@/lib/admin-role.server";

describe("shared administrator role boundary", () => {
  it("checks the verified caller and accepts only a successful boolean grant", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    await expect(assertAdminRole({ userId: "verified-admin", supabase: { rpc } })).resolves.toBeUndefined();
    expect(rpc).toHaveBeenCalledExactlyOnceWith("has_role", { _user_id: "verified-admin", _role: "admin" });
  });

  it.each([false, null, undefined, 0, 1, "true", "false", [], {}])("denies a non-grant response %#", async data => {
    const rpc = vi.fn().mockResolvedValue({ data, error: null });
    await expect(assertAdminRole({ userId: "verified-member", supabase: { rpc } }))
      .rejects.toThrow("Forbidden: admin role required");
  });

  it("rejects backend errors even if data is true without disclosing their contents", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: { message: "PRIVATE_DETAIL" } });
    await expect(assertAdminRole({ userId: "verified-admin", supabase: { rpc } }))
      .rejects.toThrow(/^Authorization check failed$/);
  });

  it("rechecks each request and observes a role withdrawal", async () => {
    const rpc = vi.fn().mockResolvedValueOnce({ data: true, error: null }).mockResolvedValueOnce({ data: false, error: null });
    const context = { userId: "verified-admin", supabase: { rpc } };
    await assertAdminRole(context);
    await expect(assertAdminRole(context)).rejects.toThrow("Forbidden: admin role required");
    expect(rpc).toHaveBeenCalledTimes(2);
  });

  it("keeps concurrent caller identities and results separate", async () => {
    const rpc = vi.fn((_name, args) => Promise.resolve({ data: args._user_id === "admin", error: null }));
    const results = await Promise.allSettled([
      assertAdminRole({ userId: "member", supabase: { rpc } }),
      assertAdminRole({ userId: "admin", supabase: { rpc } }),
    ]);
    expect(results.map(result => result.status)).toEqual(["rejected", "fulfilled"]);
    expect(rpc).toHaveBeenCalledTimes(2);
  });
});
