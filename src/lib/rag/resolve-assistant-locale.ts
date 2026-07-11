import type { SupportedLocale } from "@/lib/locale/types";
import { isPackageLocale } from "@/lib/locale-lessons/registry";
import type { LessonPackageLocale } from "@/lib/locale-lessons/types";

/** Map runtime locale to RAG package locale; Egyptian falls back to legacy retrieval. */
export function resolveAssistantPackageLocale(
  locale: SupportedLocale,
): LessonPackageLocale | null {
  return isPackageLocale(locale) ? locale : null;
}
