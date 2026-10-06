import { createFileRoute } from "@tanstack/react-router";
import { CurriculumLayout } from "@/components/site/CurriculumLayout";
import { CourseCatalogue } from "@/components/site/CourseCatalogue";
import { getPathDefinition } from "@/lib/path-story";
import { getLineCopy, lineMeta } from "@/lib/learning-lines";
import { useLocale } from "@/lib/locale/locale-context";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
export const Route = createFileRoute("/ai/")({
  validateSearch: parseLocaleSearchParam,
  head: async ({ match }) =>
    lineMeta(await resolveRouteHeadLocale({ searchLocale: match.search.locale }), "ai"),
  component: AICatalogue,
});
export function AICatalogue() {
  const { locale } = useLocale();
  const d = getPathDefinition("ai", locale);
  return (
    <CurriculumLayout line="ai" subtitle={getLineCopy(locale).aiIntro}>
      <CourseCatalogue
        line="ai"
        courses={[
          {
            id: "applied",
            title: d.title,
            description: d.intro,
            lessonCount: 100,
            moduleCount: 5,
            href: `/ai/paths/applied?locale=${locale}`,
          },
        ]}
      />
    </CurriculumLayout>
  );
}
