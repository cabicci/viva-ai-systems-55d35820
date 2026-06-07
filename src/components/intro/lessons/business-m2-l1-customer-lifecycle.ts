import {
  Sparkles,
  AlertCircle,
  PlayCircle,
  Lightbulb,
  Scale,
  Rocket,
  BookOpen,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

/** Business · M2 · Lesson 01 — دورة حياة العميل (v3: Lesson Shape pilot) */
export const BUSINESS_M3_L1_CUSTOMER_LIFECYCLE_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ العميل مش صفقة واحدة — هو رحلة من أول ما يسمع عنك لحد ما يرشّحك. والـ AI يقدر يحسّن كل محطة.",
        "ليه دلوقتي؟ بنيت أساس التشغيل الداخلي (قرار، Reactive/Proactive، إيقاع أسبوعي). النهاردة نربط ده بالنمو والعملاء.",
        "هتعمل إيه بعد الدرس؟ هترسم رحلة عميل حقيقية عندك — وتحدّد أضعف محطة.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "بتصرف على إعلانات — والعملاء مش بيرجعوا",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كتير بيشوفوا العميل = «حد اشترى وخلاص». يجيبوا جداد بالإعلانات، بس نسبة الرجوع ضعيفة — والتكلفة تزيد كل شهر.",
        "المشكلة غالبًا مش «محتاج إعلانات أكتر». المشكلة في محطة ضعيفة في الرحلة: وعي، تفكير، شراء، احتفاظ، أو ترشيح.",
        "الـ AI يساعدك ترسم الرحلة، تكتب رسائل متابعة، وتلخّص ملاحظات العملاء — بس لازم تعرف فين التسريب.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "٥ محطات — وكل محطة فرصة",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Awareness (وعي): العميل عرف إنك موجود — إعلان، صديق، بحث.",
        "Consideration (تفكير): بيقارن — السعر، الثقة، المراجعات، سهولة الطلب.",
        "Purchase (شراء): أول صفقة فعلية — التجربة هنا تحدد هل يرجع.",
        "Retention (احتفاظ): يرجع تاني — متابعة، قيمة متكررة، عرض مناسب.",
        "Advocacy (ترشيح): يقول لغيره — ده أرخص من إعلان جديد.",
        "الـ AI يقدر يساعد في صياغة رسائل لكل محطة — بس التشخيص يبدأ من رسم الرحلة الحقيقية.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للرحلة",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Customer Journey (رحلة العميل)",
          meaning: "كل المحطات من أول سماع عنك لحد الترشيح — مش لحظة الشراء بس.",
          example: "بوست → استفسار → طلب → تجربة → رسالة متابعة → رجوع → ترشيح لصديق.",
        },
        {
          term: "Weakest Stage (أضعف محطة)",
          meaning: "المحطة اللي أكتر ناس بتقع عندها — تحسينها أغلبًا أرخص من جلب عملاء جداد.",
          example: "٦٠٪ يشتروا مرة وما يرجعوش — الضعف غالبًا في Retention مش Awareness.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — عميل كرحلة مش كصفقة",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "٥ محطات وإزاي الـ AI يساعد في كل واحدة. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "إعلانات أكتر vs إصلاح محطة ضعيفة",
    block: {
      kind: "comparison",
      left: {
        label: "تركّز على جلب جداد بس",
        body: "تزود الإعلانات. العملاء الجداد ييجوا — بس نفس النسبة ما بترجعش. التكلفة تطلع والربح يثبت.",
      },
      right: {
        label: "تصلّح أضعف محطة",
        body: "ترسم الرحلة، تكتشف إن المتابعة بعد الشراء ضعيفة. رسالة بسيطة + متابعة بالـ AI — نفس العملاء يرجعوا أكتر.",
      },
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "خريطة الـ ٥ محطات",
    tone: "primary",
    block: {
      kind: "diagram",
      id: "customer-lifecycle-funnel",
      label: "رحلة العميل",
      caption:
        "فكّرها قمع: كل محطة فيها ناس بتكمل وناس بتوقف. الهدف تعرف فين التسريب — مش تملى القمع من فوق بس.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "business-m2-l1-customer-lifecycle-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "بيزنس بيجيب ١٠٠ عميل جديد شهريًا — ١٥ بس بيرجعوا. أنسب تركيز أول؟",
          options: [
            "زيادة إعلانات عشان توصل ١٥٠ عميل جديد.",
            "تحسين محطة Retention — ليه اللي اشتروا ما بيرجعوش.",
            "تغيير Awareness بس — محتوى أكتر.",
          ],
          correctIndex: 1,
          explanation:
            "جلب عميل جديد غالبًا أغلى من إرجاع عميل موجود. لو الضعف في الرجوع، ابدأ بالاحتفاظ قبل ما تزود الإعلانات.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "ارسم رحلة عميل — وحدّد الضعف",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي تطبيق على بيزنسك — مش نظرية. ارسم رحلة عميل حقيقي (أو نوع عميلك النموذجي) عبر المحطات الخمس. بعدين حدّد أضعف محطة وليه.\n\nمش مطلوب حملة كاملة — مطلوب خريطة صادقة.",
      prompt:
        "في تسليمك اكتب:\n\n١) Awareness — إزاي بيعرفوا عنك دلوقتي:\n٢) Consideration — إيه اللي بيفكّروا فيه قبل ما يشتروا:\n٣) Purchase — إزاي بيشتروا فعلًا:\n٤) Retention — إيه اللي بيخلّيهم يرجعوا (أو ليه ما بيرجعوش):\n٥) Advocacy — هل بيرشّحوك؟ ليه أو ليه لأ:\n٦) أضعف محطة عندك — وليه:",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "١) Awareness: [اكتب هنا]\n٢) Consideration: [اكتب هنا]\n٣) Purchase: [اكتب هنا]\n٤) Retention: [اكتب هنا]\n٥) Advocacy: [اكتب هنا]\n\n٦) أضعف محطة:\n   [مثال: Retention — مفيش متابعة بعد الشراء]",
      rubric: [
        {
          label: "رحلة واقعية",
          weight: 60,
          criteria: ["المحطات الخمس مربوطة ببيزنسك — مش تعريفات عامة."],
        },
        {
          label: "تشخيص الضعف",
          weight: 40,
          criteria: ["في محطة ضعيفة محددة مع سبب منطقي."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت بداية النمو",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ العميل رحلة — والـ AI يساعد في كل محطة لما تعرف فين الضعف.",
        "تقدر تعمل إيه؟ ترسم رحلة حقيقية وتختار محطة واحدة للتحسين.",
        "اللي جاي: بناء عرض (Offer) ومسارات احتفاظ — على أساس الرحلة اللي رسمتها النهاردة.",
      ],
    },
  },
];
