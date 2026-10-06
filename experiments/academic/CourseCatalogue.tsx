import { Button } from "@/components/ui/button";
import { APPROVED_PRICES_MINOR } from "@/lib/billing/catalogue/prices";
import logo from "./assets/masaarat-academic-candidate.png";
export function CourseCatalogue({ english, go }: { english: boolean; go: (path: string) => void }) {
  return (
    <section className="container mx-auto space-y-8 px-4 py-12">
      <header>
        <h1 className="text-3xl font-black">
          {english ? "Academic courses" : "مقررات مسارات أكاديمي"}
        </h1>
        <p className="mt-4 leading-8">
          {english
            ? "Choose a course and explore its curriculum."
            : "اختر المقرر ثم استعرض منهجه ودروسه."}
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <article
          className="glass overflow-hidden rounded-3xl border p-6"
          data-testid="academic-course-card"
        >
          <img
            src={logo}
            alt={english ? "Masaarat Academic" : "مسارات أكاديمي"}
            className="mx-auto h-24 w-auto object-contain"
          />
          <p className="mt-6 text-sm font-bold text-primary">
            {english ? "Course 1 · Business" : "المقرر الأول · إدارة الأعمال"}
          </p>
          <h2 className="my-4 text-2xl font-bold">
            {english
              ? "Business foundations and building a venture"
              : "أساسيات إدارة الأعمال وبناء المشروعات"}
          </h2>
          <p className="mb-5 leading-8">
            {english
              ? "40 lesson drafts across seven modules. Planned study workload: 33h 20m, excluding video; learner timing is not yet verified."
              : "مسودات ٤٠ درسًا في سبع وحدات. عبء الدراسة المخطط ٣٣ ساعة و٢٠ دقيقة دون الفيديو؛ لم يُتحقق من زمن التعلم الفعلي بعد."}
          </p>
          <Button onClick={() => go("/academic/courses/AC-BUS")}>
            {english ? "Open curriculum" : "افتح المنهج"}
          </Button>
        </article>
      </div>
    </section>
  );
}
export function AcademicPricing({ english }: { english: boolean }) {
  return (
    <section className="container mx-auto space-y-6 px-4 py-12">
      <h1 className="text-3xl font-black">
        {english ? "Academic subscription" : "اشتراك مسارات أكاديمي"}
      </h1>
      <p className="leading-8">
        {english
          ? "Initial price matches Pro Plus. Academic access is independent. The optional AI assistant has a separate subscription; its price is not set yet."
          : "السعر المبدئي يساوي Pro Plus، وصلاحيات الأكاديمي مستقلة. المساعد الذكي اختياري باشتراك إضافي منفصل لم يُحدد سعره بعد."}
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        {Object.entries(APPROVED_PRICES_MINOR).map(([market, price]) => (
          <article key={market} className="rounded-3xl border bg-card p-6">
            <h2 className="text-xl font-bold">
              {market === "EG"
                ? english
                  ? "Egypt"
                  : "مصر"
                : english
                  ? "International"
                  : "السوق الدولي"}
            </h2>
            <p className="mt-4">
              <bdi>
                {price.pro_plus.month / 100} {price.currencyCode}
              </bdi>{" "}
              / {english ? "month" : "شهر"}
            </p>
            <p>
              <bdi>
                {price.pro_plus.year / 100} {price.currencyCode}
              </bdi>{" "}
              / {english ? "year" : "سنة"}
            </p>
          </article>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {english
          ? "Repository catalogue prices, before tax. Review only; no payment is taken."
          : "أسعار كتالوج المستودع قبل الضرائب. هذه معاينة ولا يتم تحصيل أي دفعة."}
      </p>
    </section>
  );
}
