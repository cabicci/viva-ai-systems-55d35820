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
import { Button } from "@/components/ui/button";
import { AdminPayments } from "@/components/commerce/AdminPayments";
import { AdminSettings } from "@/components/commerce/AdminSettings";
import { AdminGroups } from "@/components/commerce/AdminGroups";
import { Select } from "@/components/commerce/AdminShared";
import { exportCommerce } from "@/lib/commerce/report";
export const Route = createFileRoute("/admin/commerce")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  beforeLoad: requireAdminBeforeLoad,
  component: CommerceAdmin,
});
function CommerceAdmin() {
  const { locale } = useLocale(),
    w = commerceCopy(locale),
    command = useServerFn(commerceCommand),
    qc = useQueryClient();
  const [tab, setTab] = useState("payments"),
    [page, setPage] = useState(0),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const result = useQuery({
    queryKey: ["commerce-admin"],
    queryFn: async () =>
      (await command({ data: { action: "admin_list", data: {} } })) as unknown as AdminData,
  });
  const running = useRef(false);
  async function run(action: string, data: unknown) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await command({ data: { action, data } });
      await qc.invalidateQueries({ queryKey: ["commerce-admin"] });
      await qc.invalidateQueries({ queryKey: ["commerce-admin-order"] });
      setNotice(w.saved);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : w.error);
    } finally {
      setBusy(false);
      running.current = false;
    }
  }
  const data = result.data;
  const orders =
    data?.orders.filter(
      (o) =>
        `${o.recipient_email} ${o.reference} ${o.package}`
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
        <h1 className="text-xl font-bold">{w.title}</h1>
        <Link to="/admin" search={{ locale }} className="text-primary underline">
          {w.back}
        </Link>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <nav className="flex flex-wrap gap-2">
          {[
            ["payments", w.payments],
            ["groups", w.groups],
            ["settings", w.settings],
            ["audit", w.audit],
          ].map(([id, title]) => (
            <Button
              key={id}
              variant={tab === id ? "default" : "outline"}
              onClick={() => {
                setTab(id);
                setPage(0);
              }}
            >
              {title}
            </Button>
          ))}
          <Button variant="outline" onClick={() => void result.refetch()}>
            {w.refresh}
          </Button>
        </nav>
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
          <Select
            label={w.select}
            value={filter}
            onChange={(value) => {
              setFilter(value);
              setPage(0);
            }}
            options={[
              ["all", w.all],
              ...[
                "pending",
                "awaiting_receipt",
                "confirmed",
                "rejected",
                "more_info",
                "cancelled",
                "active",
                "expired",
                "revoked",
                "scheduled",
                "sent",
                "accepted",
              ].map((s) => [s, w[s as "pending"]] as const),
            ]}
          />
          <Button
            variant="outline"
            disabled={!data}
            onClick={() => data && download("Masaarat_Commerce_Export.csv", exportCommerce(data))}
          >
            {w.export}
          </Button>
        </div>
        {(error || result.error) && (
          <p role="alert" className="text-destructive">
            {error || w.disabled}
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        {data && tab === "payments" && (
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
          <>
            {tab === "payments" && (
              <AdminPayments
                data={data}
                orders={orders.slice(page * 25, (page + 1) * 25)}
                access={access.slice(page * 25, (page + 1) * 25)}
                run={run}
                busy={busy}
              />
            )}
            {tab === "groups" && (
              <AdminGroups
                data={{
                  ...data,
                  invitations: data.invitations.filter(
                    (i) =>
                      `${i.email} ${i.package}`.toLowerCase().includes(search.toLowerCase()) &&
                      (filter === "all" ||
                        (filter === "pending" && !i.accepted_at) ||
                        (filter === "accepted" && !!i.accepted_at) ||
                        (filter === "sent" && i.send_status === "sent") ||
                        (filter === "active" &&
                          data.entitlements.some(
                            (e) =>
                              ((e.order_id === i.order_id && !!i.order_id) ||
                                data.grants.some(
                                  (g) => g.id === e.grant_id && g.invitation_id === i.id,
                                )) &&
                              accessState(e) === "active",
                          )) ||
                        (filter === "expired" &&
                          new Date(i.deadline) <= new Date() &&
                          !i.accepted_at) ||
                        (filter === "rejected" &&
                          data.orders.some(
                            (o) => o.id === i.order_id && o.review_status === "rejected",
                          )) ||
                        (filter === "revoked" && !!i.revoked_at)),
                  ),
                }}
                w={w}
                run={run}
                busy={busy}
              />
            )}
            {tab === "settings" && <AdminSettings data={data} w={w} run={run} busy={busy} />}
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
          </>
        )}
      </main>
    </div>
  );
}
