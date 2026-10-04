import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { LineIntroduction } from "@/components/site/LearningLines";
import { getLineCopy, lineMeta } from "@/lib/learning-lines";
import { useLocale } from "@/lib/locale/locale-context";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
export const Route = createFileRoute("/technical/")({
  validateSearch: parseLocaleSearchParam,
  head: async ({ match }) =>
    lineMeta(await resolveRouteHeadLocale({ searchLocale: match.search.locale }), "technical"),
  component: Technical,
});
function Technical() {
  const { locale } = useLocale();
  const c = getLineCopy(locale);
  const search = useLocaleLinkSearch();
  return (
    <div>
      <Navbar />
      <main id="main-content">
        <LineIntroduction line="technical" />
        <div className="container mx-auto max-w-5xl space-y-10 px-4 py-12">
          <section>
            <h2 className="text-2xl font-bold">{c.audience}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">{c.technicalAudience}</p>
          </section>
          <section aria-label={c.paths} className="rounded-3xl border border-border bg-card p-7">
            <p className="text-sm font-bold text-primary">{c.preparing}</p>
            <h2 className="mt-3 text-3xl font-black">{c.furniture}</h2>
            <p className="mt-5 max-w-3xl leading-relaxed text-muted-foreground">
              {c.preparingIntro}
            </p>
            <Link
              to="/technical/pricing"
              search={search()}
              className="mt-6 inline-flex min-h-11 items-center rounded-full border border-primary px-6 py-3 font-bold text-primary"
            >
              {c.plans}
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
