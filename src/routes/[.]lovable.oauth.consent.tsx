import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (raw: Record<string, unknown>) => ({
    authorization_id:
      typeof raw.authorization_id === "string" ? raw.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("طلب الاتصال غير مكتمل.");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = `${location.pathname}${location.searchStr}`;
      throw redirect({ to: "/login", search: { next } });
    }
  },
  loader: async ({ search }) => {
    const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(
      search.authorization_id,
    );
    if (error) throw error;
    if (data && "redirect_url" in data) throw redirect({ href: data.redirect_url });
    return data;
  },
  head: () => ({
    meta: [
      { title: "الموافقة على الاتصال — مسارات" },
      {
        name: "description",
        content: "راجع ووافق على اتصال مساعد خارجي بحسابك في مسارات.",
      },
      { property: "og:title", content: "الموافقة على الاتصال — مسارات" },
      {
        property: "og:description",
        content: "راجع ووافق على اتصال مساعد خارجي بحسابك في مسارات.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConsentPage,
  errorComponent: ({ error }) => (
    <main dir="rtl" className="min-h-dvh grid place-items-center p-6">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-2xl font-bold">تعذّر فتح طلب الاتصال</h1>
        <p role="alert" className="text-muted-foreground">
          {error instanceof Error ? error.message : "حاول بدء الاتصال مرة أخرى."}
        </p>
      </div>
    </main>
  ),
});

function ConsentPage() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!details || !("authorization_id" in details)) return null;

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const response = approve
      ? await supabase.auth.oauth.approveAuthorization(authorization_id, {
          skipBrowserRedirect: true,
        })
      : await supabase.auth.oauth.denyAuthorization(authorization_id, {
          skipBrowserRedirect: true,
        });

    if (response.error) {
      setBusy(false);
      setError(response.error.message);
      return;
    }
    if (!response.data?.redirect_url) {
      setBusy(false);
      setError("لم يصل رابط العودة. ابدأ الاتصال مرة أخرى.");
      return;
    }
    window.location.assign(response.data.redirect_url);
  }

  return (
    <main dir="rtl" className="min-h-dvh grid place-items-center p-6 bg-background">
      <section className="w-full max-w-lg space-y-7 border border-border bg-card p-7 shadow-sm">
        <div className="space-y-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ShieldCheck aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold">
            ربط {details.client.name || "مساعد خارجي"} بحسابك
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            بعد موافقتك، يقدر المساعد يشوف تقدّم دروسك ويحدّث حالة الدرس نيابةً عنك.
          </p>
        </div>

        <div className="border-y border-border py-4 text-sm space-y-2">
          <p><span className="text-muted-foreground">الحساب:</span> {details.user.email}</p>
          <p><span className="text-muted-foreground">التطبيق:</span> {details.client.name}</p>
        </div>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button type="button" variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
            رفض
          </Button>
          <Button type="button" variant="hero" className="flex-1" disabled={busy} onClick={() => decide(true)}>
            {busy ? "جارٍ التنفيذ…" : "موافقة وربط"}
          </Button>
        </div>
      </section>
    </main>
  );
}