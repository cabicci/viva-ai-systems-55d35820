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
import { useLocale } from "@/lib/locale/locale-context";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { getUiString } from "@/lib/locale/ui-strings";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { useUiString } from "@/lib/locale/use-ui-strings";
import {
  getCurriculumLessonLabel,
  getCurriculumModuleLabel,
  getCurriculumPathLabel,
} from "@/lib/locale-curriculum/resolve-curriculum-label";

export const Route = createFileRoute("/system-state")({
  beforeLoad: requireAdminBeforeLoad,
  validateSearch: (raw: Record<string, unknown>) => parseLocaleSearchParam(raw),
  head: async ({ match }) => {
    const locale = await resolveRouteHeadLocale({
      searchLocale: match.search.locale,
    });
    return {
      meta: [
        { title: getUiString(locale, "systemState.meta.title") },
        {
          name: "description",
          content: getUiString(locale, "systemState.meta.description"),
        },
      ],
    };
  },
  component: () => (
    <AdminGate>
      <SystemStatePage />
    </AdminGate>
  ),
});

export function SystemStatePage() {
  const t = useUiString();
  const { locale, dir } = useLocale();
  const liveLessons = LESSONS.length;

  return (
    <div className="min-h-dvh flex" dir={dir}>
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
            <ArrowLeft className={`h-3.5 w-3.5 ${dir === "rtl" ? "rotate-180" : ""}`} />{" "}
            {t("common.backToDashboard")}
          </Link>
          <Button size="sm" onClick={() => window.print()} className="gap-2">
            <Download className="h-4 w-4" />
            {t("systemState.exportPdf")}
          </Button>
        </div>

        <header className="glass rounded-3xl p-8 md:p-12 mb-12 relative overflow-hidden border border-border/30">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
          <div className="relative">
            <p className="font-mono text-[11px] tracking-widest text-primary mb-4">
              {t("systemState.eyebrow")}
            </p>
            <h1 className="text-3xl md:text-5xl font-black leading-[1.3] mb-5">
              {t("systemState.title")}
            </h1>
            <p className="text-muted-foreground leading-loose max-w-2xl text-[15px] md:text-base">
              {t("systemState.intro")}
            </p>
            <div className="grid sm:grid-cols-3 gap-3 mt-6 max-w-xl">
              <Stat label={t("systemState.stat.routes")} value={String(ROUTES.length)} />
              <Stat
                label={t("systemState.stat.activeLessons")}
                value={t("systemState.stat.activeLessonsValue").replace(
                  "{count}",
                  String(liveLessons),
                )}
              />
              <Stat label={t("systemState.stat.pathsLive")} value={`${PATHS.length}`} />
            </div>
          </div>
        </header>

        <RuntimeContextPanel />
        <RetrievalPanel />
        <MissionRuntimePanel />

        <Section
          no="01"
          icon={RouteIcon}
          label={t("systemState.section.routes.label")}
          title={t("systemState.section.routes.title")}
        >
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
                  <p className="font-bold text-foreground text-sm mb-1">{t(r.titleKey)}</p>
                  <p className="text-xs text-muted-foreground leading-loose">{t(r.purposeKey)}</p>
                </div>
                <StatusPill status={r.status} />
              </div>
            ))}
          </div>
        </Section>

        <Section
          no="02"
          icon={BookOpen}
          label={t("systemState.section.lessons.label")}
          title={t("systemState.section.lessons.title")}
        >
          <p className="text-sm text-muted-foreground leading-loose">
            {t("systemState.section.lessons.bodyBefore")}{" "}
            <code className="font-mono text-primary">src/lib/unified-lessons.ts</code>{" "}
            {t("systemState.section.lessons.bodyRoute")}{" "}
            <code className="font-mono text-primary">/learn/$pathId/$lessonId</code>{" "}
            {t("systemState.section.lessons.bodyRender")}{" "}
            <code className="font-mono text-primary">IntroLessonRenderer</code>
            {t("systemState.section.lessons.bodyGoal")}
            <code className="font-mono text-primary">archived-lessons</code>
            {t("systemState.section.lessons.bodyLegacy")}{" "}
            <code className="font-mono text-primary">lessons-data.ts</code> ·{" "}
            <code className="font-mono text-primary">LessonEngine.tsx</code>{" "}
            {t("systemState.section.lessons.bodyNoExpand")}
          </p>
          {PATHS.map((path) => (
            <div key={path.id} className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-foreground">
                  {getCurriculumPathLabel(locale, path.id, "title")}
                </h3>
                <StatusPill status="live" />
                <code className="font-mono text-[10px] text-muted-foreground">{path.id}</code>
              </div>
              {path.modules.map((m) => (
                <div key={m.id} className="glass rounded-2xl p-5 border border-border/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {t("systemState.modulePrefix")} {String(m.order).padStart(2, "0")}
                    </span>
                    <h3 className="font-bold text-foreground">
                      {getCurriculumModuleLabel(locale, m.id, "title")}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {m.lessons.map((l) => (
                      <div
                        key={l.id}
                        className="grid md:grid-cols-[40px_1fr_auto_auto] items-center gap-3 rounded-lg border border-border/30 p-3"
                      >
                        <span className="font-mono text-[10px] text-muted-foreground">
                          0{l.order}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {getCurriculumLessonLabel(locale, l.id)}
                          </p>
                          <code className="font-mono text-[11px] text-muted-foreground">
                            {l.id}
                          </code>
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
            </div>
          ))}
          <div className="glass rounded-xl p-5 border border-border/40">
            <p className="text-sm text-foreground/90 mb-2 font-bold">
              {t("systemState.section.lessons.componentsTitle")}
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

        <Section
          no="03"
          icon={MapIcon}
          label={t("systemState.section.curriculum.label")}
          title={t("systemState.section.curriculum.title")}
        >
          <div className="grid md:grid-cols-2 gap-4">
            {PATHS.map((p) => (
              <div key={p.id} className="glass rounded-2xl p-5 border border-border/40">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold">{getCurriculumPathLabel(locale, p.id, "title")}</h3>
                  <StatusPill status="live" />
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {getCurriculumPathLabel(locale, p.id, "tagline")}
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {p.modules.map((m) => (
                    <li key={m.id}>
                      <span className="font-mono text-[10px] text-primary me-2">M{m.order}</span>
                      {getCurriculumModuleLabel(locale, m.id, "title")} —{" "}
                      {t("systemState.lessonsCount").replace("{count}", String(m.lessons.length))}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="glass rounded-xl p-5 border border-border/40">
            <p className="text-sm font-bold mb-2">{t("systemState.section.curriculum.navTitle")}</p>
            <p className="text-xs text-muted-foreground leading-loose font-mono">
              /dashboard → /curriculum → Module → /learn/&#123;pathId&#125;/&#123;lessonId&#125;
            </p>
          </div>
        </Section>

        <Section
          no="04"
          icon={TrendingUp}
          label={t("systemState.section.progression.label")}
          title={t("systemState.section.progression.title")}
        >
          <div className="grid md:grid-cols-2 gap-4">
            <Info
              title={t("systemState.progression.source.title")}
              body={t("systemState.progression.source.body")}
            />
            <Info
              title={t("systemState.progression.states.title")}
              body={t("systemState.progression.states.body")}
            />
            <Info
              title={t("systemState.progression.complete.title")}
              body={t("systemState.progression.complete.body")}
            />
            <Info
              title={t("systemState.progression.unlock.title")}
              body={t("systemState.progression.unlock.body")}
            />
            <Info
              title={t("systemState.progression.saved.title")}
              body={t("systemState.progression.saved.body")}
            />
            <Info
              title={t("systemState.progression.flow.title")}
              body={t("systemState.progression.flow.body")}
            />
          </div>
        </Section>

        <Section
          no="05"
          icon={Sparkles}
          label={t("systemState.section.ai.label")}
          title={t("systemState.section.ai.title")}
        >
          <div className="grid md:grid-cols-2 gap-4">
            <AIRow
              title={t("systemState.ai.assistant.title")}
              status="live"
              body={t("systemState.ai.assistant.body")}
            />
            <AIRow
              title={t("systemState.ai.retrieval.title")}
              status="live"
              body={t("systemState.ai.retrieval.body")}
            />
            <AIRow
              title={t("systemState.ai.contextual.title")}
              status="live"
              body={t("systemState.ai.contextual.body")}
            />
            <AIRow
              title={t("systemState.ai.multimodal.title")}
              status="partial"
              body={t("systemState.ai.multimodal.body")}
            />
            <AIRow
              title={t("systemState.ai.missionGuidance.title")}
              status="partial"
              body={t("systemState.ai.missionGuidance.body")}
            />
            <AIRow
              title={t("systemState.ai.workflow.title")}
              status="placeholder"
              body={t("systemState.ai.workflow.body")}
            />
          </div>
        </Section>

        <Section
          no="06"
          icon={Target}
          label={t("systemState.section.missions.label")}
          title={t("systemState.section.missions.title")}
        >
          <div className="grid md:grid-cols-2 gap-4">
            <Info
              title={t("systemState.missions.structure.title")}
              body={t("systemState.missions.structure.body")}
            />
            <Info
              title={t("systemState.missions.link.title")}
              body={t("systemState.missions.link.body")}
            />
            <Info
              title={t("systemState.missions.completion.title")}
              body={t("systemState.missions.completion.body")}
            />
            <Info
              title={t("systemState.missions.library.title")}
              body={t("systemState.missions.library.body")}
            />
          </div>
        </Section>

        <Section
          no="07"
          icon={Film}
          label={t("systemState.section.video.label")}
          title={t("systemState.section.video.title")}
        >
          <div className="grid md:grid-cols-2 gap-4">
            <AIRow
              title={t("systemState.video.bunny.title")}
              status="live"
              body={t("systemState.video.bunny.body")}
            />
            <AIRow
              title={t("systemState.video.remotion.title")}
              status="live"
              body={t("systemState.video.remotion.body")}
            />
            <AIRow
              title={t("systemState.video.relationship.title")}
              status="live"
              body={t("systemState.video.relationship.body")}
            />
            <AIRow
              title={t("systemState.video.variants.title")}
              status="partial"
              body={t("systemState.video.variants.body")}
            />
          </div>
        </Section>

        <Section
          no="08"
          icon={Layers}
          label={t("systemState.section.components.label")}
          title={t("systemState.section.components.title")}
        >
          <div className="grid md:grid-cols-2 gap-3">
            <CompRow
              area={t("systemState.components.lessonRenderer.area")}
              files="src/components/intro/IntroLessonRenderer.tsx"
              items={t("systemState.components.lessonRenderer.items")}
            />
            <CompRow
              area={t("systemState.components.lessonContent.area")}
              files="src/lib/unified-lessons.ts · src/components/intro/lessons/*"
              items={t("systemState.components.lessonContent.items")}
            />
            <CompRow
              area={t("systemState.components.assistant.area")}
              files="src/components/assistant/AssistantPanel.tsx"
              items={t("systemState.components.assistant.items")}
            />
            <CompRow
              area={t("systemState.components.dashboard.area")}
              files="src/components/dashboard/Sidebar.tsx"
              items={t("systemState.components.dashboard.items")}
            />
            <CompRow
              area={t("systemState.components.site.area")}
              files="src/components/site/*"
              items={t("systemState.components.site.items")}
            />
            <CompRow
              area={t("systemState.components.ui.area")}
              files="src/components/ui/*"
              items={t("systemState.components.ui.items")}
            />
          </div>
        </Section>

        <Section
          no="09"
          icon={Database}
          label={t("systemState.section.data.label")}
          title={t("systemState.section.data.title")}
        >
          <div className="grid md:grid-cols-2 gap-4">
            <Info
              title={t("systemState.data.lessons.title")}
              body={t("systemState.data.lessons.body")}
            />
            <Info
              title={t("systemState.data.missions.title")}
              body={t("systemState.data.missions.body")}
            />
            <Info
              title={t("systemState.data.progress.title")}
              body={t("systemState.data.progress.body")}
            />
            <Info
              title={t("systemState.data.userState.title")}
              body={t("systemState.data.userState.body")}
            />
            <Info title={t("systemState.data.ai.title")} body={t("systemState.data.ai.body")} />
            <Info
              title={t("systemState.data.notes.title")}
              body={t("systemState.data.notes.body")}
            />
          </div>
        </Section>

        <Section
          no="10"
          icon={AlertTriangle}
          label={t("systemState.section.gaps.label")}
          title={t("systemState.section.gaps.title")}
        >
          <div className="grid md:grid-cols-2 gap-3">
            {GAPS.map((g) => (
              <div key={g.titleKey} className="glass rounded-xl p-5 border border-destructive/25">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <p className="font-bold text-foreground text-sm">{t(g.titleKey)}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-loose">{t(g.bodyKey)}</p>
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
                {t("systemState.summary.label")}
              </p>
            </div>
            <div className="text-primary-foreground space-y-4 max-w-3xl mx-auto leading-loose text-[15px] md:text-base">
              <div>
                <p className="font-bold mb-2">{t("systemState.summary.completedTitle")}</p>
                <ul className="list-disc ps-5 space-y-1 text-primary-foreground/95">
                  <li>{t("systemState.summary.completed.1")}</li>
                  <li>{t("systemState.summary.completed.2")}</li>
                  <li>{t("systemState.summary.completed.3")}</li>
                  <li>{t("systemState.summary.completed.4")}</li>
                  <li>{t("systemState.summary.completed.5")}</li>
                  <li>{t("systemState.summary.completed.6")}</li>
                  <li>{t("systemState.summary.completed.7")}</li>
                  <li>{t("systemState.summary.completed.8")}</li>
                  <li>{t("systemState.summary.completed.9")}</li>
                </ul>
              </div>
              <div>
                <p className="font-bold mb-2">{t("systemState.summary.openTitle")}</p>
                <ul className="list-disc ps-5 space-y-1 text-primary-foreground/95">
                  <li>{t("systemState.summary.open.1")}</li>
                  <li>{t("systemState.summary.open.2")}</li>
                  <li>{t("systemState.summary.open.3")}</li>
                  <li>{t("systemState.summary.open.4")}</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
