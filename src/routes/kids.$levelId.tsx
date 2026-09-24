import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { KidsParentPanel } from "@/components/kids/KidsParentPanel";
import { KidsBrand } from "@/components/kids/KidsBrand";
import { KIDS_LEVELS } from "@/lib/kids/catalogue";
import { getKidsJourneyCopy } from "@/lib/kids/journey-copy";
import { getKidsCopy } from "@/lib/kids/copy";
import { useLocale } from "@/lib/locale/locale-context";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { buildLocalizedPublicMeta } from "@/lib/locale/build-localized-public-meta";

export const Route = createFileRoute("/kids/$levelId")({
  validateSearch: parseLocaleSearchParam,
  beforeLoad: ({ params }) => {
    if (!KIDS_LEVELS.some((entry) => entry.id === params.levelId)) throw notFound();
  },
  head: async ({ match }) => {
    const locale = await resolveRouteHeadLocale({ searchLocale: match.search.locale });
    return buildLocalizedPublicMeta(locale, "kids");
  },
  component: KidsLevelPage,
});

function KidsLevelPage() {
  const { levelId } = Route.useParams();
  const { locale, dir } = useLocale();
  const localeSearch = useLocaleLinkSearch();
  const copy = getKidsJourneyCopy(locale);
  const product = getKidsCopy(locale);
  const level = KIDS_LEVELS.find((entry) => entry.id === levelId);
  if (!level) return null;
  const levelNumber = KIDS_LEVELS.findIndex((entry) => entry.id === levelId) + 1;

  return (
    <div className="flex min-h-dvh flex-col" dir={dir}>
      <Navbar />
      <main id="main-content" className="flex-1">
        <div className="container mx-auto max-w-5xl space-y-8 px-4 py-10 md:py-16">
          <Link
            to="/kids"
            search={localeSearch()}
            className="text-sm font-bold text-primary hover:underline"
          >
            {copy.back}
          </Link>
          <header className="rounded-3xl border border-primary/20 bg-[var(--pastel-lavender)] p-6 md:p-9">
            <KidsBrand compact />
            <h1 className="mt-5 text-3xl font-black">
              {copy.level} {levelNumber}
            </h1>
            <p className="mt-2 text-lg" dir="ltr">
              {level.ages}
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed">{product.reviewNotice}</p>
          </header>
          <KidsParentPanel />
          <section
            aria-label={product.lessons}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: level.lessonCount }, (_, index) => {
              const lessonNumber = index + 1;
              return (
                <article
                  key={lessonNumber}
                  className="flex flex-col rounded-2xl border border-border/60 bg-card p-5"
                >
                  <p className="text-xs font-semibold text-primary">
                    {copy.level} {levelNumber}
                  </p>
                  <h2 className="mt-2 text-xl font-black">
                    {copy.lesson} {lessonNumber}
                  </h2>
                  <p className="mt-3 flex-1 text-sm text-muted-foreground">
                    {lessonNumber <= 2 ? copy.free : copy.requiresPlan}
                  </p>
                  <Link
                    to="/kids/$levelId/$lessonNumber"
                    params={{ levelId, lessonNumber: String(lessonNumber) }}
                    search={localeSearch()}
                    className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-primary px-4 text-sm font-bold text-primary hover:bg-primary/10"
                  >
                    {copy.openLesson}
                  </Link>
                </article>
              );
            })}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
