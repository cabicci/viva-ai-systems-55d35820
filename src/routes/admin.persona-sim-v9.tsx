import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";

import { requireAdminBeforeLoad } from "@/lib/admin-route-guard";
import {
  getPersonaSimV9AbRaw,
  getPersonaSimV9Suggestions,
} from "@/lib/persona-sim.functions";

export const Route = createFileRoute("/admin/persona-sim-v9")({
  beforeLoad: requireAdminBeforeLoad,
  head: () => ({ meta: [{ title: "Persona Sim v9 — مقارنة الترتيب" }] }),
  component: () => (
    <AdminGate>
      <PersonaSimV9Page />
    </AdminGate>
  ),
});

type Block = { card: string; accent: string };
type SuggestionEntry = {
  current: Array<{ i: number; card: string; accent: string }>;
  suggestion: {
    suggested_order?: number[];
    rationale?: string;
    changes?: string[];
    needs_change?: boolean;
    error?: string;
  };
};
type Suggestions = Record<string, SuggestionEntry>;

type AbRow = {
  agent_id: string;
  persona: string;
  lesson_id: string;
  scores_current?: Record<string, number> | null;
  scores_suggested?: Record<string, number> | null;
  preference?: "current" | "suggested" | "neutral" | null;
  reason?: string | null;
  error?: string;
};

const METRICS = [
  "visual_clarity",
  "hierarchy_strength",
  "color_harmony",
  "block_order_logic",
  "accent_appropriateness",
  "cta_prominence",
  "mobile_readability_guess",
];

const METRIC_AR: Record<string, string> = {
  visual_clarity: "وضوح بصري",
  hierarchy_strength: "قوة الهرم",
  color_harmony: "تناغم الألوان",
  block_order_logic: "منطق الترتيب",
  accent_appropriateness: "ملاءمة اللون",
  cta_prominence: "بروز CTA",
  mobile_readability_guess: "قراءة موبايل",
};

const ACCENT_COLOR: Record<string, string> = {
  mint: "var(--pastel-mint)",
  lavender: "var(--pastel-lavender)",
  peach: "var(--pastel-peach)",
  yellow: "var(--pastel-yellow)",
  pink: "var(--pastel-pink)",
  mintDeep: "var(--accent)",
};

const CARD_LABEL: Record<string, string> = {
  TitleCard: "Title",
  ConceptCard: "Concept",
  BigStatCard: "BigStat",
  BulletsCard: "Bullets",
  CompareCard: "Compare",
  CTACard: "CTA",
  ScreenshotCard: "Shot",
};

function avg(vals: Array<number | null | undefined>) {
  const nums = vals.filter((v): v is number => typeof v === "number");
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function reorder(
  current: SuggestionEntry["current"],
  order: number[] | undefined,
): Block[] {
  if (!order) return current.map((c) => ({ card: c.card, accent: c.accent }));
  const byI = new Map(current.map((c) => [c.i, c]));
  return order
    .map((i) => byI.get(i))
    .filter((c): c is SuggestionEntry["current"][number] => Boolean(c))
    .map((c) => ({ card: c.card, accent: c.accent }));
}

function BlockTile({ block, idx }: { block: Block; idx: number }) {
  const bg = ACCENT_COLOR[block.accent] ?? "var(--muted)";
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border-2 px-2 py-3 text-center min-w-[68px]"
      style={{ backgroundColor: bg, borderColor: bg }}
    >
      <div className="text-[10px] font-mono text-slate-700/70">{idx + 1}</div>
      <div className="text-xs font-semibold text-slate-900">
        {CARD_LABEL[block.card] ?? block.card}
      </div>
      <div className="text-[9px] text-slate-700/70 mt-0.5">{block.accent}</div>
    </div>
  );
}

function BlockRow({ blocks, label }: { blocks: Block[]; label: string }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {blocks.map((b, i) => (
          <BlockTile key={i} block={b} idx={i} />
        ))}
      </div>
    </div>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  const map: Record<string, string> = {
    apply: "bg-emerald-100 text-emerald-800 border-emerald-300",
    keep: "bg-slate-100 text-slate-700 border-slate-300",
    iterate: "bg-amber-100 text-amber-800 border-amber-300",
    suggested: "bg-emerald-100 text-emerald-800 border-emerald-300",
    current: "bg-rose-100 text-rose-800 border-rose-300",
    neutral: "bg-slate-100 text-slate-700 border-slate-300",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-bold border ${map[decision] ?? map.iterate}`}
    >
      {decision}
    </span>
  );
}

type LessonRow = {
  lessonId: string;
  current: Block[];
  suggested: Block[];
  rationale: string;
  changes: string[];
  curOverall: number | null;
  sugOverall: number | null;
  delta: number;
  pctSuggested: number;
  nSug: number;
  nCur: number;
  nNeu: number;
  n: number;
  decision: string;
  metricBreakdown: Array<{
    metric: string;
    cur: number | null;
    sug: number | null;
    delta: number;
  }>;
  reasons: Array<{
    persona: string;
    pref: "current" | "suggested" | "neutral" | null;
    reason: string;
    curAvg: number | null;
    sugAvg: number | null;
  }>;
};

function LessonCard({ r }: { r: LessonRow }) {
  const [expanded, setExpanded] = useState(false);
  const [prefFilter, setPrefFilter] = useState<
    "all" | "suggested" | "current" | "neutral"
  >("all");

  const filteredReasons = useMemo(
    () =>
      prefFilter === "all"
        ? r.reasons
        : r.reasons.filter((x) => x.pref === prefFilter),
    [r.reasons, prefFilter],
  );

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <code className="text-sm font-mono font-semibold">{r.lessonId}</code>
          <DecisionBadge decision={r.decision} />
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span>
            Δ{" "}
            <strong className={r.delta > 0 ? "text-emerald-600" : "text-rose-600"}>
              {r.delta > 0 ? "+" : ""}
              {r.delta}
            </strong>
          </span>
          <span className="text-muted-foreground">
            {r.pctSuggested}% فضّلوا المقترح ({r.nSug}/{r.n})
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <BlockRow
          blocks={r.current}
          label={`الحالي · overall ${r.curOverall?.toFixed(2) ?? "—"}`}
        />
        <BlockRow
          blocks={r.suggested}
          label={`المقترح · overall ${r.sugOverall?.toFixed(2) ?? "—"}`}
        />
      </div>

      {r.rationale && (
        <div className="text-sm bg-muted/40 rounded-lg p-3">
          <span className="font-semibold">المنطق: </span>
          {r.rationale}
        </div>
      )}

      {r.changes.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1 mr-4 list-disc">
          {r.changes.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground">
          تفصيل الـ metrics (المقترح vs الحالي)
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {r.metricBreakdown.map((m) => (
            <div
              key={m.metric}
              className="rounded-md border bg-muted/20 p-2 flex flex-col gap-0.5"
            >
              <span className="text-muted-foreground">{METRIC_AR[m.metric] ?? m.metric}</span>
              <span className="font-mono">
                {m.cur?.toFixed(2) ?? "—"} → {m.sug?.toFixed(2) ?? "—"}{" "}
                <strong
                  className={
                    m.delta > 0
                      ? "text-emerald-600"
                      : m.delta < 0
                        ? "text-rose-600"
                        : "text-muted-foreground"
                  }
                >
                  ({m.delta > 0 ? "+" : ""}
                  {m.delta.toFixed(2)})
                </strong>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
          آراء الـ {r.reasons.length} agent بالتفصيل
        </Button>
      </div>

      {expanded && (
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            {(["all", "suggested", "current", "neutral"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setPrefFilter(k)}
                className={`px-2 py-1 rounded border ${
                  prefFilter === k
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {k === "all"
                  ? `الكل (${r.reasons.length})`
                  : k === "suggested"
                    ? `فضّلوا المقترح (${r.nSug})`
                    : k === "current"
                      ? `فضّلوا الحالي (${r.nCur})`
                      : `محايد (${r.nNeu})`}
              </button>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            {filteredReasons.map((x, i) => (
              <div key={i} className="rounded-lg border p-3 text-sm bg-muted/10">
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <span className="text-xs font-semibold text-muted-foreground truncate">
                    {x.persona}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {x.curAvg?.toFixed(1) ?? "—"} → {x.sugAvg?.toFixed(1) ?? "—"}
                    </span>
                    <DecisionBadge decision={x.pref ?? "neutral"} />
                  </div>
                </div>
                <p className="leading-relaxed text-sm">{x.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PersonaSimV9Page() {
  const [decisionFilter, setDecisionFilter] = useState<
    "all" | "apply" | "iterate" | "keep"
  >("all");
  const [sortBy, setSortBy] = useState<"delta" | "pct" | "lesson">("delta");

  const fetchSuggestions = useServerFn(getPersonaSimV9Suggestions);
  const fetchAbRaw = useServerFn(getPersonaSimV9AbRaw);

  const sugQ = useQuery<Suggestions>({
    queryKey: ["v9-suggestions"],
    queryFn: () => fetchSuggestions(),
  });
  const abQ = useQuery<AbRow[]>({
    queryKey: ["v9-ab-raw"],
    queryFn: async () => (await fetchAbRaw()) as unknown as AbRow[],
  });

  const rows: LessonRow[] = useMemo(() => {
    if (!sugQ.data || !abQ.data) return [];
    const out: LessonRow[] = [];
    for (const [lid, entry] of Object.entries(sugQ.data)) {
      const sug = entry.suggestion ?? {};
      if (sug.error || !sug.suggested_order) continue;
      const current = entry.current.map((c) => ({ card: c.card, accent: c.accent }));
      const suggested = reorder(entry.current, sug.suggested_order);
      const lessonRows = abQ.data.filter(
        (r) => r.lesson_id === lid && !r.error,
      );
      const curPerAgent = lessonRows.map((r) =>
        avg(METRICS.map((m) => r.scores_current?.[m])),
      );
      const sugPerAgent = lessonRows.map((r) =>
        avg(METRICS.map((m) => r.scores_suggested?.[m])),
      );
      const curOverall = avg(curPerAgent);
      const sugOverall = avg(sugPerAgent);
      const metricBreakdown = METRICS.map((m) => {
        const cur = avg(lessonRows.map((r) => r.scores_current?.[m]));
        const sug2 = avg(lessonRows.map((r) => r.scores_suggested?.[m]));
        return {
          metric: m,
          cur,
          sug: sug2,
          delta: Number((((sug2 ?? 0) - (cur ?? 0)) || 0).toFixed(2)),
        };
      });
      const prefs = lessonRows
        .map((r) => r.preference)
        .filter((p): p is "current" | "suggested" | "neutral" => Boolean(p));
      const nSug = prefs.filter((p) => p === "suggested").length;
      const nCur = prefs.filter((p) => p === "current").length;
      const nNeu = prefs.filter((p) => p === "neutral").length;
      const n = prefs.length;
      const pctSuggested = n ? (100 * nSug) / n : 0;
      const decision =
        pctSuggested >= 70
          ? "apply"
          : nCur / Math.max(n, 1) >= 0.5
            ? "keep"
            : "iterate";
      out.push({
        lessonId: lid,
        current,
        suggested,
        rationale: sug.rationale ?? "",
        changes: sug.changes ?? [],
        curOverall,
        sugOverall,
        delta: Number(((sugOverall ?? 0) - (curOverall ?? 0)).toFixed(2)),
        pctSuggested: Number(pctSuggested.toFixed(1)),
        nSug,
        nCur,
        nNeu,
        n,
        decision,
        metricBreakdown,
        reasons: lessonRows
          .filter((r) => r.reason)
          .map((r) => ({
            persona: r.persona,
            pref: r.preference ?? null,
            reason: r.reason ?? "",
            curAvg: avg(METRICS.map((m) => r.scores_current?.[m])),
            sugAvg: avg(METRICS.map((m) => r.scores_suggested?.[m])),
          })),
      });
    }
    return out;
  }, [sugQ.data, abQ.data]);

  const filtered = useMemo(() => {
    const f =
      decisionFilter === "all"
        ? rows
        : rows.filter((r) => r.decision === decisionFilter);
    const sorted = [...f];
    if (sortBy === "delta") sorted.sort((a, b) => b.delta - a.delta);
    else if (sortBy === "pct") sorted.sort((a, b) => b.pctSuggested - a.pctSuggested);
    else sorted.sort((a, b) => a.lessonId.localeCompare(b.lessonId));
    return sorted;
  }, [rows, decisionFilter, sortBy]);

  const counts = useMemo(
    () => ({
      apply: rows.filter((r) => r.decision === "apply").length,
      keep: rows.filter((r) => r.decision === "keep").length,
      iterate: rows.filter((r) => r.decision === "iterate").length,
    }),
    [rows],
  );

  const loading = sugQ.isLoading || abQ.isLoading;
  const error = sugQ.error || abQ.error;

  return (
    <div className="min-h-dvh bg-background" dir="rtl">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link to="/admin">
              <ArrowLeft className="h-4 w-4 ml-1" /> رجوع للأدمن
            </Link>
          </Button>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold">Persona Sim v9 — مقارنة الترتيب</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {rows.length} درس · ٢٠ agent · {rows.length * 20} تقييم A/B
              </p>
            </div>
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Link to="/admin/v9-review">ابدأ المراجعة اليدوية ←</Link>
            </Button>
          </div>
        </div>

        {!loading && !error && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {(["all", "apply", "iterate", "keep"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setDecisionFilter(k)}
                className={`px-3 py-1.5 rounded-lg border font-medium ${
                  decisionFilter === k
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {k === "all"
                  ? `الكل (${rows.length})`
                  : k === "apply"
                    ? `apply (${counts.apply})`
                    : k === "iterate"
                      ? `iterate (${counts.iterate})`
                      : `keep (${counts.keep})`}
              </button>
            ))}
            <span className="mx-2 text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">ترتيب:</span>
            {(["delta", "pct", "lesson"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setSortBy(k)}
                className={`px-2 py-1 rounded text-xs border ${
                  sortBy === k
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {k === "delta" ? "Δ" : k === "pct" ? "% المقترح" : "اسم الدرس"}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="text-center text-muted-foreground py-12">
            جاري التحميل...
          </div>
        )}
        {error && (
          <div className="text-center text-destructive py-12">
            تعذر تحميل البيانات
          </div>
        )}

        <div className="space-y-4">
          {filtered.map((r) => (
            <LessonCard key={r.lessonId} r={r} />
          ))}
        </div>
      </div>
    </div>
  );
}
