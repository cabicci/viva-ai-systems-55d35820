import { CheckoutPlanSummary } from "@/components/billing/CheckoutPlanSummary";
import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/locale/locale-context";
import { useUiString } from "@/lib/locale/use-ui-strings";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";
import { getKidsCheckoutCopy } from "@/lib/kids/checkout-copy";
import { PaymentMethods } from "@/components/commerce/PaymentMethods";
import {
  BillingUnavailableError,
  billingUnavailableMessage,
  resolveCheckoutUrl,
} from "@/lib/billing/checkout-client";

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
  const [checkoutError, setCheckoutError] = useState<string>();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);
  const { locale } = useLocale();
  const t = useUiString();
  const kidsCopy = getKidsCheckoutCopy(locale);
  const localeSearch = useLocaleLinkSearch();
  const marketCode = locale === "ar-EG" ? "EG" : "INTL";

  async function startCheckout(billingInterval: BillingInterval) {
    if (loading) return;
    setLoading(billingInterval);
    setCheckoutError(undefined);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        window.location.assign("/login");
        return;
      }

      const url = await resolveCheckoutUrl(
        { product: "core", planKey: plan, billingInterval, marketCode },
        async () => {
          const { data, error } = await supabase.functions.invoke("billing-stripe-checkout", {
            body: { planKey: plan, billingInterval, marketCode },
          });
          if (error || !data?.url) throw error ?? new Error("Missing Checkout URL");
          return data.url as string;
        },
      );
      window.location.assign(url);
    } catch (e) {
      setCheckoutError(
        e instanceof BillingUnavailableError
          ? billingUnavailableMessage(locale)
          : t("pricing.checkout.error"),
      );
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {(["month", "year"] as const).map((period) => (
          <Button
            key={period}
            type="button"
            variant={variant}
            size="lg"
            disabled={loading !== null || paymentBusy}
            onClick={(event) => {
              returnFocusRef.current = event.currentTarget;
              setPendingInterval(period);
              setCheckoutError(undefined);
              setCheckoutOpen(true);
            }}
          >
            <span className="min-w-0 whitespace-normal text-center leading-tight">
              {t(period === "month" ? "pricing.cta.payMonthly" : "pricing.cta.payYearly")}
            </span>
          </Button>
        ))}
      </div>
      {pendingInterval && (
        <PaymentMethods
          packageKey={plan}
          interval={pendingInterval}
          market={marketCode}
          disabled={loading !== null}
          onBusyChange={setPaymentBusy}
          stripe={() => startCheckout(pendingInterval)}
          checkout={{
            title: t(plan === "pro" ? "pricing.plan.pro.name" : "pricing.plan.proPlus.name"),
            error: checkoutError,
            open: checkoutOpen,
            onOpenChange: setCheckoutOpen,
            hideTrigger: true,
            returnFocusRef,
            summary: (
              <div className="space-y-2">
                <CheckoutPlanSummary
                  product={plan}
                  market={marketCode}
                  interval={pendingInterval}
                  allowance={t(
                    plan === "pro"
                      ? "pricing.compare.row.assistant.pro"
                      : "pricing.compare.row.assistant.proPlus",
                  )}
                />
                <p>{kidsCopy.choice}</p>
                <Link
                  to="/kids/pricing"
                  search={localeSearch()}
                  className="inline-flex min-h-11 items-center font-bold text-primary underline"
                >
                  {kidsCopy.prices}
                </Link>
              </div>
            ),
          }}
        >
          {kidsCopy.adultOnly}
        </PaymentMethods>
      )}
    </div>
  );
}
