import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { buildLocalizedPublicMeta } from "@/lib/locale/build-localized-public-meta";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { useLocale } from "@/lib/locale/locale-context";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { useUiString } from "@/lib/locale/use-ui-strings";

export const Route = createFileRoute("/terms")({
  validateSearch: (raw: Record<string, unknown>) => parseLocaleSearchParam(raw),
  head: async ({ match }) => {
    const locale = await resolveRouteHeadLocale({
      searchLocale: match.search.locale,
    });
    return buildLocalizedPublicMeta(locale, "terms");
  },
  component: TermsPage,
});

function TermsPage() {
  const t = useUiString();
  const { dir } = useLocale();

  return (
    <div className="min-h-dvh flex flex-col" dir={dir}>
      <Navbar />
      <main id="main-content" className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <header className="mb-10">
          <p className="text-xs font-mono uppercase tracking-widest text-accent mb-3">
            {t("terms.eyebrow")}
          </p>
          <h1 className="text-3xl md:text-4xl font-black mb-3">{t("terms.title")}</h1>
          <p className="text-muted-foreground leading-relaxed">{t("terms.intro")}</p>
        </header>

        <article className="space-y-8 text-sm md:text-base leading-[1.9] text-foreground/90">
          <section>
            <h2 className="text-lg font-bold mb-2">{t("terms.section.acceptance.title")}</h2>
            <p className="text-muted-foreground">
              {t("terms.section.acceptance.body")}{" "}
              <Link to="/privacy" className="text-primary underline underline-offset-2">
                {t("terms.section.acceptance.privacy")}
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">{t("terms.section.acceptableUse.title")}</h2>
            <p className="text-muted-foreground">{t("terms.section.acceptableUse.body")}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">{t("terms.section.abuse.title")}</h2>
            <p className="text-muted-foreground">{t("terms.section.abuse.body")}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">
              {t("terms.section.educationalDisclaimer.title")}
            </h2>
            <p className="text-muted-foreground">{t("terms.section.educationalDisclaimer.body")}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">
              {t("terms.section.accountResponsibility.title")}
            </h2>
            <p className="text-muted-foreground">{t("terms.section.accountResponsibility.body")}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">{t("terms.section.subscription.title")}</h2>
            <p className="text-muted-foreground">{t("terms.section.subscription.body")}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">{t("terms.section.platformRights.title")}</h2>
            <p className="text-muted-foreground">{t("terms.section.platformRights.body")}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">{t("terms.section.contact.title")}</h2>
            <p className="text-muted-foreground">
              {t("terms.section.contact.body")}{" "}
              <a
                href="mailto:support@masaarat.ai"
                className="text-primary underline underline-offset-2"
              >
                support@masaarat.ai
              </a>
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
