import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Ecosystem } from "@/components/site/Ecosystem";
import { Journey } from "@/components/site/Journey";
import { Philosophy } from "@/components/site/Philosophy";
import { CTA } from "@/components/site/CTA";
import { Footer } from "@/components/site/Footer";
import { buildLocalizedPublicMeta } from "@/lib/locale/build-localized-public-meta";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";

export const Route = createFileRoute("/")({
  validateSearch: (raw: Record<string, unknown>) => parseLocaleSearchParam(raw),
  head: async ({ match }) => {
    const locale = await resolveRouteHeadLocale({
      searchLocale: match.search.locale,
    });
    const { meta } = buildLocalizedPublicMeta(locale, "home");
    return {
      meta: [
        ...meta,
        { property: "og:url", content: "https://masaarat.ai" },
      ],
    };
  },
  component: Index,
});

function Index() {
  return (
    <div className="min-h-dvh">
      <Navbar />
      <main id="main-content">
        <Hero />
        <Ecosystem />
        <Journey />
        <Philosophy />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
