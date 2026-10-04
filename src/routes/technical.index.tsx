import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { LineOverview } from "@/components/site/LineOverview";
import { LineIntroduction } from "@/components/site/LearningLines";
import { lineMeta } from "@/lib/learning-lines";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
export const Route = createFileRoute("/technical/")({
  validateSearch: parseLocaleSearchParam,
  head: async ({ match }) =>
    lineMeta(await resolveRouteHeadLocale({ searchLocale: match.search.locale }), "technical"),
  component: Technical,
});
function Technical() {
  return (
    <div>
      <Navbar />
      <main id="main-content">
        <LineIntroduction line="technical" />
        <LineOverview line="technical" />
      </main>
      <Footer />
    </div>
  );
}
