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
import leadsScreenshot from "@/assets/lessons/unique/automator-m6-l1-lead-capture.jpg";

/** Automator · M6 · استقبال Leads (v3: Lesson Shape pilot) */
export const AUTOMATOR_M6_L1_LEAD_CAPTURE_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ Lead capture automation يمنع الناس المهتمة تضيع — كل استفسار يتسجّل ويترد عليه من غير نسيان.",
        "ليه دلوقتي؟ بعد AI في السير، محتاج جسر يربط الاهتمام اللي جاي من بره بنظام شغلك.",
        "هتعمل إيه بعد الدرس؟ هترسم workflow استقبال lead من أول ما حد يسجّل لحد ما يتسجّل ويتبلّغ.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "«كان مهتم — وبعدين ضاع»",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "حد ملّا فورم أو بعت رسالة «عايز أعرف السعر». إنت شفتها متأخر — أو نسيت ترد.",
        "بعد يومين لقيت الرسالة في الإيميل تحت ٥٠ رسالة تانية. العميل اشترى من حد تاني.",
        "المشكلة مش نقص اهتمام — المشكلة مفيش نظام يمسك كل lead فورًا ويسجّله ويرد.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "كل lead = تسجيل فوري + رد + تنبيه",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Lead = أي حد أبدى اهتمام: فورم، واتساب، طلب حجز، استفسار خدمة.",
        "Lead capture automation: لحظة التسجيل → حفظ في مكان واحد → رد ترحيب فوري → تنبيه لمن يتابع.",
        "مش لازم إعلان أو محتوى — أي قناة فيها اهتمام محتاجة نفس الجسر.",
        "الهدف: ماحدش يقع من الشبكة لأنك مش فاضي أو نسيت.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "إيميل وخلاص vs نظام استقبال",
    block: {
      kind: "comparison",
      left: {
        label: "استقبال يدوي",
        body: "الفورم يبعت إيميل. إنت بتفتح وتنسخ للشيت. ٣٠ lead في يوم = فوضى ونسيان. «مين ده؟ جالنا منين؟»",
      },
      right: {
        label: "Lead capture automation",
        body: "الفورم → تسجيل فوري + مصدر (منين جالك) + رد ترحيب أوتوماتيك + تنبيه لفريق المتابعة. كل lead موثّق من ثانية واحدة.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للاستقبال",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Lead (عميل محتمل)",
          meaning: "حد أبدى اهتمام بس لسه ماشتريش — استفسار، تسجيل، طلب عرض.",
          example: "حد سجّل إيميله عشان يعرف سعر الكورس — ده lead.",
        },
        {
          term: "Webhook (إشعار فوري)",
          meaning: "إشارة فورية للأوتوميشن إن حاجة حصلت — زي تسجيل فورم جديد.",
          example: "أول ما حد يضغط «إرسال» → الأوتوميشن يشتغل في نفس اللحظة.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — من الاهتمام للتسجيل",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي تبني جسر استقبال leads من أول تسجيل لحد الرد والتنبيه. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "لقطة بصرية",
    title: "مسار Lead من التسجيل للمتابعة",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: leadsScreenshot,
      alt: "مخطط يوضح مسار lead من الفورم للتسجيل والرد والتنبيه.",
      caption:
        "التسجيل → الحفظ → الرد الفوري → التنبيه. أربع خطوات تمنع الضياع.",
      label: "automator-m6-l1-lead-capture",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m6-l1-lead-capture-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "٥٠ شخص سجّلوا في فورم النهاردة — وإنت مش فاضي ترد على كل واحد يدوي. أحسن نظام؟",
          options: [
            "تستنى لما تفضى وترد على الكل مرة واحدة.",
            "كل تسجيل يتحفظ فورًا + رد ترحيب أوتوماتيك + تنبيه لمن يتابع.",
            "تقفل الفورم لحد ما تلحق ترد.",
          ],
          correctIndex: 1,
          explanation:
            "Lead capture automation يمسك كل واحد فورًا — تسجيل، رد، تنبيه. الانتظار = ضياع فرص.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "ارسم workflow استقبال lead",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة رسم سير عملي — مش بناء تقني. اختار قناة واحدة عندك (فورم، واتساب، حجز) وارسم المسار من التسجيل للتنبيه.\n\nمش مطلوب أدوات محددة — مطلوب ٤ خطوات واضحة.",
      prompt:
        "في تسليمك اكتب:\n\n١) القناة: [فورم / واتساب / حجز / …]\n٢) Trigger: إيه اللي يبدأ الأوتوميشن؟\n٣) الحفظ: فين بيتسجّل + إيه الحقول؟\n٤) الرد الفوري: إيه الرسالة؟\n٥) التنبيه: مين بيتبلّغ وإمتى؟\n\n+ جملة: إيه اللي كان بيضيع قبل النظام ده؟",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "القناة:\n[…]\n\nTrigger:\n[…]\n\nالحفظ:\n[مكان + حقول]\n\nالرد الفوري:\n[نص أو ملخص]\n\nالتنبيه:\n[مين + إمتى]\n\nاللي كان بيضيع:\n[جملة واحدة]",
      rubric: [
        {
          label: "سير كامل",
          weight: 60,
          criteria: ["٤ خطوات: trigger، حفظ، رد، تنبيه — مش ناقصة."],
        },
        {
          label: "واقعية",
          weight: 40,
          criteria: ["قناة حقيقية عندك + تنبيه لشخص محدد."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت الاستقبال",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ Lead capture automation يمنع المهتمين يضيعوا — تسجيل فوري ورد وتنبيه.",
        "تقدر تعمل إيه؟ عندك workflow استقبال مرسوم لقناة واحدة عندك.",
        "اللي جاي: WhatsApp Flow — ردود ذكية بثقة وموافقة.",
      ],
    },
  },
];
