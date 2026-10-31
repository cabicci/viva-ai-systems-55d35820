import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale/locale-context";
import { PATHS } from "@/lib/curriculum-data";
import { getCurriculumPathLabel } from "@/lib/locale-curriculum/resolve-curriculum-label";
import { getPathDefinition } from "@/lib/path-story";
import { Button } from "@/components/ui/button";
import { freeAccessCommand } from "@/lib/commerce/free-access.functions";
import {
  cairoInputToUtc,
  utcToCairoInput,
  freeAccessCopy,
  type FreeAccessAdminData,
  type FreeAccessInput,
  type FreeAccessWindow,
} from "@/lib/commerce/free-access";

export function AdminFreeAccess() {
  const { user } = useAuth();
  const { locale } = useLocale(),
    w = freeAccessCopy(locale);
  const command = useServerFn(freeAccessCommand),
    qc = useQueryClient();
  const result = useQuery({
    queryKey: ["free-access-admin", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await command({ data: { action: "list", data: {} } })) as unknown as FreeAccessAdminData,
    refetchOnWindowFocus: "always",
    refetchInterval: 30_000,
  });
  const [editing, setEditing] = useState<FreeAccessWindow | null>(null);
  const [title, setTitle] = useState(""),
    [targets, setTargets] = useState<string[]>([]);
  const [start, setStart] = useState(""),
    [end, setEnd] = useState("");
  const [enabled, setEnabled] = useState(true),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const running = useRef(false),
    retry = useRef<{ fingerprint: string; key: string } | null>(null);
  function reset() {
    setEditing(null);
    setTitle("");
    setTargets([]);
    setStart("");
    setEnd("");
    setEnabled(true);
  }
  function edit(row: FreeAccessWindow) {
    setEditing(row);
    setTitle(row.title);
    setTargets(row.targets);
    setStart(utcToCairoInput(row.starts_at));
    setEnd(utcToCairoInput(row.ends_at));
    setEnabled(row.enabled);
    setNotice("");
    setError("");
  }
  async function save(
    values: Omit<FreeAccessInput["data"], "key"> & {
      title: string;
      targets: string[];
      starts_at: string;
      ends_at: string;
      enabled: boolean;
    },
    row: FreeAccessWindow | null,
  ) {
    if (running.current) return;
    const parameters = row ? { ...values, id: row.id, expected_version: row.version } : values;
    const fingerprint = JSON.stringify(parameters);
    if (retry.current?.fingerprint !== fingerprint)
      retry.current = { fingerprint, key: crypto.randomUUID() };
    const data = { ...parameters, key: retry.current.key };
    running.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await command({
        data: (row ? { action: "update", data } : { action: "create", data }) as FreeAccessInput,
      });
      retry.current = null;
      reset();
      await qc.invalidateQueries({ queryKey: ["free-access-admin", user?.id] });
      await qc.invalidateQueries({ queryKey: ["scheduled-free-access"] });
      setNotice(w.saved);
    } catch {
      setError(w.error);
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  const label = (id: string) => {
    const t = result.data?.targets.find((t) => t.id === id);
    if (id === "ai") return getPathDefinition("ai", locale).title;
    if (id === "kids") return getPathDefinition("kids", locale).title;
    if (id === "technical:furniture") return getPathDefinition("technical", locale).title;
    if (id.startsWith("ai:")) {
      const path = PATHS.find((p) => p.id === id.slice(3));
      if (path) return getCurriculumPathLabel(locale, path.id, "title");
    }
    return t?.titles?.[locale] ?? t?.title ?? id;
  };
  const date = (value: string) =>
    new Date(value).toLocaleString(locale === "en" ? "en-GB" : "ar-EG", {
      timeZone: "Africa/Cairo",
    });
  const inputClass = "block min-h-11 w-full rounded border bg-background px-3";
  return (
    <section aria-label={w.title} className="space-y-5">
      <h2 className="text-lg font-bold">{w.title}</h2>
      <p className="text-sm text-muted-foreground">{w.note}</p>
      <Button variant="outline" disabled={busy} onClick={() => void result.refetch()}>
        {w.refresh}
      </Button>
      {(error || result.isError) && (
        <p role="alert" className="text-destructive">
          {error || w.error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      <form
        className="space-y-3 rounded border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            const starts_at = cairoInputToUtc(start),
              ends_at = cairoInputToUtc(end);
            if (starts_at >= ends_at) throw new Error("INVALID_RANGE");
            void save(
              { title: title.trim(), targets: [...targets].sort(), starts_at, ends_at, enabled },
              editing,
            );
          } catch {
            setError(w.dates);
          }
        }}
      >
        <fieldset disabled={busy || !result.data} className="space-y-3">
          <label className="block">
            {w.name}
            <input
              className={inputClass}
              required
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <fieldset className="grid gap-2 sm:grid-cols-2">
            <legend>{w.targets}</legend>
            {result.data?.targets.map((t) => (
              <label key={t.id} className="flex items-start gap-2 py-1">
                <input
                  type="checkbox"
                  checked={targets.includes(t.id)}
                  onChange={(e) =>
                    setTargets((old) =>
                      e.target.checked ? [...old, t.id] : old.filter((id) => id !== t.id),
                    )
                  }
                />
                <span>
                  {label(t.id)}
                  {!t.published && (
                    <small className="block text-muted-foreground">{w.unpublished}</small>
                  )}
                </span>
              </label>
            ))}
          </fieldset>
          <label className="block">
            {w.start}
            <input
              className={inputClass}
              type="datetime-local"
              required
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label className="block">
            {w.end}
            <input
              className={inputClass}
              type="datetime-local"
              required
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            {w.enabled}
          </label>
          <Button type="submit" disabled={!targets.length}>
            {editing ? w.save : w.create}
          </Button>
          {editing && (
            <Button type="button" variant="outline" onClick={reset}>
              {w.cancel}
            </Button>
          )}
        </fieldset>
      </form>
      {!result.isPending && !result.data?.windows.length && <p>{w.empty}</p>}
      {result.data?.windows.map((row) => (
        <article key={row.id} className="space-y-2 rounded border p-4">
          <h3 className="font-bold">
            {row.title} — {w[row.status]}
          </h3>
          <p>{row.targets.map(label).join(" · ")}</p>
          <p>
            {date(row.starts_at)} — {date(row.ends_at)}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={busy} onClick={() => edit(row)}>
              {w.edit}
            </Button>
            <Button
              variant="outline"
              disabled={busy || row.status === "expired"}
              onClick={() =>
                void save(
                  {
                    title: row.title,
                    targets: row.targets,
                    starts_at: row.starts_at,
                    ends_at: row.ends_at,
                    enabled: !row.enabled,
                  },
                  row,
                )
              }
            >
              {row.enabled ? w.pause : w.resume}
            </Button>
          </div>
        </article>
      ))}
      {!!result.data?.audit.length && (
        <details>
          <summary>{w.audit}</summary>
          <ul>
            {result.data.audit.map((a, i) => (
              <li key={i}>
                {result.data?.windows.find((row) => row.id === a.window_id)?.title} —{" "}
                {a.action === "create" ? w.create : w.edit} — {date(a.created_at)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
