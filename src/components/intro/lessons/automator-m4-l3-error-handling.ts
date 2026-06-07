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
import automatorM3ErrorHandlingScreenshot from "@/assets/lessons/unique/automator-m4-l3-error-handling.jpg";

/** Automator · M4 · L3 — Error Handling (v3: Lesson Shape pilot) */
export const AUTOMATOR_M4_L3_ERROR_HANDLING_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ الأتمتة بتفشل — السؤال مش «لو»، السؤال «إزاي هتعرف قبل ما العميل يتأذى».",
        "ليه دلوقتي؟ بعد Webhooks وDB، الـ workflow شغّال ٢٤/٧ — ومن غير تنبيه، الفشل بيحصل صامت.",
        "هتعمل إيه بعد الدرس؟ هتكتب قاعدة تنبيه واحدة: لو [فشل] → [مين يتبلّغ + إزاي].",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "«٢٠٠ عميل ملقوش رد» — ومحدش عرف",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الـ API بتاع الرسائل فشل من أسبوع. الأوتوميشن وقف صامت — مفيش إيميل، مفيش واتساب، مفيش تنبيه.",
        "العملاء فكروا إنكم تجاهلتوهم. اكتشفت المشكلة لما عميل كبير اتصل بنفسه.",
        "العامل الافتراضي محتاج قاعدة: لو الخطوة دي فشلت → حد يتبلّغ فورًا — قبل ما العميل يحس.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "فشل متوقّع + تنبيه قبل الألم",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Retry: جرّب تاني — كتير من الأخطاء مؤقتة (شبكة، timeout). ٢–٣ محاولات كفاية.",
        "لو فشل بعد الـ retries: سجّل الخطأ + بلّغ حد — مش تسكت.",
        "قاعدة تنبيه واحدة تغيّر كل حاجة: لو [الخطوة X فشلت] → [واتساب/إيميل لـ Y].",
        "الهدف: تعرف في دقايق — مش بعد أسبوع.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "فشل صامت vs إشارة فورية",
    block: {
      kind: "comparison",
      left: {
        label: "فشل صامت",
        body: "API وقف — الـ workflow سكت. ٢٠٠ عميل من غير رد. اكتشفت بعد ٧ أيام.",
      },
      right: {
        label: "تنبيه فوري",
        body: "Retry ٣ مرات → فشل → واتساب ليك + السجل في جدول failed. تعرف في ٥ دقايق.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للفشل",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Retry (إعادة محاولة)",
          meaning: "الأوتوميشن يحاول تاني أوتوماتيك لما خطوة تفشل.",
          example: "إرسال إيميل فشل → جرّب ٣ مرات بفاصل ١ دقيقة.",
        },
        {
          term: "Alert (تنبيه)",
          meaning: "إشعار لحد يقدر يتصرف — بعد ما الـ retries تخلص.",
          example: "واتساب: «فشل إرسال ١٥ رسالة — راجع جدول failed».",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — من كارثة لتنبيه",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي تحوّل الفشل لإشارة — retry، تسجيل، وتنبيه قبل ما العميل يتأذى. لو معندكش وقت، كمل قراية.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "طبقات الحماية",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: automatorM3ErrorHandlingScreenshot,
      alt: "مثال على طبقات تشغيل مع معالجة أخطاء",
      caption:
        "كل طبقة في الشغل المتكرر محتاجة خطة بديلة: لو فشلت → إيه البديل؟ مش «نوقف وننسى».",
      label: "Error handling — مش اختياري",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m4-l3-error-handling-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "API الرسائل بيرجع خطأ ٥٠٠ لثواني — وبعدين بيشتغل. إيه أحسن تعامل؟",
          options: [
            "Retry ٣ مرات — ولو فشل، تنبيه + تسجيل في جدول failed.",
            "نسكت — غالبًا هيرجع لوحده.",
            "نوقف الـ workflow كلياً لحد ما نراجع يدوي.",
          ],
          correctIndex: 0,
          explanation:
            "أخطاء مؤقتة = retry. لو فشل بعد المحاولات = تنبيه قبل ما العميل يتأذى.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "اكتب قاعدة تنبيه واحدة",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي تصميم — مش بناء إلزامي. اختار workflow عندك واكتب قاعدة تنبيه واحدة للفشل الأهم.\n\nممكن الـ AI يقترح صياغة — إنت تختار النهائي.",
      prompt:
        "في تسليمك اكتب:\n\n١) الـ Workflow (سطر):\n٢) أنهي خطوة ممكن تفشل (الأهم):\n٣) ليه ممكن تفشل (سبب واحد):\n٤) قاعدة التنبيه:\n   - لو [إيه يحصل] →\n   - مين يتبلّغ:\n   - إزاي (واتساب / إيميل / Slack):\n   - إيه اللي يتسجّل:\n٥) Retry: كام مرة؟ وبعدين إيه؟",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "Workflow:\n[الشغل المتكرر — مثال: إرسال رسائل ترحيب بعد التسجيل]\n\nالخطوة اللي ممكن تفشل:\n[مثال: إرسال واتساب]\n\nسبب الفشل:\n[مثال: API واتساب down أو rate limit]\n\nقاعدة التنبيه:\nلو [فشل إرسال بعد ٣ retries] →\nمين: [أنت / مدير العمليات]\nإزاي: [واتساب على رقم X]\nيسجّل: [اسم العميل + الخطأ + الوقت في جدول failed]\n\nRetry:\n[٣ مرات — فاصل ١ دقيقة — بعدها تنبيه]",
      rubric: [
        {
          label: "خطوة وسبب",
          weight: 40,
          criteria: [
            "خطوة فشل محدّدة — مش «أي حاجة».",
            "سبب واقعي واحد على الأقل.",
          ],
        },
        {
          label: "قاعدة تنبيه",
          weight: 60,
          criteria: [
            "مين + إزاي + إيه يتسجّل — كله محدّد.",
            "Retry واضح: كام مرة وبعدين إيه.",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت معالجة الأخطاء",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ الأتمتة بتفشل — النظام الكويس يبلّغك قبل ما العميل يتأذى.",
        "تقدر تعمل إيه؟ عندك قاعدة تنبيه واحدة جاهزة تضيفها لـ workflow.",
        "اللي جاي: اختبار الأتمتة — قبل ما تطلع live، اتأكد إنك مش هتعمل حرجة قدام العملاء.",
      ],
    },
  },
];
