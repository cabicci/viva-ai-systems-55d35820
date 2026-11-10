import { useEffect, useRef, useState } from "react";
import { CheckoutStep, type CheckoutPresentation } from "./CheckoutStep";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { useLocale } from "@/lib/locale/locale-context";
import { getUiString } from "@/lib/locale/ui-strings";
import { commerceCommand } from "@/lib/commerce/commerce.functions";
import { commerceCopy, formatAmount, paymentInstructions } from "@/lib/commerce/copy";
import type {
  Order,
  PackageKey,
  PaymentMethod,
  Quote,
  OneTimeSelection,
} from "@/lib/commerce/contracts";
import { Button } from "@/components/ui/button";
import { OfferPhone } from "./OfferPhone";
import { normalizeOfferPhone } from "@/lib/commerce/offer-input";
import { adminOfferCopy, offerError } from "@/lib/commerce/admin-offer-copy";
import { ReceiptUpload } from "./ReceiptUpload";
import {
  effectivePaymentMethod,
  isPaymentMethodList,
  manualMethodAvailable,
} from "@/lib/commerce/payment-methods";
import {
  StripeCheckoutTrust,
  stripeCardMethodLabel,
} from "@/components/billing/StripeCheckoutTrust";
import {
  resolveCheckoutUrl,
  billingUnavailableMessage,
  type LiveCheckoutRequest,
} from "@/lib/billing/checkout-client";

type PaymentMethodsProps = {
  market: "EG" | "INTL";
  stripe: (offer?: { code: string; phone?: string }) => void | Promise<void>;
  disabled?: boolean;
  initialMethod?: "stripe" | "instapay";
  academicAssistant?: boolean;
  onBusyChange?: (busy: boolean) => void;
  children: React.ReactNode;
  checkout?: CheckoutPresentation;
} & (
  | { oneTime: OneTimeSelection; packageKey?: never; interval?: never }
  | { oneTime?: undefined; packageKey: PackageKey; interval: "month" | "year" }
);

export function PaymentMethods({
  packageKey,
  interval,
  market,
  stripe,
  disabled = false,
  initialMethod = "stripe",
  academicAssistant = false,
  oneTime,
  onBusyChange,
  checkout,
  children,
}: PaymentMethodsProps) {
  const { locale } = useLocale(),
    w = commerceCopy(locale),
    s = adminOfferCopy(locale);
  const command = useServerFn(commerceCommand);
  const [methods, setMethods] = useState<PaymentMethod[]>([]),
    [requestedMethod, setMethod] = useState<string>(initialMethod),
    [code, setCode] = useState(""),
    [phone, setPhone] = useState(""),
    [quoteValue, setQuote] = useState<{ selection: string; quote: Quote }>(),
    [order, setOrder] = useState<Order>(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [localCheckoutOpen, setCheckoutOpen] = useState(false);
  const checkoutOpen = checkout?.open ?? localCheckoutOpen;
  const inventoryEnabled = !checkout || checkoutOpen;
  const [inventoryState, setInventoryState] = useState<"pending" | "ready" | "error">("pending");
  const [inventoryRevision, setInventoryRevision] = useState(0);
  const inventoryCopy =
    locale === "en"
      ? {
          loading: "Loading payment methods…",
          error: "Payment methods could not be loaded. Try again to see available options.",
          retry: "Try again",
        }
      : {
          loading: "جارٍ تحميل وسائل الدفع…",
          error: "تعذر تحميل وسائل الدفع. أعد المحاولة لعرض الخيارات المتاحة.",
          retry: "إعادة المحاولة",
        };
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  const [renewal, setRenewal] = useState(false);
  const availableMethods = inventoryState === "ready" ? methods : [];
  const manualInventoryUnavailable = requestedMethod !== "stripe" && inventoryState !== "ready";
  const method = manualInventoryUnavailable
    ? requestedMethod
    : effectivePaymentMethod(requestedMethod, availableMethods, market === "EG" ? "EGP" : "USD");
  const oneTimeKey = JSON.stringify(oneTime);
  const selection = JSON.stringify([
    packageKey,
    market,
    interval,
    code,
    method,
    renewal,
    academicAssistant,
    oneTimeKey,
  ]);
  const activeSelection = useRef(selection);
  activeSelection.current = selection;
  const quote = quoteValue?.selection === selection ? quoteValue.quote : undefined;
  const hasOfferCode = !!code.trim();
  const automaticDiscount =
    hasOfferCode &&
    packageKey === "kids" &&
    quote?.automatic_discount === true &&
    quote.offer_id == null;
  const codedCardUnavailable =
    hasOfferCode &&
    method === "stripe" &&
    (oneTime || quote?.offer_kind !== "complimentary") &&
    !quote?.live_stripe_available;
  const confirmationBlocked =
    manualInventoryUnavailable ||
    ((method !== "stripe" || hasOfferCode) && !quote) ||
    codedCardUnavailable ||
    (!!quote?.phone_required && !normalizeOfferPhone(phone));
  const actionInFlight = useRef(false);

  async function runAction(action: () => Promise<void>) {
    if (disabled || actionInFlight.current) return;
    actionInFlight.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } finally {
      actionInFlight.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);
  useEffect(() => {
    setQuote(undefined);
    setOrder(undefined);
    setRequestKey(crypto.randomUUID());
  }, [packageKey, market, interval, code, method, renewal, academicAssistant, oneTimeKey]);
  useEffect(() => {
    if (!inventoryEnabled) return;
    let live = true;
    setInventoryState("pending");
    command({ data: { action: "methods", data: {} } })
      .then((result) => {
        if (!live) return;
        if (!isPaymentMethodList(result)) throw new Error("Invalid payment-method inventory");
        setMethods(result);
        setInventoryState("ready");
      })
      .catch(() => {
        if (live) setInventoryState("error");
      });
    return () => {
      live = false;
    };
  }, [command, inventoryRevision, inventoryEnabled]);
  async function review() {
    const captured = selection;
    try {
      const result = (await command({
        data: {
          action: oneTime ? "one_time_quote" : "quote",
          data: oneTime
            ? { ...oneTime, code }
            : {
                package: packageKey,
                market,
                billing_interval: interval,
                code,
                renewal,
                ...(academicAssistant ? { academicAssistant: true } : {}),
              },
        },
      })) as unknown as Quote;
      if (activeSelection.current === captured) setQuote({ selection: captured, quote: result });
    } catch (err) {
      if (activeSelection.current === captured) setError(offerError(err, locale, w.error));
    }
  }
  async function proceed() {
    const free = quote?.offer_kind === "complimentary";
    if (confirmationBlocked) return;
    if (quote?.phone_required && !normalizeOfferPhone(phone)) {
      setError(s.phoneError);
      return;
    }
    if (oneTime && method === "stripe") {
      try {
        await stripe(
          hasOfferCode
            ? {
                code,
                ...(quote?.phone_required
                  ? { phone: normalizeOfferPhone(phone) ?? undefined }
                  : {}),
              }
            : undefined,
        );
      } catch {
        setError(billingUnavailableMessage(locale));
      }
      return;
    }
    if (!oneTime && hasOfferCode && method === "stripe" && !free) {
      if (!quote?.live_stripe_available) return;
      try {
        const selection: LiveCheckoutRequest =
          packageKey === "pro" || packageKey === "pro_plus"
            ? {
                product: "core",
                planKey: packageKey,
                billingInterval: interval,
                marketCode: market,
              }
            : packageKey === "academic"
              ? {
                  product: "academic",
                  academicAssistant,
                  billingInterval: interval,
                  marketCode: market,
                  locale,
                }
              : { product: packageKey, billingInterval: interval, marketCode: market, locale };
        const url = await resolveCheckoutUrl(
          {
            ...selection,
            offer: {
              code,
              key: requestKey,
              renewal,
              ...(quote.phone_required ? { phone: normalizeOfferPhone(phone) ?? undefined } : {}),
            },
          },
          async () => {
            throw new Error("CODED_TEST_CHECKOUT_FORBIDDEN");
          },
        );
        window.location.assign(url);
      } catch {
        setError(billingUnavailableMessage(locale));
      }
      return;
    }
    if (method === "stripe" && !free) {
      try {
        await stripe();
      } catch {
        setError(billingUnavailableMessage(locale));
      }
      return;
    }
    const captured = selection;
    try {
      const result = (await command({
        data: {
          action: oneTime ? "create_one_time_order" : "create_order",
          data: oneTime
            ? {
                ...oneTime,
                method,
                code,
                key: requestKey,
                ...(quote?.phone_required ? { phone: normalizeOfferPhone(phone) } : {}),
              }
            : {
                package: packageKey,
                market,
                billing_interval: interval,
                method: free ? "admin" : method,
                ...(quote?.phone_required ? { phone: normalizeOfferPhone(phone) } : {}),
                code,
                renewal,
                ...(academicAssistant ? { academicAssistant: true } : {}),
                key: requestKey,
              },
        },
      })) as unknown as Order;
      if (activeSelection.current === captured) setOrder(result);
    } catch (err) {
      if (activeSelection.current === captured) setError(offerError(err, locale, w.error));
    }
  }
  const paymentContent = order ? (
    <div className="space-y-3 rounded-xl border p-4">
      <h3 className="font-bold">
        {w.reference}: <bdi>{order.reference}</bdi>
      </h3>
      <p>
        {w.amount}: {formatAmount(order.final_minor, order.currency, locale)}
      </p>
      {!oneTime && (
        <p>
          {w.duration}: {w[interval]}
        </p>
      )}
      {order.review_status === "confirmed" && order.final_minor === 0 ? (
        <p>
          {w.confirmed} · {s.activation}
        </p>
      ) : (
        <>
          <p>
            {w.paymentExpiry}:{" "}
            {new Date(order.expires_at).toLocaleString(locale === "en" ? "en-US" : "ar")}
          </p>
          <p className="whitespace-pre-wrap">
            {paymentInstructions(order.instructions_snapshot, locale)}
          </p>
          <p className="break-all" dir="auto">
            {order.instructions_snapshot.destination}
          </p>
          {order.instructions_snapshot.qr_url && (
            <img src={order.instructions_snapshot.qr_url} alt="QR" className="max-h-48" />
          )}
          <p>{w.receiptNote}</p>
          {order.review_status !== "confirmed" && <ReceiptUpload orderId={order.id} />}
        </>
      )}
      <Link to="/payments" search={{ locale }} className="text-primary underline">
        {w.orders}
      </Link>
    </div>
  ) : (
    <div className="space-y-3">
      {inventoryState === "pending" && (
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
          {inventoryCopy.loading}
        </p>
      )}
      {inventoryState === "error" && (
        <div role="alert" className="space-y-2 text-sm">
          <p>{inventoryCopy.error}</p>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => {
              setInventoryState("pending");
              setInventoryRevision((value) => value + 1);
            }}
          >
            {inventoryCopy.retry}
          </Button>
        </div>
      )}
      <fieldset disabled={disabled || busy} className="space-y-3">
        <label className="block text-sm font-semibold">
          {w.methods}
          <select
            className="mt-1 min-h-11 w-full rounded-lg border bg-background p-2"
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              setQuote(undefined);
            }}
            disabled={disabled || busy}
          >
            <option value="stripe">{stripeCardMethodLabel(locale)}</option>
            {["instapay", "wallet", "bank"].map((code) => {
              const configured = availableMethods.find((m) => m.code === code),
                available = manualMethodAvailable(configured, market === "EG" ? "EGP" : "USD");
              // Bank transfer is deferred until an administrator explicitly
              // configures it for the customer's market.
              if (code === "bank" && !available && method !== "bank") return null;
              return (
                <option value={code} key={code} disabled={!available}>
                  {w[code as "instapay"]}
                  {available ? "" : ` — ${w.unavailable}`}
                </option>
              );
            })}
            <option disabled>{w.paymob}</option>
          </select>
        </label>
        {checkout && method !== "stripe" && quote?.offer_kind !== "complimentary" && (
          <p className="text-sm text-muted-foreground">{w.receiptNote}</p>
        )}
        {oneTime?.kind !== "lifetime_course" && (
          <>
            <label className="block">
              {w.code}
              <input
                className="min-h-11 w-full rounded border bg-background p-2"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setQuote(undefined);
                }}
                maxLength={64}
              />
            </label>
            {(method !== "stripe" || hasOfferCode) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => void runAction(review)}
                disabled={busy || disabled || manualInventoryUnavailable}
              >
                {w.quote}
              </Button>
            )}
            {quote && (
              <p>
                {w.original}: {formatAmount(quote.original_minor, quote.currency, locale)} ·{" "}
                {w.amount}:{" "}
                <strong>{formatAmount(quote.final_minor, quote.currency, locale)}</strong>
              </p>
            )}
            {quote?.phone_required && (
              <OfferPhone
                value={phone}
                onChange={(value) => {
                  setPhone(value);
                  setRequestKey(crypto.randomUUID());
                }}
              />
            )}
            {quote && codedCardUnavailable && (
              <p role="status">{getUiString(locale, "commerce.coupon.cardUnavailable")}</p>
            )}
            {automaticDiscount && (
              <p role="status">{getUiString(locale, "commerce.coupon.automaticBetter")}</p>
            )}
            {!oneTime && method !== "stripe" && (
              <>
                <label className="flex gap-2 items-center min-h-11">
                  <input
                    type="checkbox"
                    checked={renewal}
                    onChange={(e) => setRenewal(e.target.checked)}
                  />
                  {w.renew} · {w.after_expiry}
                </label>
                <p className="text-sm text-muted-foreground">{w.noAutopay}</p>
              </>
            )}
          </>
        )}
        {oneTime?.kind === "lifetime_course" && method !== "stripe" && (
          <Button
            type="button"
            variant="outline"
            onClick={() => void runAction(review)}
            disabled={busy || disabled || manualInventoryUnavailable}
          >
            {w.quote}
          </Button>
        )}
        {oneTime?.kind === "lifetime_course" && quote && (
          <p>
            {w.amount}: {formatAmount(quote.final_minor, quote.currency, locale)}
          </p>
        )}
        <Button
          type="button"
          disabled={disabled || busy || confirmationBlocked}
          onClick={() => void runAction(proceed)}
        >
          {children}
        </Button>
        {method === "stripe" && quote?.offer_kind !== "complimentary" && (
          <StripeCheckoutTrust showLinkHelp />
        )}
      </fieldset>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </div>
  );
  return checkout ? (
    <CheckoutStep
      {...checkout}
      locale={locale}
      open={checkoutOpen}
      onOpenChange={(value) => {
        if (!value) setInventoryState("pending");
        setCheckoutOpen(value);
        checkout.onOpenChange?.(value);
      }}
      busy={busy}
      disabled={busy || disabled}
      trigger={children}
    >
      {paymentContent}
    </CheckoutStep>
  ) : (
    paymentContent
  );
}
