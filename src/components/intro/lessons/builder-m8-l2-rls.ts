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
import rlsDiagram from "@/assets/lessons/concepts/rls-diagram.jpg";

/** Builder · M8 · Lesson 02 — RLS (v3: Lesson Shape pilot · optional depth) */
export const BUILDER_M7_RLS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ إزاي قواعد على مستوى المخزن تحدّد أنهي صفوف كل مستخدم يشوفها — حتى لو في غلطة في الكود.",
        "ليه دلوقتي؟ JWT (كارت دخول مؤقت) بيقول «مين إنت» — RLS (أمان على مستوى السطر) بيقول «إيه اللي مسموح تشوفه» من البيانات.",
        "هتعمل إيه بعد الدرس؟ هتكتب قاعدة واحدة: المستخدم يشوف بياناته هو بس.",
        "عمق اختياري: الدرس ده للي عايز يبني تطبيقات حقيقية. لو لسه في الأساسيات، تقدر تعدّيه وترجعله — باقي المسارات لسه قيمة.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "عميل A شاف أسرار عميل B",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "تخيل AI شخصي بيتعلم من ملاحظات كل عميل. عميل تاني فتح التطبيق ولقى أسرار الأول قدامه.",
        "مجرد إنك عارف ID حاجة — مش معناه إنك تقدر تشوفها. ومجرد إن الكود في ٩ أماكن مظبوط — مش كفاية لو نسيت المكان العاشر.",
        "المشكلة: الأمان في الكود لوحده مش خط دفاع أخير.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "القواعد تحدّد أنهي صفوف المستخدم يشوف",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "JWT (كارت دخول مؤقت) بيثبت هويتك. RLS Policy (سياسة أمان على السطر) بتركّب فلتر على كل سؤال للمخزن: «ارجّع بس الصفوف اللي user_id بتاعها = أنا».",
        "الفلتر ده جوه المخزن نفسه — مش في كود التطبيق بس.",
        "يعني: حتى لو الكود في الكواليس نسي شرط WHERE، الحارس على السطر يرفض يورّي بيانات مش بتاعتك.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "أمان في الكود vs حارس على كل سطر",
    block: {
      kind: "comparison",
      left: {
        label: "غلط — WHERE في الكود بس",
        body: "تكتب `WHERE user_id = currentUser` في كل API (وسيلة تخلي برنامجين يكلموا بعض). نسيت مرة واحدة — أسرار عميل اتكشفت. زي قفل كل البيبان وسايب شباك مفتوح.",
      },
      right: {
        label: "صح — RLS على المخزن",
        body: "Policy على الجدول: `user_id = auth.uid()`. أي query — حتى من غلطة — يرجع سطور المستخدم الحالي بس. خط دفاع أخير على المخزن نفسه.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للبداية",
    block: {
      kind: "concepts",
      items: [
        {
          term: "RLS (أمان على مستوى السطر)",
          meaning: "قواعد على المخزن نفسه بتفلتر أي query قبل ما ترجع نتايج — حتى لو الكود نسي يفلتر.",
          example: "جدول محادثات: كل مستخدم يشوف محادثاته هو بس — حتى لو الكود نسي يفلتر.",
        },
        {
          term: "Policy (سياسة)",
          meaning: "الشرط اللي الحارس بيطبّقه على كل سطر — زي «user_id بتاع الصف = user_id اللي عامل login».",
          example: "USING (user_id = auth.uid()) — يرجّع بس الصفوف بتاعة اللي فاتح التطبيق.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — حارس على كل سطر",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي RLS Policy بتشتغل جوه المخزن — وليه أقوى من الأمان في الكود لوحده. لو معندكش وقت، كمل قراية.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "نضارة سحرية لكل مستخدم",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: rlsDiagram,
      alt: "رسم بياني بيوضح Row Level Security: جدول فيه بيانات كل المستخدمين، وفي النص درع بيمثل RLS Policy، وكل مستخدم بيشوف بس السطور بتاعته.",
      caption:
        "المخزن واحد وفيه بيانات الكل. لما «أحمد» يطلب محادثاته، الـ Policy بتفلتر وترجّع سطوره هو بس — كأن كل واحد لابس نضارة بتورّيه حاجته بس.",
      label: "RLS — الفلتر جوه المخزن",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m8-l2-rls-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "عندك جدول `tasks` — كل مهمة فيها `user_id`. إيه الشرط المنطقي عشان كل واحد يشوف مهامه بس؟",
          options: [
            "user_id بتاع المهمة = user_id بتاع اللي عامل login دلوقتي.",
            "أي حد يشوف أي مهمة طالما معاه ID المهمة.",
            "لازم يكون admin عشان يشوف أي مهمة.",
          ],
          correctIndex: 0,
          explanation:
            "دي فكرة RLS ببساطة: نربط كل سطر بصاحبه — user_id في الصف = user_id من JWT.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "قاعدة: المستخدم يشوف بياناته هو بس",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "هتكتب Policy بسيطة لتطبيقك — مش كود SQL كامل، الشرط بس.\n\n١٠ دقايق كفاية.",
      prompt:
        "في تسليمك اكتب:\n\n١) اسم الجدول اللي فيه بيانات شخصية (مثال: `conversations`، `orders`):\n\n٢) إيه الحقل اللي بيربط كل سطر بمستخدم؟ (مثال: `user_id`)\n\n٣) اكتب الشرط بجملة عادية:\n   «المستخدم يشوف بس الصفوف اللي ___ = ___»\n\n٤) لِيه القاعدة دي مهمة؟ (سطر واحد)",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "الجدول:\n[اسم]\n\nحقل الربط:\n[user_id أو ...]\n\nالشرط:\nالمستخدم يشوف بس الصفوف اللي [حقل] = [هويته من login]\n\nمثال:\nuser_id بتاع الصف = user_id بتاع اللي فاتح التطبيق\n\nلِيه مهمة:\n[...]",
      rubric: [
        {
          label: "الشرط صح",
          weight: 60,
          criteria: [
            "الشرط بيربط سطر الجدول بهوية المستخدم الحالي.",
            "حدّدت جدولًا وحقل ربط واضحين.",
          ],
        },
        {
          label: "السبب",
          weight: 40,
          criteria: [
            "شرح في سطر ليه القاعدة بتمنع تسريب بيانات بين مستخدمين.",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ JWT = مين إنت. RLS = أنهي صفوف تشوف — القواعد على المخزن نفسه.",
        "تقدر تعمل إيه؟ عندك Policy واحدة جاهزة لتطبيقك.",
        "اللي جاي: RAG — إزاي الـ AI يرد من ملفاتك مش من تخمين.",
      ],
    },
  },
];
