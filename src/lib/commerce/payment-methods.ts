import type { PaymentMethod } from "./contracts";

/** A configured method is usable only for the selected currency. */
export function manualMethodAvailable(method: PaymentMethod | undefined, currency: string) {
  return (
    !!method &&
    ["instapay", "wallet", "bank"].includes(method.code) &&
    method.enabled === true &&
    !!method.destination?.trim() &&
    !!method.instructions?.trim() &&
    method.currencies.includes(currency)
  );
}

export function effectivePaymentMethod(
  requested: string,
  methods: PaymentMethod[],
  currency: string,
) {
  return requested === "stripe" ||
    manualMethodAvailable(
      methods.find((item) => item.code === requested),
      currency,
    )
    ? requested
    : "stripe";
}
