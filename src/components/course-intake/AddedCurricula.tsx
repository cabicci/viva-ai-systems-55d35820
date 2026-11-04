import { ArrowUpRight, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/lib/locale/locale-context";
import type { CourseArea } from "@/lib/course-system/contract";
import { curriculumCatalogue } from "@/lib/course-system/intake/client";
import { getCourseCatalogueCopy } from "@/lib/course-catalogue-copy";
import { intakeCopy } from "@/lib/course-system/intake/copy";
import { catalogueDescription } from "./CoursePresentation";
export function AddedCurricula({ area }: { area: CourseArea }) {
  const { locale } = useLocale();
  const c = getCourseCatalogueCopy(locale);
  const numbers = new Intl.NumberFormat(locale === "en" ? "en" : "ar");
  const q = useQuery({
    queryKey: ["added-curricula", area, locale],
    queryFn: () => curriculumCatalogue(area, locale),
    staleTime: 30000,
    throwOnError: false,
  });
  if (q.isError)
    return (
      <p role="status">
        {intakeCopy(locale).catalogueUnavailable}{" "}
        <button className="text-primary underline" onClick={() => void q.refetch()}>
          {intakeCopy(locale).retry}
        </button>
      </p>
    );
  return (
    <>
      {q.data?.map((course) => (
        <a
          key={course.id}
          href={`/courses/${area}/${course.id}?locale=${locale}`}
          aria-label={`${c.open} — ${course.title}`}
          className="group flex w-full min-w-0 flex-col gap-6 rounded-3xl border border-border/60 bg-card p-6 transition hover:border-primary/50 hover:shadow-[var(--shadow-card)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:flex-row sm:items-center md:p-8"
          data-testid={`${area}-added-course`}
        >
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen aria-hidden className="h-8 w-8" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-2xl font-black md:text-3xl">{course.title}</h2>
            {catalogueDescription(course.id, course.stations, locale) && (
              <p className="mt-3 leading-8 text-muted-foreground">
                {catalogueDescription(course.id, course.stations, locale)}
              </p>
            )}
            <p className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-muted-foreground">
              <span>
                {numbers.format(course.stations.reduce((n, s) => n + s.steps.length, 0))}{" "}
                {c.lessons}
              </span>
              <span>
                {numbers.format(course.stations.length)} {c.modules}
              </span>
            </p>
          </div>
          <span className="inline-flex min-h-11 shrink-0 items-center gap-3 font-bold text-primary">
            {c.open}
            <ArrowUpRight aria-hidden className="h-5 w-5 rtl:-scale-x-100" />
          </span>
        </a>
      ))}
    </>
  );
}
