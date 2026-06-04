import { Briefcase, PlayCircle, Lightbulb, Scale, Rocket, BookOpen, MessageSquare, Sparkles } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

/** Business · M3 · Lesson 02 — Strategic / Operational / Admin */
export const BUSINESS_M4_L1_STRATEGIC_OPERATIONAL_ADMIN_BLOCKS: IntroLessonContent = [
  {
    icon: Briefcase,
    eyebrow: "HERO",
    title: "كل ساعة بتشتغلها بتنتمي لـ ٣ خانات بس",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أحمد كان بيشتغل ١٤ ساعة في اليوم وحاسس إنه مش بيتقدّم. لما حسبنا معاه: ٩ ساعات إداري (تحويلات، فواتير، ردود)، ٤ ساعات تشغيلي (متابعة الشيفات والطلبات)، وساعة واحدة بس استراتيجي (تفكير في النمو، المنتج، القرارات الكبيرة).",
        "الـ ٩ ساعات الإدارية كانت بتقتل بيزنسه — مش لأنها صعبة، لأنها بتاكل عقله. لما رجع البيت ما كانش فيه طاقة يفكّر استراتيجياً.",
        "بعد ما صنّف يومه بالقاعدة دي، أتمت ٧ ساعات إدارية، ودلّع نفسه بـ ٣ ساعات استراتيجي يومياً. النتيجة في شهرين: قرارين كبار غيّروا شكل البيزنس — قرارات مكنش بيلاقي وقت يفكّر فيها أصلاً.",
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
        { term: "Strategic Work", meaning: "شغل بيحدّد اتجاه البيزنس — قرارات، تحليل، علاقات، منتج جديد.", example: "أحمد يفكّر: \"إيه أكتر طبق بربح فيه وإزاي أرفع مبيعاته؟\"" },
        { term: "Operational Work", meaning: "شغل تشغيلي يومي — متابعة الفريق، ضمان جودة، حل مشاكل.", example: "أحمد يراجع جودة الطبخ ويحل شكوى عميل." },
        { term: "Admin Work", meaning: "شغل إداري متكرر — فواتير، تحويلات، تقارير، ردود روتينية.", example: "أحمد يرد على \"إنتو فاتحين امتى؟\" ٥٠ مرة." },
        { term: "Time Audit", meaning: "تتبع كل ساعة شغل لمدة أسبوع وتصنيفها لـ ٣ خانات.", example: "أحمد لقى ٦٤% من وقته admin، ٢٩% operational، ٧% strategic." },
        { term: "Strategic Block", meaning: "وقت محجوز ومحمي للتفكير الاستراتيجي — مش متاح لأي حاجة تانية.", example: "أحمد بقى يحجز ٨-١٠ صباحاً للاستراتيجي بس." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "إزاي تكشف إنك بتغرق في الإداري وتسرق وقت لنفسك تفكّر." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "نسبة الحياة الصحية لصاحب البيزنس",
    block: {
      kind: "numberedList",
      items: [
        "Strategic: ٢٠-٣٠% من وقتك — لو أقل، بيزنسك واقف.",
        "Operational: ٤٠-٥٠% — متابعة فريق وضمان جودة.",
        "Admin: ٢٠-٣٠% بحد أقصى — لو زاد عن كده، إنت موظف عند بيزنسك.",
        "أي خلل في النسب دي = علامة إنك محتاج تأتمت أو تفوّض.",
      ],
    },
  },
  {
    icon: MessageSquare,
    eyebrow: "الـ Prompt القاتل",
    title: "Time Audit Classifier",
    tone: "accent",
    block: {
      kind: "rule",
      statement: "\"دي قايمة كل المهام اللي عملتها الأسبوع اللي فات مع الوقت تقريبياً: [اكتبهم]. صنّف كل واحدة كـ STRATEGIC / OPERATIONAL / ADMIN. احسبلي النسبة المئوية لكل خانة. قارنها بالنسبة الصحية (٢٥/٤٥/٣٠). قولي إيه أكبر خلل وأول ٣ خطوات تصحيح.\"",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "اليوم اللي بيقتل البيزنس vs اليوم اللي بينمّيه",
    block: {
      kind: "comparison",
      left: { label: "FAILURE — يوم admin 70%", body: "أحمد يصحى يفتح الواتساب، يرد ٢ ساعة، يحوّل فلوس للموردين، يطبع فواتير، يجاوب على ١٠ مكالمات. آخر اليوم تعبان ومش متقدّم — بس قال \"شغلت\"." },
      right: { label: "RIGHT — يوم strategic block", body: "أحمد يخصّص ٨-١٠ صباحاً تفكير استراتيجي بدون واتساب. يطلع منهم بقرار أو خطة. الباقي operational وadmin بحدود. آخر اليوم: تقدّم حقيقي." },
    },
  },
  {
    icon: Rocket,
    eyebrow: "Build Along — قطعتك في الـ Business OS",
    title: "اعمل Time Audit لأسبوعك في ١٥ دقيقة",
    tone: "accent",
    block: {
      kind: "executionTask",
      title: "أحمد اكتشف إنه بيصرف ٦٤% من وقته admin. لما عرف الرقم اتغيّر كل شيء. دورك تعرف رقمك إنت.",
      steps: [
        "افتح ورقة أو Sheet. ارجع لآخر ٧ أيام واكتب كل المهام الكبيرة (مش كل دقيقة — التجمعات).",
        "جنب كل مهمة اكتب: الوقت تقريبياً (نص ساعة، ساعة، ساعتين).",
        "افتح AI. الصق الـ Prompt القاتل مع قايمتك.",
        "خد النسبة اللي طلعتلك واكتبها في مكان بتشوفه يومياً.",
        "اختار خانة واحدة (Strategic منخفضة أو Admin مرتفعة) — هي اللي هتشتغل عليها الأسبوع الجاي.",
        "احجز Strategic Block واحد على الأقل في كالندرك (١-٢ ساعة، نفس الميعاد كل يوم).",
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
      lessonId: "business-m4-l1-strategic-operational-admin-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "أحمد عمل audit ولقى: 70% admin، 25% operational، 5% strategic. إيه أول خطوة؟",
          options: [
            "يوظّف ٣ موظفين بسرعة.",
            "يأتمت أكبر ٣ مهام admin متكررة — يخفّض النسبة لـ 30%.",
            "يقلّل عدد ساعات شغله الكلية.",
          ],
          correctIndex: 1,
          explanation: "أتمتة الـ admin أرخص وأسرع من توظيف. تقليل الساعات بدون حل المشكلة هيخلّي الـ admin بنفس النسبة. أكبر مكسب: حرّر الوقت من admin وحوّله للـ strategic — ده اللي بينمّي البيزنس."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "حجزت Strategic Block 9-11 صباحاً. الساعة 9:30 موظف اتصل بمشكلة. تعمل إيه؟",
          options: [
            "ترد فوراً — العميل أهم.",
            "ترفض الاتصال وتقول للموظف \"اتصرف\" أو \"كلّمني الساعة ١١\".",
            "تنهي الاتصال بسرعة وترجع.",
          ],
          correctIndex: 1,
          explanation: "Strategic Block محمي — لو قاطعت نفسك مرة، هيتقاطع كل يوم. التدريب الحقيقي للفريق إنهم يعرفوا يقرروا بدونك في معظم المواقف. لو الموضوع طارئ فعلاً (نار، حادثة) — استثناء، مش قاعدة."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "أحمد لقى نفسه بيقضي ٣ ساعات يومياً ع تحويلات بنكية يدوياً. ده يصنّف إزاي؟",
          options: [
            "Strategic — لأنه فلوس البيزنس.",
            "Operational — لأنه شغل يومي.",
            "Admin — متكرر، روتيني، قابل للأتمتة بالكامل.",
          ],
          correctIndex: 2,
          explanation: "Admin بامتياز. التحويلات لو متكررة بنفس النمط لازم تتأتمت أو تتفوّض. لو أحمد فكّر إنها strategic لأنها فلوس، هيفضل أسير يومه. الفلوس مهمة، الأتمتة بتاعتها هي الـ strategic — مش التنفيذ اليدوي."
        }
      ]
    },
  },
  {
    icon: Sparkles,
    eyebrow: "Mission",
    title: "اعرف نسبتك واحجز أول Strategic Block",
    tone: "accent",
    block: {
      kind: "mission",
      intro: "كل قرار تحسين في بيزنسك بيبدأ بالرقم. اعرف نسبتك دلوقتي.",
      prompt: "في تسليمك اكتب:\n\n١) قايمة المهام بتاعتك آخر ٧ أيام مع الوقت.\n٢) النسبة لكل خانة (Strategic / Operational / Admin).\n٣) أكبر خلل عن النسبة الصحية + سببه بكلامك.\n٤) أول مهمة هتشيلها من حياتك (admin → أتمتة أو تفويض).\n٥) Strategic Block محجوز في الكالندر (التاريخ، الساعة، الموضوع).",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "قياس دقيق",
          weight: 50,
          criteria: [
            "النسب مبنية على قايمة مهام حقيقية مش تقدير من راسك.",
            "في تحليل واضح لسبب الخلل.",
          ],
        },
        {
          label: "خطوة تنفيذية محجوزة",
          weight: 50,
          criteria: [
            "في مهمة محدّدة هتنشال من جدولك.",
            "في Strategic Block محجوز فعلاً بميعاد محدّد.",
          ],
        },
      ],
    },
  },
];
