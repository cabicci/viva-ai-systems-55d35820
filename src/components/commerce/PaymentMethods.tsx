import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { useLocale } from "@/lib/locale/locale-context";
import { commerceCommand } from "@/lib/commerce/commerce.functions";
import { commerceCopy, formatAmount } from "@/lib/commerce/copy";
import type { Order, PackageKey, PaymentMethod, Quote } from "@/lib/commerce/contracts";
import { Button } from "@/components/ui/button";
import { ReceiptUpload } from "./ReceiptUpload";

export function PaymentMethods({
  packageKey,
  interval,
  market,
  stripe,
  disabled = false,
  children,
}: {
  packageKey: PackageKey;
  interval: "month" | "year";
  market: "EG" | "INTL";
  stripe: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const { locale } = useLocale(),
    w = commerceCopy(locale);
  const command = useServerFn(commerceCommand);
  const [methods, setMethods] = useState<PaymentMethod[]>([]),
    [method, setMethod] = useState("stripe"),
    [code, setCode] = useState(""),
    [quote, setQuote] = useState<Quote>(),
    [order, setOrder] = useState<Order>(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  const [renewal, setRenewal] = useState(false);
  useEffect(() => {
    setQuote(undefined);
    setOrder(undefined);
    setRequestKey(crypto.randomUUID());
  }, [packageKey, market, interval, code, method, renewal]);
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
    setBusy(true);
    setError("");
    try {
      setQuote(
        (await command({
          data: {
            action: "quote",
            data: { package: packageKey, market, billing_interval: interval, code, renewal },
          },
        })) as unknown as Quote,
      );
    } catch {
      setError(w.error);
    } finally {
      setBusy(false);
    }
  }
  async function proceed() {
    if (method === "stripe") {
      stripe();
      return;
    }
    setBusy(true);
    setError("");
    try {
      setOrder(
        (await command({
          data: {
            action: "create_order",
            data: {
              package: packageKey,
              market,
              billing_interval: interval,
              method,
              code,
              renewal,
              key: requestKey,
            },
          },
        })) as unknown as Order,
      );
    } catch {
      setError(w.error);
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
        <p>
          {w.duration}: {w[interval]}
        </p>
        <p>
          {w.paymentExpiry}:{" "}
          {new Date(order.expires_at).toLocaleString(locale === "en" ? "en-US" : "ar")}
        </p>
        <p className="whitespace-pre-wrap">{order.instructions_snapshot.instructions}</p>
        <p className="break-all" dir="auto">
          {order.instructions_snapshot.destination}
        </p>
        {order.instructions_snapshot.qr_url && (
          <img src={order.instructions_snapshot.qr_url} alt="QR" className="max-h-48" />
        )}
        <p>{w.receiptNote}</p>
        {order.review_status !== "confirmed" && <ReceiptUpload orderId={order.id} />}
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
          <option value="stripe">{w.stripe}</option>
          {["instapay", "wallet", "bank"].map((code) => {
            const configured = methods.find((m) => m.code === code),
              available =
                configured?.enabled &&
                configured.destination &&
                configured.instructions &&
                configured.currencies.includes(market === "EG" ? "EGP" : "USD");
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
      {method !== "stripe" && (
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
          <Button type="button" variant="outline" onClick={() => void review()} disabled={busy}>
            {w.quote}
          </Button>
          {quote && (
            <p>
              {w.original}: {formatAmount(quote.original_minor, quote.currency, locale)} ·{" "}
              {w.amount}: <strong>{formatAmount(quote.final_minor, quote.currency, locale)}</strong>
            </p>
          )}
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
      <Button
        type="button"
        disabled={disabled || busy || (method !== "stripe" && !quote)}
        onClick={() => void proceed()}
      >
        {children}
      </Button>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
