import { createFileRoute, redirect } from "@tanstack/react-router";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
/** Legacy entry point; one canonical account journey, with locale preserved. */
export const Route = createFileRoute("/dashboard")({
  validateSearch: parseLocaleSearchParam,
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/my-learning", search, replace: true });
  },
});
