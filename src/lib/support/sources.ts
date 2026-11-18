// Public sources behind Masaarat's pricing surfaces and published curricula. Every fact the
// support assistant may state is derived here from the same modules/RPCs the public pages
// render; nothing is typed in by hand. Lesson bodies, admin catalogues and private intake
// packages are never read.
import { APPROVED_PRICES_MINOR } from "@/lib/billing/catalogue/prices";
import { KIDS_LEVELS } from "@/lib/kids/catalogue";
import { KIDS_FAMILY_POLICY, quoteKidsFamily } from "@/lib/kids/family-policy";
import { getUiString } from "@/lib/locale/ui-strings";
import { getPathDefinition } from "@/lib/path-story";
import { getTechnicalCurriculumPreview } from "@/lib/technical-track-preview";
import { PATHS } from "@/lib/curriculum-data";
import {
  getCurriculumLessonLabel,
  getCurriculumModuleLabel,
  getCurriculumPathLabel,
} from "@/lib/locale-curriculum/resolve-curriculum-label";
import { isLessonIncludedInTier } from "@/lib/plan-entitlements";
import { OFFICIAL_ORIGIN } from "./config";
import type { SupportArea, SupportMarket, SupportTerm } from "./context";

export type SupportLang = "ar" | "en";
const LOCALE = { ar: "ar-EG", en: "en" } as const;

/** Where each fact comes from (reported to the owner; not shown to customers). */
export const PUBLIC_SOURCE_REFS = {
  adultPrices: "src/lib/billing/catalogue/prices.ts APPROVED_PRICES_MINOR (rendered by PlanPrices on /pricing, /academic/pricing, /technical/pricing)",
  kidsPrices: "src/lib/kids/family-policy.ts KIDS_PRICES_MINOR + quoteKidsFamily (rendered by KidsFamilyPricing on /kids/pricing)",
  oneOffCopy: "src/lib/billing/commercial-copy.ts via ui strings pricing.* (CommercialPurchases on every pricing page)",
  tax: "ui string pricing.price.taxExclusive",
  aiCatalogue: "src/lib/curriculum-data.ts PATHS (available lessons) + locale-curriculum labels",
  technicalCatalogue: "src/lib/technical-track-preview.ts getTechnicalCurriculumPreview",
  academicCatalogue: "anon RPC public.academic_catalogue(p_locale) — enabled courses, approved lessons",
  intakeCatalogue: "anon RPC public.curriculum_catalogue(p_area, p_locale) — active versions only",
  kidsCatalogue: "public Edge function kids-catalogue — approved titles only",
  programCopy: "src/lib/path-story.ts getPathDefinition",
  offer: "anon RPC public.get_free_access_announcement()",
} as const;

export const url = (path = "") => `${OFFICIAL_ORIGIN}${path}`;

export const AREA_LINKS: Record<SupportArea, { program: string; pricing: string }> = {
  ai: { program: url("/curriculum"), pricing: url("/pricing") },
  academic: { program: url("/academic"), pricing: url("/academic/pricing") },
  technical: { program: url("/technical/courses/furniture"), pricing: url("/technical/pricing") },
  kids: { program: url("/kids"), pricing: url("/kids/pricing") },
};

/* ----------------------------- pricing ----------------------------- */

function major(minor: number): string {
  const v = minor / 100;
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}
function money(minor: number, currency: "EGP" | "USD", lang: SupportLang): string {
  const n = major(minor);
  if (currency === "USD") return lang === "ar" ? `${n} دولار` : `$${n}`;
  return lang === "ar" ? `${n} جنيه` : `${n} EGP`;
}
const marketKey = (m: SupportMarket) => (m === "domestic" ? "EG" : "INTL");

export type PricingFacts = { lines: string[]; link: string };

function termLine(
  label: string,
  prices: { month: number; year: number },
  currency: "EGP" | "USD",
  lang: SupportLang,
  term?: SupportTerm,
): string {
  const m = money(prices.month, currency, lang);
  const y = money(prices.year, currency, lang);
  if (lang === "ar") {
    if (term === "monthly") return `${label}: ${m} في الشهر.`;
    if (term === "yearly") return `${label}: ${y} في السنة.`;
    return `${label}: ${m} في الشهر أو ${y} في السنة.`;
  }
  if (term === "monthly") return `${label}: ${m} per month.`;
  if (term === "yearly") return `${label}: ${y} per year.`;
  return `${label}: ${m} per month or ${y} per year.`;
}

/** Exactly what the pricing surfaces display for one program + market. */
export function pricingFacts(
  area: SupportArea,
  market: SupportMarket,
  lang: SupportLang,
  opts: { term?: SupportTerm; plan?: string } = {},
): PricingFacts {
  const loc = LOCALE[lang];
  const t = (k: Parameters<typeof getUiString>[1]) => getUiString(loc, k);
  const sep = lang === "ar" ? "، " : "; ";
  const lines: string[] = [];
  const term = opts.term === "monthly" || opts.term === "yearly" ? opts.term : undefined;
  if (opts.term && !term)
    lines.push(
      lang === "ar"
        ? "الاشتراكات المعروضة شهرية أو سنوية بس."
        : "Displayed subscriptions are monthly or yearly only.",
    );
  const where =
    market === "domestic"
      ? lang === "ar" ? "داخل مصر (بالجنيه)" : "in Egypt (EGP)"
      : lang === "ar" ? "خارج مصر (السعر الدولي بالدولار)" : "outside Egypt (international price, USD)";
  lines.push(lang === "ar" ? `الأسعار ${where}:` : `Prices ${where}:`);
  if (area === "kids") {
    const mk = marketKey(market);
    const base = quoteKidsFamily(mk, "month");
    const baseY = quoteKidsFamily(mk, "year");
    const disc = quoteKidsFamily(mk, "month", "pro");
    const discY = quoteKidsFamily(mk, "year", "pro");
    const cur = base.currency as "EGP" | "USD";
    lines.push(
      termLine(lang === "ar" ? "اشتراك كيدز للعيلة" : "Kids family plan", { month: base.totalMinor, year: baseY.totalMinor }, cur, lang, term),
      termLine(
        lang === "ar"
          ? `مع اشتراك Pro أو Pro Plus ساري (خصم ${KIDS_FAMILY_POLICY.bundleDiscountPercent}%)`
          : `With an active Pro or Pro Plus plan (${KIDS_FAMILY_POLICY.bundleDiscountPercent}% off)`,
        { month: disc.totalMinor, year: discY.totalMinor },
        cur,
        lang,
        term,
      ),
      lang === "ar"
        ? `لحد ${KIDS_FAMILY_POLICY.maxProfiles} أطفال، ولكل طفل 100 سؤال للمساعد كل شهر.`
        : `Up to ${KIDS_FAMILY_POLICY.maxProfiles} children; each child has 100 assistant questions a month.`,
    );
  } else {
    const p = APPROVED_PRICES_MINOR[marketKey(market)];
    const cur = p.currencyCode as "EGP" | "USD";
    if (area === "ai") {
      const wantPro = !opts.plan || opts.plan === "pro";
      const wantPlus = !opts.plan || opts.plan === "pro_plus";
      if (opts.plan === "free" || !opts.plan)
        lines.push(
          lang === "ar"
            ? `الباقة المجانية: ${t("pricing.price.free")} — ${t("pricing.free.feature.1")}، ${t("pricing.free.feature.5")}.`
            : `Free plan: ${t("pricing.price.free")} — ${t("pricing.free.feature.1")}; ${t("pricing.free.feature.5")}.`,
        );
      if (wantPro)
        lines.push(
          termLine("Pro", p.pro, cur, lang, term),
          `(${t("pricing.pro.feature.1")}${sep}${t("pricing.pro.feature.4")})`,
        );
      if (wantPlus)
        lines.push(
          termLine("Pro Plus", p.pro_plus, cur, lang, term),
          `(${t("pricing.proPlus.feature.1")}${sep}${t("pricing.proPlus.feature.4")})`,
        );
    } else {
      // /academic/pricing and /technical/pricing render <PlanPrices plan="pro_plus" />.
      const label =
        area === "academic"
          ? lang === "ar" ? "اشتراك أكاديمي" : "Academic subscription"
          : lang === "ar" ? "اشتراك تقني" : "Technical subscription";
      lines.push(termLine(label, p.pro_plus, cur, lang, term));
    }
  }
  if (opts.plan === "lifetime")
    lines.push(
      lang === "ar"
        ? "منهج واحد مدى الحياة: 75 جنيه دفعة واحدة (السعر المعروض بالجنيه)."
        : "One curriculum for life: 75 EGP, one payment (shown in EGP).",
    );
  if (opts.plan === "topup")
    lines.push(
      lang === "ar"
        ? "أسئلة زيادة: 50 جنيه لكل 100 سؤال، بتتجمع ومش بتنتهي (السعر المعروض بالجنيه)."
        : "Extra questions: 50 EGP per 100 questions; they accumulate and never expire (shown in EGP).",
    );
  lines.push(t("pricing.price.taxExclusive"));
  return { lines, link: AREA_LINKS[area].pricing };
}

/* ----------------------------- programs ----------------------------- */

export function programFacts(area: SupportArea, lang: SupportLang): string[] {
  const loc = LOCALE[lang];
  if (area === "kids") {
    const ages = KIDS_LEVELS.map((l) => l.ages).join(lang === "ar" ? "، " : ", ");
    const d = getPathDefinition("kids", loc, ages);
    return [d.title, d.intro, d.goals, d.audience, d.requirements];
  }
  const d = getPathDefinition(area, loc);
  const out = [d.title, d.intro, d.goals, d.audience, d.requirements];
  if (area === "ai")
    out.push(
      PATHS.map((p) => getCurriculumPathLabel(loc, p.id, "title")).join(lang === "ar" ? "، " : ", "),
    );
  return out;
}

/* ----------------------------- catalogue ----------------------------- */

export type CatalogueLesson = {
  id: string;
  area: SupportArea;
  program: string;
  titles: Partial<Record<SupportLang, string>>;
  /** Public descriptive text only: titles of the lesson's module/program and their public subtitles. */
  excerpt: Partial<Record<SupportLang, string>>;
  access: "free" | "plan" | "unknown";
  url: string;
};

export type LiveCatalogue = {
  academic?: { id: string; title: string; released?: boolean; reviewOnly?: boolean; lessons: { id: string; title: string; moduleId: string; position: number; introductory: boolean }[] }[];
  intake?: { area: SupportArea; id: string; title: string; stations: { id: string; title: string; steps: { id: string; title: string }[] }[] }[];
  kids?: { levelId: string; lessonNumber: number; title: string }[];
};
export type LiveCatalogueByLang = Partial<Record<SupportLang, LiveCatalogue>>;

function staticLessons(): CatalogueLesson[] {
  const out: CatalogueLesson[] = [];
  for (const path of PATHS) {
    for (const mod of path.modules) {
      for (const lesson of mod.lessons) {
        if (lesson.state !== "available" || !lesson.route) continue;
        const titles: CatalogueLesson["titles"] = {};
        const excerpt: CatalogueLesson["excerpt"] = {};
        for (const lang of ["ar", "en"] as const) {
          const loc = LOCALE[lang];
          titles[lang] = getCurriculumLessonLabel(loc, lesson.id);
          const sub = getCurriculumModuleLabel(loc, mod.id, "subtitle");
          excerpt[lang] = [
            `${getCurriculumPathLabel(loc, path.id, "title")} › ${getCurriculumModuleLabel(loc, mod.id, "title")}`,
            sub,
          ]
            .filter(Boolean)
            .join(" — ");
        }
        out.push({
          id: lesson.id,
          area: "ai",
          program: path.id,
          titles,
          excerpt,
          access: isLessonIncludedInTier(lesson.id, "free") ? "free" : "plan",
          url: url(lesson.route),
        });
      }
    }
  }
  const tech = { ar: getTechnicalCurriculumPreview("ar-EG"), en: getTechnicalCurriculumPreview("en") };
  tech.ar.forEach((section, si) =>
    section.modules.forEach((mod, mi) =>
      mod.lessons.forEach((lesson, li) => {
        const enSection = tech.en[si];
        const enMod = enSection?.modules[mi];
        const enLesson = enMod?.lessons[li];
        out.push({
          id: lesson.id,
          area: "technical",
          program: "furniture",
          titles: { ar: lesson.title, en: enLesson?.title },
          excerpt: { ar: `${section.title} › ${mod.title}`, en: enSection && enMod ? `${enSection.title} › ${enMod.title}` : undefined },
          access: "unknown",
          url: url("/technical/courses/furniture/contents"),
        });
      }),
    ),
  );
  return out;
}
let STATIC: CatalogueLesson[] | null = null;
export function staticCatalogue(): CatalogueLesson[] {
  return (STATIC ??= staticLessons());
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;
/** Adds only publicly released rows from the anonymous catalogue responses. */
export function liveLessons(live: LiveCatalogueByLang): CatalogueLesson[] {
  const byId = new Map<string, CatalogueLesson>();
  const put = (lang: SupportLang, l: Omit<CatalogueLesson, "titles" | "excerpt">, title: string, excerpt: string) => {
    if (!SAFE_ID.test(l.id) || !title.trim()) return;
    const key = `${l.area}:${l.program}:${l.id}`;
    const cur = byId.get(key) ?? { ...l, titles: {}, excerpt: {} };
    cur.titles[lang] = title.trim().slice(0, 160);
    cur.excerpt[lang] = excerpt.slice(0, 240);
    byId.set(key, cur);
  };
  for (const lang of ["ar", "en"] as const) {
    const c = live[lang];
    if (!c) continue;
    for (const course of c.academic ?? []) {
      if (course.released === false || course.reviewOnly === true || !SAFE_ID.test(course.id)) continue;
      for (const lesson of course.lessons ?? [])
        put(lang, { id: lesson.id, area: "academic", program: course.id, access: lesson.introductory ? "free" : "plan", url: url(`/academic/courses/${course.id}/contents`) }, lesson.title, course.title);
    }
    for (const course of c.intake ?? []) {
      if (!SAFE_ID.test(course.id)) continue;
      for (const station of course.stations ?? [])
        for (const step of station.steps ?? [])
          put(lang, { id: step.id, area: course.area, program: course.id, access: "unknown", url: url(`/courses/${course.area}/${course.id}?view=contents`) }, step.title, `${course.title} › ${station.title}`);
    }
    for (const k of c.kids ?? []) {
      const level = KIDS_LEVELS.find((l) => l.id === k.levelId);
      if (!level || !Number.isInteger(k.lessonNumber) || k.lessonNumber < 1 || k.lessonNumber > level.lessonCount) continue;
      put(
        lang,
        { id: `${k.levelId}-${k.lessonNumber}`, area: "kids", program: k.levelId, access: k.lessonNumber <= 2 ? "free" : "plan", url: url(`/kids/${k.levelId}/${k.lessonNumber}`) },
        k.title,
        lang === "ar" ? `كيدز — ${level.ages} سنة` : `Kids — ages ${level.ages}`,
      );
    }
  }
  return [...byId.values()];
}
