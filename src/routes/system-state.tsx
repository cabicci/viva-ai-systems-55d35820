import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminGate } from "@/components/AdminGate";
import { requireAdminBeforeLoad } from "@/lib/admin-route-guard";
import {
  ArrowLeft,
  Route as RouteIcon,
  BookOpen,
  Map as MapIcon,
  TrendingUp,
  Sparkles,
  Target,
  Film,
  Layers,
  Database,
  AlertTriangle,
  FileText,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { LESSONS } from "@/lib/unified-lessons";
import { PATHS } from "@/lib/curriculum-data";
import {
  Section,
  StatusPill,
  Stat,
  Info,
  AIRow,
  CompRow,
} from "@/components/system-state/primitives";
import { ROUTES, GAPS } from "@/components/system-state/data";
import { RuntimeContextPanel } from "@/components/system-state/RuntimeContextPanel";
import { MissionRuntimePanel } from "@/components/system-state/MissionRuntimePanel";
import { RetrievalPanel } from "@/components/system-state/RetrievalPanel";

export const Route = createFileRoute("/system-state")({
  beforeLoad: requireAdminBeforeLoad,
  head: () => ({
    meta: [
      { title: "مسارات — System State" },
      {
        name: "description",
        content:
          "لقطة داخلية كاملة عن الحالة الحالية للمنصة: الراوتس، الدروس، التقدّم، والأنظمة المتصلة.",
      },
    ],
  }),
  component: () => (
    <AdminGate>
      <SystemStatePage />
    </AdminGate>
  ),
});

function SystemStatePage() {
  const builder = PATHS.find((p) => p.id === "builder")!;
  const otherPaths = PATHS.filter((p) => p.id !== "builder");

  const totalLessons = PATHS.flatMap((p) => p.modules).flatMap(
    (m) => m.lessons,
  ).length;
  const liveLessons = LESSONS.length;

  return (
    <div className="min-h-dvh flex" dir="rtl">
      <style>{`
        /* Print/export — semantic theme tokens for reliable PDF output. */
        @media print {
          @page { size: A4; margin: 14mm; }
          html, body { background: var(--background) !important; }
          aside, [data-print-hide] { display: none !important; }
          main { max-width: 100% !important; padding: 0 !important; }
          .glass {
            background: var(--card) !important;
            border: 1px solid var(--border) !important;
            backdrop-filter: none !important;
            box-shadow: none !important;
          }
          .glow-primary, [class*="bg-[image:var(--gradient-primary)]"] {
            background: var(--muted) !important;
            color: var(--foreground) !important;
          }
          [class*="blur-3xl"] { display: none !important; }
          * { color: var(--foreground) !important; }
          .text-muted-foreground { color: var(--muted-foreground) !important; }
          section, header { break-inside: avoid; page-break-inside: avoid; }
          h1, h2, h3 { break-after: avoid; }
        }
      `}</style>
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6" data-print-hide>
          <Link
            to="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5 rotate-180" /> العودة للوحة
          </Link>
          <Button size="sm" onClick={() => window.print()} className="gap-2">
            <Download className="h-4 w-4" />
            تصدير PDF
          </Button>
        </div>

        <header className="glass rounded-3xl p-8 md:p-12 mb-12 relative overflow-hidden border border-border/30">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
          <div className="relative">
            <p className="font-mono text-[11px] tracking-widest text-primary mb-4">
              INTERNAL · SYSTEM SNAPSHOT
            </p>
            <h1 className="text-3xl md:text-5xl font-black leading-[1.3] mb-5">
              System State
            </h1>
            <p className="text-muted-foreground leading-loose max-w-2xl text-[15px] md:text-base">
              لقطة داخلية للمنصة بحالتها الحقيقية الحالية — للمراجعة المعمارية
              فقط، بدون أي تعديل أو إصلاح تلقائي.
            </p>
            <div className="grid sm:grid-cols-3 gap-3 mt-6 max-w-xl">
              <Stat label="Routes" value={String(ROUTES.length)} />
              <Stat label="Live Lessons" value={`${liveLessons} / ${totalLessons}`} />
              <Stat label="Paths" value={`${PATHS.length}`} />
            </div>
          </div>
        </header>

        <RuntimeContextPanel />
        <RetrievalPanel />
        <MissionRuntimePanel />

        <Section no="01" icon={RouteIcon} label="ROUTES" title="الراوتس الحالية">
          <div className="space-y-2">
            {ROUTES.map((r) => (
              <div
                key={r.path}
                className="glass rounded-xl p-4 md:p-5 border border-border/40 grid md:grid-cols-[220px_1fr_auto] gap-3 items-start"
              >
                <code className="font-mono text-xs text-primary bg-primary/10 rounded px-2 py-1 w-fit">
                  {r.path}
                </code>
                <div>
                  <p className="font-bold text-foreground text-sm mb-1">{r.title}</p>
                  <p className="text-xs text-muted-foreground leading-loose">{r.purpose}</p>
                </div>
                <StatusPill status={r.status} />
              </div>
            ))}
          </div>
        </Section>

        <Section no="02" icon={BookOpen} label="LESSON SYSTEM STATE" title="حالة نظام الدروس">
          <p className="text-sm text-muted-foreground leading-loose">
            مصدر الحقيقة:{" "}
            <code className="font-mono text-primary">src/lib/lessons-data.ts</code> + محرك الدرس{" "}
            <code className="font-mono text-primary">src/components/lesson/LessonEngine.tsx</code>.
          </p>
          {builder.modules.map((m) => (
            <div key={m.id} className="glass rounded-2xl p-5 border border-border/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-[10px] text-muted-foreground">
                  MODULE {String(m.order).padStart(2, "0")}
                </span>
                <h3 className="font-bold text-foreground">{m.title}</h3>
              </div>
              <div className="space-y-2">
                {m.lessons.map((l) => (
                  <div
                    key={l.id}
                    className="grid md:grid-cols-[40px_1fr_auto_auto] items-center gap-3 rounded-lg border border-border/30 p-3"
                  >
                    <span className="font-mono text-[10px] text-muted-foreground">0{l.order}</span>
                    <div>
                      <p className="text-sm font-bold text-foreground">{l.title}</p>
                      <code className="font-mono text-[11px] text-muted-foreground">{l.id}</code>
                    </div>
                    <StatusPill status={l.state === "available" ? "live" : "placeholder"} />
                    {l.route && (
                      <code className="font-mono text-[10px] text-primary">{l.route}</code>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="glass rounded-xl p-5 border border-border/40">
            <p className="text-sm text-foreground/90 mb-2 font-bold">
              مكونات الدرس المتصلة (لكل lesson)
            </p>
            <p className="text-xs text-muted-foreground leading-loose">
              <code className="font-mono text-primary">Concept</code> ·{" "}
              <code className="font-mono text-primary">MentalModel</code> ·{" "}
              <code className="font-mono text-primary">Models</code> ·{" "}
              <code className="font-mono text-primary">Example</code> ·{" "}
              <code className="font-mono text-primary">Comparison</code> ·{" "}
              <code className="font-mono text-primary">Failures</code> ·{" "}
              <code className="font-mono text-primary">CoreRule</code> ·{" "}
              <code className="font-mono text-primary">Mission</code> ·{" "}
              <code className="font-mono text-primary">Takeaways</code>
            </p>
          </div>
        </Section>

        <Section no="03" icon={MapIcon} label="CURRICULUM MAP STATE" title="حالة خريطة المنهج">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-5 border border-primary/25">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold">Builder Path</h3>
                <StatusPill status="live" />
              </div>
              <p className="text-xs text-muted-foreground mb-3">{builder.tagline}</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {builder.modules.map((m) => (
                  <li key={m.id}>
                    <span className="font-mono text-[10px] text-primary mr-2">M{m.order}</span>
                    {m.title} — {m.lessons.length} lessons
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass rounded-2xl p-5 border border-border/40">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold">المسارات الأخرى</h3>
                <StatusPill status="live" />
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {otherPaths.map((p) => (
                  <li key={p.id}>
                    <span className="font-mono text-[10px] text-accent mr-2">
                      {p.id.toUpperCase()}
                    </span>
                    {p.title} — {p.tagline}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="glass rounded-xl p-5 border border-border/40">
            <p className="text-sm font-bold mb-2">Navigation Hierarchy</p>
            <p className="text-xs text-muted-foreground leading-loose font-mono">
              /dashboard → /curriculum → Module → /learn/&#123;pathId&#125;/&#123;lessonId&#125;
            </p>
          </div>
        </Section>

        <Section no="04" icon={TrendingUp} label="PROGRESSION SYSTEM STATE" title="حالة نظام التقدّم">
          <div className="grid md:grid-cols-2 gap-4">
            <Info title="مصدر الحقيقة" body="src/lib/lesson-progress.ts — Hook عبر React Query متصل بجدول lesson_progress في Lovable Cloud." />
            <Info title="الحالات المدعومة" body="not-started · in-progress · completed (مخزّنة per user_id + lesson_id)." />
            <Info title="ما الذي يُكمل الدرس؟" body="setStatus('completed') من داخل LessonEngine — عند وصول المتعلم لنهاية الدرس وضغط زر الإتمام." />
            <Info title="Unlock Logic" body="حاليًا غير مفعّل — كل الدروس المتاحة مفتوحة بدون gating." />
            <Info title="Saved Progress" body="Persisted server-side per user. عند تسجيل الدخول التقدّم بيتحمّل أوتوماتيك." />
            <Info title="Learner Flow" body="Landing → Sign up → Onboarding → Dashboard → Curriculum → Lesson → Mark Complete." />
          </div>
        </Section>

        <Section no="05" icon={Sparkles} label="AI SYSTEM STATE" title="حالة أنظمة الـ AI">
          <div className="grid md:grid-cols-2 gap-4">
            <AIRow title="Assistant" status="placeholder" body="مفهوم معروض داخل دروس (Multimodal/RAG/Agent) لكن لا يوجد runtime assistant مفعّل بعد." />
            <AIRow title="Retrieval (RAG)" status="placeholder" body="معرّف تعليميًا فقط — لا يوجد Knowledge Base متصل أو vector store." />
            <AIRow title="Contextual Logic" status="placeholder" body="لا يوجد context tracker حقيقي يقرأ موقع المتعلم لحظيًا." />
            <AIRow title="Multimodal" status="placeholder" body="درس تعليمي فقط — لا يوجد vision pipeline متصل." />
            <AIRow title="Mission Guidance" status="partial" body="Mission Cards ثابتة داخل الدرس، بدون AI guidance حي." />
            <AIRow title="Workflow / Agents" status="placeholder" body="معرّف كمفهوم — لا يوجد agent runtime أو tool-use منفّذ." />
          </div>
        </Section>

        <Section no="06" icon={Target} label="MISSION SYSTEM STATE" title="حالة نظام المهام">
          <div className="grid md:grid-cols-2 gap-4">
            <Info title="هيكل المهمة" body="MissionCard داخل lessons-data.ts — عنوان + خطوات أو نص قصير." />
            <Info title="الاتصال بالدرس" body="كل درس متاح فيه Mission واحدة في نهايته." />
            <Info title="إكمال المهمة" body="حاليًا تعليمي — مفيش tracking مستقل للـ mission completion (مرتبط بإكمال الدرس فقط)." />
            <Info title="Mission Library" body="غير موجودة — مفيش صفحة /missions منفصلة بعد." />
          </div>
        </Section>

        <Section no="07" icon={Film} label="VIDEO SYSTEM STATE" title="حالة نظام الفيديو">
          <div className="grid md:grid-cols-2 gap-4">
            <AIRow title="Cinematic Intro" status="placeholder" body="مذكور في Behavior Architecture — مفيش player مدمج بعد." />
            <AIRow title="Build / Failure / Mission Videos" status="placeholder" body="غير متصلة بالدروس حاليًا." />
            <AIRow title="Lesson ↔ Video Relationship" status="placeholder" body="المخطط: Video = Lesson + Mission + Real Platform Context — غير منفّذ." />
          </div>
        </Section>

        <Section no="08" icon={Layers} label="UI COMPONENT MAP" title="خريطة المكوّنات المعاد استخدامها">
          <div className="grid md:grid-cols-2 gap-3">
            <CompRow area="Lesson Blocks" files="src/components/lesson/blocks.tsx" items="Section · ConceptCard · DialogueLine · ModelRow · ComparisonCard · CoreRuleBanner · Chip" />
            <CompRow area="Lesson Engine" files="src/components/lesson/LessonEngine.tsx" items="مسؤول عن render الدرس + completion." />
            <CompRow area="Mission" files="src/components/lesson/MissionCard.tsx" items="MissionCard." />
            <CompRow area="Dashboard / Nav" files="src/components/dashboard/Sidebar.tsx" items="Sidebar الرئيسي للصفحات الداخلية." />
            <CompRow area="Site / Landing" files="src/components/site/*" items="Hero · Journey · Ecosystem · Philosophy · CTA · Navbar · Footer." />
            <CompRow area="UI Primitives" files="src/components/ui/*" items="shadcn primitives (button, card, dialog, ...)." />
          </div>
        </Section>

        <Section no="09" icon={Database} label="DATABASE / STORAGE PLACEHOLDERS" title="افتراضات الـ Frontend">
          <div className="grid md:grid-cols-2 gap-4">
            <Info title="Lessons" body="Static — معرّفة محليًا في src/lib/lessons-data.ts (مفيش lessons table في الـ DB)." />
            <Info title="Missions" body="Static — جزء من بيانات الدرس نفسه." />
            <Info title="Progress" body="جدول lesson_progress في Lovable Cloud (user_id, lesson_id, status) مع RLS." />
            <Info title="User State" body="مدار عبر Supabase Auth + auth-context. مفيش profiles table مرتبط بعد." />
            <Info title="AI Systems" body="مفيش AI tables أو vector store أو edge functions منشورة بعد." />
            <Info title="Notes" body="جدول lesson_notes في DB بدون واجهة حاليًا — متروك لميزة لاحقة." />
          </div>
        </Section>

        <Section no="10" icon={AlertTriangle} label="ECOSYSTEM GAPS" title="فجوات المنظومة الحالية">
          <div className="grid md:grid-cols-2 gap-3">
            {GAPS.map((g) => (
              <div key={g.title} className="glass rounded-xl p-5 border border-destructive/25">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <p className="font-bold text-foreground text-sm">{g.title}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-loose">{g.body}</p>
              </div>
            ))}
          </div>
        </Section>

        <section className="relative rounded-3xl overflow-hidden glow-primary mb-6">
          <div className="absolute inset-0 bg-[image:var(--gradient-primary)] opacity-95" />
          <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/15 blur-3xl" />
          <div className="relative p-8 md:p-12">
            <div className="flex items-center gap-2 mb-5 justify-center">
              <FileText className="h-4 w-4 text-primary-foreground/80" />
              <p className="font-mono text-[11px] tracking-widest text-primary-foreground/70">
                FINAL SYSTEM SUMMARY
              </p>
            </div>
            <div className="text-primary-foreground space-y-4 max-w-3xl mx-auto leading-loose text-[15px] md:text-base">
              <div>
                <p className="font-bold mb-2">Completed runtime foundations:</p>
                <ul className="list-disc pr-5 space-y-1 text-primary-foreground/95">
                  <li>Context Layer Foundation</li>
                  <li>Retrieval Layer Foundation</li>
                  <li>Assistant Runtime Shell</li>
                  <li>Mission Runtime Foundation</li>
                  <li>Build Logs Runtime Foundation</li>
                  <li>Build Logs Timeline View</li>
                  <li>Cloud sync hydration for build logs + missions</li>
                  <li>Admin role via user_roles + has_role()</li>
                </ul>
              </div>
              <div>
                <p className="font-bold mb-2">Still not implemented:</p>
                <ul className="list-disc pr-5 space-y-1 text-primary-foreground/95">
                  <li>Real AI API via secure Edge Function</li>
                  <li>Vector database / embeddings</li>
                  <li>Public Build Logs page</li>
                  <li>Video runtime</li>
                  <li>Agent runtime</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}