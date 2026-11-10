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

/** Validate declared inventory metadata before displaying configured methods. */
export function isPaymentMethodList(value: unknown): value is PaymentMethod[] {
  return (
    Array.isArray(value) &&
    value.every((entry: unknown) => {
      if (!entry || typeof entry !== "object") return false;
      const item = entry as Record<string, unknown>;
      return (
        typeof item.code === "string" &&
        typeof item.enabled === "boolean" &&
        typeof item.instructions === "string" &&
        typeof item.destination === "string" &&
        Array.isArray(item.currencies) &&
        item.currencies.every((currency: unknown) => typeof currency === "string") &&
        (item.qr_url === undefined || item.qr_url === null || typeof item.qr_url === "string") &&
        (item.instructions_localized === undefined ||
          (!!item.instructions_localized &&
            typeof item.instructions_localized === "object" &&
            !Array.isArray(item.instructions_localized) &&
            Object.values(item.instructions_localized).every((text) => typeof text === "string")))
      );
    })
  );
}
