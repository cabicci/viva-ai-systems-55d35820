import { ArrowUpRight, BookOpen } from "lucide-react";
import { useLocale } from "@/lib/locale/locale-context";
import { getCourseCatalogueCopy } from "@/lib/course-catalogue-copy";

/** One full-width linked card per course, shared across learning areas. */
export function CourseCatalogue({
  line,
  courses,
}: {
  line: "ai" | "kids" | "academic" | "technical";
  courses: {
    id: string;
    title: string;
    description?: string;
    lessonCount: number;
    moduleCount: number;
    href: string;
  }[];
}) {
  const { locale } = useLocale();
  const c = getCourseCatalogueCopy(locale);
  const numbers = new Intl.NumberFormat(locale === "en" ? "en" : "ar");
  return (
    <div className="flex w-full min-w-0 flex-col gap-6" data-testid="course-catalogue">
      {courses.map((course) => (
        <a
          key={course.id}
          href={course.href}
          aria-label={`${c.open} — ${course.title}`}
          data-testid={`${line}-course-card`}
          className="group flex w-full min-w-0 flex-col gap-6 rounded-3xl border border-border/60 bg-card p-6 transition hover:border-primary/50 hover:shadow-[var(--shadow-card)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:flex-row sm:items-center md:p-8"
        >
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen aria-hidden className="h-8 w-8" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-2xl font-black md:text-3xl">{course.title}</h2>
            {course.description && (
              <p className="mt-3 leading-relaxed text-muted-foreground">{course.description}</p>
            )}
            <p className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-muted-foreground">
              <span>
                {numbers.format(course.lessonCount)} {c.lessons}
              </span>
              {course.moduleCount > 0 && (
                <span>
                  {numbers.format(course.moduleCount)} {c.modules}
                </span>
              )}
            </p>
          </div>
          <span className="inline-flex min-h-11 shrink-0 items-center gap-3 font-bold text-primary">
            {c.open}
            <ArrowUpRight aria-hidden className="h-5 w-5 rtl:-scale-x-100" />
          </span>
        </a>
      ))}
    </div>
  );
}
