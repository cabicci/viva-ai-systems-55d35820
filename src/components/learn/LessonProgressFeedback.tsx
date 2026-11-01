import * as React from "react";
import type { useLessonProgress } from "@/lib/lesson-progress";
import { useLocale } from "@/lib/locale/locale-context";
import type { SupportedLocale } from "@/lib/locale/types";
type WriteState = { lessonId: string; status: "idle" | "pending" | "success" | "error"; error: Error | null };
type Progress = Pick<ReturnType<typeof useLessonProgress>, "isLoaded" | "isError" | "refetch"> & {
  writeState?: WriteState | null;
  isFetching?: boolean;
};
const COPY: Record<SupportedLocale, { loading: string; readError: string; retry: string; saving: string; saved: string; writeError: string }> = {
  "ar-EG": { loading: "بنحمّل تقدمك المحفوظ…", readError: "ما قدرناش نحمّل تقدمك. جرّب تاني.", retry: "حاول تحميل التقدم تاني", saving: "بنحفظ تقدمك…", saved: "اتحفظ تقدمك.", writeError: "تقدمك ما اتحفظش. تقدر تحاول تاني من الدرس." },
  "ar-MSA": { loading: "جارٍ تحميل تقدمك المحفوظ…", readError: "تعذر تحميل تقدمك. حاول مجددًا.", retry: "إعادة تحميل التقدم", saving: "جارٍ حفظ تقدمك…", saved: "تم حفظ تقدمك.", writeError: "لم يُحفظ تقدمك. يمكنك المحاولة مجددًا من الدرس." },
  "ar-Gulf": { loading: "نحمّل تقدمك المحفوظ…", readError: "ما قدرنا نحمّل تقدمك. حاول مرة ثانية.", retry: "أعد تحميل التقدم", saving: "نحفظ تقدمك…", saved: "انحفظ تقدمك.", writeError: "ما انحفظ تقدمك. تقدر تحاول مرة ثانية من الدرس." },
  en: { loading: "Loading your saved progress…", readError: "Your progress could not be loaded. Try again.", retry: "Reload progress", saving: "Saving your progress…", saved: "Your progress was saved.", writeError: "Your progress was not saved. You can try again from the lesson." },
};
export function LessonProgressFeedback({ progress, lessonId }: { progress: Progress; lessonId: string }) {
  const { locale, dir } = useLocale();
  const copy = COPY[locale];
  const write = progress.writeState?.lessonId === lessonId ? progress.writeState : null;
  if (progress.isError) return (
    <div role="alert" dir={dir} className="mb-4 rounded-xl border border-destructive/40 p-3 text-sm">
      <p>{copy.readError}</p>
      <button type="button" className="mt-2 underline" onClick={() => { void progress.refetch(); }}>{copy.retry}</button>
    </div>
  );
  if (progress.isFetching || !progress.isLoaded) return <p role="status" aria-live="polite" dir={dir} className="mb-4 text-sm">{copy.loading}</p>;
  if (!write || write.status === "idle") return null;
  if (write.status === "error") return <p role="alert" dir={dir} className="mb-4 text-sm text-destructive">{copy.writeError}</p>;
  return <p role="status" aria-live="polite" dir={dir} className="mb-4 text-sm">{write.status === "pending" ? copy.saving : copy.saved}</p>;
}
