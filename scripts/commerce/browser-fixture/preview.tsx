import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { commerceCopy } from "@/lib/commerce/copy";
import { PaymentMethods } from "@/components/commerce/PaymentMethods";
import { AdminGroups } from "@/components/commerce/AdminGroups";
import { AdminPayments } from "@/components/commerce/AdminPayments";
import { AdminSettings } from "@/components/commerce/AdminSettings";
import type { AdminData } from "@/lib/commerce/contracts";
const data: AdminData = {
  groups: [{ id: "00000000-0000-4000-8000-000000000001", name: "Synthetic", send_state: "paused" }],
  orders: [
    {
      id: "00000000-0000-4000-8000-000000000003",
      reference: "SYNTHETIC-REVIEW",
      recipient_email: "member@example.test",
      user_id: "00000000-0000-4000-8000-000000000004",
      package: "pro",
      billing_interval: "month",
      start_rule: "acceptance",
      original_minor: 16900,
      final_minor: 16900,
      currency: "EGP",
      method: "instapay",
      group_id: "00000000-0000-4000-8000-000000000001",
      expires_at: "2099-12-01T00:00:00Z",
      review_status: "pending",
      instructions_snapshot: {},
    },
  ],
  invitations: [],
  payments: [
    {
      id: "00000000-0000-4000-8000-000000000005",
      group_id: "00000000-0000-4000-8000-000000000001",
      amount_minor: 20000,
      currency: "EGP",
      method: "instapay",
      transaction_reference: "SYNTHETIC-PAID",
    },
  ],
  grants: [],
  entitlements: [],
  offers: [],
  refunds: [],
  allocations: [
    {
      order_id: "00000000-0000-4000-8000-000000000003",
      payment_id: "00000000-0000-4000-8000-000000000005",
      amount_minor: 3100,
    },
  ],
  methods: [
    { code: "instapay", enabled: false, destination: "", instructions: "", currencies: ["EGP"] },
  ],
};
export function Preview() {
  const [locale, setLocale] = useState<"ar-EG" | "ar-MSA" | "ar-Gulf" | "en">("ar-EG"),
    [tab, setTab] = useState("payments");
  const w = commerceCopy(locale);
  return (
    <LocaleProvider effectiveLocale={locale}>
      <div dir={locale === "en" ? "ltr" : "rtl"} className="mx-auto max-w-6xl px-4 py-6 space-y-5">
        <h1 className="text-2xl font-bold">Synthetic verification — {w.title}</h1>
        <select
          aria-label="Locale"
          className="min-h-11 border"
          value={locale}
          onChange={(e) => setLocale(e.target.value as typeof locale)}
        >
          {["ar-EG", "ar-MSA", "ar-Gulf", "en"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <nav className="flex flex-wrap gap-3">
          {["payments", "groups", "settings", "review"].map((x) => (
            <button className="min-h-11 rounded border px-3" key={x} onClick={() => setTab(x)}>
              {x}
            </button>
          ))}
        </nav>
        {tab === "payments" ? (
          <div className="max-w-sm rounded-xl border p-4">
            <h2>Pro</h2>
            <PaymentMethods
              key={locale}
              packageKey="pro"
              interval="month"
              market="EG"
              stripe={() => {}}
            >
              {w.continue}
            </PaymentMethods>
          </div>
        ) : tab === "groups" ? (
          <AdminGroups
            key={locale}
            data={data}
            w={w}
            busy={false}
            run={async (action, body) =>
              action === "preview_import"
                ? (body as { rows: { email: string }[] }).rows.map((row) => ({
                    email: row.email,
                    quote: { original_minor: 16900, final_minor: 16900 },
                    existing: false,
                    imported: false,
                  }))
                : { id: data.groups[0].id }
            }
          />
        ) : tab === "review" ? (
          <AdminPayments
            key={locale}
            data={data}
            orders={data.orders}
            access={[]}
            busy={false}
            run={async (action, body) => {
              (window as unknown as { reviewActions: unknown[] }).reviewActions = [action, body];
              return { ok: true };
            }}
          />
        ) : (
          <AdminSettings
            key={locale}
            data={data}
            w={w}
            run={async () => ({ ok: true })}
            busy={false}
          />
        )}
      </div>
    </LocaleProvider>
  );
}
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={new QueryClient()}>
    <Preview />
  </QueryClientProvider>,
);
