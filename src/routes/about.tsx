import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { LearningLineCards } from "@/components/site/LearningLines";
import { getLineCopy, lineMeta } from "@/lib/learning-lines";
import { useLocale } from "@/lib/locale/locale-context";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
export const Route = createFileRoute("/about")({
  validateSearch: parseLocaleSearchParam,
  head: async ({ match }) =>
    lineMeta(await resolveRouteHeadLocale({ searchLocale: match.search.locale }), "about"),
  component: About,
});
function About() {
  const { locale } = useLocale();
  const c = getLineCopy(locale);
  return (
    <div>
      <Navbar />
      <main id="main-content" className="container mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-4xl font-black">{c.about}</h1>
        <p className="my-8 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          {c.aboutIntro}
        </p>
        <LearningLineCards />
        <p className="mt-8 font-bold">{c.shared}</p>
        <p className="mt-2 text-muted-foreground">{c.separate}</p>
      </main>
      <Footer />
    </div>
  );
}
