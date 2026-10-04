import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KIDS_LEVELS } from "./catalogue";
import type { KidsLevelId } from "./catalogue";
import type { SupportedLocale } from "@/lib/locale/types";

export function parseKidsCatalogueTitles(
  payload: unknown,
  levelId: KidsLevelId,
  locale: SupportedLocale,
): string[] | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as { levelId?: unknown; locale?: unknown; titles?: unknown };
  const level = KIDS_LEVELS.find((entry) => entry.id === levelId)!;
  if (
    data.levelId !== levelId ||
    data.locale !== locale ||
    !Array.isArray(data.titles) ||
    data.titles.length !== level.lessonCount
  )
    return null;
  const titles = data.titles.map((entry: unknown, index) => {
    if (!entry || typeof entry !== "object") return null;
    const row = entry as { lessonNumber?: unknown; title?: unknown };
    return row.lessonNumber === index + 1 &&
      typeof row.title === "string" &&
      row.title.trim() &&
      row.title.length <= 160
      ? row.title.trim()
      : null;
  });
  return titles.every((title): title is string => typeof title === "string") ? titles : null;
}

export function useKidsCurriculumTitles(locale: SupportedLocale) {
  const [catalogue, setCatalogue] = useState<{
    locale: SupportedLocale;
    titles: Partial<Record<KidsLevelId, string[]>>;
    unavailable: KidsLevelId[];
  } | null>(null);
  useEffect(() => {
    let active = true;
    void Promise.all(
      KIDS_LEVELS.map(async (level) => {
        try {
          const { data, error } = await supabase.functions.invoke("kids-catalogue", {
            body: { levelId: level.id, locale },
          });
          return {
            levelId: level.id,
            titles: error ? null : parseKidsCatalogueTitles(data, level.id, locale),
          };
        } catch {
          return { levelId: level.id, titles: null };
        }
      }),
    ).then((results) => {
      if (!active) return;
      setCatalogue({
        locale,
        titles: Object.fromEntries(
          results.filter((row) => row.titles).map((row) => [row.levelId, row.titles]),
        ),
        unavailable: results.filter((row) => !row.titles).map((row) => row.levelId),
      });
    });
    return () => {
      active = false;
    };
  }, [locale]);
  // A prior locale must never flash while the new catalogue is loading.
  return catalogue?.locale === locale ? catalogue : null;
}
