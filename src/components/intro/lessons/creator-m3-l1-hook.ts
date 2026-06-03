import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import hookScreenshot from "@/assets/lessons/creator-m2-hook.jpg";

/**
 * Creator · M2 · Lesson 01 — Hook: أول 3 ثواني
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 */
export const CREATOR_M2_HOOK_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "أول 3 ثواني بتقرّر كل حاجة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "المتفرّج بيقرّر يكمّل أو يـ Scroll في أقل من 3 ثواني.",
        "الـ Hook = البوابة. لو قفلت، الفيديو خلص قبل ما يبتدي.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "مصطلحات الدرس",
    title: "مصطلحات هتشوفها في الدرس",
    tone: "primary",
    block: {
      kind: "concepts",
      items: [
        { term: "Feed/Scroll", meaning: "الصفحة اللي بتقعد تقلب فيها في فيسبوك وتشوف منشورات الناس.", example: "زي التاجر اللي بيحب يعرض بضاعته في فاترينة المحل عشان اللي ماشي يتفرج." },
        { term: "Hook", meaning: "أول جملة أو لقطة بتصطاد المشاهد وتخليه يفرمل وما يقلبش.", example: "لو بتبيع شنط، بدل \"عرض خاص\"، ابدأ بـ \"ضيعتي نص عمرك بتشيلي شنط غلط\"." },
        { term: "Pattern Interrupt", meaning: "حاجة مفاجئة تكسر الملل وتخلي العين تركز غصب عنها.", example: "لو بتصوّر فيديو لشركة مقاولات، ارمي طوبة في مية في أول ثانية بدل الدخلة التقليدية." },
        { term: "Curiosity Gap", meaning: "سؤال أو معلومة ناقصة تخلي الواحد عاوز يكمل عشان يعرف الإجابة.", example: "تجار الملابس اللي بيكتبوا \"السعر مفاجأة في الكومنتات\" عشان يخليك تسأل وتدقق." },
        { term: "Reel", meaning: "فيديو طولي قصير (زي تيك توك) معمول عشان ينتشر بسرعة.", example: "لو إنت محاسب وبتحط \"عنوان\" لشيت الإكسيل، الـ Hook هو اللي هيخلي المدير يفتحه أصلاً." },
        { term: "Retention", meaning: "النسبة اللي بتقولك قد إيه من الناس كملوا الفيديو للآخر.", example: "لو فيديو دقيقتين والناس قفلته بعد ثانية، يبقى \"الاحتفاظ\" بتاعك واقع ومحتاج شغل." },
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
      caption: "إزاي تخطف العين في أول ثانية قبل ما الإصبع يتحرّك.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "ليه أول 3 ثواني = البوابة كلها",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الـ Feed بيتحرّك بسرعة جنونية. إصبع المتفرّج جاهز للـ Scroll قبل ما المخ يفكّر.",
        "الـ Hook الناجح بيعمل حاجة من اتنين: يكسر التوقّع (Pattern Interrupt)، أو يفتح فجوة فضول (Curiosity Gap) المخ مش قادر يقفلها.",
        "أقوى Hooks بتبدأ بـ: رقم صادم، سؤال مباشر، تصريح عكس السائد، أو نتيجة قبل الشرح.",
        "خلّي بالك: الـ Hook مش العنوان. الـ Hook = أول جملة + أول لقطة + أول صوت — كلهم مع بعض.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "Hook الصفحة الرئيسية",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: hookScreenshot,
      alt: "Feed عمودي بـ 3 كروت — الكارت الأوسط مضيء بأيقونة عين + Play، الباقي شفّاف. تصوير بصري لفكرة الـ Hook اللي بيخطف العين قبل الـ Scroll.",
      caption:
        "في وسط 3 فيديوهات بتمرّ، فيديو واحد بيوقّف العين — ده الـ Hook. الكارت المضيء هو اللي خطف الانتباه قبل ما الإصبع يكمّل الـ Scroll. الباقي بيختفي في الـ Feed.",
      label: "Hook بصري — كسر النمط في الـ Feed",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "إزاي تكتب Hook حقيقي",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — بتبتدي بـ «أهلاً يا شباب»",
        body: "بتعرّف نفسك، بتشكر المتابعين، بتشرح هتقول إيه. خلال الـ 3 ثواني دي المتفرّج راح. أي مقدمة قبل الفكرة = موت.",
      },
      right: {
        label: "RIGHT — بتبتدي بالنتيجة",
        body: "بتقول الجملة اللي لو سمعها حد لازم يكمّل: «3 أخطاء بتضيّع 90% من المحتوى»، أو «الـ Reel ده جاب مليون مشاهدة بـ Hook واحد».",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اكتب 5 Hooks لنفس الفكرة",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m2-hook-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "ولاء بتعمل فيديو عن 'أهمية الخضروات لصحة القلب'. قررت تبدأ الـHook بتاعها بجملة '45% من المصريين معرضين لأمراض القلب بسبب الأكل الغلط'. ده بيعتبر أحسن استخدام لإيه من اللي اتقال في الدرس؟",
          options: [
            "Curiosity Gap",
            "Pattern Interrupt",
            "رقم صادم"
          ],
          correctIndex: 2,
          explanation: "بداية الفيديو برقم صادم زي 45% بيشد الانتباه فورًا وبيخلي المتفرج يقف ويكمل، وده من أقوى طرق عمل الـHook."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "أحمد بيقدم محتوى عن 'إزاي تتخلص من التسويف'. قرر يبدأ الفيديو بسؤال 'تخيل إن يومك فيه 26 ساعة… تفتكر هتبقى منتج أكتر؟'. ده بيستخدم إيه بالظبط عشان يعمل Hook فعال؟",
          options: [
            "تصريح عكس السائد",
            "سؤال مباشر",
            "نتيجة قبل الشرح"
          ],
          correctIndex: 1,
          explanation: "استخدام سؤال مباشر في الـHook بيفتح 'فجوة فضول' عند المتفرج وبيخليه عاوز يعرف الإجابة أو يشارك برأيه، وده بيكسّر الـScroll."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "مريم بتعمل فيديو عن 'نصايح بسيطة لتوفير الفلوس'. بدأت الفيديو بلقطة وهي ماسكة محفظة فاضية وبتقول: 'الخمسة جنيه دي كفيلة تغير حياتك لو عرفت تعمل بيها إيه'. إيه الهدف الرئيسي من الـHook ده؟",
          options: [
            "كسر النمط (Pattern Interrupt)",
            "فتح فجوة فضول (Curiosity Gap)",
            "الاثنين معًا"
          ],
          correctIndex: 2,
          explanation: "الـHook ده بيعمل كسر للنمط بلقطة غير متوقعة (محفظة فاضية) وبيفتح فجوة فضول بسؤال ضمني عن إزاي الـ5 جنيه ممكن تغير الحياة، فبيستخدم الميكانزمين مع بعض."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صمّم ٣ Hooks لأول ٣ ثواني من فيديو/Reel",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "اختار فيديو/Reel ناوي تعمله. اكتب ٣ Hooks مختلفة لأول ٣ ثواني، كل واحد بنوع مختلف.",
      prompt:
        "في تسليمك اكتب:\n\n١) فكرة الفيديو في سطر + المنصة:\n٢) ٣ Hooks:\n   - Hook ١ — سؤال يخاطب ألم/فضول\n   - Hook ٢ — رقم/حقيقة صادمة\n   - Hook ٣ — وعد أو تناقض\n٣) أنهي Hook هتختار ولِيه؟ في سطرين مربوطين بالجمهور.",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "تنوّع الـ ٣ Hooks",
          weight: 60,
          criteria: [
            "Hook ١ سؤال، Hook ٢ رقم/حقيقة، Hook ٣ وعد/تناقض.",
            "الـ ٣ مختلفين فعلاً، مش نفس الفكرة بصياغة جديدة.",
          ],
        },
        {
          label: "اختيار + تبرير",
          weight: 40,
          criteria: [
            "اخترت Hook واحد بالاسم، مش «الكل حلو».",
            "التبرير مرتبط بالجمهور أو المنصة، مش «أقوى صياغة».",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "أول جملة في كل درس = Hook",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "أول جملة في كل درس = Hook",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Creator — نفس اللي بتتعلمه. افتح أي درس في المنصة، أول جملة hero مكتوبة لتلفت انتباهك في 3 ثواني. مفيش «مرحباً بك في الدرس» — كله بيدخل في الفكرة مباشرة.",
      bullets: [
        "كل hero قصير: 5-10 كلمات بحد أقصى.",
        "بيستخدم تباين (مثلاً «المبيعات وحشة مش سؤال»).",
        "بيخلّيك تكمل قراءة paragraph تاني تلقائي.",
      ],
      pathAngle: "creator",
      link: { label: "افتح /curriculum", href: "/curriculum" },
    },
  }
];