import { createFileRoute, notFound } from "@tanstack/react-router";
import { CurriculumLayout } from "@/components/site/CurriculumLayout";
import { curriculumCatalogue } from "@/lib/course-system/intake/client";
import { getCourseCatalogueCopy } from "@/lib/course-catalogue-copy";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { programSearch } from "@/lib/seo/ai-program";
import { isManagementCourse, managementProgramUrl } from "@/lib/seo/management-program";

export const Route = createFileRoute("/programs/management/$courseId")({
  validateSearch: programSearch,
  loaderDeps: ({ search }) => ({ locale: search.locale }),
  loader: async ({ params, deps }) => {
    if (!isManagementCourse({ area: "academic", id: params.courseId })) throw notFound();
    const locale = await resolveRouteHeadLocale({ searchLocale: deps.locale });
    const course = (await curriculumCatalogue("academic", locale)).find(
      (entry) => isManagementCourse(entry) && entry.id === params.courseId,
    );
    if (!course) throw notFound();
    return { course, locale };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ name: "robots", content: "noindex" }] };
    const { course, locale } = loaderData;
    const url = managementProgramUrl(course.id);
    const title = course.title + (locale === "en" ? " | Masaarat" : " | مسارات");
    const description = course.stations.map((s) => s.title).join(locale === "en" ? ", " : "، ");
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "index,follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: ManagementProgram,
});

function ManagementProgram() {
  const { course, locale } = Route.useLoaderData();
  const copy = getCourseCatalogueCopy(locale);
  const count = course.stations.reduce((total, station) => total + station.steps.length, 0);
  const number = new Intl.NumberFormat(locale === "en" ? "en" : "ar");
  return (
    <CurriculumLayout
      line="academic"
      title={course.title}
      subtitle={`${number.format(count)} ${copy.lessons}`}
    >
      <a
        className="mb-8 inline-flex min-h-11 items-center self-start rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground"
        href={`/courses/academic/${encodeURIComponent(course.id)}?locale=${locale}`}
      >
        {copy.open}
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
