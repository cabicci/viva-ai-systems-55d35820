import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale/locale-context";
import { Button } from "@/components/ui/button";

type Policy = { id: string; notice_text: string; consent_text: string; version: string };
type Receipt = {
  profile_id: string;
  accepted_at: string;
  withdrawn_at: string | null;
  kids_profiles: { display_name: string };
  kids_consent_policies: { version: string };
};

/** No draft notice is presented as an approved policy. RLS selects this parent's country. */
export function KidsConsentControl({
  canCreate,
  onConsent,
  onWithdraw,
}: {
  canCreate: boolean;
  onConsent: (id: string | undefined) => void;
  onWithdraw: () => void;
}) {
  const { user } = useAuth();
  const userId = user?.id;
  const [loadedFor, setLoadedFor] = useState<string | undefined>();
  const { locale } = useLocale();
  const english = locale === "en";
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [policyContext, setPolicyContext] = useState("");
  const currentContext = `${userId}:${locale}`;
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setPolicy(null);
    setReceipts([]);
    setChecked(false);
    setError(false);
    onConsent(undefined);
    if (!userId) return;
    const parentId = userId;
    async function load() {
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
      if (!canCreate) return;
      const published = await supabase
        .from("kids_consent_policies" as never)
        .select("id,notice_text,consent_text,version")
        .eq("enabled", true)
        .eq("locale", locale);
      if (cancelled) return;
      if (published.error || !published.data || published.data.length !== 1) return;
      setPolicy(published.data[0] as Policy);
      setPolicyContext(`${userId}:${locale}`);
    }
    void load().catch(() => {
      if (!cancelled) setError(true);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, locale, canCreate, revision, onConsent]);

  async function withdraw(profile: string) {
    setBusy(profile);
    setError(false);
    try {
      const result = await supabase.rpc(
        "kids_parent_withdraw_consent" as never,
        { p_profile: profile } as never,
      );
      if (result.error) throw result.error;
      onConsent(undefined);
      setChecked(false);
      window.dispatchEvent(new Event("kids-consent-changed"));
      onWithdraw();
      setRevision((value) => value + 1);
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-5 space-y-4 rounded-2xl border border-border p-4">
      <h3 className="font-bold">{english ? "Child data consent" : "الموافقة على بيانات الطفل"}</h3>
      {canCreate &&
        (policy && policyContext === currentContext ? (
          <>
            <p className="text-xs text-muted-foreground">
              {english ? "Policy version: " : "نسخة السياسة: "}
              {policy.version}
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{policy.notice_text}</p>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => {
                  setChecked(event.target.checked);
                  onConsent(event.target.checked ? policy.id : undefined);
                }}
                className="mt-1 h-5 w-5 shrink-0"
              />
              <span>{policy.consent_text}</span>
            </label>
          </>
        ) : (
          <p role="status" className="text-sm">
            {english
              ? "The approved child privacy notice for your country and language is not available yet. Profile creation remains closed."
              : "إشعار خصوصية الطفل المعتمد لبلدك ولغتك غير متاح بعد. إنشاء الملفات مغلق حتى إتاحته."}
          </p>
        ))}
      {loadedFor === userId && receipts.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm">
            {english
              ? "Withdrawing consent stops this profile's lesson access. It does not confirm erasure of stored data or backups."
              : "سحب الموافقة يوقف وصول هذا الملف إلى الدروس. لا يعني ذلك تأكيد محو البيانات المخزنة أو النسخ الاحتياطية."}
          </p>
          {receipts.map((receipt) => (
            <div key={receipt.profile_id} className="flex flex-wrap items-center gap-3">
              <span className="text-sm">
                {receipt.kids_profiles.display_name} · {receipt.accepted_at.slice(0, 10)} ·{" "}
                {receipt.kids_consent_policies.version}
              </span>
              {receipt.withdrawn_at ? (
                <span className="text-sm">{english ? "Consent withdrawn" : "سُحبت الموافقة"}</span>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy !== null}
                  onClick={() => void withdraw(receipt.profile_id)}
                >
                  {english ? "Withdraw consent" : "سحب الموافقة"}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {english
            ? "Consent records could not be updated. Contact support if this continues."
            : "تعذر تحديث سجل الموافقات. تواصل مع الدعم إذا استمر ذلك."}
        </p>
      )}
    </div>
  );
}
