import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import thumbnailsImg from "@/assets/lessons/unique/creator-m5-l2-thumbnails-captions.jpg";

export const CREATOR_M4_THUMBNAILS_CAPTIONS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "الـ Thumbnail = نص نجاح اليوتيوب",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "محتوى ٩٠٪ + Thumbnail ٠٪ = صفر مشاهدات.",
        "محتوى ٥٠٪ + Thumbnail قوي = آلاف المشاهدات.",
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
        { term: "Subject (العنصر الأساسي)", meaning: "ده بطل الصورة أو الحاجة الأساسية اللي عينك بتروح لها أول ما بتشوف التصميم.", example: "زي ما بتصور الموبايل اللي بتبيعه صورة واضحة ومهمة في نص الكادر عشان تشد الزبون." },
        { term: "Contrast (التباين)", meaning: "فرق الألوان ووضوحها اللي بيخلي الصورة \"تنطق\" وتتشاف بسهولة وسط زحمة الصور.", example: "تاجر لبس بيستخدم طرحة حمراء فاقعة على طقم أسود عشان تفصل الألوان وتخطف عين اللي بيقلب." },
        { term: "Thumbnail (صورة الغلاف)", meaning: "الصورة الصغيرة اللي بتعمل \"واجهة\" للفيديو وتحمس الناس تدوس وتتفرج.", example: "زي اليافطة اللي بيحطها صاحب المحل بره؛ لو شكلها حلو والناس دخلت، يبقى اليافطة نجحت." },
        { term: "CTR (نسبة الضغط)", meaning: "حسبة بسيطة بتعرفنا كام واحد داس من كل 100 شافوا الصورة قدامهم.", example: "مسوّق حسب إن من كل 100 واحد شافوا إعلان الكوتشي، 5 بس اللي داسوا، يبقى النسبة 5%." },
        { term: "Caption (وصف الفيديو)", meaning: "الكلام اللي بيتكتب تحت الفيديو أو البوست عشان يشرح تفاصيل زيادة.", example: "زي البوست اللي التاجر بينزله على فيسبوك وبيكتب تحته السعر وطريقة التوصيل بالتفصيل." },
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
      caption: "تشريح Thumbnails ناجحة — ليه دي شغّالة ودي لأ.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Thumbnail قوي = ٣ عناصر بس",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "١. Subject واضح — وش، product، أو object كبير وفي المنتصف. مفيش زحمة. عين المتفرّج بتقرّر في ٠.٣ ثانية.",
        "٢. ٢-٤ كلمات بـ خط ضخم. مش جملة كاملة. أمثلة: «STOP DOING THIS»، «I WAS WRONG»، «FREE TEMPLATE». الـ thumbnail بـ ١٠ كلمات = مفيش حد بيقراها.",
        "٣. Contrast عالي — ألوان متضادة (أصفر مع أسود، أبيض مع أحمر). لو الـ thumbnail لو حطيته في خلفية رمادية بيختفي = ضعيف.",
        "للـ Caption: أول سطر هو الـ hook (زي M2). لو الـ caption بيبدأ بـ «شكراً يا جماعة لـ...»، مفيش حد هيقرا التاني. ابدأ بسؤال أو statement مفاجئ.",
        "Templates مفيدة جداً. Canva فيه آلاف الـ templates. اختار ٣ بس اللي بتعجبك واستخدمهم في كل فيديوهاتك — Consistency أهم من التنوّع.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "Thumbnails قوية = ٣ كلمات + ألوان مضادة",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: thumbnailsImg,
      alt: "Grid من ٦ Thumbnails بألوان مختلفة وكلمات قليلة",
      caption:
        "كل thumbnail هنا فيه ٢-٤ كلمات بس، ألوان مضادة (أحمر، أصفر، أزرق، أخضر، بنفسجي، أسود)، والكلمات قابلة للقراءة من بعيد. حط أي واحدة في feed YouTube — العين هتروحلها قبل ما تروح للـ thumbnails الباهتة.",
      label: "Thumbnails Examples",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "إزاي تختار Thumbnail",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — Screenshot من الفيديو",
        body: "بتاخد screenshot عشوائي من الفيديو، تكتب عليه عنوان الفيديو كامل. الـ thumbnail باهت، الكلام كتير، مفيش حاجة بتجذب. CTR تحت ٢٪.",
      },
      right: {
        label: "RIGHT — صورة مخصّصة + ٣ كلمات",
        body: "صورة وش بتعبير قوي (دهشة، إيجابية)، ٣ كلمات بـ خط ضخم («I WAS WRONG»)، خلفية بلون متضاد. CTR ٨-١٢٪. نفس الفيديو، ٥× مشاهدات.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "صمّم ٣ Thumbnails لفيديوهاتك",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m5-l2-thumbnails-captions-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "ولاء بتعمل فيديوهات طبخ، وعملت طبخة صعبة أوي، والتصوير بتاعها كان حلو ومتقن. عملت Thumbnail عليه صورتها وهي بتضحك ومكتوب تحته \"تعالوا نعمل أحلى أكلة\" بخط صغير ولون فاتح. المشاهدات كانت قليلة. تتوقع ليه؟",
          options: [
            "الخط صغير ولونه فاتح ومفيش Contras، فمحدش عرف يقرا الكلام.",
            "صورة ولاء مش جذابة ومش هتخلي الناس تدوس على الفيديو.",
            "الطبخة صعبة، ومحدش بيحب يتفرج على حاجات صعبة."
          ],
          correctIndex: 0,
          explanation: "الـ Thumbnail لازم يكون فيه Contrast عالي وخط ضخم وواضح عشان العين تلقط المعلومة في 0.3 ثانية، وصيغة الكلام تكون 2-4 كلمات قوية مش جملة كاملة."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "أحمد بيعمل قناة عن مراجعة المنتجات التكنولوجية. عاوز يعمل Thumbnail لفيديو بيراجع فيه موبايل جديد. إيه أحسن حاجة ممكن يعملها عشان يشد الناس؟",
          options: [
            "يصوّر الموبايل من ٦ زوايا مختلفة ويحطهم كلهم في الـ Thumbnail عشان يبين كل التفاصيل.",
            "يحط صورة للموبايل بس بخط كبير وواضح وكلمتين زي \"صدمة! موبايل جديد\" بلون أصفر على خلفية سودة.",
            "يحط صورته وهو ماسك الموبايل وعامل تعابير وش مُتفاجئة، ويكتب اسم الموبايل بس."
          ],
          correctIndex: 1,
          explanation: "الـ Thumbnail الفعّال بيكون فيه Subject واضح (الموبايل) في المنتصف، و2-4 كلمات قوية بخط ضخم، وContrast عالي بين الألوان عشان يجذب العين."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "سارة بتعمل فيديوهات تعليمية عن التصميم، عملت فيديو جديد عن استخدام برنامج Canva. اختارت 3 Templates بتحبهم وبتستخدمهم باستمرار في كل فيديوهاتها. ليه التصرف ده هو الأصح؟",
          options: [
            "عشان تقلل وقت ومجهود تصميم كل مرة، وتستغل ميزة التكرار.",
            "عشان تحقق 'Consistency' ودي مهمة أوي لبناء البراند وتكوين هوية سهلة للتعرف عليها.",
            "عشان توفر فلوس الاشتراك في Canva، وتستخدم النسخ المجانية فقط."
          ],
          correctIndex: 1,
          explanation: "الـ Consistency أو الاتساق في استخدام الـ Templates مهم جداً عشان يبني هوية قناة أو براند متناسقة يقدر الجمهور يتعرف عليها بسهولة."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صمّم ٣ Thumbnails مختلفة لنفس الفيديو",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "نفس الفيديو، ٣ Thumbnails مختلفة، كل واحدة مبنية على نفس الـ ٣ عناصر بطريقة مختلفة.",
      prompt:
        "في تسليمك:\n\n١) عنوان الفيديو + الجمهور:\n٢) Thumbnail ١ — صف الـ ٣ عناصر: نص (≤ ٣ كلمات) + صورة + ألوان مضادة:\n٣) Thumbnail ٢ — نفس البنية بصياغة بصرية مختلفة:\n٤) Thumbnail ٣ — نفس البنية، تجربة عكس (مثلاً وش بدل Object):\n٥) عنوان الفيديو على YouTube/المنصة بـ ≤ ٦٠ حرف (شغل عليه):\n٦) أنهي Thumbnail هتختاره ولِيه؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "٣ Thumbnails بتطبّق الـ ٣ عناصر",
          weight: 60,
          criteria: [
            "كل Thumbnail نصّه ≤ ٣ كلمات (مش جملة كاملة).",
            "الـ ٣ مختلفين فعلاً، مش نفس التصميم بألوان مختلفة.",
          ],
        },
        {
          label: "العنوان + الاختيار",
          weight: 40,
          criteria: [
            "العنوان ≤ ٦٠ حرف وفيه وعد/فضول.",
            "اخترت Thumbnail واحد بالاسم مع سبب مرتبط بالجمهور.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "كل lesson card في /curriculum له thumbnail + caption",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "كل lesson card في /curriculum له thumbnail + caption",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Creator — نفس اللي بتتعلمه. فتحت /curriculum، شفت grid من cards — كل card فيه icon + lesson title + module label. الـ thumbnail والـ caption بيخلّيك تختار الدرس قبل ما تدخله. مفيش mystery boxes.",
      bullets: [
        "Icon من lucide-react بيمثّل موضوع الدرس.",
        "Caption قصيرة: عنوان + module + duration.",
        "Hover effect بيعرض extra info — مش لازم تدخل لتعرف.",
      ],
      pathAngle: "creator",
      link: { label: "افتح /curriculum", href: "/curriculum" },
    },
  }
];