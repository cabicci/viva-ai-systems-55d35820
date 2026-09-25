import { useLocale } from "@/lib/locale/locale-context";
import { KIDS_FAMILY_POLICY, quoteKidsFamily } from "@/lib/kids/family-policy";

export function KidsFamilyPricing() {
  const { locale } = useLocale();
  const en = locale === "en";
  const money = (minor: number, currency: string) =>
    new Intl.NumberFormat(en ? "en-US" : "ar-EG", { style: "currency", currency }).format(
      minor / 100,
    );

  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6">
      <h2 className="text-xl font-bold">
        {en ? "Kids family pricing" : "أسعار اشتراك كيدز العائلي"}
      </h2>
      <p className="text-sm text-muted-foreground">
        {en
          ? `One independent subscription for up to ${KIDS_FAMILY_POLICY.maxProfiles} children. Pro or Pro Plus is optional.`
          : `اشتراك مستقل يشمل حتى ${KIDS_FAMILY_POLICY.maxProfiles} أطفال. لا يشترط الاشتراك في Pro أو Pro Plus.`}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {(["EG", "INTL"] as const).map((market) => (
          <div key={market} className="rounded-xl border border-border/60 p-4">
            <h3 className="font-bold">
              {market === "EG" ? (en ? "Egypt" : "مصر") : en ? "International" : "دولي"}
            </h3>
            {(["month", "year"] as const).map((interval) => {
              const base = quoteKidsFamily(market, interval);
              const bundle = quoteKidsFamily(market, interval, "pro");
              const period =
                interval === "month" ? (en ? "Monthly" : "شهريًا") : en ? "Annually" : "سنويًا";
              return (
                <div key={interval} className="mt-3 text-sm">
                  <p>
                    {period}: <strong>{money(base.totalMinor, base.currency)}</strong>
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {en ? "With Pro or Pro Plus" : "مع Pro أو Pro Plus"}:{" "}
                    {money(bundle.totalMinor, bundle.currency)}
                  </p>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {en
          ? "Prices exclude tax. The 10% bundle discount applies to Kids only; adult plan prices stay the same. Annual billing costs the equivalent of 10 monthly payments. Subscriptions are not available for purchase yet."
          : "الأسعار لا تشمل الضرائب. خصم الجمع 10% يطبق على كيدز فقط، وتبقى أسعار باقات الكبار كما هي. سعر السنة يعادل 10 أشهر. شراء الاشتراك غير متاح بعد."}
      </p>
    </section>
  );
}
