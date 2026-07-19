import { redirect } from "@tanstack/react-router";
import { assertAdminAccess } from "@/lib/admin.functions";
import { isRedirect } from "@/lib/auth-route-guard";

export type AdminBeforeLoadDecision =
  | { type: "allow" }
  | { type: "redirect"; to: "/login" | "/dashboard" };

/**
 * Pure decision boundary for admin beforeLoad.
 * Missing/invalid identity → /login; authenticated non-admin → /dashboard.
 * Client-provided role/state is ignored; only server assertAdminAccess outcomes apply.
 */
export function decideAdminBeforeLoad(
  outcome:
    | { status: "authorized"; isAdmin: boolean }
    | { status: "unauthorized" },
): AdminBeforeLoadDecision {
  if (outcome.status === "unauthorized") {
    return { type: "redirect", to: "/login" };
  }
  if (!outcome.isAdmin) {
    return { type: "redirect", to: "/dashboard" };
  }
  return { type: "allow" };
}

function applyAdminBeforeLoadDecision(decision: AdminBeforeLoadDecision): void {
  if (decision.type === "redirect") {
    throw redirect({ to: decision.to, replace: true });
  }
}

/**
 * Shared beforeLoad guard for admin/dev-only routes.
 *
 * Authoritative boundary: always calls assertAdminAccess (server fn), which
 * verifies identity via getClaims from Bearer or access-token cookie, then
 * checks has_role('admin'). Does not skip on SSR.
 *
 * - Non-admin authenticated → /dashboard
 * - Missing / invalid / expired identity → /login
 * Client AdminGate remains defense in depth only.
 */
export async function requireAdminBeforeLoad() {
  try {
    const res = await assertAdminAccess();
    applyAdminBeforeLoadDecision(
      decideAdminBeforeLoad({ status: "authorized", isAdmin: res.isAdmin }),
    );
  } catch (err) {
    if (isRedirect(err)) throw err;
    applyAdminBeforeLoadDecision(decideAdminBeforeLoad({ status: "unauthorized" }));
  }
}

/**
 * Representative protected admin loader boundary: never returns a payload
 * unless assertAdminAccess confirms an admin.
 */
export async function loadProtectedAdminPayloadIfAuthorized<T>(
  load: () => Promise<T>,
): Promise<T> {
  let outcome:
    | { status: "authorized"; isAdmin: boolean }
    | { status: "unauthorized" };
  try {
    const res = await assertAdminAccess();
    outcome = { status: "authorized", isAdmin: res.isAdmin };
  } catch {
    outcome = { status: "unauthorized" };
  }
  const decision = decideAdminBeforeLoad(outcome);
  if (decision.type === "redirect") {
    throw redirect({ to: decision.to, replace: true });
  }
  return load();
}

/**
 * Representative protected admin action boundary: runs sideEffect only after
 * admin authorization succeeds. Denials throw before the side effect.
 */
export async function runProtectedAdminActionIfAuthorized<T>(
  sideEffect: () => Promise<T>,
): Promise<T> {
  const res = await assertAdminAccess();
  if (!res.isAdmin) {
    throw new Error("Forbidden: admin role required");
  }
  return sideEffect();
}
