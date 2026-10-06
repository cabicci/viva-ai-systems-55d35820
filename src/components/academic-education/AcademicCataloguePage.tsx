import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import {
  CURRICULUM_MODULE_CLASS,
  CURRICULUM_ROW_CLASS,
  CurriculumSectionHeader,
} from "@/components/site/CurriculumLayout";
import { useLocale } from "@/lib/locale/locale-context";
import { academicCatalogue } from "@/lib/academic-education/client";
import { getAcademicCopy } from "@/lib/academic-education/copy";

/** Ready for central route registration; public metadata never contains lesson bodies. */
export function AcademicCataloguePage({ courseId }: { courseId?: string }) {
  const { locale, dir } = useLocale();
  const c = getAcademicCopy(locale);
  const query = useQuery({
    queryKey: ["academic-catalogue", locale],
    queryFn: () => academicCatalogue(locale),
  });
  const course = query.data?.find((item) => item.id === courseId);
  const modules = [...new Set(course?.lessons.map((lesson) => lesson.moduleId) ?? [])];
  return (
    <div className="flex min-h-dvh flex-col" dir={dir}>
      <Navbar variant="account" />
      <main
        id="main-content"
        className="mx-auto w-full max-w-6xl flex-1 space-y-8 p-4 sm:p-6 md:p-10"
      >
        <header className="glass rounded-3xl p-6 md:p-10">
          <img
            src="/brand/masaarat-academic.png"
            alt={locale === "en" ? "Masaarat Academic" : "مسارات أكاديمي"}
            className="mb-6 h-24 w-auto object-contain"
          />
          <p className="mb-3 font-bold text-primary">
            {locale === "en" ? "Masaarat Academic" : "مسارات أكاديمي"}
          </p>
          <h1 className="text-3xl font-black md:text-4xl">{course?.title ?? c.catalogue}</h1>
          <p className="mt-4 leading-8 text-muted-foreground">{c.intro}</p>
        </header>
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
          <>
            <a className="font-bold text-primary" href={`/academic?locale=${locale}`}>
              {c.back}
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
          </>
        ) : query.data?.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {query.data.map((item) => (
              <article
                key={item.id}
                data-testid="academic-course-card"
                className="glass rounded-3xl border p-6"
              >
                <h2 className="mb-5 text-2xl font-bold">{item.title}</h2>
                <p className="mb-5 text-muted-foreground">
                  {item.lessons.length} {locale === "en" ? "lessons" : "درسًا"}
                </p>
                <a
                  href={`/academic/courses/${item.id}?locale=${locale}`}
                  className="inline-flex rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground"
                >
                  {c.open}
                </a>
              </article>
            ))}
          </div>
        ) : (
          <p>{c.empty}</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
