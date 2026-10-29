import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale/locale-context";
import { liveOfferAdmin } from "@/lib/billing/live/admin-offers.functions";
import type { LiveOfferAdminInput, LiveOfferAdminList } from "@/lib/billing/live/admin-offer-contracts";

export function AdminLiveOffers() {
  const { locale } = useLocale(), en = locale === "en";
  const command = useServerFn(liveOfferAdmin);
  const list = useQuery({ queryKey: ["live-offer-admin"], queryFn: async () => await command({ data: { action: "list" } }) as LiveOfferAdminList });
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [offer, setOffer] = useState(""), [market, setMarket] = useState<"EG" | "INTL">("EG"), [interval, setInterval] = useState<"month" | "year">("month");
  const [duration, setDuration] = useState<"once" | "forever">("once"), [review, setReview] = useState("");
  const [price, setPrice] = useState(""), [product, setProduct] = useState(""), [coupon, setCoupon] = useState(""), [promotion, setPromotion] = useState("");
  const pendingKey = useRef<{ signature: string; key: string } | null>(null);
  const running = useRef(false);
  async function run(data: LiveOfferAdminInput) {
    if (running.current) return;
    running.current = true;
    if ("key" in data) {
      const { key: unusedKey, ...parameters } = data;
      const signature = JSON.stringify(parameters);
      if (pendingKey.current?.signature !== signature) pendingKey.current = { signature, key: unusedKey };
      data = { ...data, key: pendingKey.current.key };
    }
    setBusy(true); setMessage("");
    try { await command({ data }); pendingKey.current = null; await list.refetch(); setMessage(en ? "Saved" : "تم الحفظ"); }
    catch { setMessage(en ? "Not verified. No access or billing settings changed." : "لم يتم التحقق. لم يتغير الوصول أو إعدادات الدفع."); }
    finally { setBusy(false); running.current = false; }
  }
  const input = "min-h-11 w-full rounded border bg-background px-3 text-foreground";
  return <section className="space-y-5 border-t pt-6">
    <h2 className="text-lg font-bold">{en ? "Live discount mappings" : "ربط خصومات الدفع الفعلي"}</h2>
    {list.error && <p role="alert" className="text-destructive">{en ? "Unavailable" : "غير متاح"}</p>}
    {list.data?.offers.length === 0 && <p className="text-muted-foreground">{en ? "No configured paid offers" : "لا توجد عروض مدفوعة مهيأة"}</p>}
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); void run({ action: "provision", key: crypto.randomUUID(), offer_id: offer, market, interval, duration, price_id: price, product_id: product, coupon_id: coupon, promotion_code_id: promotion, reviewed: true, review_reference: review }); }}>
      <label>{en ? "Offer" : "العرض"}<select required className={input} value={offer} onChange={e => setOffer(e.target.value)}><option value="">—</option>{list.data?.offers.map(o => <option key={o.id} value={o.id}>{o.package} · {o.currency} · {o.id}</option>)}</select></label>
      <label>{en ? "Market" : "السوق"}<select className={input} value={market} onChange={e => setMarket(e.target.value === "EG" ? "EG" : "INTL")}><option value="EG">EG / EGP</option><option value="INTL">INTL / USD</option></select></label>
      <label>{en ? "Interval" : "الفترة"}<select className={input} value={interval} onChange={e => setInterval(e.target.value === "month" ? "month" : "year")}><option value="month">{en ? "Monthly" : "شهري"}</option><option value="year">{en ? "Annual" : "سنوي"}</option></select></label>
      <label>{en ? "Discount duration" : "مدة الخصم"}<select className={input} value={duration} onChange={e => setDuration(e.target.value === "once" ? "once" : "forever")}><option value="once">{en ? "First invoice only" : "الفاتورة الأولى فقط"}</option><option value="forever">{en ? "Every renewal" : "كل تجديد"}</option></select></label>
      {[[en ? "Registered Price ID" : "معرّف السعر المسجل", price, setPrice], [en ? "Registered Product ID" : "معرّف المنتج المسجل", product, setProduct], [en ? "Pre-created Coupon ID" : "معرّف القسيمة الموجودة", coupon, setCoupon], [en ? "Pre-created Promotion Code ID" : "معرّف رمز الترويج الموجود", promotion, setPromotion], [en ? "Review reference" : "مرجع المراجعة", review, setReview]].map(([label, value, setter]) => <label key={String(label)}>{String(label)}<input required className={input} value={String(value)} onChange={e => { if (typeof setter === "function") setter(e.target.value); }} /></label>)}
      <Button disabled={busy || !offer} type="submit">{en ? "Save reviewed version" : "حفظ نسخة مراجعة"}</Button>
    </form>
    {message && <p role="status">{message}</p>}
    <div className="divide-y">{list.data?.mappings.map(m => <article key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><span className="break-all">{m.package} · {m.market_code} · {m.billing_interval} · {m.duration} · v{m.version} · {m.enabled ? (en ? "Available" : "متاح") : (en ? "Unavailable" : "غير متاح")}</span><Button disabled={busy || (!m.enabled && review.length < 3)} variant="outline" onClick={() => void run(m.enabled ? { action: "disable", id: m.id, key: crypto.randomUUID() } : { action: "enable", id: m.id, key: crypto.randomUUID(), reviewed: true, review_reference: review })}>{m.enabled ? (en ? "Disable" : "تعطيل") : (en ? "Approve availability" : "اعتماد الإتاحة")}</Button></article>)}</div>
    <h3 className="font-semibold">{en ? "Checkout reservations" : "حجوزات الدفع"}</h3>
    {list.data?.reservations.length === 0 && <p className="text-muted-foreground">{en ? "No reservations" : "لا توجد حجوزات"}</p>}
    {list.data?.reservations.map(r => <article key={r.id} className="flex flex-wrap justify-between gap-3 border-b py-3"><span className="break-all">{r.id} · {en ? r.state : ({ bound: "مرتبط بالدفع", unbound: "غير مرتبط", consumed: "مستخدم", released: "محرر" }[r.state] ?? "غير متاح")}</span><Button disabled={busy || r.state !== "bound"} variant="outline" onClick={() => void run({ action: "reconcile", id: r.id, key: crypto.randomUUID() })}>{en ? "Verify terminal state" : "التحقق من انتهاء العملية"}</Button></article>)}
  </section>;
}