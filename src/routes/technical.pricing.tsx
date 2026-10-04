import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { LineIntroduction } from "@/components/site/LearningLines";
import { PlanPrices } from "@/components/site/PlanPrices";
import { getLineCopy, lineMeta } from "@/lib/learning-lines";
import { useLocale } from "@/lib/locale/locale-context";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
export const Route = createFileRoute("/technical/pricing")({
  validateSearch: parseLocaleSearchParam,
  head: async ({ match }) =>
    lineMeta(
      await resolveRouteHeadLocale({ searchLocale: match.search.locale }),
      "technicalPricing",
    ),
  component: TechnicalPricing,
});
function TechnicalPricing() {
  const { locale } = useLocale();
  const c = getLineCopy(locale);
  return (
    <div>
      <Navbar />
      <main id="main-content">
        <LineIntroduction line="technical" />
        <section className="container mx-auto max-w-3xl px-4 py-12">
          <article className="rounded-3xl border border-primary/30 bg-card p-7">
            <h2 className="text-2xl font-black">
              {c.technical} — {c.plans}
            </h2>
            <p className="my-5 leading-relaxed text-muted-foreground">{c.technicalPrice}</p>
            <PlanPrices plan="pro_plus" />
            <p className="rounded-xl bg-primary/10 p-4 font-semibold text-primary">
              {c.unavailable}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{c.separate}</p>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
}
