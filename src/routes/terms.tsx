import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "الشروط والأحكام — مسارات" },
      {
        name: "description",
        content: "شروط استخدام منصة مسارات (masaarat.ai) — نسخة مسودة للوصول المبكر.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-dvh flex flex-col" dir="rtl">
      <Navbar />
      <main id="main-content" className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <header className="mb-10">
          <p className="text-xs font-mono uppercase tracking-widest text-accent mb-3">
            مسودة · early access v0.1
          </p>
          <h1 className="text-3xl md:text-4xl font-black mb-3">الشروط والأحكام</h1>
          <p className="text-muted-foreground leading-relaxed">
            آخر تحديث: يونيو ٢٠٢٦. باستخدامك لمسارات فأنت توافق على هذه الشروط بصيغتها
            الحالية. قد تُحدَّث مع تطوّر المنصة.
          </p>
        </header>

        <article className="space-y-8 text-sm md:text-base leading-[1.9] text-foreground/90">
          <section>
            <h2 className="text-lg font-bold mb-2">قبول الشروط</h2>
            <p className="text-muted-foreground">
              مسارات (masaarat.ai) منصة تعليمية. إنشاء حساب أو استخدام المحتوى يعني موافقتك
              على هذه الشروط وعلى{" "}
              <Link to="/privacy" className="text-primary underline underline-offset-2">
                سياسة الخصوصية
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">الاستخدام المقبول</h2>
            <p className="text-muted-foreground">
              تستخدم المنصة للتعلّم الشخصي أو المهني المشروع. يُمنع إساءة استخدام الخدمة،
              محاولة اختراق الأنظمة، استخراج المحتوى بشكل آلي دون إذن، أو مشاركة حسابك
              مع آخرين بطريقة تتجاوز ما يسمح به اشتراكك.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">منع الإساءة</h2>
            <p className="text-muted-foreground">
              لا تُستخدم المنصة أو مساعد الـ AI لإنتاج محتوى غير قانوني، مضلِّل، مسيء،
              أو ينتهك حقوق الغير. نحتفظ بحق تعليق أو إنهاء الحسابات التي تخالف ذلك.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">إخلاء مسؤولية تعليمي</h2>
            <p className="text-muted-foreground">
              المحتوى والمساعد الذكي يقدّمان إرشادًا تعليميًا عامًا وليس استشارة مهنية
              (قانونية، مالية، طبية، أو غيرها). أنت مسؤول عن قراراتك وعن التحقق من
              المعلومات قبل تطبيقها في أعمالك أو مشاريعك.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">مسؤولية الحساب</h2>
            <p className="text-muted-foreground">
              أنت مسؤول عن سرّية بيانات دخولك وعن كل نشاط يتم عبر حسابك. أبلغنا فورًا إذا
              اشتبهت في وصول غير مصرّح به.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">الاشتراك والدفع</h2>
            <p className="text-muted-foreground">
              بعض المسارات أو الميزات قد تكون مدفوعة أو قيد التفعيل («قريبًا»). عند إطلاق
              خطط مدفوعة، ستُعرض الأسعار وشروط التجديد والإلغاء بوضوح قبل الدفع. في مرحلة
              الوصول المبكر قد تتغيّر الأسعار أو الميزات المتاحة دون إشعار مسبق طويل.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">حقوق المنصة</h2>
            <p className="text-muted-foreground">
              محتوى الدروس، الهوية البصرية، البرمجيات، والمواد التعليمية على مسارات مملوكة
              للمنصة أو مرخّصة لها. لا يُسمح بنسخها أو إعادة نشرها أو بيعها دون إذن
              كتابي، باستثناء الاستخدام الشخصي ضمن حسابك.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">التواصل</h2>
            <p className="text-muted-foreground">
              أسئلة عن هذه الشروط؟{" "}
              <a
                href="mailto:support@masaarat.ai"
                className="text-primary underline underline-offset-2"
              >
                support@masaarat.ai
              </a>
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
