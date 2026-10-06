import { createFileRoute } from "@tanstack/react-router";
import { TechnicalCurriculum } from "@/components/site/LineCurriculum";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
export const Route = createFileRoute("/technical/courses/furniture/contents")({
  validateSearch: parseLocaleSearchParam,
  component: TechnicalCurriculum,
});
