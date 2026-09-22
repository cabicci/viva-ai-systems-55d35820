import type { SupportedLocale } from "@/lib/locale/types";

type AnalyticsConsentCopy = {
  ariaLabel: string;
  title: string;
  description: string;
  privacyPolicy: string;
  deny: string;
  accept: string;
  settings: string;
  settingsAria: string;
  category: string;
  statusLabel: string;
  allowed: string;
  denied: string;
  withdraw: string;
  allow: string;
};

export const ANALYTICS_CONSENT_COPY: Record<SupportedLocale, AnalyticsConsentCopy> = {
  "ar-EG": {
    ariaLabel: "إعدادات الكوكيز والتحليلات",
    title: "خصوصيتك أولًا",
    description:
      "مش هنشغّل أدوات التحليل أو Meta Pixel قبل موافقتك. تقدر ترفض دلوقتي أو تسحب موافقتك بعدين من إعدادات الخصوصية.",
    privacyPolicy: "سياسة الخصوصية",
    deny: "رفض",
    accept: "موافقة",
    settings: "إعدادات الخصوصية",
    settingsAria: "إعدادات الخصوصية",
    category: "التحليلات والتسويق",
    statusLabel: "الحالة الحالية",
    allowed: "مسموح",
    denied: "مرفوض",
    withdraw: "سحب الموافقة",
    allow: "السماح بالتحليلات",
  },
  "ar-MSA": {
    ariaLabel: "إعدادات ملفات الارتباط والتحليلات",
    title: "خصوصيتك أولًا",
    description:
      "لن نشغّل أدوات التحليل أو Meta Pixel قبل موافقتك. يمكنك الرفض الآن أو سحب موافقتك لاحقًا من إعدادات الخصوصية.",
    privacyPolicy: "سياسة الخصوصية",
    deny: "رفض",
    accept: "موافقة",
    settings: "إعدادات الخصوصية",
    settingsAria: "إعدادات الخصوصية",
    category: "التحليلات والتسويق",
    statusLabel: "الحالة الحالية",
    allowed: "مسموح",
    denied: "مرفوض",
    withdraw: "سحب الموافقة",
    allow: "السماح بالتحليلات",
  },
  "ar-Gulf": {
    ariaLabel: "إعدادات ملفات الارتباط والتحليلات",
    title: "خصوصيتك أولًا",
    description:
      "ما راح نشغّل أدوات التحليل أو Meta Pixel قبل موافقتك. تقدر ترفض الحين أو تسحب موافقتك بعدين من إعدادات الخصوصية.",
    privacyPolicy: "سياسة الخصوصية",
    deny: "رفض",
    accept: "موافقة",
    settings: "إعدادات الخصوصية",
    settingsAria: "إعدادات الخصوصية",
    category: "التحليلات والتسويق",
    statusLabel: "الحالة الحالية",
    allowed: "مسموح",
    denied: "مرفوض",
    withdraw: "سحب الموافقة",
    allow: "السماح بالتحليلات",
  },
  en: {
    ariaLabel: "Cookie and analytics settings",
    title: "Your privacy comes first",
    description:
      "We won't load analytics tools or Meta Pixel until you consent. You can decline now or withdraw your consent later from Privacy settings.",
    privacyPolicy: "Privacy Policy",
    deny: "Decline",
    accept: "Accept",
    settings: "Privacy settings",
    settingsAria: "Privacy settings",
    category: "Analytics and marketing",
    statusLabel: "Current status",
    allowed: "Allowed",
    denied: "Declined",
    withdraw: "Withdraw consent",
    allow: "Allow analytics",
  },
};
