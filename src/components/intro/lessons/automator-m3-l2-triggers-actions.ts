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
import automatorM2TriggersActionsScreenshot from "@/assets/lessons/unique/automator-m3-l2-triggers-actions.jpg";

/** Automator · M3 · Lesson 02 — Triggers + Actions (v3: Lesson Shape pilot) */
export const AUTOMATOR_M3_L2_TRIGGERS_ACTIONS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ كل أتمتة = «لما ده يحصل، اعمل كده» — مُشغّل (Trigger) + فعل أو أكتر (Action).",
        "ليه دلوقتي؟ بعد ما اخترت الأداة، محتاج تصمّم أول workflow للعامل الافتراضي — قبل ما تفتح أي شاشة.",
        "هتعمل إيه بعد الدرس؟ هتصمّم workflow واحد: مُشغّل → ٢–٣ actions.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "بتبني Flow — من غير ما تعرف «لما إيه؟»",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بتفتح الأداة وتضيف actions — بس المُشغّل مش واضح. الـ Flow يشتغل… بس مش في الوقت الصح.",
        "العامل الافتراضي محتاج يعرف: إيه الحدث اللي يصحّيه؟ وإيه اللي ينفّذه بعد ما يصحى؟",
        "«لما X → اعمل Y» — ده جملة واحدة تصمّم بيها أي أتمتة.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "لما ده يحصل → اعمل كده",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Trigger (المُشغّل): الحدث اللي يبدأ الشغل — فورم اتملّى، رسالة وصلت، الساعة ٩ الصبح.",
        "Action (الفعل): اللي العامل الافتراضي ينفّذه — يبعت إيميل، يضيف صف، يرسل واتساب.",
        "أنواع Triggers شائعة: Schedule (موعد)، Webhook (إشعار فوري لما حاجة تحصل)، Event (حدث في تطبيق).",
        "Actions متسلسلة: output الـ action الأول = input للتاني. زي سير ورا بعض.",
        "مثال: «لما حد يملى فورم → سجّل في شيت → ابعت واتساب ترحيب».",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "Actions من غير Trigger vs «لما… اعمل…»",
    block: {
      kind: "comparison",
      left: {
        label: "Actions بس",
        body: "هبة بنت Flow يبعت إيميل — بس مش عارفة «إمتى». بتضغط تشغيل يدوي كل مرة. ده مش عامل افتراضي.",
      },
      right: {
        label: "Trigger + Actions",
        body: "«لما فورم جديد → إيميل ترحيب». هبة ما بتفتحش الأداة — العامل الافتراضي يشتغل لوحده.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للـ workflow",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Trigger (المُشغّل)",
          meaning: "«لما…» — الحدث اللي يصحّي العامل الافتراضي.",
          example: "عميل اشترى كورس (Webhook من بوابة الدفع).",
        },
        {
          term: "Action (الفعل)",
          meaning: "«اعمل…» — الخطوة اللي بتتنفّذ بعد المُشغّل.",
          example: "ابعت واتساب فيه رابط الكورس.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — Triggers و Actions",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "أنواع المُشغّلات والأفعال — وإزاي تركّب «لما… اعمل…». لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "كل خطوة = مُشغّل → action",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: automatorM2TriggersActionsScreenshot,
      alt: "رسم خطوات متسلسلة — حدث يبدأ سلسلة أفعال.",
      caption:
        "أي مسار = حدث (مُشغّل) → action أو أكتر. مثال: «خلّصت مهمة» → «سجّل» + «افتح التالية» + «ذكّر». نفس الفكرة على شغلك.",
      label: "مُشغّل → actions",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m3-l2-triggers-actions-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "عايز أول ما عميل يشتري كورس، يوصله واتساب فورًا فيه رابط الدخول. إيه التصميم الصح؟",
          options: [
            "Trigger: Webhook من بوابة الدفع (شراء جديد). Action: إرسال واتساب.",
            "Trigger: Schedule كل ساعة. Action: دور على مشتريات جديدة.",
            "Trigger: Manual — أنت تدوس زرار لكل عميل.",
          ],
          correctIndex: 0,
          explanation:
            "شراء = حدث فوري → Webhook. «لما يشتري → ابعت واتساب» — ده تصميم العامل الافتراضي.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "صمّم workflow: مُشغّل → actions",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "صمّم workflow لمرشّح الأتمتة بتاعك — Trigger واحد + ٢–٣ Actions. تصميم على ورقة — مش بناء في الأداة.\n\n١٠–١٥ دقيقة كفاية.",
      prompt:
        "في تسليمك:\n\n١) الهدف في سطر:\n\n٢) Trigger:\n   - النوع (Schedule / Webhook / Event):\n   - «لما…» (بالتفصيل):\n   - البيانات اللي هتيجي (اسم، إيميل، …):\n\n٣) Action 1:\n   - «اعمل…»:\n   - Input من الـ Trigger:\n\n٤) Action 2:\n   - «اعمل…»:\n   - Input من Action 1:\n\n٥) (اختياري) Action 3\n\n٦) Success — إزاي تعرف إنه اشتغل؟",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "الهدف:\n[سطر]\n\nTrigger:\nنوع: [ ]\nلما: [...\n]\nبيانات: [اسم، ...]\n\nAction 1:\nاعمل: [ ]\nInput: [من Trigger]\n\nAction 2:\nاعمل: [ ]\nInput: [من Action 1]\n\nSuccess:\n[إزاي تتأكد]",
      rubric: [
        {
          label: "Trigger + Actions",
          weight: 60,
          criteria: [
            "Trigger واضح بنوع و«لما…».",
            "Action 1 + 2 مربوطين بالبيانات اللي قبلهم.",
          ],
        },
        {
          label: "Success",
          weight: 40,
          criteria: [
            "معيار نجاح قابل للقياس.",
            "الهدف مربوط بالـ Success.",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت التصميم",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ كل أتمتة = «لما ده يحصل → اعمل كده» — مُشغّل + actions.",
        "تقدر تعمل إيه؟ عندك workflow مصمّم جاهز — تقدر تبنيه في الأداة اللي اخترتها.",
        "اللي جاي: Filters & Routers — لما «لما…» يحتاج قرار: روح فين؟",
      ],
    },
  },
];
