import { createFileRoute, notFound } from "@tanstack/react-router";
import { courseOverview } from "@/lib/course-system/intake/course-overviews";
import { getPathStoryCopy } from "@/lib/path-story";
import { CurriculumLayout } from "@/components/site/CurriculumLayout";
import { publicAiCatalogue } from "@/lib/seo/public-ai-catalogue";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { aiProgramSeo, isProgramId, programSearch } from "@/lib/seo/ai-program";

export const Route = createFileRoute("/programs/ai/$courseId")({
  validateSearch: programSearch,
  loaderDeps: ({ search }) => ({ locale: search.locale }),
  loader: async ({ params, deps }) => {
    if (!isProgramId(params.courseId)) throw notFound();
    const locale = await resolveRouteHeadLocale({ searchLocale: deps.locale });
    const course = (await publicAiCatalogue(locale)).find((c) => c.id === params.courseId);
    if (!course) throw notFound();
    const seo = aiProgramSeo(course, locale);
    return { course, locale, seo };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ name: "robots", content: "noindex" }] };
    const { seo, course, locale } = loaderData;
    const structured = {
      "@context": "https://schema.org",
      "@type": "Course",
      name: course.title,
      description: seo.description,
      url: seo.url,
      inLanguage: locale === "en" ? "en" : "ar",
      provider: { "@type": "Organization", name: "Masaarat", url: "https://masaarat.ai/" },
    };
    return {
      meta: [
        { title: seo.title },
        { name: "description", content: seo.description },
        { name: "robots", content: "index,follow" },
        { property: "og:title", content: seo.title },
        { property: "og:description", content: seo.description },
        { property: "og:url", content: seo.url },
        { property: "og:image", content: seo.image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: seo.title },
        { name: "twitter:description", content: seo.description },
        { name: "twitter:image", content: seo.image },
      ],
      links: [{ rel: "canonical", href: seo.url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(structured).replace(/</g, "\\u003c"),
        },
      ],
    };
  },
  component: ProgramOverview,
});

function ProgramOverview() {
  const { course, locale, seo } = Route.useLoaderData();
  const en = locale === "en";
  const overview = courseOverview(course.id, locale);
  const copy = getPathStoryCopy(locale);
  return (
    <CurriculumLayout line="ai" title={course.title} subtitle={seo.description}>
      {overview && (
        <section className="mb-6 grid gap-4 sm:grid-cols-2">
          <div>
            <h2 className="font-bold">{copy.audience}</h2>
            <p>{overview.audience}</p>
          </div>
          <div>
            <h2 className="font-bold">{copy.requirements}</h2>
            <p>{overview.before}</p>
          </div>
        </section>
      )}
      <a
        className="mb-8 inline-flex min-h-11 items-center self-start rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground"
        href={`/courses/ai/${course.id}?locale=${locale}`}
      >
        {en ? "Open course" : "افتح المنهج"}
      </a>
      <div className="grid gap-4 sm:grid-cols-2">
        {course.stations.map((station) => (
          <section key={station.id} className="rounded-2xl border border-border/40 bg-card p-5">
            <h2 className="mb-3 text-lg font-bold">{station.title}</h2>
            <ol className="list-decimal space-y-1 ps-6">
              {station.steps.map((step) => (
                <li key={step.id}>{step.title}</li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </CurriculumLayout>
  );
}
