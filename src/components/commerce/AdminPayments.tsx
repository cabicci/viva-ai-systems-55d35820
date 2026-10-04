import { useCommandKey } from "@/lib/commerce/use-command-key";
import { instant, dayInput, moneyToMinor } from "@/lib/commerce/admin-ui";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { commerceCommand } from "@/lib/commerce/commerce.functions";
import type { AdminData, Order, Entitlement } from "@/lib/commerce/contracts";
import { accessState, commerceCopy, formatAmount } from "@/lib/commerce/copy";
import { useLocale } from "@/lib/locale/locale-context";
import { Button } from "@/components/ui/button";
import { ReceiptUpload, ReceiptView } from "./ReceiptUpload";
import { Field, Select, Panel, Check, type RunCommand } from "./AdminShared";
export function AdminPayments({
  data,
  orders,
  access,
  run,
  busy,
}: {
  data: AdminData;
  orders: Order[];
  access: Entitlement[];
  run: RunCommand;
  busy: boolean;
}) {
  const requestKey = useCommandKey();
  const { locale } = useLocale(),
    w = commerceCopy(locale);
  const [selected, setSelected] = useState<string[]>([]),
    [existingPayment, setExistingPayment] = useState(""),
    [amounts, setAmounts] = useState<Record<string, string>>({}),
    [received, setReceived] = useState(""),
    [reference, setReference] = useState(""),
    [date, setDate] = useState(dayInput(0)),
    [verified, setVerified] = useState(false),
    [reuse, setReuse] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [confirmationError, setConfirmationError] = useState("");
  const pending = orders.filter(
    (o) =>
      ["awaiting_receipt", "pending", "more_info"].includes(o.review_status) &&
      new Date(o.expires_at) > new Date(),
  );
  const picked = data.orders.filter((o) => selected.includes(o.id));
  const remaining = (order: Order) =>
    order.final_minor -
    data.allocations
      .filter((a) => a.order_id === order.id)
      .reduce((sum, a) => sum + a.amount_minor, 0);
  const compatible =
    picked.length > 0 &&
    picked.every(
      (o) =>
        o.method === picked[0].method &&
        o.currency === picked[0].currency &&
        (picked.length === 1 || (!!o.group_id && o.group_id === picked[0].group_id)),
    );
  const totals = data.payments.reduce<Record<string, number>>(
    (a, p) => ({ ...a, [p.currency]: (a[p.currency] ?? 0) + p.amount_minor }),
    {},
  );
  const availableBalance = (paymentId: string) => {
    const payment = data.payments.find((p) => p.id === paymentId);
    return (
      (payment?.amount_minor ?? 0) -
      data.allocations
        .filter((a) => a.payment_id === paymentId)
        .reduce((sum, a) => sum + a.amount_minor, 0) -
      data.refunds
        .filter((r) => r.payment_id === paymentId && !r.order_id)
        .reduce((sum, r) => sum + r.amount_minor, 0)
    );
  };
  const selectedPayment = data.payments.find((p) => p.id === existingPayment);
  const sourceCompatible =
    !selectedPayment ||
    picked.every(
      (o) =>
        o.method === selectedPayment.method &&
        o.currency === selectedPayment.currency &&
        (selectedPayment.group_id
          ? o.group_id === selectedPayment.group_id
          : o.user_id === selectedPayment.user_id && !o.group_id),
    );
  const allocationMinor = (o: Order) =>
    amounts[o.id] === undefined ? remaining(o) : moneyToMinor(amounts[o.id]);
  const allocated = picked.reduce((sum, o) => sum + allocationMinor(o), 0);
  const receivedMinor = moneyToMinor(received);
  const balanceAfter =
    (existingPayment ? availableBalance(existingPayment) : receivedMinor) - allocated;
  const validAmounts =
    picked.every(
      (o) =>
        Number.isFinite(allocationMinor(o)) &&
        allocationMinor(o) > 0 &&
        allocationMinor(o) <= remaining(o),
    ) && Number.isFinite(balanceAfter);
  const fullyCovered =
    picked.length > 0 && picked.every((o) => allocationMinor(o) === remaining(o));
  const paymentCurrency = selectedPayment?.currency ?? picked[0]?.currency ?? "EGP";
  return (
    <>
      <Panel title={w.overview}>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <h3>{w.externalRevenue}</h3>
            {Object.entries(totals).map(([currency, amount]) => (
              <p key={currency}>{formatAmount(amount, currency, locale)}</p>
            ))}
          </div>
          <div>
            <h3>{w.refundTotal}</h3>
            {["EGP", "USD"].map((currency) => (
              <p key={currency}>
                {formatAmount(
                  data.refunds
                    .filter(
                      (r) =>
                        data.payments.find((p) => p.id === r.payment_id)?.currency === currency,
                    )
                    .reduce((sum, r) => sum + r.amount_minor, 0),
                  currency,
                  locale,
                )}
              </p>
            ))}
          </div>
          <div>
            {w.complimentaryCount}: {data.grants.length}
          </div>
        </div>
      </Panel>
      <Panel title={w.orders}>
        <p>{w.receiptNote}</p>
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} run={run} busy={busy} />
        ))}
        <h3 className="font-bold">{w.confirm}</h3>
        <p>{w.paymentAmountUnits}</p>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setConfirmation("");
            setConfirmationError("");
            if (!compatible || !sourceCompatible || !verified || !validAmounts || balanceAfter < 0)
              return;
            if (existingPayment) {
              const result = await run("allocate", {
                payment_id: existingPayment,
                key: requestKey({ existingPayment, selected, amounts, reuse }),
                reuse_review: reuse,
                allocations: picked.map((o) => ({
                  order_id: o.id,
                  amount_minor: allocationMinor(o),
                })),
              });
              if (result) {
                setConfirmation(fullyCovered ? w.paymentRecorded : w.partialPaymentRecorded);
                setSelected([]);
                setExistingPayment("");
                setVerified(false);
              } else setConfirmationError(w.error);
              return;
            }
            const result = await run("confirm", {
              key: requestKey({ selected, amounts, received, reference, date, reuse }),
              method: picked[0].method,
              currency: picked[0].currency,
              group_id: picked[0].group_id ?? undefined,
              amount_minor: receivedMinor,
              transaction_reference: reference,
              received_at: instant(date),
              funds_verified: true,
              reuse_review: reuse,
              allocations: picked.map((o) => ({
                order_id: o.id,
                amount_minor: allocationMinor(o),
              })),
            });
            if (result) {
              setConfirmation(fullyCovered ? w.paymentRecorded : w.partialPaymentRecorded);
              setSelected([]);
              setVerified(false);
              setReference("");
              setReceived("");
              setAmounts({});
            } else setConfirmationError(w.error);
          }}
        >
          <Select
            label={w.allocateExisting}
            value={existingPayment}
            onChange={setExistingPayment}
            options={[
              ["", w.received],
              ...data.payments
                .filter((p) => availableBalance(p.id) > 0)
                .map(
                  (p) =>
                    [
                      p.id,
                      `${p.transaction_reference} · ${formatAmount(availableBalance(p.id), p.currency, locale)}`,
                    ] as const,
                ),
            ]}
          />
          <div className="max-h-80 overflow-auto">
            {pending.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center gap-3 border-b py-2">
                <Check
                  label={`${o.reference} · ${o.recipient_email} · ${o.package}`}
                  checked={selected.includes(o.id)}
                  onChange={(yes) =>
                    setSelected((current) =>
                      yes ? [...current, o.id] : current.filter((x) => x !== o.id),
                    )
                  }
                />
                {selected.includes(o.id) && (
                  <Field
                    label={`${w.paymentAllocation} (${o.currency})`}
                    type="number"
                    step="0.01"
                    value={amounts[o.id] ?? (remaining(o) / 100).toFixed(2)}
                    onChange={(x) => setAmounts({ ...amounts, [o.id]: x })}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {!existingPayment && (
              <>
                <Field
                  label={`${w.received} (${paymentCurrency})`}
                  value={received}
                  type="number"
                  step="0.01"
                  onChange={setReceived}
                />
                <Field label={w.transaction} value={reference} onChange={setReference} required />
                <Field label={w.receivedAt} value={date} type="datetime-local" onChange={setDate} />
              </>
            )}
            <Field label={w.reason} value={reuse} onChange={setReuse} />
          </div>
          <p>
            {w.remaining}:{" "}
            {Number.isFinite(balanceAfter)
              ? formatAmount(balanceAfter, paymentCurrency, locale)
              : "—"}
          </p>
          {picked.length > 0 && validAmounts && (
            <p>
              {w.paymentAllocation}: {formatAmount(allocated, paymentCurrency, locale)}
            </p>
          )}
          {picked.length > 0 && validAmounts && !fullyCovered && (
            <p role="status">{w.partialPaymentWarning}</p>
          )}
          <Check label={w.funds} checked={verified} onChange={setVerified} />
          <Button
            type="submit"
            disabled={
              busy ||
              !compatible ||
              !sourceCompatible ||
              !verified ||
              !validAmounts ||
              allocated <= 0 ||
              balanceAfter < 0 ||
              (!existingPayment && receivedMinor <= 0)
            }
          >
            {existingPayment ? w.allocateExisting : w.confirm}
          </Button>
          {confirmation && <p role="status">{confirmation}</p>}
          {confirmationError && (
            <p role="alert" className="text-destructive">
              {confirmationError}
            </p>
          )}
        </form>
      </Panel>
      <Panel title={w.access}>
        {access.map((row) => (
          <Access key={row.id} row={row} run={run} busy={busy} />
        ))}
      </Panel>
      <Refund data={data} run={run} busy={busy} />
    </>
  );
}
function OrderCard({ order: o, run, busy }: { order: Order; run: RunCommand; busy: boolean }) {
  const requestKey = useCommandKey();
  const { locale } = useLocale(),
    w = commerceCopy(locale),
    [reason, setReason] = useState(""),
    [mailNotice, setMailNotice] = useState(""),
    command = useServerFn(commerceCommand);
  const detail = useQuery({
    queryKey: ["commerce-admin-order", o.id, o.review_status],
    queryFn: async () =>
      (await command({ data: { action: "order", data: { id: o.id } } })) as unknown as Order,
  });
  const closed =
    ["confirmed", "refunded", "expired", "cancelled"].includes(o.review_status) ||
    new Date(o.expires_at) <= new Date();
  return (
    <article className="space-y-3 rounded-lg border p-3">
      <div className="flex flex-wrap justify-between gap-3">
        <strong>
          <bdi>{o.reference}</bdi>
        </strong>
        <span>
          {o.method === "admin" && o.review_status === "confirmed"
            ? w.complimentary
            : (w[o.review_status as "pending"] ?? o.review_status)}
        </span>
      </div>
      <p>
        {o.recipient_email} · {o.package} · {formatAmount(o.final_minor, o.currency, locale)} ·{" "}
        {o.method}
      </p>
      <p>
        {w.paymentExpiry}: {o.expires_at.slice(0, 16)} · {o.review_reason}
      </p>
      <div className="flex flex-wrap gap-2">
        {detail.data?.receipts?.map((r) => (
          <div key={r.id}>
            {r.suspected_reuse && (
              <strong className="text-destructive">
                {w.reason}: {w.receipt} ⚠
              </strong>
            )}
            <ReceiptView id={r.id} />
          </div>
        ))}
      </div>
      {o.review_status === "confirmed" && (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={async () => {
              setMailNotice("");
              const result = (await run("email_confirmation", { id: o.id })) as
                | { mail_status?: string }
                | undefined;
              setMailNotice(
                result
                  ? result.mail_status === "accepted"
                    ? w.confirmationMailAccepted
                    : w.confirmationMailQueued
                  : w.error,
              );
            }}
          >
            {w.sendConfirmationMail}
          </Button>
          {mailNotice && <p role="status">{mailNotice}</p>}
        </div>
      )}
      {closed && ["confirmed", "refunded"].includes(o.review_status) && (
        <ReceiptUpload orderId={o.id} onUploaded={() => void detail.refetch()} />
      )}
      {!closed && (
        <>
          <ReceiptUpload orderId={o.id} onUploaded={() => void detail.refetch()} />
          <Field label={w.reason} value={reason} onChange={setReason} />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={busy || !reason.trim()}
              onClick={() => void run("review", { id: o.id, status: "rejected", reason })}
            >
              {w.reject}
            </Button>
            <Button
              variant="outline"
              disabled={busy || !reason.trim()}
              onClick={() => void run("review", { id: o.id, status: "more_info", reason })}
            >
              {w.moreInfo}
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void run("cancel_order", { id: o.id })}
            >
              {w.cancel}
            </Button>
          </div>
        </>
      )}
    </article>
  );
}
function Access({ row, run, busy }: { row: Entitlement; run: RunCommand; busy: boolean }) {
  const requestKey = useCommandKey();
  const { locale } = useLocale(),
    w = commerceCopy(locale),
    [reason, setReason] = useState(""),
    [days, setDays] = useState(30);
  return (
    <article className="space-y-2 border-b py-3">
      <p>
        <bdi>{row.user_id}</bdi> · {row.package} · {w[accessState(row)]} ·{" "}
        {row.starts_at.slice(0, 10)} — {row.ends_at.slice(0, 10)}
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <Field label={w.reason} value={reason} onChange={setReason} />
        {row.grant_id && (
          <Field label={w.days} value={days} type="number" onChange={(x) => setDays(Number(x))} />
        )}
        <Button
          variant="outline"
          disabled={busy || !reason || !!row.revoked_at}
          onClick={() =>
            void run("manage_access", {
              id: row.id,
              operation: "revoke",
              reason,
              key: requestKey({ id: row.id, reason, days }),
            })
          }
        >
          {w.revoke}
        </Button>
        {row.grant_id && (
          <Button
            disabled={busy || !reason || !!row.revoked_at}
            onClick={() =>
              void run("manage_access", {
                id: row.id,
                operation: "extend",
                duration_days: days,
                reason,
                key: requestKey({ id: row.id, reason, days }),
              })
            }
          >
            {w.extend}
          </Button>
        )}
      </div>
    </article>
  );
}
function Refund({ data, run, busy }: { data: AdminData; run: RunCommand; busy: boolean }) {
  const requestKey = useCommandKey();
  const { locale } = useLocale(),
    w = commerceCopy(locale),
    [allocation, setAllocation] = useState(""),
    [amount, setAmount] = useState(""),
    [reference, setReference] = useState(""),
    [reason, setReason] = useState(""),
    [verified, setVerified] = useState(false),
    [revoke, setRevoke] = useState(false);
  const amountMinor = moneyToMinor(amount);
  const currency = data.payments.find((p) => p.id === allocation.split(":")[0])?.currency ?? "EGP";
  return (
    <Panel title={w.refund}>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!Number.isFinite(amountMinor) || amountMinor <= 0) return;
          const [payment_id, order_id] = allocation.split(":");
          void run("refund", {
            payment_id,
            order_id: order_id === "unallocated" ? undefined : order_id,
            amount_minor: amountMinor,
            reference,
            reason,
            funds_verified: true,
            revoke_access: order_id === "unallocated" ? false : revoke,
            key: requestKey({ allocation, amount, reference, reason, revoke }),
          });
        }}
      >
        <Select
          label={w.payments}
          value={allocation}
          onChange={setAllocation}
          options={[
            ["", w.select],
            ...data.allocations.map(
              (a) =>
                [
                  `${a.payment_id}:${a.order_id}`,
                  `${data.orders.find((o) => o.id === a.order_id)?.reference ?? a.order_id} · ${a.amount_minor}`,
                ] as const,
            ),
          ]}
        />
        <Field
          label={`${w.amount} (${currency})`}
          value={amount}
          type="number"
          step="0.01"
          onChange={setAmount}
        />
        <Field label={w.transaction} value={reference} onChange={setReference} required />
        <Field label={w.reason} value={reason} onChange={setReason} required />
        <Check label={w.funds} checked={verified} onChange={setVerified} />
        <Check label={w.refundAccess} checked={revoke} onChange={setRevoke} />
        <Button
          type="submit"
          disabled={
            busy || !allocation || !verified || !Number.isFinite(amountMinor) || amountMinor <= 0
          }
        >
          {w.refund}
        </Button>
      </form>
    </Panel>
  );
}
