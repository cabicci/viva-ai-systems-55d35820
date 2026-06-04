import { Repeat, PlayCircle, Lightbulb, Scale, Rocket, BookOpen, MessageSquare, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

export const BUSINESS_M3_L2_RETENTION_FLOW_BLOCKS: IntroLessonContent = [
  {
    icon: Repeat,
    eyebrow: "HERO",
    title: "Follow-up Flow",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "٣ أيام → أسبوعين → شهر.",
        "٣ رسائل بس بتعمل فرق بين «اختفى» و «رجع».",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "مصطلحات الدرس",
    title: "اللي هتسمعه في الدرس ده",
    block: {
      kind: "concepts",
      items: [
        { term: "Trigger", meaning: "زي \"زناد\" أو فعل معين بيخلي السيستم يتحرك ويبدأ خطوات لوحده.", example: "لو العميل بيفتح رسالة الواتساب، فـ ده \"زناد\" بيخلي السيستم يبعت له عرض خصم أوتوماتيك." },
        { term: "Channel (قناة)", meaning: "الطريقة أو الوسيلة اللي بتتواصل بيها مع العميل.", example: "رسالة واتساب، إيميل، أو مكالمة تليفون.. أي سكة بتوصلك بالعميل بتاعك." },
        { term: "NPS (Net Promoter Score)", meaning: "مقياس من ١ لـ ١٠ بيعرفك العميل راضي عنك وهيرشحك لغيره ولا لا.", example: "صاحب محل لبس بيجمع آراء الناس، اللي يدي ٩ أو ١٠ ده زبون طياري بيحبك." },
        { term: "LTV (Lifetime Value)", meaning: "إجمالي الفلوس اللي العميل بيدفعها في مشروعك طول فترة تعامله معاك.", example: "لو زبون بيشتري منك قهوة كل شهر بـ ١٠٠ جنيه لمدّة سنة، يبقى هو قيمته ١٢٠٠ جنيه." },
        { term: "Touchpoint", meaning: "أي مرة بتحتك فيها بالعميل أو بتظهر قدامه بعد ما يشتري.", example: "لو بعت لعميل اشترى موبيبلية \"ملمع خشب\" بعد أسبوع، دي كدة لمسة تواصل بتفكروا بيك." },
        { term: "Automator M5", meaning: "الأداة أو \"الروبوت\" اللي بينفذ الخطوات بدالك ومن غير تعب.", example: "بتظبط المحل بتاعك يبعت رسايل عيد ميلاد لكل العملاء أوتوماتيك من غير ما تتدخل." },
        { term: "Upsell", meaning: "إنك تبيع للعميل اللي معاك \"حاجة أغلى\" أو فئة أعلى من اللي خدها.", example: "بايع لواحد \"لاب توب\" وبعدها أقنعته يشتري \"شاشة\" أغلى وإمكانيات أعلى." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "Flow بسيط بـ ٣ رسائل بتضاعف العملاء اللي بيرجعوا." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "الـ ٣ رسائل",
    block: {
      kind: "numberedList",
      items: [
        "بعد ٣ أيام — «هل وصلك اللي اتفقنا عليه؟» (تأكيد + فرصة للشكوى قبل ما تكبر).",
        "بعد أسبوعين — «إيه رأيك دلوقتي؟ في أي ملاحظة؟» (feedback + تذكير بوجودك).",
        "بعد شهر — رسالة Upsell أو منتج مكمّل.",
        "كل ده يتعمل في Automator M5 Follow-up — تلقائي.",
      ],
    },
  },
  {
    icon: MessageSquare,
    eyebrow: "شوف بنفسك",
    title: "Cadence: ٣ → ١٤ → ٣٠ يوم",
    block: {
      kind: "diagram",
      id: "followup-cadence",
      caption: "بدون متابعة LTV = 250ج · مع ٣ touchpoints LTV = 800ج.",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "بعد البيع = صمت vs نظام",
    block: {
      kind: "comparison",
      left: { label: "FAILURE — مفيش متابعة", body: "العميل راضي بس نسي. بعد ٦ شهور بيشتري من حد تاني." },
      right: { label: "RIGHT — ٣ touchpoints", body: "العميل بيحس إنك مهتم. الـ Upsell بيحصل تلقائي. الـ LTV بيتضاعف." },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اكتب نصوص الـ ٣ رسائل",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "business-m3-l2-retention-flow-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "إنت صاحب محل بيع أجهزة إلكترونية، وواحد اشترى منك موبايل جديد. عشان تضمن إنه مبسوط وتتجنب أي مشاكل، إيه أنسب حاجة تبعتهاله بعد 3 أيام من الشراء؟",
          options: [
            "«إيه رأيك في الموبايل الجديد بعد 3 أيام استخدام؟ كله تمام؟»",
            "«عايز تشتري سماعة بلوتوث مع الموبايل الجديد؟ عندنا عروض تحفة!»",
            "«الموبايل وصلك ولا لسه؟ في أي مشكلة في استلام الأوردر؟»"
          ],
          correctIndex: 0,
          explanation: "السؤال ده بيستخدم الـTouchpoint الأول بعد 3 أيام، وده بيكون للتأكد إن كل حاجة تمام وإنه لو فيه شكوى بسيطة تتلحق قبل ما تكبر، مش عشان بيع أو متابعة توصيل."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "بعد أسبوعين من بيع كاميرا احترافية لعميل، وعايز تستغل الـTouchpoint ده عشان تفهم إيه اللي ممكن تحسّن بيه خدماتك. إيه أفضل رسالة تبعتها؟",
          options: [
            "«ياريت لو تشاركنا رأيك في الكاميرا، وإذا كانت عجبتك قولنا إيه أكتر حاجة حبيتها فيها؟»",
            "«متنساش إن عندنا ورش عمل لتصوير فوتوغرافي، تحب تعرف التفاصيل؟»",
            "«لسه الكاميرا شغالة كويس ولا حصل فيها أي أعطال؟»"
          ],
          correctIndex: 0,
          explanation: "الرسالة دي بتطلب Feedback من العميل بعد فترة كافية للاستخدام، وده مهم للتحسين وبيذكّر العميل بوجودك وإهتمامك بيه، بخلاف بيع منتج جديد أو مجرد سؤال عن الأعطال."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "بعت جهاز رياضي لعميل من شهر فات، ودلوقتي عايز تعمل Upsell بشكل لطيف. إيه الرسالة اللي ممكن تبعتها عشان تحقق ده؟",
          options: [
            "«بما إنك بقالك شهر بتتمرن على الجهاز الجديد، إيه رأيك نضيفله مجموعة أثقال أو ملابس رياضية مكملة؟»",
            "«نتمنى إنك تكون استمتعت بالجهاز الرياضي، لو احتجت أي صيانة احنا موجودين.»",
            "«مبسوطين إنك من عملاءنا، ياريت لو تشوف منتجاتنا الجديدة على الموقع وتدينا رأيك.»"
          ],
          correctIndex: 0,
          explanation: "الرسالة دي بتستغل الـCadence بتاع الشهر عشان تعمل Upsell لمنتجات مكملة بناءً على اللي العميل اشتراه بالفعل، وده طريقة مباشرة ولطيفة لزيادة المبيعات من عميل موجود."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صمّم Retention Flow من ٣ خطوات",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "الـ Acquisition بيكلّف ٥-٧ مرات أكتر من الـ Retention. اعمل flow بسيط بيحافظ على عميل موجود.",
      prompt:
        "في تسليمك اكتب:\n\n١) الـ Trigger اللي يبدأ الـ flow (شراء/اشتراك/أول استخدام/علامة خمول):\n٢) الخطوة الأولى (Touchpoint + التوقيت + المحتوى):\n٣) الخطوة التانية (Touchpoint + التوقيت + المحتوى):\n٤) الخطوة التالتة (Touchpoint + التوقيت + المحتوى):\n٥) المؤشّر اللي هيقولك إن الـ Flow شغّال (Retention rate/Repeat/الـ NPS):",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "flow عملي",
          weight: 70,
          criteria: [
            "الـ Trigger واضح والـ ٣ خطوات لكل واحدة توقيت + قناة.",
            "المحتوى محدّد مش \"نبعتله شيء لطيف\".",
          ],
        },
        {
          label: "قياس",
          weight: 30,
          criteria: [
            "في مؤشّر محدّد لقياس الـ flow.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "Streak system + spaced repetition = retention strategy",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "Streak system + spaced repetition = retention strategy",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Business — نفس اللي بتتعلمه. بدل ما نبعت rappel emails، عملنا الـ retention جوّه المنتج: streak في الـ dashboard + reviews due notifications. المتعلم بيرجع لأنه عاوز يحافظ على streak، مش لأن email وصلّه.",
      bullets: [
        "user_streaks جدول بيتابع current + longest.",
        "Streak break detection يومي.",
        "Reviews due بناءً على SM-2 spaced repetition.",
      ],
      pathAngle: "business",
      link: { label: "افتح /dashboard", href: "/dashboard" },
    },
  }
];