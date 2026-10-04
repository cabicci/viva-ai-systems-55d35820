import { useLocale } from "@/lib/locale/locale-context";
import { KIDS_FAMILY_POLICY, quoteKidsFamily } from "@/lib/kids/family-policy";
import { KidsCheckoutButtons } from "./KidsCheckoutButtons";

export function KidsFamilyPricing() {
  const { locale } = useLocale();
  const en = locale === "en";
  const eg = locale === "ar-EG";
  const gulf = locale === "ar-Gulf";
  const money = (minor: number, currency: string) =>
    new Intl.NumberFormat(en ? "en-US" : gulf ? "ar-SA" : "ar-EG", {
      style: "currency",
      currency,
    }).format(minor / 100);

  return (
    <section
      id="kids"
      className="glass scroll-mt-28 rounded-2xl border border-primary/30 bg-primary/[0.03] p-6 md:p-8"
    >
      <h2 className="text-2xl font-black">
        {en ? "Kids family pricing" : eg ? "أسعار اشتراك كيدز للعيلة" : "أسعار اشتراك كيدز العائلي"}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {en
          ? `One independent subscription for up to ${KIDS_FAMILY_POLICY.maxProfiles} children. Pro or Pro Plus is optional.`
          : eg
            ? `اشتراك منفصل يشمل حتى ${KIDS_FAMILY_POLICY.maxProfiles} أطفال. مش لازم تشترك في Pro أو Pro Plus.`
            : gulf
              ? `اشتراك مستقل يشمل حتى ${KIDS_FAMILY_POLICY.maxProfiles} أطفال. ما تحتاج تشترك في Pro أو Pro Plus.`
              : `اشتراك مستقل يشمل حتى ${KIDS_FAMILY_POLICY.maxProfiles} أطفال. لا يشترط الاشتراك في Pro أو Pro Plus.`}
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {(["EG", "INTL"] as const).map((market) => (
          <div key={market} className="rounded-xl border border-border/50 bg-background/40 p-5">
            <h3 className="font-bold text-primary">
              {market === "EG" ? (en ? "Egypt" : "مصر") : en ? "International" : "دولي"}
            </h3>
            {(["month", "year"] as const).map((interval) => {
              const base = quoteKidsFamily(market, interval);
              const bundle = quoteKidsFamily(market, interval, "pro");
              const period =
                interval === "month" ? (en ? "Monthly" : "شهريًا") : en ? "Annually" : "سنويًا";
              return (
                <div key={interval} className="mt-4 border-t border-border/40 pt-4 text-sm">
                  <p className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-muted-foreground">{period}</span>
                    <strong className="text-2xl font-black text-foreground">
                      {money(base.totalMinor, base.currency)}
                    </strong>
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {en ? "With Pro or Pro Plus" : "مع Pro أو Pro Plus"}:{" "}
                    <span className="font-semibold text-primary">
                      {money(bundle.totalMinor, bundle.currency)}
                    </span>
                  </p>
                </div>
              );
            })}
            <KidsCheckoutButtons market={market} />
          </div>
        ))}
      </div>
      <p className="mt-6 border-t border-border/40 pt-5 text-sm leading-relaxed text-muted-foreground">
        {en
          ? "Stripe uses test mode. Available manual transfers are real payments and require administrator verification. Prices exclude tax. The 10% discount applies to Kids while Pro or Pro Plus is active; adult prices stay the same. Annual billing costs the equivalent of 10 monthly payments. Choose the market matching the parent account's country."
          : eg
            ? "Stripe تجريبي. التحويل اليدوي المتاح دفع فعلي وبيحتاج مراجعة الإدارة. الأسعار من غير ضرائب. خصم ١٠٪ على كيدز وقت ما تكون باقة Pro أو Pro Plus فعّالة، وسعر الكبار ما بيتغيرش. السنة بسعر ١٠ شهور. اختار سوق بلد حساب وليّ الأمر."
            : gulf
              ? "Stripe تجريبي. التحويل اليدوي المتاح دفع فعلي ويحتاج مراجعة الإدارة. الأسعار ما تشمل الضريبة. خصم ١٠٪ على كيدز إذا باقة Pro أو Pro Plus فعّالة، وسعر الكبار ما يتغير. السنة بسعر ١٠ شهور. اختر سوق بلد حساب وليّ الأمر."
              : "Stripe تجريبي. التحويل اليدوي المتاح دفع فعلي ويستلزم مراجعة الإدارة. الأسعار لا تشمل الضرائب. خصم 10% يطبق على كيدز أثناء سريان Pro أو Pro Plus، وتبقى أسعار باقات الكبار كما هي. سعر السنة يعادل 10 أشهر. اختر سوق بلد حساب وليّ الأمر."}
      </p>
    </section>
  );
}
