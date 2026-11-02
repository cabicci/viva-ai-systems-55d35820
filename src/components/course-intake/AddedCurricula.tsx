import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/lib/locale/locale-context";
import type { CourseArea } from "@/lib/course-system/contract";
import { curriculumCatalogue } from "@/lib/course-system/intake/client";
import { getCourseCatalogueCopy } from "@/lib/course-catalogue-copy";
import { intakeCopy } from "@/lib/course-system/intake/copy";
export function AddedCurricula({ area }: { area: CourseArea }) {
  const { locale } = useLocale();
  const c = getCourseCatalogueCopy(locale);
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
          className="block rounded-3xl border border-border/60 bg-card p-6 hover:border-primary/50"
          data-testid={`${area}-added-course`}
        >
          <h2 className="text-2xl font-black">{course.title}</h2>
          <p className="mt-3 text-muted-foreground">
            {course.stations.length} {c.modules} ·{" "}
            {course.stations.reduce((n, s) => n + s.steps.length, 0)} {c.lessons}
          </p>
          <p className="mt-3 font-bold text-primary">{c.open}</p>
        </a>
      ))}
    </>
  );
}
