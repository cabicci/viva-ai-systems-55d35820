import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/admin/persona-sim-v9")({
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

const ACCENT_COLOR: Record<string, string> = {
  mint: "#a7f3d0",
  lavender: "#c4b5fd",
  peach: "#fed7aa",
  yellow: "#fde68a",
  pink: "#fbcfe8",
  mintDeep: "#34d399",
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

function avg(vals: Array<number | undefined>) {
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
  const bg = ACCENT_COLOR[block.accent] ?? "#e5e7eb";
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
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-bold border ${map[decision] ?? map.iterate}`}
    >
      {decision}
    </span>
  );
}

function PersonaSimV9Page() {
  const sugQ = useQuery<Suggestions>({
    queryKey: ["v9-suggestions"],
    queryFn: () => fetch("/persona-sim/v9-suggestions.json").then((r) => r.json()),
  });
  const abQ = useQuery<AbRow[]>({
    queryKey: ["v9-ab-raw"],
    queryFn: () => fetch("/persona-sim/v9-ab-raw.json").then((r) => r.json()),
  });

  const rows = useMemo(() => {
    if (!sugQ.data || !abQ.data) return [];
    const out: Array<{
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
      reasons: Array<{ persona: string; pref: string | null; reason: string }>;
    }> = [];
    for (const [lid, entry] of Object.entries(sugQ.data)) {
      const sug = entry.suggestion ?? {};
      if (sug.error || !sug.suggested_order) continue;
      const current = entry.current.map((c) => ({ card: c.card, accent: c.accent }));
      const suggested = reorder(entry.current, sug.suggested_order);
      const lessonRows = abQ.data.filter(
        (r) => r.lesson_id === lid && !r.error,
      );
      const curPerAgent = lessonRows
        .map((r) => avg(METRICS.map((m) => r.scores_current?.[m])))
        .filter((v): v is number => v !== null);
      const sugPerAgent = lessonRows
        .map((r) => avg(METRICS.map((m) => r.scores_suggested?.[m])))
        .filter((v): v is number => v !== null);
      const curOverall = avg(curPerAgent);
      const sugOverall = avg(sugPerAgent);
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
        reasons: lessonRows
          .filter((r) => r.reason)
          .map((r) => ({
            persona: r.persona,
            pref: r.preference ?? null,
            reason: r.reason ?? "",
          })),
      });
    }
    out.sort((a, b) => b.delta - a.delta);
    return out;
  }, [sugQ.data, abQ.data]);

  const loading = sugQ.isLoading || abQ.isLoading;
  const error = sugQ.error || abQ.error;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2">
              <Link to="/admin">
                <ArrowLeft className="h-4 w-4 ml-1" /> رجوع للأدمن
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Persona Sim v9 — مقارنة الترتيب</h1>
            <p className="text-sm text-muted-foreground mt-1">
              ٩٦ درس · ٢٠ agent · ١٩٢٠ تقييم A/B · الترتيب الحالي مقابل المقترح
            </p>
          </div>
        </div>

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
          {rows.map((r) => (
            <div
              key={r.lessonId}
              className="rounded-xl border bg-card p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <code className="text-sm font-mono font-semibold">
                    {r.lessonId}
                  </code>
                  <DecisionBadge decision={r.decision} />
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span>
                    Δ{" "}
                    <strong
                      className={
                        r.delta > 0 ? "text-emerald-600" : "text-rose-600"
                      }
                    >
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
                <div className="space-y-1">
                  <BlockRow
                    blocks={r.current}
                    label={`الحالي · overall ${r.curOverall?.toFixed(2) ?? "—"}`}
                  />
                </div>
                <div className="space-y-1">
                  <BlockRow
                    blocks={r.suggested}
                    label={`المقترح · overall ${r.sugOverall?.toFixed(2) ?? "—"}`}
                  />
                </div>
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

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    آراء الـ {r.reasons.length} agent
                    <ChevronRight className="h-4 w-4 mr-1" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full sm:max-w-lg overflow-y-auto" dir="rtl">
                  <SheetHeader>
                    <SheetTitle>{r.lessonId} — آراء الـ agents</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-3">
                    {r.reasons.map((x, i) => (
                      <div key={i} className="rounded-lg border p-3 text-sm">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-muted-foreground">
                            {x.persona}
                          </span>
                          <DecisionBadge decision={x.pref ?? "neutral"} />
                        </div>
                        <p className="leading-relaxed">{x.reason}</p>
                      </div>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}