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

/** Automator · M3 — Testing Automation (v3: Lesson Shape pilot) */
export const AUTOMATOR_M3_TESTING_AUTOMATION_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ الاختبار بيمنع أخطاء محرجة في الأتمتة (Automation = حاجة شغالة تلقائي) — مش رفاهية تقنية.",
        "ليه دلوقتي؟ بعد معالجة الأخطاء، عندك Workflow (خطوات ماشية ورا بعض بشكل تلقائي) شغّال — محتاج تتأكد إنه مش هيبعت رسالة غلط ل٥٠٠ عميل.",
        "هتعمل إيه بعد الدرس؟ هتعمل قائمة اختبار: خطوة بخطوة، ثم المسار كامل، ثم حالات غريبة، ثم مراجعة يدوية.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "«الأوتوميشن بعت «undefined» لكل العملاء»",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "شغّلت Workflow (خطوات ماشية ورا بعض بشكل تلقائي) جديد على التشغيل الحقيقي من غير اختبار. الرسالة فيها «مرحبًا undefined» — ل٣٠٠ عميل.",
        "العميل فكر إنكم روبوت مش بتحترموه. الثقة راحت في ساعة.",
        "دقيقة اختبار قبل الـ live كانت هتكشف إن حقل الاسم فاضي — مش رفاهية، حماية لسمعتك.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "٤ مستويات اختبار — من خطوة لـ flow كامل",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "اختبار خطوة واحدة (Unit test): لو الاسم فاضي، إيه اللي يحصل؟",
        "اختبار المسار كامل (Integration test): شغّل الـ Flow (خطوات ماشية ورا بعض بشكل تلقائي) ببيانات تجريبية — مش بيانات عملاء حقيقيين.",
        "حالات غريبة (Edge cases): فاضي، غلط، مكرر — ٣ حالات على الأقل قبل التشغيل الحقيقي.",
        "مراجعة يدوية (Manual review): حد يشوف النتيجة بعينه قبل ما تفتح على الكل — آخر بوابة.",
        "الاختبار بيحمي الثقة — مش بس الكود.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "طلّع live من غير اختبار vs checklist",
    block: {
      kind: "comparison",
      left: {
        label: "«نجرب على العملاء»",
        body: "شغّلت على production — أول خطأ بيوصل لـ ٣٠٠ عميل. اعتذار + ثقة ضايعة.",
      },
      right: {
        label: "Checklist قبل live",
        body: "بيانات تجريبية → ٣ edge cases → مراجعة يدوية → بعدها production. الخطأ يفضل عندك.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للاختبار",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Unit Test (اختبار خطوة)",
          meaning: "تختبر جزء واحد — node أو شرط — من غير الـ flow كله.",
          example: "لو الإيميل فاضي → الـ Filter يوقف ولا يكمّل؟",
        },
        {
          term: "Integration Test (اختبار التدفق)",
          meaning: "تشغّل الـ Workflow (خطوات ماشية ورا بعض بشكل تلقائي) كامل من أوله لآخره ببيانات وهمية.",
          example: "lead تجريبي «اختبار» → هل وصل الإيميل + اتسجّل في الجدول؟",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — اختبر قبل live",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي تختبر أوتوميشن قبل ما يطلع live — unit، flow كامل، edge cases، ومراجعة يدوية. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "Checklist الاختبار",
    tone: "primary",
    block: {
      kind: "diagram",
      id: "followup-cadence",
      label: "Testing Checklist",
      caption:
        "Unit → Full flow → Edge cases → Manual review → Live. استخدم الرسم في المهمة.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m3-testing-automation-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "workflow جديد بيبعت رسالة ترحيب. إيه أحسن خطوة قبل production؟",
          options: [
            "شغّله ببيانات تجريبية + ٣ edge cases + مراجعة يدوية للنتيجة.",
            "شغّله على production — العملاء هيقولولك لو في مشكلة.",
            "اختبر خطوة الإرسال بس — الباقي هيمشي.",
          ],
          correctIndex: 0,
          explanation:
            "Full-flow + edge cases + مراجعة يدوية = الخطأ يفضل عندك مش عند العميل.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "اعمل test checklist لأوتوميشن واحد",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي checklist — مش تشغيل إلزامي. اختار أوتوميشن عندك (أو اللي بتصمّمه) واكتب خطة اختبار كاملة.\n\nممكن الـ AI يقترح حالات — إنت تختار النهائي.",
      prompt:
        "في تسليمك اكتب:\n\n١) الأوتوميشن (سطر — إيه بيعمل):\n\n٢) Unit test واحد:\n   - الخطوة:\n   - المدخل:\n   - النتيجة المتوقعة:\n\n٣) Full-flow test واحد:\n   - بيانات تجريبية (مش عملاء حقيقيين):\n   - من أول trigger لآخر action — إيه المتوقع:\n\n٤) ٣ Edge cases:\n   - فاضي:\n   - غلط:\n   - مكرر:\n\n٥) Manual review واحد:\n   - مين يراجع:\n   - إيه بيشوفه قبل live:",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "الأوتوميشن:\n[إيه بيعمل — مثال: ترحيب بعد تسجيل فورم]\n\nUnit test:\nالخطوة: [مثال: Filter — هل الإيميل موجود؟]\nالمدخل: [إيميل فاضي]\nالمتوقع: [الـ workflow يقف — مفيش إرسال]\n\nFull-flow test:\nبيانات تجريبية: [name: «اختبار»، email: test@example.com]\nالمتوقع: [إيميل ترحيب + صف في الجدول]\n\nEdge cases:\n1. فاضي: [إيميل فاضي → يقف]\n2. غلط: [إيميل «abc» → يقف أو يسجّل خطأ]\n3. مكرر: [نفس الإيميل مرتين → مفيش تكرار في الجدول]\n\nManual review:\nمين: [أنت / زميل]\nيشوف إيه: [نص الرسالة + بيانات الجدول — قبل فتح production]",
      rubric: [
        {
          label: "Unit + Full-flow",
          weight: 50,
          criteria: [
            "Unit test لخطوة محددة بمدخل ونتيجة.",
            "Full-flow ببيانات تجريبية — مش production.",
          ],
        },
        {
          label: "Edge + Review",
          weight: 50,
          criteria: [
            "٣ edge cases: فاضي، غلط، مكرر.",
            "نقطة مراجعة يدوية فيها مين وإيه بيشوف.",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت الاختبار",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ الاختبار بيحمي ثقة العملاء — unit، flow كامل، edge cases، ومراجعة يدوية.",
        "تقدر تعمل إيه؟ عندك test checklist جاهز لأي أوتوميشن قبل الـ live.",
        "اللي جاي: LLM جوه الـ Flow — لما الذكاء الاصطناعي يبقى node في الشغل المتكرر.",
      ],
    },
  },
];
