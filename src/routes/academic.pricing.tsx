import { CheckoutPlanSummary } from "@/components/billing/CheckoutPlanSummary";
import { CommercialPurchases } from "@/components/billing/CommercialPurchases";
import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { LineIntroduction } from "@/components/site/LearningLines";
import { PlanAllowance } from "@/components/billing/PlanAllowance";
import { PlanPrices } from "@/components/site/PlanPrices";
import { getLineCopy, lineMeta } from "@/lib/learning-lines";
import { useLocale } from "@/lib/locale/locale-context";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { PaymentMethods } from "@/components/commerce/PaymentMethods";
import { commerceCopy } from "@/lib/commerce/copy";
import { academicCatalogue, academicCommand } from "@/lib/academic-education/client";
import { useQuery } from "@tanstack/react-query";
import { adminOfferCopy } from "@/lib/commerce/admin-offer-copy";

import { Button } from "@/components/ui/button";
import {
  BillingUnavailableError,
  billingUnavailableMessage,
  resolveCheckoutUrl,
  resolvePortalUrl,
} from "@/lib/billing/checkout-client";
import { toast } from "sonner";
export const Route = createFileRoute("/academic/pricing")({
  validateSearch: parseLocaleSearchParam,
  head: async ({ match }) =>
    lineMeta(
      await resolveRouteHeadLocale({ searchLocale: match.search.locale }),
      "academicPricing",
    ),
  component: AcademicPricing,
});
function AcademicPricing() {
  const { locale } = useLocale();
  const c = getLineCopy(locale);
  const w = commerceCopy(locale),
    text = {
      title: c.academic,
      details: c.academicIntro,
      login: locale === "en" ? "Sign in" : "تسجيل الدخول",
    },
    offers = adminOfferCopy(locale);
  const { user, loading } = useAuth();
  const catalogue = useQuery({
    queryKey: ["academic-catalogue", user?.id ?? "anonymous", locale],
    enabled: !loading,
    queryFn: () => academicCatalogue(locale),
  });
  const released =
    !catalogue.isError && !!catalogue.data?.some((course) => course.released === true);
  const status = useQuery({
    queryKey: ["academic-account", user?.id, locale],
    enabled: !!user && released,
    queryFn: () => academicCommand<{ stripe: boolean }>("status", "AC-BUS", null, locale),
  });
  const hasStripe = !status.isError && status.data?.stripe;
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string>();
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [market, setMarket] = useState<"EG" | "INTL">("EG");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
  async function portal() {
    setBusy(true);
    setError(false);
    try {
      const url = await resolvePortalUrl("academic", async () => {
        const { data, error } = await supabase.functions.invoke("billing-stripe-portal", {
          body: { scope: "academic" },
        });
        if (
          error ||
          typeof data?.url !== "string" ||
          new URL(data.url).origin !== "https://billing.stripe.com"
        )
          throw new Error("Unavailable");
        return data.url;
      });
      window.location.assign(url);
    } catch (e) {
      if (e instanceof BillingUnavailableError) toast.error(billingUnavailableMessage(locale));
      setError(true);
      setBusy(false);
    }
  }
  async function checkout() {
    setBusy(true);
    setCheckoutError(undefined);
    try {
      const url = await resolveCheckoutUrl(
        {
          product: "academic",
          academicAssistant: false,
          billingInterval: interval,
          marketCode: market,
          locale,
        },
        async () => {
          const { data, error } = await supabase.functions.invoke("academic-stripe-checkout", {
            body: {
              marketCode: market,
              billingInterval: interval,
              locale,
              academicAssistant: false,
            },
          });
          if (error || typeof data?.url !== "string") throw new Error("Unavailable");
          const testUrl = new URL(data.url);
          if (testUrl.origin !== "https://checkout.stripe.com") throw new Error("Invalid checkout");
          return testUrl.href;
        },
      );
      window.location.assign(url);
    } catch (e) {
      setCheckoutError(
        e instanceof BillingUnavailableError ? billingUnavailableMessage(locale) : w.error,
      );
      setBusy(false);
    }
  }
  return (
    <div>
      <Navbar />
      <main id="main-content">
        <LineIntroduction line="academic" />
        <section className="container mx-auto max-w-3xl px-4 py-12">
          <article className="rounded-3xl border border-primary/30 bg-card p-7">
            <h2 className="text-2xl font-black">{text.title}</h2>
            <ul className="my-5 list-disc ps-5 leading-relaxed text-muted-foreground">
              <li>{text.details}</li>
            </ul>
            <PlanPrices plan="pro_plus" />
            <PlanAllowance />
            {!released ? (
              <p role="status">{c.unavailable}</p>
            ) : user ? (
              <div className="space-y-5">
                <label className="block">
                  {w.duration}
                  <select
                    className="mt-2 w-full rounded border bg-background p-3"
                    value={interval}
                    disabled={busy || paymentBusy}
                    onChange={(e) => {
                      setInterval(e.target.value as "month" | "year");
                      setCheckoutError(undefined);
                    }}
                  >
                    <option value="month">{w.month}</option>
                    <option value="year">{w.year}</option>
                  </select>
                </label>
                <label className="block">
                  {w.market}
                  <select
                    className="mt-2 w-full rounded border bg-background p-3"
                    value={market}
                    disabled={busy || paymentBusy}
                    onChange={(e) => {
                      setMarket(e.target.value as "EG" | "INTL");
                      setCheckoutError(undefined);
                    }}
                  >
                    <option value="EG">
                      {offers.egypt}
                      {locale !== "en" && " — EGP"}
                    </option>
                    <option value="INTL">
                      {offers.international}
                      {locale !== "en" && " — USD"}
                    </option>
                  </select>
                </label>
                <PaymentMethods
                  packageKey="academic"
                  interval={interval}
                  market={market}
                  stripe={() => checkout()}
                  disabled={busy}
                  initialMethod="instapay"
                  onBusyChange={setPaymentBusy}
                  checkout={{
                    title: text.title,
                    error: checkoutError,
                    summary: (
                      <CheckoutPlanSummary product="academic" market={market} interval={interval} />
                    ),
                  }}
                >
                  {w.continue}
                </PaymentMethods>
                {hasStripe && (
                  <Button variant="outline" disabled={busy} onClick={() => void portal()}>
                    {locale === "en"
                      ? "Manage subscription"
                      : locale === "ar-EG"
                        ? "إدارة اشتراكك"
                        : locale === "ar-Gulf"
                          ? "إدارة اشتراكك"
                          : "إدارة الاشتراك"}
                  </Button>
                )}
                {error && <p role="alert">{w.error}</p>}
              </div>
            ) : (
              <a
                className="inline-block rounded bg-primary px-5 py-3 font-bold text-primary-foreground"
                href={`/login?locale=${locale}`}
              >
                {text.login}
              </a>
            )}
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{c.separate}</p>
          </article>
          <div className="mt-8">
            <CommercialPurchases area="academic" />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
