import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { StripeCheckoutButtons } from "@/components/billing/StripeCheckoutButtons";
import { Badge } from "@/components/ui/badge";
import { buildLocalizedPublicMeta } from "@/lib/locale/build-localized-public-meta";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { useLocale } from "@/lib/locale/locale-context";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { useUiString } from "@/lib/locale/use-ui-strings";
import { APPROVED_PRICES_MINOR } from "@/lib/billing/catalogue/prices";
import type { UiStringKey } from "@/lib/locale/ui-strings";

const FREE_FEATURE_KEYS = [
  "pricing.free.feature.1",
  "pricing.free.feature.2",
  "pricing.free.feature.3",
  "pricing.free.feature.4",
  "pricing.free.feature.5",
] as const satisfies readonly UiStringKey[];

const PRO_FEATURE_KEYS = [
  "pricing.pro.feature.1",
  "pricing.pro.feature.2",
  "pricing.pro.feature.3",
  "pricing.pro.feature.4",
] as const satisfies readonly UiStringKey[];

const PRO_PLUS_FEATURE_KEYS = [
  "pricing.proPlus.feature.1",
  "pricing.proPlus.feature.2",
  "pricing.proPlus.feature.3",
  "pricing.proPlus.feature.4",
] as const satisfies readonly UiStringKey[];

const COMPARISON_ROWS = [
  {
    labelKey: "pricing.compare.row.lessonCount.label",
    freeKey: "pricing.compare.row.lessonCount.free",
    proKey: "pricing.compare.row.lessonCount.pro",
    proPlusKey: "pricing.compare.row.lessonCount.proPlus",
  },
  {
    labelKey: "pricing.compare.row.builder.label",
    free: false,
    pro: false,
    proPlus: true,
  },
  {
    labelKey: "pricing.compare.row.video.label",
    free: false,
    pro: true,
    proPlus: true,
  },
  {
    labelKey: "pricing.compare.row.rag.label",
    free: false,
    pro: true,
    proPlus: true,
  },
  {
    labelKey: "pricing.compare.row.assistant.label",
    freeKey: "pricing.compare.row.assistant.free",
    proKey: "pricing.compare.row.assistant.pro",
    proPlusKey: "pricing.compare.row.assistant.proPlus",
  },
  {
    labelKey: "pricing.compare.row.aiEval.label",
    free: false,
    pro: true,
    proPlus: true,
  },
] as const;

type PaidPlanKey = "pro" | "pro_plus";

function formatMinorUnits(amount: number): string {
  const major = amount / 100;
  return Number.isInteger(major) ? String(major) : major.toFixed(2);
}

const FAQ_KEYS = [
  { q: "pricing.faq.1.q", a: "pricing.faq.1.a" },
  { q: "pricing.faq.2.q", a: "pricing.faq.2.a" },
  { q: "pricing.faq.3.q", a: "pricing.faq.3.a" },
  { q: "pricing.faq.4.q", a: "pricing.faq.4.a" },
] as const satisfies readonly { q: UiStringKey; a: UiStringKey }[];

export const Route = createFileRoute("/pricing")({
  validateSearch: (raw: Record<string, unknown>) => parseLocaleSearchParam(raw),
  head: async ({ match }) => {
    const locale = await resolveRouteHeadLocale({
      searchLocale: match.search.locale,
    });
    return buildLocalizedPublicMeta(locale, "pricing");
  },
  component: PricingPage,
});

function PricingPage() {
  const t = useUiString();
  const { dir } = useLocale();

  return (
    <div className="min-h-dvh flex flex-col" dir={dir}>
      <Navbar />
      <main id="main-content" className="flex-1" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 py-12 md:py-16 max-w-5xl space-y-14">
          <header className="text-center space-y-4 max-w-2xl mx-auto">
            <p className="text-xs font-mono uppercase tracking-widest text-accent">
              {t("pricing.eyebrow")}
            </p>
            <h1 className="text-3xl md:text-4xl font-black">{t("pricing.hero.title")}</h1>
            <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
              {t("pricing.hero.subtitle")}
            </p>
          </header>

          <section className="grid lg:grid-cols-3 gap-5 items-stretch">
            <article className="glass rounded-2xl border border-border/60 p-6 md:p-8 flex flex-col">
              <div className="mb-6">
                <h2 className="text-2xl font-black">{t("pricing.plan.free.name")}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("pricing.plan.free.subtitle")}
                </p>
              </div>
              <ul className="space-y-3 text-sm flex-1 mb-8">
                {FREE_FEATURE_KEYS.map((key) => (
                  <li key={key} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
              <p className="mb-5 text-3xl font-black">{t("pricing.price.free")}</p>
              <Button asChild variant="hero" size="lg" className="w-full">
                <Link to="/signup">{t("pricing.cta.startFree")}</Link>
              </Button>
            </article>

            <article className="glass rounded-2xl border border-primary/30 bg-primary/[0.03] p-6 md:p-8 flex flex-col relative overflow-hidden">
              <div className="absolute top-4 start-4">
                <Badge
                  variant="outline"
                  className="border-primary/40 bg-primary/10 text-primary text-[11px] font-semibold"
                >
                  {t("pricing.badge.testMode")}
                </Badge>
              </div>
              <div className="mb-6">
                <h2 className="text-2xl font-black">{t("pricing.plan.pro.name")}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("pricing.plan.pro.subtitle")}
                </p>
              </div>
              <ul className="space-y-3 text-sm flex-1 mb-8">
                {PRO_FEATURE_KEYS.map((key) => (
                  <li key={key} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
              <PlanPrices plan="pro" />
              <StripeCheckoutButtons plan="pro" variant="violet" />
            </article>

            <article className="glass rounded-2xl border border-accent/40 bg-accent/[0.04] p-6 md:p-8 flex flex-col relative overflow-hidden">
              <div className="absolute top-4 start-4">
                <Badge
                  variant="outline"
                  className="border-accent/40 bg-accent/10 text-accent text-[11px] font-semibold"
                >
                  {t("pricing.badge.testMode")}
                </Badge>
              </div>
              <div className="mb-6">
                <h2 className="text-2xl font-black">{t("pricing.plan.proPlus.name")}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("pricing.plan.proPlus.subtitle")}
                </p>
              </div>
              <ul className="space-y-3 text-sm flex-1 mb-8">
                {PRO_PLUS_FEATURE_KEYS.map((key) => (
                  <li key={key} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
              <PlanPrices plan="pro_plus" />
              <StripeCheckoutButtons plan="pro_plus" variant="outline" />
            </article>
          </section>

          <section className="glass rounded-2xl border border-border/60 p-6 md:p-8">
            <h2 className="text-lg font-bold mb-5">{t("pricing.compare.title")}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[320px]">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground">
                    <th className="text-start py-2 font-medium">
                      {t("pricing.compare.colFeature")}
                    </th>
                    <th className="text-center py-2 font-medium w-24">
                      {t("pricing.compare.colFree")}
                    </th>
                    <th className="text-center py-2 font-medium w-24">
                      {t("pricing.compare.colPro")}
                    </th>
                    <th className="text-center py-2 font-medium w-28">
                      {t("pricing.compare.colProPlus")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.labelKey} className="border-b border-border/30 last:border-0">
                      <td className="py-3 text-foreground/90">{t(row.labelKey)}</td>
                      <td className="py-3 text-center">
                        <ComparisonCell
                          value={
                            "freeKey" in row ? t(row.freeKey) : "free" in row ? row.free : false
                          }
                          availableLabel={t("pricing.compare.availableAria")}
                        />
                      </td>
                      <td className="py-3 text-center">
                        <ComparisonCell
                          value={"proKey" in row ? t(row.proKey) : "pro" in row ? row.pro : true}
                          availableLabel={t("pricing.compare.availableAria")}
                        />
                      </td>
                      <td className="py-3 text-center">
                        <ComparisonCell
                          value={
                            "proPlusKey" in row
                              ? t(row.proPlusKey)
                              : "proPlus" in row
                                ? row.proPlus
                                : true
                          }
                          availableLabel={t("pricing.compare.availableAria")}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold">{t("pricing.faq.title")}</h2>
            <div className="grid gap-3">
              {FAQ_KEYS.map((item) => (
                <details
                  key={item.q}
                  className="glass rounded-xl border border-border/50 p-4 group"
                >
                  <summary className="cursor-pointer list-none font-semibold text-sm flex items-center justify-between gap-3">
                    {t(item.q)}
                    <span className="text-muted-foreground text-xs group-open:rotate-180 transition-transform">
                      ▾
                    </span>
                  </summary>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-3">{t(item.a)}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="text-center text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-8">
            <p>
              {t("pricing.legal.note")}{" "}
              <Link
                to="/privacy"
                className="text-primary underline underline-offset-2 hover:text-foreground transition"
              >
                {t("pricing.legal.privacy")}
              </Link>{" "}
              {t("pricing.legal.and")}{" "}
              <Link
                to="/terms"
                className="text-primary underline underline-offset-2 hover:text-foreground transition"
              >
                {t("pricing.legal.terms")}
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function PlanPrices({ plan }: { plan: PaidPlanKey }) {
  const t = useUiString();
  const egypt = APPROVED_PRICES_MINOR.EG[plan];
  const international = APPROVED_PRICES_MINOR.INTL[plan];

  return (
    <div className="mb-5 rounded-xl border border-border/60 bg-background/60 p-4">
      <p className="font-bold">
        {formatMinorUnits(egypt.month)} EGP{" "}
        <span className="text-xs font-normal text-muted-foreground">
          / {t("pricing.price.month")}
        </span>
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatMinorUnits(egypt.year)} EGP / {t("pricing.price.year")}
      </p>
      <p className="mt-3 border-t border-border/50 pt-3 text-xs text-muted-foreground">
        {t("pricing.price.international")}: {formatMinorUnits(international.month)} USD /{" "}
        {t("pricing.price.month")} · {formatMinorUnits(international.year)} USD /{" "}
        {t("pricing.price.year")}
      </p>
      <p className="mt-2 text-[11px] text-muted-foreground">{t("pricing.price.taxExclusive")}</p>
    </div>
  );
}

function ComparisonCell({
  value,
  availableLabel,
}: {
  value: boolean | string;
  availableLabel: string;
}) {
  if (value === true) {
    return <Check className="h-4 w-4 text-primary inline-block" aria-label={availableLabel} />;
  }
  if (value === false) {
    return <span className="text-muted-foreground/50">—</span>;
  }
  return <span className="text-xs text-muted-foreground">{value}</span>;
}
