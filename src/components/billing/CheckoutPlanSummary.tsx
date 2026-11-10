import { APPROVED_PRICES_MINOR } from "@/lib/billing/catalogue/prices";
import { KIDS_PRICES_MINOR } from "@/lib/kids/family-policy";
import { commercialCopy } from "@/lib/billing/commercial-copy";
import { useLocale } from "@/lib/locale/locale-context";
import { useUiString } from "@/lib/locale/use-ui-strings";

/** Existing display catalogue, not a replacement for the server's final quote. */
export function CheckoutPlanSummary({
  product,
  market,
  interval,
  allowance,
}: {
  product: "pro" | "pro_plus" | "academic" | "technical" | "kids";
  market: "EG" | "INTL";
  interval: "month" | "year";
  allowance?: string;
}) {
  const { locale } = useLocale(),
    t = useUiString(),
    copy = commercialCopy(locale);
  const amount =
    product === "kids"
      ? KIDS_PRICES_MINOR[market][interval]
      : APPROVED_PRICES_MINOR[market][product === "pro" ? "pro" : "pro_plus"][interval];
  const currency = market === "EG" ? "EGP" : "USD";
  const money = new Intl.NumberFormat(
    locale === "en" ? "en-US" : locale === "ar-Gulf" ? "ar-SA" : "ar-EG",
    { style: "currency", currency },
  ).format(amount / 100);
  const included =
    allowance ??
    (product === "kids"
      ? copy.family
      : product === "academic" || product === "technical"
        ? copy.included
        : undefined);
  return (
    <div className="space-y-1">
      <p>
        {locale === "en" ? "Base price" : "السعر الأساسي"}: <strong>{money}</strong> /{" "}
        {t(interval === "month" ? "pricing.price.month" : "pricing.price.year")}
      </p>
      <p className="text-muted-foreground">{t("pricing.price.taxExclusive")}</p>
      {included && <p>{included}</p>}
    </div>
  );
}
