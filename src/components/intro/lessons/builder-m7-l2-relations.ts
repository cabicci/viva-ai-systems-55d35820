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
    eyebrow: "بعد الدرس ده هتقدر",
    title: "تربط بيانات العميل ببعضها صح",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بعد الدرس هتعرف إزاي تربط كل عميل بمحادثاته مع الـ AI من غير تكرار.",
      ],
    },
  },
  {
    icon: Sparkles,
    eyebrow: "المشكلة",
    title: "الـ AI بتاعك بينسى مين بيكلمه",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "تخيل الـ AI بتاعك بيكلم عميل اسمه 'أحمد'، وبعدها بثانية بيكلم عميلة اسمها 'سارة'. فجأة، الـ AI يتلخبط ويبعت لسارة ملخص محادثته مع أحمد.",
        "دي كارثة خصوصية ممكن تدمر سمعة تطبيقك. المشكلة إن كل المحادثات مرمية في كومة واحدة، والـ AI مش عارف ينسب كل محادثة لصاحبها.",
        "المشكلة دي بتحصل لما البيانات تكون مفككة ومفيش وصلات رسمية بينهم. الحل في حاجة اسمها العلاقات (Relations)، اللي بتربط كل حاجة بصاحبها.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "جرّب دلوقتي",
    title: "شوف الفرق: كومة واحدة vs. دواليب مترتبة",
    block: {
      kind: "comparison",
      left: {
        label: "غلط — كله في جدول واحد",
        body: "جدول واحد فيه: `محادثات(اسم_العميل, ايميل_العميل, رسالة_العميل, رد_الAI)`. لو العميل غيّر اسمه، لازم تلف على كل رسايله القديمة وتغيرها. ولو غلطت في حرف في اسمه في رسالة واحدة، السيستم هيفتكره عميل جديد. فوضى.",
      },
      right: {
        label: "صح — فصل وربط بذكاء",
        body: "دولابين (جدولين) نضاف: `عملا(id, الاسم, الايميل)` و `محادثات(id, عميل_id, الرسالة)`. دلوقتي لو العميل غيّر اسمه، هتغيره في مكان واحد بس. وكل محادثاته مربوطة بيه عن طريق `عميل_id`. كده الـ AI بتاعك بقى منظم ومستحيل يتلخبط.",
      },
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "المصطلح الوحيد",
    title: "الوصلة السحرية: الوصلة بين دولابين",
    block: {
      kind: "concepts",
      items: [
        {
          term: "الوصلة بين دولابين (Foreign Key)",
          meaning: "ده عمود في دولاب (جدول) بنحط فيه رقم الـ ID بتاع حاجة من دولاب تاني، عشان نربطهم ببعض.",
          example: "زي ما بنكتب `user_id` على كل محادثة. ده بيخلينا نعرف المحادثة دي بتاعة أنهي عميل بالظبط. الوصلة دي هي اللي بتمنع الـ AI بتاعك يبعت محادثات عميل لعميل تاني بالغلط."
        },
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "الفكرة",
    title: "أشهر وصلة هتحتاجها للـ AI بتاعك",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أكتر علاقة هتقابلك هي **واحد لـ كتير (One-to-Many)**: العميل الواحد عنده محادثات كتير مع الـ AI، بس كل محادثة ليها صاحب واحد بس. دي أساس أي تطبيق AI شخصي.",
        "فيه أنواع تانية برضه:",
        "👤 **واحد لـ واحد (One-to-One):** زي إن كل عميل ليه `profile_settings` واحدة بس.",
        "👥 **كتير لـ كتير (Many-to-Many):** لو عندك AI بيحلل مقالات، والمقالة ممكن يكون فيها `tags` كتير (زي 'رياضة')، والـ tag الواحد ممكن يكون في مقالات كتير.",
        "💡 **نصيحة أمان:** لما عميل يمسح حسابه، إيه اللي يحصل لمحادثاته مع الـ AI؟ لازم تقول للمخزن الذكي: **امسحهم مع بعض (Cascade Delete)** عشان تحافظ على خصوصيته ومتسيبش أي داتا وراك.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "شكل الوصلات دي إيه في الحقيقة؟",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: relationsDiagram,
      alt: "رسمة بتوضح 3 جداول: users و posts و comments، مربوطين بوصلات زي user_id و post_id",
      caption:
        "بص على الرسمة دي. تخيل `users` هما العملا بتوعك، و`posts` هي المحادثات بتاعتهم مع الـ AI. شايف `posts.user_id`؟ دي **الوصلة بين الدولابين** اللي بتقولنا مين صاحب المحادثة دي. من غيرها، الـ AI بتاعك هيبقى أعمى، مش عارف بيكلم مين.",
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
      caption: "شرح عملي إزاي تبني الوصلات دي عشان الـ AI بتاعك يفتكر كل عميل لوحده.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اختبر فهمك في دقيقة",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m7-l2-relations-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "بتبني AI بيساعد الناس تكتب إيميلات. كل عميل (`user`) عنده إيميلات كتير (`emails`) كتبها بمساعدة الـ AI. لو عميل قرر يمسح حسابه، إيه أأمن حاجة تحصل للإيميلات اللي الـ AI ساعده فيها؟",
          options: [
            "الإيميلات بتاعته تتمسح معاه (يمسحوا مع بعض) عشان خصوصيته.",
            "الإيميلات تفضل موجودة بس الوصلة اللي بتربطها بالعميل تبقى فاضية.",
            "السيستم يرفض يمسح العميل طول ما لسه عنده إيميلات."
          ],
          correctIndex: 0,
          explanation: "الصح هو إن الإيميلات تتمسح معاه (ON DELETE CASCADE). ده بيحمي خصوصية العميل وبيضمن إن مفيش أي بيانات حساسة تفضل في السيستم بعد ما يمشي. ده تصرف مسؤول بيخلي العملا يثقوا في تطبيقك."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "في تطبيق RAG (AI بيقرأ ملفاتك)، العميل بيرفع ملفات كتير، والملف الواحد ملك لعميل واحد. عشان تعرض للعميل كل ملفاته بسرعة أول ما يفتح، إيه أهم حاجة تعملها في دولاب الـ `documents`؟",
          options: [
            "أعمل فهرس عشان السرعة (Index) على عمود `user_id`.",
            "أعمل فهرس على عمود اسم الملف `file_name`.",
            "مش محتاج أعمل حاجة، المخزن الذكي سريع لوحده."
          ],
          correctIndex: 0,
          explanation: "لما بتسأل المخزن سؤال متكرر زي 'هات كل ملفات العميل رقم 5'، عمل فهرس (Index) على `user_id` بيخليه يلاقي الإجابة في جزء من الثانية بدل ما يدور في كل الملفات واحد واحد. ده الفرق بين تطبيق سريع وتطبيق بطيء."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "عندك AI بيصنف صور. فيه دولاب للصور `images` ودولاب للتصنيفات `categories` (قطط، كلاب). كل صورة ليها تصنيف واحد. لو جيت تمسح تصنيف 'قطط' ولسه فيه 1000 صورة تحته، إيه اللي المفروض المخزن الذكي يعمله عشان ميحصلش كارثة؟",
          options: [
            "يمسح كل صور القطط مع التصنيف.",
            "يرفض يمسح التصنيف ويقولك 'مينفعش، لسه فيه صور هنا'.",
            "يخلي تصنيف الصور دي فاضي (NULL)."
          ],
          correctIndex: 1,
          explanation: "أكيد مش عايزين نمسح صور العملا! أأمن حاجة هنا هي المنع (ON DELETE RESTRICT). ده بيجبرك الأول تنقل الصور دي لتصنيف تاني (مثلاً 'حيوانات أليفة') قبل ما يسمحلك تمسح التصنيف القديم. ده بيحميك من غلطات ممكن تبوظ الداتا."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "المهمة",
    title: "صمم ذاكرة الـ AI بتاعك",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "الـ AI بتاعك بيساعد المبرمجين يكتبوا كود. عشان يبقى ذكي بجد، لازم يفتكر كل الأكواد اللي كل مبرمج كتبها. مهمتك تصمم العلاقة دي.",
      prompt:
        "عندك دولاب `developers` ودولاب `code_snippets`. المبرمج الواحد بيكتب أكواد كتير، والكود الواحد كاتبه مبرمج واحد. إزاي هتربطهم ببعض؟\n\nفي تسليمك، قول اسم العمود اللي هتزوده في دولاب `code_snippets` عشان تربطه بدولاب `developers`، وقول وظيفته إيه.",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "تصميم الوصلة صح",
          weight: 70,
          criteria: [
            "قلت إننا هنزود عمود زي `developer_id` في جدول `code_snippets`.",
            "وضحت إن العمود ده هيبقى (Foreign Key) بيشاور على الـ `id` بتاع المبرمج.",
          ],
        },
        {
          label: "الشرح واضح",
          weight: 30,
          criteria: [
            "شرحت إن الوصلة دي هي اللي بتخلينا نعرف مين صاحب كل كود.",
            "وضحت إن دي علاقة 'واحد لـ كتير' (One-to-Many).",
          ],
        },
      ],
    },
  },
];