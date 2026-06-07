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
import contextLayerScreenshot from "@/assets/lessons/builder-m3-l1-context-layer.jpg";

/** Builder · M3 · Lesson 01 — Context Layer (v3: Lesson Shape pilot) */
export const BUILDER_M3_CONTEXT_LAYER_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ إزاي تدي AI السياق الصح — في الوقت الصح — عشان أي ميزة في منتجك تردّ «ليك» مش «لأي حد».",
        "ليه دلوقتي؟ Prompt و Style من غير Context = ردود عامة. المستخدم هيحس إن المساعد «مش فاهمه».",
        "هتعمل إيه بعد الدرس؟ هتكتب Context لميزة AI واحدة في منتج تتخيله.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "سؤال واضح — وردّ غبي",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "«اعملي خطة محتوى» — والرد خطة عامة منسوخة مش بتاعت مشروعك.",
        "المشكلة مش السؤال — المشكلة إن الـ AI مش عارف: إنت مين؟ لمين؟ بكام؟ على أنهي منصة؟",
        "في أي تطبيق فيه AI، السياق اللي بتمرّره (ملف المستخدم، المرحلة، آخر إجراء) = فرق بين «مساعد» و«حيطة».",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "السياق الصح في الوقت الصح",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Context = كل المعلومات اللي الـ AI يعرفها قبل ما يرد: من أنت، إيه مشروعك، إيه اللي حصل قبل كده.",
        "تخيّل دكتور معاه ملفك vs دكتور أول مرة. نفس السؤال — رد مختلف.",
        "في Builder: مش لازم المستخدم يكتب السياق كل مرة — أنت تمرّره من التطبيق (صفحة، دور، بيانات).",
        "القاعدة: خلفية قبل الطلب. كل ما السياق أوضح، كل ما المخرج قابل للتنفيذ.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "سؤال عايم vs سياق كامل",
    block: {
      kind: "comparison",
      left: {
        label: "من غير سياق",
        body: "«اعملي خطة محتوى.» — الـ AI يخمّن. خطة عامة — مش لمشروعك.",
      },
      right: {
        label: "سياق قبل الطلب",
        body: "«أنا صاحب مخبز في القاهرة، ميزانية ٢٠٠٠/شهر، جمهور ستات ٣٠–٤٥ على انستجرام. خطة ٤ أسابيع.» — خطة تنفّذها.",
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
          term: "Context (السياق)",
          meaning: "المعلومات اللي الـ AI يشوفها مع السؤال — دورك، مشروعك، المرحلة.",
          example: "«المستخدم في صفحة الدفع» + «آخر طلب من ٣ أيام».",
        },
        {
          term: "Context Card (بطاقة سياق)",
          meaning: "ملخّص ثابت تبدأ بيه أي محادثة مهمة — أو التطبيق يمرّره أوتوماتيك.",
          example: "«أنا [دور] في [مجال]. المشروع: [...]. محتاج دلوقتي: [...].»",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — طبقة السياق",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي Context Layer بيغيّر جودة أي ميزة AI. لو معندكش وقت، كمل قراية.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "سياق يظهر قبل السؤال",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: contextLayerScreenshot,
      alt: "مساعد AI — صندوق سياقك الحالي فوق مربع السؤال.",
      caption:
        "قبل ما تكتب، المساعد عارف إنت في أنهي مسار وأنهي درس. السياق ده بيخلّي الرد يكمّل رحلتك — مش إجابات عامة. نفس الفكرة في أي منتج: مرّر للـ AI اللي المستخدم «فيه» دلوقتي.",
      label: "سياق + سؤال",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m3-l1-context-layer-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "عايز AI يساعدك في خطة تسويق. إيه أحسن خطوة الأول؟",
          options: [
            "تديله تفاصيل المشروع والعميل والميزانية قبل الطلب.",
            "تطلب «اكتب خطة تسويق» وخلاص.",
            "تسأله أسئلة عامة عن التسويق.",
          ],
          correctIndex: 0,
          explanation:
            "الخلفية قبل الطلب — ده اللي هتصمّمه في أي ميزة AI في منتجك.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "Context لميزة AI واحدة",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "تخيّل منتج فيه ميزة AI واحدة — واكتب السياق اللي التطبيق لازم يمرّره.\n\n١٠–١٥ دقيقة.",
      prompt:
        "في تسليمك:\n\n١) الميزة (مثال: «اقتراح وجبات»، «رد دعم»، «تلخيص تقرير»):\n\n٢) ٤ حقول سياق التطبيق يمرّرها أوتوماتيك:\n   - من المستخدم (دور/نوع)\n   - من المشروع/المنتج\n   - من الجلسة (آخر إجراء)\n   - من المرحلة (أنهي شاشة)\n\n٣) مثال Prompt كامل (سياق + سؤال مستخدم قصير)",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "الميزة:\n[...]\n\nسياق أوتوماتيك:\n1. المستخدم: [...]\n2. المشروع: [...]\n3. الجلسة: [...]\n4. الشاشة: [...]\n\nPrompt كامل:\n[سياق]\n\nسؤال المستخدم:\n[...]",
      rubric: [
        {
          label: "سياق من التطبيق",
          weight: 60,
          criteria: [
            "٤ حقول واقعية — مش المستخدم يكتبهم كل مرة.",
            "الميزة واضحة.",
          ],
        },
        {
          label: "Prompt كامل",
          weight: 40,
          criteria: [
            "السياق قبل السؤال.",
            "الرد المتوقّع يبان «مخصّص».",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت البداية",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ Context = السياق الصح في الوقت الصح — من التطبيق مش من ذاكرة المستخدم.",
        "تقدر تعمل إيه؟ تصمّم ٤ حقول سياق لأي ميزة AI.",
        "اللي جاي: حدود الذاكرة — ليه AI بينسى.",
      ],
    },
  },
];
