import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { LineIntroduction } from "@/components/site/LearningLines";
import { Ecosystem } from "@/components/site/Ecosystem";
import { Journey } from "@/components/site/Journey";
import { Philosophy } from "@/components/site/Philosophy";
import { CTA } from "@/components/site/CTA";
import { lineMeta } from "@/lib/learning-lines";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
export const Route = createFileRoute("/ai")({
  validateSearch: parseLocaleSearchParam,
  head: async ({ match }) =>
    lineMeta(await resolveRouteHeadLocale({ searchLocale: match.search.locale }), "ai"),
  component: AIPage,
});
function AIPage() {
  return (
    <div className="min-h-dvh">
      <Navbar />
      <main id="main-content">
        <LineIntroduction line="ai" />
        <Ecosystem />
        <Journey />
        <Philosophy />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
