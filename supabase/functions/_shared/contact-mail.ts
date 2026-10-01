/** Transactional acknowledgements only; no message contents or promotions. */
export type ContactMailLocale = "ar-EG" | "ar-MSA" | "ar-Gulf" | "en";
export type ContactMailStream = "support" | "sales";
const copy = {
  "ar-EG": {
    greeting: "أهلًا",
    support: "استلمنا طلب الدعم",
    sales: "استلمنا استفسارك للمؤسسات",
    body: "طلبك وصل لفريق مسارات. لو محتاج تضيف حاجة، تقدر ترد على الإيميل ده.",
    hours:
      "بنراجع الطلبات من الأحد للخميس، من ٩ صباحًا لـ٥ مساءً بتوقيت القاهرة.",
    footer: "دي رسالة تأكيد استلام طلبك.",
  },
  "ar-MSA": {
    greeting: "مرحبًا",
    support: "استلمنا طلب الدعم",
    sales: "استلمنا استفسار المؤسسات",
    body: "وصل طلبك إلى فريق مسارات. لإضافة معلومات، يمكنك الرد على هذه الرسالة.",
    hours:
      "نراجع الطلبات من الأحد إلى الخميس، من ٩ صباحًا إلى ٥ مساءً بتوقيت القاهرة.",
    footer: "هذه رسالة لتأكيد استلام طلبك.",
  },
  "ar-Gulf": {
    greeting: "حيّاك الله",
    support: "وصلنا طلب الدعم",
    sales: "وصلنا استفسارك للجهات",
    body: "وصل طلبك لفريق مسارات. إذا عندك إضافة، تقدر ترد على هالإيميل.",
    hours:
      "نراجع الطلبات من الأحد للخميس، من ٩ صباحًا إلى ٥ مساءً بتوقيت القاهرة.",
    footer: "هالرسالة تأكيد لاستلام طلبك.",
  },
  en: {
    greeting: "Hello",
    support: "We received your support request",
    sales: "We received your institutional enquiry",
    body: "Your request has reached the Masaarat team. Reply to this email if you need to add information.",
    hours: "We review requests Sunday–Thursday, 9 am–5 pm, Cairo time.",
    footer: "This message confirms receipt of your request.",
  },
} as const;
function escape(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
export function contactMailContent(
  stream: ContactMailStream,
  locale: ContactMailLocale,
  rawName: unknown,
) {
  const c = copy[locale];
  if (!c || (stream !== "support" && stream !== "sales"))
    throw new Error("invalid_contact_mail");
  const value =
    typeof rawName === "string" ? rawName.trim().replace(/\s+/g, " ") : "";
  const name =
    value.length >= 2 && value.length <= 80 && !/[\p{Cc}\p{Cf}]/u.test(value)
      ? value
      : "";
  const english = locale === "en",
    dir = english ? "ltr" : "rtl";
  const address = stream === "sales" ? "sales@masaarat.ai" : "info@masaarat.ai";
  const greeting = `${c.greeting}${name ? ` ${name}` : ""}${english ? "," : "،"}`;
  const title = c[stream];
  const html = `<!doctype html><html lang="${locale}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:24px 12px;background:#ffffff;color:#243044;font-family:Tajawal,Arial,sans-serif"><table role="presentation" dir="${dir}" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;margin:auto;background:#ffffff;border:1px solid #dce6ed;border-radius:16px"><tr><td style="padding:30px 32px;background:#e8f1f6;border-radius:16px 16px 0 0"><img src="https://masaarat.ai/brand/masaarat-logo-lockup.png" width="165" alt="Masaarat | مسارات" style="display:block;max-width:100%;height:auto;border:0"></td></tr><tr><td dir="${dir}" style="padding:30px 32px;text-align:${english ? "left" : "right"};line-height:1.8"><h1 style="font-size:24px;margin:0 0 20px">${escape(title)}</h1><p>${escape(greeting)}</p><p>${escape(c.body)}</p><p>${escape(c.hours)}</p><p style="font-size:13px;color:#566675">${escape(c.footer)}</p></td></tr><tr><td style="padding:18px 32px;background:#f3f8f8;border-radius:0 0 16px 16px"><a href="mailto:${address}" style="color:#356f9a">${address}</a> · <a href="https://masaarat.ai/contact?locale=${locale}" style="color:#356f9a">Masaarat</a></td></tr></table></body></html>`;
  return {
    subject: `${title} | Masaarat`,
    text: `${greeting}\n\n${c.body}\n\n${c.hours}\n\n${c.footer}\n${address}`,
    html,
    from:
      stream === "sales" ? "sales@mail.masaarat.ai" : "info@mail.masaarat.ai",
    replyTo: address,
  };
}
