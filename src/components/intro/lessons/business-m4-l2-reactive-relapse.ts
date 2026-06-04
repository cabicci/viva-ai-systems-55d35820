import { AlertTriangle, PlayCircle, Lightbulb, Scale, Rocket, BookOpen, MessageSquare, Sparkles } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

/** Business · M4 · Lesson 02 — الرجوع لـ Reactive Mode */
export const BUSINESS_M4_L2_REACTIVE_RELAPSE_BLOCKS: IntroLessonContent = [
  {
    icon: AlertTriangle,
    eyebrow: "HERO",
    title: "بنيت نظام، شغل سليم — وبعدين فجأة رجعت تطفي حرايق",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أحمد بنى نظامه. SOPs، أتمتة، Strategic Blocks. شهرين كانت حياته أحسن من أي وقت. وبعدين أزمة — مورد رئيسي فشل، موظف ساب، عميل كبير اشتكى. كل ده في أسبوع.",
        "في خلال أيام، أحمد سيب الـ Strategic Block، سيب الـ SOPs، رجع يرد على الواتساب ٢٤/٧، رجع يطفي كل حريقة بنفسه. \"مؤقتاً\" قال. الـ \"مؤقت\" ده فضل شهرين — لحد ما لاحظ إنه رجع لنفس الحالة قبل ما يبني النظام أصلاً.",
        "الرجوع لـ Reactive Mode مش حدث، هو إدمان. كل أزمة بتسحبك. وكل ساعة بتقضيها تطفي حرايق بتقول لمخك \"ده دوري الحقيقي\". النهارده هتتعلم تكتشف الرجوع بدري وترجّع نفسك للنظام قبل ما تتدمّر.",
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
        { term: "Reactive Mode", meaning: "حالة بتكون فيها بتاكل ردود أفعال على الأحداث طول الوقت بدون خطة.", example: "أحمد بيرد على واتساب، يحل أزمة، ينطفي تليفون، يجري على شيف غاضب — كله نار." },
        { term: "Relapse", meaning: "الرجوع لعادة قديمة بعد ما اتعلمت أحسن.", example: "بعد شهرين strategic، أحمد رجع لـ admin شغل بسبب أزمة." },
        { term: "Crisis Trigger", meaning: "حدث محدد بيخلّيك تنسى النظام وترجع للحرايق.", example: "موظف ساب → أحمد قرّر يعمل شغله بنفسه \"مؤقتاً\"." },
        { term: "Reactive Audit", meaning: "تشيك أسبوعي بسيط: قضيت كم ساعة strategic vs reactive؟", example: "كل سبت، أحمد يحط رقم في الجدول. أي رقم أقل من ١٠ ساعات strategic = إنذار." },
        { term: "System Anchor", meaning: "ميعاد ثابت بيرجعك للنظام مهما حصل — مش قابل للتأجيل.", example: "أحمد بيراجع الـ Time Audit كل سبت ٧ صباحاً، حتى لو في أزمة." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "ليه كل صاحب بيزنس بيرجع لـ Reactive Mode — وإزاي تكتشف بدري." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "٤ علامات بتقولّك إنك رجعت Reactive",
    block: {
      kind: "numberedList",
      items: [
        "Strategic Block اتلغى أو اتنقل أكتر من ٣ مرات في أسبوع.",
        "بترد على واتساب فوراً — مش في ميعاد محدّد.",
        "بتشرح نفس الحاجة لموظفين بدل ما تحوّلهم للـ SOP.",
        "آخر مرة فكّرت في نمو البيزنس كانت من أسبوعين+.",
      ],
    },
  },
  {
    icon: MessageSquare,
    eyebrow: "الـ Prompt القاتل",
    title: "Weekly Reactive Audit",
    tone: "accent",
    block: {
      kind: "rule",
      statement: "\"كل سبت هكلّمك. هقولك: كم ساعة strategic، كم ساعة admin، كم Strategic Block اتلغى، وأكبر أزمة الأسبوع. إنت تقولي: هل أنا في Reactive Relapse؟ على مقياس ١-١٠، إيه الرقم؟ وإيه الـ ٣ خطوات الأسبوع الجاي عشان أرجّع نفسي للنظام؟\"",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "علاج مؤقت vs قاعدة دائمة",
    block: {
      kind: "comparison",
      left: { label: "FAILURE — \"مؤقتاً هرجع\"", body: "أحمد قال \"الأسبوع ده استثناء\". الاستثناء بقى عادة. النظام اتسحب من تحت رجليه في شهرين بدون ما يحس. لما حس، كان صعب يرجع." },
      right: { label: "RIGHT — System Anchor", body: "أحمد حجز سبت ٧ صباحاً كـ Reactive Audit ثابت. حتى لو في أزمة، بيقعد ٣٠ دقيقة بس. ده بينبّهه قبل ما يتعمّق في الـ relapse." },
    },
  },
  {
    icon: Rocket,
    eyebrow: "Build Along — قطعتك في الـ Business OS",
    title: "اعمل System Anchor الأسبوع ده",
    tone: "accent",
    block: {
      kind: "executionTask",
      title: "أحمد بيعمل ده كل سبت ٧ صباحاً. نص ساعة بس. ده بيمنع شهور من الـ relapse.",
      steps: [
        "احجز ميعاد ثابت أسبوعي (٣٠ دقيقة) في الكالندر — اسمه \"Reactive Audit\". اختار وقت مفيش فيه أي حاجة (٧ صباحاً، يوم إجازة).",
        "اكتب الـ ٤ علامات اللي فوق في مكان هتشوفه أثناء الـ Audit.",
        "اعمل جدول بسيط في Notion: التاريخ / Strategic Hours / Admin Hours / علامات Relapse / الرقم من ١-١٠.",
        "في أول Audit، الصق الـ Prompt القاتل في AI وادّيله الأرقام بتاعتك.",
        "خد الـ ٣ خطوات اللي AI اقترحها واكتبها كـ \"خطة الأسبوع الجاي\".",
        "في الـ Audit التاني، قارن — تحسّن ولا اتدهور؟",
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
      lessonId: "business-m4-l2-reactive-relapse-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "موظف ساب الشغل فجأة. مهامه بقت عليك. الأسلوب الصح؟",
          options: [
            "تستلم كل مهامه فوراً لحد ما تلاقي بديل — \"مؤقتاً\".",
            "تحوّل المهام للـ SOPs، خلي شخص من الفريق يتولاها بشكل مؤقت بالـ SOP، وابدأ توظيف فوراً.",
            "توقف المهام دي لحد ما توظّف.",
          ],
          correctIndex: 1,
          explanation: "ده بالظبط الـ Crisis Trigger اللي بيسحبك للـ relapse. لو استلمت بنفسك \"مؤقتاً\"، هتقعد فيها شهور. الـ SOPs بنيتها لده — استخدمها. الموقف ده بالذات هو امتحان النظام، مش استثناء منه."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "Strategic Block بتاعك اتلغى ٤ مرات هذا الأسبوع. تعمل إيه؟",
          options: [
            "تأجل لحد ما تخلص الشغل المتراكم.",
            "تعتبره إنذار أحمر — وقف كل حاجة وحلّل: ليه بيتلغي؟ نفّذ أول خطوة لحماية الـ Block الأسبوع الجاي.",
            "تلغيه نهائياً — مفيش وقت.",
          ],
          correctIndex: 1,
          explanation: "إلغاء Strategic Block ٤ مرات في أسبوع = إشارة كلاسيكية للـ relapse. كل مرة بتلغيه، بتأكد لمخك إن الـ reactive أولى. الحل: ركّز على حماية الـ Block زي ما بتركّز على أزمة — لأنه فعلاً أزمة، بس صامتة."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "آخر ٣ أسابيع، لقّيت نفسك بتشرح نفس الحاجات للموظفين بدل ما تحوّلهم للـ SOPs. السبب الجذري؟",
          options: [
            "الموظفين كسالى ومش بيقرأوا.",
            "الـ SOPs مش محدّثة، أو إنت في relapse وبتلاقي راحة في الشرح اليدوي.",
            "الـ SOPs مش مهمة فعلاً.",
          ],
          correctIndex: 1,
          explanation: "إما النظام محتاج تحديث، أو إنت بتختار اللاوعي ترجع للـ admin مود لأنه مألوف. الاتنين علامات relapse. الحل: حدّث الـ SOPs لو محتاجة، وفي نفس الوقت ادّي نفسك قاعدة: \"السؤال ده اتجاوب في SOP رقم X. شوفه الأول، تعالى لو لسه عندك سؤال.\""
        }
      ]
    },
  },
  {
    icon: Sparkles,
    eyebrow: "Mission",
    title: "احجز System Anchor واعمل أول Audit",
    tone: "accent",
    block: {
      kind: "mission",
      intro: "Reactive Relapse مش لحظة، هو انزلاق. الـ Audit الأسبوعي هو حزام الأمان.",
      prompt: "في تسليمك اكتب:\n\n١) ميعاد الـ System Anchor المحجوز في الكالندر (اليوم والساعة).\n٢) نتيجة أول Reactive Audit: Strategic Hours / Admin Hours / علامات الـ relapse (كم منهم ظهر عندك) / الرقم من ١-١٠.\n٣) أكبر Crisis Trigger في الأسبوع — وإزاي تعاملت معاه.\n٤) الـ ٣ خطوات اللي طلعت من Audit بـ AI للأسبوع الجاي.\n٥) كيف هتمنع نفسك من تأجيل Anchor تاني (الالتزام الذاتي).",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "Anchor محجوز فعلاً",
          weight: 50,
          criteria: [
            "في ميعاد محدّد في الكالندر مش في الراس.",
            "الـ Audit الأول اتعمل بأرقام حقيقية.",
          ],
        },
        {
          label: "وعي بالـ Triggers",
          weight: 50,
          criteria: [
            "في تحليل صادق لأكبر Trigger الأسبوع.",
            "في خطة وقاية واضحة، مش وعد عام.",
          ],
        },
      ],
    },
  },
];
