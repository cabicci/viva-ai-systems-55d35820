/** Server-owned account templates; all metadata is constrained before HTML interpolation. */
export type MailLocale = "ar-EG" | "ar-MSA" | "ar-Gulf" | "en";
export function mailLocale(value: unknown): MailLocale {
  return value === "ar-MSA" || value === "ar-Gulf" || value === "en" ? value : "ar-EG";
}
function safeName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  return name.length >= 2 && name.length <= 80 && !/[\p{Cc}\p{Cf}]/u.test(name) ? name : null;
}
function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!,
  );
}
type WelcomeGuide = { features: string[]; plans: string[]; plansTitle: string; pricing: string };
const logo = "https://masaarat.ai/brand/masaarat-logo-lockup.png";
function shell(
  locale: MailLocale,
  title: string,
  body: string,
  action: string,
  path: string,
  name: string | null,
  guide?: WelcomeGuide,
) {
  const english = locale === "en";
  const url = `https://masaarat.ai${path}`;
  const greeting = name
    ? `${english ? "Hello" : locale === "ar-MSA" ? "مرحبًا" : "أهلًا"} <bdi dir="auto">${escapeHtml(name)}</bdi>،`
    : english
      ? "Hello,"
      : "أهلًا بك،";
  const list = (items: string[]) =>
    `<table role="presentation" dir="${english ? "ltr" : "rtl"}" style="width:100%;border-collapse:collapse;margin:18px 0" cellpadding="0" cellspacing="0">${items.map((item) => `<tr><td style="width:20px;vertical-align:top;padding:5px 0;color:#477eaa;font-size:17px">•</td><td dir="${english ? "ltr" : "rtl"}" style="text-align:${english ? "left" : "right"};vertical-align:top;padding:5px 8px;font-size:15px;line-height:1.8">${escapeHtml(item)}</td></tr>`).join("")}</table>`;
  const guideHtml = guide
    ? `${list(guide.features)}<h2 style="font-size:19px;color:#243044;text-align:${english ? "left" : "right"}">${escapeHtml(guide.plansTitle)}</h2>${list(guide.plans)}<p><a href="https://masaarat.ai/pricing" style="color:#356f9a">${escapeHtml(guide.pricing)}</a></p>`
    : "";
  return `<!doctype html><html lang="${english ? "en" : "ar"}" dir="${english ? "ltr" : "rtl"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:24px 12px;background:#fdfefe;color:#243044;font-family:Tahoma,Arial,sans-serif"><table role="presentation" style="width:100%;max-width:560px;margin:auto;border-collapse:collapse;background:#fdfefe;border:1px solid #dce6ed;border-radius:16px" cellpadding="0" cellspacing="0"><tr><td style="padding:30px 32px 18px;background:#e8f1f6;border-radius:16px 16px 0 0"><a href="https://masaarat.ai" style="color:#243044;text-decoration:none"><img src="${logo}" alt="مسارات | Masaarat" width="165" style="max-width:100%;height:auto;border:0;display:block"><span style="display:none">Masaarat</span></a></td></tr><tr><td dir="${english ? "ltr" : "rtl"}" style="padding:30px 32px;text-align:${english ? "left" : "right"}"><h1 style="font-size:24px;line-height:1.4;margin:0 0 18px;color:#243044">${escapeHtml(title)}</h1><p style="font-size:17px;line-height:1.8;margin:0 0 10px">${greeting}</p><p style="font-size:17px;line-height:1.8;margin:0 0 24px">${escapeHtml(body)}</p>${guideHtml}<a href="${url}" style="display:inline-block;background:#477eaa;color:#fff;padding:13px 22px;border-radius:10px;text-decoration:none;font-weight:bold">${escapeHtml(action)}</a><p style="font-size:13px;line-height:1.6;color:#566675;margin:24px 0 0"><a href="${url}" style="color:#356f9a">${url}</a></p></td></tr><tr><td style="background:#f3f8f8;padding:18px 32px;border-radius:0 0 16px 16px;color:#566675;font-size:13px;line-height:1.7">${english ? "This is an account service message. Need help?" : "هذه رسالة خدمة تخص حسابك. تحتاج مساعدة؟"} <a href="https://masaarat.ai/contact" style="color:#356f9a">${english ? "Contact Masaarat" : "تواصل مع مسارات"}</a>.</td></tr></table></body></html>`;
}
function personalized(
  localeInput: unknown,
  nameInput: unknown,
  title: string,
  body: string,
  action: string,
  path: string,
  guide?: WelcomeGuide,
) {
  const locale = mailLocale(localeInput);
  const name = safeName(nameInput);
  const greeting = name ? `${locale === "en" ? "Hello" : "أهلًا"} ${name}،\n` : "";
  return {
    text: `${greeting}${body}\n${guide ? `\n${guide.features.map((item) => `• ${item}`).join("\n")}\n\n${guide.plansTitle}\n${guide.plans.map((item) => `• ${item}`).join("\n")}\n${guide.pricing}: https://masaarat.ai/pricing\n` : ""}\nhttps://masaarat.ai${path}\n${locale === "en" ? "Help" : "للمساعدة"}: https://masaarat.ai/contact`,
    html: shell(locale, title, body, action, path, name, guide),
  };
}
export const legacyWelcomeContent = {
  subject: "مرحبًا بك في مسارات | Welcome to Masaarat",
  text: "تم تأكيد بريد حسابك في مسارات. يمكنك تسجيل الدخول من https://masaarat.ai/login ومراجعة حسابك. للمساعدة: https://masaarat.ai/contact\nهذه رسالة خدمة لتأكيد جاهزية حسابك وليست رسالة تسويقية. لا ترسل بيانات الأطفال عبر البريد.\n\nYour Masaarat account email is confirmed. Sign in at https://masaarat.ai/login to access your account. For help: https://masaarat.ai/contact\nThis is an account service message, not a marketing email. Do not send child details by email.",
};
export function welcomeContent(name: unknown, localeInput: unknown) {
  const locale = mailLocale(localeInput);
  const copy = {
    "ar-EG": [
      "أهلًا بك في مسارات",
      "تم تأكيد إيميل حسابك. رحلتك العملية مع الذكاء الاصطناعي جاهزة؛ ادخل وابدأ.",
      "ابدأ رحلتك",
    ],
    "ar-MSA": [
      "مرحبًا بك في مسارات",
      "تم تأكيد بريد حسابك. رحلتك العملية مع الذكاء الاصطناعي جاهزة؛ سجّل الدخول وابدأ.",
      "ابدأ رحلتك",
    ],
    "ar-Gulf": [
      "حيّاك الله في مسارات",
      "تم تأكيد إيميل حسابك. رحلتك العملية مع الذكاء الاصطناعي جاهزة؛ سجّل دخولك وابدأ.",
      "ابدأ رحلتك",
    ],
    en: [
      "Welcome to Masaarat",
      "Your account email is confirmed. Sign in to begin your practical AI learning journey.",
      "Sign in",
    ],
  } as const;
  const guides: Record<MailLocale, WelcomeGuide> = {
    "ar-EG": {
      features: [
        "اتعلم الذكاء الاصطناعي بالتطبيق في مسارات مترابطة، مع دروس ومهام تقدر تنفذها بنفسك.",
        "تابع تقدمك من لوحة حسابك، واختار المسار اللي يناسب هدفك.",
      ],
      plansTitle: "اختار الباقة المناسبة لك",
      plans: [
        "مجاني: المقدمة وأول درس من كل مسار.",
        "Pro: كل الدروس خارج مسار Builder (٧١ درسًا).",
        "Pro Plus: جميع الدروس الـ١٠٠، بما فيها مسار Builder.",
      ],
      pricing: "شوف تفاصيل الباقات والمزايا الحالية",
    },
    "ar-MSA": {
      features: [
        "تعلّم الذكاء الاصطناعي بالتطبيق عبر مسارات مترابطة، ودروس ومهام عملية.",
        "تابع تقدّمك من لوحة حسابك، واختر المسار المناسب لهدفك.",
      ],
      plansTitle: "اختر الباقة المناسبة لك",
      plans: [
        "مجاني: المقدمة والدرس الأول من كل مسار.",
        "Pro: جميع الدروس باستثناء مسار Builder (٧١ درسًا).",
        "Pro Plus: جميع الدروس المئة، بما فيها مسار Builder.",
      ],
      pricing: "اطّلع على تفاصيل الباقات والمزايا الحالية",
    },
    "ar-Gulf": {
      features: [
        "تعلّم الذكاء الاصطناعي بالتطبيق في مسارات مترابطة، ودروس ومهام عملية.",
        "تابع تقدّمك من لوحة حسابك، واختر المسار اللي يناسب هدفك.",
      ],
      plansTitle: "اختر الباقة اللي تناسبك",
      plans: [
        "مجاني: المقدمة وأول درس من كل مسار.",
        "Pro: جميع الدروس عدا مسار Builder (٧١ درسًا).",
        "Pro Plus: جميع الدروس الـ١٠٠، ومنها مسار Builder.",
      ],
      pricing: "اطّلع على تفاصيل الباقات والمزايا الحالية",
    },
    en: {
      features: [
        "Learn AI by doing through connected learning paths, lessons, and practical missions.",
        "Track your progress on your dashboard and choose the path that fits your goal.",
      ],
      plansTitle: "Choose your plan",
      plans: [
        "Free: the introduction and first lesson of every path.",
        "Pro: all 71 lessons outside the Builder path.",
        "Pro Plus: all 100 lessons, including Builder.",
      ],
      pricing: "See current plan details and features",
    },
  };
  const [title, body, action] = copy[locale];
  return {
    subject: title,
    ...personalized(locale, name, title, body, action, "/dashboard", guides[locale]),
  };
}
export function subscriptionContent(
  plan: "pro" | "pro_plus",
  kind: "activated" | "renewed",
  name: unknown,
  localeInput: unknown,
) {
  const locale = mailLocale(localeInput);
  const label = plan === "pro_plus" ? "Pro Plus" : "Pro";
  const first = kind === "activated";
  const copy = {
    "ar-EG": [
      first ? "اشتراكك اتفعّل" : "اشتراكك اتجدد",
      `${first ? "اتفعّل" : "اتجدد"} اشتراك مسارات ${label}. راجع حالة الباقة من حسابك. هذه الرسالة ليست إيصال دفع.`,
      "عرض حسابي",
    ],
    "ar-MSA": [
      first ? "تم تفعيل اشتراكك" : "تم تجديد اشتراكك",
      `${first ? "تم تفعيل" : "تم تجديد"} اشتراك مسارات ${label}. راجع حالة الباقة من حسابك. هذه الرسالة ليست إيصال دفع.`,
      "عرض حسابي",
    ],
    "ar-Gulf": [
      first ? "تفعّل اشتراكك" : "تجدّد اشتراكك",
      `${first ? "تفعّل" : "تجدّد"} اشتراك مسارات ${label}. تقدر تراجع حالة الباقة من حسابك. هالرسالة مب إيصال دفع.`,
      "عرض حسابي",
    ],
    en: [
      first ? "Subscription activated" : "Subscription renewed",
      `Your Masaarat ${label} subscription was ${first ? "activated" : "renewed"}. Check your account for its current status. This is not a payment receipt.`,
      "View account",
    ],
  } as const;
  const [title, body, action] = copy[locale];
  return {
    subject: `${title} | Masaarat ${label}`,
    ...personalized(locale, name, title, body, action, "/dashboard"),
  };
}
