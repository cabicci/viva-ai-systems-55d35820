import { createRoot } from "react-dom/client";
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
  useRouterState,
  useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import {
  CurriculumLayout,
  CURRICULUM_MODULE_CLASS,
  CURRICULUM_ROW_CLASS,
} from "@/components/site/CurriculumLayout";
import { LocaleProvider, useLocale } from "@/lib/locale/locale-context";
import { Button } from "@/components/ui/button";
import { ReviewAccount } from "./adapters/account";
import { LessonView, packages } from "./LessonPreview";
import "./style.css";
function ReviewApp() {
  const search = useRouterState({ select: (s) => s.location.search }) as { locale?: string };
  const locale =
    search.locale && search.locale in packages ? (search.locale as keyof typeof packages) : "ar-EG";
  return (
    <ReviewAccount>
      <LocaleProvider initialLocale={locale}>
        <Page />
      </LocaleProvider>
    </ReviewAccount>
  );
}
function Page() {
  const { locale, dir, lang } = useLocale();
  const en = locale === "en";
  const lesson = packages[locale];
  const path = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [dir, lang]);
  const go = (to: string) => void router.navigate({ to, search: { locale } });
  const lessonPath = "/academic/learn/AC-BUS-M01-L01";
  const note = (
    <div
      className="screen-only border-b bg-accent/20 px-4 py-2 text-center text-xs leading-6"
      role="note"
    >
      {en
        ? "Interactive review · Account, purchases and assistant are not connected."
        : "معاينة تفاعلية · الحساب والشراء والمساعد غير متصلة بالخدمات الفعلية."}
    </div>
  );
  const curriculum = path === "/academic/curriculum";
  return (
    <>
      {note}
      {curriculum ? (
        <CurriculumLayout
          line={"academic" as "technical"}
          subtitle={
            en
              ? "Business foundations and building a venture"
              : "أساسيات إدارة الأعمال وبناء المشروعات"
          }
          summary={
            <p>
              {en
                ? "The curriculum is being expanded beyond 30 lessons and 30 study hours. Only lesson 1 is available in this review."
                : "المنهج قيد التوسعة ليتجاوز ٣٠ درسًا و٣٠ ساعة دراسة. المتاح في هذه المعاينة هو الدرس الأول فقط."}
            </p>
          }
        >
          <section className={CURRICULUM_MODULE_CLASS}>
            <h2 className="text-2xl font-bold">
              {en ? "Module 1 · Business foundations" : "الوحدة الأولى · أساسيات عالم الأعمال"}
            </h2>
            <button
              onClick={() => go(lessonPath)}
              className={`${CURRICULUM_ROW_CLASS} text-start hover:bg-primary/10`}
            >
              <span className="rounded-lg bg-primary/10 px-3 py-2">1</span>
              <span className="flex-1">{lesson.title}</span>
              <span>{en ? "Open lesson" : "افتح الدرس"} ←</span>
            </button>
          </section>
        </CurriculumLayout>
      ) : (
        <>
          <div className="screen-only">
            <Navbar variant="account" />
          </div>
          {path === lessonPath || path === "/" ? (
            <>
              <div className="screen-only mx-auto max-w-7xl px-4 pt-6">
                <button
                  className="font-bold text-primary"
                  onClick={() => go("/academic/curriculum")}
                >
                  {en ? "Back to curriculum" : "العودة إلى المنهج"}
                </button>
              </div>
              <LessonView key={locale} lesson={lesson} />
              <nav className="screen-only mx-auto flex max-w-7xl justify-between px-4 py-8">
                <button className="underline" onClick={() => go("/academic/curriculum")}>
                  {en ? "Curriculum" : "المنهج"}
                </button>
                <span className="text-sm text-muted-foreground">
                  {en ? "Next lesson is outside this pilot" : "الدرس التالي خارج نطاق العينة"}
                </span>
              </nav>
            </>
          ) : (
            <main className="container mx-auto px-4 py-16">
              <section className="glass mx-auto max-w-4xl rounded-3xl p-8 md:p-14">
                <p className="text-sm font-bold text-primary">
                  {en ? "Masaarat Academic" : "مسارات أكاديمي"}
                </p>
                <h1 className="mt-4 text-3xl font-black md:text-5xl">
                  {path === "/academic"
                    ? en
                      ? "Understand business. Apply what you learn."
                      : "افهم الأعمال وطبّق ما تتعلّمه."
                    : en
                      ? "This page is outside the lesson review"
                      : "هذه الصفحة خارج معاينة الدرس"}
                </h1>
                <p className="my-6 leading-8 text-muted-foreground">
                  {path === "/academic"
                    ? en
                      ? "An academic learning experience with explanations, worked cases, practice and assessment. The AI assistant is an optional separate subscription."
                      : "تجربة تعلم أكاديمية تجمع الشرح والحالات التطبيقية والتدريب والتقييم. المساعد الذكي إضافة اختيارية باشتراك منفصل."
                    : en
                      ? "No account, purchase or subscription action is performed in this review."
                      : "لا تُنفَّذ عمليات حساب أو شراء أو اشتراك داخل هذه المعاينة."}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => go(lessonPath)}>
                    {en ? "Try the first lesson" : "جرّب الدرس الأول"}
                  </Button>
                  <Button variant="outline" onClick={() => go("/academic/curriculum")}>
                    {en ? "View curriculum" : "استعرض المنهج"}
                  </Button>
                </div>
              </section>
            </main>
          )}
          <div className="screen-only">
            <Footer />
          </div>
        </>
      )}
    </>
  );
}
const root = createRootRoute({ component: ReviewApp });
const routes = [
  "/",
  "/academic",
  "/academic/curriculum",
  "/academic/pricing",
  "/academic/learn/AC-BUS-M01-L01",
  "/$",
].map((path) =>
  createRoute({
    getParentRoute: () => root,
    path,
    validateSearch: (s: Record<string, unknown>) => ({
      locale: typeof s.locale === "string" ? s.locale : "ar-EG",
    }),
  }),
);
const q = new URLSearchParams(window.location.search).get("locale") || "ar-EG";
const history = createMemoryHistory({
  initialEntries: [`/academic/learn/AC-BUS-M01-L01?locale=${encodeURIComponent(q)}`],
});
const router = createRouter({ routeTree: root.addChildren(routes), history });
createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
