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
  onInvitations,
}: {
  data: AdminData;
  w: CommerceCopy;
  run: RunCommand;
  busy: boolean;
  onInvitations?: () => void;
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
      <Panel title={w.canonicalInvitations}>
        <p>{w.canonicalRequired}</p>
        <Button disabled={busy || !onInvitations} onClick={onInvitations}>
          {w.canonicalInvitations}
        </Button>
      </Panel>
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
  const egpOnly = method.code === "instapay" || method.code === "wallet";
  const [m, set] = useState({ ...method, currencies: egpOnly ? ["EGP"] : method.currencies });
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
        options={egpOnly ? ["EGP"] : ["EGP", "USD", "EGP,USD"]}
      />
      <Check label={w.enabled} checked={m.enabled} onChange={(enabled) => set({ ...m, enabled })} />
      <Save w={w} busy={busy} />
    </form>
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
