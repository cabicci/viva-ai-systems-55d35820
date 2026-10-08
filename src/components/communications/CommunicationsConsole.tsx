import { useState } from "react";
import { MessageSquare, ShieldCheck, Smartphone, Settings2 } from "lucide-react";
import { COMMUNICATION_EVENTS, EVENT_DRAFTS } from "@/lib/communications/contracts";
import type { CommunicationsReadiness } from "@/lib/communications/contracts";
import type { SupportedLocale } from "@/lib/locale/types";
import { Button } from "@/components/ui/button";

const eventNames = {
  account_registered: ["إنشاء الحساب", "Account registration"],
  phone_verified: ["توثيق الهاتف", "Phone verification"],
  plan_activated: ["تفعيل الباقة", "Plan activation"],
  grant_activated: ["تفعيل المنحة", "Grant activation"],
  coupon_redeemed: ["استخدام الكوبون", "Coupon redemption"],
  invitation_accepted: ["قبول الدعوة", "Invitation acceptance"],
  receipt_reviewed: ["مراجعة الإيصال", "Receipt review"],
};

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
  const [tab, setTab] = useState("services");
  const t = (ar: string, english: string) => (en ? english : ar);
  const states = (configured: boolean | undefined) =>
    configured === undefined
      ? t("لم يتم التحقق بعد", "Not checked yet")
      : configured
        ? t("الإعداد موجود — التجربة مطلوبة", "Configuration present — test required")
        : t("الإعداد غير موجود", "Not configured");
  const services = [
    {
      name: "Twilio Verify",
      icon: ShieldCheck,
      state: states(readiness?.verifyConfigured),
      detail: t(
        "أكواد توثيق الهاتف عبر SMS أو WhatsApp. نص رسالة التحقق تديره خدمة Verify.",
        "Phone verification codes via SMS or WhatsApp. Verify manages authentication messages.",
      ),
    },
    {
      name: "SMS",
      icon: Smartphone,
      state: states(readiness?.messagingConfigured),
      detail: t(
        "رسائل الموقع النصية بقالب معتمد، بعد التحقق من المرسل والدول المطلوبة.",
        "Transactional text messages with approved content, after sender and destination checks.",
      ),
    },
    {
      name: "WhatsApp",
      icon: MessageSquare,
      state: states(readiness?.whatsappSenderConfigured),
      detail: t(
        "موافقة الاسم وحدها لا تثبت جاهزية الإرسال. يجب التحقق من ربط المرسل والقوالب.",
        "Display-name approval alone does not establish delivery readiness. Sender linkage and templates require verification.",
      ),
    },
  ];
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6" dir={en ? "ltr" : "rtl"}>
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4" role="status">
        <h2 className="font-bold">
          {t("مسودة الإعداد — لم تُفعَّل الرسائل", "Setup draft — messaging is not active")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(
            "تطبيق إعدادات Supabase عبر Lovable والتجربة الفعلية يسبقان تشغيل الخدمات والدمج والنشر. مفاتيح التشغيل ستُحفظ على الخادم لكل خدمة ونوع رسالة.",
            "Lovable applies Supabase configuration, and a real test precedes activation, merge and publication. Each service and message event will have a server-stored switch.",
          )}
        </p>
      </div>
      <nav
        aria-label={t("أقسام الاتصالات", "Communications sections")}
        className="flex flex-wrap gap-2"
      >
        {[
          ["services", t("الخدمات", "Services")],
          ["templates", t("قوالب الرسائل", "Message templates")],
          ["log", t("سجل الإرسال", "Delivery log")],
          ["usage", t("الاستخدام والحدود", "Usage and limits")],
        ].map(([key, label]) => (
          <Button
            key={key}
            variant={tab === key ? "default" : "outline"}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
          >
            {label}
          </Button>
        ))}
      </nav>
      {tab === "services" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold">{t("حالة الربط", "Connection status")}</h2>
            <Button variant="outline" disabled={loading} onClick={refresh}>
              <Settings2 className="size-4" />
              {t("تحقق من الإعداد", "Check configuration")}
            </Button>
          </div>
          {error && (
            <p role="alert">
              {t(
                "تعذر التحقق من الإعداد. حاول لاحقًا.",
                "Configuration could not be checked. Try again later.",
              )}
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            {services.map((service) => (
              <section key={service.name} className="space-y-3 rounded-xl border bg-card p-5">
                <service.icon className="size-6 text-primary" />
                <h3 className="text-lg font-bold">{service.name}</h3>
                <p className="text-sm font-medium">{service.state}</p>
                <p className="text-sm text-muted-foreground">{service.detail}</p>
                <Button disabled variant="outline" className="w-full">
                  {t("متوقف حتى اكتمال الربط والتجربة", "Off until setup and testing are complete")}
                </Button>
              </section>
            ))}
          </div>
          {readiness?.verifyReachable !== null && readiness?.verifyReachable !== undefined && (
            <p className="text-sm">
              {readiness.verifyReachable
                ? t(
                    "استجابت خدمة Verify للفحص؛ وصول الكود إلى الهاتف لم يُختبر بعد.",
                    "Verify responded to the check; delivery to a phone has not been tested.",
                  )
                : t("لم ينجح الاتصال بخدمة Verify.", "Verify connectivity check did not succeed.")}
            </p>
          )}
          <section className="space-y-3 rounded-xl border p-5">
            <h2 className="font-bold">{t("الأحداث المرتبطة بالموقع", "Website events")}</h2>
            <p className="text-sm text-muted-foreground">
              {t(
                "مصادر الربط المطلوبة: أحداث الخادم بعد نجاح العملية. توثيق الهاتف لا يمنح اشتراكًا؛ الباقة تُفعَّل بالدفع أو المنحة.",
                "Required event sources: server events after a successful operation. Phone verification does not grant a subscription; payment or a grant activates access.",
              )}
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {COMMUNICATION_EVENTS.map((event) => (
                <li
                  key={event}
                  className="flex flex-wrap justify-between gap-2 rounded-lg border p-3"
                >
                  <span>{eventNames[event][en ? 1 : 0]}</span>
                  <span className="text-sm text-muted-foreground">
                    {t("ربط الخادم قيد الإعداد", "Server hook pending")}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
      {tab === "templates" && (
        <section className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t(
              "هذه مسودات للمراجعة، ولم تُعتمد أو تُرسل. قوالب WhatsApp تحتاج اعتماد Meta حسب نوع الرسالة؛ قوالب التحقق تُدار داخل Verify.",
              "These are review drafts and have not been approved or sent. WhatsApp templates require the appropriate Meta approval; authentication templates are managed by Verify.",
            )}
          </p>
          {COMMUNICATION_EVENTS.map((event) => (
            <article key={event} className="space-y-2 rounded-xl border p-4">
              <h3 className="font-bold">{eventNames[event][en ? 1 : 0]}</h3>
              <p>{EVENT_DRAFTS[event][en ? "en" : "ar"]}</p>
              <p className="text-xs text-muted-foreground">
                {t("مسودة — التشغيل متوقف", "Draft — sending is off")}
              </p>
            </article>
          ))}
        </section>
      )}
      {tab === "log" && (
        <section className="rounded-xl border p-5">
          <h2 className="font-bold">{t("السجل الفعلي قيد الربط", "Delivery log setup pending")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(
              "لم يُرسل هذا الربط أي رسالة. سيعرض السجل رقمًا مخفيًا جزئيًا، ونوع الرسالة، والقناة، وحالة المزود وسبب الفشل دون كود التحقق.",
              "This integration has sent no messages. The log will show masked recipients, event, channel and provider status without verification codes.",
            )}
          </p>
        </section>
      )}
      {tab === "usage" && (
        <section className="rounded-xl border p-5">
          <h2 className="font-bold">
            {t("حدود الإرسال والتكلفة قيد الإعداد", "Sending and cost limits pending")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(
              "سيُحدَّد سقف محاولات التحقق لكل مستخدم ورقم، وفترة انتظار لإعادة الإرسال وحد إجمالي. التكلفة الفعلية ستأتي من بيانات المزود؛ لا توجد تقديرات معروضة كفاتورة.",
              "Per-user and per-phone verification limits, resend cooldown and a global cap must be configured. Actual costs come from the provider's records.",
            )}
          </p>
        </section>
      )}
    </main>
  );
}
