import { guardPaymentLink, parsePaymentSearch } from "@/lib/commerce/payment-links";
import { download } from "@/lib/commerce/admin-ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { requireAdminBeforeLoad } from "@/lib/admin-route-guard";
import { commerceCommand } from "@/lib/commerce/commerce.functions";
import { commerceCopy, accessState } from "@/lib/commerce/copy";
import type { AdminData } from "@/lib/commerce/contracts";
import { useLocale } from "@/lib/locale/locale-context";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { AdminPayments } from "@/components/commerce/AdminPayments";
import { AdminSettings } from "@/components/commerce/AdminSettings";
import { AdminOffers } from "@/components/commerce/AdminOffers";
import { AdminLiveOffers } from "@/components/commerce/AdminLiveOffers";
import { offerError } from "@/lib/commerce/admin-offer-copy";
import { AdminGroups } from "@/components/commerce/AdminGroups";
import { AdminEmailAccess } from "@/components/commerce/AdminEmailAccess";
import { AdminFreeAccess } from "@/components/commerce/AdminFreeAccess";
import {
  commerceAdminNavigation,
  COMMERCE_PAYMENT_FILTERS,
  type CommerceAdminView,
} from "@/lib/commerce/admin-navigation";
import { Select } from "@/components/commerce/AdminShared";
import { exportCommerce } from "@/lib/commerce/report";
export const Route = createFileRoute("/admin/commerce")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Commerce administration | Masaarat" },
      {
        name: "description",
        content: "Masaarat payment, access and reviewed Live discount administration.",
      },
      { property: "og:title", content: "Commerce administration | Masaarat" },
      {
        property: "og:description",
        content: "Masaarat payment, access and reviewed Live discount administration.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: parsePaymentSearch,
  beforeLoad: ({ search }) => guardPaymentLink(requireAdminBeforeLoad, search.order, "admin"),
  component: CommerceAdminRoute,
});
function CommerceAdminRoute() {
  const { order } = Route.useSearch();
  const { user } = useAuth();
  const { locale } = useLocale();
  if (!user) return <p role="status">{commerceAdminNavigation(locale).loading}</p>;
  return (
    <CommerceAdmin key={JSON.stringify([user.id, order])} actorId={user.id} targetOrderId={order} />
  );
}
function CommerceAdmin({ actorId, targetOrderId }: { actorId: string; targetOrderId?: string }) {
  const { locale } = useLocale(),
    w = commerceCopy(locale),
    command = useServerFn(commerceCommand),
    qc = useQueryClient();
  const [tab, setTab] = useState<CommerceAdminView>("payments"),
    [page, setPage] = useState(0),
    [search, setSearch] = useState(targetOrderId ?? ""),
    [filter, setFilter] = useState("all"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const navigation = commerceAdminNavigation(locale);
  const selectedView = navigation.views[tab];
  function selectView(view: CommerceAdminView) {
    if (view === tab) return;
    setTab(view);
    setPage(0);
    setSearch(view === "payments" ? (targetOrderId ?? "") : "");
    setFilter("all");
    setError("");
    setNotice("");
  }
  const result = useQuery({
    queryKey: ["commerce-admin", actorId],
    queryFn: async () =>
      (await command({ data: { action: "admin_list", data: {} } })) as unknown as AdminData,
  });
  const running = useRef(false);
  async function run(action: string, data: unknown) {
    if (running.current || result.error) return;
    running.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await command({ data: { action, data } });
      await qc.invalidateQueries({ queryKey: ["commerce-admin", actorId] });
      await qc.invalidateQueries({ queryKey: ["commerce-admin-order", actorId] });
      setNotice(w.saved);
      return response;
    } catch (err) {
      setError(offerError(err, locale, w.error));
    } finally {
      setBusy(false);
      running.current = false;
    }
  }
  const data = result.data;
  const orders =
    data?.orders.filter(
      (o) =>
        `${o.id} ${o.recipient_email} ${o.reference} ${o.package}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (filter === "all" || o.review_status === filter),
    ) ?? [];
  const access =
    data?.entitlements.filter(
      (e) =>
        `${e.user_id} ${e.package}`.includes(search) &&
        (filter === "all" || accessState(e) === filter),
    ) ?? [];
  return (
    <div className="min-h-dvh bg-background" dir={locale === "en" ? "ltr" : "rtl"}>
      <header className="flex flex-wrap justify-between gap-3 border-b p-4">
        <h1 className="text-xl font-bold">{navigation.title}</h1>
        <Link to="/admin" search={{ locale }} className="text-primary underline">
          {w.back}
        </Link>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <nav aria-label={navigation.areaLabel} className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {navigation.areas.map(({ id, title, defaultView }) => (
            <Button
              key={id}
              className="h-auto min-h-11 min-w-0 whitespace-normal px-2 text-center"
              disabled={busy}
              aria-pressed={selectedView.area === id}
              variant={selectedView.area === id ? "default" : "outline"}
              onClick={() => selectedView.area !== id && selectView(defaultView)}
            >
              <span
                className={
                  selectedView.area === id ? "font-bold underline underline-offset-4" : undefined
                }
              >
                {title}
              </span>
            </Button>
          ))}
        </nav>
        {selectedView.area !== "payments" && (
          <nav aria-label={navigation.viewLabel} className="flex flex-wrap gap-2 border-b pb-4">
            {(Object.keys(navigation.views) as CommerceAdminView[])
              .filter((view) => navigation.views[view].area === selectedView.area)
              .map((view) => (
                <Button
                  key={view}
                  className="h-auto min-h-11 min-w-0 whitespace-normal px-2 text-center"
                  disabled={busy}
                  aria-pressed={tab === view}
                  variant={tab === view ? "secondary" : "outline"}
                  onClick={() => selectView(view)}
                >
                  <span
                    className={tab === view ? "font-bold underline underline-offset-4" : undefined}
                  >
                    {navigation.views[view].title}
                  </span>
                </Button>
              ))}
          </nav>
        )}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{selectedView.title}</h2>
            <p className="max-w-3xl text-sm text-muted-foreground">{selectedView.description}</p>
          </div>
          {tab !== "email-access" && tab !== "free-access" && (
            <Button variant="outline" onClick={() => void result.refetch()}>
              {w.refresh}
            </Button>
          )}
        </div>
        {(tab === "payments" || tab === "audit") && (
          <div className="flex flex-wrap gap-3">
            <input
              aria-label={w.search}
              placeholder={w.search}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="min-h-11 flex-1 rounded border bg-background px-3"
            />
            {tab === "payments" && (
              <Select
                label={w.select}
                value={filter}
                onChange={(value) => {
                  setFilter(value);
                  setPage(0);
                }}
                options={[
                  ["all", w.all],
                  ...COMMERCE_PAYMENT_FILTERS.map((s) => [s, w[s]] as const),
                ]}
              />
            )}
            {tab === "payments" && (
              <Button
                variant="outline"
                disabled={!data || !!result.error}
                onClick={() =>
                  data && download("Masaarat_Commerce_Export.csv", exportCommerce(data))
                }
              >
                {navigation.exportAvailable}
              </Button>
            )}
          </div>
        )}
        {tab !== "email-access" && tab !== "free-access" && (error || result.error) && (
          <p role="alert" className="text-destructive">
            {error || navigation.loadFailed}
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        {tab !== "email-access" && tab !== "free-access" && result.isPending && (
          <p role="status">{navigation.loading}</p>
        )}
        {tab === "email-access" && <AdminEmailAccess />}
        {tab === "free-access" && <AdminFreeAccess />}
        {data && !result.error && tab === "payments" && (
          <div className="flex items-center gap-3">
            <Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
              {w.back}
            </Button>
            <span>
              {page + 1} / {Math.max(1, Math.ceil(Math.max(orders.length, access.length) / 25))}
            </span>
            <Button
              variant="outline"
              disabled={(page + 1) * 25 >= Math.max(orders.length, access.length)}
              onClick={() => setPage(page + 1)}
            >
              {w.continue}
            </Button>
          </div>
        )}
        {data && (
          <div hidden={!!result.error} className="space-y-4">
            {tab === "payments" && (
              <AdminPayments
                actorId={actorId}
                initialOrderId={targetOrderId}
                data={data}
                orders={orders.slice(page * 25, (page + 1) * 25)}
                access={access.slice(page * 25, (page + 1) * 25)}
                run={run}
                busy={busy}
              />
            )}
            {tab === "offers" && (
              <AdminOffers
                data={data}
                run={run}
                busy={busy}
                onInvitations={() => selectView("email-access")}
              />
            )}
            {tab === "card-offers" && <AdminLiveOffers />}
            {tab === "groups" && (
              <AdminGroups
                onInvitations={() => selectView("email-access")}
                data={data}
                w={w}
                run={run}
                busy={busy}
              />
            )}
            {tab === "settings" && (
              <AdminSettings
                data={data}
                w={w}
                run={run}
                busy={busy}
                onInvitations={() => selectView("email-access")}
              />
            )}
            {tab === "audit" && (
              <section aria-label={w.audit} className="space-y-3">
                {(data.audit ?? [])
                  .filter((a) =>
                    `${a.actor ?? ""} ${a.action} ${a.target_id ?? ""}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .slice(0, 100)
                  .map((a) => (
                    <article key={a.id} className="rounded border p-3 break-words">
                      <strong>{a.action}</strong>
                      <p>
                        <bdi>
                          {a.created_at} · {a.actor} · {a.target_id}
                        </bdi>
                      </p>
                    </article>
                  ))}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
