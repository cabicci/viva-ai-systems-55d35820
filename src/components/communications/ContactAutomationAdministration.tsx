import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import {
  getContactAutomationAdministration,
  withdrawContactProcessing,
  closeContactIntakeManually,
} from "@/lib/contact-automation-admin.functions";
import {
  contactAdministrationFilter,
  contactManualClosureInput,
  type ContactAdministrationState,
} from "@/lib/contact-automation-admin";
import type { SupportedLocale } from "@/lib/locale/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const labels: Record<ContactAdministrationState, [string, string]> = {
  withdrawn: ["سُحبت الموافقة", "Consent withdrawn"],
  intake_reconciliation_required: [
    "نتيجة إرسال النموذج تحتاج مراجعة؛ لا يُعاد إرساله تلقائيًا",
    "Submission outcome needs review; no automatic resubmission",
  ],
  intake_in_flight: ["إرسال النموذج جارٍ", "Submission in progress"],
  intake_reserved: [
    "المحاولة محجوزة ولم يبدأ إرسالها بعد",
    "Attempt reserved; submission has not started",
  ],
  closed_manual: [
    "أُغلق للمعالجة اليدوية؛ قبول نظام المتابعة غير مؤكد",
    "Closed for manual handling; enquiry-system acceptance unconfirmed",
  ],
  accepted: [
    "قَبِل مزوّد البريد الإرسال؛ ليس إثبات تسليم",
    "Provider accepted; delivery not confirmed",
  ],
  blocked: ["الإرسال محظور", "Sending blocked"],
  retry_window_expired: [
    "انتهت نافذة المحاولة الآمنة؛ يلزم التحقق من النتيجة",
    "Safe retry window expired; reconcile the outcome",
  ],
  message_window_expired: [
    "انتهت مهلة الرسالة؛ يلزم مراجعتها",
    "Message window expired; review required",
  ],
  owner_reconciliation_required: [
    "عنوان المالك تغيّر أو غاب؛ يلزم مراجعة الإحالة",
    "Owner address changed or missing; reconcile referral",
  ],
  send_in_flight: ["بدأ الإرسال؛ قد لا يمكن استرجاعه", "Sending started; may not be recallable"],
  pending: ["بانتظار الإرسال المسموح", "Awaiting eligible send"],
  owner_configuration_required: ["يلزم ضبط عنوان المالك", "Owner address configuration required"],
  awaiting_preparation: ["بانتظار تجهيز الإحالة", "Awaiting referral preparation"],
};
export function ContactAutomationAdministration({ locale }: { locale: SupportedLocale }) {
  const { user } = useAuth();
  const load = useServerFn(getContactAutomationAdministration);
  const withdraw = useServerFn(withdrawContactProcessing);
  const closeManually = useServerFn(closeContactIntakeManually);
  const [references, setReferences] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [requestId, setRequestId] = useState<string | undefined>();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const t = (ar: string, en: string) => (locale === "en" ? en : ar);
  const query = useQuery({
    queryKey: ["contact-administration", user?.id, requestId],
    queryFn: () => load({ data: requestId ? { requestId } : {} }),
    enabled: !!user,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const state = (value: ContactAdministrationState) => labels[value][locale === "en" ? 1 : 0];
  const time = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ar-EG", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: "Africa/Cairo",
        }).format(new Date(value))
      : "—";
  async function stop(id: string) {
    if (saving) return;
    setSaving(true);
    setMessage("");
    try {
      await withdraw({ data: { requestId: id } });
      await query.refetch();
      setMessage(
        t(
          "تم تسجيل سحب الموافقة وإيقاف الإرسال اللاحق. الإرسال الذي بدأ بالفعل قد لا يمكن استرجاعه.",
          "Consent withdrawal recorded; future sends stopped. A send already in progress may not be recallable.",
        ),
      );
    } catch {
      setMessage(
        t(
          "تعذر تسجيل السحب. لم نعتبره مكتملًا؛ أعد المحاولة.",
          "Withdrawal could not be recorded. It is not complete; retry.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }
  async function close(id: string) {
    const input = contactManualClosureInput.safeParse({
      requestId: id,
      reference: references[id] ?? "",
    });
    if (!input.success) {
      setMessage(
        t(
          "أدخل مرجع تذكرة الدعم أو المراجعة: أحرف وأرقام وشرطة فقط، من ٣ إلى ٢٠٠ حرف.",
          "Enter a support/review reference using letters, digits or separators, 3–200 characters.",
        ),
      );
      return;
    }
    if (saving) return;
    setSaving(true);
    setMessage("");
    try {
      await closeManually({ data: input.data });
      await query.refetch();
      setMessage(
        t(
          "أُغلق الطلب للمعالجة اليدوية وسُجّل مرجع المراجعة. لم نعتبره مقبولًا في نظام المتابعة ولم نرسل متابعة آلية.",
          "Closed for manual handling with the review reference recorded. No enquiry-system acceptance was asserted and no automatic follow-up was sent.",
        ),
      );
    } catch {
      setMessage(
        t(
          "تعذر الإغلاق. قد يكون إرسال الطلب لا يزال جاريًا؛ حدّث الحالة وراجعها.",
          "Closure failed. A submission may still be in progress; refresh and review its status.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="space-y-4 rounded-xl border p-5" aria-busy={query.isFetching || saving}>
      <h2 className="text-lg font-bold">
        {t("طلبات التواصل والإحالات", "Contact requests and referrals")}
      </h2>
      <p className="text-sm">
        {t(
          "سحب الموافقة هنا يسجّل طلب العميل المُبلّغ للأدمن ويوقف الإرسال اللاحق. لا يسترجع رسالة بدأ إرسالها بالفعل.",
          "Record a customer's withdrawal reported to an administrator here. This stops future sends but cannot recall a send already started.",
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        <Input
          aria-label={t("رقم طلب التواصل", "Contact request reference")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("ابحث برقم الطلب", "Search by request reference")}
        />
        <Button
          disabled={saving}
          onClick={() => {
            const value = search.trim();
            if (!contactAdministrationFilter.safeParse(value ? { requestId: value } : {}).success) {
              setMessage(t("أدخل رقم طلب صحيحًا.", "Enter a valid request reference."));
              return;
            }
            setMessage("");
            setRequestId(value || undefined);
          }}
        >
          {t("بحث", "Search")}
        </Button>
        <Button
          variant="outline"
          disabled={saving || query.isFetching}
          onClick={() => void query.refetch()}
        >
          {t("تحديث", "Refresh")}
        </Button>
      </div>
      {query.isPending ? (
        <p role="status">{t("جارٍ التحميل…", "Loading…")}</p>
      ) : query.isError || !query.data ? (
        <p role="alert">{t("تعذر قراءة الحالة الفعلية.", "Actual status could not be loaded.")}</p>
      ) : (
        <>
          {!query.data.ownerConfigured && (
            <p role="status">
              {t(
                "عنوان المالك غير مضبوط؛ الطلبات محفوظة ولا تُحال إلى عنوان مفترض.",
                "Owner address is not configured. Requests are retained; no destination is guessed.",
              )}
            </p>
          )}
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt>{t("بانتظار عنوان/تجهيز الإحالة", "Awaiting owner/preparation")}</dt>
              <dd>{query.data.counts.awaitingOwner}</dd>
            </div>
            <div>
              <dt>{t("إحالات تحتاج مراجعة العنوان", "Owner destination reconciliation")}</dt>
              <dd>{query.data.counts.ownerReconciliation}</dd>
            </div>
            <div>
              <dt>{t("انتهت نافذة المحاولة الآمنة", "Expired safe retry windows")}</dt>
              <dd>{query.data.counts.retryWindowExpired}</dd>
            </div>
            <div>
              <dt>{t("نتائج إرسال نموذج تحتاج مراجعة", "Submission outcomes requiring review")}</dt>
              <dd>{query.data.counts.intakeReconciliation}</dd>
            </div>
            <div>
              <dt>{t("رسائل تجاوزت المهلة", "Expired message windows")}</dt>
              <dd>{query.data.counts.messageWindowExpired}</dd>
            </div>
          </dl>
          <p className="text-sm">
            {t("المعروض / الإجمالي", "Shown / total")}: {query.data.recent.length} /{" "}
            {query.data.total}
          </p>
          {query.data.recent.map((row) => (
            <article key={row.id} className="space-y-2 rounded-lg border p-3">
              <p dir="ltr">
                {row.id} · {row.recipientMasked}
              </p>
              <p>
                {row.locale} · {row.stream === "sales" ? t("مبيعات", "Sales") : t("دعم", "Support")}{" "}
                · {time(row.createdAt)} ({t("القاهرة", "Cairo")})
              </p>
              <p>
                {t("الإقرار", "Acknowledgement")}: {state(row.ackState)}
              </p>
              <p>
                {t("الإحالة", "Referral")}: {state(row.followupState)} · {t("الموعد", "Due")}:{" "}
                {time(row.dueAt)}
              </p>
              {row.inFlight && (
                <p role="status">
                  {t(
                    "بدأ إرسال لهذه المحاولة؛ السحب يمنع الإرسال التالي ولا يضمن استرجاع الجاري.",
                    "A send has started. Withdrawal prevents later sends but may not recall this one.",
                  )}
                </p>
              )}
              <Button
                variant="outline"
                disabled={saving || row.withdrawnAt !== null}
                onClick={() => void stop(row.id)}
              >
                {row.withdrawnAt
                  ? t("سُحبت الموافقة", "Consent withdrawn")
                  : t("تسجيل سحب الموافقة", "Record consent withdrawal")}
              </Button>
              {(["intake_reconciliation_required", "intake_reserved"] as string[]).includes(
                row.ackState,
              ) &&
                row.withdrawnAt === null && (
                  <div className="space-y-2">
                    <Input
                      aria-label={t("مرجع المراجعة", "Review reference")}
                      value={references[row.id] ?? ""}
                      onChange={(event) =>
                        setReferences((previous) => ({ ...previous, [row.id]: event.target.value }))
                      }
                    />
                    <Button
                      variant="outline"
                      disabled={saving || row.inFlight}
                      onClick={() => void close(row.id)}
                    >
                      {t(
                        "إغلاق للمعالجة اليدوية دون تأكيد القبول",
                        "Close for manual handling without confirming acceptance",
                      )}
                    </Button>
                  </div>
                )}
              {row.closedAt && (
                <p>
                  {t("أُغلق", "Closed")}: {time(row.closedAt)} · {row.resolutionReference}
                </p>
              )}
            </article>
          ))}
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
