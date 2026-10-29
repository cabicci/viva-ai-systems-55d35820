import type { PackageKey } from "./contracts";
import type { LiveCheckoutRequest } from "@/lib/billing/checkout-client";

/** Both rails retain the same selection; only the server chooses Stripe mode. */
export function stripeSelection(packageKey: PackageKey, market: "EG" | "INTL", interval: "month" | "year", locale: string) {
  const common = { marketCode: market, billingInterval: interval, locale };
  const live: LiveCheckoutRequest = packageKey === "pro" || packageKey === "pro_plus"
    ? { ...common, product: "core", planKey: packageKey }
    : packageKey === "academic"
      ? { ...common, product: "academic", academicAssistant: false }
      : { ...common, product: packageKey };
  const functionName = packageKey === "pro" || packageKey === "pro_plus"
    ? "billing-stripe-checkout" : `${packageKey}-stripe-checkout`;
  const body = packageKey === "pro" || packageKey === "pro_plus"
    ? { ...common, planKey: packageKey }
    : packageKey === "academic" ? { ...common, academicAssistant: false } : common;
  return { live, functionName, body };
}