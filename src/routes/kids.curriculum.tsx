import { createFileRoute, redirect } from "@tanstack/react-router";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
export const Route = createFileRoute("/kids/curriculum")({
  validateSearch: parseLocaleSearchParam,
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/kids", search, replace: true });
  },
});
