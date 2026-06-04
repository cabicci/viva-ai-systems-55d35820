import {
  Flag,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import automatorM6ClosingLoopScreenshot from "@/assets/lessons/unique/automator-m7-l1-closing-loop.jpg";
/**
 * Automator · M6 · Lesson 01 — Closing the Loop
 */
export const AUTOMATOR_M7_L1_CLOSING_LOOP_BLOCKS: IntroLessonContent = [
  {
    icon: Flag,
    eyebrow: "HERO",
    title: "بياناتك جاهزة — اللي جاي",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "مش هتوقف هنا.",
        "البيانات اللي جمعتها = كنز.",
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
        { term: "Metrics", meaning: "المقاييس أو الأرقام اللي بتعرفك إنت ناجح ولا لأ.", example: "زي التاجر اللي بيشوف \"عدد الفواتير\" أو \"إجمالي المبيعات\" عشان يقيم حاله." },
        { term: "Lead Capture", meaning: "خطف أو سحب بيانات العملاء المهتمين عشان نكلمهم بعدين.", example: "صاحب محل بيسجل رقم الموبايل أو بيانات الزبون اللي مهتم بالبضاعة." },
        { term: "Audit", meaning: "مراجعة دقيقة لكل اللي حصل عشان نتأكد إنه مظبوط.", example: "المحاسب اللي بيراجع الدفاتر عشان يتأكد إن كل قرش متسجل صح." },
        { term: "Bottlenecks", meaning: "خنقة أو حتة سد في الشغل بتعطل كل اللي وراها.", example: "لما يكون عندك مكنة واحدة بتغلف وموقفة وراها عشر مكنات إنتاج." },
        { term: "Feedback Loop", meaning: "دائرة تغذية بياخد فيها نتائج شغله عشان يحسن المرة الجاية.", example: "لو مندوب مبيعات عرف إن طريق معين زحمة، فيغيره المرة الجاية." },
        { term: "Data Pipeline", meaning: "سير أو مسار البيانات من ساعة ما تتجمع لحد التحليل.", example: "بيانات المبيعات بتتحرك من الفاتورة لحد ما تظهر في شاشة المدير." },
        { term: "Analytics", meaning: "فحص البيانات عشان تفهم إيه اللي حصل وتعرف تقرر.", example: "مسوق بيحلل ليه الناس بطلت تشتري عشان يغير خطته." },
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
      caption: "ملخّص رحلة Automator وإزاي البيانات دي بتدخلك Analyst.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "إنت مش بس 'بتوصل tools' — إنت بتبني System",
    block: {
      kind: "numberedList",
      items: [
        "Creator جاب Views → Lead Capture خزّنهم → CRM حافظهم → Follow-up نقلهم → WhatsApp Flow ساعدهم.",
        "كل step في الـ flow بيسجّل data: وقت، channel، response، conversion.",
        "الـ data دي تقدر تسألها: إيه الـ channel الأحسن؟ إيه وقت الـ follow-up المثالي؟ إيه الـ message اللي فتحت أكتر؟",
        "الإجابات = قرارات أفضل = نظام بيتحسّن لوحده.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "رحلتك في المنصة",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: automatorM6ClosingLoopScreenshot,
      alt: "سكرين شوت من المنصة",
      caption:
        "الـ journey ده عبارة عن feedback loop بالظبط: كل خطوة بتتسجّل، وبناءً عليها بتفتح خطوات جديدة. نفس الـ pattern: Creator → Automator → Analyst → Business. كل مسار بيدخّل اللي جاي.",
      label: "من المنصة — صفحة /dashboard",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "Automation بدون data vs Automation بـ data",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — بتبني وتنسى",
        body: "بتشغّل 10 scenarios وتنسى تراجعهم. ماتعرفش إيه بيشتغل وإيه مش بيشتغل. الـ bills بتيجي وتدفع من غير ما تعرف إيه القيمة اللي رجعت.",
      },
      right: {
        label: "RIGHT — كل automation = مصدر بيانات",
        body: "كل scenario بيسجّل success/failure/response time. بتعمل review أسبوعي: إيه اللي بيعطل؟ إيه اللي بياكل tasks كتير؟ إيه اللي بيجيب results؟ بتطفى الوحش وتحسّن الحلو.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "جاهّز لـ Analyst",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m7-l1-closing-loop-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "أنت مسوّق لمنتج جديد، وعملت حملة إعلانات على فيسبوك، انستجرام، وتويتر. بعد ما جمعت البيانات من الـ Lead Capture والـ CRM، إيه السؤال اللي ممكن تسأله عشان تفهم إيه أحسن قناة جابتلك عملاء جدد؟",
          options: [
            "إيه القناة اللي جابت أكتر عدد Leads وبأقل تكلفة اكتساب للعميل (CAC)؟",
            "كام واحد عمل Share للبوست بتاعنا على كل قناة؟",
            "إيه أكتر وقت الناس كانت فاتحة فيه الموبايل؟"
          ],
          correctIndex: 0,
          explanation: "السؤال ده بيساعدك تحدد الـ channel الأفضل اللي جابت leads كتير بتكلفة قليلة، وده قرار هيحسّن 'نظام بيتحسّن لوحده' عشان توصل لـ 'قرارات أفضل'."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "بعد ما عملت حملة تسويقية وعمليات متابعة (Follow-up) كتيرة، وعشان تحسّن عملية تحويل العملاء Potential لعملاء فعليين، إيه السؤال اللي ممكن تسأله عشان تفهم مدى كفاءة الـ Follow-up بتاعك؟",
          options: [
            "كام إيميل بعتناه للعميل الواحد في المتوسط؟",
            "إيه متوسط الوقت من أول تواصل (first contact) لحد ما العميل يشتري (conversion)؟",
            "مين الموظف اللي عمل أكتر مكالمات Follow-up؟"
          ],
          correctIndex: 1,
          explanation: "فهم متوسط الوقت ده بيساعدك تشوف لو في bottlenecks أو لو نظام الـ Follow-up بتاعك بطيء، وده بيوجهك 'لتحسين أداء' الـ Feedback Loop بتاعك عشان 'تتحوّل لقرار'."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "عندك قوالب رسائل (Message Templates) مختلفة بتستخدمها في الـ WhatsApp Flow عشان تتواصل مع العملاء. إيه السؤال اللي هتسأله للبيانات اللي جمعتها عشان تعرف إيه الرسالة اللي بتجيب أحسن تفاعل؟",
          options: [
            "كام رسالة اتبعتت لكل عميل؟",
            "إيه قالب الرسالة اللي اتقرا واتفاعل معاه أكتر عدد من العملاء؟",
            "اسم الموظف اللي بعت أكتر رسائل واتساب؟"
          ],
          correctIndex: 1,
          explanation: "السؤال ده بيحدد إنهي Message Template كانت فعّالة أكتر في تحفيز الاستجابة، وده بيوجهك 'لتحسين أداء' الـ flow عن طريق 'البيانات اللي جمعتها' لتوصل لـ 'قرارات أفضل'."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "اعمل Audit + خطة تحسين لـ Workflow شغّال",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "Workflow بيشتغل ≠ workflow كويس. هتاخد automation حقيقية (لو ماعندكش، خد مثال) وتعمل audit + تحدّد ٣ تحسينات.",
      prompt:
        "في تسليمك:\n\n١) Workflow في ٣-٤ سطور (ايه بيعمل + من إمتى):\n٢) Metrics دلوقتي:\n   - عدد التشغيلات/أسبوع:\n   - معدل النجاح %:\n   - متوسط الوقت لكل run:\n   - عدد الـ errors آخر شهر:\n٣) ٣ تحسينات بأولوية:\n   - تحسين ١ (impact + effort):\n   - تحسين ٢:\n   - تحسين ٣:\n٤) أنهي هتعمله الأول ولِيه؟\n٥) ايه الـ metric اللي هيقولك التحسين شغّال بعد أسبوع؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "Metrics فعلية",
          weight: 60,
          criteria: [
            "أرقام حقيقية مش تقديرات «حوالي».",
            "الـ ٣ تحسينات معاهم impact وeffort.",
          ],
        },
        {
          label: "Priority + Measurement",
          weight: 40,
          criteria: [
            "الاختيار مبني على impact/effort مش حدس.",
            "الـ measurement metric قابل للقياس برقم بعد أسبوع.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "كل البيانات بتغذّي Analyst — closing the loop",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "كل البيانات بتغذّي Analyst — closing the loop",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Automator — نفس اللي بتتعلمه. learner_events + lesson_progress + mission_submissions = source data لـ Analyst. الـ Automation اللي بناها Builder + شغّلها Automator، بتنتج البيانات اللي Analyst هيقرأها. ده الـ ecosystem كامل.",
      bullets: [
        "Automator يولّد data → Analyst يقرأها → Business ياخد قرار.",
        "ما حدش بيشتغل في فراغ — كله connected.",
        "افتح /system-state تشوف الـ pipeline حيًّا.",
      ],
      pathAngle: "automator",
      link: { label: "افتح /system-state", href: "/system-state" },
    },
  }
];
