import { supabase } from "@/integrations/supabase/client";
import type { CourseArea } from "../contract";
import type { SupportedLocale } from "@/lib/locale/types";
import { z } from "zod";

export const curriculumJourneyInput = z
  .object({
    expectedAccountId: z.string().uuid(),
    area: z.enum(["ai", "academic", "technical", "kids"]),
    course: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9-]{0,79}$/),
    locale: z.enum(["ar-EG", "ar-MSA", "ar-Gulf", "en"]),
    version: z.string().regex(/^[a-f0-9]{64}$/),
    profileId: z.string().uuid().optional(),
  })
  .strict();
const version = z.string().regex(/^[a-f0-9]{64}$/);
export const curriculumJourneyResult = z
  .object({
    area: z.enum(["ai", "academic", "technical", "kids"]),
    course: z.string(),
    locale: z.enum(["ar-EG", "ar-MSA", "ar-Gulf", "en"]),
    profileId: z.string().uuid().nullable(),
    activeVersion: version,
    recordId: z.string().uuid().nullable(),
    reviewOnly: z.boolean(),
    lessons: z.array(
      z
        .object({
          lesson: z.string(),
          available: z.boolean(),
          required: z.number().int().nonnegative(),
          completed: z.number().int().nonnegative(),
          done: z.boolean(),
          deliveryVersion: version,
        })
        .strict(),
    ),
    resume: z
      .object({
        lesson: z.string(),
        ratio: z.number().min(0).max(1),
        contentVersion: version,
        savedAt: z.string().refine((value) => Number.isFinite(Date.parse(value))),
      })
      .strict()
      .nullable(),
  })
  .strict();
export type CurriculumJourney = z.infer<typeof curriculumJourneyResult>;
export type CurriculumJourneyInput = Omit<
  z.infer<typeof curriculumJourneyInput>,
  "expectedAccountId"
>;
const positionFields = {
  expectedAccountId: z.string().uuid(),
  recordId: z.string().uuid(),
  lesson: z.string().min(1).max(80),
  locale: z.enum(["ar-EG", "ar-MSA", "ar-Gulf", "en"]),
  contentVersion: version,
};
export const curriculumPositionInput = z.discriminatedUnion("action", [
  z.object({ ...positionFields, action: z.literal("position") }).strict(),
  z
    .object({
      ...positionFields,
      action: z.literal("save_position"),
      ratio: z.number().finite().min(0).max(1),
    })
    .strict(),
]);
export const curriculumPositionResult = z.union([
  z.object({}).strict(),
  z.object({ ratio: z.number().finite().min(0).max(1), contentVersion: version }).strict(),
]);
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
