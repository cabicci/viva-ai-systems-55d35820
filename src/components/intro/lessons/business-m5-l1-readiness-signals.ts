import { Gauge, PlayCircle, Lightbulb, Scale, Rocket, BookOpen, Activity, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

export const BUSINESS_M5_L1_READINESS_SIGNALS_BLOCKS: IntroLessonContent = [
  {
    icon: Gauge,
    eyebrow: "HERO",
    title: "علامات الجاهزية للتوسع",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الشعور بالنمو ≠ الجاهزية للنمو.",
        "٤ علامات لازم تكون موجودة قبل ما تكبّر.",
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
        { term: "Retention (الاستبقاء)", meaning: "قدرتك إنك تحافظ على الزبون وما يروحش لغيرك.", example: "لو الزبائن اللي اشتروا منك السنة اللي فاتت لسه بيشتروا منك النهاردة، يبقى إنت عندك Retention عالي." },
        { term: "SOPs / Playbooks (دليل الشغل)", meaning: "كتالوج فيه خطوات عمل كل حاجة عشان الشغل يمشي صح.", example: "لو الموظف الجديد مش عارف يعمل إيه، بياخد الـ Playbook يقرأه ويمشي وراه خطوة بخطوة." },
        { term: "Bottleneck (عنق الزجاجة)", meaning: "نقطة الاختناق اللي بتعطل الدنيا لما الشغل يزيد.", example: "الطلبات كتير بس المكنة مش ملاحقة، المكنة هنا هي الـ Bottleneck اللي معطلة الأرباح." },
        { term: "Strategic Thinking (التفكير الاستراتيجي)", meaning: "إنك تبص لقدام وتخطط لبعيد مش تحت رجلك بس.", example: "المحاسب بيفكر في قرشه دلوقتي، لكن الاستراتيجي بيفكر إزاي يسيطر على السوق كمان 5 سنين." },
        { term: "Premature Scaling (التوسع المبكر)", meaning: "إنك تكبر المشروع قبل ما يكون أساسك وقواعدك ثابتة.", example: "تفتح فرع تالت وإنت لسه ما ظبطتش حسابات الفرع الأول، فالمشاكل بتكبر وتخسر أكتر." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "إزاي تعرف إنك جاهز فعلًا — مش متحمّس." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "الـ ٤ علامات",
    block: {
      kind: "numberedList",
      items: [
        "الـ System بيشتغل لوحده — لو إنت غبت أسبوع، الشغل ماشي.",
        "النتائج ثابتة شهر بشهر — مش up-and-down.",
        "في طلب أكتر من قدرتك الحالية — السوق بيشدّك.",
        "عندك وقت للتفكير الاستراتيجي — مش بتطفي حرائق.",
        "لو علامة ناقصة → ثبّت الأول، بعدين كبّر.",
      ],
    },
  },
  {
    icon: Activity,
    eyebrow: "شوف بنفسك",
    title: "٤ علامات الجاهزية — افحص نفسك",
    block: {
      kind: "diagram",
      id: "readiness-signals",
      caption: "الحد الأدنى ٦٠٪ في كل علامة قبل ما تكبّر.",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "حماس vs جاهزية",
    block: {
      kind: "comparison",
      left: { label: "FAILURE — توسع بحماس", body: "وظّفت ٣ ناس قبل ما الـ system يثبت. ٦ شهور وأنت بتدرّب وبتطفي مشاكل." },
      right: { label: "RIGHT — توسع بجاهزية", body: "النظام ثابت. الطلب موجود. كل شخص جديد بيضيف قيمة من اليوم الأول." },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "افحص نفسك",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "business-m5-l1-readiness-signals-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "أحمد صاحب مطعم أكل بيتي. بقى له ٦ شهور مبيعاته كل شهر ثابتة تقريبًا ومستقرة، والزبائن بيطلبوا منه يفتح فروع تانية عشان قايمة الانتظار طويلة. أحمد طول الوقت بيطفي حرائق عشان العمال بيغيبوا كتير وهو اللي بيسد مكانهم، ومفيش وقت يفكر إزاي يطور المطعم. إيه اللي ناقص أحمد عشان يكون جاهز يتوسع؟",
          options: [
            "وقت للتفكير الاستراتيجي",
            "النتائج الثابتة",
            "الطلب الزيادة من العملاء"
          ],
          correctIndex: 0,
          explanation: "أحمد معندوش وقت للتفكير الاستراتيجي، لأنه بيصرف وقته في حل مشاكل يومية، وده معناه إن النظام مش شغال لوحده."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "سلمى عندها موقع لبيع منتجات يدوية، وشايفة إن الطلبات بتزيد جامد وفيه زباين كتير مش بتقدر تخدمهم. بس لما بتبص على أرقام المبيعات، بتلاقي شهر المبيعات عالية جداً وشهر بعده المبيعات بتقل النص، وبعدها تزيد تاني. ده معناه إيه؟",
          options: [
            "سلمى جاهزة للتوسع ومحتاجة تبدأ فوراً",
            "سلمى عندها Premature Scaling لو قررت تتوسع دلوقتي",
            "لازم نركز على Bottleneck قبل التوسع"
          ],
          correctIndex: 1,
          explanation: "النتائج اللي مش ثابتة شهر بشهر بتدل على عدم الجاهزية للتوسع، لأن التوسع في الحالة دي هيكبّر المشاكل الموجودة، وده تعريف Premature Scaling."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "مريم عندها شركة برمجة صغيرة، وفي الفترة الأخيرة جالها عروض شغل كتير أكتر بكتير من قدرة فريقها الحالي. فريقها بيخلص الشغل المطلوب منهم بكفاءة عالية، وبيقدروا يديروا نفسهم من غير تدخل مريم إلا في القرارات المهمة. ده معناه إن مريم عندها:",
          options: [
            "علامات الجاهزية للتوسع كلها متوفرة",
            "الـ Bottleneck هو اللي منع التوسع",
            "ناقصها طلب أكتر من قدرتها الحالية"
          ],
          correctIndex: 0,
          explanation: "مريم عندها نظام شغال لوحده (الفريق بيدير نفسه)، نتائج ثابتة (بيخلصوا الشغل بكفاءة)، طلب أكتر من قدرتها (عروض شغل كتير)، وعندها وقت للتفكير الاستراتيجي (بتتدخل في المهم بس). ده معناه إن علامات الجاهزية كلها موجودة."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "حدّد إنت جاهز تتوسّع ولا لسّه",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "التوسّع قبل الجاهزية بيقتل المنشأة. راجع ٥ علامات وقرّر بصراحة فين إنت.",
      prompt:
        "في تسليمك اكتب:\n\n١) System موثّق (SOPs/playbooks موجودة) — نعم/لا + دليل:\n٢) Cashflow موجب آخر ٣ شهور — نعم/لا:\n٣) عميل بيرجع بنفسه (Retention > %X) — رقمك:\n٤) Process بيشتغل بدونك يومين متتاليين — نعم/لا:\n٥) القرار: تتوسّع / تأجّل / تصلّح أولًا — وليه:",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "صدق التقييم",
          weight: 70,
          criteria: [
            "كل علامة عليها إجابة مبنية على دليل/رقم.",
            "مفيش تجاوب مبالغ في التفاؤل.",
          ],
        },
        {
          label: "قرار صريح",
          weight: 30,
          criteria: [
            "في قرار واضح من التلاتة + سبب.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "metrics بنراجعها قبل أي expansion",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "metrics بنراجعها قبل أي expansion",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Business — نفس اللي بتتعلمه. قبل ما نضيف مسار جديد أو feature كبير، بنشوف ٣ أرقام: retention أعلى من 60%؟ completion rate أعلى من 50%؟ بدون errors متكررة في /build-logs؟ لو لأ، بنأجّل الـ expansion.",
      bullets: [
        "Retention 30/60/90 days كلهم في /analytics.",
        "Top 3 errors لو > 50/week، نوقف feature work.",
        "كل expansion له «pre-flight checklist» في /roadmap.",
      ],
      pathAngle: "business",
      link: { label: "افتح /analytics", href: "/analytics" },
    },
  }
];