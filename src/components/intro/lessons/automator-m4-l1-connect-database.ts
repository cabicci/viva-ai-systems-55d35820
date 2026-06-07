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
import automatorM3ConnectDatabaseScreenshot from "@/assets/lessons/unique/automator-m4-l1-connect-database.jpg";

/** Automator · M4 · L1 — Connect Database (v3: Lesson Shape pilot) */
export const AUTOMATOR_M4_L1_CONNECT_DATABASE_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ الأتمتة بتبقى أقوى لما تحفظ بيانات منظمة — مش بس تبعت رسالة وتنسى.",
        "ليه دلوقتي؟ الـ workflow بيقرأ ويكتب — ومن غير مكان واضّح للبيانات، الشغل المتكرر بيتكرر يدوي.",
        "هتعمل إيه بعد الدرس؟ هتختار فين الـ workflow بيخزّن البيانات + إيه الحقول اللي محتاجها.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "«العميل اتسجّل — ومش لاقيين بياناته»",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الأوتوميشن بيبعت إيميل ترحيب — تمام. بس لما المبيعات تسأل «مين العميل ده؟» — مفيش سجل.",
        "البيانات راحت في الإيميل بس — مش في مكان منظم تقدر ترجعله كل يوم.",
        "العامل الافتراضي محتاج ذاكرة: فين بيحفظ؟ إيه الحقول؟ إمتى بيقرأ؟ — من غير ده الشغل المتكرر بيرجع يدوي.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "DB = ذاكرة الأتمتة",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كل lead أو طلب محتاج يتسجّل في مكان واحد — جدول أو شيت منظم بحقول ثابتة.",
        "اكتب: إمتى البيانات تتكتب؟ (بعد التسجيل) — إمتى تتقري؟ (تقرير يومي، متابعة).",
        "٣ حقول كفاية للبداية: اسم، تواصل، تاريخ/حالة — مش لازم ٢٠ عمود.",
        "الـ workflow بيقرأ من نفس المكان اللي بيكتب فيه — ده اللي بيخلي الشغل المتكرر يشتغل لوحده.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "رسالة وخلاص vs سجل منظم",
    block: {
      kind: "comparison",
      left: {
        label: "إيميل بس",
        body: "الأوتوميشن بيبعت إيميل — البيانات في صندوق الوارد. بعد أسبوع: مين سجّل؟ محدش عارف.",
      },
      right: {
        label: "سجل + إيميل",
        body: "نفس الأوتوميشن يكتب صف في جدول (اسم، تليفون، تاريخ) + يبعت إيميل. المتابعة تلقائية.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للتخزين",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Schema (شكل الجدول)",
          meaning: "الحقول اللي بتحفظها — اسم كل عمود ونوعه.",
          example: "leads: name, phone, status, created_at.",
        },
        {
          term: "CRUD (قراءة وكتابة)",
          meaning: "Create = اكتب. Read = اقرأ. Update = حدّث. Delete = امسح.",
          example: "تسجيل جديد → Create. تقرير يومي → Read.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — ربط الـ DB",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي تختار فين الـ workflow بيخزّن وإيه الحقول — من غير تعقيد. لو معندكش وقت، كمل قراية.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "بيانات منظمة ورا الـ workflow",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: automatorM3ConnectDatabaseScreenshot,
      alt: "مثال على بيانات منظمة في جدول",
      caption:
        "كل حدث (تسجيل، تقدّم، طلب) بيتسجّل في مكان واحد. الـ workflow يقرأ ويكتب من نفس المصدر — مش ملفات متفرقة.",
      label: "DB — ذاكرة الشغل المتكرر",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m4-l1-connect-database-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "أوتوميشن بيسجّل عملاء جداد كل يوم. المبيعات محتاجة تقرير بأسماءهم. إيه الأهم؟",
          options: [
            "الـ workflow يكتب كل عميل في جدول منظم بحقول ثابتة — ويقرأ منه للتقرير.",
            "يبعت إيميل للمبيعات بكل تسجيل — من غير سجل مركزي.",
            "يحفظ في ملاحظات عشوائية على الموبايل.",
          ],
          correctIndex: 0,
          explanation:
            "السجل المنظم = ذاكرة الأتمتة. إيميل من غير جدول = الشغل المتكرر يرجع يدوي.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "حدّد فين البيانات بتتخزّن",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي تصميم — مش ربط تقني إلزامي. اختار workflow عندك وحدّد: فين البيانات بتتحفظ؟ وإيه الحقول؟\n\nممكن الـ AI يقترح أعمدة — إنت تختار النهائي.",
      prompt:
        "في تسليمك اكتب:\n\n١) الـ Workflow (سطر — إيه الشغل المتكرر):\n٢) فين البيانات بتتخزّن (جدول / شيت / CRM — اسم المكان):\n٣) ٣ حقول على الأقل (اسم كل حقل + إيه اللي بيتحفظ):\n٤) إمتى تتكتب؟ (بعد إيه trigger):\n٥) إمتى تتقري؟ (مين بيستخدمها وليه):",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "Workflow:\n[الشغل المتكرر — مثال: تسجيل leads من فورم]\n\nمكان التخزين:\n[جدول / شيت / CRM — مثال: جدول leads في Google Sheets]\n\nالحقول:\n1. [اسم الحقل — مثال: name] → [إيه بيتحفظ]\n2. [phone] → [رقم التواصل]\n3. [status] → [جديد / متابع / مغلق]\n\nإمتى تتكتب:\n[بعد إيه — مثال: أول ما الفورم يتملّى]\n\nإمتى تتقري:\n[مين + ليه — مثال: تقرير يومي الساعة ٩ للمبيعات]",
      rubric: [
        {
          label: "مكان + حقول",
          weight: 60,
          criteria: [
            "مكان تخزين محدّد — مش «هنشوف».",
            "٣ حقول على الأقل بأسماء واضحة.",
          ],
        },
        {
          label: "كتابة وقراءة",
          weight: 40,
          criteria: [
            "إمتى تتكتب مربوطة بالـ trigger.",
            "إمتى تتقري فيها مستخدم واضح.",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت التخزين",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ الأتمتة أقوى لما عندها ذاكرة منظمة — مكان + حقول + إمتى تكتب وتقرأ.",
        "تقدر تعمل إيه؟ عندك خطة تخزين جاهزة لـ workflow حقيقي.",
        "اللي جاي: Webhooks & APIs — لما تطبيق يقول لتطبيق تاني «حصل حاجة».",
      ],
    },
  },
];
