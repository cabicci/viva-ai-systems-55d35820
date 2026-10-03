import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { FurniturePilotLesson } from "@/components/furniture-pilot/FurniturePilotLesson";
import { getPilotCopy } from "@/lib/furniture-pilot/content";
import { useLocale } from "@/lib/locale/locale-context";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";

/** Branch-only prototype: no catalogue, entitlement, account or database mutations. */
export const Route = createFileRoute("/experiments/furniture-pilot")({
  validateSearch: (raw: Record<string, unknown>) => parseLocaleSearchParam(raw),
  head: async ({ match }) => {
    const locale = await resolveRouteHeadLocale({ searchLocale: match.search.locale });
    return {
      meta: [
        { title: `${getPilotCopy(locale).title} — Masaarat` },
        { name: "robots", content: "noindex,nofollow" },
      ],
    };
  },
  component: FurniturePilotPage,
});

function FurniturePilotPage() {
  const { locale } = useLocale();
  return (
    <div className="min-h-dvh">
      <Navbar variant="account" />
      <FurniturePilotLesson locale={locale} />
    </div>
  );
}
