import { OFFICIAL_LINKS, OFFICIAL_ORIGIN } from "./config";

export type SupportLang = "ar" | "en";
export type FreeAccessState =
  | { kind: "active"; endsAt: string }
  | { kind: "inactive" }
  | { kind: "unknown" };

const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>()"']+|\b[a-z0-9.-]+\.(?:ai|com|net|org|io|app|me|ly|eg)(?:\/[^\s<>()"']*)?/gi;
const EMAIL_RE = /[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,}/gi;
const PHONE_RE = /\+?[0-9٠-٩][0-9٠-٩\s().-]{6,}[0-9٠-٩]/g;
const HANDLE_RE = /(^|\s)@[\w.]{2,30}/g;
const HEBREW_RE = /[\u0590-\u05FF\uFB1D-\uFB4F]/;
const OFFICIAL_URL_RE = /^https:\/\/masaarat\.ai(?:\/[A-Za-z0-9\-._~/]*)?(?:\?[A-Za-z0-9\-._~=&]*)?$/;

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

/** Arabic script → Arabic; anything else (including Hebrew) → English. Never Hebrew. */
export function detectLang(text: string): SupportLang {
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/[a-zA-Z\u00C0-\u024F\u0400-\u04FF\u0590-\u05FF]/.test(text)) return "en";
  return "ar";
}

const HANDOFF_RE =
  /(موظف|خدمة العملاء|خدمه العملاء|حد من الفريق|أكلم حد|اكلم حد|عايز اكلم|بني ?آدم|\bhuman\b|\bagent\b|representative|real person|talk to (?:a )?person)/i;
export function wantsHuman(text: string): boolean {
  return HANDOFF_RE.test(text);
}

const UNSAFE_OUTPUT_RE =
  /(باسورد|الباسوورد|كلمة (?:ال)?سر|كلمة المرور|رمز التحقق|كود التحقق|رقم البطاقة|password|passcode|\botp\b|verification code|card number|cvv)/i;
const CERTIFICATE_RE = /(شهاد|certificat|accredit|اعتماد)/i;
/** Promises nobody is set up to keep (live agent, callbacks, guaranteed replies). */
const PROMISE_RE =
  /(هنحوّل|هنحول|هيتواصل|هنتواصل|هيرد عليك|هنرد عليك|هيكلمك|موظف هي|حد من الفريق هي|we(?:'ll| will) (?:pass|transfer|connect|get back|contact|call|reply)|(?:an?|our) (?:agent|team member|representative) will|someone will (?:contact|reach|get back|reply))/i;

function signature(lang: SupportLang): string {
  return lang === "ar" ? "— فريق مسارات" : "— Masaarat Team";
}

export function isOfficialUrl(link: string): boolean {
  return OFFICIAL_URL_RE.test(link) && !link.includes("//", 8);
}

export function finish(body: string, link: string, lang: SupportLang): string {
  const safe = isOfficialUrl(link) ? link : OFFICIAL_ORIGIN;
  return `${body.trim()}\n\n${safe}\n${signature(lang)}`;
}

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

/** Used when the model is unavailable or its output is rejected. Mentions an active offer. */
export function fallbackReply(lang: SupportLang, offer: FreeAccessState = { kind: "unknown" }): string {
  const line = offerLine(offer, lang);
  if (line) {
    const body =
      lang === "ar"
        ? `أهلاً بيك! ${line} تقدر تبدأ من الموقع، ولو سؤالك عن حسابك أو الدفع ابعته من صفحة التواصل على الموقع.`
        : `Hi! ${line} You can start on the website; for account or payment questions, use the contact page there.`;
    return finish(body, OFFICIAL_LINKS.home, lang);
  }
  const body =
    lang === "ar"
      ? "أهلاً بيك! معلش مش قادرين نجاوب على السؤال ده بالتفصيل هنا. تقدر تبعت سؤالك من صفحة التواصل."
      : "Hi! We can't answer this one in detail here. You can send your question through the contact page.";
  return finish(body, OFFICIAL_LINKS.contact, lang);
}

/** No live hand-off exists, so this never promises a person or a callback. */
export function handoffReply(lang: SupportLang): string {
  const body =
    lang === "ar"
      ? "أكيد. الرسايل هنا بيرد عليها المساعد الآلي لمسارات. لو محتاج فريق الدعم ابعت طلبك من صفحة التواصل على الموقع."
      : "Sure. Messages here are answered by Masaarat's automated assistant. If you need the support team, please send your request through the contact page on the website.";
  return finish(body, OFFICIAL_LINKS.contact, lang);
}

/** Western-digit numbers in a text (Arabic-Indic digits and thousands separators folded). */
export function numbersIn(text: string): string[] {
  const t = text
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/٫/g, ".")
    .replace(/(\d)[,٬](\d{3})/g, "$1$2");
  return (t.match(/\d+(?:\.\d+)?/g) ?? []).map((n) => String(Number(n)));
}

/**
 * Turns model output into the only text a customer may receive: no external or extra
 * links, no contact details, no credential requests, no certificate claims, no promises,
 * no Hebrew, no numbers absent from the allowed facts, one official link and the signature.
 * Returns null when the output is unusable.
 */
export function sanitizeAnswer(
  raw: string,
  link: string,
  lang: SupportLang,
  offer: FreeAccessState = { kind: "unknown" },
  allowedNumbers?: ReadonlySet<string>,
  ensure: readonly string[] = [],
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
  if (HEBREW_RE.test(body) || UNSAFE_OUTPUT_RE.test(body) || CERTIFICATE_RE.test(body) || PROMISE_RE.test(body))
    return null;
  if (lang === "en" && /[\u0600-\u06FF]{3,}/.test(body)) return null;
  if (allowedNumbers && numbersIn(body).some((n) => !allowedNumbers.has(n))) return null;
  if (body.length > 700) body = `${body.slice(0, 697).replace(/\s+\S*$/, "")}…`;
  for (const required of ensure) if (!body.includes(required)) body = `${body}\n${required}`;
  const line = offerLine(offer, lang);
  if (line) body = `${body}\n${line}`;
  return finish(body, link, lang);
}

export function offerFacts(state: FreeAccessState): string {
  if (state.kind !== "active")
    return "No promotion is active. Do not mention any free period, promotion, discount or deadline.";
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

export function systemPrompt(
  facts: string[],
  offer: string,
  isPublicComment: boolean,
  lang: SupportLang,
): string {
  return `You are the customer-support assistant of Masaarat (مسارات). Answer one customer message.
Language: ${lang === "ar" ? "reply in natural, warm Egyptian Arabic, like a helpful person, not a bot." : "reply in natural, warm English, like a helpful person. Never reply in Arabic or Hebrew."}
Keep path and plan names (Builder, Creator, Automator, Analyst, Business, Pro, Pro Plus) in English.
Verified public facts for this question (the ONLY facts you may use):
${facts.map((f) => `- ${f}`).join("\n")}
Live promotion state:
${offer}
Rules:
- Answer directly with the facts above. Copy every price, currency, number and term exactly; never compute, convert, round or invent any.
- If the facts do not answer the question, say so briefly and suggest the contact page (set "contact": true).
- Never teach, summarise or quote lesson content; you may only use the lesson title and its place in the curriculum.
- Never make claims about the customer's own account, payment or subscription.
- Never promise that a person will contact, call or reply to them, and never offer a hand-off.
- Never ask for passwords, verification codes, card details, phone numbers, emails or other personal data.
- Do not include any URL, email or phone number; the system adds one official link. Do not sign the message.
- Keep it short: at most 4 short sentences.${isPublicComment ? "\n- This is a public comment: be brief and public-appropriate, never mention private details. If it is not a genuine question or request about Masaarat, use action \"skip\"." : ""}
Return JSON only: {"action":"answer"|"skip","contact":true|false,"answer":"..."}.`;
}

export function parseModelJson(content: string): { action: "answer" | "skip"; contact: boolean; answer: string } | null {
  try {
    const v = JSON.parse(content) as Record<string, unknown>;
    const action = v.action === "skip" ? "skip" : v.action === "answer" ? "answer" : null;
    if (!action) return null;
    return { action, contact: v.contact === true, answer: typeof v.answer === "string" ? v.answer : "" };
  } catch {
    return null;
  }
}

export function countOfficialLinks(text: string): number {
  return (text.match(/https:\/\/masaarat\.ai[^\s]*/g) ?? []).length;
}

/** Public comments get a reply only when they look like a real question or request. */
const QUESTION_HINT_RE =
  /([?؟]|(?:^|\s)(كام|بكام|ازاي|إزاي|ايه|إيه|فين|امتى|إمتى|هل|ممكن|عايز|عاوز|محتاج|ينفع|سعر|اشتراك|how|what|where|when|which|can|does|is there|price|cost|subscribe|sign up|join)(?:\s|$))/i;
export function isRelevantPublicQuestion(text: string): boolean {
  const t = text.trim();
  if (t.length < 4 || t.length > 1000) return false;
  if (/^(?:[@#]\S+\s*)+$/.test(t)) return false;
  return QUESTION_HINT_RE.test(t);
}
