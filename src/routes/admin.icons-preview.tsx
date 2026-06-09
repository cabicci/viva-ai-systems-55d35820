import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/icons-preview")({
  head: () => ({ meta: [{ title: "Icon Preview — Masaarat Brand System" }] }),
  component: IconsPreviewPage,
});

const SVG_ICONS = [
  { name: "path-builder", label: "Path: Builder", path: "/brand/icons/path-builder.svg" },
  { name: "path-creator", label: "Path: Creator", path: "/brand/icons/path-creator.svg" },
  { name: "path-automator", label: "Path: Automator", path: "/brand/icons/path-automator.svg" },
  { name: "path-analyst", label: "Path: Analyst", path: "/brand/icons/path-analyst.svg" },
  { name: "path-business", label: "Path: Business", path: "/brand/icons/path-business.svg" },
  { name: "ai-spark", label: "AI: Spark", path: "/brand/icons/ai-spark.svg" },
  { name: "ai-brain", label: "AI: Brain", path: "/brand/icons/ai-brain.svg" },
  { name: "assistant-guide", label: "Assistant: Guide", path: "/brand/icons/assistant-guide.svg" },
];

const CONCEPT_ICONS = [
  { name: "path-builder", label: "Path: Builder", path: "/brand/icons/concepts/path-builder.png" },
  { name: "path-creator", label: "Path: Creator", path: "/brand/icons/concepts/path-creator.png" },
  { name: "path-automator", label: "Path: Automator", path: "/brand/icons/concepts/path-automator.png" },
  { name: "path-analyst", label: "Path: Analyst", path: "/brand/icons/concepts/path-analyst.png" },
  { name: "path-business", label: "Path: Business", path: "/brand/icons/concepts/path-business.png" },
  { name: "ai-spark", label: "AI: Spark", path: "/brand/icons/concepts/ai-spark.png" },
  { name: "ai-brain", label: "AI: Brain", path: "/brand/icons/concepts/ai-brain.png" },
  { name: "assistant-guide", label: "Assistant: Guide", path: "/brand/icons/concepts/assistant-guide.png" },
];

function IconGrid({ icons, ext }: { icons: typeof SVG_ICONS; ext: string }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
      {icons.map((icon) => (
        <div
          key={icon.name}
          className="rounded-xl border border-border/60 bg-white p-6 flex flex-col items-center gap-4"
        >
          {/* 48px */}
          <div className="flex flex-col items-center gap-2">
            <img
              src={icon.path}
              alt={icon.label}
              width={48}
              height={48}
              className="block"
              style={{ width: 48, height: 48 }}
            />
            <span className="text-[10px] text-muted-foreground font-mono">48px</span>
          </div>

          {/* 24px */}
          <div className="flex flex-col items-center gap-2">
            <img
              src={icon.path}
              alt={icon.label}
              width={24}
              height={24}
              className="block"
              style={{ width: 24, height: 24 }}
            />
            <span className="text-[10px] text-muted-foreground font-mono">24px</span>
          </div>

          {/* Label */}
          <div className="text-center">
            <p className="text-sm font-semibold">{icon.label}</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{icon.name}.{ext}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function IconsPreviewPage() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b border-border/60 bg-card/50 backdrop-blur sticky top-0 z-30">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-bold text-base">معاينة أيقونات الهوية — Masaarat</h1>
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 rotate-180 ml-1" />
              الرئيسية
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-12">
        {/* Concepts Section */}
        <section>
          <h2 className="text-lg font-bold mb-4 text-center">🎨 Concept Icons (PNG) — من Gemini</h2>
          <IconGrid icons={CONCEPT_ICONS} ext="png" />
        </section>

        {/* SVG Section */}
        <section>
          <h2 className="text-lg font-bold mb-4 text-center">🛠️ Current SVG Icons</h2>
          <IconGrid icons={SVG_ICONS} ext="svg" />
        </section>

        <p className="text-center text-xs text-muted-foreground">
          Preview only — no production pages were modified.
        </p>
      </main>
    </div>
  );
}
