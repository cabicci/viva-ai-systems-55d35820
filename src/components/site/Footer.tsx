import { Link } from "@tanstack/react-router";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";
import { useUiString } from "@/lib/locale/use-ui-strings";
import { useRouterState } from "@tanstack/react-router";
import { useLocale } from "@/lib/locale/locale-context";
import {
  getLineCopy,
  learningLineForPath,
  LINE_PRICING,
  LEARNING_LINES,
  LINE_ROUTES,
} from "@/lib/learning-lines";

export function Footer() {
  const t = useUiString();
  const localeSearch = useLocaleLinkSearch();
  const { locale } = useLocale();
  const c = getLineCopy(locale);
  const line = learningLineForPath(useRouterState({ select: (state) => state.location.pathname }));
  const copyright = t("footer.copyright").replace("{year}", String(new Date().getFullYear()));

  return (
    <footer className="border-t border-border/50 mt-16">
      <div className="container mx-auto px-4 py-10 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-4">
        <p>{copyright}</p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          {line ? (
            <Link
              to={LINE_PRICING[line]}
              search={localeSearch()}
              className="hover:text-foreground transition"
            >
              {c.plans}
            </Link>
          ) : (
            LEARNING_LINES.map((item) => (
              <Link
                key={item}
                to={LINE_ROUTES[item]}
                search={localeSearch()}
                className="hover:text-foreground transition"
              >
                {c[item]}
              </Link>
            ))
          )}
          <Link to="/contact" search={localeSearch()} className="hover:text-foreground transition">
            {t("nav.contact")}
          </Link>
          <Link to="/privacy" search={localeSearch()} className="hover:text-foreground transition">
            {t("footer.privacy")}
          </Link>
          <Link to="/terms" search={localeSearch()} className="hover:text-foreground transition">
            {t("footer.terms")}
          </Link>
          <a href="mailto:support@masaarat.ai" className="hover:text-foreground transition">
            support@masaarat.ai
          </a>
          <span className="font-mono opacity-70">{t("footer.version")}</span>
        </nav>
      </div>
      <div className="container mx-auto px-4 pb-8 text-sm leading-7 text-foreground">
        <p>
          {locale === "en" ? (
            <>
              Website owner and registered legal name: Khalil Wahid Ibrahim Abdelghany Lotfy
              {" ("}
              <bdi lang="ar">خليل وحيد إبراهيم عبد الغني لطفي</bdi>
              {")."}
            </>
          ) : (
            <>مالك الموقع والاسم القانوني بالسجل التجاري: خليل وحيد إبراهيم عبد الغني لطفي.</>
          )}
        </p>
        <p>
          {locale === "en" ? (
            <>
              Trade name: Intersect (<bdi lang="ar">انترسيكت</bdi>).
            </>
          ) : (
            <>الاسم التجاري: انترسيكت (Intersect).</>
          )}
        </p>
      </div>
      <div className="container mx-auto flex justify-center px-4 pb-8">
        <div className="trustedsite-trustmark" data-type="202" data-width="120" data-height="50" />
      </div>
    </footer>
  );
}
