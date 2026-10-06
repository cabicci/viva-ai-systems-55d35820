import { createFileRoute, notFound } from "@tanstack/react-router";
import { KIDS_LEVELS } from "@/lib/kids/catalogue";
import { PathIntroduction } from "@/components/site/PathIntroduction";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
export const Route = createFileRoute("/kids/$levelId/")({
  validateSearch: parseLocaleSearchParam,
  beforeLoad: ({ params }) => {
    if (!KIDS_LEVELS.some((l) => l.id === params.levelId)) throw notFound();
  },
  component: KidsPathIntroduction,
});
function KidsPathIntroduction() {
  const { levelId } = Route.useParams();
  const level = KIDS_LEVELS.find((l) => l.id === levelId)!;
  return (
    <PathIntroduction line="kids" ages={level.ages} contentsHref={`/kids/${levelId}/contents`} />
  );
}
