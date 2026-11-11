import { z } from "zod";

const dates = z
  .object({
    title: z.string().trim().min(1).max(160),
    targets: z
      .array(z.string().min(1).max(140))
      .min(1)
      .max(100)
      .refine((v) => new Set(v).size === v.length, "Duplicate targets"),
    starts_at: z.string().datetime({ offset: true }),
    ends_at: z.string().datetime({ offset: true }),
    enabled: z.boolean(),
    assistant_questions: z.number().int().min(0).max(1000).optional(),
    email_notices: z.boolean().optional(),
    key: z.string().uuid(),
  })
  .strict();
const ordered = (v: { starts_at: string; ends_at: string }) =>
  Date.parse(v.starts_at) < Date.parse(v.ends_at);
export const freeAccessInput = z.discriminatedUnion("action", [
  z.object({ action: z.literal("list"), data: z.object({}).strict() }).strict(),
  z
    .object({ action: z.literal("create"), data: dates.refine(ordered, "End must follow start") })
    .strict(),
  z
    .object({
      action: z.literal("update"),
      data: dates
        .extend({
          id: z.string().uuid(),
          expected_version: z.number().int().positive(),
        })
        .refine(ordered, "End must follow start"),
    })
    .strict(),
]);
export type FreeAccessInput = z.infer<typeof freeAccessInput>;
export type FreeAccessTarget = {
  id: string;
  title: string;
  titles?: Record<string, string>;
  published: boolean;
};
export type FreeAccessWindow = {
  id: string;
  title: string;
  targets: string[];
  starts_at: string;
  ends_at: string;
  enabled: boolean;
  assistant_questions?: number;
  email_notices?: boolean;
  version: number;
  status: "scheduled" | "active" | "expired" | "paused";
};
export type FreeAccessAdminData = {
  targets: FreeAccessTarget[];
  windows: FreeAccessWindow[];
  server_time: string;
  audit: { window_id: string; action: string; created_at: string }[];
};
export const freeAccessSnapshot = z.object({
  server_time: z.string().datetime({ offset: true }),
  valid_until: z.string().datetime({ offset: true }),
  targets: z.array(z.string()),
  lesson_ids: z.array(z.string()),
});
export type FreeAccessSnapshot = z.infer<typeof freeAccessSnapshot>;

const parts = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
export function utcToCairoInput(value: string): string {
  const p = Object.fromEntries(parts(new Date(value)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
/** Reject Cairo's missing/repeated wall-clock minutes instead of silently shifting a campaign. */
export function cairoInputToUtc(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("INVALID_CAIRO_TIME");
  const anchor = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(anchor)) throw new Error("INVALID_CAIRO_TIME");
  const candidates: string[] = [];
  for (let offset = -14; offset <= 14; offset++) {
    const d = new Date(anchor - offset * 3600000);
    if (utcToCairoInput(d.toISOString()) === value) candidates.push(d.toISOString());
  }
  if (candidates.length !== 1) throw new Error("AMBIGUOUS_OR_MISSING_CAIRO_TIME");
  return candidates[0];
}
export function freeAccessCopy(locale: string) {
  return locale === "en"
    ? {
        title: "Free access periods",
        name: "Offer name",
        targets: "Paths and curricula",
        start: "Starts (Cairo time)",
        end: "Ends (Cairo time)",
        save: "Save period",
        create: "Create period",
        cancel: "Cancel edit",
        edit: "Edit",
        pause: "Stop early",
        resume: "Enable",
        enabled: "Enabled",
        saved: "Period saved",
        error: "Could not save. Refresh and check for a newer edit before retrying.",
        dates:
          "Choose an end after the start. Cairo clock-change minutes that repeat or do not exist cannot be used.",
        note: "One shared start and end for every registered account. Learners keep their progress.",
        questions: "Extra AI questions per account during the period",
        questionsNote:
          "The allowance is shared across selected courses and expires with the period. Enter 0 to keep the regular allowance only.",
        emails: "Send campaign emails when enabled",
        unpublished: "Not published yet",
        empty: "No free access periods",
        scheduled: "Scheduled",
        active: "Active",
        expired: "Expired",
        paused: "Stopped",
        refresh: "Refresh",
        audit: "Change history",
      }
    : {
        title: "فترات الإتاحة المجانية",
        name: "اسم العرض",
        targets: "المسارات والمناهج",
        start: "البداية (بتوقيت القاهرة)",
        end: "النهاية (بتوقيت القاهرة)",
        save: "حفظ الفترة",
        create: "إضافة فترة",
        cancel: "إلغاء التعديل",
        edit: "تعديل",
        pause: "إيقاف مبكر",
        resume: "تفعيل",
        enabled: "مفعّل",
        saved: "تم حفظ الفترة",
        error: "تعذر الحفظ. حدّث القائمة وتحقق من وجود تعديل أحدث قبل إعادة المحاولة.",
        dates:
          "اختر نهاية بعد البداية. لا يمكن استخدام دقيقة تتكرر أو لا توجد وقت تغيير الساعة في القاهرة.",
        note: "بداية ونهاية موحّدتان لكل الحسابات المسجّلة، ويظل تقدم المتعلمين محفوظًا.",
        questions: "أسئلة إضافية للمساعد لكل حساب خلال الفترة",
        questionsNote:
          "الحصة مشتركة بين المناهج المحددة وتنتهي مع الفترة. اختر صفرًا للاكتفاء بالحصة المعتادة.",
        emails: "إرسال رسائل الحملة عند تفعيل الفترة",
        unpublished: "غير منشور بعد",
        empty: "لا توجد فترات إتاحة مجانية",
        scheduled: "مجدول",
        active: "نشط",
        expired: "منتهٍ",
        paused: "متوقف",
        refresh: "تحديث",
        audit: "سجل التغييرات",
      };
}
