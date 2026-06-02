import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { AssistantPanel } from "@/components/assistant/AssistantPanel";

export const Route = createFileRoute("/ai-assistant")({
  head: () => ({
    meta: [
      { title: "مساعد المنصة — AI Assistant" },
      {
        name: "description",
        content:
          "مساعد المنصة الواعي بسياق المتعلم: يربط أسئلتك بدروس ومهام منصة Builder.",
      },
    ],
  }),
  component: AIAssistantPage,
});

function AIAssistantPage() {
  return (
    <div dir="rtl" className="min-h-screen text-foreground" style={{ background: "var(--gradient-hero)" }}>
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
        <header className="space-y-3">
          <Badge variant="outline" className="text-xs tracking-widest">
            AI ASSISTANT
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold">مساعد المنصة</h1>
          <p className="text-muted-foreground leading-relaxed">
            اسأل عن الدروس، المهام، أو الخطوة التالية داخل رحلة البناء.
          </p>
        </header>

        <AssistantPanel />
      </div>
    </div>
  );
}
