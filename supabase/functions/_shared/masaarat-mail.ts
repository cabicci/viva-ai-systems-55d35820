/** Server-owned account templates; all metadata is constrained before HTML interpolation. */
export type MailLocale = "ar-EG" | "ar-MSA" | "ar-Gulf" | "en";
export function emailAccessInvitationContent(grant: {
  locale: unknown;
  scope_mode: string;
  catalogues: string[];
  duration_days: number | null;
  recipient_email?: string;
  catalogue_titles?: Record<string, string>;
}) {
  const locale = mailLocale(grant.locale),
    english = locale === "en";
  const scope =
    grant.scope_mode === "all_published"
      ? english
        ? "all published lessons, including future publications"
        : "كل الدروس المنشورة، بما فيها ما يُنشر لاحقًا"
      : grant.catalogues
          .map((key) => catalogueLabel(key, locale, grant.catalogue_titles))
          .join(english ? ", " : "، ");
  const includesKids = grant.scope_mode === "all_published" || grant.catalogues.includes("kids");
  const kidsNote = includesKids
    ? english
      ? " Kids guardian consent and child profiles remain required."
      : " عند استخدام محتوى الأطفال، تلزم موافقة ولي الأمر وإعداد ملف الطفل."
    : "";
  const duration =
    grant.duration_days === null
      ? english
        ? "permanent"
        : "دائمة"
      : grant.duration_days + (english ? " days from activation" : " يومًا من التفعيل");
  const copy = {
    "ar-EG": {
      subject: "دعوتك لدروس مسارات",
      body: `الإدارة ادّتك وصول إلى ${scope} (${duration}). اعمل حساب بنفس الإيميل اللي وصلته الدعوة وأكّده، ولو عندك حساب بالفعل اختار تسجيل الدخول. الوصول بيتفعّل تلقائيًا من غير دفع أو كوبون. هذه المنحة تخص الدروس المذكورة ولا تشمل الخدمات الإضافية تلقائيًا.${kidsNote}`,
      action: "إنشاء حساب",
    },
    "ar-MSA": {
      subject: "دعوتك للوصول إلى دروس مسارات",
      body: `منحك المسؤول وصولًا إلى ${scope} (${duration}). أنشئ حسابًا بنفس البريد المستلم وتحقق منه، أو اختر تسجيل الدخول إن كان لديك حساب بالفعل. يتفعّل الوصول تلقائيًا دون دفع أو كوبون. هذه المنحة تخص الدروس المذكورة ولا تشمل الخدمات الإضافية تلقائيًا.${kidsNote}`,
      action: "إنشاء حساب",
    },
    "ar-Gulf": {
      subject: "دعوتك لدروس مسارات",
      body: `الإدارة منحتك وصول إلى ${scope} (${duration}). سوّ حساب بنفس الإيميل اللي وصلته الدعوة وأكّده، وإذا عندك حساب من قبل اختر تسجيل الدخول. الوصول يتفعّل تلقائيًا بدون دفع أو كوبون. هالمنحة تخص الدروس المذكورة وما تشمل الخدمات الإضافية تلقائيًا.${kidsNote}`,
      action: "إنشاء حساب",
    },
    en: {
      subject: "Your Masaarat lesson access invitation",
      body: `An administrator granted you access to ${scope} (${duration}). Create an account using this recipient email and verify it, or choose Sign in if you already have an account. Access activates automatically, without payment or a coupon. This grant covers the listed lessons; additional services are not included automatically.${kidsNote}`,
      action: "Create your account",
    },
  }[locale];
  const query = new URLSearchParams({ locale });
  const email = grant.recipient_email?.trim();
  if (email && email.length <= 254 && /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email))
    query.set("email", email);
  return {
    subject: copy.subject,
    ...personalized(locale, null, copy.subject, copy.body, copy.action, `/signup?${query}`),
  };
}
export function mailLocale(value: unknown): MailLocale {
  return value === "ar-MSA" || value === "ar-Gulf" || value === "en" ? value : "ar-EG";
}
function catalogueLabel(key: string, locale: MailLocale, titles?: Record<string, string>) {
  const english = locale === "en";
  const known: Record<string, string> = {
    "ai:pro": english ? "AI learning — Pro" : "تعليم الذكاء الاصطناعي — Pro",
    "ai:pro_plus": english ? "AI learning — Pro Plus" : "تعليم الذكاء الاصطناعي — Pro Plus",
    kids: english ? "Children’s learning" : "تعلّم الأطفال",
    "technical:furniture": english
      ? "Technical learning — carpentry and furniture making"
      : "التعليم الفني — النجارة وصناعة الأثاث",
  };
  const title = titles?.[key];
  if (
    typeof title === "string" &&
    title.trim() &&
    title.length <= 300 &&
    !/[\p{Cc}\p{Cf}]/u.test(title)
  )
    return title.trim();
  return (
    known[key] ??
    (key.startsWith("academic:")
      ? english
        ? "Academic course included in your invitation"
        : "المنهج الأكاديمي المشمول بدعوتك"
      : english
        ? "Lessons included in your invitation"
        : "الدروس المشمولة بدعوتك")
  );
}
function localizedPath(path: string, locale: MailLocale) {
  const url = new URL(path, "https://masaarat.ai");
  url.searchParams.set("locale", locale);
  return url.pathname + url.search + url.hash;
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
const logo = "https://masaarat.ai/brand/masaarat-logo-lockup.png";
function shell(
  locale: MailLocale,
  title: string,
  body: string,
  action: string,
  path: string,
  name: string | null,
) {
  const english = locale === "en";
  const url = escapeHtml(`https://masaarat.ai${path}`);
  const greeting = name
    ? `${english ? "Hello" : locale === "ar-MSA" ? "مرحبًا" : "أهلًا"} <bdi dir="auto">${escapeHtml(name)}</bdi>،`
    : english
      ? "Hello,"
      : "أهلًا بك،";
  return `<!doctype html><html lang="${english ? "en" : "ar"}" dir="${english ? "ltr" : "rtl"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:24px 12px;background:#fdfefe;color:#243044;font-family:Tahoma,Arial,sans-serif"><table role="presentation" style="width:100%;max-width:560px;table-layout:fixed;margin:auto;border-collapse:collapse;background:#fdfefe;border:1px solid #dce6ed;border-radius:16px" cellpadding="0" cellspacing="0"><tr><td style="padding:30px 32px 18px;background:#e8f1f6;border-radius:16px 16px 0 0"><a href="https://masaarat.ai" style="color:#243044;text-decoration:none"><img src="${logo}" alt="مسارات | Masaarat" width="165" style="max-width:100%;height:auto;border:0;display:block"><span style="display:none">Masaarat</span></a></td></tr><tr><td dir="${english ? "ltr" : "rtl"}" style="padding:30px 32px;text-align:${english ? "left" : "right"}"><h1 style="font-size:24px;line-height:1.4;margin:0 0 18px;color:#243044">${escapeHtml(title)}</h1><p style="font-size:17px;line-height:1.8;margin:0 0 10px">${greeting}</p><p style="font-size:17px;line-height:1.8;margin:0 0 24px">${escapeHtml(body)}</p><a href="${url}" style="display:inline-block;background:#477eaa;color:#fff;padding:13px 22px;border-radius:10px;text-decoration:none;font-weight:bold">${escapeHtml(action)}</a><p style="font-size:13px;line-height:1.6;color:#566675;margin:24px 0 0"><a href="${url}" style="color:#356f9a;overflow-wrap:anywhere;word-wrap:break-word;word-break:break-word">${url}</a></p></td></tr><tr><td style="background:#f3f8f8;padding:18px 32px;border-radius:0 0 16px 16px;color:#566675;font-size:13px;line-height:1.7">${english ? "This is an account service message. Need help?" : "هذه رسالة خدمة تخص حسابك. تحتاج مساعدة؟"} <a href="https://masaarat.ai/contact?locale=${locale}" style="color:#356f9a">${english ? "Contact Masaarat" : "تواصل مع مسارات"}</a>.</td></tr></table></body></html>`;
}
function personalized(
  localeInput: unknown,
  nameInput: unknown,
  title: string,
  body: string,
  action: string,
  path: string,
) {
  const locale = mailLocale(localeInput);
  const name = safeName(nameInput);
  path = localizedPath(path, locale);
  const greeting = name ? `${locale === "en" ? "Hello" : "أهلًا"} ${name}،\n` : "";
  return {
    text: `${greeting}${body}\n\nhttps://masaarat.ai${path}\n${locale === "en" ? "Help" : "للمساعدة"}: https://masaarat.ai/contact?locale=${locale}`,
    html: shell(locale, title, body, action, path, name),
  };
}
export const legacyWelcomeContent = {
  subject: "مرحبًا بك في مسارات | Welcome to Masaarat",
  text: "تم تأكيد بريد حسابك في مسارات. حسابك جاهز لاستكشاف مجالات التعلّم ومتابعة تقدمك: https://masaarat.ai/my-learning\nللمساعدة: https://masaarat.ai/contact\n\nYour Masaarat email is confirmed. Your account is ready to explore learning areas and manage your progress: https://masaarat.ai/my-learning\nHelp: https://masaarat.ai/contact",
};
export function welcomeContent(name: unknown, localeInput: unknown) {
  const locale = mailLocale(localeInput);
  const copy = {
    "ar-EG": [
      "أهلًا بك في مسارات",
      "تم تأكيد إيميلك وحسابك بقى جاهز. اختار مجال التعلّم المناسب لك، وتابع دروسك وتقدّمك من حسابك.",
      "افتح حسابك",
    ],
    "ar-MSA": [
      "مرحبًا بك في مسارات",
      "تم تأكيد بريدك الإلكتروني وأصبح حسابك جاهزًا. اختر مجال التعلّم المناسب لك، وتابع دروسك وتقدّمك من حسابك.",
      "فتح حسابي",
    ],
    "ar-Gulf": [
      "حيّاك الله في مسارات",
      "تم تأكيد إيميلك وحسابك صار جاهز. اختر مجال التعلّم اللي يناسبك، وتابع دروسك وتقدّمك من حسابك.",
      "افتح حسابك",
    ],
    en: [
      "Welcome to Masaarat",
      "Your email is confirmed and your account is ready. Explore the learning areas that suit your goals, and manage your lessons and progress from your account.",
      "Open my account",
    ],
  } as const;
  const [title, body, action] = copy[locale];
  return { subject: title, ...personalized(locale, name, title, body, action, "/my-learning") };
}
export function subscriptionContent(
  plan: "pro" | "pro_plus" | "technical" | "academic",
  kind: "activated" | "renewed",
  name: unknown,
  localeInput: unknown,
) {
  const locale = mailLocale(localeInput);
  const label =
    plan === "academic"
      ? "Academic"
      : plan === "technical"
        ? "TECH"
        : plan === "pro_plus"
          ? "Pro Plus"
          : "Pro";
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
    ...personalized(
      locale,
      name,
      title,
      body,
      action,
      plan === "academic"
        ? "/academic"
        : plan === "technical"
          ? "/technical/curriculum"
          : "/dashboard",
    ),
  };
}

export type PaymentConfirmation = {
  order_id: string;
  name?: string | null;
  locale: unknown;
  package: string;
  reference: string;
  amount_minor: number;
  currency: string;
};
function paymentPath(input: PaymentConfirmation, admin = false) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.order_id))
    throw new Error("Invalid payment order");
  return `${admin ? "/admin/commerce" : "/payments"}?order=${input.order_id}`;
}
export function paymentConfirmationContent(input: PaymentConfirmation) {
  const locale = mailLocale(input.locale);
  const plan =
    input.package === "pro_plus"
      ? "Pro Plus"
      : input.package === "kids"
        ? "Kids"
        : input.package === "academic"
          ? "Masaarat Academic"
          : input.package === "technical"
            ? "Masaarat TECH"
            : "Pro";
  const amount = new Intl.NumberFormat(locale === "en" ? "en-US" : "ar", {
    style: "currency",
    currency: input.currency,
  }).format(input.amount_minor / 100);
  const copy = {
    "ar-EG": [
      "تم تأكيد دفعك",
      `أهلًا بيك في ${plan}! الإدارة أكدت استلام ${amount} للطلب ${input.reference}. باقتك اتأكدت، وصلاحيتها بتبدأ في الموعد المسجّل في حسابك. شوف تفاصيل الباقة وابدأ رحلتك.`,
      "عرض باقتي",
    ],
    "ar-MSA": [
      "تأكيد الدفع والباقة",
      `مرحبًا بك في ${plan}! أكدت الإدارة استلام ${amount} للطلب ${input.reference}. تم تأكيد باقتك، وتبدأ صلاحيتها في الموعد المسجّل في حسابك. اطّلع على تفاصيل الباقة وابدأ رحلتك.`,
      "عرض باقتي",
    ],
    "ar-Gulf": [
      "تأكد دفعك وباقتك",
      `حيّاك في ${plan}! الإدارة أكدت استلام ${amount} للطلب ${input.reference}. باقتك تأكدت، وصلاحيتها تبدأ حسب الموعد المسجّل في حسابك. شوف تفاصيل الباقة وابدأ رحلتك.`,
      "شوف باقتي",
    ],
    en: [
      "Payment and plan confirmed",
      `Welcome to ${plan}! Our team has verified receipt of ${amount} for order ${input.reference}. Your plan is confirmed and access starts on the date recorded in your account. View your plan details and continue your learning journey.`,
      "View my plan",
    ],
  } as const;
  const [title, body, action] = copy[locale];
  return {
    subject: `${title} | Masaarat ${plan}`,
    ...personalized(locale, input.name, title, body, action, paymentPath(input)),
  };
}

export function receiptReviewContent(input: PaymentConfirmation) {
  const locale = mailLocale(input.locale);
  const plan =
    input.package === "pro_plus"
      ? "Pro Plus"
      : input.package === "kids"
        ? "Kids"
        : input.package === "academic"
          ? "Masaarat Academic"
          : input.package === "technical"
            ? "Masaarat TECH"
            : "Pro";
  const amount = new Intl.NumberFormat(locale === "en" ? "en-US" : "ar", {
    style: "currency",
    currency: input.currency,
  }).format(input.amount_minor / 100);
  const copy = {
    "ar-EG": [
      "إيصال جديد محتاج مراجعة",
      `اترفع إيصال للطلب ${input.reference}، باقة ${plan}، وقيمة الطلب ${amount}. ادخل لوحة الإدارة عشان تشوف الإيصال وتتأكد من وصول التحويل قبل تأكيد الدفع وتفعيل الباقة. رفع الإيصال لوحده مش تأكيد للدفع.`,
      "مراجعة الطلب",
    ],
    "ar-MSA": [
      "إيصال جديد بانتظار المراجعة",
      `تم رفع إيصال للطلب ${input.reference}، باقة ${plan}، وقيمة الطلب ${amount}. افتح لوحة الإدارة لمراجعة الإيصال والتحقق من وصول التحويل قبل تأكيد الدفع وتفعيل الباقة. رفع الإيصال لا يُعد تأكيدًا للدفع.`,
      "مراجعة الطلب",
    ],
    "ar-Gulf": [
      "إيصال جديد ينتظر المراجعة",
      `انرفع إيصال للطلب ${input.reference}، باقة ${plan}، وقيمة الطلب ${amount}. ادخل لوحة الإدارة وراجع الإيصال وتأكد من وصول التحويل قبل تأكيد الدفع وتفعيل الباقة. رفع الإيصال بروحه ما يعني تأكيد الدفع.`,
      "راجع الطلب",
    ],
    en: [
      "New receipt awaiting review",
      `A receipt was uploaded for order ${input.reference}, plan ${plan}, order total ${amount}. Open the admin panel to review the receipt and verify that the transfer arrived before confirming payment and activating the plan. Uploading a receipt does not confirm payment.`,
      "Review order",
    ],
  } as const;
  const [title, body, action] = copy[locale];
  return {
    subject: `${title} | ${input.reference}`,
    ...personalized(locale, null, title, body, action, paymentPath(input, true)),
  };
}

/** Invitations remain separate from delivery, verified acceptance and paid activation. */
export function invitationContent(input: {
  id: string;
  name?: string | null;
  locale: unknown;
  package: string;
  duration_days: number;
  deadline: string;
  access_kind: string;
}) {
  if (
    !/^[0-9a-f-]{36}$/i.test(input.id) ||
    !["pro", "pro_plus", "kids", "technical", "academic"].includes(input.package) ||
    !Number.isInteger(input.duration_days) ||
    input.duration_days < 1 ||
    input.duration_days > 1095 ||
    !Number.isFinite(Date.parse(input.deadline))
  )
    throw new Error("Invalid invitation");
  const locale = mailLocale(input.locale),
    english = locale === "en";
  const pack =
    input.package === "pro_plus"
      ? "Pro Plus"
      : input.package === "kids"
        ? "Kids"
        : input.package === "academic"
          ? "Masaarat Academic"
          : input.package === "technical"
            ? "Masaarat TECH"
            : "Pro";
  const deadline = new Date(input.deadline).toISOString().slice(0, 10);
  const title = english
    ? "Your Masaarat invitation"
    : locale === "ar-Gulf"
      ? "دعوتك لمسارات"
      : "دعوتك إلى مسارات";
  const body = {
    "ar-EG": `عندك دعوة لباقة ${pack} لمدة ${input.duration_days} يوم. اقبل الدعوة قبل ${deadline} بنفس الإيميل المدعو بعد تأكيده. ${input.access_kind === "external" ? "الوصول مستني تأكيد الدفع وقبول الدعوة." : "المنحة بتبدأ لما تقبل، إلا لو اتحدد موعد تاني للبداية."} ${input.package === "kids" ? "كمّل موافقة ولي الأمر وإعداد ملف الطفل الأول." : ""}`,
    "ar-MSA": `لديك دعوة لباقة ${pack} لمدة ${input.duration_days} يومًا. آخر موعد للقبول ${deadline}. استخدم البريد المدعو وتحقق منه قبل القبول. ${input.access_kind === "external" ? "ينتظر الوصول تأكيد الدفع وقبول الدعوة." : "تبدأ المنحة عند القبول، إلا إذا حُدد موعد آخر للبداية."} ${input.package === "kids" ? "أكمل موافقة ولي الأمر وإعداد ملف الطفل أولًا." : ""}`,
    "ar-Gulf": `عندك دعوة لباقة ${pack} لمدة ${input.duration_days} يوم. اقبل دعوتك قبل ${deadline} بنفس الإيميل المدعو بعد تأكيده. ${input.access_kind === "external" ? "الوصول ينتظر تأكيد الدفع وقبول الدعوة." : "المنحة تبدأ لما تقبل، إلا إذا تحدد موعد ثاني للبداية."} ${input.package === "kids" ? "كمّل موافقة ولي الأمر وإعداد ملف الطفل أول." : ""}`,
    en: `You are invited to ${pack} for ${input.duration_days} days. Accept by ${deadline} using the verified invited email. ${input.access_kind === "external" ? "Access waits for confirmed payment and acceptance." : "Complimentary access starts when you accept, unless a scheduled start was selected."} ${input.package === "kids" ? "Complete the existing guardian and family setup first." : ""}`,
  }[locale];
  const result = personalized(
    locale,
    input.name,
    title,
    body,
    english ? "Review invitation" : "مراجعة الدعوة",
    `/invitations/${input.id}?locale=${locale}`,
  );
  // Invitation campaigns honor opt-outs. Reuse branding while making the footer accurate.
  const footer = english ? "Invitation preferences" : "تفضيلات الدعوات";
  return {
    subject: `${title} | Masaarat`,
    text: `${result.text}\n${footer}: https://masaarat.ai/payments?locale=${locale}`,
    html: result.html.replace(
      english
        ? "This is an account service message. Need help?"
        : "هذه رسالة خدمة تخص حسابك. تحتاج مساعدة؟",
      `<a href="https://masaarat.ai/payments?locale=${locale}">${footer}</a>. ${english ? "Need help?" : "تحتاج مساعدة؟"}`,
    ),
  };
}
