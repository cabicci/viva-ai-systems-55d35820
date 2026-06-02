import { Sparkles, PlayCircle, Lightbulb, Scale, Rocket, BookOpen, Workflow, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

export const ANALYST_M2_AI_SUMMARIZATION_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "AI = أسرع محلّل عندك",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بتاخد ساعتين تقرا ٢٠٠ رسالة وتطلّع منهم patterns؟",
        "AI بيعملها في ٣٠ ثانية لو الـ Prompt صح.",
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
        { term: "Database (DB)", meaning: "المكان اللي بتخزن وترتب فيه كل بيانات شغلك.", example: "لما تلم مصاريف محلك في شيت إكسيل واحد، دي كده بقت قاعدة بياناتك." },
        { term: "RAG", meaning: "تقنية بتخلي الـ AI يجاوب من بياناتك الخاصة مش من النت.", example: "لما ترفع ميزانية السنة اللي فاتت للـ AI عشان يرد عليك منها هي بس." },
        { term: "Patterns (أنماط)", meaning: "تكرار معين أو \"فولة\" ثابتة بتظهر وسط الأرقام والبيانات.", example: "زي لما تلاحظ إن العملاء بيطلبوا \"خصم\" أكتر يوم الخميس بالليل." },
        { term: "Summarization", meaning: "تلخيص دش كتير وكلام طويل في نص صغير ومفيد.", example: "بدل ما تقرأ 100 شيت، الـ AI يديك الزتونة في سطرين." },
        { term: "Classification (تنسيق)", meaning: "ترتيب البيانات وتوزيعها في مجموعات حسب نوعها.", example: "عندك 50 إيميل؛ الـ AI هيقولك ده (شكوى) وده (طلب شراء)." },
        { term: "Extraction (استخراج)", meaning: "إنك تنقي معلومة معينة ومهمة من وسط زحمة كلام.", example: "لو عندك عقد 20 صفحة، الـ AI يطلّعلك منه \"تاريخ الانتهاء\" بس." },
        { term: "رموز الوحدات (M3, M9)", meaning: "رموز تنظيمية عشان تعرف إنت في أنهي درس بالظبط.", example: "دي مجرد أكواد لترتيب الدروس في الكورس عشان متتوهش." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "إزاي تستخدم AI كأداة تحليل بدل قراءة كل حاجة بإيدك." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Prompt جاهز للتحليل",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "انسخ البيانات (رسائل/فواتير/ملاحظات) في Claude أو GPT.",
        "Prompt: «دي رسائل عملاء آخر أسبوع. استخرج: ١) كام طلب؟ ٢) أكتر ٣ أسئلة تكرّرت؟ ٣) في أي شكوى متكرّرة؟ ٤) أي pattern غير عادي؟»",
        "الـ AI بيرجّعلك ملخّص في نقاط — جاهز للقرار في M3.",
        "ربط بـ Builder M9 (RAG): لو حجم البيانات كبير، تقدر تبني RAG على الـ DB بدل النسخ اليدوي.",
      ],
    },
  },
  {
    icon: Workflow,
    eyebrow: "شوف بنفسك",
    title: "٥٠ رسالة → ٤ مخرجات في ٣٠ ثانية",
    block: {
      kind: "diagram",
      id: "ai-summarization-flow",
      caption: "نفس الـ Prompt يشتغل على أي حجم بيانات — الوقت بيرجع لك.",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "قراءة يدوية vs AI",
    block: {
      kind: "comparison",
      left: { label: "FAILURE — بتقرا كل حاجة بإيدك", body: "ساعتين أسبوعيًا. بعد شهر بتزهق وبتبطّل التحليل خالص." },
      right: { label: "RIGHT — AI بيلخّص، إنت بتقرّر", body: "١٠ دقايق أسبوعيًا. وقتك كله بقى في القرار، مش في القراءة." },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "حلّل آخر ٥٠ رسالة بـ AI",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "analyst-m2-ai-summarization-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو عندك ٢٠٠ رسالة من العملاء في آخر أسبوع، وعايز تعرف أهم المشاكل اللي بيتكلموا فيها عشان تحلّها بسرعة. إيه أحسن طريقة تستخدمها عشان تطلع Insights دي بكفاءة ووقت قليل؟",
          options: [
            "أنسخ الرسايل في أداة AI زي Claude أو GPT وأديله برومبت يحلّل كل حاجة",
            "أقرا الرسايل بنفسي واحدة واحدة وأطلع منها أهم المشاكل في نقاط",
            "أطلب من واحد من موظفين خدمة العملاء يقرا الرسايل ويلخّصها"
          ],
          correctIndex: 0,
          explanation: "الـ AI هيقدر يحلل كمية كبيرة من البيانات (٢٠٠ رسالة) في وقت قليل جدًا (٣٠ ثانية) ويطلع منها Patterns و Insights جاهزة عشان تاخد قرار، وده أسرع بكتير من القراءة اليدوية اللي هتاخد ساعات."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "بعد ما حلّلت رسايل العملاء بالـ AI، لقيت إن في شكاوى كتير متكرّرة عن 'تأخير في التوصيل' و'جودة المنتجات'. إيه القرار اللي ممكن تاخده بناءً على الـ Insight دي عشان تحسّن الخدمة؟",
          options: [
            "تاخد قرار فوري في M3 بتعديل عملية التوصيل ومراجعة جودة المنتجات",
            "تتجاهل الشكاوى دي لأنها طبيعية في أي بيزنس",
            "تطلب من العملاء يبعتوا شكاوى مفصلة أكتر عشان تفهم المشكلة بالظبط قبل ما تاخد أي خطوة"
          ],
          correctIndex: 0,
          explanation: "الـ AI بيرجعلك ملخّص في نقاط جاهز للقرار في M3. وبما إن الـ AI بيطلعلك الـ patterns و الشكاوى المتكررة، دي بتكون مؤشرات قوية لمشاكل لازم يتم التحرك عليها فورًا."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "لو شركتك عندها آلاف الفواتير والملاحظات المتخزّنة في Database كبير، وعايز تعملها تحليل سريع عشان تطلع منها أي 'أنماط غير عادية'. إيه أحسن طريقة تتعامل بيها مع حجم البيانات ده باستخدام الـ AI عشان متضطرش تعمل نسخ يدوي؟",
          options: [
            "تبني RAG (Retrieval-Augmented Generation) على الـ Database ده عشان الـ AI يقدر يوصل للبيانات مباشرة",
            "تنسخ كل الفواتير والملاحظات يدويًا في ملف Excel وبعدين تحطها في الـ AI",
            "تكتفي بتحليل عينة صغيرة من الفواتير والملاحظات بس عشان حجم البيانات كبير"
          ],
          correctIndex: 0,
          explanation: "لو حجم البيانات كبير جدًا ومش ممكن يتم نسخه يدويًا، الأفضل إنك تبني RAG على الـ Database بتاعك. ده بيمكن الـ AI إنه يوصل للبيانات بشكل مباشر ويحللها من غير ما تحتاج تنسخها بنفسك."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "لخّص ٥٠ سطر بيانات في ٣ Insights",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "خد جدول/Export فيه على الأقل ٥٠ صف، وخلّي AI يطلعلك ٣ Insights قابلة للقرار — مش وصف عام.",
      prompt:
        "في تسليمك اكتب:\n\n١) مصدر البيانات + عدد الصفوف (لازم ≥ ٥٠):\n٢) الـ Prompt اللي بعتّه للـ AI (انسخه كامل):\n٣) الـ ٣ Insights اللي طلعتهالك — كل واحد سطرين بالكتير:\n٤) اختار أهم واحد منهم واكتب القرار اللي هتاخده بسببه:\n٥) السؤال التالي اللي محتاج تجاوبه بعد الـ Insight ده:",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "جودة الـ Insights",
          weight: 70,
          criteria: [
            "الـ ٣ Insights فيهم أرقام/فترات مش وصف عام.",
            "كل Insight يقدر يخلّي حد ياخد قرار.",
          ],
        },
        {
          label: "استمرار التحليل",
          weight: 30,
          criteria: [
            "في سؤال تالي محدّد بيكمّل الـ loop.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "Mission AI evaluation = AI بيلخّص ١٠٠ submission",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "Mission AI evaluation = AI بيلخّص ١٠٠ submission",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Analyst — نفس اللي بتتعلمه. بدل ما نقرا كل mission submission يدوي، عملنا serverFn بتاخد كل الـ submissions في فترة وتطلّع AI summary: «60% فهموا الـ concept، 30% اختلطت عليهم خطوة 3». ساعتين شغل بقت 5 ثواني.",
      bullets: [
        "mission_submissions كلها بتتبعت لـ Gemini.",
        "Prompt: «لخّص أنماط الفهم والصعوبات في 5 نقاط».",
        "النتيجة بتظهر في /analytics → Mission Insights.",
      ],
      pathAngle: "analyst",
      link: { label: "افتح /analytics", href: "/analytics" },
    },
  }
];