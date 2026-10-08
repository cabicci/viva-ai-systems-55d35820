import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale/locale-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getAccountPhone,
  sendAccountPhoneCode,
  verifyAccountPhoneCode,
} from "@/lib/communications/phone.functions";
import type { PhoneChallenge, PhoneError } from "@/lib/communications/phone-contracts";

const copy = {
  "ar-EG": {
    title: "تأكيد رقم الموبايل",
    intro: "أكد رقمك بكود SMS. دخولك بالإيميل وكلمة المرور زي ما هو.",
    phone: "رقم الموبايل مع كود الدولة",
    send: "ابعت كود التأكيد",
    code: "كود التأكيد — 6 أرقام",
    confirm: "أكد الرقم",
    sent: "طلب إرسال الكود اتقبل. لو ما وصلكش، استنى انتهاء المحاولة قبل طلب كود جديد.",
    wait: "الطلب قيد التنفيذ…",
    verified: "الرقم مؤكد",
    off: "تأكيد الهاتف غير متاح حاليًا.",
    retry: "حاول تاني",
    invalid: "الكود غير صحيح. راجعه وحاول تاني.",
    disabled: "تأكيد الهاتف غير متاح حاليًا.",
    email: "أكد بريدك الإلكتروني أولًا.",
    phoneError: "اكتب رقمًا صحيحًا مع كود الدولة ضمن الدول المتاحة.",
    limit: "وصلت لحد المحاولات، أو عندك محاولة لسه شغالة. حاول لاحقًا.",
    challenge: "المحاولة انتهت أو استنفدت. اطلب كودًا جديدًا بعد انتهاء فترة الانتظار.",
    unavailable: "تعذر إكمال الطلب. ما تطلبش إرسال جديد فورًا؛ استنى انتهاء المحاولة.",
  },
  "ar-MSA": {
    title: "تأكيد رقم الهاتف",
    intro: "أكّد رقمك برمز SMS. يستمر الدخول بالبريد الإلكتروني وكلمة المرور.",
    phone: "رقم الهاتف مع رمز الدولة",
    send: "إرسال رمز التأكيد",
    code: "رمز التأكيد — 6 أرقام",
    confirm: "تأكيد الرقم",
    sent: "قُبل طلب إرسال الرمز. إذا لم يصلك، انتظر انتهاء المحاولة قبل طلب رمز جديد.",
    wait: "جارٍ تنفيذ الطلب…",
    verified: "الرقم مؤكد",
    off: "تأكيد الهاتف غير متاح حاليًا.",
    retry: "إعادة المحاولة",
    invalid: "الرمز غير صحيح. راجعه وحاول مجددًا.",
    disabled: "تأكيد الهاتف غير متاح حاليًا.",
    email: "أكّد بريدك الإلكتروني أولًا.",
    phoneError: "أدخل رقمًا صحيحًا مع رمز الدولة ضمن الدول المتاحة.",
    limit: "بلغت حد المحاولات أو توجد محاولة قيد التنفيذ. حاول لاحقًا.",
    challenge: "انتهت المحاولة أو استُنفدت. اطلب رمزًا جديدًا بعد انتهاء فترة الانتظار.",
    unavailable: "تعذر إكمال الطلب. انتظر انتهاء المحاولة قبل طلب إرسال جديد.",
  },
  "ar-Gulf": {
    title: "تأكيد رقم الجوال",
    intro: "أكد رقمك برمز SMS. دخولك بالإيميل وكلمة المرور يبقى مثل ما هو.",
    phone: "رقم الجوال مع رمز الدولة",
    send: "أرسل رمز التأكيد",
    code: "رمز التأكيد — 6 أرقام",
    confirm: "تأكيد الرقم",
    sent: "تم قبول طلب إرسال الرمز. إذا ما وصلك، انتظر انتهاء المحاولة قبل طلب رمز جديد.",
    wait: "جاري تنفيذ الطلب…",
    verified: "الرقم مؤكد",
    off: "تأكيد الجوال غير متاح حاليًا.",
    retry: "حاول مرة ثانية",
    invalid: "الرمز غير صحيح. راجعه وحاول مرة ثانية.",
    disabled: "تأكيد الجوال غير متاح حاليًا.",
    email: "أكد بريدك الإلكتروني أولًا.",
    phoneError: "أدخل رقمًا صحيحًا مع رمز الدولة ضمن الدول المتاحة.",
    limit: "وصلت لحد المحاولات أو عندك محاولة قيد التنفيذ. حاول لاحقًا.",
    challenge: "انتهت المحاولة أو استنفدت. اطلب رمزًا جديدًا بعد انتهاء فترة الانتظار.",
    unavailable: "تعذر إكمال الطلب. انتظر انتهاء المحاولة قبل طلب إرسال جديد.",
  },
  en: {
    title: "Verify your phone",
    intro: "Confirm your number with an SMS code. Email and password sign-in stays the same.",
    phone: "Phone number with country code",
    send: "Send verification code",
    code: "Verification code — 6 digits",
    confirm: "Verify number",
    sent: "The send request was accepted. If no code arrives, wait for this attempt to expire before requesting another.",
    wait: "Working…",
    verified: "Number verified",
    off: "Phone verification is currently unavailable.",
    retry: "Try again",
    invalid: "Incorrect code. Check it and try again.",
    disabled: "Phone verification is currently unavailable.",
    email: "Confirm your email first.",
    phoneError: "Enter a valid international number in an available country.",
    limit: "An attempt is still active or the attempt limit was reached. Try later.",
    challenge:
      "This attempt has expired or been exhausted. Request a new code after the waiting period.",
    unavailable:
      "The request could not be completed. Wait for the attempt to expire before sending again.",
  },
};
export function PhoneVerification() {
  const { user } = useAuth();
  const { locale, dir } = useLocale();
  const t = copy[locale];
  const load = useServerFn(getAccountPhone),
    send = useServerFn(sendAccountPhoneCode),
    check = useServerFn(verifyAccountPhoneCode);
  const status = useQuery({
    queryKey: ["account-phone", user?.id],
    queryFn: () => load(),
    enabled: !!user,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<PhoneChallenge | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!challenge) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [challenge]);
  const expired = !!challenge && Date.parse(challenge.expiresAt) <= now;
  const [error, setError] = useState<PhoneError | "invalid" | null>(null);
  const messages = {
    disabled: t.disabled,
    email: t.email,
    phone: t.phoneError,
    limit: t.limit,
    challenge: t.challenge,
    unavailable: t.unavailable,
    invalid: t.invalid,
  };
  const value = status.data?.ok ? status.data.value : undefined;
  async function start() {
    if (busy || !value?.enabled || challenge) return;
    setBusy(true);
    setError(null);
    try {
      const result = await send({ data: { phone, locale } });
      if (result.ok) setChallenge(result.value);
      else setError(result.error);
    } catch {
      setError("unavailable");
    } finally {
      setBusy(false);
    }
  }
  async function verify() {
    if (busy || !challenge) return;
    setBusy(true);
    setError(null);
    try {
      const result = await check({ data: { challengeId: challenge.challengeId, code } });
      setCode(""); // Never retain the entered code after the request.
      if (result.ok && result.value.verified) {
        setChallenge(null);
        setPhone("");
        await status.refetch();
      } else if (result.ok) setError("invalid");
      else {
        setError(result.error);
        if (result.error === "challenge") setChallenge(null);
      }
    } catch {
      setCode("");
      setError("unavailable");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="glass rounded-2xl p-6 border border-border/50 mb-5"
      dir={dir}
      aria-busy={busy || status.isFetching}
    >
      <h2 className="text-lg font-bold">{t.title}</h2>
      <p className="text-sm text-muted-foreground mt-2">{t.intro}</p>
      {value?.phone && (
        <p className="mt-3" role="status">
          {t.verified}: <bdi dir="ltr">{value.phone}</bdi>
        </p>
      )}
      {status.isPending ? (
        <p role="status">{t.wait}</p>
      ) : !value ? (
        <div>
          <p role="alert">
            {status.data && !status.data.ok ? messages[status.data.error] : t.unavailable}
          </p>
          <Button variant="outline" onClick={() => void status.refetch()}>
            {t.retry}
          </Button>
        </div>
      ) : !value.enabled ? (
        <p className="mt-3 text-sm" role="status">
          {t.off}
        </p>
      ) : (
        <div className="mt-4 grid gap-3 max-w-md">
          <label>
            {t.phone}
            <Input
              type="tel"
              autoComplete="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={busy || !!challenge}
              placeholder="+20…"
              maxLength={40}
            />
          </label>
          {!challenge ? (
            <Button onClick={() => void start()} disabled={busy || !phone.trim()}>
              {busy ? t.wait : t.send}
            </Button>
          ) : expired ? (
            <>
              <p role="status">{t.challenge}</p>
              <Button
                disabled={busy}
                onClick={() => {
                  setChallenge(null);
                  setCode("");
                  setError(null);
                }}
              >
                {t.retry}
              </Button>
            </>
          ) : (
            <>
              <p role="status" className="text-sm">
                {t.sent}
              </p>
              <label>
                {t.code}
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  dir="ltr"
                  maxLength={6}
                  disabled={busy}
                />
              </label>
              <Button onClick={() => void verify()} disabled={busy || !/^[0-9]{6}$/.test(code)}>
                {busy ? t.wait : t.confirm}
              </Button>
            </>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {messages[error]}
        </p>
      )}
    </section>
  );
}
