import { Link } from "@tanstack/react-router";
import { useUiString } from "@/lib/locale/use-ui-strings";
import { LanguageSelector } from "@/components/locale/LanguageSelector";

export function AuthShell({
  title,
  subtitle,
  children,
  showLanguageSelector = false,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  showLanguageSelector?: boolean;
}) {
  const t = useUiString();
  const brand = t("nav.brand");

  return (
    <div className="min-h-dvh flex overflow-x-hidden">
      <div className="hidden lg:flex flex-1 relative grid-bg overflow-hidden p-16 flex-col justify-between">
        <Link to="/" className="flex items-center relative z-10" aria-label={brand}>
          <img
            src="/brand/masaarat-logo-lockup.png"
            alt={brand}
            className="h-10 w-auto select-none"
            draggable={false}
          />
        </Link>
        <div className="absolute -bottom-40 -left-20 h-[500px] w-[500px] rounded-full bg-primary/30 blur-[120px] animate-pulse-glow" />
        <div className="absolute top-20 -right-20 h-[400px] w-[400px] rounded-full bg-accent/30 blur-[100px] animate-pulse-glow" />
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-black leading-tight">
            {t("auth.shell.headlineBefore")}
            <span className="text-gradient">{t("auth.shell.headlineHighlight")}</span>
            {t("auth.shell.headlineAfter")}
          </h2>
          <p className="mt-4 text-muted-foreground">{t("auth.shell.tagline")}</p>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-center px-4 py-8 sm:p-6">
        <div className="w-full max-w-md">
          {showLanguageSelector && (
            <div className="mb-6 flex justify-end">
              <LanguageSelector />
            </div>
          )}
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center" aria-label={brand}>
              <img
                src="/brand/masaarat-logo-lockup.png"
                alt={brand}
                className="h-9 w-auto select-none"
                draggable={false}
              />
            </Link>
          </div>
          <h1 className="text-3xl font-bold break-words">{title}</h1>
          <p className="text-muted-foreground mt-2 mb-8">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
