import type { SupportedLocale } from "@/lib/locale/types";

type Translation = readonly [string, string, string, string];
type Point = { title: Translation; body: Translation };
type Overview = {
  ecosystemTitle: Translation;
  ecosystemBody: Translation;
  levelsTitle: Translation;
  levelsBody: Translation;
  journeyTitle: Translation;
  journeyBody: Translation;
  philosophyTitle: Translation;
  philosophyBody: Translation;
  ctaTitle: Translation;
  pillars: readonly Point[];
  journey: readonly Point[];
  principles: readonly Point[];
};

const overviews: Record<"kids" | "technical", Overview> = {
  kids: {
    ecosystemTitle: [
      "يفهم ويجرّب ويبدع",
      "يفهم ويجرّب ويبدع",
      "يفهم ويجرّب ويبدع",
      "Understand, explore and create",
    ],
    ecosystemBody: [
      "رحلة تعلّم AI على قد عمر طفلك، تجمع الشرح والتجربة والتفكير، وإنت متابع معاه.",
      "رحلة لتعلّم الذكاء الاصطناعي تراعي عمر الطفل، وتجمع الشرح والتجربة والتفكير بمشاركة وليّ الأمر.",
      "رحلة لتعلّم الذكاء الاصطناعي تناسب عمر طفلك، وتجمع الشرح والتجربة والتفكير مع متابعة وليّ الأمر.",
      "An age-appropriate AI learning journey that combines explanations, exploration and thinking, with a parent involved.",
    ],
    levelsTitle: [
      "مستوى يناسب عمر طفلك",
      "مستوى يناسب عمر طفلك",
      "مستوى يناسب عمر طفلك",
      "A level for your child's age",
    ],
    levelsBody: [
      "اختار المرحلة العمرية وشوف دروسها قبل ما تبدأ.",
      "اختر المرحلة العمرية واستعرض دروسها قبل البدء.",
      "اختر المرحلة العمرية واطّلع على دروسها قبل البداية.",
      "Choose an age level and explore its lessons before starting.",
    ],
    journeyTitle: [
      "من الفضول للفهم والتطبيق",
      "من الفضول إلى الفهم والتطبيق",
      "من الفضول للفهم والتطبيق",
      "From curiosity to understanding and practice",
    ],
    journeyBody: [
      "خطوات واضحة تساعد الطفل يتعلّم ويفكر، مش بس يشوف فيديو.",
      "خطوات واضحة تربط المشاهدة بالفهم والتفكير والتطبيق.",
      "خطوات واضحة تربط المشاهدة بالفهم والتفكير والتطبيق.",
      "Clear steps connect watching with understanding, thinking and practice.",
    ],
    philosophyTitle: [
      "تعلّم يناسب الطفل، ووليّ الأمر جزء منه",
      "تعلّم يناسب الطفل ويشارك فيه وليّ الأمر",
      "تعلّم يناسب الطفل، ووليّ الأمر جزء منه",
      "Learning that fits children, with parents involved",
    ],
    philosophyBody: [
      "الفكرة مش استخدام أدوات أكتر؛ الفكرة إن الطفل يفهم، ويسأل، ويجرّب وهو واعي بدور AI وحدوده.",
      "الهدف أن يفهم الطفل ويسأل ويجرّب، مع إدراك دور الذكاء الاصطناعي وحدوده.",
      "الهدف إن الطفل يفهم ويسأل ويجرّب، وهو واعي بدور الذكاء الاصطناعي وحدوده.",
      "The goal is to help children understand, ask and explore while recognising what AI can and cannot do.",
    ],
    ctaTitle: [
      "ابدأ رحلة طفلك مع مسارات",
      "ابدأ رحلة طفلك مع مسارات",
      "ابدأ رحلة طفلك مع مسارات",
      "Start your child's journey with Masaarat",
    ],
    pillars: [
      {
        title: ["فهم AI", "فهم الذكاء الاصطناعي", "فهم الذكاء الاصطناعي", "Understand AI"],
        body: [
          "شرح للمفاهيم بأمثلة قريبة من حياة الطفل.",
          "مفاهيم تُشرح بأمثلة من حياة الطفل.",
          "شرح المفاهيم بأمثلة قريبة من حياة الطفل.",
          "Explore concepts through examples from a child's everyday life.",
        ],
      },
      {
        title: ["السؤال والتعبير", "السؤال والتعبير", "السؤال والتعبير", "Ask and express"],
        body: [
          "يتعلّم يرتّب فكرته ويعبّر عن اللي عايزه بوضوح.",
          "يتعلّم تنظيم أفكاره والتعبير عن طلبه بوضوح.",
          "يتعلّم يرتّب أفكاره ويعبّر عن طلبه بوضوح.",
          "Practise organising ideas and expressing a request clearly.",
        ],
      },
      {
        title: ["الإبداع", "الإبداع", "الإبداع", "Create ideas"],
        body: [
          "يستخدم اللي فهمه في أفكار وأنشطة مناسبة لسنه.",
          "يوظّف فهمه في أفكار وأنشطة مناسبة لعمره.",
          "يستخدم فهمه في أفكار وأنشطة تناسب عمره.",
          "Use what was learned in ideas and activities suited to the child's age.",
        ],
      },
      {
        title: ["التفكير قبل التصديق", "التفكير النقدي", "التفكير قبل التصديق", "Think critically"],
        body: [
          "يسأل ويراجع الإجابات بدل ما يعتبر كل رد صح.",
          "يسأل ويراجع الإجابات بدل قبول كل رد دون تفكير.",
          "يسأل ويراجع الإجابات بدل ما يصدّق كل رد.",
          "Question and review answers instead of accepting every response.",
        ],
      },
      {
        title: ["التجربة والتطبيق", "التجربة والتطبيق", "التجربة والتطبيق", "Explore and practise"],
        body: [
          "الشرح مرتبط بأنشطة وأسئلة، عشان الفهم يتحوّل لتجربة.",
          "تربط الأنشطة والأسئلة الشرح بالتجربة.",
          "أنشطة وأسئلة تربط الشرح بالتجربة.",
          "Activities and questions connect explanations with exploration.",
        ],
      },
      {
        title: [
          "متابعة وليّ الأمر",
          "متابعة وليّ الأمر",
          "متابعة وليّ الأمر",
          "Parent involvement",
        ],
        body: [
          "وليّ الأمر بيدير ملفات الأطفال والوصول من حساب مسارات نفسه.",
          "يدير وليّ الأمر ملفات الأطفال والوصول من حساب مسارات نفسه.",
          "وليّ الأمر يدير ملفات الأطفال والوصول من حساب مسارات نفسه.",
          "A parent manages child profiles and access from the same Masaarat account.",
        ],
      },
    ],
    journey: [
      {
        title: ["اختار المستوى", "اختر المستوى", "اختر المستوى", "Choose a level"],
        body: [
          "استعرض الدروس في المرحلة العمرية المناسبة لطفلك.",
          "استعرض دروس المرحلة العمرية المناسبة لطفلك.",
          "اطّلع على دروس المرحلة العمرية المناسبة لطفلك.",
          "Explore the lessons in the right age level for your child.",
        ],
      },
      {
        title: ["افهم وجرّب", "افهم وجرّب", "افهم وجرّب", "Understand and explore"],
        body: [
          "ابدأ بالشرح، وبعده جرّب النشاط المرتبط بالدرس.",
          "ابدأ بالشرح ثم جرّب النشاط المرتبط بالدرس.",
          "ابدأ بالشرح ثم جرّب النشاط المرتبط بالدرس.",
          "Start with the explanation, then try the activity connected to the lesson.",
        ],
      },
      {
        title: ["راجع وطوّر فكرتك", "راجع وطوّر فكرتك", "راجع وطوّر فكرتك", "Review and improve"],
        body: [
          "جاوب على الأسئلة، وناقش اللي اتعلّمته مع وليّ الأمر، وجرّب تحسين فكرتك.",
          "أجب عن الأسئلة وناقش ما تعلّمته مع وليّ الأمر ثم حسّن فكرتك.",
          "جاوب على الأسئلة وناقش اللي تعلّمته مع وليّ الأمر، ثم طوّر فكرتك.",
          "Answer questions, discuss what was learned with a parent and improve your idea.",
        ],
      },
    ],
    principles: [
      {
        title: ["مناسب للعمر", "مناسب للعمر", "مناسب للعمر", "Age-appropriate"],
        body: [
          "مراحل عمرية واضحة بدل تجربة واحدة لكل الأطفال.",
          "مراحل عمرية واضحة بدل تجربة موحّدة لجميع الأطفال.",
          "مراحل عمرية واضحة بدل تجربة واحدة لكل الأطفال.",
          "Distinct age levels rather than one experience for every child.",
        ],
      },
      {
        title: [
          "الفهم قبل الأداة",
          "الفهم قبل الأداة",
          "الفهم قبل الأداة",
          "Understanding before tools",
        ],
        body: [
          "الطفل يعرف الفكرة ودور AI قبل الاعتماد على الإجابة.",
          "يفهم الطفل الفكرة ودور الذكاء الاصطناعي قبل الاعتماد على الإجابة.",
          "الطفل يفهم الفكرة ودور الذكاء الاصطناعي قبل الاعتماد على الإجابة.",
          "Understand the idea and AI's role before relying on an answer.",
        ],
      },
      {
        title: [
          "التطبيق والمراجعة",
          "التطبيق والمراجعة",
          "التطبيق والمراجعة",
          "Practice and review",
        ],
        body: [
          "نشاط وأسئلة يخلّوا الطفل يشارك في التعلّم.",
          "أنشطة وأسئلة تجعل الطفل مشاركًا في التعلّم.",
          "أنشطة وأسئلة تخلي الطفل يشارك في التعلّم.",
          "Activities and questions make the child an active participant.",
        ],
      },
      {
        title: [
          "وليّ الأمر حاضر",
          "مشاركة وليّ الأمر",
          "وليّ الأمر حاضر",
          "Parents are part of the journey",
        ],
        body: [
          "سياسة أطفال مستقلة وإدارة للملفات من حساب وليّ الأمر.",
          "سياسة أطفال مستقلة وإدارة للملفات من حساب وليّ الأمر.",
          "سياسة أطفال مستقلة وإدارة للملفات من حساب وليّ الأمر.",
          "A separate children's policy and profile management through the parent's account.",
        ],
      },
    ],
  },
  technical: {
    ecosystemTitle: [
      "مهارات مهنية من الفهم للتطبيق",
      "مهارات مهنية من الفهم إلى التطبيق",
      "مهارات مهنية من الفهم للتطبيق",
      "Vocational skills from understanding to practice",
    ],
    ecosystemBody: [
      "تعليم مهني يبدأ بالنجارة وصناعة الأثاث، ويربط فهم الخامات والأدوات بالتخطيط والتنفيذ ومراجعة الجودة.",
      "تعليم مهني يبدأ بالنجارة وصناعة الأثاث، ويربط فهم المواد والأدوات بالتخطيط والتنفيذ ومراجعة الجودة.",
      "تعليم مهني يبدأ بالنجارة وصناعة الأثاث، ويربط فهم الخامات والأدوات بالتخطيط والتنفيذ ومراجعة الجودة.",
      "Vocational learning starts with carpentry and furniture making, connecting materials and tools with planning, execution and quality review.",
    ],
    levelsTitle: [
      "مسارات التعليم المهني",
      "مسارات التعليم المهني",
      "مسارات التعليم المهني",
      "Vocational learning paths",
    ],
    levelsBody: [
      "للمبتدئ اللي عايز يتعلّم حرفة، ولصاحب الخبرة اللي عايز يرتّب معرفته ويطوّر شغله.",
      "للمبتدئين الراغبين في تعلّم حرفة ولأصحاب الخبرة الساعين إلى تنظيم معارفهم وتطوير ممارساتهم.",
      "للمبتدئ اللي يبغى يتعلّم حرفة، ولصاحب الخبرة اللي يبغى يرتّب معرفته ويطوّر شغله.",
      "For beginners learning a trade and experienced makers organising their knowledge and improving their practice.",
    ],
    journeyTitle: [
      "من الأساسيات لفهم الشغل الاحترافي",
      "من الأساسيات إلى فهم العمل الاحترافي",
      "من الأساسيات لفهم الشغل الاحترافي",
      "From foundations towards professional practice",
    ],
    journeyBody: [
      "رحلة تربط المعرفة بقرارات الشغل، خطوة بخطوة.",
      "رحلة تربط المعرفة بقرارات العمل، خطوة بخطوة.",
      "رحلة تربط المعرفة بقرارات الشغل، خطوة بخطوة.",
      "A journey that connects knowledge with practical decisions, step by step.",
    ],
    philosophyTitle: [
      "فهم وتطبيق ومراجعة",
      "فهم وتطبيق ومراجعة",
      "فهم وتطبيق ومراجعة",
      "Understand, practise and review",
    ],
    philosophyBody: [
      "المهارة تبدأ بفهم سبب الاختيار وطريقة الشغل، وتكبر بالتطبيق والمراجعة، مع الالتزام بإرشادات السلامة المناسبة.",
      "تبدأ المهارة بفهم أسباب الاختيارات وطرق العمل، وتتطور بالتطبيق والمراجعة مع الالتزام بإرشادات السلامة المناسبة.",
      "المهارة تبدأ بفهم سبب الاختيار وطريقة الشغل، وتتطوّر بالتطبيق والمراجعة مع الالتزام بإرشادات السلامة المناسبة.",
      "Skills begin with understanding choices and methods, then develop through practice and review with appropriate safety guidance.",
    ],
    ctaTitle: [
      "اكتشف رحلتك في التعليم المهني",
      "اكتشف رحلتك في التعليم المهني",
      "اكتشف رحلتك في التعليم المهني",
      "Explore your vocational learning journey",
    ],
    pillars: [
      {
        title: [
          "الاحتياج ورفع الموقع",
          "تحليل الاحتياج ورفع الموقع",
          "الاحتياج ورفع الموقع",
          "Requirements and site survey",
        ],
        body: [
          "ابدأ من المطلوب والمساحة والقيود قبل تصميم قطعة الأثاث.",
          "ابدأ من الاحتياج والمساحة والقيود قبل تصميم قطعة الأثاث.",
          "ابدأ من المطلوب والمساحة والقيود قبل تصميم قطعة الأثاث.",
          "Start with the brief, space and constraints before designing furniture.",
        ],
      },
      {
        title: [
          "المقاسات وتخطيط الفراغ",
          "الأبعاد البشرية وتخطيط الفراغ",
          "المقاسات وتخطيط الفراغ",
          "Human dimensions and room planning",
        ],
        body: [
          "اربط أبعاد الأثاث باستخدامه وحركته جوّه المساحة.",
          "اربط أبعاد الأثاث باستخدامه وحركته داخل الفراغ.",
          "اربط أبعاد الأثاث باستخدامه وحركته داخل المساحة.",
          "Connect furniture dimensions with use and movement within a space.",
        ],
      },
      {
        title: [
          "الخامات والتشطيبات",
          "المواد والتشطيبات",
          "الخامات والتشطيبات",
          "Materials and finishes",
        ],
        body: [
          "اختار الخامة والتشطيب بناءً على الاستخدام ومواصفات القطعة.",
          "اختر المواد والتشطيبات وفق الاستخدام ومواصفات القطعة.",
          "اختر الخامة والتشطيب حسب الاستخدام ومواصفات القطعة.",
          "Choose materials and finishes based on use and the piece's specifications.",
        ],
      },
      {
        title: [
          "الرسومات وقائمة القطع",
          "الرسومات التنفيذية وقائمة القطع",
          "الرسومات وقائمة القطع",
          "Drawings and cut lists",
        ],
        body: [
          "حوّل التصميم لرسومات وقائمة قطع قابلة للمراجعة.",
          "حوّل التصميم إلى رسومات وقائمة قطع قابلة للمراجعة.",
          "حوّل التصميم لرسومات وقائمة قطع قابلة للمراجعة.",
          "Turn a design into drawings and a cut list that can be reviewed.",
        ],
      },
      {
        title: [
          "الوصلات والأكسسوارات",
          "الوصلات والأكسسوارات وآليات الحركة",
          "الوصلات والأكسسوارات",
          "Joints and hardware",
        ],
        body: [
          "افهم الوصلات والمفصلات وآليات الحركة وعلاقتها بتصميم القطعة.",
          "افهم الوصلات والمفصلات وآليات الحركة وعلاقتها بتصميم القطعة.",
          "افهم الوصلات والمفصلات وآليات الحركة وعلاقتها بتصميم القطعة.",
          "Understand joints, hinges and movement mechanisms in relation to the design.",
        ],
      },
      {
        title: [
          "التصنيع والتركيب والجودة",
          "التصنيع والتركيب وضبط الجودة",
          "التصنيع والتركيب والجودة",
          "Production, installation and inspection",
        ],
        body: [
          "خطّط للتصنيع والتركيب، وراجع النتيجة بدل الاكتفاء بالشكل النهائي.",
          "خطّط للتصنيع والتركيب وراجع النتيجة إلى جانب الشكل النهائي.",
          "خطّط للتصنيع والتركيب وراجع النتيجة إلى جانب الشكل النهائي.",
          "Plan production and installation, then review the result beyond its appearance.",
        ],
      },
    ],
    journey: [
      {
        title: [
          "ابني الأساس المشترك",
          "ابنِ الأساس المشترك",
          "ابنِ الأساس المشترك",
          "Build the shared foundations",
        ],
        body: [
          "من تحليل الاحتياج ورفع الموقع للخامات والرسومات والوصلات وخطة التنفيذ.",
          "من تحليل الاحتياج ورفع الموقع إلى المواد والرسومات والوصلات وخطة التنفيذ.",
          "من تحليل الاحتياج ورفع الموقع للخامات والرسومات والوصلات وخطة التنفيذ.",
          "From requirements and site survey to materials, drawings, hardware and a production plan.",
        ],
      },
      {
        title: [
          "طبّق على أثاث البيت",
          "طبّق على الأثاث المنزلي",
          "طبّق على أثاث البيت",
          "Apply it to home furniture",
        ],
        body: [
          "التخزين والخزائن والمعيشة وغرف النوم، وبعدها وحدات الزينة والحمامات والمطابخ.",
          "التخزين والخزائن والمعيشة وغرف النوم، ثم وحدات الزينة والحمامات والمطابخ.",
          "التخزين والخزائن والمعيشة وغرف النوم، ثم وحدات الزينة والحمامات والمطابخ.",
          "Storage, wardrobes, living spaces and bedrooms, followed by vanities, bathrooms and kitchens.",
        ],
      },
      {
        title: ["وسّع التطبيقات", "وسّع التطبيقات", "وسّع التطبيقات", "Extend the applications"],
        body: [
          "المكاتب ومحطات العمل والتطبيقات التجارية والأثاث المخصص.",
          "المكاتب ومحطات العمل والتطبيقات التجارية والأثاث المخصص.",
          "المكاتب ومحطات العمل والتطبيقات التجارية والأثاث المخصص.",
          "Workplaces, commercial applications and custom furniture.",
        ],
      },
      {
        title: [
          "اجمع مهاراتك في مشروع",
          "اجمع مهاراتك في مشروع",
          "اجمع مهاراتك في مشروع",
          "Bring your skills together in a project",
        ],
        body: [
          "مشروع ختامي يربط التصميم بملف التنفيذ والمراجعة وملف الأعمال.",
          "مشروع ختامي يربط التصميم بملف التنفيذ والمراجعة وملف الأعمال.",
          "مشروع ختامي يربط التصميم بملف التنفيذ والمراجعة وملف الأعمال.",
          "A capstone connects design, a production file, review and a portfolio.",
        ],
      },
    ],
    principles: [
      {
        title: [
          "الأساس قبل التعقيد",
          "الأساس قبل التعقيد",
          "الأساس قبل التعقيد",
          "Foundations before complexity",
        ],
        body: [
          "ابني فهم واضح قبل الانتقال لتطبيقات أعقد.",
          "ابنِ فهمًا واضحًا قبل الانتقال إلى تطبيقات أكثر تعقيدًا.",
          "ابنِ فهم واضح قبل الانتقال لتطبيقات أعقد.",
          "Build a clear understanding before moving to more complex practice.",
        ],
      },
      {
        title: [
          "سبب الاختيار",
          "فهم أسباب الاختيار",
          "فهم سبب الاختيار",
          "Understand your choices",
        ],
        body: [
          "افهم ليه بتختار خامة أو طريقة تنفيذ معيّنة.",
          "افهم سبب اختيار مادة أو طريقة تنفيذ محددة.",
          "افهم ليه تختار خامة أو طريقة تنفيذ معيّنة.",
          "Understand why a material or method is chosen.",
        ],
      },
      {
        title: [
          "السلامة جزء من المهارة",
          "السلامة جزء من المهارة",
          "السلامة جزء من المهارة",
          "Safety is part of the skill",
        ],
        body: [
          "التطبيق العملي يراعي إرشادات السلامة والإشراف المناسب لطبيعة الأدوات.",
          "يراعي التطبيق العملي إرشادات السلامة والإشراف المناسب لطبيعة الأدوات.",
          "التطبيق العملي يراعي إرشادات السلامة والإشراف المناسب لطبيعة الأدوات.",
          "Practical work follows safety guidance and supervision appropriate to the tools.",
        ],
      },
      {
        title: [
          "الجودة بالمراجعة",
          "الجودة بالمراجعة",
          "الجودة بالمراجعة",
          "Quality through review",
        ],
        body: [
          "راجع النتيجة واتعلّم من اللي محتاج تعديل.",
          "راجع النتيجة وتعلّم من جوانب التحسين.",
          "راجع النتيجة وتعلّم من اللي يحتاج تعديل.",
          "Review the result and learn from what needs improvement.",
        ],
      },
    ],
  },
};

export function getLineOverviewCopy(locale: SupportedLocale, line: "kids" | "technical") {
  const index = ({ "ar-EG": 0, "ar-MSA": 1, "ar-Gulf": 2, en: 3 } as const)[locale];
  const source = overviews[line];
  const points = (items: readonly Point[]) =>
    items.map((item) => ({ title: item.title[index], body: item.body[index] }));
  return {
    ecosystemTitle: source.ecosystemTitle[index],
    ecosystemBody: source.ecosystemBody[index],
    levelsTitle: source.levelsTitle[index],
    levelsBody: source.levelsBody[index],
    journeyTitle: source.journeyTitle[index],
    journeyBody: source.journeyBody[index],
    philosophyTitle: source.philosophyTitle[index],
    philosophyBody: source.philosophyBody[index],
    ctaTitle: source.ctaTitle[index],
    pillars: points(source.pillars),
    journey: points(source.journey),
    principles: points(source.principles),
  };
}
