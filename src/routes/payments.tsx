import { useCommandKey } from "@/lib/commerce/use-command-key";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { commerceCommand } from "@/lib/commerce/commerce.functions";
import { commerceCopy, formatAmount, accessState } from "@/lib/commerce/copy";
import type { Order, Entitlement, PackageKey, Quote } from "@/lib/commerce/contracts";
import { requireAuthBeforeLoad, AuthSessionGate } from "@/lib/auth-route-guard";
import { useLocale } from "@/lib/locale/locale-context";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { ReceiptUpload, ReceiptView } from "@/components/commerce/ReceiptUpload";
export const Route = createFileRoute("/payments")({
  beforeLoad: requireAuthBeforeLoad,
  component: () => (
    <AuthSessionGate>
      <Payments />
    </AuthSessionGate>
  ),
});
function Payments() {
  const requestKey = useCommandKey();
  const { locale } = useLocale(),
    w = commerceCopy(locale),
    { user } = useAuth(),
    command = useServerFn(commerceCommand),
    qc = useQueryClient();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [code, setCode] = useState(""),
    [pack, setPack] = useState<PackageKey>("pro"),
    [quote, setQuote] = useState<Quote>();
  const rows = useQuery({
    queryKey: ["commerce-my", user?.id],
    queryFn: async () =>
      (await command({ data: { action: "my_list", data: {} } })) as unknown as {
        orders: Order[];
        entitlements: Entitlement[];
      },
    enabled: !!user,
  });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["commerce-my", user?.id] });
    void qc.invalidateQueries({ queryKey: ["user-subscription"] });
  };
  async function run(action: string, data: unknown) {
    setBusy(true);
    setError("");
    try {
      const r = await command({ data: { action, data } });
      refresh();
      return r;
    } catch {
      setError(w.error);
    } finally {
      setBusy(false);
    }
  }
  async function reviewCode() {
    const q = await run("quote", {
      package: pack,
      market: locale === "ar-EG" ? "EG" : "INTL",
      billing_interval: "month",
      code,
    });
    if (q) setQuote(q as unknown as Quote);
  }
  return (
    <div className="min-h-dvh bg-background">
      <Sidebar />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <h1 className="text-2xl font-bold">{w.orders}</h1>
        <div className="flex gap-3">
          <Button onClick={refresh}>{w.refresh}</Button>
          <Link to="/pricing" search={{ locale }} className="text-primary underline">
            {w.package}
          </Link>
        </div>
        {(error || rows.error) && (
          <p role="alert" className="text-destructive">
            {error || w.disabled}
          </p>
        )}
        <section className="rounded-xl border p-4 space-y-3">
          <h2 className="font-bold">{w.code}</h2>
          <label>
            {w.package}
            <select
              className="ms-2 min-h-11 rounded border bg-background"
              value={pack}
              onChange={(e) => {
                setPack(e.target.value as PackageKey);
                setQuote(undefined);
              }}
            >
              <option value="pro">Pro</option>
              <option value="pro_plus">Pro Plus</option>
              <option value="kids">Kids</option>
            </select>
          </label>
          <label className="block">
            {w.code}
            <input
              className="min-h-11 rounded border bg-background p-2"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setQuote(undefined);
              }}
            />
          </label>
          <Button variant="outline" disabled={busy || !code} onClick={() => void reviewCode()}>
            {w.quote}
          </Button>
          {quote?.offer_kind === "complimentary" && (
            <>
              <p>
                {w.complimentary} · {quote.offer_duration_days} {w.days}
              </p>
              <Button
                disabled={busy}
                onClick={() =>
                  void run("create_order", {
                    package: pack,
                    market: locale === "ar-EG" ? "EG" : "INTL",
                    billing_interval: "month",
                    method: "admin",
                    code,
                    key: requestKey({ pack, code, locale }),
                  })
                }
              >
                {w.accept}
              </Button>
            </>
          )}
          {quote && quote.offer_kind !== "complimentary" && (
            <p>
              {w.amount}: {formatAmount(quote.final_minor, quote.currency, locale)} ·{" "}
              <Link to="/pricing" search={{ locale }} className="underline">
                {w.continue}
              </Link>
            </p>
          )}
          {pack === "kids" && (
            <Link to="/kids/family" search={{ locale }} className="block text-primary underline">
              {w.kids}
            </Link>
          )}
        </section>
        <MailPreferences />
        <section>
          <h2 className="text-xl font-bold">{w.access}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {rows.data?.entitlements.map((e) => (
              <article key={e.id} className="rounded-xl border p-4">
                <strong>{e.package}</strong>
                <p>{w[accessState(e)]}</p>
                <p>
                  {new Date(e.starts_at).toLocaleDateString()} —{" "}
                  {new Date(e.ends_at).toLocaleDateString()}
                </p>
              </article>
            ))}
          </div>
        </section>
        <section className="space-y-4">
          {rows.data?.orders.map((o) => (
            <article key={o.id} className="rounded-xl border p-4 space-y-3">
              <h2 className="font-bold">
                <bdi>{o.reference}</bdi> · {o.package}
              </h2>
              <p>
                {formatAmount(o.final_minor, o.currency, locale)} ·{" "}
                {o.method === "admin" && o.review_status === "confirmed"
                  ? w.complimentary
                  : (w[o.review_status as "pending"] ?? o.review_status)}
              </p>
              <p>{o.review_reason}</p>
              {o.review_status === "confirmed" && !o.entitlement && (
                <p>
                  {w.paidWait}
                  {o.package === "kids" && (
                    <Link to="/kids/family" search={{ locale }} className="block underline">
                      {w.kids}
                    </Link>
                  )}
                </p>
              )}
              {["awaiting_receipt", "pending", "more_info", "rejected"].includes(
                o.review_status,
              ) && (
                <>
                  <p className="whitespace-pre-wrap">{o.instructions_snapshot.instructions}</p>
                  <bdi className="break-all">{o.instructions_snapshot.destination}</bdi>
                  <ReceiptUpload orderId={o.id} onUploaded={refresh} />
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => void run("cancel_order", { id: o.id })}
                  >
                    {w.cancel}
                  </Button>
                </>
              )}
              <OrderReceipts id={o.id} />
              {o.review_status === "confirmed" && (
                <p>
                  {w.noAutopay}{" "}
                  <Link to="/pricing" search={{ locale }} className="underline">
                    {w.renew}
                  </Link>
                </p>
              )}
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
function OrderReceipts({ id }: { id: string }) {
  const command = useServerFn(commerceCommand),
    { user } = useAuth();
  const result = useQuery({
    queryKey: ["commerce-order", user?.id, id],
    queryFn: async () =>
      (await command({ data: { action: "order", data: { id } } })) as unknown as Order,
    enabled: !!user,
  });
  return (
    <div className="flex gap-2">
      {result.data?.receipts?.map((r) => (
        <ReceiptView key={r.id} id={r.id} />
      ))}
    </div>
  );
}

function MailPreferences() {
  const { locale } = useLocale(),
    w = commerceCopy(locale),
    command = useServerFn(commerceCommand);
  const row = useQuery({
    queryKey: ["commerce-self-mail-preferences"],
    queryFn: async () =>
      (await command({ data: { action: "my_mail_preferences", data: {} } })) as {
        marketing_opt_out: boolean;
      },
  });
  return (
    <label className="flex gap-2 min-h-11 items-center">
      <input
        type="checkbox"
        checked={row.data?.marketing_opt_out ?? false}
        disabled={!row.data}
        onChange={async (e) => {
          await command({
            data: { action: "my_mail_preferences", data: { marketing_opt_out: e.target.checked } },
          });
          await row.refetch();
        }}
      />
      {w.optOut}
    </label>
  );
}
