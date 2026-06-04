import { Clock, PlayCircle, Lightbulb, Scale, Rocket, BookOpen, Timer, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

export const BUSINESS_M2_L1_REACTIVE_VS_PROACTIVE_BLOCKS: IntroLessonContent = [
  {
    icon: Clock,
    eyebrow: "HERO",
    title: "Reactive vs Proactive",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بتبدأ يومك بالرسائل = Reactive. الناس بتحدد يومك.",
        "بتبدأ بأهم مهمة = Proactive. إنت بتحدد يومك.",
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
        { term: "Deep Work", meaning: "شغل بتركيز عالي من غير تشتيت ولا موبايل عشان تنجز المهمة الصعبة.", example: "زي لما المحاسب يسيب التليفون ساعة ويركز بس في مراجعة ميزانية السنة عشان ميغلطش." },
        { term: "AI (Claude/GPT)", meaning: "برامج ذكية زي شات جي بي تي، بتفهمك وتنفذ طلباتك كأنها بني آدم." },
        { term: "Prompt Tag / Prompt", meaning: "الطلب أو الأمر اللي بتكتبه للذكاء الاصطناعي عشان يطلعلك النتيجة اللي عاوزها.", example: "المسوق اللي بيكتب للشات جي بي تي: \"اكتب لي بوست فيس بوك لبيع شنط لستات البيوت\"." },
        { term: "Ritual", meaning: "عادتك الثابتة أو \"الروتين\" اللي بتبدأ بيه يومك عشان تجهز للشغل.", example: "تاجر بيشرب قهوته ويفتح الدفتر يكتب أهم 3 حاجات هيعملهم قبل ما يرد على الزباين." },
        { term: "Reactive Mode", meaning: "إنك تكون رد فعل للي بيحصل ومستني الشغل هو اللي يسوقك." },
        { term: "Proactive Mode", meaning: "إنك تاخد الخطوة وتخطط ليومك وتتحكم في وقتك قبل ما أي حاجة تشغلك." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "إزاي تبدأ يومك Proactive حتى لو شغلك مليان رسائل." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "روتين الصبح مع AI — ٥ دقائق",
    block: {
      kind: "numberedList",
      items: [
        "افتح AI (Claude/GPT) قبل WhatsApp.",
        "Prompt: «عندي المهام دي: [اكتبهم]. رتّبلي الأولويات وقولي ابدأ بإيه».",
        "ابدأ بأهم مهمة — ساعة كاملة من غير رسائل.",
        "افتح الرسائل بعد ما تخلّص أول مهمة مهمة.",
        "قاعدة: أهم مهمة الأول — الرسائل بتستنى مش الفرصة.",
      ],
    },
  },
  {
    icon: Timer,
    eyebrow: "شوف بنفسك",
    title: "نفس اليوم — توزيعين مختلفين",
    block: {
      kind: "diagram",
      id: "reactive-vs-proactive-day",
      caption: "Reactive: ٨ ساعات ردود · Proactive: Deep Work الأول، الرسائل بعدين.",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "يوم Reactive vs Proactive",
    block: {
      kind: "comparison",
      left: { label: "FAILURE — يوم Reactive", body: "في المساء تعبان ومش خلّصت حاجة مهمة. ٨ ساعات في الردود." },
      right: { label: "RIGHT — يوم Proactive", body: "ساعة Deep Work الأول. باقي اليوم في الرسائل والاجتماعات. في الآخر = إنجاز فعلي." },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "صمّم يومك بكرة",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "business-m2-l1-reactive-vs-proactive-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "صحيت من النوم، فتحت عينك لقيت إشعارات الواتساب والتليجرام مالية الموبايل. قدامك أربعة وعشرين رسالة محتاجة رد ضروري عشان الشغل يمشي، وميلين مهمين لازم تشوفهم. انت كنت عامل خطة امبارح تبدأ بتجهيز العرض التقديمي المهم اللي على مكتبك. لو دخلت في دايرة الرد على الرسائل دي كلها، انت كده بتتصرف بـ:",
          options: [
            "Reactive Mode",
            "Proactive Mode",
            "Deep Work"
          ],
          correctIndex: 0,
          explanation: "لما تبدأ يومك بالرد على الرسايل والإشعارات، كده انت بتسيب الناس التانية تحدد يومك وطاقتك، وبتردّ على اللي موجود بدل ما تنفّذ خطتك."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "قبل ما تنام، قررت إن أهم مهمة لبكرة الصبح هي كتابة المسوّدة الأولى لمقترح المشروع الجديد. وظبطت المنبه تصحى ساعة بدري عن معاد الشغل المعتاد. أول ما صحيت، فتحت اللابتوب وبدأت تكتب في المقترح من غير ما تفتح أي سوشيال ميديا أو ترد على رسايل. التصرف ده بيوصف إيه بالظبط؟",
          options: [
            "Reactive Mode",
            "Proactive Mode",
            "تضييع وقت"
          ],
          correctIndex: 1,
          explanation: "لما تبدأ يومك بأهم مهمة انت حددتها لنفسك وكونت ليها خطة من قبلها، ده معناه إنك بتتحكم في يومك وبتنفّذ أولوياتك انت."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "مهمتك رقم 1 لبكرة هي إنك تخلص جزء كبير من تقرير الشهر. التقرير ده محتاج تركيز عالي. عشان تضمن إنك هتشتغل عليه بتركيز من غير مقاطعات، هتعمل إيه في أول ساعة شغل الصبح؟",
          options: [
            "تفتح الواتساب بسرعة تطمن لو مفيش حاجة مستعجلة وبعدين تبدأ في التقرير.",
            "تبدأ في التقرير على طول ومن غير ما تفتح أي برامج تواصل أو ايميلات.",
            "تفتح الايميل الأول تشوف لو فيه تحديثات مهمة بخصوص التقرير."
          ],
          correctIndex: 1,
          explanation: "أهم حاجة لأداء مهمة محتاجة تركيز عالي (Deep Work) هي إنك تبدأها على طول من غير أي مشتتات زي الرسايل أو الايميلات، عشان تضمن أفضل نتيجة."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صنّف آخر ١٠ قرارات: Reactive vs Proactive",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "لو معظم قراراتك ردود فعل، إنت بتدير حرايق مش بتقود. خد آخر ١٠ قرارات وصنّفهم.",
      prompt:
        "في تسليمك اكتب:\n\n١) قائمة آخر ١٠ قرارات اخدتها (سطر لكل واحد):\n٢) جنب كل قرار صنّفه: Reactive (رد فعل) ولا Proactive (مبادرة):\n٣) النسبة النهائية (مثال: ٧ Reactive / ٣ Proactive):\n٤) أكبر Reactive كان مفروض يبقى Proactive لو…:\n٥) قاعدة/Ritual واحد هتعمله الأسبوع الجاي يقلّل الـ Reactive:",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "تصنيف أمين",
          weight: 70,
          criteria: [
            "الـ ١٠ قرارات مذكورين ومصنّفين.",
            "النسبة مكتوبة بوضوح.",
          ],
        },
        {
          label: "خطّة وقاية",
          weight: 30,
          criteria: [
            "في ritual محدّد للأسبوع الجاي.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "/roadmap = proactive planning، مش reactive",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "/roadmap = proactive planning، مش reactive",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Business — نفس اللي بتتعلمه. بدل ما نشتغل على أول مشكلة بتظهر، عندنا roadmap محدّد فيه phases (A, B, C, D). كل أسبوع بنخطط — مش بنرد. لو حصلت مشكلة طارئة بتدخل phase A، باقي الأسبوع بيتنفّذ زي ما هو.",
      bullets: [
        "Phase A = urgent, Phase D = deferred.",
        "أسبوعنا 70% planned + 30% reactive slack.",
        "كل reactive issue بيتحوّل لـ proactive entry بعد الحل.",
      ],
      pathAngle: "business",
      link: { label: "افتح /roadmap", href: "/roadmap" },
    },
  }
];