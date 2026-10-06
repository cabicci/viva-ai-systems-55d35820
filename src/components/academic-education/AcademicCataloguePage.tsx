import { getCourseCatalogueCopy } from "@/lib/course-catalogue-copy";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { CourseCatalogue } from "@/components/site/CourseCatalogue";
import {
  CurriculumLayout,
  CURRICULUM_MODULE_CLASS,
  CURRICULUM_ROW_CLASS,
  CurriculumSectionHeader,
} from "@/components/site/CurriculumLayout";
import { useLocale } from "@/lib/locale/locale-context";
import { academicCatalogue } from "@/lib/academic-education/client";
import { getAcademicCopy } from "@/lib/academic-education/copy";

/** Ready for central route registration; public metadata never contains lesson bodies. */
export function AcademicCataloguePage({ courseId }: { courseId?: string }) {
  const { user, loading } = useAuth();
  const { locale } = useLocale();
  const c = getAcademicCopy(locale);
  const query = useQuery({
    queryKey: ["academic-catalogue", user?.id ?? "anonymous", locale],
    enabled: !loading,
    queryFn: () => academicCatalogue(locale),
  });
  const course = query.data?.find((item) => item.id === courseId);
  const modules = [...new Set(course?.lessons.map((lesson) => lesson.moduleId) ?? [])];
  return (
    <CurriculumLayout
      line="academic"
      title={course?.title}
      subtitle={getCourseCatalogueCopy(locale).intro}
    >
      {query.data?.some((item) => item.reviewOnly) && (
        <p role="status" className="rounded-xl border p-4">
          {c.reviewOnly}
        </p>
      )}
      {query.isPending ? (
        <p role="status">{c.loading}</p>
      ) : query.isError ? (
        <div role="alert">
          <p>{c.unavailable}</p>
          <button className="mt-3 underline" onClick={() => void query.refetch()}>
            {locale === "en" ? "Retry" : "إعادة المحاولة"}
          </button>
        </div>
      ) : courseId && !course ? (
        <p>{c.empty}</p>
      ) : course ? (
        <div className="space-y-6">
          <a className="font-bold text-primary" href={`/academic/curriculum?locale=${locale}`}>
            {getCourseCatalogueCopy(locale).back}
          </a>
          {modules.map((module, index) => (
            <section className={CURRICULUM_MODULE_CLASS} key={module}>
              <CurriculumSectionHeader title={`${c.unit} ${index + 1}`} />
              {course.lessons
                .filter((lesson) => lesson.moduleId === module)
                .map((lesson) => (
                  <a
                    className={CURRICULUM_ROW_CLASS}
                    key={lesson.id}
                    href={`/academic/learn/${lesson.id}?locale=${locale}`}
                  >
                    <span className="min-w-0 flex-1">{lesson.title}</span>
                    <span>{c.lesson}</span>
                  </a>
                ))}
            </section>
          ))}
        </div>
      ) : query.data?.length ? (
        <CourseCatalogue
          line="academic"
          courses={query.data.map((item) => ({
            id: item.id,
            title: item.title,
            lessonCount: item.lessons.length,
            moduleCount: new Set(item.lessons.map((lesson) => lesson.moduleId)).size,
            href: `/academic/courses/${item.id}?locale=${locale}`,
          }))}
        />
      ) : (
        <p>{c.empty}</p>
      )}
    </CurriculumLayout>
  );
}
