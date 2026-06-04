import { Users, PlayCircle, Lightbulb, Scale, Rocket, BookOpen, FileText, UserCheck } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

/** Business · M3 · Lesson 04 — التوظيف والـ Onboarding بالـ AI */
export const BUSINESS_M3_L4_HIRING_ONBOARDING_BLOCKS: IntroLessonContent = [
  {
    icon: Users,
    eyebrow: "HERO",
    title: "أول موظف بتعيّنه — لو غلط، البيزنس بيتأخّر سنة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أحمد عيّن أول Operations Manager. خد قرار في يومين، Job Description نصف صفحة، interview 20 دقيقة. بعد 3 شهور، الراجل مشي، وأحمد رجع تاني بيشيل كل حاجة بنفسه.",
        "بعد ما اتعلم، رجع تاني للتوظيف — بس المرة دي بالـ AI. كتب JD مفصّل بمساعدة AI، عمل interview script، حضّر onboarding plan كامل قبل أول يوم. الموظف اللي عيّنه بقى منتج من أول أسبوع.",
        "AI مش بيوظّف بدالك — بس بيخليك توظف صح. الفرق بين أحمد القديم والجديد مش في الفلوس، في النظام.",
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
        { term: "Job Description (JD)", meaning: "وصف مفصّل للوظيفة: المسؤوليات، النتايج المطلوبة، المعايير، الـ red flags.", example: "بدل \"محتاج Operations Manager\"، تطلع JD فيه ٥ مسؤوليات + ٣ KPIs + ٣ شروط لازم تتحقق في أول 30 يوم." },
        { term: "Outcome-Based Hiring", meaning: "بتوظف على أساس النتايج اللي محتاجها مش على الـ titles.", example: "مش \"محتاج محاسب\" → \"محتاج حد يقفل حساباتي الشهرية في 3 أيام بدل 10\"." },
        { term: "Interview Scorecard", meaning: "كارت تقييم بمعايير ثابتة لكل candidate — يمنعك تختار بالـ \"feeling\".", example: "٥ معايير، كل واحد من 1-5، بتقارن الـ candidates بالأرقام مش بالانطباع." },
        { term: "Onboarding Plan", meaning: "خطة الـ 30 يوم الأول للموظف الجديد — مكتوبة قبل أول يوم.", example: "اليوم 1-7: فهم النظام. 8-14: shadow. 15-30: ينفّذ بمراجعة. اليوم 31: مستقل." },
        { term: "AI-Augmented Hiring", meaning: "استخدام AI في كل خطوة: كتابة JD، فحص CVs، interview questions، evaluating answers.", example: "بدل أسبوع تجهيز، نص يوم. وكل خطوة أعلى جودة." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "إزاي تعيّن أول موظف صح من المرة الأولى بمساعدة AI." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "٤ خطوات توظيف بالـ AI",
    block: {
      kind: "numberedList",
      items: [
        "اكتب الـ JD بمساعدة AI من الـ Outcomes اللي محتاجها — مش من الـ Title.",
        "وَلّد Interview Questions موجّهة لكل outcome — كل سؤال بيختبر معيار محدد.",
        "اعمل Scorecard ثابت — كل candidate يتقيّم بنفس المعايير.",
        "حضّر Onboarding Plan كامل قبل أول يوم — لازم الموظف يعرف بالظبط هيتعلّم إيه في كل أسبوع.",
      ],
    },
  },
  {
    icon: FileText,
    eyebrow: "الـ Prompt القاتل",
    title: "JD Generator Prompt",
    tone: "accent",
    block: {
      kind: "rule",
      statement: "\"عايز أعيّن [الوظيفة] في [نوع البيزنس]. النتايج المطلوبة في أول 90 يوم: [اذكرهم]. حجم البيزنس: [اذكره]. اكتبلي JD فيه: ١) ٥ مسؤوليات يومية، ٢) ٣ KPIs قابلة للقياس، ٣) ٥ مهارات لازمة + ٣ مفضّلة، ٤) ٣ red flags لازم أشوفهم في الـ interview، ٥) Onboarding Plan لأول 30 يوم.\"",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "توظيف عشوائي vs توظيف بالـ AI",
    block: {
      kind: "comparison",
      left: { label: "FAILURE — توظيف بالـ feeling", body: "JD نصف صفحة. Interview أسئلة عامة. اختيار بالانطباع. أول شهر فوضى — الموظف مش عارف ينفّذ إيه. بعد 3 شهور إما يمشي أو يطرد." },
      right: { label: "RIGHT — توظيف بالـ AI", body: "JD مبني على outcomes. Interview بـ scorecard. Onboarding plan جاهز. الموظف منتج من أول أسبوع. الـ retention أعلى 3 أضعاف." },
    },
  },
  {
    icon: Rocket,
    eyebrow: "Build Along — قطعتك في الـ Business OS",
    title: "اعمل JD + Onboarding Generator بتاعك",
    tone: "accent",
    block: {
      kind: "executionTask",
      title: "هتطلع النهارده بـ 3 templates جاهزين تستخدمهم لأي وظيفة جاية.",
      steps: [
        "افتح Notion/Doc جديد اسمه \"My Hiring System\".",
        "اعمل 3 secs: ١) JD Template، ٢) Interview Scorecard، ٣) Onboarding Plan Template.",
        "خد الـ JD Prompt اللي فوق ووَلّد JD لأول وظيفة محتاجها (حتى لو مش هتعيّن دلوقتي).",
        "وَلّد 5 interview questions لكل KPI من الـ KPIs الـ 3.",
        "اعمل Scorecard من 5 معايير. كل واحد سلم من 1-5 + ملاحظات.",
        "اعمل Onboarding Plan لـ 30 يوم: أسبوع بأسبوع، فيه مهام محددة ومخرجات.",
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
      lessonId: "business-m3-l4-hiring-onboarding-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "صاحبة براند ملابس عايزة تعيّن \"حد يساعدها\". إيه أول حاجة تطلبها من AI؟",
          options: [
            "يكتبلها إعلان توظيف.",
            "يسألها ٥ أسئلة عن النتايج اللي محتاجاها قبل ما يكتب JD.",
            "يقترحلها مرتب.",
          ],
          correctIndex: 1,
          explanation: "\"حد يساعدها\" مش وظيفة. AI الكويس بيرفض يكتب JD قبل ما يفهم الـ outcomes. ممكن تحتاج مساعدة في الشحن، أو في الـ CS، أو في المخزون — كل واحدة وظيفة مختلفة."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "في الـ Interview، عندك 3 candidates. واحد فيهم كاريزما عالية بس مفيش حاجة في الـ Scorecard بتاعه أعلى من 3. التانيين الـ score بتاعهم 4-5. مين تاخد؟",
          options: [
            "صاحب الكاريزما — \"الشخصية مهمة\".",
            "أعلى Scorecard — الأرقام مش بتكدب.",
            "أول واحد قابلته.",
          ],
          correctIndex: 1,
          explanation: "كل ما تختار بالكاريزما والإحساس، كل ما تطلع موظف مش مناسب. الـ Scorecard اتعمل تحديداً عشان يمنعك من الـ bias ده. لو الكاريزما مهمة، لازم تضيفها كمعيار في الـ scorecard من الأول."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "عيّنت Operations Manager. أول يوم. مفيش Onboarding Plan جاهز. إيه أرجح اللي هيحصل في 90 يوم؟",
          options: [
            "هيتعلم بنفسه ويبقى ممتاز.",
            "هيقضي أول شهر مرتبك، شهرين يحاول يلحق، وغالباً هيمشي.",
            "هيكون منتج من أول أسبوع.",
          ],
          correctIndex: 1,
          explanation: "الـ Onboarding مش luxury — هو الفرق بين موظف منتج وموظف ضائع. بدون خطة، الموظف بيقضي وقته يدوّر على دوره بدل ما يأديه."
        }
      ]
    },
  },
  {
    icon: UserCheck,
    eyebrow: "Mission",
    title: "اعمل JD + Scorecard + Onboarding لأول وظيفة محتاجها",
    tone: "accent",
    block: {
      kind: "mission",
      intro: "حتى لو مش هتعيّن دلوقتي — حضّر الـ 3 documents. لما تحتاج، هيكونوا جاهزين.",
      prompt: "في تسليمك ضيف:\n\n١) الوظيفة + الـ 3 outcomes المطلوبة.\n٢) الـ JD الكامل (اللي وَلّده AI، انسخه).\n٣) Interview Scorecard من 5 معايير.\n٤) Onboarding Plan لأسبوع بأسبوع (4 أسابيع).\n٥) أول red flag هترفض على أساسه أي candidate.",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "Outcomes واضحة وقابلة للقياس",
          weight: 50,
          criteria: [
            "الـ 3 outcomes مش مبهمة — كل واحد فيه رقم/معيار محدد.",
            "الـ JD متبني عليهم مش على title عام.",
          ],
        },
        {
          label: "Scorecard + Onboarding عملي",
          weight: 50,
          criteria: [
            "الـ Scorecard فيه 5 معايير محددة، مش \"شاطر/كويس\".",
            "الـ Onboarding أسبوع بأسبوع بمهام واضحة.",
          ],
        },
      ],
    },
  },
];
