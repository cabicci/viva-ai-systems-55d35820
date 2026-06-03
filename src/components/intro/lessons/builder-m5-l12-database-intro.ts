import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  ImageIcon,
  Scale,
  Rocket,
  BookOpen,
  FlaskConical,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import databaseScreenshot from "@/assets/lessons/builder-m5-l12-database-intro.jpg";

/**
 * V2: Builder · M5 · Lesson 03 — Database: مكان البيانات
 *
 * 1. No Theory Without Tension: Starts with the pain of data disappearing when the user closes the tab.
 * 2. Quick Win: The second block shows them their own progress on the platform is live from a database, making it immediately tangible.
 * 3. Example Before Term: Uses the "Excel sheet" analogy before introducing the term "Table" (جدول).
 * 4. One Term Max: Focuses solely on the concept of a "Table" (جدول), removing the long list of 6 technical terms.
 * 5. Simple Mission: The mission is simplified from designing 3 complex tables to just listing the columns for one simple table, making it a ~5-minute task.
 * 6. Egyptian Dialect: All text converted to pure Cairo Ammiya.
 * 7. No Repetition: Redundant explanations of "what is a database" are merged and removed.
 * 8. Momentum: The lesson flows from a problem, to a quick win, to a core concept, to a simple mission.
 */
export const BUILDER_M5_DATABASE_INTRO_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "المشكلة",
    title: "تطبيقك اشتغل تمام... لحد ما اليوزر قفل الـ tab",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "تخيل عملت تطبيق To-Do List. اليوزر دخل، كتب 10 مهام، وقفل المتصفح وهو مبسوط.",
        "لما فتح تاني يوم، لقى القايمة فاضية. كل شغله اتمسح. ليه؟",
        "لأن البيانات كانت متخزنة في ذاكرة مؤقتة (RAM). زي ما تكون كتبت حاجة على سبورة بتتمسح لوحدها. إحنا محتاجين دفتر يتكتب فيه وميتمسحش.",
        "الدفتر ده هو الـ Database.",
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "جرّب دلوقتي",
    title: "بص على تقدمك دلوقتي. ده مش سحر",
    tone: "accent",
    block: {
      kind: "screenshot",
      src: databaseScreenshot,
      alt: "صفحة الداش بورد في Lovable، بتعرض إحصائيات التقدم في المسارات والدروس المكتملة.",
      caption:
        "كل رقم وعلامة صح (✓) شايفها في حسابك مش متخزنة على جهازك. دي عايشة في Database مركزي. لو فتحت من الموبايل هتلاقي نفس الأرقام بالظبط. دي أول علامة تقولك إن فيه Database في الموضوع: بياناتك بتستناك في أي مكان.",
      label: "من حسابك في Lovable",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "الداتابيز = شيت إكسيل سوبر",
    block: {
      kind: "concepts",
      items: [{
      term: "الجدول (Table)",
      meaning:
        "هو المكان اللي بنرص فيه البيانات جوه الداتابيز. تخيله بالظبط زي شيت إكسيل منظم.",
      example:
        "لو عندك شيت لـ\"العملاء\"، هيكون فيه عمود \"للإسم\" وعمود \"للموبايل\". كل صف جديد بتزوده هو عميل جديد. الجدول في الداتابيز نفس الفكرة: أعمدة (Columns) بتحدد نوع البيانات، وصفوف (Rows) فيها البيانات نفسها.",
    }],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "اتفرج وافهم أكتر",
    title: "إيه الفرق بين الداتابيز وملف الإكسيل؟",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption: "ليه الـ RAM مش كفاية، وإمتى تحتاج جدول جديد، وإزاي الداتابيز بتدير ملايين البيانات من غير ما تقع.",
    },
  },
  {
    icon: Scale,
    eyebrow: "غلطة ممكن تقع فيها",
    title: "تخزّن فين؟ في المتصفح ولا في الداتابيز؟",
    block: {
      kind: "comparison",
      left: {
        label: "غلط: أخزّن في المتصفح (localStorage)",
        body: "لو خزنت تقدم اليوزر في المتصفح بتاعه، البيانات هتضيع لو فتح من جهاز تاني، أو مسح الـ cache، أو غير المتصفح. ده مكان للتفضيلات المؤقتة بس، زي الـ Dark Mode.",
      },
      right: {
        label: "صح: أي بيانات مهمة مكانها الداتابيز",
        body: "القاعدة بسيطة: لو المعلومة دي لازم اليوزر يلاقيها بكرة أو على جهاز تاني، يبقى مكانها الداتابيز. التقدم، الرسايل، الإعدادات، الاشتراكات... كل ده لازم يعيش في مكان دائم.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صمم أول جدول في تطبيقك",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "تطبيقك فكرته 'قائمة مهام' (To-Do List). مهمتك دلوقتي تفكر في شكل جدول المهام ده هيكون إيه.",
      prompt:
        "اكتب أسماء الأعمدة (Columns) اللي تفتكر إن جدول `tasks` هيحتاجها عشان يخزن مهمة واحدة. فكّر في 3-4 أعمدة أساسية بس.",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "تحديد الأعمدة الأساسية",
          weight: 70,
          criteria: [
            "فيه عمود لوصف المهمة نفسها (زي task_description).",
            "فيه عمود عشان نعرف المهمة خلصت ولا لأ (زي is_completed).",
            "فيه عمود عشان نربط المهمة باليوزر اللي عملها (زي user_id).",
          ],
        },
        {
          label: "وضوح التفكير",
          weight: 30,
          criteria: [
            "أسماء الأعمدة واضحة وبتوصف اللي جواها.",
            "مفيش أعمدة زيادة مالهاش لازمة في المرحلة دي.",
          ],
        },
      ],
    },
  },
];