import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Check, Sparkles } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "الباقات — مسارات" },
      {
        name: "description",
        content:
          "باقات مسارات — ابدأ مجانًا بالمقدمة وأول درس من كل مسار، أو تابع Pro قريبًا لإكمال كل المسارات.",
      },
    ],
  }),
  component: PricingPage,
});

const FREE_FEATURES = [
  "المقدمة كاملة",
  "أول درس من كل مسار مهني",
  "تتبع التقدم الأساسي",
  "مهام وتجربة تعلم عملية",
  "المساعد متاح للاستكشاف الأساسي",
] as const;

const PRO_FEATURES = [
  "كل دروس المسارات كاملة",
  "تجربة مساعد أوسع",
  "تقييم AI للمهام حسب الإتاحة",
  "أولوية للمسارات والتحديثات الجديدة",
] as const;

const COMPARISON_ROWS = [
  { label: "المقدمة (٧ دروس)", free: true, pro: true },
  { label: "أول درس من كل مسار", free: true, pro: true },
  { label: "باقي دروس المسارات", free: false, pro: true },
  { label: "تتبع التقدم", free: "أساسي", pro: "كامل" },
  { label: "المساعد", free: "استكشاف أساسي", pro: "أوسع" },
  { label: "تقييم AI للمهام", free: false, pro: "حسب الإتاحة" },
] as const;

const FAQ_ITEMS = [
  {
    q: "هل أقدر أبدأ من غير دفع؟",
    a: "أيوه. الباقة المجانية تشمل المقدمة كاملة وأول درس من كل مسار مهني — كفاية تستكشف المنظومة وتقرر مسارك.",
  },
  {
    q: "متى هيتفعّل Pro؟",
    a: "Pro لسه «قريبًا». بنجهّز تجربة الدفع والاشتراك — لما يجهز هنعلن في المنصة. مفيش دفع على الصفحة دي دلوقتي.",
  },
  {
    q: "هل Pro هيغيّر طريقة تعلّمي؟",
    a: "نفس فلسفة مسارات: دروس، مهام، وتطبيق عملي. Pro بيفتح المحتوى الكامل والمساعد الأوسع — مش منصة مختلفة.",
  },
  {
    q: "هل في التزام طويل؟",
    a: "تفاصيل الاشتراك والدفع هتظهر هنا قبل ما أي خطة مدفوعة تتفعّل. دلوقتي كل اللي محتاجه إنشاء حساب مجاني.",
  },
] as const;

function PricingPage() {
  return (
    <div className="min-h-dvh flex flex-col" dir="rtl">
      <Navbar />
      <main
        id="main-content"
        className="flex-1"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="container mx-auto px-4 py-12 md:py-16 max-w-5xl space-y-14">
          {/* Hero */}
          <header className="text-center space-y-4 max-w-2xl mx-auto">
            <p className="text-xs font-mono uppercase tracking-widest text-accent">
              الباقات · launch readiness
            </p>
            <h1 className="text-3xl md:text-4xl font-black">
              ابدأ مجانًا — وكمّل لما Pro يجهز
            </h1>
            <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
              مسارات بتعلّمك AI بالتطبيق. ابدأ بالمجاني، واستكشف المسارات — Pro
              هيفتح المحتوى الكامل قريبًا من غير ما نربط دفع دلوقتي.
            </p>
          </header>

          {/* Plan cards */}
          <section className="grid md:grid-cols-2 gap-5 items-stretch">
            <article className="glass rounded-2xl border border-border/60 p-6 md:p-8 flex flex-col">
              <div className="mb-6">
                <h2 className="text-2xl font-black">مجاني</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  للبداية والاستكشاف
                </p>
              </div>
              <ul className="space-y-3 text-sm flex-1 mb-8">
                {FREE_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant="hero" size="lg" className="w-full">
                <Link to="/signup">ابدأ مجانًا</Link>
              </Button>
            </article>

            <article className="glass rounded-2xl border border-primary/30 bg-primary/[0.03] p-6 md:p-8 flex flex-col relative overflow-hidden">
              <div className="absolute top-4 left-4">
                <Badge
                  variant="outline"
                  className="border-primary/40 bg-primary/10 text-primary text-[11px] font-semibold"
                >
                  قريبًا
                </Badge>
              </div>
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black">Pro</h2>
                  <BadgeCheck className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  للجادّين في إكمال المسارات
                </p>
              </div>
              <ul className="space-y-3 text-sm flex-1 mb-8">
                {PRO_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="violet"
                size="lg"
                className="w-full"
                disabled
                aria-disabled
              >
                Pro قريبًا
              </Button>
            </article>
          </section>

          {/* Comparison */}
          <section className="glass rounded-2xl border border-border/60 p-6 md:p-8">
            <h2 className="text-lg font-bold mb-5">مقارنة سريعة</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[320px]">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground">
                    <th className="text-right py-2 font-medium">الميزة</th>
                    <th className="text-center py-2 font-medium w-24">مجاني</th>
                    <th className="text-center py-2 font-medium w-24">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row) => (
                    <tr
                      key={row.label}
                      className="border-b border-border/30 last:border-0"
                    >
                      <td className="py-3 text-foreground/90">{row.label}</td>
                      <td className="py-3 text-center">
                        <ComparisonCell value={row.free} />
                      </td>
                      <td className="py-3 text-center">
                        <ComparisonCell value={row.pro} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* FAQ */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold">أسئلة شائعة</h2>
            <div className="grid gap-3">
              {FAQ_ITEMS.map((item) => (
                <details
                  key={item.q}
                  className="glass rounded-xl border border-border/50 p-4 group"
                >
                  <summary className="cursor-pointer list-none font-semibold text-sm flex items-center justify-between gap-3">
                    {item.q}
                    <span className="text-muted-foreground text-xs group-open:rotate-180 transition-transform">
                      ▾
                    </span>
                  </summary>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* Trust / legal */}
          <section className="text-center text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-8">
            <p>
              مسارات في مرحلة وصول مبكر — مفيش دفع أو checkout على هذه الصفحة.
              بياناتك واستخدامك يخضعان لـ{" "}
              <Link
                to="/privacy"
                className="text-primary underline underline-offset-2 hover:text-foreground transition"
              >
                سياسة الخصوصية
              </Link>{" "}
              و{" "}
              <Link
                to="/terms"
                className="text-primary underline underline-offset-2 hover:text-foreground transition"
              >
                الشروط والأحكام
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ComparisonCell({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check className="h-4 w-4 text-primary inline-block" aria-label="متاح" />;
  }
  if (value === false) {
    return <span className="text-muted-foreground/50">—</span>;
  }
  return <span className="text-xs text-muted-foreground">{value}</span>;
}
