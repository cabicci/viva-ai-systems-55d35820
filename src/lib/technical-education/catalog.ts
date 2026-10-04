import catalog from "./catalog.json";
import type { SupportedLocale } from "@/lib/locale/types";
import type { TechnicalLesson } from "./types";

export { catalog };
const packages = import.meta.glob<TechnicalLesson>("./lessons/*.json", { import: "default" });
export function hasTechnicalLesson(id: string, locale: SupportedLocale) {
  return id === "M04-L02" || `./lessons/${id}__${locale}.json` in packages;
}
export async function loadTechnicalLesson(id: string, locale: SupportedLocale) {
  return packages[`./lessons/${id}__${locale}.json`]?.() ?? null;
}
export function technicalLessonHref(id: string, locale: SupportedLocale) {
  return id === "M04-L02"
    ? `/experiments/furniture-pilot?locale=${locale}`
    : `/experiments/technical-education?lesson=${encodeURIComponent(id)}&locale=${locale}`;
}
export function technicalDownloadName(type: string, title: string) {
  return (
    `${type} — ${title}`
      .replace(/[:<>"/\\|?*]/g, " - ")
      .replace(/\s+/g, " ")
      .trim() + ".pdf"
  );
}
