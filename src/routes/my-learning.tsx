import { createFileRoute } from "@tanstack/react-router";
import { JourneyPage } from "@/components/journey/JourneyPage";
import { FreeAccessAnnouncement } from "@/components/site/FreeAccessAnnouncement";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { AuthSessionGate } from "@/lib/auth-route-guard";
import { useLocale } from "@/lib/locale/locale-context";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { journeyCopy } from "@/lib/journey/copy";
export const Route = createFileRoute("/my-learning")({
  validateSearch: parseLocaleSearchParam,
  head: async ({ match }) => ({
    meta: [
      {
        title: journeyCopy(await resolveRouteHeadLocale({ searchLocale: match.search.locale }))
          .title,
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MyJourney,
});
function MyJourney() {
  const { locale } = useLocale();
  return (
    <AuthSessionGate loginSearch={{ locale, returnTo: "/my-learning" }}>
      <JourneyPage />
      <FreeAccessAnnouncement />
    </AuthSessionGate>
  );
}
