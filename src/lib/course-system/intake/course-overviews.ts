import type { SupportedLocale } from "@/lib/locale/types";

/** Presentation-only, owner-authorized course overviews keyed by exact course id.
 * Unknown courses get null, so callers keep their generic fallback. */
export type CourseOverview = {
  summary: string;
  goals: string;
  audience: string;
  before: string;
  catalogue: string;
};

const OVERVIEWS: Record<string, Record<SupportedLocale, CourseOverview>> = {
  "home-design": {
    "ar-EG": {
      summary: "صمّم أوضتك بالمقاسات وجرّب العفش في مكانه قبل ما تدفع.",
      goals: "هتقارن توزيعتين، وتختبر فتح الباب والأدراج والمشي بين العفش، وتحسب التكلفة بالتوصيل والتركيب.",
      audience: "للي بيرتّب بيته أو شقة إيجار لأول مرة وعايز يختار عفش يناسب استخدامه اليومي.",
      before: "جهّز متر وورقة وقلم، واختار أوضة مسموح لك تقيسها. تقدر تبدأ من غير خبرة في الرسم.",
      catalogue: "قيس أوضتك وقارن توزيعتين بالعفش والميزانية قبل الشراء.",
    },
    "ar-MSA": {
      summary: "صمّم غرفتك من واقع قياساتها واختبر مواضع الأثاث قبل الشراء.",
      goals: "ستقارن بين توزيعَين، وتختبر فتح الأبواب والأدراج ومسارات الحركة، وتحسب التكلفة شاملة التوصيل والتركيب.",
      audience: "للمبتدئين الذين يرتّبون منزلًا أو غرفة مستأجرة ويريدون اختيار أثاث يلائم استخدامهم اليومي.",
      before: "جهّز شريط قياس وورقة وقلمًا واختر غرفة لديك إذن بقياسها. يمكنك البدء دون خبرة سابقة في الرسم.",
      catalogue: "قِس غرفتك وقارن بين توزيعَين وفق الملاءمة والميزانية قبل الشراء.",
    },
    "ar-Gulf": {
      summary: "صمّم غرفتك على مقاسها وجرّب مكان الأثاث قبل ما تدفع.",
      goals: "بتقارن توزيعين وتختبر فتح الباب والأدراج ومسارات الحركة وتحسب التكلفة مع التوصيل والتركيب.",
      audience: "للي يرتّب بيته أو غرفة مستأجرة لأول مرة ويبي يختار أثاث يناسب استخدامه اليومي.",
      before: "جهّز متر وورقة وقلم واختَر غرفة مسموح لك تقيسها. تقدر تبدأ بدون خبرة في الرسم.",
      catalogue: "قِس غرفتك وقارن توزيعين على حسب المساحة والميزانية قبل الشراء.",
    },
    en: {
      summary: "Measure your room and test where furniture will go before you buy it.",
      goals: "Compare two layouts, test door and drawer movement, check the routes people use and calculate the cost with delivery and assembly.",
      audience: "For beginners furnishing their home or a rented room who want to check everyday fit before buying.",
      before: "Bring a tape measure, paper and a pencil, and choose a room you have permission to measure. No drawing experience is needed.",
      catalogue: "Compare two room layouts against your measurements, daily activities and budget.",
    },
  },
  "ai-store-studio": {
    "ar-EG": {
      summary: "ابنِ متجر دَوِّنها من أول كتالوج المنتجات لحد اختبار الطلب وتسليم المتجر.",
      goals: "تضبط المنتجات والمخزون والشحن، وتختبر الدفع ورفض الطلب، وتسلّم دليل تشغيل المتجر.",
      audience:
        "لأصحاب المتاجر المبتدئين ومصممي واجهات المتاجر اللي بيبدأوا في التجارة الإلكترونية.",
      before:
        "يكفي تعرف تستخدم المتصفح وتدخل بيانات في جدول. جهّز متجر تدريب وحساب للأداة اللي هتطبّق عليها.",
      catalogue: "ابنِ متجرًا بأدوات الذكاء الاصطناعي واختبر طلبًا كاملًا.",
    },
    "ar-MSA": {
      summary: "ابنِ متجر دَوِّنها من إعداد الكتالوج إلى اختبار الطلب وتسليم المتجر.",
      goals: "ستضبط المنتجات والمخزون والشحن، وتختبر الدفع ورفض الطلب، وتسلّم أدلة التشغيل.",
      audience: "لمؤسسي المتاجر ومصممي واجهاتها المبتدئين في التجارة الإلكترونية.",
      before:
        "تحتاج إلى استخدام المتصفح وإدخال بيانات في جدول. جهّز متجرًا تدريبيًا وحسابًا للأداة التي ستطبّق بها.",
      catalogue: "ابنِ متجرًا بأدوات الذكاء الاصطناعي واختبر طلبًا كاملًا.",
    },
    "ar-Gulf": {
      summary: "ابنِ متجر دَوِّنها من تجهيز الكتالوج لين تختبر الطلب وتسلّم المتجر.",
      goals: "بتضبط المنتجات والمخزون والشحن، وتجرّب الدفع ورفض الطلب، وتسلّم أدلة التشغيل.",
      audience: "للي يبدأ مشروع متجر إلكتروني أو يصمّم واجهة متجر لأول مرة.",
      before:
        "يكفي تعرف تستخدم المتصفح وتدخل بيانات بجدول. جهّز متجر تدريب وحساب للأداة اللي بتطبّق عليها.",
      catalogue: "ابنِ متجر بأدوات الذكاء الاصطناعي وجرّب طلب كامل.",
    },
    en: {
      summary:
        "Build the Dawwenha store from its product catalogue to a tested order and handover.",
      goals:
        "Configure products, inventory and shipping, test checkout and declined orders, and hand over operating evidence.",
      audience: "For first-time store founders and beginning storefront designers.",
      before:
        "You should be able to use a browser and enter data in a spreadsheet. Have a practice store and an account for the tool you plan to use.",
      catalogue: "Build an online store with AI tools and test a complete order.",
    },
  },
  "english-speaking": {
    "ar-EG": {
      summary: "اتدرّب على محادثة إنجليزي من أول تسجيل ليك لحد موقف جديد.",
      goals: "تسمع وتردّ، وتطلب توضيح، وتقارن أداءك في أول وآخر محادثة.",
      audience: "للي عايز يستخدم الإنجليزي في مواقف يومية ويتدرّب على ردود مش محفوظة.",
      before: "اختار موقف يومي يهمك، وجهّز وسيلة تسمع بيها وتسجّل صوتك.",
      catalogue: "اتدرّب على محادثة إنجليزي من أول تسجيل ليك لحد موقف جديد.",
    },
    "ar-MSA": {
      summary: "تدرّب على المحادثة الإنجليزية ثم اختبر أداءك في موقف جديد.",
      goals: "تتدرّب على الاستماع والرد وطلب التوضيح ومراجعة النطق.",
      audience: "لمن يريد استخدام الإنجليزية في محادثات الحياة اليومية.",
      before: "اختر موقفًا يوميًا وجهّز وسيلة للاستماع وتسجيل صوتك.",
      catalogue: "تدرّب على المحادثة الإنجليزية ثم اختبر أداءك في موقف جديد.",
    },
    "ar-Gulf": {
      summary: "تمرّن على محادثة إنجليزية وجرّب كلامك في موقف جديد.",
      goals: "بتتمرّن على الاستماع والرد وطلب التوضيح وبتقارن تسجيلاتك.",
      audience: "للي يبي يستخدم الإنجليزية في المحادثات اليومية.",
      before: "اختَر موقف يومي يهمّك وجهّز وسيلة تسمع فيها وتسجّل صوتك.",
      catalogue: "تمرّن على محادثة إنجليزية وجرّب كلامك في موقف جديد.",
    },
    en: {
      summary: "Practise speaking English and hold a conversation in a new situation.",
      goals: "Listen, respond, ask for clarification and compare your first and final attempts.",
      audience: "For learners who want to use English in everyday conversations.",
      before: "Choose a familiar situation and prepare a way to listen and record your voice.",
      catalogue: "Practise speaking English and hold a conversation in a new situation.",
    },
  },
  "job-interviews": {
    "ar-EG": {
      summary: "حوّل إعلان شغل لطلب تقديم ومقابلة مبنيين على خبرتك.",
      goals: "تربط متطلبات الإعلان بأمثلة، وتعدّل السيرة، وتجاوب على أسئلة متابعة.",
      audience: "للي بيدوّر على شغل وعايز يشرح خبرته بوضوح في التقديم والمقابلة.",
      before: "جهّز إعلان لوظيفة مهتم بيها وأمثلة حقيقية من شغلك أو دراستك.",
      catalogue: "حوّل إعلان شغل لطلب تقديم ومقابلة مبنيين على خبرتك.",
    },
    "ar-MSA": {
      summary: "حوّل إعلان وظيفة إلى طلب توظيف ومقابلة تستندان إلى خبرتك الفعلية.",
      goals: "اربط متطلبات الدور بأدلة، وخصّص سيرتك الذاتية وتدرّب على أسئلة المتابعة.",
      audience: "للباحثين عن عمل الراغبين في تقديم خبراتهم بوضوح.",
      before: "جهّز إعلانًا لوظيفة تهمّك وأمثلة حقيقية من عملك أو دراستك.",
      catalogue: "حوّل إعلان وظيفة إلى طلب توظيف ومقابلة تستندان إلى خبرتك الفعلية.",
    },
    "ar-Gulf": {
      summary: "جهّز طلبك للمقابلة على أساس إعلان الوظيفة وخبرتك الفعلية.",
      goals: "بتربط متطلبات الوظيفة بأمثلة وبتخصّص سيرتك وتتمرّن على أسئلة المتابعة.",
      audience: "للي يدور على وظيفة ويبي يعرض خبرته بوضوح.",
      before: "جهّز إعلان وظيفة يهمّك وأمثلة حقيقية من شغلك أو دراستك.",
      catalogue: "جهّز طلبك للمقابلة على أساس إعلان الوظيفة وخبرتك الفعلية.",
    },
    en: {
      summary: "Turn a job posting into an application and interview grounded in your experience.",
      goals:
        "Map the requirements to evidence, tailor your CV and practise answering follow-up questions.",
      audience:
        "For job seekers who want to explain their experience in applications and interviews.",
      before: "Bring a job posting and real examples from your work or studies.",
      catalogue:
        "Turn a job posting into an application and interview grounded in your experience.",
    },
  },
  "AC-FATE": {
    "ar-EG": {
      summary:
        "افهم رحلة المبيد من استخدامه لحد انتقاله وتحلّله في البيئة، واتعلّم تقرأ بيانات المتبقيات والتعرّض والسميّة وتربط بينها باستنتاج علمي عليه دليل.",
      goals:
        "هتتعلّم تفسّر نتائج متبقيات المبيدات ووحدات قياسها، وتحسب الكمية في سيناريو محدد، وتفصل بين التركيز والتعرّض والخطر. وهتتتبّع حركة المبيد بين التربة والمياه والكائنات، وتقارن التراكم والتركيز والتضخّم الحيوي، وتقرأ اختبارات السميّة والخواص الفيزيائية والكيميائية والتحلّل وعمر النصف.",
      audience:
        "لطلاب الزراعة والعلوم البيئية، ولكل مهتم بفهم مصير المبيدات وسلامة الغذاء وتقييم الأدلة البيئية. مناسب للي عايز يفهم الأرقام والعلاقات ويطبّق التفكير العلمي على حالات واقعية.",
      before:
        "ابدأ من أول خطوة وامشِ بالترتيب؛ المفاهيم والحسابات بتتبني على بعض. جهّز ورقة وقلم وآلة حاسبة بسيطة، وراجع تحويلات الجرام والكيلوجرام وقراءة النسب والوحدات. هتلاقي شرحًا وأمثلة محلولة وأسئلة وتطبيقات تساعدك تبني فهمك تدريجيًا.",
      catalogue:
        "افهم انتقال المبيدات وتحلّلها وتراكمها في البيئة، واتعلّم تفسير بيانات المتبقيات والتعرّض والسميّة.",
    },
    "ar-MSA": {
      summary:
        "افهم رحلة المبيد منذ استخدامه حتى انتقاله وتحلّله في البيئة، وتعلّم قراءة بيانات المتبقيات والتعرّض والسميّة والربط بينها باستنتاج علمي مدعوم بالدليل.",
      goals:
        "ستتعلّم تفسير نتائج متبقيات المبيدات ووحدات قياسها، وحساب الكمية في سيناريو محدد، والتمييز بين التركيز والتعرّض والخطر. وستتتبّع حركة المبيد بين التربة والمياه والكائنات الحية، وتقارن بين التراكم والتركيز والتضخّم الحيوي، وتقرأ اختبارات السميّة والخواص الفيزيائية والكيميائية والتحلّل وعمر النصف.",
      audience:
        "لطلاب الزراعة والعلوم البيئية، ولكل مهتم بفهم مصير المبيدات وسلامة الغذاء وتقييم الأدلة البيئية. مناسب لمن يريد فهم الأرقام والعلاقات وتطبيق التفكير العلمي على حالات واقعية.",
      before:
        "ابدأ من الخطوة الأولى وتابع بالترتيب؛ فالمفاهيم والحسابات يبني بعضها على بعض. جهّز ورقة وقلمًا وآلة حاسبة بسيطة، وراجع التحويل بين الجرام والكيلوجرام وقراءة النسب والوحدات. ستجد شرحًا وأمثلة محلولة وأسئلة وتطبيقات تساعدك على بناء فهمك تدريجيًا.",
      catalogue:
        "افهم انتقال المبيدات وتحلّلها وتراكمها في البيئة، وتعلّم تفسير بيانات المتبقيات والتعرّض والسميّة.",
    },
    "ar-Gulf": {
      summary:
        "افهم رحلة المبيد من استخدامه إلى انتقاله وتحلّله في البيئة، وتعلّم تقرا بيانات المتبقيات والتعرّض والسميّة وتربط بينها باستنتاج علمي عليه دليل.",
      goals:
        "بتتعلّم تفسّر نتائج متبقيات المبيدات ووحدات قياسها، وتحسب الكمية في سيناريو محدد، وتفرّق بين التركيز والتعرّض والخطر. وبتتتبّع حركة المبيد بين التربة والمياه والكائنات، وتقارن بين التراكم والتركيز والتضخّم الحيوي، وتقرا اختبارات السميّة والخواص الفيزيائية والكيميائية والتحلّل وعمر النصف.",
      audience:
        "لطلاب الزراعة والعلوم البيئية، ولكل مهتم يبي يفهم مصير المبيدات وسلامة الغذاء وتقييم الأدلة البيئية. يناسب اللي يبي يفهم الأرقام والعلاقات ويطبّق التفكير العلمي على حالات واقعية.",
      before:
        "ابدأ من أول خطوة وامشِ بالترتيب؛ المفاهيم والحسابات تنبني على بعض. جهّز ورقة وقلم وآلة حاسبة بسيطة، وراجع تحويلات الجرام والكيلوجرام وقراءة النسب والوحدات. بتلقى شرح وأمثلة محلولة وأسئلة وتطبيقات تساعدك تبني فهمك شوي شوي.",
      catalogue:
        "افهم انتقال المبيدات وتحلّلها وتراكمها في البيئة، وتعلّم تفسير بيانات المتبقيات والتعرّض والسميّة.",
    },
    en: {
      summary:
        "Follow a pesticide's journey from application to its movement and breakdown in the environment, and learn to read residue, exposure and toxicity data and connect them into evidence-based scientific conclusions.",
      goals:
        "You will learn to interpret pesticide residue results and their units, calculate quantities in a defined scenario, and distinguish concentration, exposure and risk. You will trace how a pesticide moves between soil, water and organisms, compare accumulation, concentration and biomagnification, and read toxicity tests, physical and chemical properties, degradation and half-life.",
      audience:
        "For agriculture and environmental science students, and anyone interested in pesticide fate, food safety and weighing environmental evidence. Suited to learners who want to understand the numbers and relationships and apply scientific thinking to real cases.",
      before:
        "Start at the first step and work in order; the concepts and calculations build on each other. Have paper, a pen and a simple calculator ready, and review gram–kilogram conversions and reading ratios and units. You will find explanations, worked examples, questions and practice that help you build understanding step by step.",
      catalogue:
        "Understand how pesticides move, break down and accumulate in the environment, and learn to interpret residue, exposure and toxicity data.",
    },
  },
};

export function courseOverview(courseId: string, locale: SupportedLocale): CourseOverview | null {
  return Object.hasOwn(OVERVIEWS, courseId) ? OVERVIEWS[courseId][locale] : null;
}
