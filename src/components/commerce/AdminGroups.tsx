import { download, packages, instant, dayInput, localDateInput } from "@/lib/commerce/admin-ui";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { AdminData, Recipient } from "@/lib/commerce/contracts";
import { deliveryLabel, type CommerceCopy } from "@/lib/commerce/copy";
import {
  previewCommerceInvitation,
  dispatchCommerceInvitations,
} from "@/lib/commerce/commerce.functions";
import {
  IMPORT_COLUMNS,
  parseCsv,
  parseXlsx,
  previewImport,
  importTemplateXlsx,
  exportCsv,
  type ImportTable,
  type ImportColumn,
  type ImportPreviewRow,
} from "@/lib/commerce/imports";
import { Button } from "@/components/ui/button";
import { Field, Select, Panel, Check, type RunCommand } from "./AdminShared";
export function AdminGroups({
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
  const [name, setName] = useState(""),
    [group, setGroup] = useState(""),
    [paste, setPaste] = useState(""),
    [table, setTable] = useState<ImportTable>(),
    [previewPage, setPreviewPage] = useState(0),
    [mapping, setMapping] = useState<Partial<Record<ImportColumn, number>>>({}),
    [preview, setPreview] = useState<ImportPreviewRow[]>([]),
    [validated, setValidated] = useState(false),
    [localError, setError] = useState(""),
    [selected, setSelected] = useState<string[]>([]),
    [html, setHtml] = useState(""),
    [message, setMessage] = useState("");
  const previewFn = useServerFn(previewCommerceInvitation),
    dispatch = useServerFn(dispatchCommerceInvitations);
  const [defaults, setDefaults] = useState<Partial<Recipient>>({
    locale: "ar-EG",
    package: "pro",
    access_kind: "complimentary",
    duration_days: 30,
    start_rule: "acceptance",
    deadline: instant(dayInput(30)),
    market: "EG",
    billing_interval: "month",
    currency: "EGP",
    method: "instapay",
  });
  useEffect(() => {
    setValidated(false);
  }, [defaults, table, mapping, group]);
  function load(next: ImportTable) {
    setTable(next);
    setPreviewPage(0);
    setMapping(
      Object.fromEntries(
        IMPORT_COLUMNS.flatMap((c) => {
          const i = next.headers.indexOf(c);
          return i < 0 ? [] : [[c, i]];
        }),
      ),
    );
    setPreview([]);
    setValidated(false);
  }
  function validateLocal() {
    if (!table) return;
    setPreview(
      previewImport(
        table,
        mapping,
        defaults,
        new Set(
          data.orders.filter((o) => o.review_status === "confirmed").map((o) => o.recipient_email),
        ),
      ),
    );
    setValidated(false);
  }
  const accepted = preview
    .filter((r) => !r.excluded && r.errors.length === 0 && r.recipient)
    .map((r) => r.recipient!);
  async function verify() {
    setError("");
    const result = await run("preview_import", { group_id: group, rows: accepted });
    if (!result) return;
    const rows = result as {
      email: string;
      existing: boolean;
      imported: boolean;
      error?: string;
      quote: { original_minor: number; final_minor: number };
    }[];
    setPreview((current) =>
      current.map((row) => {
        const checked = rows.find((x) => x.email === row.recipient?.email);
        return checked
          ? {
              ...row,
              errors: checked.error ? [...row.errors, checked.error] : row.errors,
              warnings: [
                ...row.warnings,
                ...(checked.existing ? [w.existing] : []),
                ...(checked.imported ? [w.import + ": " + w.saved] : []),
                ...(checked.quote
                  ? [
                      `${w.original}: ${checked.quote.original_minor}; ${w.amount}: ${row.recipient?.final_minor ?? checked.quote.final_minor}`,
                    ]
                  : []),
              ],
            }
          : row;
      }),
    );
    setValidated(!rows.some((x) => x.error));
  }
  const invitations = data.invitations.filter((i) => i.group_id === group);
  return (
    <Panel title={w.groups}>
      <p>{w.sentNote}</p>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const result = (await run("create_group", { name })) as { id: string } | undefined;
          if (result) setGroup(result.id);
        }}
      >
        <Field label={w.groupName} value={name} onChange={setName} required />
        <Button disabled={busy} type="submit">
          {w.create}
        </Button>
      </form>
      <Select
        label={w.groupName}
        value={group}
        onChange={(v) => {
          setGroup(v);
          setValidated(false);
          setSelected([]);
        }}
        options={[["", w.select], ...data.groups.map((g) => [g.id, g.name] as const)]}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Select
          label={w.locale}
          value={defaults.locale!}
          onChange={(locale) => {
            setDefaults({ ...defaults, locale: locale as Recipient["locale"] });
            setValidated(false);
          }}
          options={["ar-EG", "ar-MSA", "ar-Gulf", "en"]}
        />
        <Select
          label={w.package}
          value={defaults.package!}
          onChange={(pack) => setDefaults({ ...defaults, package: pack as Recipient["package"] })}
          options={packages}
        />
        <Select
          label={w.kind}
          value={defaults.access_kind!}
          onChange={(v) => setDefaults({ ...defaults, access_kind: v as Recipient["access_kind"] })}
          options={[
            ["complimentary", w.complimentary],
            ["external", w.external],
          ]}
        />
        <Field
          label={w.days}
          value={defaults.duration_days!}
          type="number"
          onChange={(x) => setDefaults({ ...defaults, duration_days: Number(x) })}
        />
        <Select
          label={w.start}
          value={defaults.start_rule!}
          onChange={(v) =>
            setDefaults({
              ...defaults,
              start_rule: v as Recipient["start_rule"],
              requested_start:
                v === "date" ? (defaults.requested_start ?? instant(dayInput(1))) : undefined,
            })
          }
          options={[
            ["acceptance", w.acceptance],
            ["date", w.date],
            ["after_expiry", w.after_expiry],
          ]}
        />
        {defaults.start_rule === "date" && (
          <Field
            label={w.date}
            value={
              defaults.requested_start ? localDateInput(defaults.requested_start) : dayInput(1)
            }
            type="datetime-local"
            onChange={(v) => setDefaults({ ...defaults, requested_start: instant(v) })}
          />
        )}
        <Field
          label={w.deadline}
          value={localDateInput(defaults.deadline!)}
          type="datetime-local"
          onChange={(v) => setDefaults({ ...defaults, deadline: instant(v) })}
        />
        <Select
          label={w.market}
          value={defaults.market!}
          onChange={(market) =>
            setDefaults({
              ...defaults,
              market: market as Recipient["market"],
              currency: market === "EG" ? "EGP" : "USD",
            })
          }
          options={["EG", "INTL"]}
        />
        <Select
          label={w.interval}
          value={defaults.billing_interval!}
          onChange={(v) =>
            setDefaults({ ...defaults, billing_interval: v as Recipient["billing_interval"] })
          }
          options={[
            ["month", w.month],
            ["year", w.year],
          ]}
        />
        <Select
          label={w.methods}
          value={defaults.method!}
          onChange={(v) => setDefaults({ ...defaults, method: v as Recipient["method"] })}
          options={[
            ["instapay", w.instapay],
            ["wallet", w.wallet],
            ["bank", w.bank],
          ]}
        />
        <Field
          label={w.original}
          value={defaults.original_minor ?? ""}
          type="number"
          onChange={(x) =>
            setDefaults({ ...defaults, original_minor: x === "" ? undefined : Number(x) })
          }
        />
        <Field
          label={w.amount}
          value={defaults.final_minor ?? ""}
          type="number"
          onChange={(x) =>
            setDefaults({ ...defaults, final_minor: x === "" ? undefined : Number(x) })
          }
        />
      </div>
      <p>{w.currencyNotice}</p>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() =>
            download(
              "Masaarat_Recipients_Template.xlsx",
              importTemplateXlsx(),
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
          }
        >
          {w.template}
        </Button>
        <label className="grid gap-1 min-w-0 max-w-full">
          {w.file}
          <input
            className="block w-full min-w-0"
            type="file"
            accept=".csv,.xlsx"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setError("");
              try {
                if (file.size > 5242880) throw new Error(w.error);
                load(
                  file.name.toLowerCase().endsWith(".xlsx")
                    ? parseXlsx(new Uint8Array(await file.arrayBuffer()))
                    : parseCsv(await file.text()),
                );
              } catch (error) {
                setError(error instanceof Error ? error.message : w.error);
              }
            }}
          />
        </label>
      </div>
      <label className="block">
        {w.paste}
        <textarea
          className="min-h-28 w-full rounded border bg-background p-2"
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
        />
      </label>
      <Button
        variant="outline"
        onClick={() => {
          try {
            load(
              parseCsv(
                paste.includes(",")
                  ? paste
                  : "email\n" +
                      paste
                        .split(/[;\s]+/)
                        .filter(Boolean)
                        .join("\n"),
              ),
            );
            setError("");
          } catch {
            setError(w.error);
          }
        }}
      >
        {w.preview}
      </Button>
      {table && (
        <>
          <h3 className="font-semibold">{w.mapping}</h3>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {IMPORT_COLUMNS.map((column) => (
              <Select
                key={column}
                label={column}
                value={String(mapping[column] ?? "")}
                onChange={(v) => {
                  setMapping({ ...mapping, [column]: v === "" ? undefined : Number(v) });
                  setValidated(false);
                }}
                options={[["", w.select], ...table.headers.map((x, i) => [String(i), x] as const)]}
              />
            ))}
          </div>
          <Button onClick={validateLocal}>{w.preview}</Button>
          <p>{w.editRows}</p>
          <div className="max-h-96 overflow-auto rounded border">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>{w.exclude}</th>
                  {table.headers.map((x, i) => (
                    <th key={i} className="p-2">
                      {x}
                    </th>
                  ))}
                  <th>{w.errors}</th>
                </tr>
              </thead>
              <tbody>
                {table.rows
                  .slice(previewPage * 100, (previewPage + 1) * 100)
                  .map((cells, offset) => {
                    const i = previewPage * 100 + offset;
                    return (
                      <tr key={i} className="border-t">
                        <td>
                          <Check
                            label={String(i + 2)}
                            checked={preview[i]?.excluded ?? false}
                            onChange={(excluded) => {
                              setPreview((current) =>
                                current.map((r, j) => (j === i ? { ...r, excluded } : r)),
                              );
                              setValidated(false);
                            }}
                          />
                        </td>
                        {table.headers.map((header, j) => (
                          <td key={j}>
                            <input
                              aria-label={`${header} ${i + 2}`}
                              className="min-h-11 min-w-36 bg-background p-2"
                              value={cells[j] ?? ""}
                              onChange={(e) => {
                                setTable({
                                  ...table,
                                  rows: table.rows.map((row, index) =>
                                    index === i
                                      ? Array.from({ length: table.headers.length }, (_, col) =>
                                          col === j ? e.target.value : (row[col] ?? ""),
                                        )
                                      : row,
                                  ),
                                });
                                setPreview([]);
                                setValidated(false);
                              }}
                            />
                          </td>
                        ))}
                        <td className="min-w-64 p-2">
                          {preview[i]?.errors.join("; ")} {preview[i]?.warnings.join("; ")}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              disabled={previewPage === 0}
              onClick={() => setPreviewPage(previewPage - 1)}
            >
              {w.back}
            </Button>
            <span>
              {previewPage + 1} / {Math.ceil(table.rows.length / 100)}
            </span>
            <Button
              variant="outline"
              disabled={(previewPage + 1) * 100 >= table.rows.length}
              onClick={() => setPreviewPage(previewPage + 1)}
            >
              {w.continue}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() =>
                download(
                  "Masaarat_Import_Validation.csv",
                  exportCsv(
                    ["row", "email", "errors", "warnings"],
                    preview.map((r) => [
                      r.index,
                      r.raw.email,
                      r.errors.join("; "),
                      r.warnings.join("; "),
                    ]),
                  ),
                )
              }
            >
              {w.errorReport}
            </Button>
            <Button disabled={busy || !group || !accepted.length} onClick={() => void verify()}>
              {w.quote}
            </Button>
            <Button
              disabled={
                busy ||
                !validated ||
                !accepted.length ||
                preview.some((r) => !r.excluded && r.errors.length)
              }
              onClick={async () => {
                const result = await run("import", { group_id: group, rows: accepted });
                if (result) {
                  setValidated(false);
                  setPreview([]);
                  setTable(undefined);
                }
              }}
            >
              {w.import} ({accepted.length})
            </Button>
          </div>
        </>
      )}
      {group && (
        <>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void run("group_state", { id: group, state: "paused" })}
            >
              {w.pause}
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void run("group_state", { id: group, state: "ready" })}
            >
              {w.resume}
            </Button>
            <Button
              disabled={busy || !selected.length}
              onClick={() => void run("queue", { ids: selected })}
            >
              {w.send}
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                setError("");
                try {
                  const result = await dispatch({ data: { groupId: group } });
                  setMessage(`${w.sent}: ${result.accepted} / ${result.claimed}`);
                } catch {
                  setError(w.error);
                }
              }}
            >
              {w.dispatch}
            </Button>
          </div>
          <p>
            {data.groups.find((x) => x.id === group)?.send_state === "paused" ? w.paused : w.ready}{" "}
            · {message}
          </p>
          <div className="space-y-2">
            {invitations.map((i) => (
              <article key={i.id} className="flex flex-wrap items-center gap-3 rounded border p-3">
                <Check
                  label={i.email}
                  checked={selected.includes(i.id)}
                  onChange={(yes) =>
                    setSelected((current) =>
                      yes ? [...current, i.id] : current.filter((id) => id !== i.id),
                    )
                  }
                />
                <span>
                  {i.package} · {i.revoked_at ? w.revoked : i.accepted_at ? w.accepted : w.pending}{" "}
                  · {deliveryLabel(i.delivery, w)} · {w[i.send_status as "unknown"] ?? w.not_sent}
                </span>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={async () => {
                    try {
                      const content = await previewFn({ data: { id: i.id } });
                      setHtml(content.html);
                    } catch {
                      setError(w.error);
                    }
                  }}
                >
                  {w.mailPreview}
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void run("revoke_invitation", { id: i.id, reason: w.inviteRevoked })
                  }
                >
                  {w.inviteRevoked}
                </Button>
                {i.send_status === "unknown" && (
                  <MailReconcile id={i.id} w={w} run={run} busy={busy} />
                )}
              </article>
            ))}
          </div>
        </>
      )}
      {html && (
        <div>
          <Button variant="outline" onClick={() => setHtml("")}>
            {w.back}
          </Button>
          <iframe
            title={w.mailPreview}
            sandbox=""
            srcDoc={html}
            className="h-[650px] w-full rounded border"
          />
        </div>
      )}
      {localError && (
        <p role="alert" className="text-destructive">
          {localError}
        </p>
      )}
    </Panel>
  );
}

function MailReconcile({
  id,
  w,
  run,
  busy,
}: {
  id: string;
  w: CommerceCopy;
  run: RunCommand;
  busy: boolean;
}) {
  const [provider, setProvider] = useState(""),
    [reason, setReason] = useState("");
  return (
    <form
      className="flex flex-wrap gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        void run("reconcile_mail", { id, provider_id: provider, reason });
      }}
    >
      <Field label={w.reference} value={provider} onChange={setProvider} required />
      <Field label={w.reason} value={reason} onChange={setReason} required />
      <Button type="submit" disabled={busy || !provider || !reason}>
        {w.save}
      </Button>
    </form>
  );
}
