import { supabase } from "@/integrations/supabase/client";
import type { SupportedLocale } from "@/lib/locale/types";

export type AcademicProgress = {
  read: boolean;
  quizPassed: boolean;
  practiceSubmitted: boolean;
  drafts: Partial<Record<SupportedLocale, string[]>>;
};
export type AcademicAction = "status" | "lesson" | "read" | "quiz" | "practice" | "reset_quiz";
export const academicQueryKey = (
  userId: string | undefined,
  courseId: string,
  lessonId: string,
  locale: SupportedLocale,
) => ["academic-lesson", userId, courseId, lessonId, locale] as const;
export async function academicCommand<T>(
  action: AcademicAction,
  course: string,
  lesson: string | null,
  locale: SupportedLocale,
  data: unknown = {},
): Promise<T> {
  const response = await supabase.rpc(
    "academic_command" as never,
    {
      p_action: action,
      p_course: course,
      p_lesson: lesson,
      p_locale: locale,
      p_data: data,
    } as never,
  );
  if (response.error) throw new Error("ACADEMIC_UNAVAILABLE");
  return response.data as T;
}
export async function academicDownload(path: string, name: string) {
  const response = await supabase.storage
    .from("academic-downloads")
    .createSignedUrl(path, 300, { download: name });
  if (response.error || !response.data?.signedUrl) throw new Error("ACADEMIC_DOWNLOAD_UNAVAILABLE");
  window.location.assign(response.data.signedUrl);
}
