import { supabase } from "@/integrations/supabase/client";
import type { CourseArea } from "../contract";
import type { SupportedLocale } from "@/lib/locale/types";
export type CurriculumSummary = {
  id: string;
  area: CourseArea;
  title: string;
  version: string;
  stations: { id: string; title: string; steps: { id: string; title: string }[] }[];
};
export async function curriculumCatalogue(
  area: CourseArea,
  locale: SupportedLocale,
): Promise<CurriculumSummary[]> {
  const r = await supabase.rpc(
    "curriculum_catalogue" as never,
    { p_area: area, p_locale: locale } as never,
  );
  if (r.error) throw new Error(r.error.message);
  if (!Array.isArray(r.data)) throw new Error("CURRICULUM_RESPONSE_INVALID");
  return r.data as CurriculumSummary[];
}
export async function curriculumCommand<T>(action: string, data: object): Promise<T> {
  const r = await supabase.rpc(
    "curriculum_command" as never,
    { p_action: action, p_data: data } as never,
  );
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
}
