import { createFileRoute } from "@tanstack/react-router";
import { TechnicalCurriculum } from "@/components/site/LineCurriculum";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
export const Route = createFileRoute("/technical/courses/furniture")({
  validateSearch: parseLocaleSearchParam,
  head: () => ({
    meta: [
      { title: "Carpentry and furniture curriculum | Masaarat" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: TechnicalCurriculum,
});
