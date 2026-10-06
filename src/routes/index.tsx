import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { LearningLineCards } from "@/components/site/LearningLines";
import { PathStory } from "@/components/site/PathStory";
import { getLineCopy } from "@/lib/learning-lines";
import { buildLocalizedPublicMeta } from "@/lib/locale/build-localized-public-meta";
import { useLocale } from "@/lib/locale/locale-context";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
export const Route = createFileRoute("/")({
  validateSearch: parseLocaleSearchParam,
  head: async ({ match }) =>
    buildLocalizedPublicMeta(
      await resolveRouteHeadLocale({ searchLocale: match.search.locale }),
      "home",
    ),
  component: Index,
});
export function Index() {
  const { locale, dir } = useLocale();
  const c = getLineCopy(locale);
  return (
    <div className="min-h-dvh" dir={dir}>
      <Navbar />
      <main id="main-content" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto max-w-6xl px-4 py-12 md:py-20">
          <header className="mx-auto mb-12 max-w-3xl text-center">
            <p className="text-sm font-bold text-primary">{c.eyebrow}</p>
            <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
              {c.platformTitle}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{c.platformIntro}</p>
          </header>
          <LearningLineCards />
          <PathStory />
          <div className="mt-10 text-center">
            <p className="font-bold">{c.shared}</p>
            <p className="mt-2 text-sm text-muted-foreground">{c.separate}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
