import { CheckoutPlanSummary } from "@/components/billing/CheckoutPlanSummary";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/locale/locale-context";
import { Button } from "@/components/ui/button";
import { PaymentMethods } from "@/components/commerce/PaymentMethods";
import {
  BillingUnavailableError,
  billingUnavailableMessage,
  resolveCheckoutUrl,
} from "@/lib/billing/checkout-client";

const copy = {
  "ar-EG": {
    month: "اشترك شهريًا",
    year: "اشترك سنويًا",
    error: "تعذّر بدء الدفع. حاول لاحقًا.",
  },
  "ar-MSA": {
    month: "اشترك شهريًا",
    year: "اشترك سنويًا",
    error: "تعذر بدء الدفع. حاول لاحقًا.",
  },
  "ar-Gulf": {
    month: "اشترك شهريًا",
    year: "اشترك سنويًا",
    error: "تعذر بدء الدفع. حاول لاحقًا.",
  },
  en: {
    month: "Subscribe monthly",
    year: "Subscribe yearly",
    error: "Checkout could not start. Try later.",
  },
};

export function KidsCheckoutButtons({ market }: { market: "EG" | "INTL" }) {
  const { locale } = useLocale();
  const words = copy[locale];
  const [pending, setPending] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<"month" | "year" | null>(null);

  const [checkoutError, setCheckoutError] = useState<string>();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);

  async function checkout(billingInterval: "month" | "year") {
    if (pending) return;
    setPending(true);
    setCheckoutError(undefined);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        window.location.assign(`/login?intent=kids&locale=${locale}`);
        return;
      }
      const access = await supabase.rpc("kids_parent_can_manage_profiles" as never);
      if (access.error) throw access.error;
      if (access.data !== true) {
        window.location.assign(`/kids/family?locale=${locale}`);
        return;
      }
      // The 10% family variant is decided on the server from the parent's account.
      const url = await resolveCheckoutUrl(
        { product: "kids", billingInterval, marketCode: market, locale },
        async () => {
          const { data, error } = await supabase.functions.invoke("kids-stripe-checkout", {
            body: { marketCode: market, billingInterval },
          });
          if (error || !data?.url) throw error ?? new Error("Checkout URL missing");
          if (!data.url.startsWith("https://checkout.stripe.com/"))
            throw new Error("Invalid checkout URL");
          return data.url as string;
        },
      );
      window.location.assign(url);
    } catch (e) {
      setCheckoutError(
        e instanceof BillingUnavailableError ? billingUnavailableMessage(locale) : words.error,
      );
      setPending(false);
    }
  }

  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {(["month", "year"] as const).map((period) => (
        <Button
          key={period}
          type="button"
          variant={period === "year" ? "outline" : "default"}
          disabled={pending || paymentBusy}
          onClick={(event) => {
            returnFocusRef.current = event.currentTarget;
            setSelectedInterval(period);
            setCheckoutError(undefined);
            setCheckoutOpen(true);
          }}
        >
          {words[period]}
        </Button>
      ))}
      {selectedInterval && (
        <PaymentMethods
          packageKey="kids"
          interval={selectedInterval}
          market={market}
          disabled={pending}
          onBusyChange={setPaymentBusy}
          stripe={() => checkout(selectedInterval)}
          checkout={{
            title: locale === "en" ? "Kids family plan" : "باقة كيدز العائلية",
            error: checkoutError,
            open: checkoutOpen,
            onOpenChange: setCheckoutOpen,
            hideTrigger: true,
            returnFocusRef,
            summary: (
              <CheckoutPlanSummary product="kids" market={market} interval={selectedInterval} />
            ),
          }}
        >
          {words[selectedInterval]}
        </PaymentMethods>
      )}
    </div>
  );
}
