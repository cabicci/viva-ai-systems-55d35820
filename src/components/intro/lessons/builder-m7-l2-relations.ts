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
import relationsDiagram from "@/assets/lessons/concepts/relations-diagram.jpg";

/** Builder · M7 · Lesson 02 — Relations (v3: Lesson Shape pilot · optional depth) */
export const BUILDER_M8_RELATIONS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ العلاقات بين الجداول بتجاوب على أسئلة حقيقية — زي «محادثات العميل ده» أو «ملفات المستخدم ده».",
        "ليه دلوقتي؟ بعد ما صمّمت الجداول، لازم تربطهم — وإلا البيانات هتبقى كومة والتطبيق هيتلخبط.",
        "هتعمل إيه بعد الدرس؟ هتصمّم علاقة واحد-لكتير (user → محادثات كتير) لتطبيقك.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "الـ AI بينسى مين بيكلمه — أو بيبعت بيانات غلط",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الـ AI بيكلم أحمد وبعدين سارة — وفجأة يبعت لسارة ملخص محادثة أحمد. كارثة خصوصية.",
        "المشكلة: كل المحادثات في كومة واحدة ومفيش وصلة رسمية بين كل محادثة وصاحبها.",
        "الحل: فصل الجداول وربطهم بـ Foreign Key — كل حاجة مربوطة بصاحبها.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "العلاقات بتجاوب على أسئلة حقيقية",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بدل جدول واحد فيه كل حاجة — جدولين: `users` و `conversations`. كل محادثة فيها `user_id` بيشاور على صاحبها.",
        "One-to-Many (واحد لكتير): عميل واحد → محادثات كتير. كل محادثة ليها صاحب واحد بس.",
        "السؤال «هات محادثات العميل ٥» = علاقة. من غيرها، المخزن مش هيعرف يجاوب.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "كومة واحدة vs فصل وربط",
    block: {
      kind: "comparison",
      left: {
        label: "غلط — كل حاجة في جدول واحد",
        body: "`محادثات(اسم_العميل, ايميل, رسالة)`. العميل غيّر اسمه؟ تلف على كل رسايله. غلط في حرف؟ السيستم يفتكره عميل جديد.",
      },
      right: {
        label: "صح — جدولين مربوطين",
        body: "`users(id, name)` و `conversations(id, user_id, message)`. غيّر الاسم في مكان واحد. كل محادثة مربوطة بـ `user_id`.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للربط",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Foreign Key (مفتاح أجنبي)",
          meaning: "عمود في جدول بيشاور على `id` في جدول تاني — الوصلة بينهم.",
          example: "`conversations.user_id` → `users.id`",
        },
        {
          term: "One-to-Many (واحد لكتير)",
          meaning: "صف واحد في جدول أ → صفوف كتير في جدول ب.",
          example: "عميل واحد → محادثات كتير. كل محادثة لصاحب واحد.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — ربط الجداول عمليًا",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي تبني علاقة user-to-many عشان التطبيق يعرف مين صاحب كل بيانات. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "الوصلة بين الجداول",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: relationsDiagram,
      alt: "رسمة بتوضح 3 جداول: users و posts و comments، مربوطين بوصلات زي user_id و post_id",
      caption:
        "تخيّل `users` = العملا و `posts` = المحادثات. `posts.user_id` = الوصلة اللي بتقول مين صاحب المحادثة. من غيرها، التطبيق أعمى.",
      label: "شكل العلاقات",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m7-l2-relations-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "كل عميل (`user`) عنده محادثات كتير (`conversations`). لو العميل مسح حسابه، إيه أأمن حاجة تحصل لمحادثاته؟",
          options: [
            "المحادثات تتمسح معاه (Cascade Delete) — عشان خصوصيته.",
            "المحادثات تفضل موجودة بس `user_id` يبقى فاضي.",
            "السيستم يرفض يمسح العميل طول ما عنده محادثات.",
          ],
          correctIndex: 0,
          explanation:
            "Cascade Delete بيحمي خصوصية العميل — مفيش بيانات حساسة تفضل بعد ما يمشي.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "صمّم علاقة user-to-many",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "تطبيقك فيه مستخدمين وكل مستخدم عنده حاجات كتير (محادثات، ملفات، مهام...). صمّم العلاقة.\n\n١٠ دقايق كفاية.",
      prompt:
        "في تسليمك اكتب:\n\n١) جدول الـ «واحد» (مثال: `users`):\n   - إيه اللي بيمثّله؟\n\n٢) جدول الـ «كتير» (مثال: `conversations`):\n   - إيه اللي بيمثّله؟\n\n٣) اسم العمود اللي هتزوده في جدول «كتير» عشان تربطه:\n   - الاسم (مثال: `user_id`):\n   - بيشاور على إيه في جدول «واحد»؟\n\n٤) لما الـ user يتمسح — المحادثات/الملفات تتحصل إزاي؟ ولِيه؟",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "جدول «واحد»:\n[اسم] — [إيه بيمثّل]\n\nجدول «كتير»:\n[اسم] — [إيه بيمثّل]\n\nعمود الربط:\n[اسم العمود] → [جدول واحد].[id]\n\nعند الحذف:\n[Cascade / Restrict / Set null] — [لِيه]",
      rubric: [
        {
          label: "تصميم العلاقة",
          weight: 70,
          criteria: [
            "فيه عمود زي `user_id` في جدول «كتير».",
            "العمود بيشاور على `id` في جدول «واحد».",
            "وضّحت إنها One-to-Many.",
          ],
        },
        {
          label: "قرار الحذف",
          weight: 30,
          criteria: [
            "اختارت سلوك عند مسح الـ user (Cascade أو غيره).",
            "السبب منطقي — خصوصية أو حماية بيانات.",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت الربط",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ العلاقات بتجاوب على أسئلة حقيقية. `user_id` = الوصلة اللي بتمنع الفوضى والتلخبط.",
        "تقدر تعمل إيه؟ عندك علاقة user-to-many مصمّمة — جاهزة تسأل المخزن أسئلة محدّدة.",
        "اللي جاي: Queries — إزاي تسأل المخزن سؤال واضح وتجيب بياناتك بسرعة.",
      ],
    },
  },
];
