import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale/locale-context";

type ReviewStatus = "loading" | "available" | "pending" | "approved" | "rejected" | "offline";
const ar = {
  notice:
    "هذا طلب لمراجعة حساب وليّ الأمر فقط. لا تُدخل أي بيانات لطفل الآن، ولا يفتح الطلب ملفات الأطفال أو دروسهم.",
  acknowledge: "أفهم أن الطلب لا يُعد إثباتًا للولاية أو موافقةً على معالجة بيانات طفل.",
  send: "إرسال طلب مراجعة وليّ الأمر",
  sending: "جارٍ إرسال الطلب...",
  pending: "وصل طلبك وهو بانتظار مراجعة بشرية. لا تُرسل بيانات الطفل.",
  approved: "اعتمدت المراجعة. حدّث الصفحة للتحقق من جاهزية الخدمة.",
  rejected: "لم يُقبل طلبك. تواصل مع الدعم ببيانات حسابك فقط، دون تفاصيل الطفل.",
  offline: "خدمة طلبات أولياء الأمور غير متاحة الآن. لا تُرسل بيانات الطفل.",
  error: "تعذّر إرسال الطلب. حاول لاحقًا.",
};
const en = {
  notice:
    "This requests a review of the parent's account only. Do not enter child details. A request does not open child profiles or lessons.",
  acknowledge:
    "I understand this request does not prove guardianship or grant consent to process a child's data.",
  send: "Request parent review",
  sending: "Sending request...",
  pending: "Your request awaits human review. Do not send child details.",
  approved: "The review was approved. Refresh to check service readiness.",
  rejected:
    "Your request was not approved. Contact support with your account details only, without child details.",
  offline: "The parent review service is unavailable. Do not send child details.",
  error: "The request could not be sent. Try later.",
};

export function KidsParentRequest({ onRefresh }: { onRefresh: () => void }) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const copy = locale === "en" ? en : ar;
  const [status, setStatus] = useState<ReviewStatus>("loading");
  const [acknowledged, setAcknowledged] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user?.id) return;
    supabase
      .from("kids_parent_access_requests" as never)
      .select("status")
      .eq("parent_id", user.id)
      .maybeSingle()
      .then(
        ({ data, error: queryError }) => {
          if (!active) return;
          if (queryError) {
            setStatus("offline");
          } else {
            const value = (data as { status?: string } | null)?.status;
            setStatus(
              value === "pending" || value === "approved" || value === "rejected"
                ? value
                : "available",
            );
          }
        },
        () => {
          if (active) setStatus("offline");
        },
      );
    return () => {
      active = false;
    };
  }, [user?.id]);

  async function sendRequest() {
    if (!user?.id || !acknowledged || sending || status !== "available") return;
    setSending(true);
    setError(false);
    try {
      const { data, error: submitError } = await supabase.rpc(
        "kids_parent_request_review" as never,
        { p_acknowledged: true } as never,
      );
      if (submitError) throw submitError;
      const next = data as string;
      setStatus(
        next === "pending" || next === "approved" || next === "rejected" ? next : "offline",
      );
      if (next === "approved") onRefresh();
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  }

  if (status === "loading")
    return (
      <p role="status">
        {locale === "en" ? "Checking review status..." : "جارٍ التحقق من حالة الطلب..."}
      </p>
    );
  if (status !== "available") {
    return (
      <div className="space-y-2">
        <p role="status">{copy[status]}</p>
        {status === "approved" && (
          <button type="button" className="underline" onClick={onRefresh}>
            {locale === "en" ? "Refresh" : "تحديث"}
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p>{copy.notice}</p>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={acknowledged}
          onChange={(event) => setAcknowledged(event.target.checked)}
        />
        <span>{copy.acknowledge}</span>
      </label>
      <button
        type="button"
        disabled={!acknowledged || sending}
        onClick={sendRequest}
        className="rounded-full border border-primary px-5 py-2 font-bold text-primary disabled:opacity-50"
      >
        {sending ? copy.sending : copy.send}
      </button>
      {error && <p role="alert">{copy.error}</p>}
    </div>
  );
}
