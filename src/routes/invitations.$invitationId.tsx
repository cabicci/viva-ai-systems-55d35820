import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { commerceCommand } from "@/lib/commerce/commerce.functions";
import { commerceCopy } from "@/lib/commerce/copy";
import type { Invitation } from "@/lib/commerce/contracts";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale/locale-context";
import { Navbar } from "@/components/site/Navbar";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/invitations/$invitationId")({ component: InvitationPage });
function InvitationPage() {
  const { invitationId } = Route.useParams(),
    { user, loading } = useAuth(),
    { locale } = useLocale(),
    w = commerceCopy(locale),
    command = useServerFn(commerceCommand),
    qc = useQueryClient();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const result = useQuery({
    queryKey: ["commerce-invitation", user?.id, invitationId],
    queryFn: async () =>
      (await command({
        data: { action: "invitation", data: { id: invitationId } },
      })) as unknown as Invitation,
    enabled: !!user,
  });
  async function accept() {
    setBusy(true);
    try {
      await command({ data: { action: "accept", data: { id: invitationId } } });
      void result.refetch();
      void qc.invalidateQueries({ queryKey: ["user-subscription"] });
    } catch {
      setError(w.error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Navbar />
      <main
        className="mx-auto max-w-xl min-h-dvh px-4 py-16 space-y-5"
        dir={locale === "en" ? "ltr" : "rtl"}
      >
        <h1 className="text-2xl font-bold">{w.inviteTitle}</h1>
        {!user && !loading ? (
          <>
            <p>{w.verify}</p>
            <Link to="/login" search={{ locale }} className="text-primary underline">
              {w.continue}
            </Link>
            <p className="text-sm">
              {locale === "en"
                ? "After signing in, return to this invitation link."
                : "بعد تسجيل الدخول، ارجع إلى رابط الدعوة."}
            </p>
          </>
        ) : result.data ? (
          <>
            <p>
              {result.data.package} · {result.data.duration_days} {w.days}
            </p>
            <p>
              {w.deadline}: {new Date(result.data.deadline).toLocaleString()}
            </p>
            <p>
              {w.start}: {w[result.data.start_rule]}
            </p>
            {result.data.package === "kids" && (
              <Link to="/kids/family" search={{ locale }} className="underline">
                {w.kids}
              </Link>
            )}
            {result.data.access_kind === "external" && <p>{w.paidWait}</p>}
            {result.data.accepted_at ? (
              <>
                <p>{w.accepted}</p>
                <Link to="/payments" search={{ locale }} className="underline">
                  {w.orders}
                </Link>
              </>
            ) : (
              <Button disabled={busy} onClick={() => void accept()}>
                {w.accept}
              </Button>
            )}
          </>
        ) : result.error ? (
          <p role="alert">{w.verify}</p>
        ) : (
          <p>{w.pending}</p>
        )}
        {error && <p role="alert">{error}</p>}
      </main>
    </>
  );
}
