import { useCallback, useSyncExternalStore } from "react";
import { catalog } from "./catalog";

// Private preview only. Main integration must use existing account lesson_progress.
const KEY = "masaarat:technical-preview:v1";
const EVENT = "masaarat:technical-preview-change";
const lessonIds = new Set(catalog.lessons.map((lesson) => lesson.id));
export type PreviewLessonProgress = {
  read?: boolean;
  quizPassed?: boolean;
  practiceReviewed?: boolean;
  drafts?: Record<string, string[]>;
};
export type PreviewProgress = Record<string, PreviewLessonProgress>;
export function parsePreviewProgress(raw: string): PreviewProgress {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const result: PreviewProgress = {};
    for (const [id, entry] of Object.entries(parsed)) {
      if (!lessonIds.has(id) || !entry || typeof entry !== "object" || Array.isArray(entry))
        continue;
      const value = entry as PreviewLessonProgress;
      const drafts: Record<string, string[]> = {};
      for (const [locale, draft] of Object.entries(value.drafts ?? {})) {
        if (["ar-EG", "ar-MSA", "ar-Gulf", "en"].includes(locale) && Array.isArray(draft))
          drafts[locale] = draft
            .filter((v): v is string => typeof v === "string")
            .slice(0, 10)
            .map((v) => v.slice(0, 20000));
      }
      result[id] = {
        read: value.read === true,
        quizPassed: value.quizPassed === true,
        practiceReviewed: value.practiceReviewed === true,
        drafts,
      };
    }
    return result;
  } catch {
    return {};
  }
}
function snapshot() {
  try {
    return window.localStorage.getItem(KEY) ?? "{}";
  } catch {
    return "{}";
  }
}
function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(EVENT, listener);
  };
}
export function previewCompleted(entry?: PreviewLessonProgress) {
  return (
    Number(entry?.read === true) +
    Number(entry?.quizPassed === true) +
    Number(entry?.practiceReviewed === true)
  );
}
export function useTechnicalPreviewProgress() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "{}");
  const update = useCallback((id: string, patch: Partial<PreviewLessonProgress>) => {
    if (!lessonIds.has(id)) return false;
    try {
      const latest = parsePreviewProgress(snapshot());
      latest[id] = { ...latest[id], ...patch };
      const next = JSON.stringify(latest);
      window.localStorage.setItem(KEY, next);
      window.dispatchEvent(new Event(EVENT));
      return true;
    } catch {
      return false;
    }
  }, []);
  return { progress: parsePreviewProgress(raw), update };
}
