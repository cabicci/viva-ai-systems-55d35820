import {
  AlertCircle,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import stepsImage from "@/assets/lessons/intro-m1-l6-learn-without-fear.jpg";

/**
 * Intro · Lesson 06 — اتعلم AI من غير خوف (v2: Tension-First)
 */
export const LEARN_WITHOUT_FEAR_CONTENT: IntroLessonContent = [
  {
    icon: AlertCircle,
    eyebrow: "TENSION",
    title: "الخوف من الـ AI بيأخر ناس كتير أكتر من صعوبة الـ AI نفسه",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "ناس كتير بتقول: أكيد محتاج برمجة، أكيد هبوّظ حاجة، أكيد ده مش ليا.",
        "الحقيقة أبسط: إنت بتكتب كلام عادي، وتشوف الرد، وتعدّل السؤال لو الرد مش مناسب.",
        "الدرس ده مش عن التكنولوجيا. ده عن عقلية التجربة من غير رهبة.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "٤ مصطلحات بس",
    title: "عقلية التعلم اللي محتاجها",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Mindset",
          meaning: "طريقة تفكيرك تجاه التعلم والتجربة.",
          example: "بدل «أنا مش فاهم» تقول «هجرب سؤال أبسط». ",
        },
        {
          term: "Iteration",
          meaning: "تحسين الطلب خطوة خطوة بدل ما تستنى نتيجة مثالية من أول مرة.",
          example: "لو الرد طويل، قول: «اختصره في ٥ نقط». ",
        },
        {
          term: "Safe Practice",
          meaning: "تجارب صغيرة مفيهاش مخاطرة على شغل مهم أو قرار حساس.",
          example: "جرّب على رسالة واتساب قبل ما تستخدمه في عرض رسمي.",
        },
        {
          term: "Feedback Loop",
          meaning: "تشوف النتيجة، تقول إيه اللي ناقص، وتطلب تعديل.",
          example: "«النبرة رسمية زيادة، خليها ودودة». ",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — مش محتاج تبقى تقني",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      url: "/lessons/intro/intro-m1-l6-learn-without-fear.mp4",
      caption: "طريقة بسيطة للتجربة اليومية من غير خوف.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "Quick Win",
    title: "٣ قواعد تكسر الرهبة فورًا",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "١. ابدأ بحاجة صغيرة جدًا: رسالة، تلخيص، فكرة بوست.",
        "٢. متطلبش نتيجة مثالية من أول مرة. اطلب تعديل واحد كل مرة.",
        "٣. استخدمه الأول في حاجات آمنة، وبعد ما تفهمه استخدمه في الشغل الأهم.",
        "الذكاء هنا مش إنك تعرف مصطلحات كتير. الذكاء إنك تجرب وتلاحظ وتعدّل.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "من رهبة لتجربة صغيرة",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: stepsImage,
      alt: "مسار خطوات صغيرة: جرّب، لاحظ، عدّل، كرر، أنجز",
      caption:
        "كل درس خطوة صغيرة. مفيش حاجة هتتكسر لو prompt طلع ضعيف — هتعدله وتتعلم.",
      label: "Learning loop",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "الخوف بيتحل بالفعل مش بالمشاهدة",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — تستنى تفهم كل حاجة الأول",
        body: "تتفرج على شروحات كتير وتفضل خايف تجرب، فالمعرفة تزيد والمهارة تفضل صفر.",
      },
      right: {
        label: "RIGHT — تجربة صغيرة يوميًا",
        body: "Prompt واحد آمن كل يوم. تشوف الرد، تطلب تعديل، وتتعلم من النتيجة.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "اختبر فهمك",
    title: "إيه التصرف الصح؟",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "intro-m1-l6-learn-without-fear-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "ولاء خايفة لأنها مش مبرمجة. تبدأ إزاي؟",
          options: [
            "تدرس برمجة شهر قبل أي تجربة.",
            "تكتب prompt بسيط في مهمة آمنة.",
            "تسيب المجال لأنه تقني قوي.",
          ],
          correctIndex: 1,
          explanation: "البداية هنا باللغة الطبيعية والتجربة الصغيرة، مش البرمجة.",
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "أحمد كتب prompt والرد طلع وحش. يعمل إيه؟",
          options: [
            "يعتبر إن AI مش نافع.",
            "يطلب تعديل محدد: أقصر/أوضح/بنبرة مختلفة.",
            "يمسح الحساب.",
          ],
          correctIndex: 1,
          explanation: "ده اسمه iteration: تحسين خطوة خطوة.",
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "أنسب مهمة لأول تجربة آمنة؟",
          options: [
            "قرار طبي مهم.",
            "رسالة واتساب قصيرة أو تلخيص بسيط.",
            "توقيع عقد من غير مراجعة.",
          ],
          correctIndex: 1,
          explanation: "ابدأ بحاجات قليلة المخاطرة عشان تتعلم بأمان.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "Mission — حوّل خوفك لتجربة",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "اكتب خوفك بصراحة، وبعدها اعمله تجربة صغيرة آمنة تكسره.",
      prompt:
        "في تسليمك اكتب:\n\n١) أكبر خوف عندك من استخدام AI في جملة:\n٢) تجربة صغيرة آمنة اخترتها عشان تكسر الخوف:\n٣) الـ Prompt اللي بعتّه:\n٤) الرد اللي جالك — ملخص في سطرين:\n٥) تعديل واحد طلبته بعد أول رد، ونتيجته كانت إيه؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "تجربة آمنة",
          weight: 70,
          criteria: ["المهمة صغيرة ومفيهاش مخاطرة، والـ prompt اتجرب فعليًا."],
        },
        {
          label: "Iteration",
          weight: 30,
          criteria: ["في تعديل واحد واضح بعد أول رد."],
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "جزء من المنصة",
    title: "تصميم المنصة معمول لتجارب صغيرة",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "كل Mission خطوة صغيرة مش امتحان كبير",
      summary:
        "المنصة متصممة إنك تجرب بسرعة وتغلط بأمان. كل درس فيه مهمة صغيرة عشان تحول الفهم لمهارة بدل ما تفضل في وضع المشاهدة.",
      bullets: [
        "درس قصير → تطبيق صغير → Feedback واضح.",
        "مفيش قفزة ضخمة مرة واحدة.",
        "التقدم بيتبني من تكرار خطوات صغيرة.",
      ],
      pathAngle: "creator",
    },
  },
];
