import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { commerceCommand, dispatchCommerceInvitations } from "@/lib/commerce/commerce.functions";
import { useLocale } from "@/lib/locale/locale-context";
import { SUPPORTED_LOCALES, LOCALE_META } from "@/lib/locale/types";
import { commerceCopy, formatAmount } from "@/lib/commerce/copy";
import { adminOfferCopy, offerError } from "@/lib/commerce/admin-offer-copy";
import { simpleOfferSchema, type SimpleOfferInput } from "@/lib/commerce/offer-input";
import { dayInput, instant } from "@/lib/commerce/admin-ui";
import type { AdminData, Offer, PackageKey } from "@/lib/commerce/contracts";
import { Button } from "@/components/ui/button";
import { Field, Select, Panel, type RunCommand } from "./AdminShared";

type Price = {
  package: PackageKey;
  market: "EG" | "INTL";
  billing_interval: "month" | "year";
  original_minor: number;
  currency: string;
};
const packageName = {
  pro: "Pro",
  pro_plus: "Pro Plus",
  kids: "Masaarat Kids",
  technical: "Masaarat TECH",
};
const makeCode = () => `MAS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
export function AdminOffers({
  data,
  run,
  busy,
}: {
  data: AdminData;
  run: RunCommand;
  busy: boolean;
}) {
  const { locale } = useLocale(),
    w = commerceCopy(locale),
    s = adminOfferCopy(locale);
  const command = useServerFn(commerceCommand),
    dispatch = useServerFn(dispatchCommerceInvitations);
  const [audience, setAudience] = useState<SimpleOfferInput["audience"]>("individual");
  const [emails, setEmails] = useState(""),
    [groupName, setGroupName] = useState("");
  const [market, setMarket] = useState<"EG" | "INTL">("EG"),
    [plan, setPlan] = useState("pro:month"),
    [percent, setPercent] = useState("100");
  const [delivery, setDelivery] = useState<"coupon" | "invitation">("coupon"),
    [code, setCode] = useState(makeCode);
  const [mailLocale, setMailLocale] = useState(locale),
    [mode, setMode] = useState<"time" | "count">("time");
  const [until, setUntil] = useState(() => dayInput(15)),
    [limit, setLimit] = useState("100");
  const [review, setReview] = useState<SimpleOfferInput>(),
    [created, setCreated] = useState<Offer>();
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [sending, setSending] = useState(false);
  const sendLock = useRef(false),
    saveLock = useRef(false);
  const catalogue = useQuery({
    queryKey: ["commerce-offer-catalogue"],
    queryFn: async () =>
      (await command({ data: { action: "offer_catalogue", data: {} } })) as unknown as Price[],
  });
  const price = catalogue.data?.find(
    (p) => p.market === market && `${p.package}:${p.billing_interval}` === plan,
  );
  const final = price
    ? price.original_minor - Math.floor((price.original_minor * Number(percent)) / 100)
    : 0;
  const offers =
    created && !data.offers.some((o) => o.id === created.id)
      ? [created, ...data.offers]
      : data.offers;
  function prepare(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!price) return;
    try {
      setReview(
        simpleOfferSchema.parse({
          key: crypto.randomUUID(),
          audience,
          emails:
            audience === "public"
              ? []
              : [
                  ...new Set(
                    emails
                      .split(/[\s,;]+/)
                      .filter(Boolean)
                      .map((e) => e.toLowerCase()),
                  ),
                ],
          group_name: groupName,
          package: price.package,
          market,
          billing_interval: price.billing_interval,
          percent: Number(percent),
          delivery: audience === "public" ? "coupon" : delivery,
          code,
          locale: mailLocale,
          limit_mode: mode,
          valid_until: audience === "public" && mode === "time" ? instant(until) : null,
          max_redemptions: audience === "public" && mode === "count" ? Number(limit) : null,
          expected_price_minor: price.original_minor,
        }),
      );
    } catch {
      setError(s.validation);
    }
  }
  async function save() {
    if (!review || saveLock.current) return;
    saveLock.current = true;
    try {
      const r = await run("simple_offer", review);
      if (r) {
        setCreated(r as Offer);
        setReview(undefined);
        setMessage("");
      }
    } finally {
      saveLock.current = false;
    }
  }
  async function send(offer: Offer) {
    if (sendLock.current) return;
    sendLock.current = true;
    setSending(true);
    setError("");
    setMessage("");
    try {
      const queued = (await run("send_offer_invitations", { id: offer.id })) as
        { group_id: string } | undefined;
      if (!queued) return;
      setMessage(s.queued);
      const result = await dispatch({ data: { groupId: queued.group_id } });
      setMessage(`${s.sent}: ${result.accepted}. ${s.nextBatch}`);
    } catch (err) {
      setError(offerError(err, locale, s.queued));
    } finally {
      setSending(false);
      sendLock.current = false;
    }
  }
  function summary(p: SimpleOfferInput) {
    return (
      <dl className="grid gap-3 rounded-lg bg-muted/40 p-4 sm:grid-cols-2">
        <div>
          <dt>{s.audience}</dt>
          <dd className="break-words">
            {s[p.audience]}
            {p.emails.length > 0 && ` (${p.emails.length})`}
            <div className="max-h-36 overflow-auto" dir="ltr">
              {p.emails.join(" · ")}
            </div>
          </dd>
        </div>
        <div>
          <dt>{s.plan}</dt>
          <dd>
            {packageName[p.package]} · {w[p.billing_interval]} ·{" "}
            {p.market === "EG" ? s.egypt : s.international}
          </dd>
        </div>
        <div>
          <dt>{s.percent}</dt>
          <dd>{p.percent}%</dd>
        </div>
        <div>
          <dt>{s.after}</dt>
          <dd>
            {p.percent === 100
              ? s.free
              : formatAmount(
                  p.expected_price_minor - Math.floor((p.expected_price_minor * p.percent) / 100),
                  p.market === "EG" ? "EGP" : "USD",
                  locale,
                )}
          </dd>
        </div>
        <div>
          <dt>{s.deliveryStep}</dt>
          <dd>
            {s[p.delivery]} {p.delivery === "coupon" && <bdi>{p.code}</bdi>}
          </dd>
        </div>
        <div>
          <dt>{s.limitMode}</dt>
          <dd>
            {p.audience !== "public"
              ? s.expiryNote
              : p.limit_mode === "count"
                ? `${p.max_redemptions} · ${s.noExpiry}`
                : `${new Date(p.valid_until!).toLocaleString(locale === "en" ? "en-US" : "ar")} · ${s.unlimited}`}
          </dd>
        </div>
      </dl>
    );
  }
  return (
    <div className="space-y-6">
      <Panel title={s.title}>
        <p>{s.intro}</p>
        {created ? (
          <div className="space-y-4" role="status">
            <h3 className="text-lg font-bold">{s.created}</h3>
            {created.delivery_mode === "invitation" ? (
              <>
                <p>{s.sendHint}</p>
                <Button disabled={busy || sending} onClick={() => void send(created)}>
                  {s.send}
                </Button>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold" dir="ltr">
                  {created.code}
                </p>
                <p>{s.couponHint}</p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(created.code);
                        setMessage(s.copied);
                      } catch {
                        setMessage(s.copyFailed);
                      }
                    }}
                  >
                    {s.copy}
                  </Button>
                  <Link
                    to="/payments"
                    search={{ locale }}
                    className="self-center text-primary underline"
                  >
                    {s.paymentPage}
                  </Link>
                </div>
              </>
            )}
            <Button
              variant="outline"
              disabled={sending}
              onClick={() => {
                setCreated(undefined);
                setCode(makeCode());
                setMessage("");
                setError("");
              }}
            >
              {s.another}
            </Button>
          </div>
        ) : review ? (
          <div className="space-y-4">
            <h3 className="font-bold">{s.reviewTitle}</h3>
            {summary(review)}
            <p>{s.activation}</p>
            <p>{s.once}</p>
            <div className="flex flex-wrap gap-3">
              <Button disabled={busy} onClick={() => void save()}>
                {s.confirm}
              </Button>
              <Button variant="outline" disabled={busy} onClick={() => setReview(undefined)}>
                {s.edit}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={prepare} className="space-y-6">
            <fieldset className="space-y-3">
              <legend className="font-semibold">{s.audience}</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {(["individual", "group", "public"] as const).map((value) => (
                  <label
                    key={value}
                    className={`flex min-h-14 cursor-pointer items-center gap-2 rounded-lg border p-3 ${audience === value ? "border-primary bg-primary/5" : ""}`}
                  >
                    <input
                      type="radio"
                      name="audience"
                      checked={audience === value}
                      onChange={() => setAudience(value)}
                    />
                    {s[value]}
                  </label>
                ))}
              </div>
              {audience !== "public" && (
                <>
                  <label className="grid gap-1">
                    {s.emails}
                    <textarea
                      className="min-h-24 w-full rounded border bg-background p-3"
                      dir="ltr"
                      value={emails}
                      onChange={(e) => setEmails(e.target.value)}
                      required
                    />
                  </label>
                  <p className="text-sm text-muted-foreground">{s.emailHint}</p>
                  {audience === "group" && (
                    <Field label={s.groupName} value={groupName} onChange={setGroupName} />
                  )}
                </>
              )}
            </fieldset>
            <fieldset className="space-y-3">
              <legend className="font-semibold">{s.packageStep}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  label={s.market}
                  value={market}
                  onChange={(v) => setMarket(v as "EG" | "INTL")}
                  options={[
                    ["EG", s.egypt],
                    ["INTL", s.international],
                  ]}
                />
                <Select
                  label={s.plan}
                  value={plan}
                  onChange={setPlan}
                  options={(catalogue.data ?? [])
                    .filter((p) => p.market === market)
                    .map((p) => [
                      `${p.package}:${p.billing_interval}`,
                      `${packageName[p.package]} · ${w[p.billing_interval]} — ${formatAmount(p.original_minor, p.currency, locale)}`,
                    ])}
                />
                <Field
                  label={s.percent}
                  type="number"
                  value={percent}
                  onChange={setPercent}
                  required
                />
              </div>
              {catalogue.isPending && <p>{w.pending}</p>}
              {catalogue.error && <p role="alert">{w.error}</p>}
              {price && (
                <p className="rounded-lg bg-primary/5 p-3 text-lg">
                  {s.after}:{" "}
                  <strong>
                    {Number(percent) === 100 ? s.free : formatAmount(final, price.currency, locale)}
                  </strong>
                </p>
              )}
              <p className="text-sm text-muted-foreground">{s.activation}</p>
            </fieldset>
            <fieldset className="space-y-3">
              <legend className="font-semibold">{s.deliveryStep}</legend>
              {audience !== "public" && (
                <Select
                  label={w.kind}
                  value={delivery}
                  onChange={(v) => setDelivery(v as "coupon" | "invitation")}
                  options={[
                    ["coupon", s.coupon],
                    ["invitation", s.invitation],
                  ]}
                />
              )}
              {audience === "public" || delivery === "coupon" ? (
                <>
                  <Field
                    label={s.code}
                    value={code}
                    onChange={(v) => setCode(v.toUpperCase())}
                    required
                  />
                  <p className="text-sm text-muted-foreground">{s.codeHint}</p>
                </>
              ) : (
                <Select
                  label={w.locale}
                  value={mailLocale}
                  onChange={(v) => setMailLocale(v as typeof locale)}
                  options={SUPPORTED_LOCALES.map((l) => [l, LOCALE_META[l].displayName])}
                />
              )}
              {audience === "public" ? (
                <>
                  <Select
                    label={s.limitMode}
                    value={mode}
                    onChange={(v) => setMode(v as "time" | "count")}
                    options={[
                      ["time", s.time],
                      ["count", s.count],
                    ]}
                  />
                  {mode === "time" ? (
                    <Field
                      label={s.until}
                      type="datetime-local"
                      value={until}
                      onChange={setUntil}
                      required
                    />
                  ) : (
                    <Field
                      label={s.total}
                      type="number"
                      value={limit}
                      onChange={setLimit}
                      required
                    />
                  )}
                </>
              ) : (
                <p>{s.expiryNote}</p>
              )}
              <p className="text-sm text-muted-foreground">{s.once}</p>
            </fieldset>
            <Button type="submit" disabled={busy || !price}>
              {s.review}
            </Button>
          </form>
        )}
        {message && <p role="status">{message}</p>}
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
      </Panel>
      <Panel title={s.existing}>
        {offers.length === 0 ? (
          <p>{s.none}</p>
        ) : (
          offers.map((o) => (
            <article
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0 space-y-1">
                <strong>
                  <bdi>{o.code}</bdi>
                </strong>
                <p>
                  {packageName[o.package]}
                  {o.billing_interval && ` · ${w[o.billing_interval]}`} ·{" "}
                  {o.kind === "percent"
                    ? `${o.value_minor}%`
                    : o.kind === "complimentary"
                      ? s.free
                      : w.fixed}
                </p>
                <p>
                  {o.valid_until
                    ? new Date(o.valid_until).toLocaleString(locale === "en" ? "en-US" : "ar")
                    : s.noExpiry}{" "}
                  · {o.max_redemptions ?? s.unlimited}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {o.delivery_mode === "invitation" && (
                  <Button disabled={busy || sending || !o.enabled} onClick={() => void send(o)}>
                    {s.send}
                  </Button>
                )}
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => void run("offer_state", { id: o.id, enabled: !o.enabled })}
                >
                  {o.enabled ? w.pause : w.resume}
                </Button>
              </div>
            </article>
          ))
        )}
      </Panel>
    </div>
  );
}
