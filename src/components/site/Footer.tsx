import { Link } from "@tanstack/react-router";
import { useUiString } from "@/lib/locale/use-ui-strings";

export function Footer() {
  const t = useUiString();
  const copyright = t("footer.copyright").replace(
    "{year}",
    String(new Date().getFullYear()),
  );

  return (
    <footer className="border-t border-border/50 mt-16">
      <div className="container mx-auto px-4 py-10 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-4">
        <p>{copyright}</p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <Link to="/pricing" className="hover:text-foreground transition">
            {t("nav.pricing")}
          </Link>
          <Link to="/privacy" className="hover:text-foreground transition">
            {t("footer.privacy")}
          </Link>
          <Link to="/terms" className="hover:text-foreground transition">
            {t("footer.terms")}
          </Link>
          <span className="font-mono opacity-70">{t("footer.version")}</span>
        </nav>
      </div>
    </footer>
  );
}
