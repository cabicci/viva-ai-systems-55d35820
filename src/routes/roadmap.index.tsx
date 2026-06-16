import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  Check,
  Circle,
  Clock,
  MinusCircle,
  Play,
  StickyNote,
  ExternalLink,
  FileDown,
  Sparkles,
} from "lucide-react";
import { AdminGate } from "@/components/AdminGate";
import { requireAdminBeforeLoad } from "@/lib/admin-route-guard";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { PhaseRibbon } from "@/components/admin/PhaseRibbon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  listRoadmapItems,
  createRoadmapItem,
  updateRoadmapItem,
  deleteRoadmapItem,
  type RoadmapItem,
  type RoadmapPhase,
  type RoadmapStatus,
} from "@/lib/roadmap.functions";
import {
  generateDnaReport,
  listDnaReports,
  downloadDnaReport,
  deleteDnaReport,
} from "@/lib/dna-report.functions";

function triggerDownload(markdown: string, filename: string) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function DnaReportPreviewDialog({
  open,
  onOpenChange,
  markdown,
  filename,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  markdown: string;
  filename: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-w-3xl max-h-[85vh] flex flex-col gap-3"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">{filename}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => triggerDownload(markdown, filename)}
          >
            <FileDown className="h-4 w-4 ms-1" /> تحميل .md
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(markdown);
                toast.success("اتنسخ كله ✅");
              } catch {
                toast.error("فشل النسخ — اعمل select يدوي");
              }
            }}
          >
            نسخ النص
          </Button>
          <span className="text-[10px] text-muted-foreground ms-auto font-mono">
            {(new Blob([markdown]).size / 1024).toFixed(1)} KB · {markdown.length.toLocaleString()} حرف
          </span>
        </div>
        <pre
          dir="ltr"
          className="flex-1 overflow-auto text-[11px] leading-relaxed font-mono whitespace-pre-wrap bg-muted/30 border border-border/40 rounded-lg p-3"
        >
          {markdown}
        </pre>
      </DialogContent>
    </Dialog>
  );
}

function DnaReportButton({ onGenerated }: { onGenerated: () => void }) {
  const run = useServerFn(generateDnaReport);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ markdown: string; filename: string } | null>(null);
  return (
    <>
    <Button
      variant="outline"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const tid = toast.loading("بنجمع كل بيانات المنصة…");
        try {
          const res = await run();
          const filename = `dna-report-${res.generatedAt.slice(0, 10)}.md`;
          setPreview({ markdown: res.markdown, filename });
          if (res.storagePath) {
            toast.success("اتولّد + اتأرشف ✅", { id: tid });
          } else {
            toast.warning(`اتولّد بس الأرشفة فشلت: ${res.storageError ?? "غير معروف"}`, { id: tid });
          }
          onGenerated();
        } catch (e: any) {
          toast.error(e?.message ?? "فشل توليد التقرير", { id: tid });
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? <Loader2 className="h-4 w-4 ms-1 animate-spin" /> : <FileDown className="h-4 w-4 ms-1" />}
      DNA Report
    </Button>
    {preview && (
      <DnaReportPreviewDialog
        open={!!preview}
        onOpenChange={(v) => !v && setPreview(null)}
        markdown={preview.markdown}
        filename={preview.filename}
      />
    )}
    </>
  );
}

function DnaReportsArchive() {
  const { user } = useAuth();
  const list = useServerFn(listDnaReports);
  const dl = useServerFn(downloadDnaReport);
  const rm = useServerFn(deleteDnaReport);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["dna-reports"],
    queryFn: () => list(),
    enabled: !!user,
  });
  const [busyPath, setBusyPath] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ markdown: string; filename: string } | null>(null);

  const reports = data?.reports ?? [];
  const refresh = () => qc.invalidateQueries({ queryKey: ["dna-reports"] });

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-base md:text-lg">📂 أرشيف الـ DNA Reports</h2>
        <span className="text-xs font-mono text-muted-foreground">{reports.length}</span>
      </div>
      {isLoading ? (
        <div className="grid place-items-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : reports.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-3 px-4 rounded-lg border border-dashed border-border/40">
          مفيش تقارير محفوظة لسه — اضغط زرار DNA Report فوق عشان تولّد أول واحد.
        </p>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => {
            const isBusy = busyPath === r.path;
            const sizeKb = r.size ? (r.size / 1024).toFixed(1) : null;
            return (
              <div
                key={r.path}
                className="glass rounded-xl border border-border/40 p-3 flex items-center gap-3"
              >
                <FileDown className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-mono truncate">{r.name}</div>
                  <div className="text-[10px] text-muted-foreground flex gap-3 mt-0.5">
                    {r.createdAt && (
                      <span>{new Date(r.createdAt).toLocaleString("ar-EG")}</span>
                    )}
                    {sizeKb && <span>{sizeKb} KB</span>}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    disabled={isBusy}
                    onClick={async () => {
                      setBusyPath(r.path);
                      const tid = toast.loading("بنحضّر الملف…");
                      try {
                        const res = await dl({ data: { path: r.path } });
                        setPreview({ markdown: res.markdown, filename: r.name });
                        toast.success("اتفتح ✅", { id: tid });
                      } catch (e: any) {
                        toast.error(e?.message ?? "فشل التنزيل", { id: tid });
                      } finally {
                        setBusyPath(null);
                      }
                    }}
                    className="p-1.5 text-muted-foreground/70 hover:text-primary transition disabled:opacity-50"
                    title="فتح + تنزيل"
                  >
                    {isBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    disabled={isBusy}
                    onClick={async () => {
                      if (!confirm(`احذف ${r.name}؟`)) return;
                      setBusyPath(r.path);
                      try {
                        await rm({ data: { path: r.path } });
                        toast.success("اتمسح");
                        refresh();
                      } catch (e: any) {
                        toast.error(e?.message ?? "فشل الحذف");
                      } finally {
                        setBusyPath(null);
                      }
                    }}
                    className="p-1.5 text-muted-foreground/70 hover:text-destructive transition disabled:opacity-50"
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {preview && (
        <DnaReportPreviewDialog
          open={!!preview}
          onOpenChange={(v) => !v && setPreview(null)}
          markdown={preview.markdown}
          filename={preview.filename}
        />
      )}
    </section>
  );
}

export const Route = createFileRoute("/roadmap/")({
  head: () => ({ meta: [{ title: "Roadmap — خريطة الشغل" }] }),
  beforeLoad: requireAdminBeforeLoad,
  component: RoadmapPage,
});

const PHASE_LABELS: Record<RoadmapPhase, string> = {
  A: "Phase A — Mission System Core",
  B: "Phase B — ملء الـ Missions الباقية",
  C: "Phase C — Future / أفكار",
  D: "Phase D — مؤجل بعد الـ beta",
  inbox: "Inbox — بنود لسه متصنفتش",
};

const STATUS_LABELS: Record<RoadmapStatus, string> = {
  todo: "في الانتظار",
  in_progress: "شغّال عليه",
  done: "تم",
  deferred: "مؤجل",
};

const AI_MARKER = "[source:ai]";
const isAiItem = (it: RoadmapItem) =>
  !!it.notes && it.notes.trim().startsWith(AI_MARKER);

function RoadmapPage() {
  return (
    <AdminGate>
      <div className="min-h-dvh flex bg-background" dir="rtl">
        <Sidebar />
        <main className="flex-1 max-w-5xl mx-auto w-full">
          <PhaseRibbon />
          <div className="p-4 md:p-8">
            <RoadmapView />
          </div>
        </main>
      </div>
    </AdminGate>
  );
}

function RoadmapView() {
  const list = useServerFn(listRoadmapItems);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["roadmap-items"],
    queryFn: () => list(),
  });

  const [statusFilter, setStatusFilter] = useState<RoadmapStatus | "all" | "ai">("all");
  const [open, setOpen] = useState(false);

  const grouped = useMemo(() => {
    const items = (data ?? []).filter((i) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "ai") return isAiItem(i);
      return i.status === statusFilter;
    });
    const out: Record<RoadmapPhase, RoadmapItem[]> = { A: [], B: [], C: [], D: [], inbox: [] };
    for (const it of items) out[it.phase].push(it);
    return out;
  }, [data, statusFilter]);

  const counts = useMemo(() => {
    const out: Record<RoadmapPhase, { done: number; total: number }> = {
      A: { done: 0, total: 0 },
      B: { done: 0, total: 0 },
      C: { done: 0, total: 0 },
      D: { done: 0, total: 0 },
      inbox: { done: 0, total: 0 },
    };
    for (const it of data ?? []) {
      out[it.phase].total += 1;
      if (it.status === "done") out[it.phase].done += 1;
    }
    return out;
  }, [data]);

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Roadmap</h1>
          <p className="text-sm text-muted-foreground mt-1">
            خريطة الشغل المشتركة — كل اللي اتعمل + كل اللي هنعمله. اضغط على الـ checkbox عشان تبدّل الحالة.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ms-1" /> بند جديد
            </Button>
          </DialogTrigger>
          <AddDialogContent onClose={() => setOpen(false)} qc={qc} />
        </Dialog>
        <DnaReportButton onGenerated={() => qc.invalidateQueries({ queryKey: ["dna-reports"] })} />
      </header>

      <DnaReportsArchive />

      <div className="flex gap-2 mb-6 flex-wrap text-xs">
        {(["all", "todo", "in_progress", "done", "deferred", "ai"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full border transition ${
              statusFilter === s
                ? "bg-primary/15 text-primary border-primary/40"
                : "border-border/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "all" ? (
              "الكل"
            ) : s === "ai" ? (
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                من AI
              </span>
            ) : (
              STATUS_LABELS[s]
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-8">
          {(["A", "B", "C", "D", "inbox"] as RoadmapPhase[]).map((phase) => (
            <PhaseSection
              key={phase}
              phase={phase}
              items={grouped[phase]}
              done={counts[phase].done}
              total={counts[phase].total}
              qc={qc}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PhaseSection({
  phase,
  items,
  done,
  total,
  qc,
}: {
  phase: RoadmapPhase;
  items: RoadmapItem[];
  done: number;
  total: number;
  qc: ReturnType<typeof useQueryClient>;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-base md:text-lg">{PHASE_LABELS[phase]}</h2>
        <span className="text-xs font-mono text-muted-foreground">
          {done}/{total}
        </span>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-3 px-4 rounded-lg border border-dashed border-border/40">
            لا توجد بنود
          </p>
        ) : (
          items.map((it) => <RoadmapRow key={it.id} item={it} qc={qc} />)
        )}
      </div>
    </section>
  );
}

function RoadmapRow({
  item,
  qc,
}: {
  item: RoadmapItem;
  qc: ReturnType<typeof useQueryClient>;
}) {
  const update = useServerFn(updateRoadmapItem);
  const del = useServerFn(deleteRoadmapItem);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState(item.notes ?? "");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const toggle = useMutation({
    mutationFn: (next: RoadmapStatus) => update({ data: { id: item.id, status: next } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roadmap-items"] }),
  });
  const saveNotes = useMutation({
    mutationFn: (value: string) =>
      update({ data: { id: item.id, notes: value || null } }),
    onSuccess: () => {
      setSavedAt(Date.now());
      qc.invalidateQueries({ queryKey: ["roadmap-items"] });
    },
  });
  const remove = useMutation({
    mutationFn: () => del({ data: { id: item.id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roadmap-items"] }),
  });

  // Debounced auto-save for notes.
  useEffect(() => {
    if (!notesOpen) return;
    if (notesDraft === (item.notes ?? "")) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveNotes.mutate(notesDraft);
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notesDraft, notesOpen]);

  const startWorking = async () => {
    if (item.status !== "in_progress") {
      toggle.mutate("in_progress");
    }
    const prompt = `نفّذ بند الـ roadmap ID: ${item.id} — العنوان: ${item.title}. اقرأ description و notes من جدول roadmap_items قبل ما تبدأ.`;
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("نسخت الـ prompt — افتح chat جديد والصقه");
    } catch {
      toast.error("فشل نسخ الـ prompt — انسخه يدويًا من الـ detail page");
    }
  };

  const cycle = () => {
    const next: RoadmapStatus =
      item.status === "done"
        ? "todo"
        : item.status === "todo"
          ? "in_progress"
          : item.status === "in_progress"
            ? "done"
            : "todo";
    toggle.mutate(next);
  };

  const Icon =
    item.status === "done"
      ? Check
      : item.status === "in_progress"
        ? Clock
        : item.status === "deferred"
          ? MinusCircle
          : Circle;

  return (
    <div
      className={`glass rounded-xl border border-border/40 p-3 flex items-start gap-3 ${
        item.status === "deferred" ? "opacity-60" : ""
      }`}
    >
      <button
        onClick={cycle}
        disabled={toggle.isPending}
        aria-label="تبديل الحالة"
        className={`mt-0.5 grid h-6 w-6 place-items-center rounded-md border transition ${
          item.status === "done"
            ? "bg-accent/20 border-accent/40 text-accent"
            : item.status === "in_progress"
              ? "bg-primary/15 border-primary/40 text-primary"
              : "border-border/50 text-muted-foreground hover:text-foreground"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
      <div className="flex-1 min-w-0">
        <Link
          to="/roadmap/$id"
          params={{ id: item.id }}
          className="group inline-flex items-center gap-1.5 hover:text-primary transition"
        >
          <span
            className={`text-sm font-medium ${
              item.status === "done" ? "line-through text-muted-foreground" : ""
            }`}
          >
            {item.title}
          </span>
          {isAiItem(item) && (
            <span
              title="مُسجَّل من AI تلقائي"
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-mono uppercase tracking-wider"
            >
              <Sparkles className="h-2.5 w-2.5" />
              AI
            </span>
          )}
          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition" />
        </Link>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {item.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
            {STATUS_LABELS[item.status]}
          </span>
          {item.notes && !notesOpen && (
            <span className="text-[10px] text-primary/70 flex items-center gap-1">
              <StickyNote className="h-3 w-3" />
              {item.notes.length} حرف
            </span>
          )}
        </div>
        {notesOpen && (
          <div className="mt-2 space-y-1">
            <Textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              rows={4}
              placeholder="ملاحظات، قرارات، blockers، روابط..."
              className="text-xs font-mono"
              dir="rtl"
            />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>
                {saveNotes.isPending
                  ? "بيحفظ..."
                  : savedAt
                    ? `اتحفظ ${new Date(savedAt).toLocaleTimeString("ar-EG")}`
                    : "auto-save بعد ثانية"}
              </span>
              <button
                onClick={() => setNotesOpen(false)}
                className="hover:text-foreground transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={() => setNotesOpen((v) => !v)}
          className={`p-1 transition ${
            notesOpen
              ? "text-primary"
              : item.notes
                ? "text-primary/60 hover:text-primary"
                : "text-muted-foreground/60 hover:text-foreground"
          }`}
          aria-label="ملاحظات"
          title="ملاحظات"
        >
          <StickyNote className="h-4 w-4" />
        </button>
        {item.status !== "done" && item.status !== "deferred" && (
          <button
            onClick={startWorking}
            disabled={toggle.isPending}
            className="p-1 text-muted-foreground/60 hover:text-accent transition"
            aria-label="ابدأ الشغل + انسخ prompt"
            title="ابدأ الشغل + انسخ prompt"
          >
            <Play className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => {
            if (confirm("احذف البند؟")) remove.mutate();
          }}
          disabled={remove.isPending}
          className="p-1 text-muted-foreground/60 hover:text-destructive transition"
          aria-label="حذف"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function AddDialogContent({
  onClose,
  qc,
}: {
  onClose: () => void;
  qc: ReturnType<typeof useQueryClient>;
}) {
  const create = useServerFn(createRoadmapItem);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState<RoadmapPhase>("inbox");
  const [status, setStatus] = useState<RoadmapStatus>("todo");

  const mutation = useMutation({
    mutationFn: () =>
      create({ data: { title, description: description || null, phase, status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roadmap-items"] });
      setTitle("");
      setDescription("");
      setPhase("inbox");
      setStatus("todo");
      onClose();
    },
  });

  return (
    <DialogContent dir="rtl">
      <DialogHeader>
        <DialogTitle>بند جديد</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label htmlFor="rm-title">العنوان</Label>
          <Input
            id="rm-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: إضافة streak goal للـ dashboard"
          />
        </div>
        <div>
          <Label htmlFor="rm-desc">وصف (اختياري)</Label>
          <Textarea
            id="rm-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>المرحلة</Label>
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value as RoadmapPhase)}
              className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="inbox">Inbox</option>
              <option value="A">Phase A</option>
              <option value="B">Phase B</option>
              <option value="C">Phase C</option>
              <option value="D">Phase D</option>
            </select>
          </div>
          <div>
            <Label>الحالة</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RoadmapStatus)}
              className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="todo">في الانتظار</option>
              <option value="in_progress">شغّال عليه</option>
              <option value="done">تم</option>
              <option value="deferred">مؤجل</option>
            </select>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          إلغاء
        </Button>
        <Button
          onClick={() => mutation.mutate()}
          disabled={!title.trim() || mutation.isPending}
        >
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin ms-1" />}
          إضافة
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}