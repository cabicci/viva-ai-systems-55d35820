import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/locale/locale-context";
import { useUiString } from "@/lib/locale/use-ui-strings";

const LABELS = {
  "ar-EG": "إدارة الاشتراك والترقية",
  "ar-MSA": "إدارة الاشتراك والترقية",
  "ar-Gulf": "إدارة الاشتراك والترقية",
  en: "Manage or upgrade subscription",
} as const;

export function StripePortalButton() {
  const [loading, setLoading] = useState(false);
  const { locale } = useLocale();
  const t = useUiString();

  async function openPortal() {
    if (loading) return;
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        window.location.assign("/login");
        return;
      }

      const { data, error } = await supabase.functions.invoke("billing-stripe-portal");
      if (error || !data?.url) throw error ?? new Error("Missing portal URL");
      window.location.assign(data.url);
    } catch {
      toast.error(t("pricing.checkout.error"));
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="violet" size="lg" className="mt-5 w-full" disabled={loading} onClick={() => void openPortal()}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CreditCard className="h-4 w-4" />}
      <span className="min-w-0 whitespace-normal text-center leading-tight">{LABELS[locale]}</span>
    </Button>
  );
}
