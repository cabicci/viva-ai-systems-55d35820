import { z } from "zod";

const date = z.string().refine((v) => Number.isFinite(Date.parse(v)), "Invalid date");
export const sourceKinds = [
  "core_subscription",
  "academic_subscription",
  "technical_subscription",
  "kids_subscription",
  "family_grant",
  "manual_subscription",
  "complimentary",
  "invitation",
  "lifetime",
  "topup",
  "temporary_grant",
  "free_window",
] as const;
export const subscriptionSourceSchema = z
  .object({
    sourceKey: z.string().regex(/^[a-f0-9]{32}$/),
    kind: z.enum(sourceKinds),
    area: z.enum(["ai", "academic", "technical", "kids", "multiple"]),
    product: z.string().min(1).max(100),
    targets: z.array(z.string().min(1).max(200)).max(10000),
    beneficiary: z.string().max(100).nullable(),
    sourceStatus: z.string().min(1).max(100),
    startsAt: date.nullable(),
    accessUntil: date.nullable(),
    isLifetime: z.boolean(),
    paid: z.boolean(),
    eligible: z.boolean(),
    cancelAtPeriodEnd: z.boolean().nullable(),
    paymentMethod: z.string().max(50).nullable(),
    paymentEnvironment: z.enum(["live", "test"]).nullable(),
    portalScope: z.enum(["core", "kids"]).nullable(),
    termsUntil: date.nullable(),
  })
  .strict();
export const accountSubscriptionSchema = z
  .object({
    actorUserId: z.string().uuid(),
    serverTime: date,
    sources: z.array(subscriptionSourceSchema),
  })
  .strict();
const count = z.number().int().nonnegative().safe();
export const subscriptionSummarySchema = z
  .object({
    activePaidAccounts: count,
    activePaidSources: count,
    activeInvitationSources: count,
    activeGrantSources: count,
    activeLifetimeSources: count,
    // SQL aggregates include only present categories; an empty result is {}.
    byArea: z.partialRecord(
      z.enum(["ai", "academic", "technical", "kids", "multiple"]),
      z.object({ accounts: count, sources: count }).strict(),
    ),
    byKind: z.partialRecord(z.enum(sourceKinds), count),
  })
  .strict();
export const adminSubscriptionSchema = z
  .object({
    actorUserId: z.string().uuid(),
    serverTime: date,
    summary: subscriptionSummarySchema,
  })
  .strict();
export type SubscriptionSource = z.infer<typeof subscriptionSourceSchema>;
export type AccountSubscriptions = z.infer<typeof accountSubscriptionSchema>;
export type SubscriptionSummary = z.infer<typeof subscriptionSummarySchema>;
export type AdminSubscriptionSnapshot = z.infer<typeof adminSubscriptionSchema>;
export type DisplayLocale = "ar-EG" | "ar-MSA" | "ar-Gulf" | "en";

/** A stale/error response must never show the previous account's purchases. */
export function currentSubscriptionData<T extends { actorUserId: string; serverTime: string }>(
  data: T | undefined,
  accountId: string | null,
  error: boolean,
  now = Date.now(),
): T | undefined {
  if (!accountId || error || data?.actorUserId !== accountId) return undefined;
  const age = now - Date.parse(data.serverTime);
  return Number.isFinite(age) && age >= -30_000 && age < 90_000 ? data : undefined;
}

export function subscriptionRefreshInterval(
  data: AccountSubscriptions | undefined,
  now = Date.now(),
): number {
  const boundaries = (data?.sources ?? [])
    .flatMap((s) => [s.startsAt, s.accessUntil, s.termsUntil])
    .filter((s): s is string => s !== null)
    .map(Date.parse)
    .filter((t) => t > now);
  return Math.max(250, Math.min(30_000, ...boundaries.map((t) => t - now + 10)));
}

export function sourceState(source: SubscriptionSource, now = Date.now()) {
  if (source.sourceStatus === "revoked" || source.sourceStatus === "refunded")
    return "revoked" as const;
  if (source.sourceStatus === "held") return "held" as const;
  if (source.sourceStatus === "pending_acceptance" || source.sourceStatus === "pending")
    return "pending" as const;
  if (source.accessUntil && Date.parse(source.accessUntil) <= now) return "ended" as const;
  if (source.startsAt && Date.parse(source.startsAt) > now) return "scheduled" as const;
  if (!source.eligible) return "inactive" as const;
  return source.cancelAtPeriodEnd ? ("ending" as const) : ("active" as const);
}

export function allowedPortalScope(source: SubscriptionSource): "core" | "kids" | null {
  if (source.paymentEnvironment !== "live") return null;
  if (
    source.kind === "core_subscription" &&
    source.portalScope === "core" &&
    ["stripe_us", "stripe_us_live", "stripe"].includes(source.paymentMethod ?? "")
  )
    return "core";
  if (
    source.kind === "kids_subscription" &&
    source.portalScope === "kids" &&
    source.paymentMethod === "stripe"
  )
    return "kids";
  return null;
}

const en = {
  title: "Subscriptions and access",
  loading: "Loading subscriptions…",
  unavailable: "Subscriptions could not be loaded. Please retry.",
  empty: "No subscriptions or purchases are recorded for this account.",
  retry: "Retry",
  browse: "View plans",
  starts: "Starts",
  ends: "Current access ends",
  lifetime: "Lifetime curriculum access",
  unlimited: "No end date",
  renewalUnknown: "Automatic renewal is not confirmed",
  noRenewal: "No automatic renewal",
  unknown: "Unavailable",
  method: "Payment method",
  beneficiary: "Child",
  scope: "Scope",
  all: "All published curricula",
  terms: "Current terms apply until",
  note: "Curriculum availability and access checks still apply. This list does not change your permissions.",
  lifetimeQuestions:
    "The included 100 questions last for the first month only; curriculum access continues.",
  topup: "Question credit purchase; does not grant curriculum access",
  paidAccounts: "Accounts with active paid access",
  paidSources: "Active paid access sources",
  invitations: "Active invitations",
  grants: "Active grants",
  lifetimeCount: "Lifetime curriculum purchases",
  countsNote: "Accounts are counted once. Sources and areas may overlap.",
  active: "Current source",
  inactive: "Not currently effective",
  pending: "Pending",
  scheduled: "Scheduled",
  ended: "Ended",
  revoked: "Revoked or refunded",
  held: "On hold",
  ending: "Available until period end; renewal cancelled",
  ai: "AI",
  academic: "Academic",
  technical: "Technical",
  kids: "Children",
  multiple: "Selected curricula",
  core_subscription: "AI subscription",
  academic_subscription: "Academic subscription",
  technical_subscription: "Technical subscription",
  kids_subscription: "Family subscription",
  family_grant: "Family access grant",
  manual_subscription: "Fixed-term access",
  complimentary: "Complimentary access",
  invitation: "Invitation",
  temporary_grant: "Temporary access grant",
  free_window: "Free access period",
  pro: "AI Pro",
  pro_plus: "AI Pro Plus",
  comprehensive: "Comprehensive invitation",
  single_curriculum: "Single-curriculum invitation",
  stripe: "Stripe",
  instapay: "InstaPay",
  wallet: "Wallet",
  bank: "Bank transfer",
  admin: "Administrative grant",
  paymob_eg: "Paymob",
};
type Copy = { [K in keyof typeof en]: string };
const msa: Copy = {
  title: "الاشتراكات وصلاحيات الوصول",
  loading: "جارٍ تحميل الاشتراكات…",
  unavailable: "تعذّر تحميل الاشتراكات. حاول مجددًا.",
  empty: "لا توجد اشتراكات أو مشتريات مسجلة لهذا الحساب.",
  retry: "إعادة المحاولة",
  browse: "عرض الباقات",
  starts: "تبدأ في",
  ends: "ينتهي الوصول الحالي في",
  lifetime: "الوصول إلى المنهج مدى الحياة",
  unlimited: "بلا تاريخ انتهاء",
  renewalUnknown: "التجديد التلقائي غير مؤكد",
  noRenewal: "لا يوجد تجديد تلقائي",
  unknown: "غير متاح",
  method: "وسيلة الدفع",
  beneficiary: "الطفل",
  scope: "النطاق",
  all: "جميع المناهج المنشورة",
  terms: "تسري الشروط الحالية حتى",
  note: "يظل توفر المنهج وفحص صلاحية الدخول مطبّقين. هذه القائمة لا تغيّر صلاحياتك.",
  lifetimeQuestions: "الأسئلة المائة المرفقة متاحة للشهر الأول فقط؛ ويستمر الوصول إلى المنهج.",
  topup: "شراء رصيد أسئلة؛ لا يمنح الوصول إلى المناهج",
  paidAccounts: "حسابات لديها وصول مدفوع سارٍ",
  paidSources: "مصادر الوصول المدفوع السارية",
  invitations: "الدعوات السارية",
  grants: "المنح السارية",
  lifetimeCount: "مشتريات المناهج مدى الحياة",
  countsNote: "يُحسب كل حساب مرة واحدة. قد تتداخل المصادر والمسارات.",
  active: "مصدر سارٍ",
  inactive: "غير سارٍ حاليًا",
  pending: "قيد الانتظار",
  scheduled: "مجدول",
  ended: "منتهٍ",
  revoked: "ملغى أو مسترد",
  held: "معلّق",
  ending: "متاح حتى نهاية الفترة؛ أُلغي التجديد",
  ai: "الذكاء الاصطناعي",
  academic: "الأكاديمي",
  technical: "الفني",
  kids: "الأطفال",
  multiple: "مناهج محددة",
  core_subscription: "اشتراك الذكاء الاصطناعي",
  academic_subscription: "اشتراك أكاديمي",
  technical_subscription: "اشتراك فني",
  kids_subscription: "اشتراك الأسرة",
  family_grant: "منحة وصول للأسرة",
  manual_subscription: "وصول لمدة محددة",
  complimentary: "وصول ممنوح",
  invitation: "دعوة",
  temporary_grant: "منحة وصول مؤقتة",
  free_window: "فترة وصول مجاني",
  pro: "AI Pro",
  pro_plus: "AI Pro Plus",
  comprehensive: "دعوة شاملة",
  single_curriculum: "دعوة لمنهج واحد",
  stripe: "Stripe",
  instapay: "إنستاباي",
  wallet: "محفظة إلكترونية",
  bank: "تحويل بنكي",
  admin: "منحة إدارية",
  paymob_eg: "Paymob",
};
export const subscriptionCopy: Record<DisplayLocale, Copy> = {
  en,
  "ar-MSA": msa,
  "ar-EG": {
    ...msa,
    loading: "بنحمّل الاشتراكات…",
    unavailable: "مش قادرين نحمّل الاشتراكات. جرّب تاني.",
    retry: "جرّب تاني",
    empty: "مفيش اشتراكات أو مشتريات مسجلة للحساب ده.",
    note: "إتاحة المنهج وصلاحية الدخول ليه بتتراجع كالمعتاد. القائمة دي مش بتغيّر صلاحياتك.",
    lifetimeQuestions: "الـ١٠٠ سؤال مع الشراء للشهر الأول بس، والوصول للمنهج بيكمل مدى الحياة.",
  },
  "ar-Gulf": {
    ...msa,
    loading: "جاري تحميل اشتراكاتك…",
    unavailable: "ما قدرنا نحمّل الاشتراكات. جرّب مرة ثانية.",
    retry: "جرّب مرة ثانية",
    empty: "ما فيه اشتراكات أو مشتريات مسجلة لهذا الحساب.",
    note: "إتاحة المنهج وصلاحية الدخول تستمر حسب شروطها. هالقائمة ما تغيّر صلاحياتك.",
    lifetimeQuestions: "الـ١٠٠ سؤال مع الشراء للشهر الأول فقط، والوصول للمنهج يستمر مدى الحياة.",
  },
};

export function sourceTitle(s: SubscriptionSource, locale: DisplayLocale) {
  const c = subscriptionCopy[locale];
  if (
    s.product === "pro" ||
    s.product === "pro_plus" ||
    s.product === "comprehensive" ||
    s.product === "single_curriculum"
  )
    return c[s.product];
  if (s.kind === "lifetime") return c.lifetime;
  if (s.kind === "topup") return c.topup;
  return c[s.kind];
}
export function paymentLabel(s: SubscriptionSource, locale: DisplayLocale) {
  const key = s.paymentMethod?.startsWith("stripe") ? "stripe" : s.paymentMethod;
  return key && ["stripe", "instapay", "wallet", "bank", "admin", "paymob_eg"].includes(key)
    ? subscriptionCopy[locale][key as "stripe"]
    : subscriptionCopy[locale].unknown;
}
