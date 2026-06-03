import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import relationsDiagram from "@/assets/lessons/concepts/relations-diagram.jpg";

/**
 * Builder · M8 · Lesson 02 — Relations بين الجداول
 * V2 Editor: Expert Egyptian Learning Experience Designer
 *
 * Rules:
 * 1. No Theory Without Tension: Start with a felt problem.
 * 2. Quick Win in 30s: Second section must be an immediate, tangible result.
 * 3. Sensory Example Before Term: Real-life example precedes jargon.
 * 4. Max One Technical Term: Focus on "Foreign Key".
 * 5. Mission ≤ 10 mins: Simplified to one core task.
 * 6. Pure Egyptian Dialect (Cairo Ammiya).
 * 7. No Repetition: Merged and removed redundant sections.
 * 8. Momentum: Each section feels like progress.
 */
export const BUILDER_M8_RELATIONS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "المشكلة",
    title: "تطبيقك كبر، والـ Excel شيت ضرب منك",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "تخيل عندك تطبيق مطعم. فيه جدول للعملا وجدول للطلبات. فجأة، عميل غيّر رقم تليفونه.",
        "هل هتفضل تدور عليه في كل سطر في جدول الطلبات وتغيره بإيدك؟ ولو نسيت مرة واحدة بس؟ بياناتك كلها باظت.",
        "المشكلة دي بتحصل لما البيانات تكون متكررة ومفيش وصلة رسمية بينهم. الحل في حاجة اسمها العلاقات (Relations).",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "جرّب دلوقتي",
    title: "الغلطة الصح: شوف الفرق بنفسك",
    block: {
      kind: "comparison",
      left: {
        label: "غلط — تكرار البيانات",
        body: "جدول واحد فيه كل حاجة: `طلبات(رقم_الطلب, عنوان_العميل, تليفون_العميل, اسم_العميل, الطلب)`. لو العميل غيّر تليفونه، لازم تعدّل كل طلباته القديمة والجديدة. ولو غلطت في حرف في اسمه في طلب واحد، بقى عندك عميلين في السيستم. كارثة.",
      },
      right: {
        label: "صح — فصل وربط البيانات",
        body: "جدولين: `عملا(id, الاسم, التليفون)` و `طلبات(id, عميل_id, الطلب)`. دلوقتي لو العميل غيّر تليفونه، هتغيره في مكان واحد بس في جدول العملا. وكل طلباته مربوطة بيه عن طريق `عميل_id`. الدنيا بقت أسهل وأنضف.",
      },
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "المصطلح الوحيد",
    title: "الوصلة السحرية: الـ Foreign Key",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Foreign Key (المفتاح الأجنبي)",
          meaning: "عمود في جدول بنسجّل فيه الـ ID بتاع حاجة من جدول تاني عشان نربطهم ببعض.",
          example: "زي رقم الأوردر اللي بيتكتب على كيس الدليفري عشان نعرف إنه بتاعك إنت، مش بتاع حد تاني."
        },
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "الفكرة",
    title: "٣ أنواع علاقات بس — احفظهم زي اسمك",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "1️⃣ **واحد لـ واحد (One-to-One):** كل مواطن ليه رقم قومي واحد بس، والرقم القومي ده بتاع مواطن واحد بس. بنستخدمها لما نحب نفصل بيانات حساسة (زي الباسورد) عن بيانات عامة (زي الاسم والصورة).",
        "2️⃣ **واحد لـ كتير (One-to-Many):** الأم عندها أولاد كتير، بس كل طفل فيهم ليه أم واحدة بس. دي أشهر علاقة، زي `مستخدم` عنده `بوستات` كتير، بس كل بوست كاتبه مستخدم واحد.",
        "3️⃣ **كتير لـ كتير (Many-to-Many):** الممثل الواحد بيشتغل في أفلام كتير، والفيلم الواحد فيه ممثلين كتير. هنا مينفعش نربطهم علطول، لازم نعمل **جدول وسيط** في النص يوصلهم ببعض (جدول اسمه مثلاً `ادوار_الممثلين`).",
        "💡 **نصيحة:** لما تيجي تمسح حاجة، زي مستخدم مثلاً، قاعدة البيانات بتسألك: أعمل إيه في البوستات بتاعته؟ ممكن تقولها امسحيهم معاه (Cascade)، أو متخلنيش أمسحه أصلاً طول ما عنده بوستات (Restrict).",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "شكل الـ Foreign Keys إيه في الحقيقة؟",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: relationsDiagram,
      alt: "رسمة بتوضح 3 جداول: users و posts و comments، مربوطين بـ foreign keys زي user_id و post_id في علاقات one-to-many",
      caption:
        "بص على الرسمة دي. شايف `posts.user_id`؟ ده الـ Foreign Key اللي بيقولنا مين صاحب البوست ده. وشايف `comments.post_id`؟ ده اللي بيقولنا الكومنت ده مكتوب على أنهي بوست. الوصلات دي هي اللي بتدي لتطبيقك قوته.",
      label: "شكل ربط الجداول",
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج عشان تفهم أكتر",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption: "شرح عملي للـ Foreign Keys، وإزاي تبني الـ 3 أنواع علاقات.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اختبر فهمك في دقيقة",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m7-l20-relations-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "شركة 'أكل بيتي' عندها جدول 'شيفات' وجدول 'أكلات'. كل أكلة بيعملها شيف واحد، بس الشيف ممكن يعمل أكلات كتير. لو شيف ساب الشغل ومسحنا حسابه، المفروض يحصل إيه للأكلات اللي عملها؟",
          options: [
            "الأكلات بتاعته تتمسح لوحدها عشان ميبقاش فيه أكلات من غير صاحب.",
            "الأكلات بتاعته تفضل موجودة بس الـ `chef_id` بتاعها يبقى فاضي (NULL).",
            "السيستم يرفض يمسح الشيف ده طول ما لسه عنده أكلات مسجلة باسمه."
          ],
          correctIndex: 0,
          explanation: "دي علاقة واحد لكتير (1:N). لو الشيف (الأب) اتمسح، الأكلات (الأبناء) هتبقى يتيمة. أحسن حل هنا هو ON DELETE CASCADE عشان يضمن إن الأكلات المرتبطة بيه تتمسح معاه، والدنيا تفضل نضيفة."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "في تطبيق كورسات، الطالب ممكن يسجل في كورسات كتير، والكورس فيه طلاب كتير. عشان تجيب كل الكورسات اللي طالب معين مسجل فيها بسرعة، إيه أهم حاجة تعملها في الجدول الوسيط؟",
          options: [
            "أعمل فهرس (Index) على الـ `student_id` عشان البحث يبقى صاروخ.",
            "قاعدة البيانات بتعمل فهرس لوحدها، مش محتاج أعمل حاجة.",
            "أصغّر حجم الجدول الوسيط على قد ما أقدر."
          ],
          correctIndex: 0,
          explanation: "في علاقات كتير-لكتير (N:M)، الجدول الوسيط بنبحث فيه كتير أوي. عشان كده عمل فهرس (Index) على الـ Foreign Keys اللي فيه (زي student_id و course_id) بيخلي أي عملية ربط (JOIN) أسرع بكتير."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "في سيستم مكتبة، عندك جدول 'كتب' وجدول 'تصنيفات' (روايات، علوم، تاريخ). الكتاب ليه تصنيف واحد. لو جيت تمسح تصنيف 'روايات بوليسية' ولسه فيه كتب تحته، إيه أأمن حاجة السيستم يعملها؟",
          options: [
            "يخلي الـ `category_id` بتاع الكتب دي فاضي (NULL).",
            "يرفض يمسح التصنيف ويقولك 'مينفعش، لسه فيه كتب هنا'.",
            "يمسح كل الكتب اللي كانت تحت التصنيف ده معاه."
          ],
          correctIndex: 1,
          explanation: "طبعاً مينفعش نمسح الكتب! الحل الأنسب هنا هو ON DELETE RESTRICT اللي بيمنع مسح التصنيف طول ما فيه كتب مرتبطة بيه. ده بيجبرك الأول تنقل الكتب دي لتصنيف تاني قبل ما تمسح التصنيف القديم."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "المهمة",
    title: "ابنِ علاقة 'ممثلين وأفلام'",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "دلوقتي هتصمم أشهر مثال لعلاقة كتير-لكتير (Many-to-Many). ركز في الجدول اللي في النص.",
      prompt:
        "عندك جدول `actors` وجدول `movies`. إزاي تربطهم عشان تعرف كل ممثل اشتغل في أنهي أفلام، وكل فيلم مين مثّل فيه؟\n\nفي تسليمك، ارسم أو اكتب شكل الجدول التالت (الوسيط) اللي هتحتاجه في النص، وقول إيه الـ columns اللي لازم تكون جواه عشان الربط يشتغل صح.",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "تصميم الجدول الوسيط صح",
          weight: 70,
          criteria: [
            "الجدول فيه عمودين على الأقل: `actor_id` و `movie_id`.",
            "العمودين دول Foreign Keys بيشاوروا على الجدولين الأصليين.",
          ],
        },
        {
          label: "الشرح واضح",
          weight: 30,
          criteria: [
            "شرحت ليه محتاجين الجدول ده أصلاً.",
            "وضحت إن كل سطر في الجدول ده بيمثل 'دور' لممثل في فيلم معين.",
          ],
        },
      ],
    },
  },
];