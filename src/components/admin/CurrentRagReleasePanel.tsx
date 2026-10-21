import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { getCurrentRagRelease, runCurrentRagRelease } from "@/lib/rag-current-release.functions";
import { confirmationFor, type CurrentOperation } from "@/lib/rag/current-release/contracts";

/** The same content publication control works for existing and newly registered AI cards. */
export function CurrentRagReleasePanel() {
  const getStatus = useServerFn(getCurrentRagRelease), run = useServerFn(runCurrentRagRelease);
  const [view, setView] = useState<Awaited<ReturnType<typeof getCurrentRagRelease>> | null>(null);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [prepareConfirmed, setPrepareConfirmed] = useState(false), [publishConfirmed, setPublishConfirmed] = useState(false);
  // Stop after the current bounded batch; never cancel an in-flight paid request and start another.
  const stop = useRef(false);
  async function refresh() {
    const next = await getStatus(); setView(next);
    setPrepareConfirmed(false); setPublishConfirmed(false);
    return next;
  }
  async function perform(operation: CurrentOperation) {
    if (!view || busy) return;
    setBusy(true); setMessage(""); stop.current = false;
    const reviewed = view;
    try {
      const call = (op: CurrentOperation, executionId?: string) => run({ data: {
        operation: op, requestId: crypto.randomUUID(), releaseId: reviewed.releaseId, executionId,
        confirmation: op === "status" ? undefined : confirmationFor(op, reviewed.releaseId),
        ...(op === "activate" || op === "rollback" ? { expectedActiveVersion: reviewed.status.currentActiveVersion } : {}),
      } });
      if (operation === "initialize") {
        const initialized = await call("initialize");
        const executionId = String(initialized.executionId);
        // No background job: each batch finishes before the next explicit preparation step.
        for (let i = 0; i <= Math.ceil(reviewed.chunks / 64) && !stop.current; i++) {
          const result = await call("batch", executionId);
          await refresh();
          if (result.replayed === true && result.done !== true) throw new Error("pending-request");
          if (result.done === true) break;
        }
        setMessage(stop.current ? "توقف التجهيز بعد الدفعة الحالية. يمكنك استكماله لاحقًا." : "اكتمل تجهيز التحديث. راجع الحالة ثم فعّل الإصدار عندما تكون مستعدًا.");
      } else {
        await call(operation, reviewed.status.executionId ?? undefined);
        setMessage(operation === "activate" ? "تم تفعيل المحتوى المراجع." : "تم استرجاع الإصدار السابق.");
      }
      setPrepareConfirmed(false); setPublishConfirmed(false); await refresh();
    } catch {
      setMessage("توقف الإجراء. حدّث الحالة وراجع الطلب الجاري قبل الاستكمال؛ لم يتم تشغيل إعادة محاولة تلقائية.");
    } finally { setBusy(false); }
  }
  const currentActive = view?.status.currentActiveVersion === view?.indexVersion;
  const ready = !!view?.status.executionId && view.status.totalBatches > 0 && view.status.completedBatches === view.status.totalBatches;
  return <section dir="rtl" className="glass rounded-2xl border border-border/40 p-6 mb-6 space-y-3" aria-labelledby="current-rag-title">
    <h2 id="current-rag-title" className="font-semibold">تحديث محتوى مساعد مسارات</h2>
    <p className="text-sm text-muted-foreground">التجهيز يعيد استخدام فهرسة النصوص المطابقة، ويعالج الجديد والمعدّل فقط. التفعيل ينشر الإصدار المراجع لجميع كروت الذكاء الاصطناعي المسجّلة.</p>
    <Button variant="outline" disabled={busy} onClick={() => { setBusy(true); setMessage(""); void refresh().catch(() => setMessage("تعذرت قراءة الحالة. تأكد من تجهيز قاعدة البيانات لهذا الإصدار.")).finally(() => setBusy(false)); }}>تحديث الحالة</Button>
    {view && <>
      <p>المحتوى: {view.packages} حزمة، {view.chunks} جزء. التجهيز: {view.status.completedBatches} / {view.status.totalBatches}.</p>
      <p>{currentActive ? "الإصدار الحالي مفعّل." : ready ? "التجهيز مكتمل، والإصدار بانتظار التفعيل." : "الإصدار يحتاج تجهيزًا."}</p>
      <label className="flex items-center gap-2"><input type="checkbox" checked={prepareConfirmed} disabled={busy || currentActive} onChange={e => setPrepareConfirmed(e.target.checked)} />أوافق على تجهيز النصوص الجديدة والمعدّلة وتكلفة فهرستها.</label>
      <Button disabled={busy || currentActive || ready || !prepareConfirmed} onClick={() => void perform("initialize")}>تجهيز التحديث أو استكماله</Button>
      {busy && <Button variant="outline" onClick={() => { stop.current = true; }}>إيقاف بعد الدفعة الحالية</Button>}
      <label className="flex items-center gap-2"><input type="checkbox" checked={publishConfirmed} disabled={busy} onChange={e => setPublishConfirmed(e.target.checked)} />راجعت الإصدار وأوافق على التفعيل أو الرجوع المحدد أدناه.</label>
      <div className="flex gap-2">
        <Button disabled={busy || currentActive || !ready || !publishConfirmed} onClick={() => void perform("activate")}>تفعيل الإصدار المراجع</Button>
        <Button variant="outline" disabled={busy || !currentActive || !view.status.previousVersion || !publishConfirmed} onClick={() => void perform("rollback")}>الرجوع للإصدار السابق</Button>
      </div>
    </>}
    {message && <p role="status" className="text-sm">{message}</p>}
  </section>;
}
