import { useCommandKey } from "@/lib/commerce/use-command-key";
import { packages, instant, dayInput } from "@/lib/commerce/admin-ui";
import { useState } from "react";
import { SUPPORTED_LOCALES, LOCALE_META } from "@/lib/locale/types";
import type { AdminData, PaymentMethod } from "@/lib/commerce/contracts";
import type { CommerceCopy } from "@/lib/commerce/copy";
import { Button } from "@/components/ui/button";
import { Check, Field, Panel, Save, Select, type RunCommand } from "./AdminShared";
export function AdminSettings({
  data,
  w,
  run,
  busy,
}: {
  data: AdminData;
  w: CommerceCopy;
  run: RunCommand;
  busy: boolean;
}) {
  return (
    <>
      <Panel title={w.settings}>
        <p>{w.configure}</p>
        {data.methods
          .filter((x) => ["instapay", "wallet", "bank"].includes(x.code))
          .map((m) => (
            <Method key={m.code} method={m} w={w} run={run} busy={busy} />
          ))}
        <p>{w.paymob}</p>
      </Panel>
      <Grant w={w} run={run} busy={busy} />
      <Offers data={data} w={w} run={run} busy={busy} />
      <Preferences w={w} run={run} busy={busy} />
    </>
  );
}
function Method({
  method,
  w,
  run,
  busy,
}: {
  method: PaymentMethod;
  w: CommerceCopy;
  run: RunCommand;
  busy: boolean;
}) {
  const [m, set] = useState(method);
  return (
    <form
      className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        void run("configure_method", m);
      }}
    >
      <h3 className="font-bold sm:col-span-2">{w[m.code as "bank"]}</h3>
      <Field
        label={w.destination}
        value={m.destination}
        onChange={(destination) => set({ ...m, destination })}
      />
      <Field label={w.qr} value={m.qr_url ?? ""} onChange={(qr_url) => set({ ...m, qr_url })} />
      <label className="sm:col-span-2">
        {w.instructions}
        <textarea
          className="block min-h-24 w-full rounded border bg-background p-2"
          value={m.instructions}
          onChange={(e) => set({ ...m, instructions: e.target.value })}
        />
      </label>
      {SUPPORTED_LOCALES.map((locale) => (
        <label className="sm:col-span-2" key={locale}>
          {w.instructions} ({LOCALE_META[locale].displayName})
          <textarea
            className="block min-h-24 w-full rounded border bg-background p-2"
            dir={LOCALE_META[locale].dir}
            value={m.instructions_localized?.[locale] ?? ""}
            onChange={(e) => {
              const instructions_localized = { ...m.instructions_localized };
              if (e.target.value.trim()) instructions_localized[locale] = e.target.value;
              else delete instructions_localized[locale];
              set({ ...m, instructions_localized });
            }}
            maxLength={4000}
          />
        </label>
      ))}
      <Select
        label={w.currency}
        value={m.currencies.join(",")}
        onChange={(v) => set({ ...m, currencies: v.split(",") })}
        options={["EGP", "USD", "EGP,USD"]}
      />
      <Check label={w.enabled} checked={m.enabled} onChange={(enabled) => set({ ...m, enabled })} />
      <Save w={w} busy={busy} />
    </form>
  );
}
function Grant({ w, run, busy }: { w: CommerceCopy; run: RunCommand; busy: boolean }) {
  const requestKey = useCommandKey();
  const [values, set] = useState({
    user_id: "",
    package: "pro",
    duration_days: 30,
    starts_at: dayInput(0),
    reason: "",
  });
  return (
    <Panel title={w.grants}>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void run("grant", {
            ...values,
            starts_at: instant(values.starts_at),
            key: requestKey(values),
          });
        }}
      >
        <Field
          label={w.userId}
          value={values.user_id}
          onChange={(user_id) => set({ ...values, user_id })}
          required
        />
        <Select
          label={w.package}
          value={values.package}
          onChange={(pack) => set({ ...values, package: pack })}
          options={packages}
        />
        <Field
          label={w.days}
          value={values.duration_days}
          type="number"
          onChange={(v) => set({ ...values, duration_days: Number(v) })}
        />
        <Field
          label={w.date}
          value={values.starts_at}
          type="datetime-local"
          onChange={(starts_at) => set({ ...values, starts_at })}
        />
        <Field
          label={w.reason}
          value={values.reason}
          onChange={(reason) => set({ ...values, reason })}
          required
        />
        <Save w={w} busy={busy} />
      </form>
    </Panel>
  );
}
function Offers({
  data,
  w,
  run,
  busy,
}: {
  data: AdminData;
  w: CommerceCopy;
  run: RunCommand;
  busy: boolean;
}) {
  const [v, set] = useState({
    code: "",
    campaign: "",
    package: "pro",
    kind: "percent",
    value_minor: 10,
    currency: "EGP",
    email: "",
    duration_days: 30,
    eligibility: "all",
    renewals: false,
    valid_from: dayInput(0),
    valid_until: dayInput(30),
    max_redemptions: 100,
    per_email_limit: 1,
    enabled: true,
  });
  return (
    <Panel title={w.offers}>
      <p>{w.currencyNotice}</p>
      <form
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          void run("create_offer", {
            ...v,
            valid_from: instant(v.valid_from),
            valid_until: instant(v.valid_until),
          });
        }}
      >
        <Field
          label={w.code}
          value={v.code}
          onChange={(code) => set({ ...v, code: code.toUpperCase() })}
          required
        />
        <Field
          label={w.campaign}
          value={v.campaign}
          onChange={(campaign) => set({ ...v, campaign })}
          required
        />
        <Select
          label={w.package}
          value={v.package}
          onChange={(pack) => set({ ...v, package: pack })}
          options={packages}
        />
        <Select
          label={w.kind}
          value={v.kind}
          onChange={(kind) => set({ ...v, kind })}
          options={[
            ["complimentary", w.complimentary],
            ["percent", w.percent],
            ["fixed", w.fixed],
          ]}
        />
        <Field
          label={w.value}
          value={v.value_minor}
          type="number"
          onChange={(x) => set({ ...v, value_minor: Number(x) })}
        />
        <Select
          label={w.currency}
          value={v.currency}
          onChange={(currency) => set({ ...v, currency })}
          options={["EGP", "USD"]}
        />
        <Field
          label={w.email}
          value={v.email}
          type="email"
          onChange={(email) => set({ ...v, email })}
        />
        <Field
          label={w.days}
          value={v.duration_days}
          type="number"
          onChange={(x) => set({ ...v, duration_days: Number(x) })}
        />
        <Field
          label={w.validFrom}
          value={v.valid_from}
          type="datetime-local"
          onChange={(valid_from) => set({ ...v, valid_from })}
        />
        <Field
          label={w.validUntil}
          value={v.valid_until}
          type="datetime-local"
          onChange={(valid_until) => set({ ...v, valid_until })}
        />
        <Field
          label={w.limit}
          value={v.max_redemptions}
          type="number"
          onChange={(x) => set({ ...v, max_redemptions: Number(x) })}
        />
        <Field
          label={w.perEmail}
          value={v.per_email_limit}
          type="number"
          onChange={(x) => set({ ...v, per_email_limit: Number(x) })}
        />
        <Check
          label={w.newCustomer}
          checked={v.eligibility === "new_customer"}
          onChange={(x) => set({ ...v, eligibility: x ? "new_customer" : "all" })}
        />
        <Check
          label={w.renewals}
          checked={v.renewals}
          onChange={(renewals) => set({ ...v, renewals })}
        />
        <Save w={w} busy={busy} />
      </form>
      <div className="space-y-2">
        {data.offers.map((o) => (
          <div key={o.id} className="flex flex-wrap items-center gap-3 border-t pt-2">
            <bdi>{o.code}</bdi>
            <span>
              {o.package} · {o.kind} · {o.valid_until.slice(0, 10)} ·{" "}
              {o.renewals ? w.renewals : w.noAutopay}
            </span>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void run("offer_state", { id: o.id, enabled: !o.enabled })}
            >
              {w.offerEnabled}: {o.enabled ? w.enabled : w.unavailable}
            </Button>
          </div>
        ))}
      </div>
    </Panel>
  );
}
function Preferences({ w, run, busy }: { w: CommerceCopy; run: RunCommand; busy: boolean }) {
  const [v, set] = useState({ email: "", marketing_opt_out: false, suppressed: false });
  return (
    <Panel title={w.preferences}>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void run("mail_preferences", v);
        }}
      >
        <Field
          label={w.email}
          value={v.email}
          type="email"
          onChange={(email) => set({ ...v, email })}
          required
        />
        <Check
          label={w.optOut}
          checked={v.marketing_opt_out}
          onChange={(marketing_opt_out) => set({ ...v, marketing_opt_out })}
        />
        <Check
          label={w.suppressed}
          checked={v.suppressed}
          onChange={(suppressed) => set({ ...v, suppressed })}
        />
        <Save w={w} busy={busy} />
      </form>
    </Panel>
  );
}
