import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale/locale-context";
import { Button } from "@/components/ui/button";
import { getKidsPrivacyCopy } from "@/lib/kids/privacy-copy";
import { useKidsPrivacyRecord } from "@/lib/kids/privacy-record";
import { StripePortalButton } from "@/components/billing/StripePortalButton";

type Receipt = {
  profile_id: string;
  accepted_at: string;
  withdrawn_at: string | null;
  kids_profiles: { display_name: string };
  kids_consent_policies: { version: string };
};

const words = {
  "ar-EG": {
    title: "الموافقة على بيانات الطفل",
    version: "نسخة السياسة: ",
    accepted: "موافقة وليّ الأمر المسجلة",
    withdrawal:
      "سحب الموافقة بيوقف وصول الملف للدروس. ده مش تأكيد بحذف البيانات المخزنة أو النسخ الاحتياطية.",
    withdrawn: "الموافقة اتسحبت",
    withdraw: "اسحب الموافقة",
    error: "ما قدرناش نحدّث سجل الموافقات. تواصل مع الدعم لو المشكلة مستمرة.",
  },
  "ar-MSA": {
    title: "الموافقة على بيانات الطفل",
    version: "نسخة السياسة: ",
    accepted: "موافقة وليّ الأمر المسجلة",
    withdrawal:
      "سحب الموافقة يوقف وصول هذا الملف إلى الدروس. لا يعني ذلك تأكيد محو البيانات المخزنة أو النسخ الاحتياطية.",
    withdrawn: "سُحبت الموافقة",
    withdraw: "سحب الموافقة",
    error: "تعذر تحديث سجل الموافقات. تواصل مع الدعم إذا استمر ذلك.",
  },
  "ar-Gulf": {
    title: "الموافقة على بيانات الطفل",
    version: "نسخة السياسة: ",
    accepted: "موافقة وليّ الأمر المسجلة",
    withdrawal:
      "سحب الموافقة يوقف وصول هالملف للدروس. ما يعني إن البيانات المخزنة أو النسخ الاحتياطية انحذفت فورًا.",
    withdrawn: "انسحبت الموافقة",
    withdraw: "اسحب الموافقة",
    error: "ما قدرنا نحدّث سجل الموافقات. تواصل مع الدعم لو استمرت المشكلة.",
  },
  en: {
    title: "Child data consent",
    version: "Policy version: ",
    accepted: "Recorded parent consent",
    withdrawal:
      "Withdrawing consent stops this profile's lesson access. It does not confirm erasure of stored data or backups.",
    withdrawn: "Consent withdrawn",
    withdraw: "Withdraw consent",
    error: "Consent records could not be updated. Contact support if this continues.",
  },
};
const subscriptionLabels: Record<string, Record<string, string>> = {
  active: { en: "Active", ar: "نشط" },
  trialing: { en: "Trial", ar: "فترة تجريبية" },
  past_due: { en: "Payment overdue", ar: "الدفع متأخر" },
  unpaid: { en: "Unpaid", ar: "غير مدفوع" },
  paused: { en: "Paused", ar: "متوقف مؤقتًا" },
  canceled: { en: "Canceled", ar: "ملغي" },
  refunded: { en: "Refunded", ar: "مسترد" },
  incomplete: { en: "Incomplete", ar: "غير مكتمل" },
};

/** Consent details and withdrawal live in account settings, away from lessons. */
export function KidsConsentControl() {
  const { user } = useAuth();
  const userId = user?.id;
  const [loadedFor, setLoadedFor] = useState<string | undefined>();
  const { locale } = useLocale();
  const t = words[locale];
  const { record, error: recordError } = useKidsPrivacyRecord();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [subscription, setSubscription] = useState<{
    status: string;
    paid_through: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReceipts([]);
    setError(false);
    if (!userId) return;
    const parentId = userId;
    async function load() {
      const paid = await supabase.rpc("get_my_kids_subscription" as never);
      if (cancelled) return;
      if (!paid.error && Array.isArray(paid.data)) {
        setSubscription((paid.data[0] as typeof subscription) ?? null);
      }
      const result = await supabase
        .from("kids_profile_consents" as never)
        .select(
          "profile_id,accepted_at,withdrawn_at,kids_profiles(display_name),kids_consent_policies(version)",
        )
        .eq("parent_id", parentId);
      if (cancelled) return;
      if (result.error) {
        setError(true);
        return;
      }
      setReceipts((result.data || []) as Receipt[]);
      setLoadedFor(userId);
    }
    void load().catch(() => {
      if (!cancelled) setError(true);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, revision]);

  async function withdraw(profile: string) {
    setBusy(profile);
    setError(false);
    try {
      const result = await supabase.rpc(
        "kids_parent_withdraw_consent" as never,
        { p_profile: profile } as never,
      );
      if (result.error) throw result.error;
      window.dispatchEvent(new Event("kids-consent-changed"));
      setRevision((value) => value + 1);
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-5 space-y-4 rounded-2xl border border-border p-4">
      <h3 className="font-bold">{t.title}</h3>
      <a href={`/kids/privacy?locale=${locale}`} className="text-sm text-primary underline">
        {getKidsPrivacyCopy(locale).link}
      </a>
      {record && (
        <p className="text-sm text-muted-foreground">
          {t.accepted} · {t.version}
          {record.policy_version} · {record.attested_at.slice(0, 10)}
        </p>
      )}
      {subscription && loadedFor === userId && (
        <div className="text-sm">
          <p>
            {locale === "en" ? "Kids subscription" : "اشتراك كيدز"}:{" "}
            {subscriptionLabels[subscription.status]?.[locale === "en" ? "en" : "ar"] ??
              subscription.status}
          </p>
          {subscription.paid_through && <p>{subscription.paid_through.slice(0, 10)}</p>}
          {["active", "past_due", "unpaid", "paused"].includes(subscription.status) && (
            <StripePortalButton scope="kids" />
          )}
        </div>
      )}
      {loadedFor === userId && receipts.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm">{t.withdrawal}</p>
          {receipts.map((receipt) => (
            <div key={receipt.profile_id} className="flex flex-wrap items-center gap-3">
              <span className="text-sm">
                {receipt.kids_profiles.display_name} · {receipt.accepted_at.slice(0, 10)} ·{" "}
                {receipt.kids_consent_policies.version}
              </span>
              {receipt.withdrawn_at ? (
                <span className="text-sm">{t.withdrawn}</span>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy !== null}
                  onClick={() => void withdraw(receipt.profile_id)}
                >
                  {t.withdraw}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      {(error || recordError) && (
        <p role="alert" className="text-sm text-destructive">
          {t.error}
        </p>
      )}
    </div>
  );
}
