import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { getNativePreparationCards, type NativePreparationCard } from "@/lib/native-assistant-preparation.functions";
import { indexCardAssistant } from "@/lib/card-assistant/assistant.functions";
import { indexAcademicAssistant } from "@/lib/academic-education/assistant.functions";

type Progress = { next: number; pending: boolean; complete: boolean };
const labels = { kids: "الأطفال", technical: "التقني", academic: "الأكاديمي" };
const cardKey = (card: NativePreparationCard) => `${card.area}:${card.cardId}`;
const storageKey = (operator: string, card: NativePreparationCard) =>
  `masaarat-native-preparation-v1:${operator}:${cardKey(card)}`;
const initial = (): Progress => ({ next: 0, pending: false, complete: false });
function readProgress(operator: string, card: NativePreparationCard): Progress {
  const raw = localStorage.getItem(storageKey(operator, card));
  if (!raw) return initial();
  const value = JSON.parse(raw) as Progress;
  if (!Number.isSafeInteger(value.next) || value.next < 0 || value.next >= card.scopes ||
      typeof value.pending !== "boolean" || typeof value.complete !== "boolean") throw new Error("INVALID_PROGRESS");
  return value;
}
function saveProgress(operator: string, card: NativePreparationCard, value: Progress) {
  localStorage.setItem(storageKey(operator, card), JSON.stringify(value));
}

export function NativeAssistantPreparationPanel() {
  const list = useServerFn(getNativePreparationCards);
  const indexCard = useServerFn(indexCardAssistant), indexAcademic = useServerFn(indexAcademicAssistant);
  const [view, setView] = useState<Awaited<ReturnType<typeof getNativePreparationCards>> | null>(null);
  const [selected, setSelected] = useState("");
  const [progress, setProgress] = useState<Progress>(initial);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false), [reviewed, setReviewed] = useState(false);
  const stop = useRef(false);
  useEffect(() => () => { stop.current = true; }, []);
  const card = view?.cards.find(item => cardKey(item) === selected);
  function choose(key: string, data = view) {
    setSelected(key); setConsent(false); setReviewed(false); setMessage("");
    const target = data?.cards.find(item => cardKey(item) === key);
    try { setProgress(target && data ? readProgress(data.operatorId, target) : initial()); }
    catch { setProgress({ next: 0, pending: true, complete: false }); setMessage("تعذرت قراءة سجل التجهيز. راجع الفهرس الحالي قبل أي محاولة جديدة."); }
  }
  async function refresh() {
    setBusy(true); setMessage("");
    try {
      const next = await list(); setView(next);
      choose(next.cards.some(item => cardKey(item) === selected) ? selected : next.cards[0] ? cardKey(next.cards[0]) : "", next);
    } catch { setMessage("تعذرت قراءة المسارات. يلزم حساب مسؤول مخوّل وتجهيز قاعدة البيانات."); }
    finally { setBusy(false); }
  }
  async function prepare() {
    if (!view || !card || busy || !consent || (progress.pending && !reviewed)) return;
    const target = card, operator = view.operatorId;
    let offset = progress.complete ? 0 : progress.next;
    setBusy(true); setMessage(""); stop.current = false;
    setConsent(false); setReviewed(false);
    try {
      while (offset < target.scopes && !stop.current) {
        // Persist before a paid request. Reload/navigation never silently retries it.
        const pending = { next: offset, pending: true, complete: false };
        saveProgress(operator, target, pending); setProgress(pending);
        const result = target.area === "academic"
          ? await indexAcademic({ data: { courseId: target.cardId, offset, batchSize: 1 } })
          : await indexCard({ data: { area: target.area, cardId: target.cardId, offset, batchSize: 1 } });
        const next = result.nextOffset;
        if (next !== null && (!Number.isSafeInteger(next) || next !== offset + 1 || next >= target.scopes))
          throw new Error("INVALID_BATCH_PROGRESS");
        if (next === null && offset + 1 !== target.scopes) throw new Error("SOURCE_REGISTRATION_CHANGED");
        const completed = { next: next ?? offset, pending: false, complete: next === null };
        saveProgress(operator, target, completed); setProgress(completed);
        if (next === null) { setMessage("اكتمل تجهيز هذا المسار. يلزم فحص التغطية والصلاحيات قبل تفعيله للطلاب."); break; }
        offset = next;
      }
      if (stop.current) setMessage("توقف التجهيز بعد اكتمال الدفعة الحالية. يمكن استكمال الباقي لاحقًا.");
    } catch {
      setMessage("توقف التجهيز دون إعادة محاولة تلقائية. راجع حالة الدفعة الجارية قبل السماح بمحاولة جديدة؛ قد تُحتسب تكلفة إضافية إذا وصل الطلب للمزوّد.");
    } finally { setBusy(false); }
  }
  return <section dir="rtl" className="glass rounded-2xl border border-border/40 p-6 mb-6 space-y-3" aria-labelledby="native-preparation-title">
    <h2 id="native-preparation-title" className="font-semibold">تجهيز محتوى مساعد الأطفال والتقني والأكاديمي</h2>
    <p className="text-sm text-muted-foreground">تظهر المسارات المسجّلة والمسموح لك بمراجعتها. التجهيز يستخدم مصادرها المعتمدة ويعيد استخدام النصوص المطابقة، ولا يفعّلها للطلاب.</p>
    <Button variant="outline" disabled={busy} onClick={() => void refresh()}>عرض مسارات التجهيز</Button>
    {view && <>
      <label className="block">المسار
        <select className="block w-full rounded border p-2 bg-background" value={selected} disabled={busy} onChange={e => choose(e.target.value)}>
          {view.cards.map(item => <option key={cardKey(item)} value={cardKey(item)}>{labels[item.area]} — {item.cardId}</option>)}
        </select>
      </label>
      {card && <>
        <p>المصادر: {card.scopes}. {progress.complete ? "التجهيز المسجّل مكتمل؛ افحص التغطية الحالية قبل التفعيل." : `الدفعة التالية: ${progress.next + 1}.`}</p>
        {progress.pending && <label className="flex items-center gap-2"><input type="checkbox" checked={reviewed} disabled={busy} onChange={e => setReviewed(e.target.checked)} />راجعت نتيجة الطلب السابق وأسمح بمحاولة جديدة قد تستلزم تكلفة إضافية.</label>}
        <label className="flex items-center gap-2"><input type="checkbox" checked={consent} disabled={busy} onChange={e => setConsent(e.target.checked)} />أوافق على تجهيز محتوى المسار المحدد وتكلفة فهرسته.</label>
        <Button disabled={busy || !consent || (progress.pending && !reviewed)} onClick={() => void prepare()}>{progress.complete ? "إعادة فحص وتجهيز المسار" : "تجهيز المسار أو استكماله"}</Button>
        {busy && <Button variant="outline" onClick={() => { stop.current = true; }}>إيقاف بعد الدفعة الحالية</Button>}
      </>}
    </>}
    {message && <p role="status" className="text-sm">{message}</p>}
  </section>;
}
