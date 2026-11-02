import { useCallback, useEffect, useRef, useState } from "react";
export type ActivityValues = Record<string, string | number>;
type Pending = { requestId: string; revision: number; submission: ActivityValues };
type Reply = { state: "draft_saved" | "draft_conflict"; revision: number; draft?: ActivityValues };
const same = (a: object, b: object) => JSON.stringify(a) === JSON.stringify(b);
export function readActivityDraft(raw: string | null, attemptId: string) {
  try {
    if (!raw || raw.length > 150000) return null;
    const p = JSON.parse(raw) as { attemptId: string; values: ActivityValues; pending?: Pending };
    const values = (x: unknown): x is ActivityValues =>
      !!x &&
      typeof x === "object" &&
      !Array.isArray(x) &&
      Object.entries(x).every(
        ([k, v]) =>
          /^[A-Za-z0-9-]{1,80}$/.test(k) &&
          ((typeof v === "string" && v.length <= 5000) ||
            (typeof v === "number" && Number.isSafeInteger(v) && v >= 0 && v <= 9)),
      );
    if (
      p.attemptId !== attemptId ||
      !values(p.values) ||
      (p.pending &&
        (!values(p.pending.submission) ||
          !Number.isSafeInteger(p.pending.revision) ||
          !/^[a-f0-9-]{36}$/i.test(p.pending.requestId)))
    )
      return null;
    return p;
  } catch {
    return null;
  }
}

/** One saved attempt/version/learner at a time. Lost acknowledgments retain the
 * exact request identity; another device's edits require an explicit choice. */
export function useActivityDraft(options: {
  storageKey: string;
  attemptId: string | null;
  initial: ActivityValues;
  revision: number;
  current(): boolean;
  save(p: Pending): Promise<Reply>;
}) {
  const [values, setValues] = useState<ActivityValues>(() => {
    try {
      return options.attemptId
        ? (readActivityDraft(localStorage.getItem(options.storageKey), options.attemptId)?.values ??
            options.initial)
        : options.initial;
    } catch {
      return options.initial;
    }
  });
  const [state, setState] = useState<"saved" | "dirty" | "saving" | "unconfirmed" | "conflict">(
    "saved",
  );
  const [pulse, tick] = useState(0);
  const mounted = useRef(true);
  const working = useRef(false);
  const latest = useRef(values);
  latest.current = values;
  const cloud = useRef({ values: options.initial, revision: options.revision });
  const pending = useRef<Pending | null>(null);
  const conflict = useRef<{ values: ActivityValues; revision: number } | null>(null);
  const opts = useRef(options);
  opts.current = options;
  const attempt = useRef(options.attemptId);
  const persist = useCallback(() => {
    if (!opts.current.attemptId || !mounted.current || !opts.current.current()) return;
    try {
      if (same(latest.current, cloud.current.values) && !pending.current)
        localStorage.removeItem(opts.current.storageKey);
      else
        localStorage.setItem(
          opts.current.storageKey,
          JSON.stringify({
            attemptId: opts.current.attemptId,
            values: latest.current,
            pending: pending.current,
          }),
        );
    } catch {
      /* The unsaved state stays visible; no false cloud confirmation. */
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    const initial = opts.current;
    if (initial.attemptId) {
      try {
        pending.current =
          readActivityDraft(localStorage.getItem(initial.storageKey), initial.attemptId)?.pending ??
          null;
      } catch {
        /* No unscoped recovery. */
      }
      if (!same(latest.current, cloud.current.values) || pending.current) {
        setState("dirty");
        tick((x) => x + 1);
      }
    }
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    const selected = opts.current;
    if (attempt.current !== selected.attemptId) {
      attempt.current = selected.attemptId;
      pending.current = null;
      conflict.current = null;
      cloud.current = { values: selected.initial, revision: selected.revision };
      let recovered: ReturnType<typeof readActivityDraft> = null;
      try {
        if (selected.attemptId)
          recovered = readActivityDraft(
            localStorage.getItem(selected.storageKey),
            selected.attemptId,
          );
      } catch {
        /* Exact owner/attempt only. */
      }
      pending.current = recovered?.pending ?? null;
      latest.current = recovered?.values ?? selected.initial;
      setValues(latest.current);
      setState(recovered ? "dirty" : "saved");
      if (recovered) tick((x) => x + 1);
    }
  }, [options.attemptId]);
  useEffect(() => {
    if (options.revision <= cloud.current.revision || pending.current || working.current) return;
    if (!same(latest.current, cloud.current.values)) {
      conflict.current = { values: options.initial, revision: options.revision };
      setState("conflict");
      return;
    }
    cloud.current = { values: options.initial, revision: options.revision };
    latest.current = options.initial;
    setValues(options.initial);
    setState("saved");
  }, [options.revision, options.initial]);
  const flush = useCallback(async () => {
    const captured = opts.current;
    const owns = () =>
      mounted.current && captured.current() && opts.current.attemptId === captured.attemptId;
    if (!owns() || !captured.attemptId || working.current || conflict.current) return;
    if (!pending.current && same(latest.current, cloud.current.values)) return;
    working.current = true;
    pending.current ??= {
      requestId: crypto.randomUUID(),
      revision: cloud.current.revision,
      submission: { ...latest.current },
    };
    const sent = pending.current;
    persist();
    setState("saving");
    try {
      const reply = await captured.save(sent);
      if (!owns()) return;
      if (reply.state === "draft_conflict" && !same(reply.draft ?? {}, sent.submission)) {
        conflict.current = { values: reply.draft ?? {}, revision: reply.revision };
        setState("conflict");
        return;
      }
      cloud.current = { values: sent.submission, revision: reply.revision };
      pending.current = null;
      persist();
      const dirty = !same(latest.current, sent.submission);
      setState(dirty ? "dirty" : "saved");
      if (dirty) tick((x) => x + 1);
    } catch {
      if (owns()) {
        setState("unconfirmed");
        persist();
      }
    } finally {
      working.current = false;
      if (
        mounted.current &&
        opts.current.current() &&
        opts.current.attemptId !== captured.attemptId
      )
        tick((x) => x + 1);
    }
  }, [persist]);
  useEffect(() => {
    if (!options.attemptId || conflict.current) return;
    persist();
    const timer = setTimeout(() => {
      void flush();
    }, 1000);
    return () => clearTimeout(timer);
  }, [values, options.attemptId, pulse, persist, flush]);
  return {
    values,
    state,
    setValues: (change: ActivityValues | ((previous: ActivityValues) => ActivityValues)) => {
      if (!mounted.current || !opts.current.current()) return;
      const next = typeof change === "function" ? change(latest.current) : change;
      latest.current = next;
      setValues(next);
      if (!conflict.current) setState("dirty");
    },
    retry: flush,
    useCloud: () => {
      if (!conflict.current || !mounted.current || !opts.current.current()) return;
      cloud.current = conflict.current;
      conflict.current = null;
      pending.current = null;
      latest.current = cloud.current.values;
      setValues(cloud.current.values);
      setState("saved");
      persist();
    },
    saveMine: () => {
      if (!conflict.current || !mounted.current || !opts.current.current()) return;
      cloud.current.revision = conflict.current.revision;
      conflict.current = null;
      pending.current = null;
      setState("dirty");
      tick((x) => x + 1);
    },
    clear: () => {
      try {
        localStorage.removeItem(opts.current.storageKey);
      } catch {
        /* Cloud submission remains authoritative. */
      }
    },
  };
}
