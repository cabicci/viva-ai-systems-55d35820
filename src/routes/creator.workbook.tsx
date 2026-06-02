import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Copy, Check, Download, Palette } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { getPath } from "@/lib/curriculum-data";
import { INTRO_LESSON_CONTENT } from "@/components/intro/lessons";
import type { IntroLessonSection } from "@/components/intro/intro-lesson-types";

export const Route = createFileRoute("/creator/workbook")({
  head: () => ({
    meta: [
      { title: "Creator Workbook — كل مهام مسار Creator في كتاب واحد" },
      {
        name: "description",
        content:
          "وثيقة موحّدة فيها ١٢ مهمة من مسار Creator — Manifesto، Pillars، Hooks، Scripts، CTAs، Calendar، Analytics، Funnel.",
      },
    ],
  }),
  component: CreatorWorkbookPage,
});

type WorkbookEntry = {
  lessonId: string;
  slug: string;
  moduleOrder: number;
  moduleTitle: string;
  lessonOrder: number;
  lessonTitle: string;
  intro: string;
  prompt: string;
};

function findMission(sections: readonly IntroLessonSection[] | undefined) {
  if (!sections) return null;
  for (const s of sections) {
    if (s.block.kind === "mission") return s.block;
  }
  return null;
}

function collectWorkbook(): WorkbookEntry[] {
  const creator = getPath("creator");
  if (!creator) return [];
  const out: WorkbookEntry[] = [];
  for (const m of creator.modules) {
    for (const l of m.lessons) {
      if (l.state !== "available") continue;
      const slug = l.route?.replace("/learn/creator/", "") ?? l.id;
      const content = INTRO_LESSON_CONTENT[slug];
      const mission = findMission(content);
      if (!mission) continue;
      out.push({
        lessonId: l.id,
        slug,
        moduleOrder: m.order,
        moduleTitle: m.title,
        lessonOrder: l.order,
        lessonTitle: l.title,
        intro: mission.intro,
        prompt: mission.prompt,
      });
    }
  }
  return out;
}

function CreatorWorkbookPage() {
  const entries = useMemo(collectWorkbook, []);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const fullDoc = useMemo(() => {
    const header = "Creator Workbook — كل مهام المسار في كتاب واحد\n" +
      "=".repeat(60) + "\n\n";
    const body = entries
      .map((e, i) => {
        const idx = String(i + 1).padStart(2, "0");
        return `## ${idx} · M${e.moduleOrder} — ${e.lessonTitle}\n(الموديول: ${e.moduleTitle})\n\n${e.intro}\n\n${e.prompt}\n`;
      })
      .join("\n" + "-".repeat(60) + "\n\n");
    return header + body;
  }, [entries]);

  async function copyOne(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* ignore */
    }
  }

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(fullDoc);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1800);
    } catch {
      /* ignore */
    }
  }

  function downloadDoc() {
    const blob = new Blob([fullDoc], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "creator_workbook.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen flex" dir="rtl">
      <Sidebar />
      <main className="flex-1 max-w-[52rem] mx-auto w-full px-4 sm:px-6 py-8 md:py-12">
        <Link
          to="/curriculum"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5 rotate-180" /> خريطة المنهج
        </Link>

        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 border border-accent/30 px-3 py-1 text-[11px] font-mono text-accent uppercase tracking-widest">
              <Palette className="h-3 w-3" /> Creator
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-[11px] font-mono text-primary uppercase tracking-widest">
              <BookOpen className="h-3 w-3" /> Workbook
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black leading-tight">
            Creator Workbook
          </h1>
          <p className="mt-3 text-muted-foreground leading-[1.9]">
            كل مهام مسار Creator في وثيقة واحدة. بدل ما عندك {entries.length} ملف
            منفصل، ده كتابك الشخصي اللي بتملاه وانت ماشي في الدروس — Manifesto،
            Pillars، Hooks، Scripts، CTAs، Calendar، Analytics، Funnel.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="hero" size="sm" onClick={copyAll}>
              {copiedAll ? (
                <>
                  <Check className="h-4 w-4" /> اتنسخ كله
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> انسخ الـ Workbook كامل
                </>
              )}
            </Button>
            <Button variant="glass" size="sm" onClick={downloadDoc}>
              <Download className="h-4 w-4" /> نزّل .md
            </Button>
          </div>
        </header>

        <ol className="space-y-6">
          {entries.map((e, i) => {
            const idx = String(i + 1).padStart(2, "0");
            return (
              <li
                key={e.lessonId}
                className="glass rounded-2xl p-5 border border-border/60"
              >
                <header className="mb-3 pb-3 border-b border-white/5">
                  <p className="text-[10px] font-mono text-muted-foreground tracking-widest mb-1">
                    {idx} · M{e.moduleOrder} — {e.moduleTitle}
                  </p>
                  <h2 className="text-lg md:text-xl font-extrabold leading-tight">
                    {e.lessonTitle}
                  </h2>
                </header>

                <p className="text-[14px] text-foreground/85 leading-[1.95] mb-3">
                  {e.intro}
                </p>

                <pre className="rounded-xl border border-white/10 bg-black/30 p-4 text-[12.5px] leading-[1.85] text-foreground/90 whitespace-pre-wrap font-mono overflow-x-auto">
                  {e.prompt}
                </pre>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => copyOne(e.lessonId, e.prompt)}
                  >
                    {copiedId === e.lessonId ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> تم النسخ
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> انسخ القالب
                      </>
                    )}
                  </Button>
                  <Button asChild variant="glass" size="sm">
                    <Link
                      to="/learn/$pathId/$lessonId"
                      params={{ pathId: "creator", lessonId: e.slug }}
                    >
                      <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                      افتح الدرس
                    </Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-10 text-center">
          <Button asChild variant="hero" size="lg">
            <Link to="/curriculum">
              <ArrowLeft className="h-4 w-4" />
              ارجع لخريطة المنهج
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}