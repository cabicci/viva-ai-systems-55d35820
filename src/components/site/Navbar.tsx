import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { LanguageSelector } from "@/components/locale/LanguageSelector";
import { useLocale } from "@/lib/locale/locale-context";
import { getUiString } from "@/lib/locale/ui-strings";

export function Navbar() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const t = (key: Parameters<typeof getUiString>[1]) => getUiString(locale, key);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-surface-overlay backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center" aria-label={t("nav.brand")}>
          <img
            src="/brand/masaarat-logo-lockup.png"
            alt={t("nav.brand")}
            className="h-8 md:h-10 w-auto select-none"
            draggable={false}
          />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#ecosystem" className="hover:text-foreground transition">{t("nav.paths")}</a>
          <a href="#journey" className="hover:text-foreground transition">{t("nav.journey")}</a>
          <a href="#philosophy" className="hover:text-foreground transition">{t("nav.philosophy")}</a>
          <Link to="/curriculum" className="hover:text-foreground transition">{t("nav.curriculum")}</Link>
          <Link to="/pricing" className="hover:text-foreground transition">الباقات</Link>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          {user ? (
            <Button asChild size="sm" className="rounded-full px-5"><Link to="/dashboard">{t("nav.myDashboard")}</Link></Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="rounded-full"><Link to="/login">{t("nav.login")}</Link></Button>
              <Button asChild size="sm" className="rounded-full px-5 shadow-sm"><Link to="/signup">{t("nav.signup")}</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
