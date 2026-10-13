import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { emailAccessCommand } from "@/lib/commerce/email-access.functions";
import {
  emailAccessCopy,
  type EmailAccessData,
  type EmailAccessInput,
} from "@/lib/commerce/email-access";
import { useLocale } from "@/lib/locale/locale-context";
import { Button } from "@/components/ui/button";
import { Select } from "./AdminShared";
import { RegisteredEmailPicker } from "./RegisteredEmailPicker";
import { SUPPORTED_LOCALES, LOCALE_META } from "@/lib/locale/types";

export function AdminEmailAccess() {
  const { locale } = useLocale(),
    w = emailAccessCopy(locale);
  const command = useServerFn(emailAccessCommand),
    qc = useQueryClient();
  const result = useQuery({
    queryKey: ["email-access-admin"],
    queryFn: async () =>
      (await command({ data: { action: "list", data: {} } })) as unknown as EmailAccessData,
  });
  const [email, setEmail] = useState(""),
    [scope, setScope] = useState<"all_published" | "selected">("all_published");
  const [catalogues, setCatalogues] = useState<string[]>([]),
    [permanent, setPermanent] = useState(false);
  const [days, setDays] = useState("30"),
    [invitation, setInvitation] = useState(false);
  const [invitationLocale, setInvitationLocale] = useState(locale);
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const running = useRef(false);
  // Preserve the operation key after an uncertain response. Changed parameters
  // get a new key; retries of the same action cannot create duplicate grants.
  const retry = useRef<{ fingerprint: string; key: string } | null>(null);
  async function run(input: EmailAccessInput) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await command({ data: input });
      retry.current = null;
      await qc.invalidateQueries({ queryKey: ["email-access-admin"] });
      await qc.invalidateQueries({ queryKey: ["user-subscription"] });
      setNotice(w.saved);
    } catch {
      setError(w.error);
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  function keyFor(parameters: unknown) {
    const fingerprint = JSON.stringify(parameters);
    if (retry.current?.fingerprint !== fingerprint)
      retry.current = { fingerprint, key: crypto.randomUUID() };
    return retry.current.key;
  }
  const rows =
    result.data?.grants.filter(
      (g) =>
        g.recipient_email.includes(search.trim().toLowerCase()) &&
        (filter === "all" || g.status === filter),
    ) ?? [];
  const date = (value: string | null) =>
    value ? new Date(value).toLocaleString(locale === "en" ? "en-GB" : "ar-EG") : "—";
  return (
    <section aria-label={w.title} className="space-y-5">
      <h2 className="text-lg font-bold">{w.title}</h2>
      <p className="text-sm text-muted-foreground">{w.note}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const data = {
            email: email.trim(),
            scope_mode: scope,
            catalogues: scope === "selected" ? [...catalogues].sort() : [],
            duration_days: permanent ? null : Number(days),
            invitation,
            locale: invitationLocale,
          };
          void run({ action: "create", data: { ...data, key: keyFor(data) } });
        }}
        className="space-y-3 rounded border p-4"
      >
        <fieldset disabled={busy || !result.data} className="space-y-3">
          <RegisteredEmailPicker
            onSelect={setEmail}
            selected={[email]}
            disabled={busy || !result.data}
          />
          <label className="block">
            {w.email}
            <input
              type="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block min-h-11 w-full rounded border bg-background px-3"
            />
          </label>
          <Select
            label={w.scope}
            value={scope}
            onChange={(v) => setScope(v as typeof scope)}
            options={[
              ["all_published", w.all],
              ["selected", w.selected],
            ]}
          />
          {scope === "selected" && (
            <fieldset className="space-y-2">
              <legend>{w.selected}</legend>
              {result.data?.catalogues.map((c) => (
                <label key={c.id} className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={catalogues.includes(c.id)}
                    onChange={(e) =>
                      setCatalogues((old) =>
                        e.target.checked ? [...old, c.id] : old.filter((id) => id !== c.id),
                      )
                    }
                  />
                  {c.titles?.[locale] ?? c.title}
                </label>
              ))}
            </fieldset>
          )}
          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={permanent}
              onChange={(e) => setPermanent(e.target.checked)}
            />
            {w.permanent}
          </label>
          {!permanent && (
            <label className="block">
              {w.days}
              <input
                type="number"
                required
                min={1}
                max={36500}
                step={1}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="block min-h-11 rounded border bg-background px-3"
              />
            </label>
          )}
          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={invitation}
              onChange={(e) => setInvitation(e.target.checked)}
            />
            {w.invitation}
          </label>
          {invitation && (
            <Select
              label={w.invitationLanguage}
              value={invitationLocale}
              onChange={(value) => setInvitationLocale(value as typeof locale)}
              options={SUPPORTED_LOCALES.map((value) => [value, LOCALE_META[value].displayName])}
            />
          )}
          <Button type="submit" disabled={scope === "selected" && !catalogues.length}>
            {w.create}
          </Button>
        </fieldset>
      </form>
      {(error || result.error) && (
        <p role="alert" className="text-destructive">
          {error || w.error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      <div className="flex flex-wrap gap-3">
        <input
          aria-label={w.search}
          placeholder={w.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-h-11 rounded border bg-background px-3"
        />
        <Select
          label={w.filter}
          value={filter}
          onChange={setFilter}
          options={[
            ["all", w.any],
            ...(["pending_registration", "active", "expired", "revoked"] as const).map(
              (s) => [s, w[s]] as const,
            ),
          ]}
        />
        <Button variant="outline" onClick={() => void result.refetch()}>
          {w.refresh}
        </Button>
      </div>
      {result.data && rows.length === 0 && <p>{w.empty}</p>}
      {rows.map((g) => (
        <article key={g.id} className="space-y-2 rounded border p-4">
          <h3 className="font-bold">
            <bdi>{g.recipient_email}</bdi> · {w[g.status]}
          </h3>
          <p>
            {g.scope_mode === "all_published"
              ? w.all
              : g.catalogues
                  .map((id) => {
                    const c = result.data?.catalogues.find((x) => x.id === id);
                    return c?.titles?.[locale] ?? c?.title ?? id;
                  })
                  .join("، ")}
          </p>
          <p>
            {w.duration}: {g.duration_days === null ? w.permanent : g.duration_days + " " + w.days}{" "}
            · {w.activation}: {date(g.activated_at)} · {w.expiry}:{" "}
            {g.ends_at ? date(g.ends_at) : g.activated_at ? w.permanent : "—"}
          </p>
          <p>
            {w.mail}: {g.invitation_status ?? w.none}
          </p>
          {g.status !== "revoked" && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                const data = { id: g.id };
                void run({
                  action: "revoke",
                  data: { ...data, key: keyFor({ action: "revoke", ...data }) },
                });
              }}
            >
              {w.revoke}
            </Button>
          )}
          {g.user_id && g.ends_at && g.status !== "revoked" && (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const duration_days = Number(new FormData(e.currentTarget).get("days"));
                const data = { id: g.id, duration_days };
                void run({
                  action: "extend",
                  data: { ...data, key: keyFor({ action: "extend", ...data }) },
                });
              }}
            >
              <input
                aria-label={w.days}
                name="days"
                type="number"
                required
                min={1}
                max={36500}
                step={1}
                defaultValue="30"
                disabled={busy}
                className="min-h-11 w-28 rounded border bg-background px-3"
              />
              <Button type="submit" disabled={busy}>
                {w.extend}
              </Button>
            </form>
          )}
          <details>
            <summary>{w.audit}</summary>
            {g.audit.map((a) => (
              <p key={a.id}>
                {w[a.action as "created"] ?? a.action} · {date(a.created_at)} ·{" "}
                <bdi>{a.actor ?? "—"}</bdi>
                {a.action === "extended" && (
                  <>
                    {" "}
                    · {String(a.details.duration_days)} {w.days}
                  </>
                )}
              </p>
            ))}
          </details>
        </article>
      ))}
    </section>
  );
}
