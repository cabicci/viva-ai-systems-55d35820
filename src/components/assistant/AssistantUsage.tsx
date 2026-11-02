import { useEffect, useRef, useState } from "react";
import type { AssistantScope } from "@/lib/card-assistant/types";
import { getAssistantQuestionBalance } from "@/lib/billing/question-balance.functions";
import type { QuestionBalance } from "../../../supabase/functions/assistant-runtime/question-metering";

/** Presentation only. Access, allowance selection and debit remain on the server. */
export function AssistantUsage({ scope, accountId, busy, isCurrent }: {
  scope: AssistantScope; accountId: string; busy: boolean; isCurrent: () => boolean;
}) {
  const latestCurrent = useRef(isCurrent); latestCurrent.current = isCurrent;
  const [shown, setShown] = useState(true);
  const [balance, setBalance] = useState<{ key: string; value: QuestionBalance } | null>(null);
  const course = scope.area === "ai" ? "ai" : scope.area === "kids" ? "kids" : scope.cardId;
  const key = JSON.stringify([accountId, scope.area, course, scope.profileId, scope.locale]);
  const english = scope.locale === "en";
  useEffect(() => { setShown(true); }, [key]);
  useEffect(() => {
    let active = true;
    const current = () => active && latestCurrent.current() === true;
    if (busy || !current()) return () => { active = false; };
    void getAssistantQuestionBalance({ data: { expectedAccountId: accountId, area: scope.area,
      course, childId: scope.profileId ?? null } }).then(value => {
      if (current()) setBalance({ key, value });
    }).catch(() => { if (current()) setBalance(null); });
    return () => { active = false; };
  }, [key, busy]);
  const currentBalance = balance?.key === key && isCurrent() ? balance.value : null;
  const base = scope.area === "kids" ? "/kids/pricing" : "/pricing";
  return <aside className="space-y-3 rounded-xl border bg-muted/30 p-4 text-sm" aria-label={english ? "Question allowance" : "رصيد الأسئلة"}>
    <p aria-live="polite">{currentBalance
      ? currentBalance.admin_review ? (english ? "Administrator review: no learner questions are used." : "مراجعة الأدمن: لا تُستهلك أسئلة من رصيد الطلاب.")
      : english ? `Remaining: ${currentBalance.monthly_remaining} allowance questions · ${currentBalance.purchased_remaining} purchased questions${scope.area === "kids" ? " shared by the family" : ""}`
        : `المتبقي: ${currentBalance.monthly_remaining} سؤال من الحصة · ${currentBalance.purchased_remaining} سؤال إضافي${scope.area === "kids" ? " مشترك للأسرة" : ""}`
      : english ? "Question balance is currently unavailable." : "رصيد الأسئلة غير متاح حاليًا."}</p>
    {shown && <div className="space-y-2">
      <p>{english
        ? "A grounded answer or an answered follow-up uses one question. System failures and missing course information use none. The first two out-of-course attempts each Cairo calendar day are free; later attempts use one question, even when refused."
        : "كل إجابة من محتوى المنهج، بما فيها سؤال المتابعة، تستهلك سؤالًا واحدًا. أعطال النظام وعدم وجود معلومة كافية لا تستهلك رصيدًا. أول محاولتين خارج المنهج يوميًا بتوقيت القاهرة مجانًا، وبعدهما تُحسب المحاولة بسؤال حتى لو رُفضت."}</p>
      <p>{english
        ? "Your current allowance is used before purchased credit. Monthly allowances reset on your start-date anniversary and do not carry over. Purchased credit does not expire and needs current course access. A lifetime course includes 100 questions for its first month only."
        : "تُستخدم الحصة الحالية قبل الرصيد الإضافي. الحصة الشهرية تتجدد في موعد بدء اشتراكك ولا يُرحّل المتبقي. الرصيد المشترى لا ينتهي، ويُستخدم في المناهج المتاحة لك. باقة المنهج مدى الحياة تشمل ١٠٠ سؤال في الشهر الأول فقط."}</p>
      {scope.area === "kids" && <p>{english
        ? "Each child uses their own allowance first, then the shared family credit."
        : "كل طفل يستخدم حصته الخاصة أولًا، ثم الرصيد الإضافي المشترك للأسرة."}</p>}
      <button type="button" className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground" onClick={() => setShown(false)}>
        {english ? "Understood, start" : "فهمت، ابدأ"}
      </button>
    </div>}
    {!shown && <button type="button" className="underline" onClick={() => setShown(true)}>{english ? "How questions are counted" : "طريقة احتساب الأسئلة"}</button>}
    <a className="block font-semibold text-primary underline" href={`${base}?locale=${scope.locale}#question-topup`}>
      {english ? "Buy additional questions" : "شراء رصيد أسئلة إضافي"}
    </a>
  </aside>;
}
