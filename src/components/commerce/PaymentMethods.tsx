import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { useLocale } from "@/lib/locale/locale-context";
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
import { effectivePaymentMethod, manualMethodAvailable } from "@/lib/commerce/payment-methods";
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
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  const [renewal, setRenewal] = useState(false);
  const method = effectivePaymentMethod(requestedMethod, methods, market === "EG" ? "EGP" : "USD");
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
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);
  useEffect(() => {
    setQuote(undefined);
    setOrder(undefined);
    setRequestKey(crypto.randomUUID());
  }, [packageKey, market, interval, code, method, renewal, academicAssistant, oneTimeKey]);
  useEffect(() => {
    let live = true;
    command({ data: { action: "methods", data: {} } })
      .then((result) => {
        if (live) setMethods(result as unknown as PaymentMethod[]);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [command]);
  async function review() {
    const captured = selection;
    setBusy(true);
    setError("");
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
    } finally {
      setBusy(false);
    }
  }
  async function proceed() {
    const free = quote?.offer_kind === "complimentary";
    if (quote?.phone_required && !normalizeOfferPhone(phone)) {
      setError(s.phoneError);
      return;
    }
    if (oneTime && method === "stripe") {
      setBusy(true);
      try {
        await stripe(
          code
            ? {
                code,
                ...(quote?.phone_required
                  ? { phone: normalizeOfferPhone(phone) ?? undefined }
                  : {}),
              }
            : undefined,
        );
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!oneTime && code && method === "stripe" && !free) {
      if (!quote?.live_stripe_available) return;
      setBusy(true);
      setError("");
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
      } finally {
        setBusy(false);
      }
      return;
    }
    if (method === "stripe" && !free) {
      stripe();
      return;
    }
    setBusy(true);
    setError("");
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
    } finally {
      setBusy(false);
    }
  }
  if (order)
    return (
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
    );
  return (
    <div className="space-y-3">
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
            const configured = methods.find((m) => m.code === code),
              available = manualMethodAvailable(configured, market === "EG" ? "EGP" : "USD");
            // Bank transfer is deferred until an administrator explicitly
            // configures it for the customer's market.
            if (code === "bank" && !available) return null;
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
          {(method !== "stripe" || code) && (
            <Button
              type="button"
              variant="outline"
              onClick={() => void review()}
              disabled={busy || disabled}
            >
              {w.quote}
            </Button>
          )}
          {quote && (
            <p>
              {w.original}: {formatAmount(quote.original_minor, quote.currency, locale)} ·{" "}
              {w.amount}: <strong>{formatAmount(quote.final_minor, quote.currency, locale)}</strong>
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
          {!oneTime &&
            code &&
            quote &&
            quote.offer_kind !== "complimentary" &&
            !quote.live_stripe_available &&
            method === "stripe" && (
              <p>
                {w.methods}: {w.instapay} / {w.wallet}
              </p>
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
          onClick={() => void review()}
          disabled={busy || disabled}
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
        disabled={
          disabled ||
          busy ||
          ((method !== "stripe" || !!code) && !quote) ||
          (!oneTime &&
            !!code &&
            method === "stripe" &&
            quote?.offer_kind !== "complimentary" &&
            !quote?.live_stripe_available) ||
          (!!quote?.phone_required && !normalizeOfferPhone(phone))
        }
        onClick={() => void proceed()}
      >
        {children}
      </Button>
      {method === "stripe" && quote?.offer_kind !== "complimentary" && (
        <StripeCheckoutTrust showLinkHelp />
      )}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
