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
import automatorM5WhatsappFlowScreenshot from "@/assets/lessons/unique/automator-m6-l2-whatsapp-flow.jpg";

/** Automator · M6 · WhatsApp Flow ذكي (v3: Lesson Shape pilot) */
export const AUTOMATOR_M6_L2_WHATSAPP_FLOW_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ أوتوميشن واتساب يساعد في التأكيدات والأسئلة الشائعة — بس محتاج ثقة وموافقة العميل.",
        "ليه دلوقتي؟ بعد ما عرفت تستقبل leads، القناة الأقرب للعميل محتاجة ردود ذكية مش مزعجة.",
        "هتعمل إيه بعد الدرس؟ هتصمّم flow رد آلي واحد بشرط تحويل لبشري.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "البوت رد — والعميل حسّ إنه اتهاجم",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "شغّلت رسائل واتساب تلقائية لكل اللي سجّلوا. نفس الرسالة لكل الناس — حتى اللي ماطلبوش حاجة.",
        "العملاء بيعملوا block. الرقم بيتبلّغ. سمعتك بتتأثر.",
        "واتساب قناة شخصية — الأوتوميشن لازم يخدم مش يزعج. ثقة + موافقة + رد مفيد = شغل. سبام = خسارة.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "رد آلي مفيد + تحويل لبشري لما محتاج",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "واتساب automation مناسب لـ: تأكيد طلب، إجابة FAQ، تذكير موعد، متابعة lead سجّل بنفسه.",
        "العميل يبدأ أو يوافق — مش إنت اللي تبعت لكل الناس من غير سبب.",
        "الـ Flow: رسالة واردة → فهم النية → رد مناسب → لو معقّد: تحويل لموظف.",
        "كل رسالة تحدّث سياق المحادثة — مش رسالة معزولة من غير ذاكرة.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "بث جماعي vs محادثة بموافقة",
    block: {
      kind: "comparison",
      left: {
        label: "بث من غير سبب",
        body: "نفس العرض لـ ٥٠٠ رقم. محدش طلب. block وبلاغات. الرقم يتحظر.",
      },
      right: {
        label: "رد بعد اهتمام",
        body: "العميل سجّل أو بعت الأول. رد تأكيد + إجابة سؤاله. لو طلب «أكلم حد» → تحويل فوري لموظف.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين لواتساب",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Consent (موافقة)",
          meaning: "العميل بدأ التواصل أو وافق صراحة — مش إنت اللي بادئ من غير طلب.",
          example: "ملّا فورم واختار «تواصلوا معايا على واتساب» = موافقة.",
        },
        {
          term: "Handoff (تحويل)",
          meaning: "لما الرد الآلي يوقف وموظف يكمل المحادثة — شرط واضح مش استثناء.",
          example: "«عايز أكلم حد» أو «الشكوى معقّدة» → تحويل لخدمة العملاء.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — واتساب بثقة",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي تبني flow واتساب يرد بفايدة ويحوّل لبشري لما محتاج. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "لقطة بصرية",
    title: "مسار الرسالة للرد للتحويل",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: automatorM5WhatsappFlowScreenshot,
      alt: "مخطط يوضح flow واتساب من استقبال الرسالة للرد أو التحويل لموظف.",
      caption:
        "رسالة واردة → فهم → رد أو تحويل. السياق محفوظ عشان الرد يكون مناسب مش عام.",
      label: "automator-m6-l2-whatsapp-flow",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m6-l2-whatsapp-flow-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "عميل بعت «عايز أتكلم مع حد» بعد ما البوت رد على سؤال بسيط. أحسن تصرف؟",
          options: [
            "البوت يكمل يحاول يجاوب من FAQ.",
            "تحويل فوري لموظف — ده شرط handoff واضح.",
            "تبعتله رسالة «انتظر ٢٤ ساعة».",
          ],
          correctIndex: 1,
          explanation:
            "طلب التحدث مع حد = handoff. الأوتوميشن خدم — والبشري يكمل لما العميل يطلب.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "flow رد آلي + شرط تحويل",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة تصميم محادثة واحدة — مش بناء API. اختار سيناريو عندك (تأكيد، FAQ، متابعة) وحدّد الرد الآلي وإمتى يتحوّل لبشري.\n\nمش مطلوب ربط تقني — مطلوب flow واضح بشرط handoff.",
      prompt:
        "في تسليمك اكتب:\n\n١) السيناريو: [تأكيد طلب / FAQ / …]\n٢) الرسالة اللي تبدأ الـ Flow: [مثال من العميل]\n٣) الرد الآلي: [إيه بيقوله البوت]\n٤) شرط التحويل: [إمتى يتحوّل لموظف؟]\n٥) مين يستلم التحويل؟\n\n+ جملة: إزاي بتضمن إن العميل حسّ إنه مش سبام؟",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "السيناريو:\n[…]\n\nرسالة العميل:\n[مثال]\n\nالرد الآلي:\n[نص أو ملخص]\n\nشرط التحويل:\n[متى + ليه]\n\nيستلم التحويل:\n[مين]\n\nضد السبام:\n[جملة واحدة]",
      rubric: [
        {
          label: "Flow واضح",
          weight: 60,
          criteria: ["سيناريو + رد آلي + شرط تحويل محدد."],
        },
        {
          label: "ثقة وموافقة",
          weight: 40,
          criteria: ["واضح إزاي العميل بدأ أو وافق — مش بث عشوائي."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت واتساب",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ واتساب automation مفيد بثقة وموافقة — مش بث مزعج.",
        "تقدر تعمل إيه؟ عندك flow رد آلي واحد بشرط تحويل لبشري.",
        "اللي جاي: Follow-up — المتابعة اللي بتضيع فيها المبيعات.",
      ],
    },
  },
];
