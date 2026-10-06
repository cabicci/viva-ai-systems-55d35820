import { createFileRoute, redirect } from "@tanstack/react-router";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
export const Route = createFileRoute("/academic/curriculum")({
  validateSearch: parseLocaleSearchParam,
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/academic", search, replace: true });
  },
});
