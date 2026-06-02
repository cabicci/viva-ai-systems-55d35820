import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import parametersScreenshot from "@/assets/lessons/builder-m4-parameters.jpg";

/**
 * Builder · M4 · Lesson 02 — Top-p & Max tokens
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 */
export const BUILDER_M4_PARAMETERS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "تحكّم سهل",
    title: "زرارين بس بيغيّروا شخصية الـ AI",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "تخيّل عندك زرار واحد: 'إبداع' في الناحية اليمين، 'دقة' في الناحية الشمال.",
        "كل ما لففته يمين، الـ AI بيرد بكلام جديد وممتع.",
        "كل ما لففته شمال، بيرد بكلام تقيل ومحدّد.",
        "ده كل اللي محتاج تعرفه. مفيش رياضيات، مفيش معادلات.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "بس كلمتين",
    title: "إبداع × دقة — والسقف",
    block: {
      kind: "concepts",
      items: [
        { term: "إبداع (Temperature)", meaning: "زرار بيخلي الـ AI يبدع أكتر أو يبقى رسمي أكتر.", example: "كتابة بوست إعلاني → عالي. كتابة عقد قانوني → واطي." },
        { term: "السقف (Max tokens)", meaning: "أكتر عدد كلمات الـ AI يقدر يكتبه. لما يوصل للسقف، بيقف.", example: "زي ما تقول للموظف: 'الرد يبقى في ٣ سطور بس'." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption: "إيه هي Top-p و Max tokens، وإمتى تظبّط كل واحدة فيهم.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "زرار للسقف، وزرار لحجم الـ pool",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Max tokens = السقف الأعلى لطول الإجابة، محسوبة بـ tokens (افتكر M1.3 — الـ token غالبًا أصغر من الكلمة). لو حطّيتها 100، الـ AI هيقطع كلامه عند الـ token الـ 100 حتى لو كان في النص. ده زرار ميزانية — بيمنع ردود طويلة بلا داعي ويوفّر تكلفة.",
        "Top-p (Nucleus Sampling) = من قد إيه الكلمات يختار. لما تحطها 0.9، الـ AI بيختار من أعلى 90% احتمالية. لو حطّيتها 0.3، بيختار من أعلى 30% بس — يعني كلام أكثر أمانًا وتوقعًا.",
        "الفرق بينها وبين Temperature: Temperature بتغيّر شكل التوزيع نفسه (بتسطّحه أو بتحدّبه). Top-p بتقطع التوزيع عند نسبة معينة قبل الاختيار. الاتنين بيأثروا على \"التنوّع\" — بس بطرق مختلفة.",
        "القاعدة العملية: حرّك Temperature أو Top-p — مش الاتنين في نفس الوقت. ابدأ بـ Temperature، وسيب Top-p على 1.0 (أو 0.9 الافتراضي).",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "كروت الإحصائيات في الـ Dashboard",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: parametersScreenshot,
      alt: "كروت إحصائيات الـ Dashboard — Introduction 4/0، دروس مكتملة 16/0، السلسلة يوم — كل كرت بأرقام قصيرة وعنوان من كلمتين",
      caption:
        "بصّ على الـ ٣ كروت: \"Introduction 4/0\"، \"16/0 دروس مكتملة\"، \"يوم — السلسلة\". كل كرت ميزانيته ≈ ٨ توكنز. ده Max tokens مطبّق بصرامة — الـ prompt قاللها: \"رقم + سطر تعريفي ≤ ٤ كلمات، ممنوع الجمل الكاملة\". لو سيبت Max tokens مفتوح، كان كل كرت طلع \"إنت أكملت ٤ من أصل... إلخ\" — والـ dashboard كان بقى جدار نصوص. تحت في كروت المسارات (\"من فكرة إلى منتج SaaS حقيقي\") — sub_subtitle محدود بـ ≤ ١٠ توكنز. النتيجة: لوحة قابلة للقراءة في ثانية.",
      label: "من الموقع — صفحة /dashboard",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "Top-p × Max tokens — أخطاء شائعة",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — الزرارين سايبين",
        body: "بتطلب \"اعملي عنوان لمنشور\" بدون Max tokens. الـ AI يبعتلك ٣ فقرات شرح + ٥ بدائل + تنبيهات. أو: بتلعب في Temperature و Top-p مع بعض، فبتطلع نتائج عشوائية مش فاهم منين جت.",
      },
      right: {
        label: "RIGHT — كل زرار في مكانه",
        body: "Max tokens = 30 لما عايز عنوان. = 200 لما عايز شرح. = 1500 لما عايز مقال. وحرّك Temperature لوحدها للتنوّع، سيب Top-p على 0.9 — اتعامل معاها كـ safety net، مش كنوب تحكم يومي.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "ظبّط الميزانية لـ 3 مهام",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m4-parameters-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو عايز تعمل بوست تويتر سريع ومختصر عن حدث مهم، المفروض تظبط الـ Max tokens والـ Temperature إزاي عشان تحدد طول الرد وتزود فرصة إن الكلام يكون عفوي ومثير؟",
          options: [
            "Max tokens = 50، Temperature = 0.8",
            "Max tokens = 500، Temperature = 0.2",
            "Max tokens = 200، Temperature = 0.0"
          ],
          correctIndex: 0,
          explanation: "Max tokens قليلة عشان تويتر فيه حد أقصى للحروف (280 حرف)، والـ Temperature العالية (0.8) بتدي مساحة لإجابة فيها إبداع وعفوية أكتر، وده مناسب لبوستات السوشيال ميديا."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "مديرك طلب منك ملخص اجتماع مهم في ٥ نقط بالظبط. إيه أنسب إعدادات للـ Max tokens والـ Temperature عشان تضمن إن الملخص يكون دقيق ومختصر وميرغيش كتير؟",
          options: [
            "Max tokens = 100، Temperature = 0.3",
            "Max tokens = 500، Temperature = 1.0",
            "Max tokens = 50، Temperature = 0.8"
          ],
          correctIndex: 0,
          explanation: "الـ Max tokens القليلة بتضمن إن الملخص ميزيدش عن المطلوب، والـ Temperature القليلة (0.3) بتخلي الـ AI يختار الكلمات المضمونة والأكثر منطقية، فبتطلع الإجابة دقيقة ومختصرة زي ما المدير طلب."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "بتستخدم الـ AI عشان تستخرج رقم فاتورة معين من إيميل طويل جدًا وتبعت الرقم ده بس. تظبط إيه في الـ Max tokens والـ Temperature عشان العملية دي تطلع مظبوطة ومفيش أي كلام زيادة يظهر؟",
          options: [
            "Max tokens = 20، Temperature = 0.0",
            "Max tokens = 200، Temperature = 0.7",
            "Max tokens = 50، Temperature = 0.5"
          ],
          correctIndex: 0,
          explanation: "لأن المهمة دي محتاجة استخراج معلومة محددة جدًا (رقم فاتورة)، الـ Max tokens لازم تكون قليلة جداً (زي 20 توكن) عشان الـ AI ما يضيفش أي كلام زيادة. الـ Temperature لازم تكون صفر عشان الـ AI يختار الكلمات الأكثر احتمالية ودقة ومش يطلع عن النص خالص."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "اضبط Parameters لحالة استخدام واحدة",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "Temperature/Top-p/Max tokens مش أرقام عشوائية. هتختار حالة استخدام وتبرّر كل قيمة.",
      prompt:
        "في تسليمك:\n\n١) حالة الاستخدام في سطر (مثال: مولّد إيميلات مبيعات):\n٢) Temperature المختار + سبب (٠.٠-١.٠):\n٣) Top-p المختار + سبب:\n٤) Max output tokens + سبب (مربوط بطول الرد المتوقع):\n٥) لو هتعمل نسخة «إبداعية» منها، هتغير إيه؟ ولو نسخة «صارمة» منها، هتغير إيه؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "كل parameter مبرّر",
          weight: 60,
          criteria: [
            "كل قيمة معاها سبب مربوط بحالة الاستخدام.",
            "Max tokens مربوط بطول الرد المتوقع، مش رقم عشوائي.",
          ],
        },
        {
          label: "نسختين متناقضتين",
          weight: 40,
          criteria: [
            "نسخة إبداعية ونسخة صارمة بتغيير parameters واضح.",
            "التغيير منطقي (مش Temperature ٢ مع Top-p ٠).",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "max_tokens و stop sequences في المساعد",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "max_tokens و stop sequences في المساعد",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. في /assistant-runtime بنحدّد max_output_tokens=1500 لكل رد، عشان مفيش رد يطلع رواية. ولو الـ LLM بدأ يكرّر نفسه، عندنا stop sequences بتقطعه.",
      bullets: [
        "Hard limit: 1500 token كأقصى حد لكل رد.",
        "Soft hint في الـ prompt: «ردك ميتعداش ٢٠٠ كلمة».",
        "Stop sequence على «User:» عشان الـ LLM ميكملش المحادثة بنفسه.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /assistant-runtime", href: "/assistant-runtime" },
    },
  }
];
