import { useEffect, useState } from "react";
import { useLocale } from "@/lib/locale/locale-context";
import { commerceCopy } from "@/lib/commerce/copy";
import { adminOfferCopy } from "@/lib/commerce/admin-offer-copy";
import type { PackageKey } from "@/lib/commerce/contracts";
import { Select } from "./AdminShared";
import { PaymentMethods } from "./PaymentMethods";
import { supabase } from "@/integrations/supabase/client";
import { resolveCheckoutUrl, billingUnavailableMessage } from "@/lib/billing/checkout-client";
import { stripeSelection } from "@/lib/commerce/stripe-selection";
export function RedeemOffer() {
  const { locale } = useLocale(),
    w = commerceCopy(locale),
    s = adminOfferCopy(locale);
  const [pack, setPack] = useState<PackageKey>("pro"),
    [market, setMarket] = useState<"EG" | "INTL">("EG"),
    [interval, setInterval] = useState<"month" | "year">("month");
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  useEffect(() => { setError(""); }, [pack, market, interval]);
  async function checkout() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const selected = stripeSelection(pack, market, interval, locale);
      const url = await resolveCheckoutUrl(selected.live, async () => {
        const { data, error } = await supabase.functions.invoke(selected.functionName, { body: selected.body });
        if (error || typeof data?.url !== "string" || new URL(data.url).origin !== "https://checkout.stripe.com")
          throw new Error("CHECKOUT_UNAVAILABLE");
        return data.url as string;
      });
      window.location.assign(url);
    } catch {
      setError(billingUnavailableMessage(locale));
    } finally { setBusy(false); }
  }
  return (
    <section className="space-y-4 rounded-xl border p-4">
      <h2 className="font-bold">{s.code}</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          label={w.package}
          value={pack}
          onChange={(v) => setPack(v as PackageKey)}
          options={[
            ["pro", "Pro"],
            ["pro_plus", "Pro Plus"],
            ["kids", "Masaarat Kids"],
            ["technical", "Masaarat TECH"],
            ["academic", "Masaarat Academic"],
          ]}
        />
        <Select
          label={s.market}
          value={market}
          onChange={(v) => setMarket(v as "EG" | "INTL")}
          options={[
            ["EG", s.egypt],
            ["INTL", s.international],
          ]}
        />
        <Select
          label={w.interval}
          value={interval}
          onChange={(v) => setInterval(v as "month" | "year")}
          options={[
            ["month", w.month],
            ["year", w.year],
          ]}
        />
      </div>
      <PaymentMethods
        packageKey={pack}
        market={market}
        interval={interval}
        disabled={busy}
        stripe={() => void checkout()}
      >
        {w.continue}
      </PaymentMethods>
      {error && <p role="alert" className="text-destructive">{error}</p>}
    </section>
  );
}
