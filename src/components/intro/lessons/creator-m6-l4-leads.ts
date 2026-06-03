import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
export const CREATOR_M5_LEADS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "Views بتعجبك. Leads بتعيّشك.",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "محتوى من غير Funnel = ترفيه مجاني للجمهور. ممكن تبقى مشهور وفقير في نفس الوقت — وده اللي بيحصل لـ ٩٠٪ من الصنّاع.",
        "الـ Funnel البسيط: فيديو يجذب ← Bio Link واضح ← Lead Magnet مجاني ← Email/WhatsApp ← عرض مدفوع.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "مصطلحات الدرس",
    title: "مصطلحات هتشوفها في الدرس",
    tone: "primary",
    block: {
      kind: "concepts",
      items: [
        { term: "Lead (لييد)", meaning: "الزبون المحتمل اللي مهتم بيك وساب بياناته أو جه سألك.", example: "الفيديو بتاعك شافه 100 واحد، 5 بس اللي دخلوا كلموك وسألوا عن السعر. الـ 5 دول هما اللييدز." },
        { term: "CTA (سي تي إيه)", meaning: "اختصار لـ Call to Action، يعني الطلب اللي بتطلبه من الناس تعمله.", example: "لما تنزل بوست وتقول في آخره \"اكتب كلمة مهتم في كومنت\"، الكلمة دي هي الـ CTA." },
        { term: "Conversion (تحويل)", meaning: "يعني الشخص اتحول من مجرد متفرج لزبون عمل اللي إنت عايزه.", example: "لو 100 واحد داسوا على اللينك، و10 بس اشتروا، يبقى نسبة التحويل بتاعتك 10%." },
        { term: "Funnel (القمع)", meaning: "مراحل البيع اللي بتمشي مع الزبون من أول ما يعرفك لحد ما يشتري.", example: "زي العروسة اللي بتلف على محلات الفساتين؛ الأول بتتفرج، بعدين بتسأل، وفي الآخر بتشتري." },
        { term: "Lead Magnet (المغناطيس)", meaning: "هدية مجانية بتديها للناس عشان يرضوا يدوك بياناتهم (إيميل أو رقم).", example: "زي كأنه بيحدف \"طعم\" للسمك؛ نزل فيديو فيه نصيحة وقولهم \"ابعتولي إيميلكم أبعتلكم كتاب كامل\"." },
        { term: "Nurture Sequence (تسخين)", meaning: "سلسلة رسايل أوتوماتيك بتبعتها للزبون عشان تسخن الشراء في دماغه.", example: "لو حد سجل عشان ياخد هدية، يجيله إيميل ترحيب، وبعده يومين نصيحة، وبعد أسبوع عرض حقيقي." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption: "إزاي تحوّل المتابع المهتم لـ Lead في صفحة واحدة.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Funnel ٤ خطوات بسيط",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "١. Bio Link واضح: لينك واحد في الـ Bio. صفحة بسيطة فيها CTA واحد: «احصل على [Lead Magnet] مجانًا».",
        "٢. Lead Magnet: حاجة مجانية ذات قيمة — Template, Checklist, Mini-course بـ ٥ فيديوهات، PDF فيه ١٠ Hooks جاهزين. الجمهور بيدّيك Email/WhatsApp مقابلها.",
        "٣. Nurture Sequence: ٣–٥ Emails أو WhatsApp messages بتديهم قيمة قبل أي عرض. القاعدة: ٨٠٪ قيمة + ٢٠٪ عرض.",
        "٤. العرض المدفوع: استشارة، كورس، أداة، خدمة. الـ CTA بيبقى طبيعي لإن الجمهور بقى يثق فيك.",
        "قاعدة ذهبية: من كل ١٠ فيديوهات، فيديو واحد بس فيه Soft CTA للـ Lead Magnet. الباقي قيمة خالصة.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "Funnel ٤ طبقات — من View لـ Customer",
    tone: "primary",
    block: {
      kind: "diagram",
      id: "leads-funnel",
      caption: "ده شكل الـ Funnel البسيط اللي بيحوّل المتفرّج لعميل. كل طبقة بتفقد جزء من الناس — طبيعي. لكن من غير الـ Funnel ده، الـ Views بتفضل ترفيه مجاني للجمهور. الفرق بين صانع محتوى مشهور وفقير، وصانع محتوى عنده دخل = الـ ٤ طبقات دي بالظبط.",
      label: "Lead Funnel — ٤ طبقات",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "إزاي تحوّل Views لـ Leads",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — «اشترك في الكورس بتاعي» في آخر كل فيديو",
        body: "الجمهور بيحس إنك بياع، الـ Trust بيختفي، والـ Engagement بيقع. وحتى لو حد اشترى، مفيش بيانات بتفضل معاك بعد ما المنصة تخسر صلاحيتها.",
      },
      right: {
        label: "RIGHT — «حمّل الـ Template مجاني من الرابط في الـ Bio»",
        body: "بتدّي قيمة الأول، بتاخد Email، بتبني علاقة، وبعدين بتعرض المدفوع. الـ Conversion بيبقى أعلى ٥–١٠ أضعاف.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "صمّم Funnel الـ Leads بتاعك",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m5-leads-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو مصوّر فوتوغرافي بيقدم محتوى عن نصايح التصوير على إنستاجرام، وعدد متابعينه كبير بس مبيعاته ضعيفة. إيه أول خطوة عملية يعملها عشان يحوّل الـ Views دي لـ Leads بفاعلية؟",
          options: [
            "يغيّر محتواه ويركز على عروض الأسعار مباشرة",
            "يحط Bio Link واضح يودي على صفحة فيها Lead Magnet زي دليل مجاني لأساسيات التصوير",
            "يعمل لايف كل يوم ويطلب من المتفرجين يكلموه برايفت"
          ],
          correctIndex: 1,
          explanation: "الـ Bio Link الواضح اللي بيودي على Lead Magnet هو أول خطوة في الـ Funnel البسيط عشان يجمع Leads، زي ما الدرس قال."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "صانع محتوى بيقدم كورسات لتعلم الجرافيك ديزاين اكتشف إن معظم اللي بيشوفوا فيديوهاته بيخرجوا من غير ما يعملوا أي حاجة. عشان يتجنب يكون ترفيه مجاني، إيه أنسب Lead Magnet ممكن يقدمه للمهتمين؟",
          options: [
            "يقدّم سيت من الأدوات المدفوعة مجانًا",
            "يقدّم تمبليتات جاهزة أو ملف PDF فيه أهم اختصارات برامج الجرافيك في مقابل الإيميل",
            "يعمل سحب على كورس من كورساته المدفوعة"
          ],
          correctIndex: 1,
          explanation: "الـ Lead Magnet هو هدية مجانية (PDF أو تمبليت) بتتاخد مقابل الإيميل عشان يحول المتفرج لـ Lead، زي ما الدرس وضح."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "أستاذة بتدي دروس خصوصية وعاملة فيديوهات شرح على يوتيوب. عشان ماتبقاش مشهورة وفقيرة، إيه أفضل طريقة عشان تجمع بيانات الطلاب المهتمين وتعتبرهم Leads؟",
          options: [
            "تطلب منهم يكتبوا أرقام تليفوناتهم في التعليقات",
            "تستخدم أداة زي Linktree في الـ Bio Link بتاعها وتدخل فيها لينك لـ Email/WhatsApp عشان تتواصل معاهم",
            "تعمل مجموعة فيسبوك وتطلب منهم ينضموا ليها بس"
          ],
          correctIndex: 1,
          explanation: "جمع الـ Leads بيتم عن طريق الإيميل أو الواتساب بعد ما المتفرج ياخد الـ Lead Magnet، والـ Linktree أداة تجمع كل لينكاتها في صفحة واحدة."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "ارسم Funnel ٤ طبقات بأرقامك أنت",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "هتحوّل الـ Funnel من نظرية لأرقام بتاعتك. حتى لو الأرقام تقديرية، الـ Funnel لازم يبقى بأرقام.",
      prompt:
        "في تسليمك اكتب الـ ٤ طبقات بأرقام آخر شهر (تقديرية لو محتاج):\n\n١) Views — إجمالي مشاهدات المحتوى:\n٢) Followers / Subscribers جداد:\n٣) Leads — حد دخل قائمتك (إيميل/واتس/فورم):\n٤) Customers — حد دفع/حجز:\n\nبعد الأرقام:\n٥) Conversion من Views لـ Followers — كام %؟\n٦) Conversion من Followers لـ Leads — كام %؟\n٧) أنهي طبقة فيها أكبر تسرّب؟ وايه أول تعديل هتجرّبه؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "الـ ٤ طبقات بأرقام",
          weight: 60,
          criteria: [
            "الـ ٤ أرقام موجودة (مش «مش متاح»).",
            "الـ Conversion محسوب فعلاً %، مش وصف عام.",
          ],
        },
        {
          label: "تحديد التسرّب + التعديل",
          weight: 40,
          criteria: [
            "حدّدت طبقة واحدة بالاسم فيها أكبر تسرّب.",
            "التعديل ملموس (CTA / Lead Magnet / Landing)، مش «أحسّن الـ Funnel».",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "Signup flow في /signup — بسيط بقصد",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "Signup flow في /signup — بسيط بقصد",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Creator — نفس اللي بتتعلمه. صفحة signup فيها ٣ حقول بس: email + password + اسم. مفيش 'phone number' ولا 'company size'. كل حقل زيادة = ٢٠٪ من الناس بتسيب. اخترنا الأقل عشان نخلّيك تدخل.",
      bullets: [
        "Email + Password + Name = الحقول الثلاث بس.",
        "Google OAuth كـ alternative للمستخدمين السرعة.",
        "بعد signup مباشرة → /onboarding بـ 4 خطوات قصيرة.",
      ],
      pathAngle: "creator",
      link: { label: "افتح /signup", href: "/signup" },
    },
  }
];
