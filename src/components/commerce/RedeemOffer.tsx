import { useState } from "react";
import { useLocale } from "@/lib/locale/locale-context";
import { commerceCopy } from "@/lib/commerce/copy";
import { adminOfferCopy } from "@/lib/commerce/admin-offer-copy";
import type { PackageKey } from "@/lib/commerce/contracts";
import { Select } from "./AdminShared";
import { PaymentMethods } from "./PaymentMethods";
export function RedeemOffer() {
  const { locale } = useLocale(),
    w = commerceCopy(locale),
    s = adminOfferCopy(locale);
  const [pack, setPack] = useState<PackageKey>("pro"),
    [market, setMarket] = useState<"EG" | "INTL">("EG"),
    [interval, setInterval] = useState<"month" | "year">("month");
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
        stripe={() =>
          window.location.assign(
            `${pack === "technical" ? "/technical/pricing" : "/pricing"}?locale=${locale}`,
          )
        }
      >
        {w.continue}
      </PaymentMethods>
    </section>
  );
}
