import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { LineIntroduction } from "@/components/site/LearningLines";
import { KidsFamilyPricing } from "@/components/kids/KidsFamilyPricing";
import { KidsReleaseNotice } from "@/components/kids/KidsReleaseNotice";
import { lineMeta } from "@/lib/learning-lines";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
export const Route = createFileRoute("/kids/pricing")({
  validateSearch: parseLocaleSearchParam,
  head: async ({ match }) =>
    lineMeta(await resolveRouteHeadLocale({ searchLocale: match.search.locale }), "kidsPricing"),
  component: KidsPricing,
});
function KidsPricing() {
  return (
    <div>
      <Navbar />
      <main id="main-content">
        <LineIntroduction line="kids" />
        <div className="container mx-auto max-w-5xl space-y-8 px-4 py-12">
          <KidsReleaseNotice className="rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm" />
          <KidsFamilyPricing />
        </div>
      </main>
      <Footer />
    </div>
  );
}
