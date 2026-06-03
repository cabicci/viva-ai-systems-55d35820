import { TrendingDown, PlayCircle, Lightbulb, Scale, Rocket, BookOpen, RefreshCcw, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

export const BUSINESS_M5_REACTIVE_RELAPSE_BLOCKS: IntroLessonContent = [
  {
    icon: TrendingDown,
    eyebrow: "HERO",
    title: "الرجوع لـ Reactive Mode",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كنت Proactive أسبوعين. النهاردة بتفتح WhatsApp قبل أي حاجة.",
        "ده مش فشل — ده طبيعي. المهم تعرف العلامة وترجع بسرعة.",
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
        { term: "Reactive Mode", meaning: "إنك تفضل طول اليوم \"رد فعل\" لطلبات الناس والمشاكل اللي بتظهر.", example: "لما مديرك يكلمك يطلب تقرير فجأة، فتقوم تسيب اللي في إيدك وتجري تعمله، إنت كده شغال رد فعل بس." },
        { term: "Proactive Mode", meaning: "إنك تكون \"مبادر\" ومخطط ليومك من قبل ما يبدأ، مش مستني الأحداث تحركك.", example: "لما محاسب يحدد ساعة الصبح يراجع فيها العهدة قبل ما أي حد يكلمه، هو كده اللي سايق يومه." },
        { term: "زفة الرجوع لورا", meaning: "لما ترجع لعادة وحشة كنت بطلتها، أو ترجع للعشوائية بعد ما كنت اتظمت.", example: "لما كنت بطلت تفتح فيسبوك وقت الشغل، وفجأة رجعت تضيّع فيه ساعتين تاني." },
        { term: "Trigger (المُحفز)", meaning: "الزتونة اللي بتجرك اللي بتخليك تفقد تركيزك وترجع للـ Reactive mode.", example: "مكالمة من عميل بيشتكي، أو إيميل فيه مشكلة، ده اللي بيخليك تتوتر وترجع للعشوائية." },
        { term: "Deep Work (الشغل بتركيز)", meaning: "شغل بتركيز عالي جداً من غير أي تشتيت عشان تنجز حاجة صعبة ومهمة.", example: "مصمم بيقفل موبايله ساعتين الصبح عشان يخلص لوجو مهم، من غير ما يرد على واتساب أو إيميلات." },
        { term: "Audit (تقييم/مراجعة)", meaning: "مراجعة وفحص اللي عملته عشان تعرف إنت ماشي صح ولا محتاج تغير طريقتك.", example: "لما تاجر يقعد أخر الأسبوع يشوف إيه اللي عطله وإيه اللي أنجزه عشان يصلح غلطاته." },
        { term: "Reset Ritual (روتين الإفاقة)", meaning: "حركة أو روتين بسيط بتعمله عشان تفوق وترجع لتركيزك (الـ Proactive) تاني.", example: "إنك تقوم تغسل وشك أو تعمل قهوة وتفصل 5 دقايق عشان ترجع تركيزك للشغل المهم." },
        { term: "Analyst review (مراجعة تحليلية)", meaning: "إنك تراجع شغلك بـ \"عين تانية\" فاحصة عشان تطلع الغلطات وتحسن الأداء.", example: "زي لما تراجع شغلك كأنك مدير بيقيم الموظفين، عشان تطلع المشاكل وتصلحها بنفسك." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "علامات الرجوع للـ Reactive وإزاي تكسرها قبل ما تكبر." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "العلامات + الإصلاح",
    block: {
      kind: "numberedList",
      items: [
        "علامة 1 — بتفتح WhatsApp قبل بتبص على جدول يومك. → Reset: قفل التطبيق بعد المساء.",
        "علامة 2 — Deep Work بقى ساعة وأنت بتفتح الرسائل ٣ مرات. → Reset: حطّ التليفون في غرفة تانية ساعة.",
        "علامة 3 — مفيش قرار أسبوعي من Analyst review. → Reset: ارجع للـ ١٥ دقيقة الأحد بدون استثناء.",
        "علامة 4 — بتقول «الأسبوع ده استثناء» ٣ أسابيع متتالية. → Reset: الاستثناء بقى القاعدة — صلّح النظام اللي إنت ماشي عليه/السيستم، مش نفسك.",
      ],
    },
  },
  {
    icon: RefreshCcw,
    eyebrow: "شوف بنفسك",
    title: "دورة الانتكاسة + Reset",
    block: {
      kind: "diagram",
      id: "reactive-relapse-cycle",
      caption: "Trigger → Relapse → Notice → Reset · الانتكاسة بتاخد يوم مش شهر.",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "إنكار vs اعتراف سريع",
    block: {
      kind: "comparison",
      left: { label: "FAILURE — «أنا تمام»", body: "بتفضل تقنع نفسك إنك Proactive. بعد شهر تكتشف إن مفيش حاجة اتقدّمت." },
      right: { label: "RIGHT — «رجعت Reactive»", body: "بتلاحظ العلامة وبتعمل Reset في نفس اليوم. الانتكاسة بتاخد يوم، مش شهر." },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اكتب الـ Reset Ritual بتاعك",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "business-m5-l1-reactive-relapse-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "أحمد بقى له شهرين ماشي تمام على الروتين بتاعه، بيصحى بدري ويعمل أهم المهام. فجأة، بقى يفتح فيسبوك أول ما يصحى وقبل ما يبص على جدول يومه. ده بيعبر عن إيه بالظبط؟",
          options: [
            "ده عادي ومكملش أسبوعين proactive, يعني فشل وخلاص.",
            "دي علامة إنه رجع للـ Reactive Mode ولازم ياخد باله ويرجع.",
            "دي حاجة مؤقتة وبكرة هيرجع لوحده من غير أي تدخل."
          ],
          correctIndex: 1,
          explanation: "فتح السوشيال ميديا أول ما تصحى قبل التقويم علامة على الرجوع للـ Reactive Mode ولازم تكون دي نقطة تحول للرجوع."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "سارة كانت بتشتغل على مشروعها المهم (Deep Work) لمدة ساعتين متواصل كل يوم. الأسبوع ده، لقت نفسها بتبص في الموبايل بتاعها كل 20 دقيقة وكل شوية تفقد تركيزها. إيه التصرف الصح اللي المفروض تعمله سارة عشان ترجع Proactive بسرعة؟",
          options: [
            "ده معناه إنها محتاجة تاخد أجازة طويلة عشان ترتاح من الضغط.",
            "دي علامة واضحة ولازم تحط الموبايل في أوضة تانية لمدة ساعة عشان ترجع للتركيز.",
            "تتجاهل الموضوع وتكمل شغلها على أمل إن التركيز يرجع لوحده."
          ],
          correctIndex: 1,
          explanation: "فقدان التركيز أثناء الـ Deep Work ومراجعة الموبايل كل فترة قليلة علامة على الـ Reactive Mode، وحط الموبايل بعيد لمدة ساعة هو الـ Reset Ritual المناسب."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "عمر كان ملتزم بمراجعة القرارات الأسبوعية مع 'الـ Analyst' كل يوم حد لمدة 15 دقيقة، وده ساعده ياخد قرارات أحسن. تلات أسابيع ورا بعض ما عملش المراجعة دي. إيه أقوى طريقة لعمر عشان يرجع للـ Proactive Mode؟",
          options: [
            "يفكر في أسباب عدم عمل المراجعة ويحاول يحلها الأسبوع الجاي.",
            "ده طبيعي بسبب ضغط الشغل، وميستعجلش في الرجوع.",
            "يرجع يعمل الـ 15 دقيقة بتاعة لحد الجاي من غير أي استثناءات."
          ],
          correctIndex: 2,
          explanation: "عدم عمل المراجعة الأسبوعية علامة على الرجوع للـ Reactive Mode، والحل هو العودة لـ 15 دقيقة في ميعادها بدون استثناء كـ Reset Ritual."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "افحص هل رجعت Reactive من تاني",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "الانتكاسة الـ Reactive بتحصل بدون ما تحس. اعمل audit صريح لآخر أسبوع.",
      prompt:
        "في تسليمك اكتب:\n\n١) كام مرة كسرت Weekly Rhythm آخر أسبوع:\n٢) أسباب الكسر الحقيقية (مش الأعذار):\n٣) إيه اللي شعرت إنه \"عاجل\" بس مكنش فعلًا:\n٤) خطوة وقائية محدّدة (مين اللي يفلتر، إيه القناة اللي تقفل):\n٥) متى تعيد الـ audit ده (موعد):",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "صراحة",
          weight: 70,
          criteria: [
            "العدد والأسباب الحقيقية مذكورين.",
            "في تمييز واضح بين \"عاجل حقيقي\" و\"عاجل وهمي\".",
          ],
        },
        {
          label: "وقاية متكرّرة",
          weight: 30,
          criteria: [
            "في خطوة وقائية + موعد audit جاي.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "علامات تحذيرية بنراقبها في /system-state",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "علامات تحذيرية بنراقبها في /system-state",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Business — نفس اللي بتتعلمه. لو لقيت نفسك بتفتح /admin قبل /roadmap كل صباح، ده reactive relapse. عشان نتجنّبه، عندنا قاعدة: أول صفحة في اليوم = /roadmap. دايمًا. حتى لو في issue urgent.",
      bullets: [
        "Daily ritual موثّق في mem/.",
        "Roadmap_items بتسجّل لو reactive vs proactive.",
        "أكتر من 30% reactive = warning في الـ weekly review.",
      ],
      pathAngle: "business",
      link: { label: "افتح /roadmap", href: "/roadmap" },
    },
  }
];