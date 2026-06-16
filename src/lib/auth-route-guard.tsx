import type { ReactNode } from "react";
import { redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

function isRedirect(err: unknown): boolean {
  return !!err && typeof err === "object" && "to" in (err as Record<string, unknown>);
}

function hasValidSession(session: { access_token?: string } | null | undefined): boolean {
  const token = session?.access_token;
  return !!token && token.split(".").length === 3;
}

/**
 * Client-only route guard for authenticated learner pages.
 * SSR/hard-nav: skip redirect on the server; read local session on the client
 * before the route renders so a hydrated session is not mistaken for logged-out.
 */
export async function requireAuthBeforeLoad() {
  if (typeof window === "undefined") return;

  const { data } = await supabase.auth.getSession();
  if (!hasValidSession(data.session)) {
    throw redirect({ to: "/login", replace: true });
  }
}

/** Spinner shell while AuthProvider catches up after beforeLoad passed. */
export function AuthLoadingShell() {
  return (
    <div className="min-h-dvh grid place-items-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export function AuthSessionGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return <AuthLoadingShell />;
  }

  return <>{children}</>;
}

export { isRedirect, hasValidSession };
