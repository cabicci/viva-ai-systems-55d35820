import { redirect } from "@tanstack/react-router";
import { assertAdminAccess } from "@/lib/admin.functions";
import { isRedirect } from "@/lib/auth-route-guard";

/**
 * Shared beforeLoad guard for admin/dev-only routes.
 * SSR: skip — no bearer token is available on the document request.
 * Client: server-fn check via attachSupabaseAuth + AdminGate double-check.
 *
 * - Non-admin authenticated → /dashboard
 * - Unauthenticated / any failure → /login
 */
export async function requireAdminBeforeLoad() {
  if (typeof window === "undefined") return;

  try {
    const res = await assertAdminAccess();
    if (!res.isAdmin) {
      throw redirect({ to: "/dashboard", replace: true });
    }
  } catch (err) {
    if (isRedirect(err)) throw err;
    throw redirect({ to: "/login", replace: true });
  }
}
