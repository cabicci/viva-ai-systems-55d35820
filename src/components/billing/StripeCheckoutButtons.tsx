import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/locale/locale-context";
import { useUiString } from "@/lib/locale/use-ui-strings";

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
  const { locale } = useLocale();
  const t = useUiString();
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
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <Button
        type="button"
        variant={variant}
        size="lg"
        disabled={loading !== null}
        onClick={() => void startCheckout("month")}
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
        onClick={() => void startCheckout("year")}
      >
        {loading === "year" && <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />}
        <span className="min-w-0 whitespace-normal text-center leading-tight">
          {t("pricing.cta.payYearly")}
        </span>
      </Button>
    </div>
  );
}
