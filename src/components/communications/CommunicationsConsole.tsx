import { ShieldCheck } from "lucide-react";
import type { CommunicationsReadiness } from "@/lib/communications/contracts";
import type { SupportedLocale } from "@/lib/locale/types";
import { PhoneAdministration } from "./PhoneAdministration";
import { ContactAutomationAdministration } from "./ContactAutomationAdministration";
import { Button } from "@/components/ui/button";

export function CommunicationsConsole({
  locale,
  readiness,
  loading,
  error,
  refresh,
}: {
  locale: SupportedLocale;
  readiness?: CommunicationsReadiness;
  loading: boolean;
  error: boolean;
  refresh: () => void;
}) {
  const en = locale === "en";
  const t = (ar: string, english: string) => (en ? english : ar);
  const configured = readiness?.verifyConfigured;
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6" dir={en ? "ltr" : "rtl"}>
      <section className="space-y-3 rounded-xl border bg-card p-5" aria-busy={loading}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ShieldCheck className="size-5" aria-hidden="true" />
            {t("اتصال خدمة تأكيد الهاتف", "Phone verification connection")}
          </h2>
          <Button variant="outline" disabled={loading} onClick={refresh}>
            {t("تحقق من الإعداد", "Check configuration")}
          </Button>
        </div>
        {error ? (
          <p role="alert">
            {t(
              "تعذر التحقق من الإعداد. حاول لاحقًا.",
              "Configuration could not be checked. Try again later.",
            )}
          </p>
        ) : (
          <p role="status">
            {configured === undefined
              ? t("لم يتم التحقق بعد", "Not checked yet")
              : configured
                ? t(
                    "إعداد خدمة Verify موجود. يُثبت وصول الكود بتجربة إرسال منفصلة.",
                    "Verify configuration is present. Code delivery requires a separate sending test.",
                  )
                : t("إعداد خدمة Verify غير مكتمل.", "Verify configuration is incomplete.")}
          </p>
        )}
        {configured &&
          readiness?.verifyReachable !== null &&
          readiness?.verifyReachable !== undefined && (
            <p role={readiness.verifyReachable ? "status" : "alert"}>
              {readiness.verifyReachable
                ? t(
                    "استجابت خدمة Verify لفحص الاتصال. وصول الكود يحتاج تجربة إرسال.",
                    "Verify responded to the connection check. Code delivery still requires a sending test.",
                  )
                : t(
                    "تعذر الاتصال بخدمة Verify أو رفضت الاعتمادات. راجع إعداد الخدمة.",
                    "Verify could not be reached or rejected the credentials. Check the service configuration.",
                  )}
            </p>
          )}
        <p className="text-sm text-muted-foreground">
          {t(
            "تأكيد الهاتف اختياري للتسجيل والدخول، ويُطلب فقط للميزات التي تحتاج رقمًا مؤكدًا. رسائل التأكيد تُدار عبر Twilio Verify.",
            "Phone verification is optional for registration and sign-in, and is required only by features needing a verified number. Twilio Verify manages verification messages.",
          )}
        </p>
      </section>
      <PhoneAdministration locale={locale} />
      <ContactAutomationAdministration locale={locale} />
    </main>
  );
}
