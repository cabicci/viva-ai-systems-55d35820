import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, X, Edit3 } from "lucide-react";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { requireAdminBeforeLoad } from "@/lib/admin-route-guard";
import {
  getPersonaSimV9AbRaw,
  getPersonaSimV9Suggestions,
} from "@/lib/persona-sim.functions";

export const Route = createFileRoute("/admin/v9-review")({
  beforeLoad: requireAdminBeforeLoad,
  head: () => ({ meta: [{ title: "v9 Review — مراجعة قرارات Apply" }] }),
  component: () => (
    <AdminGate>
      <V9ReviewPage />
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
  };
};
type Suggestions = Record<string, SuggestionEntry>;

type AbRow = {
  agent_id: string;
  lesson_id: string;
  scores_current?: Record<string, number> | null;
  scores_suggested?: Record<string, number> | null;
  preference?: "current" | "suggested" | "neutral" | null;
  error?: string;
};

type Decision = {
  lesson_id: string;
  decision: "approve" | "edit" | "reject";
  new_order: number[] | null;
  notes: string | null;
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
  QuoteCard: "Quote",
};

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
      className="flex flex-col items-center justify-center rounded-lg border-2 px-2 py-2 text-center min-w-[64px]"
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
    <div className="space-y-1.5">
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {blocks.map((b, i) => (
          <BlockTile key={i} block={b} idx={i} />
        ))}
      </div>
    </div>
  );
}

function V9ReviewPage() {
  const qc = useQueryClient();
  const fetchSuggestions = useServerFn(getPersonaSimV9Suggestions);
  const fetchAbRaw = useServerFn(getPersonaSimV9AbRaw);

  const sugQ = useQuery<Suggestions>({
    queryKey: ["v9-suggestions"],
    queryFn: () => fetchSuggestions(),
  });
  const abQ = useQuery<AbRow[]>({
    queryKey: ["v9-ab"],
    queryFn: async () => (await fetchAbRaw()) as unknown as AbRow[],
  });
  const decisionsQ = useQuery<Decision[]>({
    queryKey: ["v9-decisions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v9_apply_decisions")
        .select("lesson_id, decision, new_order, notes");
      if (error) throw error;
      return (data ?? []) as Decision[];
    },
  });

  const saveMut = useMutation({
    mutationFn: async (d: Decision) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("v9_apply_decisions").upsert(
        {
          lesson_id: d.lesson_id,
          decision: d.decision,
          new_order: d.new_order,
          notes: d.notes,
          decided_by: u.user?.id ?? null,
          decided_at: new Date().toISOString(),
        },
        { onConflict: "lesson_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["v9-decisions"] }),
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "فشل الحفظ"),
  });

  const applyLessons = useMemo(() => {
    if (!sugQ.data || !abQ.data) return [];
    const sugMap = sugQ.data;
    const out: Array<{
      lessonId: string;
      current: Block[];
      suggested: Block[];
      currentOrder: number[];
      suggestedOrder: number[];
      changes: string[];
      rationale: string;
      pctSuggested: number;
    }> = [];

    for (const lid of Object.keys(sugMap)) {
      const entry = sugMap[lid];
      if (!entry?.suggestion?.suggested_order) continue;
      const rows = abQ.data.filter((r) => r.lesson_id === lid && !r.error);
      const prefs = rows
        .map((r) => r.preference)
        .filter((p): p is "current" | "suggested" | "neutral" => Boolean(p));
      const n = prefs.length;
      const nSug = prefs.filter((p) => p === "suggested").length;
      const pct = n ? (100 * nSug) / n : 0;
      if (pct < 70) continue; // only "apply" lessons

      out.push({
        lessonId: lid,
        current: reorder(entry.current, entry.current.map((c) => c.i)),
        suggested: reorder(entry.current, entry.suggestion.suggested_order),
        currentOrder: entry.current.map((c) => c.i),
        suggestedOrder: entry.suggestion.suggested_order,
        changes: entry.suggestion.changes ?? [],
        rationale: entry.suggestion.rationale ?? "",
        pctSuggested: Number(pct.toFixed(1)),
      });
    }
    return out.sort((a, b) => a.lessonId.localeCompare(b.lessonId));
  }, [sugQ.data, abQ.data]);

  const decisionMap = useMemo(() => {
    const m = new Map<string, Decision>();
    (decisionsQ.data ?? []).forEach((d) => m.set(d.lesson_id, d));
    return m;
  }, [decisionsQ.data]);

  const [filter, setFilter] = useState<"all" | "pending" | "decided">("all");

  const filtered = useMemo(() => {
    if (filter === "all") return applyLessons;
    return applyLessons.filter((l) => {
      const d = decisionMap.get(l.lessonId);
      return filter === "pending" ? !d : !!d;
    });
  }, [applyLessons, decisionMap, filter]);

  const counts = useMemo(() => {
    const approved = applyLessons.filter(
      (l) => decisionMap.get(l.lessonId)?.decision === "approve",
    ).length;
    const edited = applyLessons.filter(
      (l) => decisionMap.get(l.lessonId)?.decision === "edit",
    ).length;
    const rejected = applyLessons.filter(
      (l) => decisionMap.get(l.lessonId)?.decision === "reject",
    ).length;
    const pending = applyLessons.length - approved - edited - rejected;
    return { approved, edited, rejected, pending, total: applyLessons.length };
  }, [applyLessons, decisionMap]);

  const loading = sugQ.isLoading || abQ.isLoading || decisionsQ.isLoading;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة
            </Link>
            <h1 className="text-2xl font-bold">مراجعة Apply — v9</h1>
            <p className="text-sm text-muted-foreground mt-1">
              راجع كل درس قبل التطبيق. اعتمد ✅ / عدّل ✏️ / ارفض ❌. القرارات
              تتخزن في قاعدة البيانات.
            </p>
          </div>
          <Link to="/admin/persona-sim-v9">
            <Button variant="outline" size="sm">
              التقرير الكامل
            </Button>
          </Link>
        </div>

        {loading && <div className="text-muted-foreground">يتم التحميل…</div>}

        {!loading && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <StatCard label="إجمالي Apply" value={counts.total} />
              <StatCard
                label="✅ موافَق"
                value={counts.approved}
                tone="emerald"
              />
              <StatCard label="✏️ معدّل" value={counts.edited} tone="amber" />
              <StatCard label="❌ مرفوض" value={counts.rejected} tone="rose" />
              <StatCard
                label="في الانتظار"
                value={counts.pending}
                tone="slate"
              />
            </div>

            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{
                  width: `${counts.total ? (100 * (counts.total - counts.pending)) / counts.total : 0}%`,
                }}
              />
            </div>

            <div className="flex gap-2">
              {(["all", "pending", "decided"] as const).map((k) => (
                <Button
                  key={k}
                  size="sm"
                  variant={filter === k ? "default" : "outline"}
                  onClick={() => setFilter(k)}
                >
                  {k === "all"
                    ? `الكل (${counts.total})`
                    : k === "pending"
                      ? `في الانتظار (${counts.pending})`
                      : `تمت المراجعة (${counts.total - counts.pending})`}
                </Button>
              ))}
            </div>

            <div className="space-y-4">
              {filtered.map((lesson) => (
                <ReviewCard
                  key={lesson.lessonId}
                  lesson={lesson}
                  existing={decisionMap.get(lesson.lessonId)}
                  onSave={(d) => saveMut.mutate(d)}
                  saving={saveMut.isPending}
                />
              ))}
              {filtered.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                  لا توجد دروس في هذا الفلتر.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number;
  tone?: "emerald" | "amber" | "rose" | "slate";
}) {
  const toneMap = {
    emerald: "border-emerald-300 bg-emerald-50 text-emerald-900",
    amber: "border-amber-300 bg-amber-50 text-amber-900",
    rose: "border-rose-300 bg-rose-50 text-rose-900",
    slate: "border-slate-300 bg-slate-50 text-slate-900",
  };
  return (
    <div className={`rounded-lg border-2 p-3 ${toneMap[tone]}`}>
      <div className="text-xs font-semibold opacity-70">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function ReviewCard({
  lesson,
  existing,
  onSave,
  saving,
}: {
  lesson: {
    lessonId: string;
    current: Block[];
    suggested: Block[];
    currentOrder: number[];
    suggestedOrder: number[];
    changes: string[];
    rationale: string;
    pctSuggested: number;
  };
  existing?: Decision;
  onSave: (d: Decision) => void;
  saving: boolean;
}) {
  const [editMode, setEditMode] = useState(false);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [customOrder, setCustomOrder] = useState(
    (existing?.new_order ?? lesson.suggestedOrder).join(","),
  );

  const decisionBadge = existing?.decision ? (
    <span
      className={`px-2 py-0.5 rounded text-xs font-bold border ${
        existing.decision === "approve"
          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
          : existing.decision === "edit"
            ? "bg-amber-100 text-amber-800 border-amber-300"
            : "bg-rose-100 text-rose-800 border-rose-300"
      }`}
    >
      {existing.decision === "approve"
        ? "✅ موافَق"
        : existing.decision === "edit"
          ? "✏️ معدّل"
          : "❌ مرفوض"}
    </span>
  ) : null;

  const handleSave = (decision: "approve" | "edit" | "reject") => {
    let newOrder: number[] | null = null;
    if (decision === "approve") newOrder = lesson.suggestedOrder;
    else if (decision === "edit") {
      const parsed = customOrder
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
      if (parsed.length !== lesson.currentOrder.length) {
        toast.error(
          `الترتيب لازم يحتوي على ${lesson.currentOrder.length} أرقام`,
        );
        return;
      }
      newOrder = parsed;
    }
    onSave({
      lesson_id: lesson.lessonId,
      decision,
      new_order: newOrder,
      notes: notes || null,
    });
    setEditMode(false);
  };

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold">{lesson.lessonId}</span>
          <span className="text-xs text-muted-foreground">
            {lesson.pctSuggested}% suggested
          </span>
        </div>
        {decisionBadge}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <BlockRow blocks={lesson.current} label="الحالي" />
        <BlockRow blocks={lesson.suggested} label="المقترح" />
      </div>

      {lesson.changes.length > 0 && (
        <div className="text-xs text-slate-600 bg-slate-50 rounded p-2 space-y-1">
          {lesson.changes.map((c, i) => (
            <div key={i}>• {c}</div>
          ))}
        </div>
      )}

      {editMode && (
        <div className="space-y-2 border-t pt-3">
          <div>
            <label className="text-xs font-semibold">
              ترتيب مخصص (أرقام مفصولة بفاصلة، {lesson.currentOrder.length}{" "}
              أرقام):
            </label>
            <input
              className="w-full mt-1 px-2 py-1 border rounded text-sm font-mono"
              value={customOrder}
              onChange={(e) => setCustomOrder(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold">ملاحظات:</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="ليه عدّلت؟"
            />
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap pt-2">
        <Button
          size="sm"
          variant="default"
          disabled={saving}
          onClick={() => handleSave("approve")}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Check className="w-4 h-4 ml-1" />
          موافَق
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={saving}
          onClick={() => {
            if (editMode) handleSave("edit");
            else setEditMode(true);
          }}
        >
          <Edit3 className="w-4 h-4 ml-1" />
          {editMode ? "احفظ التعديل" : "عدّل"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={saving}
          onClick={() => handleSave("reject")}
          className="text-rose-700 border-rose-300 hover:bg-rose-50"
        >
          <X className="w-4 h-4 ml-1" />
          ارفض
        </Button>
        {editMode && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditMode(false)}
          >
            إلغاء
          </Button>
        )}
      </div>
    </div>
  );
}
