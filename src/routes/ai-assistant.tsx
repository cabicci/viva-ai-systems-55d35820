import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { AssistantPanel } from "@/components/assistant/AssistantPanel";
import { AuthSessionGate, requireAuthBeforeLoad } from "@/lib/auth-route-guard";
import { setAssistantSession } from "@/lib/assistant-session-store";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { useLocale } from "@/lib/locale/locale-context";
import { useUiString } from "@/lib/locale/use-ui-strings";
import { getUiString } from "@/lib/locale/ui-strings";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";

export const Route = createFileRoute("/ai-assistant")({
  beforeLoad: requireAuthBeforeLoad,
  head: async ({ match }) => {
    const locale = await resolveRouteHeadLocale({ searchLocale: match.search.locale });
    return {
      meta: [
        { title: getUiString(locale, "assistant.page.metaTitle") },
        {
          name: "description",
          content: getUiString(locale, "assistant.page.description"),
        },
      ],
    };
  },
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
  const { dir } = useLocale();
  const t = useUiString();
  const prompts = [
    t("assistant.page.prompt.start"),
    t("assistant.page.prompt.next"),
    t("assistant.page.prompt.concept"),
  ];

  return (
    <div
      dir={dir}
      className="min-h-dvh flex flex-col text-foreground"
      style={{ background: "var(--gradient-hero)" }}
    >
      <Sidebar />
      <main id="main-content" className="w-full flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
          <header className="space-y-3">
            <Badge variant="outline" className="text-xs tracking-widest">
              {t("assistant.page.eyebrow")}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold">{t("assistant.page.title")}</h1>
            <p className="text-muted-foreground leading-relaxed">
              {t("assistant.page.description")}
            </p>
          </header>

          <section aria-label={t("assistant.page.suggestions")} className="space-y-2">
            <p className="text-xs text-muted-foreground">{t("assistant.page.tryAsking")}</p>
            <div className="flex flex-wrap gap-2">
              {prompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAssistantSession({ query: p })}
                  className="text-xs md:text-sm rounded-full border border-border/60 bg-background/40 hover:bg-primary/10 hover:border-primary/40 px-3 py-1.5 transition"
                >
                  {p}
                </button>
              ))}
            </div>
          </section>

          <AssistantPanel />
        </div>
      </main>
    </div>
  );
}
