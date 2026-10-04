import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/locale/locale-context";
import { Button } from "@/components/ui/button";
import { PaymentMethods } from "@/components/commerce/PaymentMethods";

const copy = {
  "ar-EG": {
    month: "اشترك شهريًا",
    year: "اشترك سنويًا",
    error: "تعذّر بدء الدفع التجريبي. حاول لاحقًا.",
  },
  "ar-MSA": {
    month: "اشترك شهريًا",
    year: "اشترك سنويًا",
    error: "تعذر بدء الدفع التجريبي. حاول لاحقًا.",
  },
  "ar-Gulf": {
    month: "اشترك شهريًا",
    year: "اشترك سنويًا",
    error: "تعذر بدء الدفع التجريبي. حاول لاحقًا.",
  },
  en: {
    month: "Subscribe monthly",
    year: "Subscribe yearly",
    error: "Test checkout could not start. Try later.",
  },
};

export function KidsCheckoutButtons({ market }: { market: "EG" | "INTL" }) {
  const { locale } = useLocale();
  const words = copy[locale];
  const [pending, setPending] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<"month" | "year" | null>(null);

  async function checkout(billingInterval: "month" | "year") {
    if (pending) return;
    setPending(true);
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
      const { data, error } = await supabase.functions.invoke("kids-stripe-checkout", {
        body: { marketCode: market, billingInterval },
      });
      if (error || !data?.url) throw error ?? new Error("Checkout URL missing");
      if (!data.url.startsWith("https://checkout.stripe.com/"))
        throw new Error("Invalid checkout URL");
      window.location.assign(data.url);
    } catch {
      toast.error(words.error);
      setPending(false);
    }
  }

  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      <Button type="button" disabled={pending} onClick={() => setSelectedInterval("month")}>
        {words.month}
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => setSelectedInterval("year")}
      >
        {words.year}
      </Button>
      {selectedInterval && (
        <div className="sm:col-span-2">
          <PaymentMethods
            packageKey="kids"
            interval={selectedInterval}
            market={market}
            disabled={pending}
            stripe={() => void checkout(selectedInterval)}
          >
            {words[selectedInterval]}
          </PaymentMethods>
        </div>
      )}
    </div>
  );
}
