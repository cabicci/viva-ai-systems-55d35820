import {
  Sparkles,
  AlertCircle,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import iterationImg from "@/assets/lessons/unique/builder-m6-l5-iteration.jpg";

/** Builder · M6 · Lesson 05 — Iteration Loop (v3: Lesson Shape pilot · optional depth) */
export const BUILDER_M6_ITERATION_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ التحسين = تعديل واحد كل مرة — مش «غيّر كل حاجة» ولا «امسح وابدأ من الأول».",
        "ليه دلوقتي؟ بعد ما خطّطت الواجهة، أول نسخة من الـ AI مش هتطلع مظبوطة — والدرس ده يعلّمك تصلّحها بأمان.",
        "هتعمل إيه بعد الدرس؟ هتكتب طلب تعديل جراحي واحد — محدد ومضمون النتيجة.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "الواجهة شكلها وحش — تمسح كل حاجة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الـ AI بنالك واجهة، بس الألوان مش ماشية والزرار مش في مكانه. أول رد فعل: «همسح كل ده وأبدأ من الأول».",
        "بس ده أبطأ طريق. كل واجهة محترفة بتاخد ٤–٧ لفات تحسين — مش نسخة واحدة.",
        "السر: تطلب تعديل واحد محدد كل مرة — وتشوف النتيجة قبل ما تطلب التاني.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "تعديل واحد كل مرة — لفة التحسين",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Iteration Loop = ٤ خطوات: اطلب → شوف النتيجة → راجع → عدّل. كل لفة بتقربك للشكل المطلوب.",
        "Surgical Edit = تعديل جراحي: «خلي زرار الإرسال برتقالي #FF6B35 — متغيّرش أي حاجة تانية.»",
        "لو طلبت تعديلات كتير مرة واحدة، الـ AI بيخمّن — وممكن يبوّظ حاجة كانت شغالة (Regression).",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "«غيّرها» vs تعديل جراحي",
    block: {
      kind: "comparison",
      left: {
        label: "غلط — «الواجهة شكلها وحش»",
        body: "الـ AI مش فاهم يعني إيه «وحش». هيخمن ويغيّر حاجات عشوائية — وممكن يبوّظ حاجة شغالة. بعد ساعة الواجهة أسوأ من الأول.",
      },
      right: {
        label: "صح — تعديل واحد محدد",
        body: "«في صفحة الشات، خلي لون زرار «ابعت» برتقالي #FF6B35 والكلام جواه أبيض. متغيّرش أي حاجة تانية.» تعديل محدد = نتيجة مضمونة.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للتحسين",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Iteration (لفة التحسين)",
          meaning: "تجربة → ملاحظة → تصليح → تجربة تاني — لحد ما توصل للهدف.",
          example: "زي الترزي: مقاسات → تعديل → مقاسات تاني لحد ما البدلة تبقى مظبوطة.",
        },
        {
          term: "Regression (تراجع)",
          meaning: "لما تصلّح حاجة فتبوّظ حاجة تانية كانت شغالة كويس.",
          example: "عدّلت حجم الخط في الشات — وفجأة الـ Header اتلغبط.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — ٤ لفات تحسين",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "واجهة بتتولد وبعدين ٤ لفات تحسين لحد ما توصل للشكل المطلوب. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "٤ خطوات — وكل لفة تقرّبك",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: iterationImg,
      alt: "رسمة دائرية فيها 4 خطوات: اطلب -> شوف النتيجة -> راجع -> عدّل",
      caption:
        "اطلب → شوف النتيجة → راجع → عدّل. متستعجلش — أي واجهة محترفة بتاخد لفات. كل لفة = تعديل واحد بس.",
      label: "لفة التحسين",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m6-l5-iteration-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "زرار الدخول لونه أزرق فاتح وعايزه أزرق غامق زي زرار «نسيت الباسورد». إيه أنسب prompt؟",
          options: [
            "«لون زرار الدخول يبقى أزرق غامق #000080 وكبّر الخط لـ ١٦ بيكسل»",
            "«لون زرار الدخول يبقى أزرق غامق #000080»",
            "أمسح الواجهة وأخليه يبنيها من الأول",
          ],
          correctIndex: 1,
          explanation:
            "تعديل واحد بس كل مرة — ده بيضمن نتيجة مضمونة وبيمنع Regression. الخط واللون = طلبين منفصلين.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "اكتب طلب تعديل جراحي آمن",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهارة الحقيقية: تصلّح الغلطات الصغيرة من غير ما تبوّظ اللي شغال.\n\n١٠ دقايق كفاية.",
      prompt:
        "في تسليمك اكتب:\n\n١) الصفحة أو العنصر اللي هتعدّله (مثال: «زرار الإرسال في صفحة الشات»):\n\n٢) إيه اللي عايز تغيّره بالظبط (لون، حجم، مكان — حاجة واحدة بس):\n\n٣) الـ Prompt الجراحي الكامل — جملة أو جملتين:\n\n٤) إيه اللي قلتله «متغيّرش»؟",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "العنصر:\n[صفحة + عنصر]\n\nالتعديل المطلوب:\n[حاجة واحدة محددة]\n\nالـ Prompt:\n«[النص الكامل]»\n\nمتغيّرش:\n[إيه اللي محمي من التغيير]",
      rubric: [
        {
          label: "تعديل جراحي",
          weight: 70,
          criteria: [
            "الـ prompt بيطلب تعديل واحد بس — مش قائمة تعديلات.",
            "محدد العنصر والصفحة — مش «الواجهة كلها».",
          ],
        },
        {
          label: "حماية من Regression",
          weight: 30,
          criteria: [
            "فيه صريح «متغيّرش أي حاجة تانية» أو ما يعادلها.",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت التحسين",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ التحسين = تعديل واحد كل مرة. «غيّر كل حاجة» أبطأ وأخطر من التعديل الجراحي.",
        "تقدر تعمل إيه؟ عندك prompt تعديل آمن — جاهز تطبّقه على أي واجهة.",
        "اللي جاي: Debugging — لو الدنيا بازت، إزاي توصف المشكلة وتعزل السبب قبل ما تصلّح.",
      ],
    },
  },
];
