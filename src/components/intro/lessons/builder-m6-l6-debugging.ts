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
import debuggingScreenshot from "@/assets/lessons/unique/builder-m6-l6-debugging.jpg";

/** Builder · M6 · Lesson 06 — Debugging (v3: Lesson Shape pilot · optional depth) */
export const BUILDER_M6_DEBUGGING_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ لما التطبيق يغلط: صفّي العرض (Symptom) → اعزل السبب (آخر تعديل) → بعدين اطلب الإصلاح.",
        "ليه دلوقتي؟ أي تطبيق بيغلط — ده طبيعي. الفرق إنك عندك playbook بسيط من غير ما تعرف برمجة.",
        "هتعمل إيه بعد الدرس؟ هتكتب تقرير bug فيه: الصفحة، المتوقع، الفعلي، وآخر تعديل.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "«التطبيق بايظ» — ومش عارف تبدأ منين",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بتضغط Send والشاشة بتلف ومفيش رد. أول رد فعل: «التطبيق بايظ» — بس الكلام ده مش بيساعد حد يصلّح.",
        "أكبر شركات العالم تطبيقاتها بتغلط كل يوم. الفرق: عندهم طريقة واضحة يتبعوها.",
        "مش مطلوب منك تفهم stack trace — مطلوب منك توصف اللي بيحصل في جملة واحدة واضحة.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "اعرض العرض → اعزل السبب → اطلب الإصلاح",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الخطوة ١ — Symptom: «لما العميل يدوس Send في صفحة الشات، الشاشة بتلف ومفيش رد.»",
        "الخطوة ٢ — Isolate: «إيه آخر حاجة غيّرتها قبل ما الدنيا تبوظ؟» في ٩٠٪ من المرات الغلطة من آخر تعديل.",
        "الخطوة ٣ — Fix: ابعت الـ ٣ معلومات لمساعد Lovable — اللي بيحصل، اللي المفروض يحصل، وآخر تعديل.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "وصف عام vs وصف يصلّح في ثواني",
    block: {
      kind: "comparison",
      left: {
        label: "غلط — «التطبيق بايظ»",
        body: "هيرد بـ ١٠ اقتراحات عامة وانت هتلف حوالين نفسك. مفيش حد يقدر يساعد على وصف ناقص.",
      },
      right: {
        label: "صح — ٣ معلومات بالظبط",
        body: "«لما أدوس Send الشاشة بتلف (فعلي). المفروض الـ AI يرد (متوقع). آخر تعديل: ضفت زرار جديد (سبب محتمل).» في ثواني هيعرف المشكلة فين.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للتشخيص",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Symptom (العرض)",
          meaning: "إيه اللي بيحصل بالظبط — مش «بايظ»، لكن سيناريو محدد.",
          example: "«لما أدوس Send، الشاشة بتلف من غير رد.»",
        },
        {
          term: "Expected vs Actual (متوقع vs فعلي)",
          meaning: "إيه اللي كان المفروض يحصل — وإيه اللي حصل فعلًا.",
          example: "متوقع: الـ AI يرد. فعلي: الشاشة بتلف.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — Playbook لما الدنيا تبوظ",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "٣ خطوات بسيطة لما التطبيق يغلط — من غير خوف ومن غير برمجة. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "٣ خطوات — وانت قاعد",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: debuggingScreenshot,
      alt: "رسمة توضّح 3 خطوات debugging: صفّي العرض، اعزل السبب، اطلب الإصلاح",
      caption:
        "مش محتاج تفهم كود — محتاج توصف. صفّي العرض في جملة → ارجع لآخر تعديل → ابعت الـ ٣ معلومات.",
      label: "Playbook الـ Debugging",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m6-l6-debugging-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "العميل بيدوس Send والشاشة بتلف. إيه أول خطوة قبل ما تطلب من Lovable يصلّح؟",
          options: [
            "أوصف السيناريو بالظبط: «لما يدوس Send في صفحة الشات، الشاشة بتلف ومفيش رد.»",
            "أعمل refresh للصفحة كذا مرة.",
            "أقول «التطبيق بايظ، صلّحه بمعرفتك.»",
          ],
          correctIndex: 0,
          explanation:
            "Symptom الأول — لما توصف السيناريو بالظبط، بتعرف تدور على السبب وتسأل بشكل يفهمك.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "اكتب تقرير bug لتطبيقك",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "تخيّل إن تطبيقك باز — أي حاجة. اكتب تقرير bug جاهز تبعته لمساعد Lovable.\n\n١٠ دقايق كفاية.",
      prompt:
        "في تسليمك اكتب:\n\n١) الصفحة (Route):\n   - أنهي صفحة فيها المشكلة؟\n\n٢) المتوقع (Expected):\n   - إيه اللي كان المفروض يحصل؟\n\n٣) الفعلي (Actual):\n   - إيه اللي بيحصل فعلًا؟ (سيناريو محدد)\n\n٤) آخر تعديل (Last change):\n   - إيه آخر حاجة غيّرتها قبل ما الدنيا تبوظ؟",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "الصفحة:\n[/... أو اسم الصفحة]\n\nالمتوقع:\n[إيه اللي كان المفروض يحصل]\n\nالفعلي:\n[لما [...] بيحصل [...]]\n\nآخر تعديل:\n[إيه آخر حاجة غيّرتها]",
      rubric: [
        {
          label: "تقرير bug كامل",
          weight: 70,
          criteria: [
            "فيه صفحة + متوقع + فعلي + آخر تعديل.",
            "الوصف الفعلي سيناريو محدد — مش «بايظ».",
          ],
        },
        {
          label: "بساطة اللغة",
          weight: 30,
          criteria: [
            "كل سطر بكلمات بسيطة — من غير مصطلحات تقنية معقّدة.",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت الـ Playbook",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ أي تطبيق بيغلط — والحل يبدأ بعرض واضح وعزل السبب، مش بالذعر.",
        "تقدر تعمل إيه؟ عندك تقرير bug جاهز — ٣ معلومات تخلّي أي مساعد يفهمك في ثواني.",
        "اللي جاي: Tables & Columns — إزاي تنظّم بيانات التطبيق في جداول وأعمدة بنوعها الصح.",
      ],
    },
  },
];
