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
import instructionsExamplesScreenshot from "@/assets/lessons/builder-m2-l2-instructions-examples.jpg";

/** Builder · M2 · Lesson 02 — Instructions vs Examples (v3: Lesson Shape pilot) */
export const BUILDER_M2_INSTRUCTIONS_EXAMPLES_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ إمتى توصف بالكلام وإمتى تورّي مثال — وإزاي ده يفرّق في جودة مخرجات AI في منتجك.",
        "ليه دلوقتي؟ كتير من الـ Prompts بتفشل مش لأن الـ AI «غبي» — لأنك وصفته بصفات («احترافي»، «إبداعي») بدل ما تورّيه الشكل.",
        "هتعمل إيه بعد الدرس؟ هتكتب Prompt فيه مثالين + pattern واضح.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "شرحت بالتفصيل — والرد أي كلام",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كتبت «اكتب بأسلوب جذّاب ومميز» — والرد طلع كليشيهات: «اكتشف السحر» و«تجربة فريدة».",
        "الـ AI شاطر في التقليد أكتر من فهم الصفات العامة.",
        "لما تبني ميزة (عناوين، ردود دعم، كروت UI)، مثالين صح = أسلوب ثابت لكل المستخدمين.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "المثال يعلّم أحسن من الصفة",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Instructions = خطوات أو قواعد بالكلام: «اعمل ١، ٢، ٣».",
        "Examples = تورّيه شكل الرد اللي عايزه: «اعمل زي ده وده».",
        "الـ AI بيقلّد الأنماط. مثال واحد أو اتنين أقوى من ١٠٠ صفة («قصير»، «ودود»، «مبدع»).",
        "في Builder: لما تطلب من Lovable «اعمل ٤ كروت زي الكارت ده» — ده Few-shot. نفس الفكرة في أي Prompt.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "وصف vs مثال — نفس الطلب",
    block: {
      kind: "comparison",
      left: {
        label: "وصف بالكلام",
        body: "«اكتبلي ٣ عناوين جذابة لمنتج عسل.» — غالبًا «عسل النحل الذهبي» و«شفاء من الطبيعة» — كلام عام.",
      },
      right: {
        label: "مثال يقلّده",
        body: "«اكتبلي ٣ عناوين لعسل، على نمط: ‚ذهب سائل من الطبيعة‘.» — الردود كلها شاعرية زي المثال.",
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
          term: "Instructions (تعليمات)",
          meaning: "قواعد وخطوات بالكلام — مناسبة للمهام المنظمة.",
          example: "«اقرأ المقال → حدّد ٣ أفكار → لخّص كل واحدة في سطر.»",
        },
        {
          term: "Few-shot Prompting",
          meaning: "تدي الـ AI ٢–٣ أمثلة للشكل المطلوب قبل الطلب الفعلي.",
          example: "إيميلين للرد على العملاء + «اكتب رد على الإيميل الجديد بنفس الأسلوب.»",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — إمتى توصف وإمتى تورّي",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "Instructions vs Examples — وليه الأمثلة بتثبّت سلوك المنتج. لو معندكش وقت، كمل قراية.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "كروت متطابقة — من مثال واحد",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: instructionsExamplesScreenshot,
      alt: "الصفحة الرئيسية — خمس كروت مسارات بنفس الشكل.",
      caption:
        "الكروت دي كلها نفس التنسيق. مش من تعليمات طويلة — من مثال واحد: «اعمل كارت زي ده للمسارات التانية.» الـ AI فهم الـ pattern وقلّده.",
      label: "كروت بنفس النمط",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m2-l2-instructions-examples-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "عايز بوستات بنفس شكل: «فطار متوازن بيخلي يومك أحسن». إيه أحسن طريقة؟",
          options: [
            "أديله ٢–٣ أمثلة بنفس الشكل (Few-shot).",
            "أكتبله تعليمات طويلة عن «شكل الجملة».",
            "أقوله اكتب بوستات عن العادات وخلاص.",
          ],
          correctIndex: 0,
          explanation:
            "لما الشكل صعب توصفه، الأمثلة بتثبّت النمط — ده أساس أي ميزة محتوى في منتجك.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "مثالين + pattern — لنفس الطلب",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "هتاخد طلب ضعيف، وتضيفله مثالين + جملة pattern.\n\n١٠–١٥ دقيقة.",
      prompt:
        "في تسليمك:\n\n١) الطلب الضعيف:\n«اكتبلي ٣ أفكار لبودكاست عن ريادة الأعمال»\n\n٢) الطلب المحسّن — ضيف:\n   - مثال ١ (فكرة + عنوان)\n   - مثال ٢ (فكرة + عنوان)\n   - سطر pattern: «اكتبلي ٣ أفكار على نفس النمط»\n\n٣) إيه الـ pattern اللي المثالين بيعلّموه؟ (جملة واحدة)",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "الطلب الضعيف:\n[...]\n\nالطلب المحسّن:\nمثال ١: [...]\nمثال ٢: [...]\n\nPattern:\n[...]\n\nالـ pattern اللي اتعلّمه:\n[...]",
      rubric: [
        {
          label: "مثالين متسقين",
          weight: 60,
          criteria: [
            "المثالين بنفس الأسلوب.",
            "فيه سطر pattern واضح.",
          ],
        },
        {
          label: "تحليل النمط",
          weight: 40,
          criteria: [
            "وصفت الـ pattern مش بس «بقى أحسن».",
            "قابل للاستخدام في Prompt منتج.",
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
        "فهمت إيه؟ الأمثلة بتعلّم الـ AI الشكل — الصفات العامة مش كفاية.",
        "تقدر تعمل إيه؟ تبني Prompts فيها ٢–٣ أمثلة + pattern لأي مخرج متكرّر.",
        "اللي جاي: Style Control — إزاي المساعد يتكلم بصوتك.",
      ],
    },
  },
];
