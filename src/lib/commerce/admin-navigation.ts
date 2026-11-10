import type { SupportedLocale } from "@/lib/locale/types";

export type CommerceAdminView =
  | "payments"
  | "offers"
  | "card-offers"
  | "groups"
  | "email-access"
  | "free-access"
  | "settings"
  | "audit";
export type CommerceAdminArea = "payments" | "access" | "offers" | "administration";

export function commerceAdminNavigation(locale: SupportedLocale) {
  const en = locale === "en";
  const views: Record<
    CommerceAdminView,
    { area: CommerceAdminArea; title: string; description: string }
  > = {
    payments: {
      area: "payments",
      title: en ? "Payments and access" : "المدفوعات وحقوق الوصول",
      description: en
        ? "Review orders and receipts, record received payments, and inspect their access rights."
        : "راجع الطلبات والإيصالات، وسجّل المبالغ المستلمة، وتابع حقوق الوصول المرتبطة بها.",
    },
    offers: {
      area: "offers",
      title: en ? "Coupons and offer invitations" : "الكوبونات ودعوات العروض",
      description: en
        ? "Prepare a coupon or an offer invitation for its intended recipients."
        : "جهّز كوبونًا أو دعوة عرض للمستفيدين المحددين.",
    },
    "card-offers": {
      area: "offers",
      title: en ? "Card-payment discounts" : "خصومات الدفع بالبطاقة",
      description: en
        ? "Manage the available card-payment offers and their eligibility rules."
        : "تابع عروض الدفع بالبطاقة المتاحة وشروط الاستفادة منها.",
    },
    groups: {
      area: "offers",
      title: en ? "Groups and recipient imports" : "المجموعات واستيراد المستفيدين",
      description: en
        ? "Prepare a recipient group, review its import, and manage its invitations."
        : "جهّز مجموعة مستفيدين، وراجع بيانات الاستيراد، وتابع دعواتها.",
    },
    "email-access": {
      area: "access",
      title: en ? "Email access invitations" : "دعوات الوصول بالبريد",
      description: en
        ? "Manage invitations and their acceptance separately from payment receipts."
        : "أدر دعوات إتاحة المناهج وقبولها بصورة منفصلة عن إيصالات الدفع.",
    },
    "free-access": {
      area: "access",
      title: en ? "Access grants" : "منح الوصول",
      description: en
        ? "Inspect and manage the access grants supported by this section."
        : "راجع منح الوصول التي يدعمها هذا القسم وأدرها.",
    },
    settings: {
      area: "administration",
      title: en ? "Payment instructions" : "تعليمات التحويل",
      description: en
        ? "Manage the payment instructions displayed to customers."
        : "أدر تعليمات التحويل التي تظهر للمستخدم عند إتمام الدفع.",
    },
    audit: {
      area: "administration",
      title: en ? "Administrator action history" : "سجل إجراءات المسؤولين",
      description: en
        ? "Review the available action history. This view does not change a payment or grant."
        : "راجع سجل الإجراءات المتاح؛ عرض السجل لا يغيّر دفعة أو منحة وصول.",
    },
  };
  const areas: { id: CommerceAdminArea; title: string; defaultView: CommerceAdminView }[] = [
    { id: "payments", title: en ? "Payments" : "المدفوعات", defaultView: "payments" },
    { id: "access", title: en ? "Access" : "إتاحة المناهج", defaultView: "email-access" },
    { id: "offers", title: en ? "Offers and groups" : "العروض والمجموعات", defaultView: "offers" },
    {
      id: "administration",
      title: en ? "Settings and history" : "الإعدادات والسجل",
      defaultView: "settings",
    },
  ];
  return {
    views,
    areas,
    title: en ? "Payments, access and offers" : "إدارة المدفوعات والإتاحة والعروض",
    areaLabel: en ? "Administration areas" : "أقسام الإدارة",
    viewLabel: en ? "Section functions" : "وظائف القسم",
    loading: en ? "Loading the administration records…" : "جارٍ تحميل سجلات الإدارة…",
    loadFailed: en
      ? "Could not load these records. Retry before taking an action."
      : "تعذر تحميل سجلات هذا القسم. أعد المحاولة قبل اتخاذ إجراء.",
    exportAvailable: en ? "Export available records" : "تصدير السجلات المتاحة",
  };
}

// Payment and entitlement states both belong to this combined existing view.
// Invitation states and settings/history filters do not.
export const COMMERCE_PAYMENT_FILTERS = [
  "pending",
  "awaiting_receipt",
  "confirmed",
  "rejected",
  "more_info",
  "cancelled",
  "active",
  "scheduled",
  "expired",
  "revoked",
] as const;
