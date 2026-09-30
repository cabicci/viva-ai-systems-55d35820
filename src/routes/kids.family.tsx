import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { KidsBrand } from "@/components/kids/KidsBrand";
import { KidsParentPanel } from "@/components/kids/KidsParentPanel";
import { getKidsJourneyCopy } from "@/lib/kids/journey-copy";
import { useLocale } from "@/lib/locale/locale-context";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { buildLocalizedPublicMeta } from "@/lib/locale/build-localized-public-meta";

export const Route = createFileRoute("/kids/family")({
  validateSearch: parseLocaleSearchParam,
  head: async ({ match }) => {
    const locale = await resolveRouteHeadLocale({ searchLocale: match.search.locale });
    const publicMeta = buildLocalizedPublicMeta(locale, "kids");
    return {
      ...publicMeta,
      meta: [...publicMeta.meta, { name: "robots", content: "noindex, nofollow" }],
    };
  },
  component: KidsFamilyPage,
});

function KidsFamilyPage() {
  const { locale, dir } = useLocale();
  const copy = getKidsJourneyCopy(locale);
  const localeSearch = useLocaleLinkSearch();

  return (
    <div className="flex min-h-dvh flex-col" dir={dir}>
      <Navbar variant="account" />
      <main id="main-content" className="flex-1">
        <div className="container mx-auto max-w-5xl space-y-7 px-4 py-10 md:py-16">
          <Link
            to="/kids"
            search={localeSearch()}
            className="text-sm font-bold text-primary hover:underline"
          >
            {copy.back}
          </Link>
          <header className="rounded-3xl border border-primary/20 bg-[var(--pastel-lavender)] p-6 md:p-9">
            <KidsBrand compact />
            <h1 className="mt-5 text-3xl font-black">{copy.parentTitle}</h1>
            <p className="mt-3 text-muted-foreground">{copy.familyIntro}</p>
          </header>
          <KidsParentPanel />
        </div>
      </main>
      <Footer />
    </div>
  );
}
