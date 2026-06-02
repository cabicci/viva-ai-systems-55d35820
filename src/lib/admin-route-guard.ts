import { redirect } from "@tanstack/react-router";
import { assertAdminAccess } from "@/lib/admin.functions";

/**
 * Shared beforeLoad guard for admin/dev-only routes.
 * - SSR: skip (no token available); client re-run + serverFn-level checks enforce.
 * - Non-admin authenticated → /dashboard
 * - Unauthenticated / any failure → /login
 */
export async function requireAdminBeforeLoad() {
  if (typeof window === "undefined") return;
  try {
    const res = await assertAdminAccess();
    if (!res.isAdmin) {
      throw redirect({ to: "/dashboard" });
    }
  } catch (err) {
    if (err && typeof err === "object" && "to" in (err as Record<string, unknown>)) {
      throw err;
    }
    throw redirect({ to: "/login" });
  }
}