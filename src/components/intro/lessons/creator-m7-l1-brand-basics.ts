import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import brandImg from "@/assets/lessons/unique/creator-m6-brand-basics.jpg";

export const CREATOR_M6_BRAND_BASICS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "Brand مش لوجو — Brand هو إحساس",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "لما حد يشوف ٣ بوستات بتاعتك بدون اسمك، يعرف إنك إنت — ده Brand.",
        "٣ قرارات بس كفاية تبدأ: لون، خط، شكل لوجو بسيط.",
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
        { term: "Hex Code", meaning: "كود بالأرقام والحروف بيعرف الكمبيوتر اللون اللي إنت اخترته بالظبط.", example: "لما تختار لون \"أحمر فاقع\" لليافطة، الكود بتاعه بيبقى زي #FF0000 عشان المطبعة تطلعه صح." },
        { term: "CTA (Call to Action)", meaning: "الكلمة أو الزرار اللي بيخلي الزبون ياخد خطوة فعلية.", example: "زي زرار \"اشتري دلوقتي\" في إعلان الفيسبوك، أو \"كلمني واتساب\" اللي في آخر البوست." },
        { term: "Font", meaning: "هو ملف الخط اللي بتنزله وتستخدمه فعلاً وإنت بتصمم.", example: "زي ما تفتح برنامج الـ Word وتختار \"Arial\" أو \"Times New Roman\" عشان تكتب بيهم." },
        { term: "Typeface", meaning: "دي \"عيلة الخط\" الكبيرة اللي جواها كذا شكل وحجم.", example: "زي الفرق بين الخطوط الرفيعة الكلاسيك والخطوط التخينة المودرن." },
        { term: "Sans vs Serif", meaning: "الـ Serif خطوط ببروز (شنبات)، والـ Sans خطوط سادة وناعمة.", example: "زي خطوط الجرايد (Serif) بشنبات، أو خطوط شركات التكنولوجيا (Sans) سادة." },
        { term: "Brand", meaning: "إحساس الزبون ناحية شغلك، ميكس بين شكلك وطريقتك.", example: "زي براند \"طلبات\" أو \"فودافون\"، اللون الأحمر بتاعهم بيبقى ثابت في كل حتة." },
        { term: "Primary / Accent colors", meaning: "اللون اللي مسيطر على شغلك واللون الصغير اللي بينطقه.", example: "زي لما تظبط ألوان محلك: حيطة كحلي (أساسي) واللوجو دهبي (مكمل)." },
        { term: "Wordmark", meaning: "لوجو معتمد على كتابة اسم البراند بشكل فني مميز.", example: "زي لوجو شركة \"زين\" أو \"سامسونج\"، الاسم مكتوب بخط معين وبس." },
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
      caption: "إزاي تختار palette + خط + لوجو بسيط في ساعة.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "٣ قرارات تأسيسية بس",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "١. Palette من ٤ ألوان: Primary (اللون الأشهر اللي هيوصّفك)، Accent (مكمّل للـ CTAs)، Dark (نصوص وخلفيات داكنة)، Light (خلفيات فاتحة). جرّب Coolors.co — في ٣٠ ثانية بتطلّع palette متناسقة.",
        "٢. Typeface — اختار اتنين بس: واحد للـ Headings (Display أو Serif مميّز)، واحد للـ Body (Sans-serif نظيف). Google Fonts مجاني. تجنّب أكتر من خطّين — overcomplicated.",
        "٣. Wordmark بسيط — اسمك مكتوب بالخط بتاعك مع لمسة بسيطة (Underline، رمز جنبه، لون). لا تدفع لـ Logo Designer قبل ما توصل ١٠٠٠ متابع. اسمك المكتوب بشكل مدروس يكفّي.",
        "Brand Document = ملف واحد فيه الـ ٣ قرارات + ٣ أمثلة عملية. هتفتحه قبل أي بوست عشان متلخبطش. ساعة شغل النهارده = اتساق سنة كاملة.",
        "قاعدة الـ Brand: الـ Boredom = Recognition. لما تحس إنك زهقت من الـ palette/font، ده وقت الجمهور لسه بدأ يتعرّف عليهم. ثبّت ٦ شهور على الأقل.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "Brand Document — ٣ قرارات في صفحة",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: brandImg,
      alt: "صفحة Brand Basics — Palette، Typography، Logo",
      caption:
        "نموذج لـ Brand Document بسيط. ٤ ألوان مع كودهم، خط Heading وخط Body، لوجو بسيط. الـ Designer بياخد أسبوع لكتر التفاصيل — إنت محتاج ساعة. ابدأ بسيط وطوّر بعدين.",
      label: "Brand Document",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "غلطة المبتدئ في الـ Brand",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — كل بوست بشكل مختلف",
        body: "النهارده ألوان فاتحة، بكرة داكنة، بعده Trendy aesthetic مع GIF. الجمهور بيـscroll عـ الـ feed بتاعك ومش بيحس إنه واحد. مفيش ثقة، مفيش recognition.",
      },
      right: {
        label: "RIGHT — palette ثابتة + خط ثابت",
        body: "كل بوست بـ palette + خط واحد. حتى لو الـ content مختلف، الشكل ثابت. بعد ٢٠ بوست، حد يشوف بوست جديد بدون اسمك، هيعرف إنه بتاعك. ده Brand شغّال.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اعمل Brand Document في ساعة",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m6-brand-basics-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "إنت عامل Brand Document ومحدد فيه Palette وألوانك. النهاردة بتعمل بوست جديد وفي لون شيك عجبك بس مش من الـ Palette بتاعتك. تعمله إيه؟",
          options: [
            "أستخدم اللون الجديد عشان البوست يبقى شكله أحلى.",
            "ألتزم بالألوان اللي في Brand Document بتاعي عشان أحافظ على الاتساق.",
            "أضيف اللون الجديد للـ Palette بتاعتي عشان أستخدمه بعد كده."
          ],
          correctIndex: 1,
          explanation: "المفروض تلتزم بالـ Palette اللي اخترتها في الـ Brand Document بتاعك عشان الجمهور يبدأ يتعرف على هويتك البصرية، وده المقصود بقاعدة الـ Boredom = Recognition."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "أحمد عامل Brand جديد ومحدد Typeface للـ Headings و Typeface للـ Body بتاعه. جه يعمل تصميم لـ Thumbnail ليوتيوب وعايز يضيف خط تالت شكله مميز للعنوان عشان يجذب الناس. يعمل إيه؟",
          options: [
            "يستخدم الخط التالت المميز عشان يجذب انتباه أكبر.",
            "يلتزم بالخط اللي اختاره للـ Headings عشان يحافظ على البساطة والاتساق.",
            "يستخدم أكتر من خط من جوجل فونتس عشان يبين التنوع اللي عنده."
          ],
          correctIndex: 1,
          explanation: "الدرس بيقول تتجنب إنك تستخدم أكتر من خطين عشان التصميم ما يكونش overcomplicated ويحافظ على هوية بصرية ثابتة ومعروفة."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "سارة لسه بادئة على السوشيال ميديا وعايزة تعمل لوجو احترافي. هي عندها أقل من ٥٠٠ متابع. تعمل إيه عشان تحقق أقصى استفادة لميزانيتها؟",
          options: [
            "تدفع لـ Logo Designer عشان يعمل لها لوجو مبتكر ومختلف يجذب الناس.",
            "تصمم Wordmark بسيط باستخدام اسمها والخطوط اللي اختارتها مع لمسة مميزة.",
            "تستخدم لوجو جاهز من على الإنترنت وتعدل عليه عشان توفر وقت ومجهود."
          ],
          correctIndex: 1,
          explanation: "الدرس بينصح إنك ما تدفعش لـ Logo Designer قبل ما توصل لـ 1000 متابع، وبدلًا من كده تستخدم Wordmark بسيط باسمك المكتوب بشكل مدروس."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "اكتب Brand Document — ٣ قرارات في صفحة واحدة",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "Brand مش لوجو. هتكتب ٣ قرارات تأسيسية في صفحة واحدة، تحكم كل محتوى وتعليق وثمن جاي.",
      prompt:
        "في تسليمك اكتب:\n\nالقرار ١ — Voice & Tone:\n   - النبرة في ٣ كلمات (مثال: حازم، عملي، مش رسمي).\n   - مثال جملة بتعبّر عن النبرة.\n   - النبرة اللي رافضها (مثال: شعاراتي، تحفيزي مبالغ فيه).\n\nالقرار ٢ — Visual Identity:\n   - لون أساسي + لون مساعد (Hex):\n   - Font واحد للعناوين + Font للنص:\n   - شكل الـ Thumbnails (Style واحد ثابت).\n\nالقرار ٣ — Promise:\n   - في جملة: «بعد ٣ شهور من متابعتي، إنت هتقدر …»\n   - ايه اللي مش هوعد بيه؟\n\nفي الآخر: لو في تناقض بين القرارات الـ ٣، فين؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "الـ ٣ قرارات مكتملة",
          weight: 60,
          criteria: [
            "Voice + Visual + Promise كلهم متعرّفين بحاجة ملموسة، مش وصف عام.",
            "Visual فيه ألوان Hex وFonts بأسماء، مش «ألوان دافية».",
          ],
        },
        {
          label: "النفي + التناقض",
          weight: 40,
          criteria: [
            "كل قرار فيه «اللي مش هعمله» كمان، مش بس اللي هعمله.",
            "فحصت التناقضات بين الـ ٣ قرارات (حتى لو قلت «مفيش»).",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "Design tokens موحّدة في كل صفحة",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "Design tokens موحّدة في كل صفحة",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Creator — نفس اللي بتتعلمه. ألوان واحدة، خطوط واحدة، spacing موحّد. كل صفحة في المنصة بتستخدم نفس الـ design tokens من src/styles.css. الـ brand consistency بتيجي من القواعد التقنية، مش من اللوجو.",
      bullets: [
        "ألوان كلها OKLCH variables في :root.",
        "نوع الخط واحد — مش 3 خطوط مختلفة.",
        "Spacing scale: 4, 8, 12, 16, 24, 32, 48 px — مفيش 17px عشوائي.",
      ],
      pathAngle: "creator",
      link: { label: "افتح أي صفحة", href: "/" },
    },
  }
];