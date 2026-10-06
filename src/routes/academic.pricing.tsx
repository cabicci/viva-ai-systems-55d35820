import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { LineIntroduction } from "@/components/site/LearningLines";
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
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [market, setMarket] = useState<"EG" | "INTL">("EG");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
  async function portal() {
    setBusy(true);
    setError(false);
    try {
      const { data, error } = await supabase.functions.invoke("billing-stripe-portal", {
        body: { scope: "academic" },
      });
      if (
        error ||
        typeof data?.url !== "string" ||
        new URL(data.url).origin !== "https://billing.stripe.com"
      )
        throw new Error("Unavailable");
      window.location.assign(data.url);
    } catch {
      setError(true);
      setBusy(false);
    }
  }
  async function checkout() {
    setBusy(true);
    setError(false);
    try {
      const { data, error } = await supabase.functions.invoke("academic-stripe-checkout", {
        body: { marketCode: market, billingInterval: interval, locale },
      });
      if (error || typeof data?.url !== "string") throw new Error("Unavailable");
      const url = new URL(data.url);
      if (url.origin !== "https://checkout.stripe.com") throw new Error("Invalid checkout");
      window.location.assign(url.href);
    } catch {
      setError(true);
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
            <p className="my-5 leading-relaxed text-muted-foreground">{text.details}</p>
            <PlanPrices plan="pro_plus" />
            {!released ? (
              <p role="status">{c.unavailable}</p>
            ) : user ? (
              <div className="space-y-5">
                <label className="block">
                  {w.duration}
                  <select
                    className="mt-2 w-full rounded border bg-background p-3"
                    value={interval}
                    onChange={(e) => setInterval(e.target.value as "month" | "year")}
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
                    onChange={(e) => setMarket(e.target.value as "EG" | "INTL")}
                  >
                    <option value="EG">{offers.egypt} — EGP</option>
                    <option value="INTL">{offers.international} — USD</option>
                  </select>
                </label>
                <PaymentMethods
                  packageKey="academic"
                  interval={interval}
                  market={market}
                  stripe={() => void checkout()}
                  disabled={busy}
                  initialMethod="instapay"
                >
                  <Button className="w-full">{w.continue}</Button>
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
        </section>
      </main>
      <Footer />
    </div>
  );
}
