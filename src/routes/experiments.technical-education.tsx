import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { TechnicalJourney } from "@/components/technical-education/TechnicalJourney";
import { catalog } from "@/lib/technical-education/catalog";
import { getTechnicalCopy } from "@/lib/technical-education/copy";
import { useLocale } from "@/lib/locale/locale-context";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";

export const Route = createFileRoute("/experiments/technical-education")({
  validateSearch: (raw: Record<string, unknown>) => ({
    ...parseLocaleSearchParam(raw),
    lesson:
      typeof raw.lesson === "string" && catalog.lessons.some((lesson) => lesson.id === raw.lesson)
        ? raw.lesson
        : undefined,
  }),
  head: async ({ match }) => {
    const locale = await resolveRouteHeadLocale({ searchLocale: match.search.locale });
    return {
      meta: [
        { title: `${getTechnicalCopy(locale).title} — Masaarat` },
        { name: "robots", content: "noindex,nofollow" },
      ],
    };
  },
  component: TechnicalEducationPage,
});
function TechnicalEducationPage() {
  const { locale } = useLocale();
  const { lesson } = Route.useSearch();
  return (
    <div className="min-h-dvh">
      <Navbar variant="account" showTechnicalPreview />
      <TechnicalJourney locale={locale} lessonId={lesson} />
    </div>
  );
}
