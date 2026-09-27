import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { KidsBrand } from "@/components/kids/KidsBrand";
import { KidsReleaseNotice } from "@/components/kids/KidsReleaseNotice";
import { getKidsPrivacyCopy } from "@/lib/kids/privacy-copy";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";
import { KIDS_LEVELS } from "@/lib/kids/catalogue";
import { getKidsCopy } from "@/lib/kids/copy";
import { getKidsJourneyCopy } from "@/lib/kids/journey-copy";
import { useLocale } from "@/lib/locale/locale-context";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { buildLocalizedPublicMeta } from "@/lib/locale/build-localized-public-meta";

export const Route = createFileRoute("/kids/")({
  validateSearch: (raw: Record<string, unknown>) => parseLocaleSearchParam(raw),
  head: async ({ match }) => {
    const locale = await resolveRouteHeadLocale({ searchLocale: match.search.locale });
    return buildLocalizedPublicMeta(locale, "kids");
  },
  component: KidsPage,
});

function KidsPage() {
  const { locale, dir } = useLocale();
  const copy = getKidsCopy(locale);
  const journey = getKidsJourneyCopy(locale);
  const localeSearch = useLocaleLinkSearch();

  return (
    <div className="min-h-dvh flex flex-col" dir={dir}>
      <Navbar variant="account" />
      <main id="main-content" className="flex-1">
        <div className="container mx-auto max-w-5xl space-y-10 px-4 py-12 md:py-20">
          <header className="rounded-3xl border border-primary/20 bg-card p-6 md:p-10">
            <KidsBrand />
            <p className="mt-6 text-sm font-semibold text-primary">{copy.eyebrow}</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">{copy.title}</h1>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">{copy.intro}</p>
          </header>

          <KidsReleaseNotice className="rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm" />
          <Link
            to="/kids/privacy"
            search={localeSearch()}
            className="inline-block text-sm font-semibold text-primary underline"
          >
            {getKidsPrivacyCopy(locale).link}
          </Link>

          <section aria-label={copy.eyebrow} className="grid gap-5 md:grid-cols-3">
            {KIDS_LEVELS.map((level, index) => (
              <article key={level.id} className="rounded-2xl border border-border/60 bg-card p-6">
                <p className="text-xs font-semibold text-primary">
                  {copy.level} {index + 1}
                </p>
                <h2 className="mt-2 text-2xl font-black" dir="ltr">
                  {level.ages}
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">{copy.lessons}</p>
                <p className="mt-4 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {copy.freeBadge}
                </p>
                <Link
                  to="/kids/$levelId"
                  params={{ levelId: level.id }}
                  search={localeSearch()}
                  className="mt-5 block min-h-11 rounded-full border border-primary px-5 py-3 text-center text-sm font-bold text-primary hover:bg-primary/10"
                >
                  {copy.details}
                </Link>
              </article>
            ))}
          </section>

          <section className="rounded-2xl border border-border/60 bg-card p-6 md:p-8">
            <h2 className="text-xl font-bold">{copy.familyTitle}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy.parentNote}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/kids/family"
                search={localeSearch()}
                className="inline-flex min-h-11 items-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
              >
                {journey.parentTitle}
              </Link>
              <Link
                to="/pricing"
                search={localeSearch()}
                hash="kids"
                className="inline-flex min-h-11 items-center rounded-full border border-primary px-6 py-3 text-sm font-bold text-primary hover:bg-primary/10"
              >
                {copy.viewPricing}
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
