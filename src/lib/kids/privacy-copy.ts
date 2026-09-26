import type { SupportedLocale } from "@/lib/locale/types";

const ar = {
  title: "سياسة خصوصية مسارات كيدز",
  updated: "26 سبتمبر 2026",
  intro:
    "هذه سياسة واحدة لكل أسر مسارات كيدز. نضع مصلحة الطفل وخصوصيته أولًا، ونستخدم أقل قدر من البيانات لتقديم الدروس تحت إدارة وليّ الأمر. تبدأ معالجة بيانات الطفل فقط بعد فتح الخدمة وتسجيل موافقة وليّ الأمر المطلوبة.",
  sections: [
    {
      title: "من يدير الحساب؟",
      body: "ينشئ البالغ حسابه ببريده المؤكد ويطلب إتاحة كيدز. بعد التحقق من وليّ الأمر والموافقة الصريحة على إشعار الخدمة، ينشئ ملفًا للطفل باسم عرض يختاره ومستوى تعليمي. لا نطلب من الطفل بريدًا أو رقم هاتف أو وثيقة هوية.",
    },
    {
      title: "ما البيانات ولماذا؟",
      body: "نحفظ حساب وليّ الأمر وبلد إقامته ومرجع التحقق والموافقة، واسم عرض الطفل ومستواه وتقدم الدروس. نستخدمها لإدارة الوصول، عرض الدروس والنتائج، حفظ التقدم، حماية الخدمة والرد على طلبات الأسرة. لا نبيع بيانات الأطفال ولا نستخدمها للإعلانات الموجهة أو التتبع السلوكي.",
    },
    {
      title: "الدروس والفيديو والمساعدة",
      body: "نحفظ محتوى الدروس في خدمة التخزين الخاصة بالمنصة، ونشغّل الفيديو عبر Bunny بتوقيع قصير الصلاحية. مساعد الدرس يعرض إجابات مؤلفة مسبقًا من المحتوى التعليمي؛ لا يحتاج إلى اسم الطفل أو محادثة حرة. قد تتلقى خدمات التشغيل بيانات اتصال تقنية لازمة لعرض المحتوى مثل عنوان IP والجهاز.",
    },
    {
      title: "من يطّلع على البيانات؟",
      body: "وليّ الأمر يدير ملفات أطفاله فقط. نستخدم Supabase لتسجيل الدخول وحفظ الملفات والتقدم، وBunny لعرض الفيديو، وResend لإشعارات وليّ الأمر التشغيلية عند تفعيلها. لا نضع اسم الطفل أو تقدمه في رسائل البريد. تُقيد صلاحيات الوصول داخل المنصة، وقد تتم المعالجة لدى مزودي الخدمة خارج بلد الأسرة وفق الترتيبات النظامية اللازمة.",
    },
    {
      title: "الاختيار والحقوق",
      body: "الموافقة على بيانات الطفل منفصلة عن اشتراك الكبار والتسويق، وتُسجّل بنسختها وتاريخها لكل ملف. يستطيع وليّ الأمر سحبها من لوحة كيدز، فيتوقف وصول الملف للدروس؛ ويمكنه طلب الاطلاع أو التصحيح أو المحو عبر البريد أدناه. سحب الموافقة لا يعني أن النسخ الاحتياطية أو سجلات مزودي الخدمة حُذفت فورًا؛ نتعامل مع طلب المحو وفق إجراء الحذف المعتمد.",
    },
    {
      title: "مسؤولية وليّ الأمر ومسارات",
      body: "وليّ الأمر مسؤول عن صحة إقراره بصفته وعن إدارة حساب الأسرة ومتابعة الطفل، ويمكنه الرجوع إلى الجهة المختصة في بلده عند الحاجة. مسارات مسؤولة عن التزاماتها في حماية البيانات وتشغيل الخدمة والرد على الطلبات؛ لا تنقل هذه السياسة تلك الالتزامات إلى وليّ الأمر.",
    },
    {
      title: "الاحتفاظ والأمان",
      body: "نحفظ البيانات ما دامت لازمة للخدمة والحقوق المرتبطة بها. عند انتهاء آخر اشتراك كيدز مدفوع، سياسة الاحتفاظ المعدّة هي 90 يومًا للملفات والتقدم، مع إشعار وليّ الأمر قبل الحذف ومنحه 14 يومًا بعد تأكيد وصول الإشعار. لا يبدأ الحذف الآلي إلا بعد تفعيل إجراء الإشعارات والحذف والتحقق منه. الملفات المجانية التي لم تُدفع لها باقة لا تدخل في مؤقت انتهاء الاشتراك المدفوع؛ ويمكن طلب حذفها مباشرة.",
    },
    {
      title: "التواصل والتغييرات",
      body: "للاستفسار أو ممارسة حقوق الأسرة راسل info@masaarat.ai من بريد حساب وليّ الأمر، دون إرسال وثائق أو تفاصيل الطفل في الرسالة الأولى. إذا تغيّرت طريقة استخدام البيانات، ننشر نسخة جديدة ونطلب موافقة جديدة عندما يلزم؛ لا نغيّر نص الموافقة المقبولة بأثر رجعي.",
    },
  ],
  contact: "info@masaarat.ai",
  back: "العودة إلى مسارات كيدز",
  link: "سياسة خصوصية الأطفال",
} as const;

const en = {
  title: "Masaarat Kids Privacy Policy",
  updated: "26 September 2026",
  intro:
    "One policy for every Masaarat Kids family. We put the child's interests and privacy first and use the minimum data needed for parent-managed lessons. Child data processing starts only after the service opens and the required parent consent is recorded.",
  sections: [
    {
      title: "Who manages the account?",
      body: "An adult signs up with a confirmed email and requests Kids access. After guardian verification and explicit consent to the service notice, they create a child profile with a chosen display name and learning level. We do not ask a child for an email address, phone number or identity document.",
    },
    {
      title: "What data and why?",
      body: "We store the parent's account, country, verification reference and consent, plus the child's display name, level and lesson progress. We use these to manage access, show lessons and results, save progress, protect the service and respond to family requests. We do not sell children's data or use it for targeted advertising or behavioural tracking.",
    },
    {
      title: "Lessons, video and help",
      body: "Lesson content is stored privately by the platform. Bunny delivers video through a short-lived signed link. Lesson help returns pre-authored educational answers, without needing the child's name or an open chat. Delivery providers may receive technical connection data needed to serve content, such as IP address and device information.",
    },
    {
      title: "Who receives data?",
      body: "Parents manage only their own children's profiles. Supabase provides authentication and stores profiles and progress, Bunny delivers video, and Resend may deliver operational parent notices when enabled. We do not put a child's name or progress in email. Access is restricted within the platform. Providers may process data outside the family's country, subject to the necessary legal arrangements.",
    },
    {
      title: "Choice and rights",
      body: "Child-data consent is separate from adult plans and marketing, and its version and time are recorded for each profile. A parent can withdraw it in Kids, which stops lesson access, and can request access, correction or erasure using the email below. Withdrawal does not mean backup or provider records disappear immediately; erasure requests follow the approved deletion process.",
    },
    {
      title: "Parent and Masaarat responsibilities",
      body: "The parent is responsible for the truth of their guardian declaration, managing the family account and supervising the child. They may contact the competent authority in their country when needed. Masaarat remains responsible for its own data-protection, service and request-handling duties; this policy does not transfer them to the parent.",
    },
    {
      title: "Retention and safety",
      body: "We retain data only while needed for the service and related rights. After the last paid Kids plan expires, the prepared policy retains profiles and progress for 90 days, with a notice before deletion and at least 14 days after confirmed notice delivery. Automatic deletion begins only when the notice and deletion process has been enabled and verified. Never-paid free profiles are outside the paid-expiry timer and may be deleted on request.",
    },
    {
      title: "Contact and changes",
      body: "For questions or family rights, write to info@masaarat.ai from the parent's account email without sending documents or child details in the first message. If data use changes, we publish a new version and seek fresh consent when required; we do not silently rewrite an accepted notice.",
    },
  ],
  contact: "info@masaarat.ai",
  back: "Back to Masaarat Kids",
  link: "Children's privacy policy",
} as const;

export function getKidsPrivacyCopy(locale: SupportedLocale) {
  return locale === "en" ? en : ar;
}
