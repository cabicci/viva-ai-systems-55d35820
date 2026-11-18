import { OFFICIAL_LINKS, type OfficialLink } from "./config";

export type SupportLang = "ar" | "other";
export type FreeAccessState =
  | { kind: "active"; endsAt: string }
  | { kind: "inactive" }
  | { kind: "unknown" };

const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>()"']+|\b[a-z0-9.-]+\.(?:ai|com|net|org|io|app|me|ly|eg)(?:\/[^\s<>()"']*)?/gi;
const EMAIL_RE = /[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,}/gi;
const PHONE_RE = /\+?[0-9٠-٩][0-9٠-٩\s().-]{6,}[0-9٠-٩]/g;
const HANDLE_RE = /(^|\s)@[\w.]{2,30}/g;

/** Minimal redacted question text: no links, contacts, handles or long numbers. */
export function redactQuestion(text: string): string {
  return text
    .replace(EMAIL_RE, "[email]")
    .replace(URL_RE, "[link]")
    .replace(PHONE_RE, "[number]")
    .replace(HANDLE_RE, "$1[handle]")
    .replace(/[\u0000-\u0008\u000B-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 600);
}

export function detectLang(text: string): SupportLang {
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  return /[a-zA-Z\u00C0-\u024F\u0400-\u04FF]/.test(text) ? "other" : "ar";
}

const HANDOFF_RE =
  /(موظف|خدمة العملاء|خدمه العملاء|حد من الفريق|أكلم حد|اكلم حد|عايز اكلم|بني ?آدم|\bhuman\b|\bagent\b|representative|real person|talk to (?:a )?person)/i;
export function wantsHuman(text: string): boolean {
  return HANDOFF_RE.test(text);
}

const UNSAFE_OUTPUT_RE =
  /(باسورد|الباسوورد|كلمة (?:ال)?سر|كلمة المرور|رمز التحقق|كود التحقق|رقم البطاقة|password|passcode|\botp\b|verification code|card number|cvv)/i;
const CERTIFICATE_RE = /(شهاد|certificat|accredit|اعتماد)/i;

function signature(lang: SupportLang): string {
  return lang === "ar" ? "— فريق مسارات" : "— Masaarat Team";
}

export function finish(body: string, link: OfficialLink, lang: SupportLang): string {
  return `${body.trim()}\n\n${OFFICIAL_LINKS[link]}\n${signature(lang)}`;
}

export function fallbackReply(lang: SupportLang): string {
  const body =
    lang === "ar"
      ? "أهلاً بيك! معلش مش قادرين نجاوب على السؤال ده بالتفصيل هنا. تقدر تتواصل مع فريق الدعم من صفحة التواصل وهنرد عليك."
      : "Hi! We can't answer this one in detail here. Please reach the support team through the contact page and they'll get back to you.";
  return finish(body, "contact", lang);
}

export function handoffReply(lang: SupportLang): string {
  const body =
    lang === "ar"
      ? "أكيد! هنحوّل محادثتك لفريق الدعم، وتقدر كمان تبعت طلبك من صفحة التواصل عشان نتابع معاك."
      : "Sure! We'll pass your conversation to the support team. You can also send your request through the contact page so we can follow up.";
  return finish(body, "contact", lang);
}

/**
 * Turns model output into the only text a customer may receive: no external or extra
 * links, no contact details, no credential requests, no certificate claims, one
 * official link and the Masaarat signature. Returns null when the output is unusable.
 */
export function offerLine(state: FreeAccessState, lang: SupportLang): string | null {
  if (state.kind !== "active") return null;
  const end = new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
    dateStyle: "long",
    timeZone: "Africa/Cairo",
  }).format(new Date(state.endsAt));
  return lang === "ar"
    ? `ودلوقتي المحتوى متاح مجاناً لفترة محدودة لحد ${end}. الباقات المدفوعة لسه متاحة، ولو اشتركت خلال العرض فمدتك المدفوعة بتبدأ بعد ما العرض يخلص حسب نوع اشتراكك.`
    : `Right now, content is free for a limited time until ${end}. Paid plans are still available; if you subscribe during the promotion, your paid term starts after it ends where applicable.`;
}

export function sanitizeAnswer(
  raw: string,
  link: OfficialLink,
  lang: SupportLang,
  offer: FreeAccessState = { kind: "unknown" },
): string | null {
  let body = raw
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(EMAIL_RE, "")
    .replace(URL_RE, "")
    .replace(PHONE_RE, "")
    .replace(/[*_`#>]+/g, "")
    .replace(/\s+(?:at|on|here|via|من خلال|على|عبر|هنا)?\s*:?\s*(?=[.!؟?،,]|$)/gm, "")
    .replace(/^\s*[—-]\s*(?:فريق مسارات|Masaarat Team).*$/gim, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!body || body.length < 2) return null;
  if (UNSAFE_OUTPUT_RE.test(body) || CERTIFICATE_RE.test(body)) return null;
  if (body.length > 600) body = `${body.slice(0, 597).replace(/\s+\S*$/, "")}…`;
  const line = offerLine(offer, lang);
  if (line) body = `${body}\n${line}`;
  return finish(body, link, lang);
}

export function offerFacts(state: FreeAccessState): string {
  if (state.kind !== "active")
    return "Do not mention any free period, promotion, discount or deadline.";
  const end = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeZone: "Africa/Cairo",
  }).format(new Date(state.endsAt));
  return [
    `A free-access promotion is active right now: content is free for a limited time, until ${end} (Cairo time).`,
    "Paid plans are still available during the promotion.",
    "When applicable, a paid subscription's paid term starts after the promotion ends.",
    "Do not describe the promotion or its dates yourself; the system appends the official promotion sentence. Never say there is no deadline and never contradict it.",
  ].join("\n");
}

export function systemPrompt(facts: string, offer: string, isPublicComment: boolean, lang: SupportLang = "ar"): string {
  return `You are the customer-support assistant of Masaarat (مسارات). Answer one customer question.
Language: ${lang === "ar" ? "reply in natural Egyptian Arabic." : "reply in the same language as the customer's message (it is not Arabic). Do not reply in Arabic."}
Keep path names (Builder, Creator, Automator, Analyst, Business) in English.
Use ONLY these public facts:
${facts}
Live promotion state:
${offer}
Rules:
- Never invent features, prices, dates, durations, certificates, accreditation, guarantees or promises.
- Never make claims about the customer's own account, payment or subscription. For personal billing, refunds, account problems or anything not in the facts, say the support team will help through the contact page and choose link "contact".
- Never ask for passwords, verification codes, card details, phone numbers, emails or other personal data.
- Do not include any URL, email or phone number; the system adds one official link.
- Do not sign the message; the system adds the signature.
- Keep it short and friendly: at most 4 short sentences.${isPublicComment ? "\n- This is a public comment: keep it brief and public-appropriate. If the comment is not a question or request about Masaarat, use action \"skip\"." : ""}
Return JSON only: {"action":"answer"|"skip","link":"home"|"pricing"|"contact","answer":"..."}.
Use link "pricing" for plans, prices, durations or subscriptions; "contact" for support needs; otherwise "home".`;
}

export function parseModelJson(
  content: string,
): { action: "answer" | "skip"; link: OfficialLink; answer: string } | null {
  try {
    const v = JSON.parse(content) as Record<string, unknown>;
    const action = v.action === "skip" ? "skip" : v.action === "answer" ? "answer" : null;
    const link =
      v.link === "pricing" || v.link === "contact" || v.link === "home" ? v.link : "home";
    if (!action) return null;
    return { action, link, answer: typeof v.answer === "string" ? v.answer : "" };
  } catch {
    return null;
  }
}

export function countOfficialLinks(text: string): number {
  return (text.match(/https:\/\/masaarat\.ai[^\s]*/g) ?? []).length;
}
