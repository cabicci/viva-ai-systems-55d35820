import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  Circle,
  Clock,
  Loader2,
  MinusCircle,
  Play,
  Save,
  Trash2,
} from "lucide-react";
import { AdminGate } from "@/components/AdminGate";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { PhaseRibbon } from "@/components/admin/PhaseRibbon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  getRoadmapItem,
  updateRoadmapItem,
  deleteRoadmapItem,
  type RoadmapPhase,
  type RoadmapStatus,
} from "@/lib/roadmap.functions";

const PHASE_LABELS: Record<RoadmapPhase, string> = {
  A: "Phase A — Mission System Core",
  B: "Phase B — ملء الـ Missions الباقية",
  C: "Phase C — Future / أفكار",
  D: "Phase D — مؤجل بعد الـ beta",
  inbox: "Inbox",
};

const STATUS_LABELS: Record<RoadmapStatus, string> = {
  todo: "في الانتظار",
  in_progress: "شغّال عليه",
  done: "تم",
  deferred: "مؤجل",
};

export const Route = createFileRoute("/roadmap/$id")({
  head: () => ({ meta: [{ title: "تفاصيل بند — Roadmap" }] }),
  component: RoadmapItemPage,
});

function RoadmapItemPage() {
  return (
    <AdminGate>
      <div className="min-h-screen flex bg-background" dir="rtl">
        <Sidebar />
        <main className="flex-1 max-w-3xl mx-auto w-full">
          <PhaseRibbon />
          <div className="p-4 md:p-8">
            <Detail />
          </div>
        </main>
      </div>
    </AdminGate>
  );
}

function Detail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchItem = useServerFn(getRoadmapItem);
  const updateFn = useServerFn(updateRoadmapItem);
  const deleteFn = useServerFn(deleteRoadmapItem);

  const { data: item, isLoading, error } = useQuery({
    queryKey: ["roadmap-item", id],
    queryFn: () => fetchItem({ data: { id } }),
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [phase, setPhase] = useState<RoadmapPhase>("inbox");
  const [status, setStatus] = useState<RoadmapStatus>("todo");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoSavedAt, setAutoSavedAt] = useState<number | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    if (item && !hydrated.current) {
      setTitle(item.title);
      setDescription(item.description ?? "");
      setNotes(item.notes ?? "");
      setPhase(item.phase);
      setStatus(item.status);
      hydrated.current = true;
    }
  }, [item]);

  const save = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          id,
          title: title.trim() || undefined,
          description: description || null,
          notes: notes || null,
          phase,
          status,
        },
      }),
    onSuccess: () => {
      setAutoSavedAt(Date.now());
      qc.invalidateQueries({ queryKey: ["roadmap-item", id] });
      qc.invalidateQueries({ queryKey: ["roadmap-items"] });
      qc.invalidateQueries({ queryKey: ["roadmap-phase-stats"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "فشل الحفظ"),
  });

  const remove = useMutation({
    mutationFn: () => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roadmap-items"] });
      qc.invalidateQueries({ queryKey: ["roadmap-phase-stats"] });
      toast.success("اتحذف");
      navigate({ to: "/roadmap" });
    },
  });

  // Debounced auto-save for notes only (text fields require explicit save).
  useEffect(() => {
    if (!hydrated.current || !item) return;
    if (notes === (item.notes ?? "")) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateFn({ data: { id, notes: notes || null } }).then(() => {
        setAutoSavedAt(Date.now());
        qc.invalidateQueries({ queryKey: ["roadmap-item", id] });
        qc.invalidateQueries({ queryKey: ["roadmap-items"] });
      });
    }, 1000);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  const startWorking = async () => {
    if (status !== "in_progress") {
      setStatus("in_progress");
      await updateFn({ data: { id, status: "in_progress" } });
      qc.invalidateQueries({ queryKey: ["roadmap-items"] });
      qc.invalidateQueries({ queryKey: ["roadmap-phase-stats"] });
    }
    const prompt = `نفّذ بند الـ roadmap ID: ${id} — العنوان: ${title}. اقرأ description و notes من جدول roadmap_items قبل ما تبدأ.`;
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("نسخت الـ prompt — افتح chat جديد والصقه");
    } catch {
      toast.error("فشل النسخ — انسخ يدويًا");
    }
  };

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm">البند مش موجود.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/roadmap">رجوع للـ Roadmap</Link>
        </Button>
      </div>
    );
  }

  const StatusIcon =
    status === "done"
      ? Check
      : status === "in_progress"
        ? Clock
        : status === "deferred"
          ? MinusCircle
          : Circle;

  return (
    <div className="space-y-6">
      <Link
        to="/roadmap"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
      >
        <ArrowRight className="h-3.5 w-3.5" />
        رجوع للـ Roadmap
      </Link>

      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <StatusIcon className="h-3.5 w-3.5" />
          <span>{STATUS_LABELS[status]}</span>
          <span>·</span>
          <span>{PHASE_LABELS[phase]}</span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold">{title || item.title}</h1>
      </header>

      <section className="glass rounded-xl border border-border/40 p-4 space-y-4">
        <div>
          <Label htmlFor="d-title">العنوان</Label>
          <Input
            id="d-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="d-desc">الوصف</Label>
          <Textarea
            id="d-desc"
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
        <div className="flex items-center gap-2 pt-2">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin ms-1" />
            ) : (
              <Save className="h-4 w-4 ms-1" />
            )}
            حفظ التغييرات
          </Button>
          {status !== "done" && status !== "deferred" && (
            <Button onClick={startWorking} variant="secondary">
              <Play className="h-4 w-4 ms-1" />
              ابدأ + انسخ prompt
            </Button>
          )}
        </div>
      </section>

      <section className="glass rounded-xl border border-border/40 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="d-notes" className="text-sm font-bold">
            ملاحظات (auto-save)
          </Label>
          <span className="text-[10px] text-muted-foreground">
            {autoSavedAt
              ? `اتحفظ ${new Date(autoSavedAt).toLocaleTimeString("ar-EG")}`
              : "decisions, blockers, روابط"}
          </span>
        </div>
        <Textarea
          id="d-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={10}
          placeholder="ليه أجّلنا ده؟ إيه القرارات اللي اتاخدت؟ روابط للـ commits أو files؟"
          className="font-mono text-xs"
          dir="rtl"
        />
      </section>

      <section className="glass rounded-xl border border-border/40 p-4 text-xs space-y-1 text-muted-foreground font-mono">
        <div>
          <span className="text-foreground/70">ID:</span> {item.id}
        </div>
        <div>
          <span className="text-foreground/70">اتعمل:</span>{" "}
          {new Date(item.created_at).toLocaleString("ar-EG")}
        </div>
        <div>
          <span className="text-foreground/70">آخر تحديث:</span>{" "}
          {new Date(item.updated_at).toLocaleString("ar-EG")}
        </div>
        {item.completed_at && (
          <div>
            <span className="text-foreground/70">اتخلص:</span>{" "}
            {new Date(item.completed_at).toLocaleString("ar-EG")}
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm("احذف البند نهائيًا؟")) remove.mutate();
          }}
          disabled={remove.isPending}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 ms-1" />
          حذف البند
        </Button>
      </div>
    </div>
  );
}