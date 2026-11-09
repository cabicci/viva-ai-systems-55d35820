import { download } from "@/lib/commerce/admin-ui";
import {
  InvitationImportError,
  prepareInvitationImport,
  exportInvitationImport,
  executeInvitationImport,
  type InvitationImportRow,
} from "@/lib/commerce/canonical-invitation-import";
import { packageBenefits } from "@/lib/billing/package-benefits";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { emailAccessCommand } from "@/lib/commerce/email-access.functions";
import {
  emailAccessCopy,
  invitationImportCopy,
  isWholeCurriculumCatalogue,
  type EmailAccessData,
  type EmailAccessInput,
  type EmailAccessCommandInput,
} from "@/lib/commerce/email-access";
import { useLocale } from "@/lib/locale/locale-context";
import { Button } from "@/components/ui/button";
import { Select } from "./AdminShared";
import { RegisteredEmailPicker } from "./RegisteredEmailPicker";
import { SUPPORTED_LOCALES, LOCALE_META } from "@/lib/locale/types";

export function AdminEmailAccess() {
  const { user, loading, authGeneration, isAuthGenerationCurrent } = useAuth();
  if (!user || loading || !isAuthGenerationCurrent(authGeneration)) return null;
  return (
    <OwnedAdminEmailAccess
      key={`${user.id}:${authGeneration.value}`}
      expectedAccountId={user.id}
      generationValue={authGeneration.value}
      isOwnerCurrent={() => isAuthGenerationCurrent(authGeneration)}
    />
  );
}

function OwnedAdminEmailAccess({
  expectedAccountId,
  generationValue,
  isOwnerCurrent,
}: {
  expectedAccountId: string;
  generationValue: number;
  isOwnerCurrent: () => boolean;
}) {
  const lifetime = useRef({ mounted: true, epoch: 0 });
  useEffect(() => {
    lifetime.current.mounted = true;
    return () => {
      lifetime.current.mounted = false;
      lifetime.current.epoch++;
    };
  }, []);
  function captureOwner() {
    const epoch = lifetime.current.epoch;
    return () => lifetime.current.mounted && lifetime.current.epoch === epoch && isOwnerCurrent();
  }
  const { locale } = useLocale(),
    w = emailAccessCopy(locale);
  const command = useServerFn(emailAccessCommand),
    qc = useQueryClient();
  const queryKey = ["email-access-admin", expectedAccountId, generationValue];
  const result = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const current = captureOwner();
      if (!current() || signal.aborted) throw new Error("EMAIL_ACCESS_ACCOUNT_CHANGED");
      const value = await command({ data: { action: "list", data: {}, expectedAccountId } });
      if (!current() || signal.aborted) throw new Error("EMAIL_ACCESS_ACCOUNT_CHANGED");
      return value as unknown as EmailAccessData;
    },
  });
  const [email, setEmail] = useState(""),
    [scope, setScope] = useState<"all_published" | "selected">("all_published");
  const [grantKind, setGrantKind] = useState<"comprehensive" | "single_curriculum">(
    "comprehensive",
  );
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
    const current = captureOwner();
    if (!current() || running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await command({ data: { ...input, expectedAccountId } });
      if (!current()) return;
      retry.current = null;
      await qc.invalidateQueries({ queryKey, exact: true });
      if (!current()) return;
      await qc.invalidateQueries({ queryKey: ["user-subscription"] });
      if (current()) setNotice(w.saved);
    } catch {
      if (current()) setError(w.error);
    } finally {
      if (current()) {
        running.current = false;
        setBusy(false);
      }
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
      <ul className="list-disc space-y-2 ps-5 text-sm text-muted-foreground">
        {[
          ...(grantKind === "single_curriculum"
            ? packageBenefits(locale).invitationSingle
            : packageBenefits(locale).invitationComprehensive),
          ...packageBenefits(locale).invitationCommon,
        ].map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const data = {
            email: email.trim(),
            grant_kind: grantKind,
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
            label={w.grantKind}
            value={grantKind}
            onChange={(value) => {
              setGrantKind(value as typeof grantKind);
              setScope(value === "single_curriculum" ? "selected" : "all_published");
              setCatalogues([]);
            }}
            options={[
              ["comprehensive", w.comprehensive],
              ["single_curriculum", w.single],
            ]}
          />
          {grantKind === "comprehensive" && (
            <Select
              label={w.scope}
              value={scope}
              onChange={(v) => setScope(v as typeof scope)}
              options={[
                ["all_published", w.all],
                ["selected", w.selected],
              ]}
            />
          )}
          {grantKind === "single_curriculum" && (
            <Select
              label={w.curriculum}
              value={catalogues[0] ?? ""}
              onChange={(value) => setCatalogues(value ? [value] : [])}
              options={[
                ["", w.choose],
                ...(result.data?.catalogues
                  .filter((c) => isWholeCurriculumCatalogue(c.id))
                  .map(
                    (c) =>
                      [
                        c.id,
                        c.id === "ai:pro_plus" ? w.wholeAi : (c.titles?.[locale] ?? c.title),
                      ] as const,
                  ) ?? []),
              ]}
            />
          )}
          {grantKind === "comprehensive" && scope === "selected" && (
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
      <CanonicalInvitationImport
        catalogues={result.data?.catalogues}
        disabled={busy}
        command={command}
        expectedAccountId={expectedAccountId}
        captureOwner={captureOwner}
        acquire={() => {
          if (!captureOwner()() || running.current) return false;
          running.current = true;
          setBusy(true);
          return true;
        }}
        release={() => {
          running.current = false;
          setBusy(false);
        }}
        onSaved={async (current) => {
          if (!current()) return;
          await qc.invalidateQueries({ queryKey, exact: true });
          if (current()) await qc.invalidateQueries({ queryKey: ["user-subscription"] });
        }}
      />
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
          <p>{g.grant_kind === "single_curriculum" ? w.single : w.comprehensive}</p>
          <p>
            {g.scope_mode === "all_published"
              ? w.all
              : g.catalogues
                  .map((id) => {
                    const c = result.data?.catalogues.find((x) => x.id === id);
                    if (g.grant_kind === "single_curriculum" && id === "ai:pro_plus")
                      return w.wholeAi;
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

function CanonicalInvitationImport({
  catalogues,
  disabled,
  command,
  acquire,
  release,
  onSaved,
  expectedAccountId,
  captureOwner,
}: {
  catalogues?: EmailAccessData["catalogues"];
  disabled: boolean;
  command: (args: { data: EmailAccessCommandInput }) => Promise<unknown>;
  expectedAccountId: string;
  captureOwner: () => () => boolean;
  acquire: () => boolean;
  release: () => void;
  onSaved: (current: () => boolean) => Promise<void>;
}) {
  const { locale } = useLocale(),
    w = invitationImportCopy(locale),
    labels = emailAccessCopy(locale);
  const [text, setText] = useState(""),
    [rows, setRows] = useState<InvitationImportRow[]>([]);
  const [error, setError] = useState(""),
    [downloaded, setDownloaded] = useState(false);
  const [attempted, setAttempted] = useState(false),
    [reading, setReading] = useState(false);
  const inputRevision = useRef(0);
  const batch = useRef<{ current: () => boolean } | null>(null);
  useEffect(
    () => () => {
      batch.current = null;
      inputRevision.current++;
    },
    [],
  );
  const finished = rows.length > 0 && rows.every((row) => row.status === "saved");
  const locked = disabled || reading || attempted;
  function showError(error: unknown) {
    setError(
      error instanceof InvitationImportError
        ? `${error.row ? w.row + " " + error.row + ": " : ""}${w[error.reason]}`
        : w.unavailable,
    );
  }
  function replaceInput(value: string) {
    inputRevision.current++;
    batch.current = null;
    setText(value);
    setRows([]);
    setDownloaded(false);
    setError("");
  }
  return (
    <section aria-label={w.title} className="space-y-3 rounded border p-4">
      <h3 className="font-bold">{w.title}</h3>
      <p>{w.help}</p>
      <p>{w.note}</p>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || !catalogues}
        onClick={() =>
          download(
            "invitation-template.json",
            JSON.stringify(
              [
                {
                  email: "learner@example.test",
                  grant_kind: "single_curriculum",
                  scope_mode: "selected",
                  catalogues: [catalogues?.find((c) => isWholeCurriculumCatalogue(c.id))?.id ?? ""],
                  duration_days: 30,
                  invitation: false,
                  locale,
                },
              ],
              null,
              2,
            ),
            "application/json",
          )
        }
      >
        {w.template}
      </Button>
      <details>
        <summary>{labels.selected}</summary>
        <ul>
          {catalogues?.map((c) => (
            <li key={c.id}>
              {c.titles?.[locale] ?? c.title}: <bdi>{c.id}</bdi>
            </li>
          ))}
        </ul>
      </details>
      <label className="block">
        {w.file}
        <input
          type="file"
          accept=".json,application/json"
          disabled={locked}
          onChange={async (e) => {
            const current = captureOwner();
            const file = e.target.files?.[0];
            if (!file || !current()) return;
            const revision = ++inputRevision.current;
            batch.current = null;
            setReading(true);
            setRows([]);
            setDownloaded(false);
            setError("");
            try {
              if (file.size > 8_000_000) throw new InvitationImportError(0, "format");
              const content = await file.text();
              if (current() && revision === inputRevision.current) {
                replaceInput(content);
                setReading(false);
              }
            } catch (error) {
              if (current() && revision === inputRevision.current) {
                showError(error);
                setReading(false);
              }
            }
          }}
        />
      </label>
      <label className="block">
        {w.input}
        <textarea
          disabled={locked}
          value={text}
          maxLength={2_000_000}
          onChange={(e) => replaceInput(e.target.value)}
          className="block w-full rounded border bg-background p-2"
        />
      </label>
      <Button
        type="button"
        disabled={locked || !catalogues || !text}
        onClick={() => {
          const current = captureOwner();
          if (!current()) return;
          batch.current = null;
          setRows([]);
          setDownloaded(false);
          setError("");
          try {
            const prepared = prepareInvitationImport(text, catalogues!);
            if (!current()) return;
            batch.current = { current };
            setRows(prepared);
          } catch (error) {
            showError(error);
          }
        }}
      >
        {w.prepare}
      </Button>
      {rows.length > 0 && (
        <>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => {
              if (!batch.current?.current()) return;
              download("invitation-resume.json", exportInvitationImport(rows), "application/json");
              setDownloaded(true);
            }}
          >
            {w.download}
          </Button>
          <Button
            type="button"
            disabled={disabled || !downloaded || !catalogues || finished}
            onClick={async () => {
              const ownedBatch = batch.current;
              const current = () =>
                !!ownedBatch && batch.current === ownedBatch && ownedBatch.current();
              if (!current() || !acquire()) return;
              setAttempted(true);
              setError("");
              try {
                await executeInvitationImport(
                  rows,
                  catalogues!,
                  (input) => {
                    if (!current()) throw new Error("EMAIL_ACCESS_ACCOUNT_CHANGED");
                    return command({ data: { ...input, expectedAccountId } });
                  },
                  (next) => {
                    if (current()) setRows(next);
                  },
                  current,
                );
                if (current()) await onSaved(current);
              } catch (error) {
                if (current()) showError(error);
              } finally {
                if (current()) release();
              }
            }}
          >
            {w.execute}
          </Button>
          <ol className="space-y-2">
            {rows.map((row, index) => (
              <li key={row.data.key}>
                {w.row} {index + 1}: <bdi>{row.data.email}</bdi> ·{" "}
                {row.data.grant_kind === "single_curriculum" ? labels.single : labels.comprehensive}
                {" · "}
                {row.data.scope_mode === "all_published"
                  ? labels.all
                  : row.data.catalogues.join(", ")}
                {" · "}
                {row.data.duration_days === null
                  ? labels.permanent
                  : row.data.duration_days + " " + labels.days}
                {" · "}
                {row.data.locale} · {row.data.invitation ? labels.invitation : labels.none}
                <p role="status">{w[row.status]}</p>
              </li>
            ))}
          </ol>
          {finished && (
            <Button
              type="button"
              disabled={disabled}
              onClick={() => {
                setAttempted(false);
                replaceInput("");
              }}
            >
              {w.reset}
            </Button>
          )}
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
