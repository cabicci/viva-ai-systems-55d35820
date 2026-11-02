import { z } from "zod";

const catalogue = z.string().min(1).max(100);
export const isWholeCurriculumCatalogue = (id: string) =>
  /^(ai:pro_plus|kids|technical:[^:]+|academic:[^:]+)$/.test(id);
const create = z.object({
  action: z.literal("create"),
  data: z
    .object({
      email: z.string().trim().email().max(254),
      grant_kind: z.enum(["comprehensive", "single_curriculum"]).optional(),
      scope_mode: z.enum(["all_published", "selected"]),
      catalogues: z.array(catalogue).max(100),
      duration_days: z.number().int().min(1).max(36500).nullable(),
      invitation: z.boolean(),
      locale: z.enum(["ar-EG", "ar-MSA", "ar-Gulf", "en"]),
      key: z.string().uuid(),
    })
    .strict()
    .refine(
      (d) => (d.scope_mode === "selected" ? d.catalogues.length > 0 : d.catalogues.length === 0),
      "Invalid catalogue scope",
    )
    .refine(
      (d) =>
        d.grant_kind !== "single_curriculum" ||
        (d.scope_mode === "selected" &&
          d.catalogues.length === 1 &&
          isWholeCurriculumCatalogue(d.catalogues[0])),
      "Select exactly one whole curriculum",
    ),
});
export const emailAccessInput = z.discriminatedUnion("action", [
  create,
  z.object({ action: z.literal("list"), data: z.object({}).strict() }),
  z.object({
    action: z.literal("revoke"),
    data: z.object({ id: z.string().uuid(), key: z.string().uuid() }).strict(),
  }),
  z.object({
    action: z.literal("extend"),
    data: z
      .object({
        id: z.string().uuid(),
        key: z.string().uuid(),
        duration_days: z.number().int().min(1).max(36500),
      })
      .strict(),
  }),
]);
export type EmailAccessInput = z.infer<typeof emailAccessInput>;
export type EmailAccessGrant = {
  id: string;
  recipient_email: string;
  grant_kind?: "comprehensive" | "single_curriculum";
  monthly_questions?: 100 | 300;
  scope_mode: "all_published" | "selected";
  catalogues: string[];
  duration_days: number | null;
  user_id: string | null;
  activated_at: string | null;
  ends_at: string | null;
  revoked_at: string | null;
  created_at: string;
  status: "pending_registration" | "active" | "expired" | "revoked";
  invitation_status: string | null;
  audit: {
    id: string;
    actor: string | null;
    action: string;
    details: Record<string, unknown>;
    created_at: string;
  }[];
};
export type EmailAccessData = {
  catalogues: { id: string; title: string; titles?: Record<string, string> }[];
  grants: EmailAccessGrant[];
};
export function emailAccessCopy(locale: string) {
  return locale === "en"
    ? {
        title: "Grant access by email",
        email: "Recipient email",
        scope: "Access scope",
        grantKind: "Invitation type",
        comprehensive: "Comprehensive invitation · 300 questions monthly",
        single: "One curriculum · 100 questions monthly",
        curriculum: "Choose one curriculum",
        choose: "Select a published curriculum",
        wholeAi: "Complete artificial intelligence curriculum",
        all: "All published lessons",
        selected: "Selected packages / catalogues",
        permanent: "Permanent",
        days: "Duration in days",
        duration: "Duration",
        invitation: "Send invitation email",
        invitationLanguage: "Invitation language",
        create: "Grant access",
        saved: "Grant saved",
        pending_registration: "Pending acceptance or registration",
        active: "Active",
        expired: "Expired",
        revoked: "Revoked",
        revoke: "Revoke",
        extend: "Extend",
        audit: "Audit history",
        search: "Search by email",
        filter: "Status",
        any: "All statuses",
        empty: "No grants",
        error: "Could not save or load grants. Refresh before retrying.",
        note: "No paid subscription is required. Access and monthly questions start on acceptance and last only while the invitation is valid. You can send separate curriculum invitations to the same email. Kids consent and child profiles remain required.",
        activation: "Activated",
        expiry: "Expires",
        mail: "Invitation",
        none: "Not requested",
        refresh: "Refresh",
        created: "Created",
        activated: "Activated",
        extended: "Extended",
      }
    : {
        title: "منح وصول بالبريد الإلكتروني",
        email: "بريد المستفيد",
        scope: "نطاق الوصول",
        grantKind: "نوع الدعوة",
        comprehensive: "دعوة شاملة · ٣٠٠ سؤال شهريًا",
        single: "منهج واحد · ١٠٠ سؤال شهريًا",
        curriculum: "اختيار منهج واحد",
        choose: "اختر منهجًا منشورًا",
        wholeAi: "منهج الذكاء الاصطناعي كاملًا",
        all: "كل الدروس المنشورة",
        selected: "باكدجات / كتالوجات محددة",
        permanent: "دائم",
        days: "المدة بالأيام",
        duration: "المدة",
        invitation: "إرسال دعوة بالبريد",
        invitationLanguage: "لغة الدعوة",
        create: "منح الوصول",
        saved: "تم حفظ المنحة",
        pending_registration: "بانتظار القبول أو التسجيل",
        active: "نشط",
        expired: "منتهي",
        revoked: "ملغى",
        revoke: "إلغاء المنحة",
        extend: "تمديد",
        audit: "سجل التغييرات",
        search: "بحث بالبريد",
        filter: "الحالة",
        any: "كل الحالات",
        empty: "لا توجد منح",
        error: "تعذر حفظ المنح أو تحميلها. حدّث القائمة قبل إعادة المحاولة.",
        note: "لا يلزم اشتراك مدفوع. يبدأ الوصول وحصة الأسئلة الشهرية عند قبول الدعوة، ويستمران فقط طوال سريانها. يمكن إرسال دعوات مناهج منفصلة للبريد نفسه. يظل محتوى الأطفال مرتبطًا بموافقة ولي الأمر وملفات الأطفال.",
        activation: "تاريخ التفعيل",
        expiry: "تاريخ الانتهاء",
        mail: "الدعوة",
        none: "لم تُطلب",
        refresh: "تحديث",
        created: "إنشاء",
        activated: "تفعيل",
        extended: "تمديد",
      };
}
