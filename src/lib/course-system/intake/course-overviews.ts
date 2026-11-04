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
