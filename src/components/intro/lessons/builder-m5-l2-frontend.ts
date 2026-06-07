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
import frontendScreenshot from "@/assets/lessons/builder-m5-l2-frontend.jpg";

/** Builder · M5 · Lesson 02 — Frontend (v3: Lesson Shape pilot) */
export const BUILDER_M5_FRONTEND_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ Frontend = اللي العميل يشوفه ويدوس عليه. Backend = الشغل اللي بيحصل ورا.",
        "ليه دلوقتي؟ لما حاجة تبوظ، أول سؤال: المشكلة في الشكل ولا في الشغل؟",
        "هتعمل إيه بعد الدرس؟ هتفرّق ٥ أجزاء في أي تطبيق — frontend ولا backend.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "«الـ AI مش بيرد» — المشكلة فين؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "العميل بيقول «التطبيق مش شغال» — بس إيه بالظبط؟ الزرار مش بيداس؟ ولا بيداس ومفيش رد؟",
        "«مش شغال» جملة عامة. من غير ما تعرف: شكل ولا شغل — هتضيع وقت في التصليح الغلط.",
        "أول خطوة دايمًا: حدّد الطبقة — واجهة (Frontend) ولا كواليس (Backend).",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "Frontend = تشوف — Backend = يشتغل",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Frontend = كل حاجة على الشاشة: زراير، نصوص، ألوان، مربعات الكتابة.",
        "Backend = الشغل اللي مش بتشوفه: تكلّم AI، تحقق من بيانات، حفظ، قرارات.",
        "في مطعم: المنيو والترابيزة = Frontend. المطبخ = Backend.",
        "لما تصلّح مشكلة، اسأل: العميل شايف إيه؟ ولا الشغل ورا مش ماشي؟",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "زرار مش شكله — vs رد مش بيوصل",
    block: {
      kind: "comparison",
      left: {
        label: "مشكلة Frontend",
        body: "الزرار شكله رمادي ومش بيداس. أو الشاشة فاضية. العميل مش قادر يبدأ — المشكلة في الشكل.",
      },
      right: {
        label: "مشكلة Backend",
        body: "الزرار شغّال والشاشة بتحمّل — بس مفيش رد. أو رسالة خطأ. الشكل تمام — الشغل ورا اللي واقف.",
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
          term: "Frontend (الواجهة)",
          meaning: "الوش — كل حاجة العميل يشوفها ويتعامل معاها على الشاشة.",
          example: "مربع كتابة السؤال + زرار «إرسال» + قائمة المحادثات.",
        },
        {
          term: "Backend (الكواليس)",
          meaning: "العقل — يستقبل الطلب، يكلّم AI، ويرجّع الرد.",
          example: "لما تدوس «إرسال»، الكواليس هي اللي بتبعت السؤال للـ AI.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — شكل vs شغل",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي تفرّق Frontend عن Backend في أي تطبيق AI. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "الكود اللي بيبني الشاشة",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: frontendScreenshot,
      alt: "Inspector في Chrome على موقع — HTML و CSS لواجهة التطبيق.",
      caption:
        "افتح أي تطبيق AI → كليك يمين → Inspect. اللي بتشوفه ده Frontend — الكود اللي بنى الشاشة. جرّب بنفسك.",
      label: "F12 أو Inspect",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m5-l2-frontend-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "في تطبيق شات AI، مربع الكتابة اللي بتكتب فيه السؤال — ده Frontend ولا Backend؟",
          options: [
            "Frontend — لأن العميل شايفه وبيستخدمه.",
            "Backend — لأنه بيبعت السؤال.",
            "Database — لأنه بيحفظ الكلام.",
          ],
          correctIndex: 0,
          explanation:
            "مربع الكتابة على الشاشة = Frontend. إرسال السؤال للـ AI = Backend.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "فرّق ٥ أجزاء — Frontend ولا Backend؟",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي تحليل — مش كود. افتح أي تطبيق AI بتستخدمه (ChatGPT، Claude، أي حاجة).\n\n٥–١٠ دقايق كفاية.",
      prompt:
        "في تسليمك، لكل جزء اكتب Frontend أو Backend:\n\n١) مربع كتابة السؤال:\n٢) زرار «إرسال»:\n٣) الرد اللي بيظهر على الشاشة:\n٤) تكلّم AI بالسؤال (الشغل اللي مش بتشوفه):\n٥) حفظ المحادثة عشان ترجع لها بكرة:\n\nولكل واحد: لِيه اخترت Frontend أو Backend؟",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "١) مربع الكتابة: [Frontend/Backend] — لِيه:\n\n٢) زرار إرسال: [ ] — لِيه:\n\n٣) الرد على الشاشة: [ ] — لِيه:\n\n٤) تكلّم AI: [ ] — لِيه:\n\n٥) حفظ المحادثة: [ ] — لِيه:",
      rubric: [
        {
          label: "التصنيف صح",
          weight: 60,
          criteria: [
            "١–٣ غالبًا Frontend. ٤–٥ غالبًا Backend/Database.",
            "كل اختيار له سبب منطقي.",
          ],
        },
        {
          label: "السبب واضح",
          weight: 40,
          criteria: [
            "السبب يفرّق «شايف» عن «بيشتغل ورا».",
            "مش مجرد تخمين بدون تعليل.",
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
        "فهمت إيه؟ Frontend = تشوف. Backend = يشتغل. أول خطوة في أي مشكلة: حدّد الطبقة.",
        "تقدر تعمل إيه؟ تفرّق ٥ أجزاء في أي تطبيق — وتعرف فين المشكلة غالبًا.",
        "اللي جاي: APIs — إزاي الواجهة والكواليس بيتكلموا مع بعض.",
      ],
    },
  },
];
