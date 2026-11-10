import { useCommandKey } from "@/lib/commerce/use-command-key";
import { instant, dayInput, moneyToMinor } from "@/lib/commerce/admin-ui";
import { useState, useRef } from "react";
import {
  adminPaymentsPresentation,
  type AdminPaymentTask,
} from "@/lib/commerce/admin-payments-presentation";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { commerceCommand } from "@/lib/commerce/commerce.functions";
import type { AdminData, Order, Entitlement } from "@/lib/commerce/contracts";
import { accessState, commerceCopy, formatAmount, commerceProductLabel } from "@/lib/commerce/copy";
import { useLocale } from "@/lib/locale/locale-context";
import { Button } from "@/components/ui/button";
import { ReceiptUpload, ReceiptView } from "./ReceiptUpload";
import { Field, Select, Panel, Check, type RunCommand } from "./AdminShared";

export function AdminPayments({
  actorId,
  initialOrderId,
  data,
  orders,
  access,
  run: commandRun,
  busy: parentBusy,
}: {
  actorId?: string;
  initialOrderId?: string;
  data: AdminData;
  orders: Order[];
  access: Entitlement[];
  run: RunCommand;
  busy: boolean;
}) {
  const requestKey = useCommandKey();
  const { locale } = useLocale(),
    w = commerceCopy(locale),
    p = adminPaymentsPresentation(locale);
  const [task, setTask] = useState<AdminPaymentTask>("review");
  const [saving, setSaving] = useState(false);
  const actionLock = useRef(false);
  const busy = parentBusy || saving;
  // Presentation lock only: command names, payloads and request keys stay unchanged.
  const run: RunCommand = async (action, payload) => {
    if (parentBusy || actionLock.current) return;
    actionLock.current = true;
    setSaving(true);
    try {
      return await commandRun(action, payload);
    } catch {
      return undefined;
    } finally {
      actionLock.current = false;
      setSaving(false);
    }
  };
  const [selected, setSelected] = useState<string[]>(
      initialOrderId &&
        orders.some(
          (o) =>
            o.id === initialOrderId &&
            ["awaiting_receipt", "pending", "more_info"].includes(o.review_status) &&
            new Date(o.expires_at) > new Date(),
        )
        ? [initialOrderId]
        : [],
    ),
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
    <div
      className="min-w-0 space-y-4 break-words [&_select]:min-w-0 [&_select]:w-full [&_select]:max-w-full"
      style={{ overflowWrap: "anywhere" }}
      dir={locale === "en" ? "ltr" : "rtl"}
      aria-busy={busy}
    >
      <Panel title={p.overview}>
        <p className="text-sm text-muted-foreground">{p.overviewHint}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <h3>{w.externalRevenue}</h3>
            {!data.payments.length && <p className="text-sm">{p.noPayments}</p>}
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
      <nav aria-label={p.tasks} className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {(["review", "record", "access", "refund"] as const).map((view) => (
          <Button
            key={view}
            className="h-auto min-h-11 min-w-0 whitespace-normal px-2 text-center"
            type="button"
            disabled={busy}
            aria-pressed={task === view}
            variant={task === view ? "secondary" : "outline"}
            onClick={() => setTask(view)}
          >
            <span className={task === view ? "font-bold underline underline-offset-4" : undefined}>
              {p[view]}
            </span>
          </Button>
        ))}
      </nav>
      {initialOrderId && (
        <p className="text-sm">
          {p.targetOrder}: <bdi>{initialOrderId}</bdi>
          {!orders.some((o) => o.id === initialOrderId) && (
            <span className="block">{p.targetNotVisible}</span>
          )}
        </p>
      )}
      {busy && <p role="status">{p.saving}</p>}
      {/* Keep drafts and request-key caches mounted when switching tasks. */}
      <fieldset disabled={busy} className="min-w-0 space-y-4">
        <section hidden={task !== "review"} aria-label={p.review}>
          <Panel title={p.review}>
            <p>{p.reviewHint}</p>
            <p className="text-sm">{w.receiptNote}</p>
            {!orders.length && <p role="status">{p.noOrders}</p>}
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                actorId={actorId}
                showReceipts={task === "review"}
                run={run}
                busy={busy}
              />
            ))}
          </Panel>
        </section>
        <section hidden={task !== "record"} aria-label={p.record}>
          <Panel title={p.record}>
            <p>{p.recordHint}</p>
            <p>{w.paymentAmountUnits}</p>
            <section aria-label={p.selection} className="space-y-2 rounded-lg border p-3">
              <h3 className="font-semibold">
                {p.selection} ({picked.length})
              </h3>
              {!picked.length && <p>{p.noSelection}</p>}
              {picked.map((o) => (
                <p key={o.id}>
                  <bdi>{o.reference}</bdi> · <bdi>{o.recipient_email}</bdi> ·{" "}
                  {commerceProductLabel(o.package, locale)} ·{" "}
                  {formatAmount(remaining(o), o.currency, locale)} ·{" "}
                  {w[o.method as "bank"] ?? o.method}
                </p>
              ))}
              {picked.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setSelected([]);
                    setVerified(false);
                  }}
                >
                  {p.clearSelection}
                </Button>
              )}
              <p>
                {p.source}: <bdi>{selectedPayment?.transaction_reference ?? p.newFunds}</bdi>
              </p>
              {selectedPayment && (
                <p>
                  {p.available}:{" "}
                  {formatAmount(
                    availableBalance(selectedPayment.id),
                    selectedPayment.currency,
                    locale,
                  )}
                </p>
              )}
            </section>
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setConfirmation("");
                setConfirmationError("");
                if (
                  busy ||
                  !compatible ||
                  !sourceCompatible ||
                  !verified ||
                  !validAmounts ||
                  balanceAfter < 0
                )
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
                  } else setConfirmationError(p.savedInputs);
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
                } else setConfirmationError(p.savedInputs);
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
              {!pending.length && <p role="status">{p.noEligible}</p>}
              <div className="max-h-80 overflow-auto">
                {pending.map((o) => (
                  <div
                    key={o.id}
                    className="grid grid-cols-1 items-center gap-3 border-b py-3 sm:grid-cols-2"
                  >
                    <div className="min-w-0 flex-1">
                      <Check
                        label={`${o.reference} · ${o.recipient_email} · ${commerceProductLabel(o.package, locale)}`}
                        checked={selected.includes(o.id)}
                        onChange={(yes) =>
                          setSelected((current) =>
                            yes ? [...current, o.id] : current.filter((x) => x !== o.id),
                          )
                        }
                      />
                    </div>
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
                    <Field
                      label={w.transaction}
                      value={reference}
                      onChange={setReference}
                      required
                    />
                    <Field
                      label={w.receivedAt}
                      value={date}
                      type="datetime-local"
                      onChange={setDate}
                    />
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
              {picked.length > 0 && !compatible && <p role="alert">{p.incompatible}</p>}
              {picked.length > 0 && !sourceCompatible && <p role="alert">{p.incompatibleSource}</p>}
              {picked.length > 0 && (!validAmounts || balanceAfter < 0) && (
                <p>{p.invalidAmounts}</p>
              )}
              {picked.length > 0 && !verified && <p>{p.verificationNeeded}</p>}
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
        </section>
        <section hidden={task !== "access"} aria-label={p.access}>
          <Panel title={p.access}>
            <p>{p.accessHint}</p>
            {!access.length && <p role="status">{p.noAccess}</p>}
            {access.map((row) => (
              <Access
                key={row.id}
                row={row}
                run={run}
                busy={busy}
                canExtend={couponExtensionAllowed(row, data)}
              />
            ))}
          </Panel>
        </section>
        <section hidden={task !== "refund"} aria-label={p.refund}>
          <Refund data={data} run={run} busy={busy} />
        </section>
      </fieldset>
    </div>
  );
}
function OrderCard({
  order: o,
  actorId,
  showReceipts,
  run,
  busy,
}: {
  order: Order;
  actorId?: string;
  showReceipts: boolean;
  run: RunCommand;
  busy: boolean;
}) {
  const requestKey = useCommandKey();
  const { locale } = useLocale(),
    w = commerceCopy(locale),
    [reason, setReason] = useState(""),
    [mailNotice, setMailNotice] = useState(""),
    [reviewFeedback, setReviewFeedback] = useState(""),
    [reviewFailed, setReviewFailed] = useState(false),
    command = useServerFn(commerceCommand);
  const detail = useQuery({
    queryKey: ["commerce-admin-order", actorId, o.id, o.review_status],
    enabled: showReceipts,
    queryFn: async () =>
      (await command({ data: { action: "order", data: { id: o.id } } })) as unknown as Order,
  });
  const p = adminPaymentsPresentation(locale);
  async function review(action: string, payload: unknown) {
    setReviewFeedback("");
    const result = await run(action, payload);
    setReviewFailed(!result);
    setReviewFeedback(result ? w.saved : p.savedInputs);
  }
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
        {o.recipient_email} · {commerceProductLabel(o.package, locale)} ·{" "}
        {formatAmount(o.final_minor, o.currency, locale)} · {w[o.method as "bank"] ?? o.method}
      </p>
      <p>
        {w.paymentExpiry}: {o.expires_at.slice(0, 16)} · {o.review_reason}
      </p>
      {detail.isPending && <p role="status">{p.receiptLoading}</p>}
      {detail.error && (
        <div role="alert" className="space-y-2 text-destructive">
          <p>{p.receiptFailed}</p>
          <Button
            type="button"
            variant="outline"
            disabled={busy || detail.isFetching}
            onClick={() => void detail.refetch()}
          >
            {p.retry}
          </Button>
        </div>
      )}
      {!detail.isPending && !detail.error && detail.data && !detail.data.receipts?.length && (
        <p className="text-sm">{p.receiptEmpty}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {!detail.error &&
          detail.data?.receipts?.map((r) => (
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
          {mailNotice && <p role={mailNotice === w.error ? "alert" : "status"}>{mailNotice}</p>}
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
              onClick={() => void review("review", { id: o.id, status: "rejected", reason })}
            >
              {w.reject}
            </Button>
            <Button
              variant="outline"
              disabled={busy || !reason.trim()}
              onClick={() => void review("review", { id: o.id, status: "more_info", reason })}
            >
              {w.moreInfo}
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void review("cancel_order", { id: o.id })}
            >
              {w.cancel}
            </Button>
          </div>
        </>
      )}
      {reviewFeedback && <p role={reviewFailed ? "alert" : "status"}>{reviewFeedback}</p>}
    </article>
  );
}
export function couponExtensionAllowed(
  row: Entitlement,
  data: Pick<AdminData, "grants" | "orders">,
) {
  const grant = data.grants.find((g) => g.id === row.grant_id && g.user_id === row.user_id);
  const orderId = grant && "offer_order_id" in grant ? grant.offer_order_id : undefined;
  return (
    !!orderId &&
    data.orders.some(
      (o) =>
        o.id === orderId &&
        o.user_id === row.user_id &&
        o.final_minor === 0 &&
        "offer_id" in o &&
        typeof o.offer_id === "string" &&
        "confirmed_at" in o &&
        typeof o.confirmed_at === "string",
    )
  );
}
function Access({
  row,
  run,
  busy,
  canExtend,
}: {
  row: Entitlement;
  run: RunCommand;
  busy: boolean;
  canExtend: boolean;
}) {
  const requestKey = useCommandKey();
  const { locale } = useLocale(),
    w = commerceCopy(locale),
    [reason, setReason] = useState(""),
    [days, setDays] = useState(30),
    [feedback, setFeedback] = useState(""),
    [failed, setFailed] = useState(false);
  const p = adminPaymentsPresentation(locale);
  async function manage(payload: unknown) {
    setFeedback("");
    const result = await run("manage_access", payload);
    setFailed(!result);
    setFeedback(result ? w.saved : p.savedInputs);
  }
  return (
    <article className="space-y-2 border-b py-3">
      <p>
        <bdi>{row.user_id}</bdi> · {commerceProductLabel(row.package, locale)} ·{" "}
        {w[accessState(row)]} · {row.starts_at.slice(0, 10)} — {row.ends_at.slice(0, 10)}
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <Field label={w.reason} value={reason} onChange={setReason} />
        {canExtend && (
          <Field label={w.days} value={days} type="number" onChange={(x) => setDays(Number(x))} />
        )}
        <Button
          variant="outline"
          disabled={busy || !reason || !!row.revoked_at}
          onClick={() =>
            void manage({
              id: row.id,
              operation: "revoke",
              reason,
              key: requestKey({ id: row.id, reason, days }),
            })
          }
        >
          {w.revoke}
        </Button>
        {canExtend && (
          <Button
            disabled={busy || !reason || !!row.revoked_at}
            onClick={() =>
              void manage({
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
      {feedback && <p role={failed ? "alert" : "status"}>{feedback}</p>}
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
    [revoke, setRevoke] = useState(false),
    [feedback, setFeedback] = useState(""),
    [failed, setFailed] = useState(false);
  const p = adminPaymentsPresentation(locale);
  const amountMinor = moneyToMinor(amount);
  // Match the existing server ledger: a refund belongs either to one order's
  // allocation or to the payment's unallocated remainder, never both.
  const targets = data.payments.flatMap((payment) => {
    const allocations = data.allocations.filter((a) => a.payment_id === payment.id);
    const refunded = (orderId: string | null) =>
      data.refunds
        .filter((r) => r.payment_id === payment.id && r.order_id === orderId)
        .reduce((sum, r) => sum + r.amount_minor, 0);
    return [
      ...allocations.map((a) => ({
        value: `${payment.id}:${a.order_id}`,
        label: data.orders.find((o) => o.id === a.order_id)?.reference ?? a.order_id,
        remaining: a.amount_minor - refunded(a.order_id),
        payment,
        orderId: a.order_id as string | undefined,
      })),
      {
        value: `${payment.id}:unallocated`,
        label: `${payment.transaction_reference} · ${w.remaining}`,
        remaining:
          payment.amount_minor -
          allocations.reduce((sum, a) => sum + a.amount_minor, 0) -
          refunded(null),
        payment,
        orderId: undefined,
      },
    ].filter((target) => target.remaining > 0);
  });
  const target = targets.find((item) => item.value === allocation);
  const currency = target?.payment.currency ?? "EGP";
  const revokeAccess = !!target?.orderId && revoke;
  const canSubmit =
    !busy &&
    !!target &&
    verified &&
    Number.isFinite(amountMinor) &&
    amountMinor > 0 &&
    amountMinor <= target.remaining &&
    reference.length >= 3 &&
    !!reason.trim();
  return (
    <Panel title={p.refund}>
      <p>{p.refundHint}</p>
      {!targets.length && <p role="status">{p.noRefunds}</p>}
      {target && (
        <section aria-label={p.refundTarget} className="space-y-1 rounded-lg border p-3">
          <h3 className="font-semibold">{p.refundTarget}</h3>
          <p>
            <bdi>{target.payment.transaction_reference}</bdi> ·{" "}
            {target.orderId ? p.orderAllocation : p.unallocated}
          </p>
          <p>
            <bdi>{target.label}</bdi> · {formatAmount(target.remaining, currency, locale)}
          </p>
        </section>
      )}
      <form
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!canSubmit || !target) return;
          setFeedback("");
          const result = await run("refund", {
            payment_id: target.payment.id,
            order_id: target.orderId,
            amount_minor: amountMinor,
            reference,
            reason,
            funds_verified: true,
            revoke_access: revokeAccess,
            key: requestKey({ allocation, amount, reference, reason, revoke: revokeAccess }),
          });
          setFailed(!result);
          setFeedback(result ? w.saved : p.savedInputs);
        }}
      >
        <Select
          label={w.payments}
          value={allocation}
          onChange={(value) => {
            setAllocation(value);
            setRevoke(false);
            setVerified(false);
          }}
          options={[
            ["", w.select],
            ...targets.map(
              (item) =>
                [
                  item.value,
                  `${item.label} · ${formatAmount(item.remaining, item.payment.currency, locale)}`,
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
        {target?.orderId && <Check label={w.refundAccess} checked={revoke} onChange={setRevoke} />}
        <Button type="submit" disabled={!canSubmit}>
          {w.refund}
        </Button>
        {feedback && (
          <p role={failed ? "alert" : "status"} className="sm:col-span-2">
            {feedback}
          </p>
        )}
      </form>
    </Panel>
  );
}
