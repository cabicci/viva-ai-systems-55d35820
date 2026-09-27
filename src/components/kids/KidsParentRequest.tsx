import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale/locale-context";
import { isKidsMarket, KIDS_MARKETS } from "@/lib/kids/markets";
import { getKidsPrivacyCopy } from "@/lib/kids/privacy-copy";

type ConsentStatus = "loading" | "available" | "pending" | "approved" | "rejected" | "offline";
const ar = {
  notice:
    "اختر بلد إقامتك بحسابك ذي البريد المؤكد. بعد ذلك اطّلع على سياسة خصوصية الأطفال ووافق عليها لتفعيل كيدز.",
  acknowledge:
    "بالاستمرار أقرّ بأنني بالغ ووليّ أمر للأطفال الذين سأدير ملفاتهم. الموافقة على بيانات الأطفال في الخطوة التالية.",
  country: "بلد إقامة وليّ الأمر",
  chooseCountry: "اختر بلد إقامتك",
  dataNotice:
    "نستخدم بريد حسابك المؤكد وبلد إقامتك وإقرارك لمعالجة هذا الطلب فقط. اختيار البلد لا يعني أن خدمة الأطفال مفعّلة فيه.",
  send: "متابعة إلى سياسة الأطفال",
  sending: "جارٍ المتابعة...",
  pending: "اطّلع على سياسة خصوصية الأطفال، ثم وافق لإتاحة ملفات أطفالك.",
  policyUnavailable: "سياسة خصوصية الأطفال أو الخدمة غير متاحة لبلدك حاليًا.",
  accept: "أوافق وأفعّل حساب وليّ الأمر",
  accepting: "جارٍ تسجيل الموافقة...",
  rejected: "هذا الحساب موقوف عن كيدز. تواصل مع الدعم دون تفاصيل الطفل.",
  offline: "خدمة أولياء الأمور غير متاحة الآن.",
  error: "تعذّر حفظ طلبك أو موافقتك. حاول لاحقًا.",
  checking: "جارٍ التحقق من حالة الحساب...",
};
const eg = {
  notice:
    "اختار بلد إقامتك بحساب بريدك المؤكد، وبعدها اقرأ سياسة خصوصية الأطفال ووافق عليها لتفعيل كيدز.",
  acknowledge:
    "بالمتابعة بأقر إني بالغ ووليّ أمر للأطفال اللي هدير ملفاتهم. هتوافق على سياسة الأطفال في الخطوة الجاية.",
  country: "بلد إقامة وليّ الأمر",
  chooseCountry: "اختار بلد إقامتك",
  dataNotice:
    "بنستخدم بريد حسابك المؤكد وبلد إقامتك وإقرارك عشان نعالج الطلب ده بس. اختيار البلد مش معناه إن خدمة الأطفال اتفتحت فيه.",
  send: "كمّل لسياسة الأطفال",
  sending: "بنكمل...",
  pending: "اقرأ سياسة خصوصية الأطفال ووافق عليها عشان تفعّل ملفات أطفالك.",
  policyUnavailable: "سياسة خصوصية الأطفال أو الخدمة مش متاحة لبلدك حاليًا.",
  accept: "أوافق وأفعّل حساب وليّ الأمر",
  accepting: "بنسجّل الموافقة...",
  rejected: "الحساب ده موقوف عن كيدز. تواصل مع الدعم من غير تفاصيل الطفل.",
  offline: "خدمة أولياء الأمور مش متاحة دلوقتي.",
  error: "ما قدرناش نسجل طلبك أو موافقتك. حاول بعدين.",
  checking: "بنتأكد من حالة الحساب...",
};
const gulf = {
  notice:
    "اختر بلد إقامتك بحساب بريدك المؤكد، ثم اقرأ سياسة خصوصية الأطفال ووافق عليها لتفعيل كيدز.",
  acknowledge:
    "بالمتابعة أقر إني بالغ ووليّ أمر للأطفال اللي بأدير ملفاتهم. أوافق على سياسة الأطفال في الخطوة التالية.",
  country: "بلد إقامة وليّ الأمر",
  chooseCountry: "اختر بلد إقامتك",
  dataNotice:
    "نستخدم بريد حسابك المؤكد وبلد إقامتك وإقرارك لمعالجة هالطلب بس. اختيار البلد ما يعني إن خدمة الأطفال تفعّلت فيه.",
  send: "تابع إلى سياسة الأطفال",
  sending: "جارٍ المتابعة...",
  pending: "اقرأ سياسة خصوصية الأطفال ووافق عليها لتفعيل ملفات أطفالك.",
  policyUnavailable: "سياسة خصوصية الأطفال أو الخدمة مب متاحة لبلدك الحين.",
  accept: "أوافق وأفعّل حساب وليّ الأمر",
  accepting: "جارٍ تسجيل الموافقة...",
  rejected: "هالحساب موقوف عن كيدز. تواصل مع الدعم من دون تفاصيل الطفل.",
  offline: "خدمة أولياء الأمور مب متاحة الحين.",
  error: "ما قدرنا نسجل طلبك أو موافقتك. جرّب بعدين.",
  checking: "نتأكد من حالة الحساب...",
};
const en = {
  notice:
    "Select your country of residence using your confirmed email account, then read and accept the children's privacy policy to activate Kids.",
  acknowledge:
    "By continuing I declare that I am an adult and the parent or guardian of the children whose profiles I will manage. Consent to the children's policy follows.",
  country: "Parent's country of residence",
  chooseCountry: "Choose your country of residence",
  dataNotice:
    "We use your verified account email, country of residence and acknowledgment to process this request only. Selecting a country does not mean children's services are enabled there.",
  send: "Continue to children's policy",
  sending: "Continuing...",
  pending: "Read the children's privacy policy and consent to activate your family account.",
  policyUnavailable:
    "The children's privacy policy or service is not available in your country yet.",
  accept: "I agree and activate my parent account",
  accepting: "Recording consent...",
  rejected: "This account is blocked from Kids. Contact support without child details.",
  offline: "The parent service is unavailable now.",
  error: "Your request or consent could not be saved. Try later.",
  checking: "Checking account status...",
};

export function KidsParentRequest({ onRefresh }: { onRefresh: () => void }) {
  const { user } = useAuth();
  if (!user?.id) return null;
  return <KidsParentRequestForAccount key={user.id} onRefresh={onRefresh} />;
}

function KidsParentRequestForAccount({ onRefresh }: { onRefresh: () => void }) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const copy = locale === "en" ? en : locale === "ar-EG" ? eg : locale === "ar-Gulf" ? gulf : ar;
  const [status, setStatus] = useState<ConsentStatus>("loading");
  const [country, setCountry] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const [policy, setPolicy] = useState<{
    id: string;
    notice_text: string;
    consent_text: string;
    version: string;
  } | null>(null);
  const [policyReady, setPolicyReady] = useState(false);
  const [policyChecked, setPolicyChecked] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user?.id) return;
    supabase
      .from("kids_parent_access_requests" as never)
      .select("status,country_code")
      .eq("parent_id", user.id)
      .maybeSingle()
      .then(
        ({ data, error: queryError }) => {
          if (!active) return;
          if (queryError) {
            setStatus("offline");
          } else {
            const request = data as { status?: string; country_code?: string } | null;
            const value = request?.status;
            if (request?.country_code) setCountry(request.country_code);
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

  useEffect(() => {
    let active = true;
    setPolicy(null);
    setPolicyChecked(false);
    setPolicyReady(false);
    if ((status !== "pending" && status !== "approved") || !isKidsMarket(country)) return;
    Promise.all([
      supabase
        .from("kids_consent_policies" as never)
        .select("id,notice_text,consent_text,version")
        .eq("country_code", country)
        .eq("locale", locale)
        .eq("enabled", true),
      supabase
        .from("kids_market_release" as never)
        .select("accepts_child_data")
        .eq("country_code", country)
        .maybeSingle(),
    ])
      .then(([published, market]) => {
        if (!active) return;
        if (
          !published.error &&
          published.data?.length === 1 &&
          !market.error &&
          (market.data as { accepts_child_data?: boolean } | null)?.accepts_child_data
        ) {
          setPolicy(published.data[0] as typeof policy);
        }
        setPolicyReady(true);
      })
      .catch(() => {
        if (active) setPolicyReady(true);
      });
    return () => {
      active = false;
    };
  }, [status, country, locale]);

  async function acceptPolicy() {
    if (!policy || !policyChecked || sending || (status !== "pending" && status !== "approved"))
      return;
    setSending(true);
    setError(false);
    const result = await supabase.rpc(
      "kids_parent_confirm_privacy" as never,
      { p_policy_id: policy.id, p_accepted: true } as never,
    );
    if (result.error) setError(true);
    else {
      setStatus("approved");
      onRefresh();
    }
    setSending(false);
  }

  async function sendRequest() {
    if (!user?.id || !isKidsMarket(country) || sending || status !== "available") return;
    setSending(true);
    setError(false);
    try {
      const { data, error: submitError } = await supabase.rpc(
        "kids_parent_request_review" as never,
        { p_acknowledged: true, p_country_code: country, p_adult_confirmed: true } as never,
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

  if (status === "loading") return <p role="status">{copy.checking}</p>;
  if (status === "pending" || status === "approved") {
    return (
      <div className="space-y-4">
        <p role="status">{copy.pending}</p>
        {policy ? (
          <>
            <a
              href={`/kids/privacy?locale=${locale}`}
              className="text-primary underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {getKidsPrivacyCopy(locale).link}
            </a>
            <p className="text-xs text-muted-foreground">{policy.version}</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{policy.notice_text}</p>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0"
                checked={policyChecked}
                disabled={sending}
                onChange={(event) => setPolicyChecked(event.target.checked)}
              />
              <span>{policy.consent_text}</span>
            </label>
            <button
              type="button"
              onClick={() => void acceptPolicy()}
              disabled={!policyChecked || sending}
              className="rounded-full border border-primary px-5 py-2 font-bold text-primary disabled:opacity-50"
            >
              {sending ? copy.accepting : copy.accept}
            </button>
          </>
        ) : policyReady ? (
          <p role="status">{copy.policyUnavailable}</p>
        ) : (
          <p role="status">{copy.checking}</p>
        )}
        {error && <p role="alert">{copy.error}</p>}
      </div>
    );
  }
  if (status !== "available") {
    return (
      <div className="space-y-2">
        <p role="status">{copy[status]}</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p>{copy.notice}</p>
      <p className="text-sm text-muted-foreground">{copy.dataNotice}</p>
      <label className="block space-y-2 text-sm">
        <span>{copy.country}</span>
        <select
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          disabled={sending}
          className="block w-full rounded-lg border bg-background px-3 py-2"
        >
          <option value="">{copy.chooseCountry}</option>
          {KIDS_MARKETS.map((market) => (
            <option key={market.code} value={market.code}>
              {locale === "en" ? market.en : market.ar}
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm">{copy.acknowledge}</p>
      <button
        type="button"
        disabled={!isKidsMarket(country) || sending}
        onClick={sendRequest}
        className="rounded-full border border-primary px-5 py-2 font-bold text-primary disabled:opacity-50"
      >
        {sending ? copy.sending : copy.send}
      </button>
      {error && <p role="alert">{copy.error}</p>}
    </div>
  );
}
