import { createFileRoute, redirect } from "@tanstack/react-router";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
export const Route = createFileRoute("/technical/curriculum")({
  validateSearch: parseLocaleSearchParam,
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/technical", search, replace: true });
  },
});
