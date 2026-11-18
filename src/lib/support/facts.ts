// General, non-price platform facts, built from the same public copy the site renders.
// Prices, curricula and lessons come from ./sources (never typed here).
import { getUiString } from "@/lib/locale/ui-strings";
import { getPathStoryCopy } from "@/lib/path-story";

function general(locale: "ar-EG" | "en"): string[] {
  const t = (k: Parameters<typeof getUiString>[1]) => getUiString(locale, k);
  const story = getPathStoryCopy(locale) as { body?: string };
  return [
    locale === "en"
      ? "Masaarat (مسارات) is an Arabic-first online learning platform at masaarat.ai with AI paths, Academic, Technical and Kids programs."
      : "مسارات منصة تعلّم أونلاين عربية على masaarat.ai فيها مسارات الذكاء الاصطناعي والأكاديمي والتقني وكيدز.",
    ...(story.body ? [story.body] : []),
    `${t("pricing.faq.1.q")} ${t("pricing.faq.1.a")}`,
    `${t("pricing.faq.4.q")} ${t("pricing.faq.4.a")}`,
    locale === "en"
      ? "Billing, refunds, invoices and account access for a specific person are handled through the contact page."
      : "الفواتير والاسترداد ومشاكل الحساب الشخصية بتتعمل من صفحة التواصل.",
  ];
}

export const GENERAL_FACTS = { ar: general("ar-EG"), en: general("en") } as const;
