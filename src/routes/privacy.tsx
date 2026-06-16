import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية — مسارات" },
      {
        name: "description",
        content: "سياسة خصوصية منصة مسارات (masaarat.ai) — نسخة مسودة للوصول المبكر.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-dvh flex flex-col" dir="rtl">
      <Navbar />
      <main id="main-content" className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <header className="mb-10">
          <p className="text-xs font-mono uppercase tracking-widest text-accent mb-3">
            مسودة · early access v0.1
          </p>
          <h1 className="text-3xl md:text-4xl font-black mb-3">سياسة الخصوصية</h1>
          <p className="text-muted-foreground leading-relaxed">
            آخر تحديث: يونيو ٢٠٢٦. المنصة في مرحلة وصول مبكر — قد تتغيّر هذه السياسة
            مع تطوّر المنتج. ننصح بمراجعتها دوريًا.
          </p>
        </header>

        <article className="space-y-8 text-sm md:text-base leading-[1.9] text-foreground/90">
          <section>
            <h2 className="text-lg font-bold mb-2">من نحن</h2>
            <p className="text-muted-foreground">
              مسارات (masaarat.ai) منصة تعليمية عربية لتعلّم الذكاء الاصطناعي بالتطبيق.
              نحترم خصوصيتك ونشرح هنا كيف نتعامل مع بياناتك في هذه المرحلة المبكرة.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">بيانات الحساب</h2>
            <p className="text-muted-foreground">
              عند التسجيل نجمع معلومات أساسية مثل البريد الإلكتروني وكلمة المرور (مشفّرة)
              وبيانات الملف الشخصي التي تختار إدخالها. نستخدمها لتشغيل حسابك، تتبّع تقدّمك
              في الدروس، وإدارة اشتراكك عند تفعيله.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">التحليلات واستخدام المنصة</h2>
            <p className="text-muted-foreground">
              نسجّل نشاطًا تقنيًا واستخدامًا للمنصة — مثل الدروس التي تفتحها، مدة الجلسات،
              وأخطاء تقنية — لتحسين التجربة وإصلاح المشاكل. لا نبيع بياناتك الشخصية لأطراف
              ثالثة.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">استخدام الذكاء الاصطناعي</h2>
            <p className="text-muted-foreground">
              مساعد المنصة والميزات المرتبطة بالـ AI تعالج نصوصك وأسئلتك لتقديم إرشاد
              تعليمي. لا تُستخدم محادثاتك للإعلان. قد نُخزّن سياقًا محدودًا لتحسين جودة
              الردود داخل حسابك. لا تُدخل معلومات حساسة (كلمات مرور، بيانات مالية، أسرار
              تجارية) في المحادثات.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">ملفات تعريف الارتباط والتتبّع الأساسي</h2>
            <p className="text-muted-foreground">
              نستخدم ملفات تعريف ارتباط (cookies) وتخزينًا محليًا ضروريًا لتسجيل الدخول،
              حفظ تفضيلاتك، وقياس أداء المنصة بشكل مجمّع. يمكنك ضبط متصفّحك لرفض بعض
              ملفات الارتباط، لكن قد لا تعمل بعض الميزات بشكل كامل.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">التواصل والدعم</h2>
            <p className="text-muted-foreground">
              لأي استفسار عن الخصوصية أو بياناتك، راسلنا على{" "}
              <a
                href="mailto:support@masaarat.ai"
                className="text-primary underline underline-offset-2"
              >
                support@masaarat.ai
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">حذف الحساب وطلب البيانات</h2>
            <p className="text-muted-foreground">
              يمكنك طلب حذف حسابك أو تصدير/حذف بياناتك الشخصية عبر البريد أعلاه أو من
              صفحة{" "}
              <Link to="/account" className="text-primary underline underline-offset-2">
                حسابي
              </Link>{" "}
              عندما تتوفر أداة الحذف. نعالج الطلبات في أقرب وقت ممكن خلال مرحلة الوصول
              المبكر.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
