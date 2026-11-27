import type { CurriculumSummary } from "@/lib/course-system/intake/client";
import type { SupportedLocale } from "@/lib/locale/types";

import { parseLocaleSearchParam } from "@/lib/locale/locale-search";

export function programSearch(raw: Record<string, unknown>) {
  const campaign: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const value = raw[key];
    if (typeof value === "string" && /^[\p{L}\p{N}_. -]{1,100}$/u.test(value))
      campaign[key] = value;
  }
  return { ...parseLocaleSearchParam(raw), ...campaign };
}

const storeDescription: Record<SupportedLocale, string> = {
  "ar-EG":
    "ابنِ متجر دَوِّنها من الصفر بأدوات الذكاء الاصطناعي. اتعلّم Shopify وWooCommerce، واضبط المنتجات والشحن والدفع، واختبر أول طلب بنفسك في ٣٠ درس عملي.",
  "ar-MSA":
    "ابنِ متجراً إلكترونياً بأدوات الذكاء الاصطناعي. طبّق على Shopify وWooCommerce، وأعدّ المنتجات والشحن والدفع واختبر طلباً كاملاً في ٣٠ درساً عملياً.",
  "ar-Gulf":
    "ابنِ متجرك بأدوات الذكاء الاصطناعي مع دَوِّنها. تعلّم Shopify وWooCommerce، واضبط المنتجات والشحن والدفع وجرّب أول طلب بنفسك عبر ٣٠ درس عملي.",
  en: "Build the Dawwenha store with AI in 30 practical lessons. Set up Shopify and WooCommerce products, shipping and checkout, then test an order from cart to dashboard.",
};

const origin = "https://masaarat.ai";
const slugPattern = /^[A-Za-z0-9][A-Za-z0-9-]{0,79}$/;
export const isProgramId = (id: string) => slugPattern.test(id);
export const aiProgramPath = (id: string) => `/programs/ai/${encodeURIComponent(id)}`;

export function aiProgramSeo(course: CurriculumSummary, locale: SupportedLocale) {
  const en = locale === "en";
  const total = course.stations.reduce((sum, s) => sum + s.steps.length, 0);
  const subjects = course.stations
    .slice(0, 3)
    .map((s) => s.title)
    .join(en ? ", " : "، ");
  const description =
    course.id === "ai-store-studio"
      ? storeDescription[locale]
      : en
        ? `${course.title} on Masaarat. Explore ${total} lessons covering ${subjects}.`
        : `${course.title} على مسارات. اكتشف ${new Intl.NumberFormat("ar-EG").format(total)} درسًا تشمل ${subjects}.`;
  const url = origin + aiProgramPath(course.id);
  const title = course.title + (en ? " | Masaarat" : " | مسارات");
  const image =
    origin +
    (course.id === "ai-store-studio"
      ? "/brand/dawwenha-course-og.jpg"
      : "/brand/masaarat-og-all-domains-20261007.png");
  return { description, url, title, image, total };
}

// URLs contain only validated public IDs, never UTM, locale or private lesson parameters.
export function aiProgramSitemap(courses: CurriculumSummary[]) {
  const ids = [
    ...new Set(courses.filter((c) => c.area === "ai" && isProgramId(c.id)).map((c) => c.id)),
  ].sort();
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    ids.map((id) => "  <url><loc>" + origin + aiProgramPath(id) + "</loc></url>").join("\n") +
    "\n</urlset>\n"
  );
}
