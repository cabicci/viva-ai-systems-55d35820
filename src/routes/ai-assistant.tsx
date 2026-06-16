import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { AssistantPanel } from "@/components/assistant/AssistantPanel";
import { AuthSessionGate, requireAuthBeforeLoad } from "@/lib/auth-route-guard";

export const Route = createFileRoute("/ai-assistant")({
  beforeLoad: requireAuthBeforeLoad,
  head: () => ({
    meta: [
      { title: "مساعد المنصة — مسارات" },
      {
        name: "description",
        content:
          "مساعد المنصة الواعي بسياق المتعلم: يربط أسئلتك بدروس ومهام كل المسارات على masaarat.ai.",
      },
    ],
  }),
  component: AIAssistantPage,
});

function AIAssistantPage() {
  return (
    <AuthSessionGate>
      <AIAssistantContent />
    </AuthSessionGate>
  );
}

function AIAssistantContent() {
  return (
    <div dir="rtl" className="min-h-dvh text-foreground" style={{ background: "var(--gradient-hero)" }}>
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
        <header className="space-y-3">
          <Badge variant="outline" className="text-xs tracking-widest">
            مساعد المنصة
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold">مساعد المنصة</h1>
          <p className="text-muted-foreground leading-relaxed">
            اسأل عن الدروس، المهام، أو الخطوة التالية في أي مسار على مسارات.
          </p>
        </header>

        <AssistantPanel />
      </div>
    </div>
  );
}
