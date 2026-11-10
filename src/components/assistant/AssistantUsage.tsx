import { useEffect, useRef, useState } from "react";
import type { AssistantScope } from "@/lib/card-assistant/types";
import { getAssistantQuestionBalance } from "@/lib/billing/question-balance.functions";
import type { QuestionBalance } from "../../../supabase/functions/_shared/assistant-question-contract";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const COPY = {
  "en": {
    title: "Your assistant access", description: "Your current access and available questions, confirmed for this account.",
    allowance: "Current allowance", purchased: "Purchased questions", family: "Shared family credit", scope: "Current curriculum",
    allowed: "You can use the assistant within the content available to your account in this curriculum.",
    denied: "Assistant access is not currently available for your account in this curriculum.",
    unlimited: "Administrator: unlimited questions across all curricula.", admin: "Administrator questions have no allowance limit and do not use learner credit.",
    charging: "A grounded answer, including an answered follow-up, uses one question. System failures and insufficient course information use none. The first two out-of-course attempts each Cairo calendar day are free; later attempts use one question, even when refused.",
    periods: "Current allowances are used before purchased credit. Monthly allowances renew on their own start-date anniversary and do not carry over. Purchased credit does not expire and needs current content access. A lifetime curriculum includes 100 questions in its first month only.",
    children: "Each child uses their own allowance first, then the shared family credit.",
    loading: "Loading your access and balance…", unavailable: "We could not confirm your access and balance. Retry to see your actual allowance.",
    retry: "Try again", acknowledge: "Understood, start", details: "My assistant access", close: "Close", buy: "Buy additional questions",
    ai: "AI curriculum", academic: "Academic curriculum", technical: "Technical curriculum", kids: "Kids curriculum",
  },
  "ar-EG": {
    title: "صلاحياتك مع المساعد", description: "دي صلاحيات حسابك ورصيد الأسئلة المتاح ليك دلوقتي.",
    allowance: "رصيد الحصص الحالية", purchased: "الأسئلة الإضافية المشتراة", family: "رصيد مشترك للأسرة", scope: "المنهج الحالي",
    allowed: "تقدر تستخدم المساعد في المحتوى المتاح لحسابك من المنهج ده.",
    denied: "المساعد مش متاح لحسابك في المنهج ده دلوقتي.",
    unlimited: "الأدمن: أسئلة من غير حد في كل المناهج.", admin: "أسئلة الأدمن مالهاش حد، ومش بتستهلك أي رصيد من الطلاب.",
    charging: "كل إجابة من محتوى المنهج، حتى سؤال المتابعة، بتتحسب بسؤال واحد. أعطال النظام أو عدم وجود معلومة كافية مش بتسحب رصيد. أول محاولتين خارج المنهج كل يوم بتوقيت القاهرة مجانًا؛ وبعدهم المحاولة بتتحسب بسؤال حتى لو اترفضت.",
    periods: "حصصك الحالية بتتستخدم قبل الرصيد المشترى. الحصة الشهرية بتتجدد في نفس يوم بدايتها، والمتبقي مش بيترحّل. الرصيد المشترى مابيخلصش بمرور الوقت، وبيشتغل مع المحتوى المتاح ليك. باقة المنهج مدى الحياة فيها ١٠٠ سؤال للشهر الأول بس.",
    children: "كل طفل بيستخدم حصته الأول، وبعدها الرصيد المشترك للأسرة.",
    loading: "بنحمّل صلاحياتك ورصيدك…", unavailable: "ماقدرناش نتأكد من صلاحياتك ورصيدك. جرّب تاني عشان تشوف الرصيد الفعلي.",
    retry: "جرّب تاني", acknowledge: "فهمت، ابدأ", details: "صلاحياتي مع المساعد", close: "إغلاق", buy: "شراء رصيد أسئلة إضافي",
    ai: "منهج الذكاء الاصطناعي", academic: "المنهج الأكاديمي", technical: "المنهج التقني", kids: "منهج الأطفال",
  },
  "ar-MSA": {
    title: "صلاحياتك في المساعد", description: "صلاحيات حسابك الحالية ورصيد الأسئلة المتاح بعد التحقق منهما.",
    allowance: "رصيد الحصص الحالية", purchased: "الأسئلة الإضافية المشتراة", family: "رصيد مشترك للأسرة", scope: "المنهج الحالي",
    allowed: "يمكنك استخدام المساعد ضمن المحتوى المتاح لحسابك في هذا المنهج.",
    denied: "المساعد غير متاح لحسابك في هذا المنهج حاليًا.",
    unlimited: "الأدمن: أسئلة غير محدودة في جميع المناهج.", admin: "أسئلة الأدمن غير محدودة، ولا تستهلك أي رصيد من الطلاب.",
    charging: "تستهلك كل إجابة مستندة إلى المنهج، بما فيها إجابة المتابعة، سؤالًا واحدًا. لا تستهلك أعطال النظام أو المعلومات غير الكافية رصيدًا. أول محاولتين خارج المنهج يوميًا بتوقيت القاهرة مجانيتان؛ وبعدهما تُحتسب المحاولة بسؤال ولو رُفضت.",
    periods: "تُستخدم الحصص الحالية قبل الرصيد المشترى. تتجدد كل حصة شهرية في موعد بدئها ولا يُرحّل المتبقي. لا تنتهي صلاحية الرصيد المشترى، ويُستخدم مع المحتوى المسموح لك. تشمل باقة المنهج مدى الحياة ١٠٠ سؤال في الشهر الأول فقط.",
    children: "يستخدم كل طفل حصته الخاصة أولًا، ثم الرصيد المشترك للأسرة.",
    loading: "جارٍ تحميل صلاحياتك ورصيدك…", unavailable: "تعذّر التحقق من صلاحياتك ورصيدك. أعد المحاولة لعرض الرصيد الفعلي.",
    retry: "إعادة المحاولة", acknowledge: "فهمت، ابدأ", details: "صلاحياتي في المساعد", close: "إغلاق", buy: "شراء رصيد أسئلة إضافي",
    ai: "منهج الذكاء الاصطناعي", academic: "المنهج الأكاديمي", technical: "المنهج التقني", kids: "منهج الأطفال",
  },
  "ar-Gulf": {
    title: "صلاحياتك مع المساعد", description: "هذي صلاحيات حسابك ورصيد الأسئلة المتاح لك حاليًا.",
    allowance: "رصيد الحصص الحالية", purchased: "الأسئلة الإضافية المشتراة", family: "رصيد مشترك للأسرة", scope: "المنهج الحالي",
    allowed: "تقدر تستخدم المساعد في المحتوى المتاح لحسابك من هالمنهج.",
    denied: "المساعد مو متاح لحسابك في هالمنهج حاليًا.",
    unlimited: "الأدمن: أسئلة بلا حد في كل المناهج.", admin: "أسئلة الأدمن ما لها حد، وما تستهلك أي رصيد من الطلاب.",
    charging: "كل إجابة من محتوى المنهج، حتى سؤال المتابعة، تُحسب بسؤال واحد. أعطال النظام أو نقص المعلومات ما تستهلك رصيد. أول محاولتين خارج المنهج يوميًا بتوقيت القاهرة مجانًا؛ وبعدها تُحسب المحاولة بسؤال حتى لو انرفضت.",
    periods: "تستخدم حصصك الحالية قبل الرصيد المشترى. كل حصة شهرية تتجدد في موعد بدايتها، والباقي ما يترحّل. الرصيد المشترى ما تنتهي صلاحيته، وتستخدمه مع المحتوى المتاح لك. باقة المنهج مدى الحياة تشمل ١٠٠ سؤال في الشهر الأول بس.",
    children: "كل طفل يستخدم حصته أول، وبعدها الرصيد المشترك للأسرة.",
    loading: "نحمّل صلاحياتك ورصيدك…", unavailable: "ما قدرنا نتأكد من صلاحياتك ورصيدك. جرّب مرة ثانية عشان تشوف الرصيد الفعلي.",
    retry: "جرّب مرة ثانية", acknowledge: "فهمت، ابدأ", details: "صلاحياتي مع المساعد", close: "إغلاق", buy: "شراء رصيد أسئلة إضافي",
    ai: "منهج الذكاء الاصطناعي", academic: "المنهج الأكاديمي", technical: "المنهج التقني", kids: "منهج الأطفال",
  },
} as const;
type UsageBalance = QuestionBalance & { session_key?: string | null };
const unavailableStorageAcknowledgements = new Set<string>();
const markerFor = (account: string, session: string | null) => `masaarat:assistant-rights:v1:${encodeURIComponent(account)}:${session ?? "tab"}`;

/** Presentation only. Access, allowance selection and debit remain on the server. */
export function AssistantUsage({ scope, accountId, cardTitle, busy, isCurrent }: {
  scope: AssistantScope; accountId: string; cardTitle?: string; busy: boolean; isCurrent: () => boolean;
}) {
  const latestCurrent = useRef(isCurrent); latestCurrent.current = isCurrent;
  const [balance, setBalance] = useState<{ key: string; value: UsageBalance } | null>(null);
  const [lookup, setLookup] = useState<{ key: string; state: "loading" | "ready" | "error" } | null>(null);
  const [session, setSession] = useState<{ account: string; id: string | null } | null>(null);
  const [dialog, setDialog] = useState<{ marker: string; open: boolean } | null>(null);
  const [retry, setRetry] = useState(0);
  const course = scope.admitted ? scope.cardId : scope.area === "ai" ? "ai" : scope.area === "kids" ? "kids" : scope.cardId;
  let key = "";
  try {
    if (isCurrent()) {
      const serialize = JSON.stringify;
      if (isCurrent()) {
        const serialized = serialize([accountId, scope.area, course, scope.profileId, scope.locale]);
        if (isCurrent()) key = serialized;
      }
    }
  } catch { /* A retired or unavailable scope cannot start a balance request. */ }
  const copy = COPY[scope.locale];
  useEffect(() => {
    let active = true;
    const current = () => active && latestCurrent.current() === true;
    if (busy || !current()) return () => { active = false; };
    setLookup({ key, state: "loading" });
    void getAssistantQuestionBalance({ data: { expectedAccountId: accountId, area: scope.area,
      course, childId: scope.profileId ?? null } }).then(value => {
      if (!current()) return;
      setBalance({ key, value }); setSession({ account: accountId, id: value.session_key ?? null }); setLookup({ key, state: "ready" });
    }).catch(() => { if (current()) { setBalance(null); setLookup({ key, state: "error" }); } });
    return () => { active = false; };
  }, [key, busy, retry]);
  const live = isCurrent();
  const currentBalance = balance?.key === key && live ? balance.value : null;
  const status = lookup?.key === key ? lookup.state : "loading";
  const marker = markerFor(accountId, session?.account === accountId ? session.id : null);
  useEffect(() => {
    if (status === "loading" || !latestCurrent.current()) return;
    let acknowledged = false;
    try { acknowledged = window.sessionStorage.getItem(marker) === "1"; }
    catch { acknowledged = unavailableStorageAcknowledgements.has(marker); }
    if (latestCurrent.current()) setDialog(previous => previous?.marker === marker ? previous : { marker, open: !acknowledged });
  }, [marker, status]);
  const open = live && dialog?.marker === marker && dialog.open;
  const unlimited = currentBalance?.unlimited === true && currentBalance.admin_review === true && currentBalance.access_allowed === true;
  const base = scope.area === "kids" ? "/kids/pricing" : "/pricing";
  const verified = currentBalance !== null && typeof currentBalance.access_allowed === "boolean";
  const summary = !currentBalance ? status === "loading" ? copy.loading : copy.unavailable : unlimited ? copy.unlimited
    : `${copy.allowance}: ${currentBalance.monthly_remaining} · ${scope.area === "kids" ? copy.family : copy.purchased}: ${currentBalance.purchased_remaining}`;
  function acknowledge() {
    if (!verified || !latestCurrent.current()) return;
    try { window.sessionStorage.setItem(marker, "1"); }
    catch { unavailableStorageAcknowledgements.add(marker); }
    if (latestCurrent.current()) setDialog({ marker, open: false });
  }
  return <aside className="space-y-3 rounded-xl border bg-muted/30 p-4 text-sm" aria-label={copy.title}>
    <p aria-live="polite">{summary}</p>
    <button type="button" className="underline" onClick={() => { if (latestCurrent.current()) setDialog({ marker, open: true }); }}>{copy.details}</button>
    <Dialog open={!!open} onOpenChange={value => { if (latestCurrent.current()) setDialog({ marker, open: value }); }}>
      <DialogContent dir={scope.locale === "en" ? "ltr" : "rtl"} closeLabel={copy.close} className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{copy.title}</DialogTitle><DialogDescription>{copy.description}</DialogDescription></DialogHeader>
        <div className="space-y-3 text-sm leading-7">
          <p className="font-semibold">{copy.scope}: {cardTitle || copy[scope.area]}</p>
          <p aria-live="polite">{summary}</p>
          {verified && <>
            <p>{unlimited ? copy.admin : currentBalance.access_allowed ? copy.allowed : copy.denied}</p>
            {!unlimited && <><p>{copy.charging}</p><p>{copy.periods}</p>{scope.area === "kids" && <p>{copy.children}</p>}</>}
          </>}
          {status === "error" && <button type="button" className="font-semibold underline" onClick={() => { if (latestCurrent.current()) setRetry(value => value + 1); }}>{copy.retry}</button>}
        </div>
        <DialogFooter><button type="button" disabled={!verified} className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50" onClick={acknowledge}>{copy.acknowledge}</button></DialogFooter>
      </DialogContent>
    </Dialog>
    {verified && !unlimited && <a className="block font-semibold text-primary underline" href={`${base}?locale=${scope.locale}#question-topup`}>{copy.buy}</a>}
  </aside>;
}
