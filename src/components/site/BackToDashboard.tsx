import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";
import { useUiString } from "@/lib/locale/use-ui-strings";

const HIDDEN_PREFIXES = [
  "/dashboard",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/onboarding",
  "/learn",
];

export function BackToDashboard() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const localeSearch = useLocaleLinkSearch();
  const t = useUiString();

  if (!user) return null;
  if (path === "/") return null;
  if (HIDDEN_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) {
    return null;
  }

  return (
    <Link
      to="/dashboard"
      search={localeSearch()}
      aria-label={t("common.backToDashboard")}
      className="fixed top-4 left-4 z-50 inline-flex items-center gap-2 rounded-full glass border border-border/60 px-3 py-2 text-xs font-medium text-foreground/90 hover:text-foreground hover:bg-white/5 transition shadow-md"
    >
      <ArrowRight className="h-4 w-4" />
      <span>{t("common.backToDashboard")}</span>
    </Link>
  );
}