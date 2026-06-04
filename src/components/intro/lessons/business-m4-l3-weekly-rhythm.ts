import { Calendar, PlayCircle, Lightbulb, Scale, Rocket, BookOpen, MessageSquare, Sparkles } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

/** Business · M4 · Lesson 03 — الإيقاع الأسبوعي = ٤ مسارات */
export const BUSINESS_M2_L2_WEEKLY_RHYTHM_BLOCKS: IntroLessonContent = [
  {
    icon: Calendar,
    eyebrow: "HERO",
    title: "أسبوعك مش ٧ أيام عشوائية — هو ٤ مسارات متوازنة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أحمد بعد ما بنى نظامه، فضل عنده مشكلة: كل أسبوع كان مختلف عن اللي قبله. أسبوع كله مبيعات، أسبوع كله توظيف، أسبوع كله أزمات. كان حاسس إنه شغّال صح، بس مفيش إيقاع.",
        "الإيقاع هو اللي بيفرّق بين بيزنس قوي وبيزنس بيدور في حلقات. لما أحمد قسّم أسبوعه لـ ٤ مسارات ثابتة — Growth، Operations، People، Self — كل مسار خد يوم أو يومين بانتظام.",
        "النتيجة بعد شهرين: مفيش مهمة بتتنسى، مفيش مسار بياكل التاني، وأحمد عرف يقيس تقدّمه أسبوعياً في كل مسار. النهارده هتبني الإيقاع ده لنفسك — قطعة أخيرة في نظام التشغيل بتاعك.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "مصطلحات الدرس",
    title: "اللي هتسمعه في الدرس ده",
    block: {
      kind: "concepts",
      items: [
        { term: "Weekly Rhythm", meaning: "نمط أسبوعي ثابت بيوزّع تركيزك على المسارات الأساسية للبيزنس.", example: "أحمد: السبت Growth، الأحد Operations، الاتنين People، الثلاثا Self." },
        { term: "Growth Track", meaning: "كل اللي بيكبّر البيزنس — تسويق، منتج جديد، علاقات، تحليل أرقام.", example: "أحمد كل سبت يحلّل أرقام الأسبوع ويخطّط لتجربة جديدة." },
        { term: "Operations Track", meaning: "تشغيل اليومي — جودة، فريق، عمليات، تحسين SOPs.", example: "أحمد الأحد يراجع جودة الأكل ويعدّل SOPs لو فيها مشاكل." },
        { term: "People Track", meaning: "كل اللي بيتعلق بالناس — تدريب، تقييم، تحفيز، توظيف.", example: "أحمد الاتنين يقعد ساعة مع كل موظف بدوره." },
        { term: "Self Track", meaning: "إنت — صحتك، تعلّمك، تفكيرك. بدون ده، الباقي بينهار.", example: "أحمد الثلاثا يقرا، يمشي، يفكر بدون بيزنس." },
        { term: "Rhythm Audit", meaning: "مراجعة أسبوعية: هل المسارات الأربعة أخدت حقها؟", example: "أحمد كل خميس يشوف: هل خصصت وقت كافي لكل مسار؟" },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "إزاي تخلّي أسبوعك إيقاع منتظم بدل ما يكون فوضى." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "الـ ٤ مسارات اللي لازم أسبوعك يلمسهم",
    block: {
      kind: "numberedList",
      items: [
        "Growth — البيزنس بيكبر إزاي؟",
        "Operations — البيزنس بيشتغل إزاي يومياً؟",
        "People — الناس اللي معاك بيتطوّروا إزاي؟",
        "Self — إنت بتتجدّد إزاي؟",
      ],
    },
  },
  {
    icon: MessageSquare,
    eyebrow: "الـ Prompt القاتل",
    title: "Weekly Rhythm Designer",
    tone: "accent",
    block: {
      kind: "rule",
      statement: "\"عندي بيزنس [اوصفه] وأسبوعي ٦ أيام شغل. صمّم لي Weekly Rhythm بـ ٤ مسارات (Growth, Operations, People, Self). لكل يوم في الأسبوع، حدّد المسار الرئيسي، وأهم ٣ مهام تقترحها فيه. خلّي الـ Self مش أقل من يوم كامل أو ٤ ساعات أسبوعياً.\"",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "أسبوع عشوائي vs أسبوع بإيقاع",
    block: {
      kind: "comparison",
      left: { label: "FAILURE — عشوائي", body: "أحمد يصحى ويسأل \"إيه أكتر حاجة عاجلة؟\" والإجابة بتحدّد يومه. النتيجة: Growth بياخد ١ يوم في الشهر، Self بياخد صفر، People بيتنسى." },
      right: { label: "RIGHT — إيقاع", body: "أحمد عارف من أول الأسبوع: السبت Growth، الأحد Operations، الاتنين People، الثلاثا Self. كل مسار بياخد حقّه. مش بيتنسى. البيزنس متوازن." },
    },
  },
  {
    icon: Rocket,
    eyebrow: "Build Along — قطعتك في الـ Business OS",
    title: "صمّم Weekly Rhythm ونفّذه أسبوع",
    tone: "accent",
    block: {
      kind: "executionTask",
      title: "ده آخر قطعة في الـ Business OS بتاعك. بعد ما تركّبها، النظام مكتمل.",
      steps: [
        "افتح AI. الصق الـ Prompt القاتل وعبّيه ببياناتك.",
        "خد الـ Rhythm اللي طلعلك واكتبه في الكالندر — كل يوم بمساره ومهامه.",
        "في الـ ٤ مسارات، خلّي Self مش أقل من يوم كامل (أو ٤ ساعات موزّعة).",
        "نفّذ الأسبوع كامل بالـ Rhythm.",
        "في آخر الأسبوع، اعمل Rhythm Audit: كل مسار خد حقّه ولا في مسار اتعدى عليه؟",
        "عدّل الـ Rhythm للأسبوع الجاي بناءً على الـ Audit.",
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اختبر فهمك",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "business-m2-l2-weekly-rhythm-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "أحمد عمل Rhythm: ٥ أيام Operations + يوم Growth + صفر Self. التشخيص؟",
          options: [
            "ممتاز — التشغيل أهم حاجة.",
            "خطر — مفيش Self هيعمل burnout، ومسار Growth ضعيف هيوقف النمو.",
            "عادي — هي بداية.",
          ],
          correctIndex: 1,
          explanation: "Rhythm بدون Self = قنبلة موقوتة. كل صاحب بيزنس بينهار بعد ٦-١٢ شهر بدون Self time. وGrowth يوم واحد مش كافي لبيزنس عايز ينمو. التوازن هو السرّ، مش التركيز على مسار واحد."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "اليوم People في Rhythm أحمد، بس فيه أزمة في الـ Operations. إيه الصح؟",
          options: [
            "يلغي People ويهتم بالأزمة.",
            "يخصّص ساعة للأزمة (الحد الأدنى)، ويكمل People زي ما هو.",
            "يبدّل اليومين — يعمل Operations النهارده وPeople بكره.",
          ],
          correctIndex: 1,
          explanation: "الإيقاع لو اتكسر مرة، هيتكسر كل أسبوع. الأزمات هتفضل موجودة. الحل: حل الأزمة في الحد الأدنى من الوقت، وكمل المسار اللي مخطّطله. لو الأزمة كبيرة فعلاً (نار، صحة) — استثناء، مش قاعدة."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "بعد شهر من الـ Rhythm، أحمد لقى إن Growth أكتر مسار بيتأجل. السبب الأكثر احتمالاً؟",
          options: [
            "الـ Rhythm غلط من أوله.",
            "Growth مش عاجل، فبيتأكل من الـ Operations العاجل دايماً — محتاج Strategic Block محمي.",
            "Growth مش مهم.",
          ],
          correctIndex: 1,
          explanation: "Growth = important but not urgent. الـ Operations = urgent. اللي مش عاجل بياكله العاجل دايماً. الحل: حماية يوم Growth بنفس صرامة الـ Strategic Block — مش حد يقاطع، مش ميعاد يتبدّل."
        }
      ]
    },
  },
  {
    icon: Sparkles,
    eyebrow: "Mission",
    title: "نفّذ Weekly Rhythm كامل أسبوع",
    tone: "accent",
    block: {
      kind: "mission",
      intro: "الـ Rhythm مش نظرية — هو ممارسة. الأسبوع ده اختبار حقيقي.",
      prompt: "في تسليمك اكتب:\n\n١) الـ Weekly Rhythm كامل (٦ أيام × مسار × أهم ٣ مهام).\n٢) صورة من الكالندر بعد ما حطيته.\n٣) في آخر الأسبوع: كل مسار خد كم ساعة فعلاً؟\n٤) أكبر تحدي في الالتزام بالـ Rhythm — وإزاي تعاملت.\n٥) تعديل واحد للأسبوع الجاي.",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "Rhythm متوازن",
          weight: 50,
          criteria: [
            "الـ ٤ مسارات ظاهرة، مش مسار طاغي.",
            "Self مش أقل من ٤ ساعات.",
          ],
        },
        {
          label: "تنفيذ حقيقي",
          weight: 50,
          criteria: [
            "في تتبع فعلي للساعات لكل مسار.",
            "في تأمل واضح في التحدي والتعديل.",
          ],
        },
      ],
    },
  },
];
