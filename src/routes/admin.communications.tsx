import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { requireAdminBeforeLoad } from "@/lib/admin-route-guard";
import { useLocale } from "@/lib/locale/locale-context";
import { CommunicationsConsole } from "@/components/communications/CommunicationsConsole";
import { getCommunicationsReadiness } from "@/lib/communications/communications.functions";

export const Route = createFileRoute("/admin/communications")({
  beforeLoad: requireAdminBeforeLoad,
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: CommunicationsPage,
});
function CommunicationsPage() {
  const { locale, dir } = useLocale();
  const load = useServerFn(getCommunicationsReadiness);
  const result = useQuery({
    queryKey: ["communications-readiness"],
    queryFn: () => load(),
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  return (
    <div className="min-h-dvh bg-background" dir={dir}>
      <header className="flex flex-wrap justify-between gap-3 border-b p-4">
        <h1 className="text-xl font-bold">{locale === "en" ? "Communications" : "الاتصالات"}</h1>
        <Link to="/admin" search={{ locale }} className="text-primary underline">
          {locale === "en" ? "Admin dashboard" : "لوحة الإدارة"}
        </Link>
      </header>
      <CommunicationsConsole
        locale={locale}
        readiness={result.data}
        loading={result.isFetching}
        error={result.isError}
        refresh={() => void result.refetch()}
      />
    </div>
  );
}
