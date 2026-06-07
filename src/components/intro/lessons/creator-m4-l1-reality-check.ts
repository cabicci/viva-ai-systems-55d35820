import {
  Sparkles,
  AlertCircle,
  Lightbulb,
  Scale,
  BookOpen,
  PlayCircle,
  Image as ImageIcon,
  Rocket,
  CheckCircle2,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import realityScreenshot from "@/assets/lessons/creator-m4-l1-reality-check.jpg";

export const CREATOR_M4_REALITY_CHECK_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "الاستمرارية بتكسب مش الضربة الواحدة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كتير يبدأ بحماس جامد ويقف بسرعة لأنه مستني نتيجة كبيرة من أول فيديوهين.",
        "النهاردة هنثبت قاعدة مهمة: المحاولات المفيدة المتكررة أهم من لقطة نجاح عشوائية.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "المشكلة",
    title: "أرقام قليلة في البداية بتخوف",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أول فترة الأرقام بتكون صغيرة، وده طبيعي جدا حتى للحسابات الجيدة.",
        "اللي بيوقفك مش الواقع، اللي بيوقفك إنك مفسر الأرقام على إنها حكم نهائي.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "اشتغل بتجارب صغيرة وبيانات بسيطة",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بدل ما تقول الفيديو فشل، اسأل: إيه اللي اتعلمته من أول ٥ ثواني؟",
        "ركز على مؤشرات سهلة: نسبة إكمال، حفظ، رسائل خاصة، أو تعليق له معنى.",
        "التقدم الحقيقي بيبان لما تكرر المحاولة بنفس الفكرة مع تعديل واحد كل مرة.",
        "هدفك في المرحلة دي بناء نظام شغل ثابت، مش ملاحقة رقم كبير بسرعة.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مقارنة سريعة",
    title: "حكم سريع vs اختبار ذكي",
    block: {
      kind: "comparison",
      left: {
        label: "الأسلوب المرهق",
        body: "«الفيديو ما جابش رقم كبير، يبقى الفكرة ماتت». كده بتقفل الباب قبل ما تتعلم.",
      },
      right: {
        label: "الأسلوب العملي",
        body: "«أعيد نفس الفكرة بزاوية مختلفة وأقيس الفرق». كده بتبني معرفة حقيقية عن جمهورك.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "مصطلحات مهمة",
    title: "٣ مفاتيح قياس",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Iteration",
          meaning: "إعادة تنفيذ نفس الفكرة مع تعديل محدد للتعلم.",
          example: "نفس الموضوع لكن Hook مختلف",
        },
        {
          term: "Signal",
          meaning: "إشارة صغيرة بتقول إن المحتوى مفيد فعلا.",
          example: "تعليق بيقول جربتها ونجحت",
        },
        {
          term: "Small Data",
          meaning: "بيانات قليلة لكنها كفاية لاتخاذ قرار بسيط.",
          example: "أفضل ٢ من ٥ أفكار من حيث الإكمال",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "ازاي تعمل Reality Check",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "شرح خفيف لقراءة أول النتائج بدون تهويل. لو مستعجل، تخطى الفيديو وابدأ بالمهمة مباشرة.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "مثال بصري",
    title: "شكل مراجعة بسيط للأفكار",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: realityScreenshot,
      alt: "لقطة توضح مراجعة أفكار المحتوى بالاعتماد على بيانات بسيطة",
      caption:
        "بدل العشوائية، شوف كل فكرة على مقياس واضح: هل بتحل مشكلة حقيقية لجمهور واضح؟",
      label: "reality-check.jpg",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "اختيار الفكرة القابلة للتجربة",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m4-l1-reality-check-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "عندك فكرتين: واحدة ترند بس مفيهاش مشكلة واضحة، والتانية عليها بحث أقل بس بتحل وجع حقيقي لجمهورك. تختار أنهي واحدة للاختبار الأول؟",
          options: [
            "الترند لأنه يضمن مشاهدة أعلى",
            "الفكرة اللي بتحل مشكلة حقيقية حتى لو الأرقام أقل",
            "أسيب الاتنين لحد ما ييجي إلهام جديد",
          ],
          correctIndex: 1,
          explanation:
            "في reality check بنبني على المنفعة الحقيقية، لأن ده اللي يديك إشارات مفيدة على المدى الطويل.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمة تطبيق",
    title: "راجع ٥ أفكار وحدد المشكلة الحقيقية",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "اختار ٥ أفكار من اللي في دماغك وقيّم كل واحدة بسرعة: هل فعلا بتحل مشكلة حقيقية لجمهور واضح؟",
      prompt:
        "املأ الجدول ده:\n\n١) الفكرة الأولى + المشكلة اللي بتحلها + نعم أو لا\n٢) الفكرة الثانية + المشكلة اللي بتحلها + نعم أو لا\n٣) الفكرة الثالثة + المشكلة اللي بتحلها + نعم أو لا\n٤) الفكرة الرابعة + المشكلة اللي بتحلها + نعم أو لا\n٥) الفكرة الخامسة + المشكلة اللي بتحلها + نعم أو لا\n\nوفي الآخر: اختار فكرتين هتجربهم الأسبوع ده وليه.",
      buttonLabel: "انسخ المهمة",
      copiedLabel: "اتنسخت",
      template:
        "الفكرة ١:\nالمشكلة:\nReal audience problem؟ [نعم/لا]\n\nالفكرة ٢:\nالمشكلة:\nReal audience problem؟ [نعم/لا]\n\nالفكرة ٣:\nالمشكلة:\nReal audience problem؟ [نعم/لا]\n\nالفكرة ٤:\nالمشكلة:\nReal audience problem؟ [نعم/لا]\n\nالفكرة ٥:\nالمشكلة:\nReal audience problem؟ [نعم/لا]\n\nاختياري لفكرتين:\n[اكتب السبب]",
      rubric: [
        {
          label: "وضوح المشكلة",
          weight: 60,
          criteria: ["كل فكرة مرتبطة بمشكلة مفهومة لجمهور محدد."],
        },
        {
          label: "قرار عملي",
          weight: 40,
          criteria: ["اختيار فكرتين للتجربة مع سبب واضح."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "قفلة واثقة",
    title: "إنت بقيت بتقيس بعقل مش بانفعال",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أي صانع محتوى شاطر بيعدي بمرحلة أرقام صغيرة، واللي بيفرق هو طريقة التفكير.",
        "كمل بالمهمة النهاردة، ومع كل محاولة هتبقى قراراتك أسرع وأوضح.",
      ],
    },
  },
];
