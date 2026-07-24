import type { SupportedLocale } from "@/lib/locale/types";
import type { RagPackageLocale } from "@/lib/locale-lessons/types";
import { APPROVED_LOCALES } from "./constants";

const APPROVED_SET = new Set<string>(APPROVED_LOCALES);

/** Map runtime locale to RAG package locale (all four unified package locales). */
export function resolveAssistantPackageLocale(locale: SupportedLocale): RagPackageLocale | null {
  return APPROVED_SET.has(locale) ? (locale as RagPackageLocale) : null;
}
