import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/locale/locale-context";
import { useUiString } from "@/lib/locale/use-ui-strings";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";
import { getKidsCheckoutCopy } from "@/lib/kids/checkout-copy";
import { PaymentMethods } from "@/components/commerce/PaymentMethods";

type PaidPlanKey = "pro" | "pro_plus";
type BillingInterval = "month" | "year";

export function StripeCheckoutButtons({
  plan,
  variant,
}: {
  plan: PaidPlanKey;
  variant: "violet" | "outline";
}) {
  const [loading, setLoading] = useState<BillingInterval | null>(null);
  const [pendingInterval, setPendingInterval] = useState<BillingInterval | null>(null);
  const { locale } = useLocale();
  const t = useUiString();
  const kidsCopy = getKidsCheckoutCopy(locale);
  const localeSearch = useLocaleLinkSearch();
  const marketCode = locale === "ar-EG" ? "EG" : "INTL";

  async function startCheckout(billingInterval: BillingInterval) {
    if (loading) return;
    setLoading(billingInterval);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        window.location.assign("/login");
        return;
      }

      const { data, error } = await supabase.functions.invoke("billing-stripe-checkout", {
        body: { planKey: plan, billingInterval, marketCode },
      });
      if (error || !data?.url) throw error ?? new Error("Missing Checkout URL");
      window.location.assign(data.url);
    } catch {
      toast.error(t("pricing.checkout.error"));
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
        <p className="font-semibold">{kidsCopy.offer}</p>
        <p className="mt-1 text-muted-foreground">{kidsCopy.pending}</p>
        <Link
          to="/pricing"
          search={localeSearch()}
          hash="kids"
          className="mt-2 inline-block font-bold text-primary underline"
        >
          {kidsCopy.prices}
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant={variant}
          size="lg"
          disabled={loading !== null}
          onClick={() => setPendingInterval("month")}
        >
          {loading === "month" && <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />}
          <span className="min-w-0 whitespace-normal text-center leading-tight">
            {t("pricing.cta.payMonthly")}
          </span>
        </Button>
        <Button
          type="button"
          variant={variant}
          size="lg"
          disabled={loading !== null}
          onClick={() => setPendingInterval("year")}
        >
          {loading === "year" && <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />}
          <span className="min-w-0 whitespace-normal text-center leading-tight">
            {t("pricing.cta.payYearly")}
          </span>
        </Button>
      </div>
      {pendingInterval && (
        <div
          role="group"
          aria-label={kidsCopy.confirm}
          className="rounded-xl border border-primary/30 bg-card p-4 text-sm"
        >
          <p className="font-bold">{kidsCopy.confirm}</p>
          <p className="mt-2 text-muted-foreground">{kidsCopy.choice}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <PaymentMethods
              packageKey={plan}
              interval={pendingInterval}
              market={marketCode}
              disabled={loading !== null}
              stripe={() => void startCheckout(pendingInterval)}
            >
              {kidsCopy.adultOnly}
            </PaymentMethods>
            <Button
              type="button"
              variant="outline"
              disabled={loading !== null}
              onClick={() => setPendingInterval(null)}
            >
              {kidsCopy.back}
            </Button>
            <Link
              to="/pricing"
              search={localeSearch()}
              hash="kids"
              className="inline-flex min-h-11 items-center font-bold text-primary underline"
            >
              {kidsCopy.prices}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
