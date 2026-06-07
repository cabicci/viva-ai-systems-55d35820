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
import firstUsersScreenshot from "@/assets/lessons/builder-m10-l2-first-users.jpg";

/** Builder · M10 · Lesson 02 — First Users (v3: Lesson Shape pilot · Builder capstone) */
export const BUILDER_M10_FIRST_USERS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ ليه أول ١٠ مستخدمين يعلّموك الواقع — أكتر من أي خطة على ورق.",
        "ليه دلوقتي؟ التطبيق live — بس الصمت مريب. محتاج ناس حقيقية تجرب وتقولك الحقيقة.",
        "هتعمل إيه بعد الدرس؟ هتكتب رسالة دعوة + سؤالين هتسألهم بعد التجربة.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "Live — ومفيش حد بيستخدم",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "اللينك شغال. تقنيًا كل حاجة تمام. بس مفيش تسجيلات — مفيش feedback.",
        "بتكتب بوست على فيسبوك وتستنى. ٥٠٠ زائر، ٢٠ يسجّلوا، ومحدش يرجع.",
        "المشكلة مش marketing — المشكلة إنك مش بتسمع من ١٠ ناس تعرفهم بالاسم.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "أول ١٠ مستخدمين يعلّموك الواقع",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أول ١٠ مش للأرقام — للتعلّم. هما اللي يقولولك: ده بيحل مشكلة؟ ولا شكل حلو بس؟",
        "٥–١٠ ناس تعرفهم + مكالمة ١٥ دقيقة كل أسبوع > ١٠٠٠ زائر من إعلان.",
        "Iteration: تسمع → تصلّح مشكلة واحدة → ترجعلهم. بعد شهر — منتج الناس محتاجاه.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "تستنى الزوار vs تسمع ١٠ ناس",
    block: {
      kind: "comparison",
      left: {
        label: "غلط — إطلاق وتستنى",
        body: "بوست عام → زوار → تسجيل → مفيش رجوع. تضيف features جديدة من غير ما تعرف الناس محتاجة إيه.",
      },
      right: {
        label: "صح — ١٠ أوائل + استماع",
        body: "١٠ ناس بالاسم. كل أسبوع ٣ مكالمات: «آخر مرة فتحت لِيه؟» «إيه اللي معرفتش تعمله؟». مشكلة واحدة → تصلّح → ترجعلهم.",
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
          term: "Early Adopters",
          meaning: "الناس اللي مستعدة تجرب وهي لسه نص سوا — وبتصبر على المشاكل.",
          example: "صحابك اللي يجربوا مطعمك أول يوم والإضاءة لسه بتتركّب.",
        },
        {
          term: "Feedback Loop",
          meaning: "تسمع → تعدّل → ترجّع للمستخدم → تسمع تاني. أسرع طريقة للتطور.",
          example: "«المشكلة اللي قلتلي عليها اتحلت» — وترجع تاخد رأيه.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — أول ١٠ من غير marketing",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي تجيب أول مستخدمين وتعرف لو الـ AI بيحل مشكلة حقيقية. لو معندكش وقت، كمل قراية.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "قياس التقدّم — مش للمنظر",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: firstUsersScreenshot,
      alt: "داشبورد بكروت: السلسلة، دروس مكتملة، Introduction — مقاييس تقدّم المستخدم.",
      caption:
        "لما تبني واجهة تطبيقك — فكّر: إزاي المستخدم يشوف إنه بيتقدم؟ الأرقام دي بتحرّك سلوك — مش للمنظر.",
      label: "مثال — داشبورد المستخدم",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m10-l2-first-users-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "بعد ٤ أسابيع: ٤ من ١٠ لسه بيستخدمون التطبيق. إيه القرار الصح؟",
          options: [
            "ترجع تكلم اللي مشيوا واللي كملوا — تفهم المشكلة قبل marketing جديد.",
            "تبدأ إعلانات عشان تجيب ١٠ تانيين.",
            "تستسلم — المنتج فشل.",
          ],
          correctIndex: 0,
          explanation:
            "٤٠٪ retention محتاج فهم — مش كمية جديدة. اسمع الأول، بعدين قرّر.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "رسالة دعوة + ٢ سؤال",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "أول ١٠ بييجوا بمجهودك الشخصي — مش بإعلان.\n\n١٠–١٥ دقيقة.",
      prompt:
        "في تسليمك اكتب:\n\n١) تطبيقك في سطر:\n\n٢) **رسالة الدعوة** — انسخ النص اللي هتبعته لـ ٣ ناس:\n\n٣) **سؤال ١** بعد ما يجربوا:\n\n٤) **سؤال ٢** بعد ما يجربوا:",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "التطبيق:\n[...]\n\nرسالة الدعوة:\n[...]\n\nسؤال ١ (بعد التجربة):\n[...]\n\nسؤال ٢ (بعد التجربة):\n[...]",
      rubric: [
        {
          label: "رسالة واضحة",
          weight: 50,
          criteria: [
            "رسالة قصيرة — تقول إيه التطبيق وتطلب تجربة محددة.",
            "مفيش كلام تسويقي زيادة.",
          ],
        },
        {
          label: "أسئلة مفيدة",
          weight: 50,
          criteria: [
            "سؤالين يطلعوا feedback حقيقي — مش «عجبك؟» بس.",
            "أسئلة عن سلوك فعلي (آخر استخدام، أين اتلخبط).",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت مسار Builder",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ أول ١٠ مستخدمين = معلمين — مش أرقام.",
        "تقدر تعمل إيه؟ عندك رسالة دعوة + سؤالين جاهزين.",
        "عمق Builder (اختياري) خلص — Creator و Automator و Business و Analyst لسه مسارات قيمة تكمل رحلتك.",
      ],
    },
  },
];
