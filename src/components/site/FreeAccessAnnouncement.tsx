import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale/locale-context";
import { useUiString } from "@/lib/locale/use-ui-strings";

const storageKey = "masaarat:free-access-announcement";
const response = z
  .object({ id: z.string().uuid(), ends_at: z.string(), server_time: z.string() })
  .nullable();

export function FreeAccessAnnouncement() {
  const { user, loading } = useAuth();
  const { locale, dir } = useLocale();
  const t = useUiString();
  const [openedId, setOpenedId] = useState<string | null>(null);
  const { data, isError } = useQuery({
    queryKey: ["free-access-announcement"],
    enabled: !loading,
    retry: false,
    refetchInterval: openedId ? 30_000 : false,
    queryFn: async () => {
      const requestedAt = performance.now();
      const result = await supabase.rpc("get_free_access_announcement" as never);
      if (result.error) throw result.error;
      const notice = response.parse(result.data);
      if (!notice) return null;
      const remaining = Date.parse(notice.ends_at) - Date.parse(notice.server_time);
      if (!(remaining > 0)) return null;
      return { ...notice, deadline: requestedAt + remaining };
    },
  });
  const noticeId = data?.id;
  const deadline = data?.deadline;
  useEffect(() => {
    if (!noticeId || !deadline || deadline <= performance.now()) return;
    try {
      if (localStorage.getItem(storageKey) === noticeId) return;
      localStorage.setItem(storageKey, noticeId);
    } catch {
      // Keep the notice usable if the browser blocks storage.
    }
    setOpenedId(noticeId);
  }, [noticeId, deadline]);

  useEffect(() => {
    if (!openedId || !deadline) return;
    const duration = Math.min(2_147_483_647, Math.max(0, deadline - performance.now()));
    const timer = window.setTimeout(() => setOpenedId(null), duration);
    return () => window.clearTimeout(timer);
  }, [openedId, deadline]);

  if (!data || isError || data.id !== openedId || data.deadline <= performance.now()) return null;
  const end = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Cairo",
  }).format(new Date(data.ends_at));
  const close = () => setOpenedId(null);

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent
        dir={dir}
        className="w-[calc(100%_-_2rem)] max-w-md rounded-2xl border-primary/20 p-6 text-start sm:p-8"
        closeLabel={t("common.close")}
        closeButtonClassName="rtl:left-4 rtl:right-auto"
      >
        <div className="space-y-3 rounded-xl bg-primary/5 px-4 py-5 sm:px-5">
          <DialogTitle className="pe-4 text-2xl font-black leading-tight text-foreground">
            {t("campaign.popup.title")}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {t(user ? "campaign.popup.resume" : "campaign.popup.description")}
            <span className="mt-2 block font-semibold text-foreground">
              {t("campaign.popup.until")} <time dateTime={data.ends_at}>{end}</time>
            </span>
          </DialogDescription>
        </div>
        <Button asChild variant="hero" size="lg">
          <Link to={user ? "/my-learning" : "/signup"} search={{ locale }} onClick={close}>
            {t("campaign.popup.start")}
          </Link>
        </Button>
        {user ? (
          <Link
            to="/payments"
            search={{ locale }}
            hash="mail-preferences"
            onClick={close}
            className="text-center text-sm text-primary underline underline-offset-4"
          >
            {t("campaign.popup.emailPreferences")}
          </Link>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            {t("campaign.popup.emailOption")}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
