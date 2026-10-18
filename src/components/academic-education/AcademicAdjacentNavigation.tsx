import { useQuery } from "@tanstack/react-query";
import { academicCatalogue, academicCanAccess } from "@/lib/academic-education/client";
import { academicAdjacentLessons } from "@/lib/academic-education/adjacent-lessons";
import { getAcademicCopy } from "@/lib/academic-education/copy";
import type { SupportedLocale } from "@/lib/locale/types";

export function AcademicAdjacentNavigation({
  userId,
  courseId,
  lessonId,
  locale,
}: {
  userId: string | undefined;
  courseId: string;
  lessonId: string;
  locale: SupportedLocale;
}) {
  const c = getAcademicCopy(locale);
  const query = useQuery({
    queryKey: ["academic-adjacent", userId, courseId, lessonId, locale],
    enabled: !!userId,
    queryFn: async () =>
      academicAdjacentLessons(await academicCatalogue(locale), courseId, lessonId, (candidate) =>
        academicCanAccess(courseId, candidate, locale),
      ),
    staleTime: 30_000,
    retry: false,
  });
  if (!userId) return null;
  if (query.isPending) return <p role="status">{c.navigationLoading}</p>;
  if (query.isError)
    return (
      <div role="status" className="mt-6 space-y-2">
        <p>{c.navigationUnavailable}</p>
        <button
          type="button"
          className="min-h-11 rounded-lg border px-4 py-2"
          onClick={() => void query.refetch()}
        >
          {c.navigationRetry}
        </button>
      </div>
    );
  const { previous, next } = query.data;
  if (!previous && !next) return null;
  return (
    <nav
      aria-label={c.navigation}
      dir={locale === "en" ? "ltr" : "rtl"}
      className="mt-8 grid min-w-0 gap-3 sm:grid-cols-2"
    >
      {(
        [
          ["previous", previous],
          ["next", next],
        ] as const
      ).map(([direction, lesson]) =>
        lesson ? (
          <a
            key={direction}
            href={`/academic/learn/${encodeURIComponent(lesson.id)}?locale=${locale}`}
            className="min-w-0 break-words rounded-xl border p-4 hover:bg-muted"
          >
            <span className="block font-bold">{c[direction]}</span>
            <span className="mt-1 block text-sm">{lesson.title}</span>
          </a>
        ) : null,
      )}
    </nav>
  );
}
