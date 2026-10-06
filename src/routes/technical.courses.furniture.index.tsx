import { createFileRoute } from "@tanstack/react-router";
import { PathIntroduction } from "@/components/site/PathIntroduction";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
export const Route = createFileRoute("/technical/courses/furniture/")({
  validateSearch: parseLocaleSearchParam,
  component: () => (
    <PathIntroduction line="technical" contentsHref="/technical/courses/furniture/contents" />
  ),
});
