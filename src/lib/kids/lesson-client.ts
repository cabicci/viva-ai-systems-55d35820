import type { SupportedLocale } from "@/lib/locale/types";
import type { KidsLevelId } from "./catalogue";

export type KidsLesson = {
  locale: SupportedLocale;
  title: string;
  subtitle?: string;
  objectives?: string[];
  scenes?: Array<{ id?: string; title?: string; display?: string; narration?: string }>;
  reading?: Array<{ id?: string; title?: string; text?: string }>;
  activity?: { title?: string; instructions?: string; starter?: string };
  quiz?: Array<{ id: string; question: string; options: string[] }>;
  mission?: { title?: string; instructions?: string; rubric?: string[] };
  hints?: Array<{ question?: string; source?: string; sourceScene?: string }>;
};
export function parseProtectedLesson(
  payload: unknown,
  levelId: KidsLevelId,
  lessonNumber: number,
  locale: SupportedLocale,
): KidsLesson | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const response = payload as Record<string, unknown>;
  if (
    !response.lesson ||
    typeof response.lesson !== "object" ||
    !response.citation ||
    typeof response.citation !== "object"
  )
    return null;
  const lesson = response.lesson as Record<string, unknown>;
  const citation = response.citation as Record<string, unknown>;
  if (
    citation.product !== "kids" ||
    citation.levelId !== levelId ||
    citation.lessonNumber !== lessonNumber ||
    citation.locale !== locale ||
    typeof citation.sourceSha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(citation.sourceSha256) ||
    lesson.locale !== locale ||
    typeof lesson.title !== "string" ||
    !lesson.title.trim()
  )
    return null;
  if ("educatorNotes" in lesson || "sampleAnswer" in lesson || "production" in lesson) return null;
  if (
    lesson.objectives !== undefined &&
    (!Array.isArray(lesson.objectives) ||
      !lesson.objectives.every((value) => typeof value === "string"))
  )
    return null;
  if (
    lesson.scenes !== undefined &&
    (!Array.isArray(lesson.scenes) ||
      !lesson.scenes.every(
        (item) => item && typeof item === "object" && typeof item.title === "string",
      ))
  )
    return null;
  if (
    lesson.quiz !== undefined &&
    (!Array.isArray(lesson.quiz) ||
      !lesson.quiz.every(
        (item) =>
          item &&
          typeof item === "object" &&
          typeof item.id === "string" &&
          typeof item.question === "string" &&
          Array.isArray(item.options) &&
          item.options.every((option: unknown) => typeof option === "string") &&
          !("answer" in item) &&
          !("explanation" in item),
      ))
  )
    return null;
  return lesson as KidsLesson;
}

const GUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const SIGNED_EMBED = new RegExp(`^/embed/761387/${GUID}$`, "i");
export function parseProtectedPlayback(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  if (
    typeof data.embedUrl !== "string" ||
    typeof data.expires !== "number" ||
    !Number.isSafeInteger(data.expires) ||
    data.expires <= Math.floor(Date.now() / 1000)
  )
    return null;
  try {
    const url = new URL(data.embedUrl);
    if (
      url.origin !== "https://player.mediadelivery.net" ||
      !SIGNED_EMBED.test(url.pathname) ||
      !/^[a-f0-9]{64}$/i.test(url.searchParams.get("token") ?? "") ||
      url.searchParams.get("expires") !== String(data.expires) ||
      [...url.searchParams.keys()].some((key) => key !== "token" && key !== "expires")
    )
      return null;
    return url.toString();
  } catch {
    return null;
  }
}
