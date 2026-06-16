import { useEffect } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AuthLoadingShell, hasValidSession } from "@/lib/auth-route-guard";

/** Legacy URL compatibility: /onboarding no longer hosts a separate flow. */
async function legacyOnboardingRedirectBeforeLoad() {
  if (typeof window === "undefined") return;

  const { data } = await supabase.auth.getSession();
  throw redirect({
    to: hasValidSession(data.session) ? "/dashboard" : "/login",
    replace: true,
  });
}

export const Route = createFileRoute("/onboarding")({
  beforeLoad: legacyOnboardingRedirectBeforeLoad,
  head: () => ({ meta: [{ title: "ابدأ — مسارات" }] }),
  component: OnboardingLegacyRedirect,
});

function OnboardingLegacyRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    navigate({ to: user ? "/dashboard" : "/login", replace: true });
  }, [loading, user, navigate]);

  return <AuthLoadingShell />;
}
