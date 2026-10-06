/** Reading-only explanations. Never import into a video composition. */
export function ReadingDiagram({ kind, english = false }: { kind: string; english?: boolean }) {
  const copy = english
    ? {
        customer: [
          "Customer journey",
          "Assignment due",
          "Compare options",
          "Collect on time",
          "Decision: reliability before decoration",
        ],
        value: [
          "Promise and proof",
          "Promise: ready before class",
          "Measure: on-time orders / all orders",
          "Ask: does this solve the customer's problem?",
        ],
        system: [
          "Follow one order",
          "Receive → Check → Print → Bind → Deliver",
          "A missing file delays every later step",
          "Check inputs before committing a delivery time",
        ],
        money: [
          "Worked calculation",
          "Sales: 20 × 150 = 3000",
          "Direct costs: 20 × 90 = 1800",
          "Other costs: 900",
          "Illustrative result: 300",
          "Collected: 2400 ≠ revenue: 3000",
        ],
        decision: [
          "Compare two decisions",
          "Current price: result 300",
          "Price reduced by 10: result 100",
          "Same 20 orders; costs unchanged",
          "Test demand before assuming extra sales",
        ],
        evidence: [
          "Sort before deciding",
          "OBSERVED: 20 orders",
          "CALCULATED: result 300",
          "UNTESTED: lower price attracts more buyers",
          "A calculation cannot validate an assumption",
        ],
      }
    : {
        customer: [
          "رحلة العميل",
          "موعد تسليم التكليف",
          "مقارنة البدائل",
          "استلام في الموعد",
          "القرار: الالتزام بالموعد قبل الزينة",
        ],
        value: [
          "الوعد ودليل تحققه",
          "الوعد: جاهز قبل المحاضرة",
          "القياس: الطلبات في الموعد ÷ كل الطلبات",
          "اسأل: هل يحل هذا مشكلة العميل؟",
        ],
        system: [
          "تتبّع طلبًا واحدًا",
          "استلام ← فحص ← طباعة ← تجليد ← تسليم",
          "ملف ناقص يؤخر جميع الخطوات التالية",
          "افحص المدخلات قبل الالتزام بموعد التسليم",
        ],
        money: [
          "ورقة حساب محلولة",
          "المبيعات: 20 × 150 = 3000",
          "تكلفة مباشرة: 20 × 90 = 1800",
          "مصاريف أخرى: 900",
          "النتيجة التوضيحية: 300",
          "المحصّل: 2400 ≠ الإيراد: 3000",
        ],
        decision: [
          "قارن قرارين",
          "السعر الحالي: النتيجة 300",
          "خفض السعر بمقدار 10: النتيجة 100",
          "نفس الطلبات العشرين والتكاليف ثابتة",
          "اختبر الطلب قبل افتراض زيادة المبيعات",
        ],
        evidence: [
          "صنّف قبل اتخاذ القرار",
          "ملاحظة: 20 طلبًا",
          "حساب: النتيجة 300",
          "لم يُختبر: السعر الأقل يجذب مشترين أكثر",
          "الحساب لا يثبت صحة الافتراض",
        ],
      };
  const rows = copy[kind as keyof typeof copy];
  if (!rows) return null;
  return (
    <figure
      className="academic-figure overflow-hidden rounded-2xl border-2 border-primary/20 bg-background p-5"
      data-visual-role="reading"
      data-visual-id={`reading-${kind}`}
    >
      <figcaption className="mb-4 border-b pb-3 text-xl font-bold text-primary">
        {rows[0]}
      </figcaption>
      <ol className="space-y-3" dir={english ? "ltr" : "rtl"}>
        {rows.slice(1).map((row, index) => (
          <li
            key={row}
            className="flex items-start gap-3 border-b border-dashed py-2 last:border-0"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
              {index + 1}
            </span>
            <span className="leading-7">{row}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
