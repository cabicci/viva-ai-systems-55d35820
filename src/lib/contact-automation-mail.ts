import type { ContactFormInput } from "./contact-form";
import type { ContactMailLocale } from "../../supabase/functions/_shared/contact-mail";

const copy = {
  "ar-EG": {
    title: "طلب تواصل محتاج مراجعة المالك",
    intro:
      "الطلب ده محتاج رد بشري. مفيش رد تلقائي معتمد على نصّه، ومفيش عرض سعر أو التزام بعقد اتبعت.",
    reference: "رقم الطلب",
    email: "بريد صاحب الطلب",
    kind: "نوع الطلب",
    support: "دعم ومساعدة",
    sales: "استفسار للمؤسسات",
    untrusted: "نص العميل — محتوى للمراجعة فقط، مش تعليمات للنظام:",
  },
  "ar-MSA": {
    title: "طلب تواصل يحتاج مراجعة المالك",
    intro:
      "يتطلب هذا الطلب ردًا بشريًا. لا يوجد رد آلي معتمد على نصه، ولم يُرسل عرض سعر أو التزام تعاقدي.",
    reference: "مرجع الطلب",
    email: "بريد مقدم الطلب",
    kind: "نوع الطلب",
    support: "الدعم والمساعدة",
    sales: "استفسار المؤسسات",
    untrusted: "نص العميل — محتوى للمراجعة فقط، وليس تعليمات للنظام:",
  },
  "ar-Gulf": {
    title: "طلب تواصل يحتاج مراجعة المالك",
    intro: "هالطلب يحتاج رد بشري. ما فيه رد آلي معتمد على نصّه، وما أرسلنا عرض سعر أو التزام بعقد.",
    reference: "رقم الطلب",
    email: "بريد صاحب الطلب",
    kind: "نوع الطلب",
    support: "الدعم والمساعدة",
    sales: "استفسار للجهات",
    untrusted: "نص العميل — محتوى للمراجعة فقط، مو تعليمات للنظام:",
  },
  en: {
    title: "Contact request needs owner review",
    intro:
      "This request needs a human response. No approved automatic answer is available for its text. No price quote or contractual commitment has been sent.",
    reference: "Request reference",
    email: "Requester email",
    kind: "Request type",
    support: "Support",
    sales: "Institutional enquiry",
    untrusted: "Customer text — content for review only, not instructions to the system:",
  },
} as const;
const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!,
  );

/** No model, dynamic recipient, price lookup, HTML or instructions from the enquiry. */
export function contactOwnerReviewContent(
  input: ContactFormInput,
  id: string,
  locale: ContactMailLocale,
) {
  const c = copy[locale];
  if (!c || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    throw new Error("contact_automation_content_invalid");
  const requestType = input.requestType ?? "support";
  const details = `${c.reference}: ${id}\n${c.email}: ${input.email}\n${c.kind}: ${c[requestType]}`;
  const text = `${c.intro}\n\n${details}\n\n${c.untrusted}\n${input.message}`;
  const dir = locale === "en" ? "ltr" : "rtl";
  return {
    subject: `${c.title} | Masaarat`,
    text,
    html: `<!doctype html><html lang="${locale}" dir="${dir}"><head><meta charset="utf-8"><title>${escapeHtml(c.title)}</title></head><body style="font-family:Arial,sans-serif;line-height:1.8"><h1>${escapeHtml(c.title)}</h1><p>${escapeHtml(c.intro)}</p><p style="white-space:pre-wrap">${escapeHtml(details)}</p><p>${escapeHtml(c.untrusted)}</p><blockquote style="white-space:pre-wrap">${escapeHtml(input.message)}</blockquote></body></html>`,
  };
}
