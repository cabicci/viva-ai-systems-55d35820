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
import schedulingScreenshot from "@/assets/lessons/unique/automator-m6-l3-follow-up.jpg";

/** Automator · M6 · المتابعة التلقائية (v3: Lesson Shape pilot) */
export const AUTOMATOR_M6_L3_FOLLOW_UP_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ المتابعة هي اللي بتضيع فيها المبيعات — الأوتوميشن يخليها منتظمة مش معتمدة على ذاكرتك.",
        "ليه دلوقتي؟ بعد استقبال leads وردود واتساب، الخطوة الجاية إنك ماتسيبش حد ساكت.",
        "هتعمل إيه بعد الدرس؟ هتكتب تسلسل متابعة ٣ خطوات لـ lead سجّل وماردش.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "ردّيت مرة — وسكتّوا الاتنين",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Lead سجّل واستلم رد ترحيب. قلت «هكلمه بكرة». بكرة في شغل تاني. الأسبوع عدى.",
        "العميل فتح إيميل من حد تاني. الصفقة راحت — مش لأن المنتج وحش، لأن المتابعة وقفت.",
        "المشكلة مش نقص اهتمام منك — المشكلة مفيش نظام يكمل المحادثة لو إنت مش فاضي.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "تسلسل متابعة = خطوات بوقت وسلوك",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Follow-up مش رسالة واحدة — تسلسل: يوم ٠ ترحيب، يوم ٢ تذكير، يوم ٥ سؤال واحد.",
        "كل خطوة لها هدف مختلف — مش نفس «تفتكر العرض؟» كل يومين.",
        "الأوتوميشن يوقف لو العميل رد، أو يحوّل لبشري لو بقى مهتم.",
        "المتابعة المنتظمة = فرص أكتر — من غير إزعاج.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "متابعة عشوائية vs تسلسل منتظم",
    block: {
      kind: "comparison",
      left: {
        label: "حسب المزاج",
        body: "«هكلمه لما أفضى». ساعات ترد، ساعات تنسى. العميل مش عارف إنت مهتم ولا لأ.",
      },
      right: {
        label: "تسلسل أوتوماتيك",
        body: "يوم ٠: ترحيب + مورد. يوم ٢: تذكير لطيف. يوم ٥: سؤال واحد. رد؟ يوقف ويحوّل لبشري.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للمتابعة",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Follow-up Sequence (تسلسل متابعة)",
          meaning: "خطوات رسائل مترتبة بوقت — كل واحدة هدفها مختلف.",
          example: "ترحيب → تذكير → سؤال → تحويل أو إغلاق.",
        },
        {
          term: "Stop Condition (شرط التوقف)",
          meaning: "إمتى التسلسل يقف — العميل رد، طلب إلغاء، أو اشتري.",
          example: "لو رد على واتساب → أوقف التسلسل وحوّل لمبيعات.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — متابعة منتظمة",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي تبني تسلسل متابعة يشتغل لوحده حسب وقت وسلوك الـ lead. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "لقطة بصرية",
    title: "جدول المتابعة على ٣ خطوات",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: schedulingScreenshot,
      alt: "مخطط يوضح تسلسل متابعة على ثلاث خطوات بأوقات مختلفة.",
      caption:
        "كل touchpoint هدفه مختلف — مش تكرار نفس الرسالة. الوقت + المحتوى + شرط التوقف.",
      label: "automator-m6-l3-follow-up",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m6-l3-follow-up-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "Lead سجّل وماردش على الترحيب بعد يومين. أحسن خطوة تانية في التسلسل؟",
          options: [
            "نفس رسالة الترحيب تاني.",
            "تذكير لطيف بقناة مختلفة أو بسؤال واحد — مش ضغط بيع.",
            "مكالمة فورية من غير تذكير.",
          ],
          correctIndex: 1,
          explanation:
            "الخطوة التانية هدفها تذكير بقيمة — مش تكرار. قناة أو أسلوب مختلف + لطيف.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "تسلسل متابعة ٣ خطوات",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة كتابة تسلسل عملي — مش إعداد CRM. Lead سجّل وماردش — اكتب ٣ خطوات متابعة بأوقات وأهداف مختلفة.\n\nمش مطلوب إرسال فعلي — مطلوب التسلسل + شرط توقف.",
      prompt:
        "في تسليمك اكتب:\n\nالسياق: Lead سجّل وماردش على الرسالة الأولى.\n\nخطوة ١ (يوم ٠): القناة + الرسالة + الهدف\nخطوة ٢ (يوم ٢): القناة + الرسالة + الهدف\nخطوة ٣ (يوم ٥): القناة + الرسالة + الهدف\n\nشرط التوقف: [إمتى يقف التسلسل؟]\n\n+ جملة: ليه كل خطوة مختلفة عن اللي قبلها؟",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "خطوة ١ (يوم ٠):\nقناة: […]\nرسالة: […]\nهدف: […]\n\nخطوة ٢ (يوم ٢):\nقناة: […]\nرسالة: […]\nهدف: […]\n\nخطوة ٣ (يوم ٥):\nقناة: […]\nرسالة: […]\nهدف: […]\n\nشرط التوقف:\n[…]\n\nليه مختلفة:\n[جملة واحدة]",
      rubric: [
        {
          label: "٣ خطوات متنوعة",
          weight: 60,
          criteria: ["كل خطوة: قناة + رسالة + هدف — مش نسخة من اللي قبلها."],
        },
        {
          label: "توقف ذكي",
          weight: 40,
          criteria: ["شرط توقف واضح — رد أو شراء أو طلب إلغاء."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت المتابعة",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ المتابعة بتضيع فيها المبيعات — الأوتوميشن يخليها منتظمة.",
        "تقدر تعمل إيه؟ عندك تسلسل ٣ خطوات جاهز لـ lead ساكت.",
        "اللي جاي: Closing the Loop — ربط كل الأوتوميشنات في رحلة عميل واحدة.",
      ],
    },
  },
];
