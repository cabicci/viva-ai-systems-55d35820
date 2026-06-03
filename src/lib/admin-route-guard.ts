import { redirect } from "@tanstack/react-router";
import { assertAdminAccess } from "@/lib/admin.functions";

/**
 * Shared beforeLoad guard for admin/dev-only routes.
 * Runs on BOTH SSR and client. During SSR there's no bearer token, so the
 * server-fn check rejects and we redirect to /login — preventing the admin
 * shell from rendering server-side to anonymous viewers. On the client the
 * real auth state is checked.
 *
 * - Non-admin authenticated → /dashboard
 * - Unauthenticated / any failure → /login
 */
export async function requireAdminBeforeLoad() {
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