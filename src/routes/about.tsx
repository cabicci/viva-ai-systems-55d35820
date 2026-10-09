import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { LearningLineCards } from "@/components/site/LearningLines";
import { PathStory } from "@/components/site/PathStory";
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
        <PathStory full />
        <LearningLineCards />
        <p className="mt-8 font-bold">{c.shared}</p>
        <p className="mt-2 text-muted-foreground">{c.separate}</p>
        <section
          aria-labelledby="legal-ownership-heading"
          className="mt-12 rounded-2xl border border-border bg-muted/30 p-6 text-sm leading-7"
        >
          <h2 id="legal-ownership-heading" className="text-lg font-bold">
            {locale === "en" ? "Website ownership" : "ملكية الموقع"}
          </h2>
          <p className="mt-3">
            {locale === "en" ? (
              <>
                masaarat.ai is owned by Khalil Wahid Ibrahim Abdelghany Lotfy, a sole
                proprietor in Egypt.
              </>
            ) : (
              <>
                موقع masaarat.ai مملوك لخليل وحيد إبراهيم عبد الغني لطفي، صاحب منشأة فردية
                مصرية.
              </>
            )}
          </p>
          {locale === "en" && (
            <p lang="ar" dir="rtl" className="mt-2">
              الاسم القانوني: خليل وحيد إبراهيم عبد الغني لطفي
            </p>
          )}
          <p className="mt-3">
            {locale === "en" ? "Commercial registration number: " : "رقم السجل التجاري: "}
            <bdi>31028</bdi>
          </p>
          <p>
            {locale === "en" ? "Tax registration number: " : "رقم التسجيل الضريبي: "}
            <bdi>325-771-456</bdi>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
