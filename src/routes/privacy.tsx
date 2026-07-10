import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { buildLocalizedPublicMeta } from "@/lib/locale/build-localized-public-meta";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { useLocale } from "@/lib/locale/locale-context";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { useUiString } from "@/lib/locale/use-ui-strings";

export const Route = createFileRoute("/privacy")({
  validateSearch: (raw: Record<string, unknown>) => parseLocaleSearchParam(raw),
  head: async ({ match }) => {
    const locale = await resolveRouteHeadLocale({
      searchLocale: match.search.locale,
    });
    return buildLocalizedPublicMeta(locale, "privacy");
  },
  component: PrivacyPage,
});

function PrivacyPage() {
  const t = useUiString();
  const { dir } = useLocale();

  return (
    <div className="min-h-dvh flex flex-col" dir={dir}>
      <Navbar />
      <main id="main-content" className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <header className="mb-10">
          <p className="text-xs font-mono uppercase tracking-widest text-accent mb-3">
            {t("privacy.eyebrow")}
          </p>
          <h1 className="text-3xl md:text-4xl font-black mb-3">{t("privacy.title")}</h1>
          <p className="text-muted-foreground leading-relaxed">{t("privacy.intro")}</p>
        </header>

        <article className="space-y-8 text-sm md:text-base leading-[1.9] text-foreground/90">
          <section>
            <h2 className="text-lg font-bold mb-2">{t("privacy.section.whoWeAre.title")}</h2>
            <p className="text-muted-foreground">{t("privacy.section.whoWeAre.body")}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">{t("privacy.section.accountData.title")}</h2>
            <p className="text-muted-foreground">{t("privacy.section.accountData.body")}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">{t("privacy.section.analytics.title")}</h2>
            <p className="text-muted-foreground">{t("privacy.section.analytics.body")}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">{t("privacy.section.aiUse.title")}</h2>
            <p className="text-muted-foreground">{t("privacy.section.aiUse.body")}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">{t("privacy.section.cookies.title")}</h2>
            <p className="text-muted-foreground">{t("privacy.section.cookies.body")}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">{t("privacy.section.contact.title")}</h2>
            <p className="text-muted-foreground">
              {t("privacy.section.contact.body")}{" "}
              <a
                href="mailto:support@masaarat.ai"
                className="text-primary underline underline-offset-2"
              >
                support@masaarat.ai
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">{t("privacy.section.accountDeletion.title")}</h2>
            <p className="text-muted-foreground">
              {t("privacy.section.accountDeletion.bodyBefore")}{" "}
              <Link to="/account" className="text-primary underline underline-offset-2">
                {t("account.title")}
              </Link>{" "}
              {t("privacy.section.accountDeletion.bodyAfter")}
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
