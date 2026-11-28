import { intakeCopy } from "@/lib/course-system/intake/copy";
import { LessonReadUnavailable } from "@/lib/course-system/intake/client";
import type { SupportedLocale } from "@/lib/locale/types";

export function LessonLoadNotice({
  locale,
  loading,
  error,
  retry,
  plansUrl,
}: {
  locale: SupportedLocale;
  loading: boolean;
  error: Error | null;
  retry: () => void;
  plansUrl: string;
}) {
  const c = intakeCopy(locale);
  if (loading) return <p role="status">{c.loading}</p>;
  if (error instanceof LessonReadUnavailable) {
    return (
      <div className="mt-6" role="alert">
        <p>{c.lessonReadFailed}</p>
        <button type="button" className="mt-3 underline" onClick={retry}>
          {c.retry}
        </button>
      </div>
    );
  }
  return (
    <p className="mt-6">
      {c.locked}{" "}
      <a className="text-primary underline" href={plansUrl}>
        {c.packages}
      </a>
    </p>
  );
}
