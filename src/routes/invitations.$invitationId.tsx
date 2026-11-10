import { createFileRoute, Link } from "@tanstack/react-router";
import { useLayoutEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { commerceCommand } from "@/lib/commerce/commerce.functions";
import { commerceCopy } from "@/lib/commerce/copy";
import type { Invitation } from "@/lib/commerce/contracts";
import { useAuth } from "@/lib/auth-context";
import { isInvitationAuthReturn } from "@/lib/kids/auth-intent";
import { useLocale } from "@/lib/locale/locale-context";
import { Navbar } from "@/components/site/Navbar";
import { OfferPhone } from "@/components/commerce/OfferPhone";
import { normalizeOfferPhone } from "@/lib/commerce/offer-input";
import { adminOfferCopy, offerError } from "@/lib/commerce/admin-offer-copy";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/invitations/$invitationId")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: InvitationPage,
});
function InvitationPage() {
  const { invitationId } = Route.useParams();
  const { user, loading } = useAuth();
  const userId = user?.id ?? null;
  return (
    <ScopedInvitation
      key={JSON.stringify([invitationId, userId])}
      invitationId={invitationId}
      userId={userId}
      loading={loading}
    />
  );
}

function ScopedInvitation({
  invitationId,
  userId,
  loading,
}: {
  invitationId: string;
  userId: string | null;
  loading: boolean;
}) {
  const returnTo = `/invitations/${invitationId}`;
  const validInvitation = isInvitationAuthReturn(returnTo);
  const { locale } = useLocale(),
    w = commerceCopy(locale),
    command = useServerFn(commerceCommand),
    qc = useQueryClient();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [phone, setPhone] = useState("");
  const active = useRef(false);
  useLayoutEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const result = useQuery({
    queryKey: ["commerce-invitation", userId, invitationId],
    queryFn: async () => {
      if (!userId) throw new Error("ACCOUNT_CHANGED");
      return (await command({
        data: { action: "invitation", expectedAccountId: userId, data: { id: invitationId } },
      })) as unknown as Invitation;
    },
    enabled: !!userId && !loading && validInvitation,
  });
  async function accept() {
    if (!active.current || !userId || loading || !validInvitation || !result.data || busy) return;
    setError("");
    if (result.data?.offer_id && !normalizeOfferPhone(phone)) {
      setError(adminOfferCopy(locale).phoneError);
      return;
    }
    setBusy(true);
    try {
      await command({
        data: {
          action: "accept",
          expectedAccountId: userId,
          data: {
            id: invitationId,
            ...(result.data?.offer_id ? { phone: normalizeOfferPhone(phone) } : {}),
          },
        },
      });
      if (active.current) void result.refetch();
      void qc.invalidateQueries({
        queryKey: ["user-subscription", userId],
        exact: true,
        refetchType: active.current ? "active" : "none",
      });
    } catch (err) {
      if (active.current) setError(offerError(err, locale, w.error));
    } finally {
      if (active.current) setBusy(false);
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
        {!validInvitation ? (
          <p role="alert">{w.verify}</p>
        ) : loading ? (
          <p>{w.pending}</p>
        ) : !userId ? (
          <>
            <p>{w.verify}</p>
            <Link to="/login" search={{ locale, returnTo }} className="text-primary underline">
              {w.continue}
            </Link>
          </>
        ) : result.error ? (
          <p role="alert">{w.verify}</p>
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
                <Link
                  to="/payments"
                  search={{ locale, order: result.data.order_id }}
                  className="underline"
                >
                  {w.orders}
                </Link>
              </>
            ) : (
              <>
                {result.data.offer_id && <OfferPhone value={phone} onChange={setPhone} />}
                <Button
                  disabled={busy || (!!result.data.offer_id && !normalizeOfferPhone(phone))}
                  onClick={() => void accept()}
                >
                  {w.accept}
                </Button>
              </>
            )}
          </>
        ) : (
          <p>{w.pending}</p>
        )}
        {error && <p role="alert">{error}</p>}
      </main>
    </>
  );
}
