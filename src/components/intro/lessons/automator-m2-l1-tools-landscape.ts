import {
  Workflow,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import automatorM2ToolsLandscapeScreenshot from "@/assets/lessons/unique/automator-m2-tools-landscape.jpg";
/**
 * Automator · M2 · Lesson 01 — Make vs n8n vs Zapier
 */
export const AUTOMATOR_M2_TOOLS_LANDSCAPE_BLOCKS: IntroLessonContent = [
  {
    icon: Workflow,
    eyebrow: "HERO",
    title: "Make vs n8n vs Zapier",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "3 أدوات بنفس الفكرة.",
        "بس كل واحدة ليها مكانها الصح.",
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
        { term: "Workflow (سير العمل)", meaning: "طريق متخطط لخطوات الشغل وبتمشي لوحدها من غير ما تتدخل.", example: "لما زبون يبعت لك رسالة على واتساب، البرنامج يرد عليه ويبعت بياناته لشت الشغل لوحده." },
        { term: "Trigger (المُشغّل)", meaning: "الشرارة أو \"الخبطة\" اللي بتنبه البرنامج إنه يبدأ يشتغل دلوقت.", example: "أول ما زبون يسجل بياناته في إعلان فيسبوك، ده \"الترجر\" اللي بيخلي البرنامج يبدأ يتحرك فوراً." },
        { term: "Integration (الربط)", meaning: "توصيل برنامجين ببعض عشان يكلموا بعض ويتبادلوا بيانات.", example: "لو عايز تربط شيت الإكسيل بالواتساب عشان يبعت فواتير، العملية دي اسمها \"إنتيجريشن\"." },
        { term: "No-Code (من غير كود خالص)", meaning: "أدوات بتخليك تعمل برامج معقدة من غير ما تلمس الكود.", example: "زي ما تبني موقع بـ WordPress من غير ما تكتب سطر كود واحد، مجرد سحب وإفلات." },
        { term: "Self-hosted (استضافة ذاتية)", meaning: "إنك تشغل البرنامج على جهازك أو سيرفرك الخاص بدل ما تأجره جاهز.", example: "عارف لما تسطب ويندوز على لابتوبك؟ السيلف هوستد إنك تحط البرنامج على كمبيوتر (سيرفر) إنت اللي بتديره." },
        { term: "Open Source (مصدر مفتوح)", meaning: "برامج كودها متاح للكل، تقدر تستخدمها وتعدل فيها ببلاش من غير اشتراك.", example: "برامج n8n \"الأوبن سورس\" بتكون ببلاش لأن المبرمجين شغالين فيها مع بعض ومحدش بيمتلكها لوحده." },
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
      caption: "مقارنة سريعة بين الـ 3 أدوات وإمتى تستخدم كل واحدة.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "كلهم بيعملوا نفس الحاجة، بس بشكل مختلف",
    block: {
      kind: "numberedList",
      items: [
        "Zapier — الأسهل، الأغلى، أكتر integrations جاهزة. خيار مثالي لو لسه بتقول يا هادي في الأتمتة والـ workflows البسيطة.",
        "Make (سابقًا Integromat) — توازن بين السهولة والقوة. visual interface حلو، أرخص من Zapier، فيه scenarios معقّدة.",
        "n8n — الأقوى، open-source، تقدر تستضيفه بنفسك ببلاش. محتاج منك مجهود ووقت أكتر في الأول عشان تفهمه بس مفيش سقف للي تقدر تعمله.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "الطبقات التشغيلية بتاعتنا",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: automatorM2ToolsLandscapeScreenshot,
      alt: "سكرين شوت من المنصة",
      caption:
        "المنصة بتاعتنا فيها طبقات شغّالة 24/7 — Context، Retrieval، Memory. الـ 3 أدوات اللي بنقارنهم بيعملوا نفس الفكرة بالظبط بس على workflows بتاعتك إنت: كل scenario = طبقة بتسمع لـ trigger وبتنفّذ سلسلة actions.",
      label: "من المنصة — صفحة /operational-layers",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "اختيار الأداة الصح",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — بتختار الأرخص أو الأشهر",
        body: "بتفتح Zapier لأنه شهير، وبعد شهر تكتشف إن الـ workflow بتاعك محتاج 50 task في اليوم والاشتراك بقى 80$ شهري. أو بتفتح n8n وبتقعد أسبوع تحاول تشغّله.",
      },
      right: {
        label: "RIGHT — بتختار حسب الحجم والتعقيد",
        body: "Workflow بسيط وقليل (>100 task/شهر) → Zapier. متوسط ومحتاج logic → Make. كتير ومعقّد أو محتاج تحكّم كامل → n8n. الأداة معمولة عشان تريحك، مش عشان تدوخك وراها.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اختار أداة لمشروعك",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m2-tools-landscape-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "أنت لسه بتبدأ في الأتمتة ومش عايز توجع دماغك بكود أو تعقيدات، وميزانيتك مش مشكلة كبيرة. عايز تبني workflow بسيط يبعت إيميل أوتوماتيك كل ما يجيلك رد على فورم معين. هتختار أنهي أداة؟",
          options: [
            "Zapier",
            "Make",
            "n8n"
          ],
          correctIndex: 0,
          explanation: "Zapier هو الأسهل للمبتدئين ولـ workflows البسيطة، ورغم إنه أغلى بس ده مش عائق في السيناريو ده. بيوفر أكتر integrations جاهزة وده بيختصر عليك وقت ومجهود كبير."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "شركتك عندها متطلبات أمان عالية وعايزة تتحكم في كل حاجة بنفسها، ومش عايزة تعتمد على خدمة خارجية لاستضافة الـ workflows بتاعتها. كمان فريقك الفني عنده استعداد يبذل مجهود في التعلم عشان يبني workflows معقدة جدًا. إيه الأداة الأنسب ليكم؟",
          options: [
            "Zapier",
            "Make",
            "n8n"
          ],
          correctIndex: 2,
          explanation: "n8n بيسمحلك تشغله Self-hosted على سيرفراتك، وده بيديك تحكم كامل في الأمان والبيانات. كمان هو مفتوح المصدر والأقوى وتقدر تعمل بيه أي حاجة تقريبًا، وده مناسب للتعقيد العالي اللي الشركة محتاجاه."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "عندك مشروع متوسط، وعايز تبني workflows فيها شوية تعقيدات ولوجيك معين، بس في نفس الوقت مش عايز تدفع كتير زي Zapier، ومش مستعد تتعمق أوي في الـ Self-hosting زي n8n. إيه الأداة اللي هتديك التوازن ده؟",
          options: [
            "Zapier",
            "Make",
            "n8n"
          ],
          correctIndex: 1,
          explanation: "Make (سابقًا Integromat) بيقدم توازن كويس بين السهولة والقوة، وجهة المستخدم بتاعته كويسة (visual interface) وبيسمحلك تبني scenarios معقدة، وفي نفس الوقت أرخص من Zapier، وده بيخليه الخيار الأمثل للمشاريع المتوسطة اللي بتدور على قيمة مقابل سعر."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "اختار الـ Tool المناسب لـ ٣ سيناريوهات",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "Make / n8n / Zapier / Pipedream — كل واحد ليه نقطة قوة. هتاخد ٣ سيناريوهات وتختار الـ tool لكل واحد بسبب.",
      prompt:
        "لكل سيناريو من ٣ اكتب:\n\nسيناريو X:\n- وصف في سطرين:\n- الـ tool المختار:\n- ٢ أسباب تقنية للاختيار:\n- لو اضطريت تختار tool تاني، أنهي ولِيه؟\n\nالسيناريوهات:\n١) أتمتة شغل سوشيال (بوست على ٥ منصات + رد على كومنتات).\n٢) Internal tool لشركة (ربط CRM + DB + Slack).\n٣) Personal automation (إيميل + Notion + Calendar).",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "٣ قرارات مبررة",
          weight: 60,
          criteria: [
            "كل tool معاه ٢ أسباب تقنية مش «أسهل».",
            "البدائل معها سبب ضدها مش بس مزاياها.",
          ],
        },
        {
          label: "Fit للسيناريو",
          weight: 40,
          criteria: [
            "الاختيار مناسب طبيعة السيناريو (technical vs no-code).",
            "ما اختارتش نفس الـ tool لـ ٣ سيناريوهات.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "اخترنا serverFn بدل Make/n8n — ليه؟",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "اخترنا serverFn بدل Make/n8n — ليه؟",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Automator — نفس اللي بتتعلمه. Make و n8n و Zapier حلول رهيبة، بس لمنصة كاملة محتاجة logic داخلي معقّد، اخترنا TanStack serverFn. كل tool له use case — مش tool واحد بيحل كل شيء.",
      bullets: [
        "serverFn = type-safe + جوّه نفس الكود.",
        "n8n مناسب لـ integrations خارجية متعددة.",
        "Make مناسب لـ business users بدون كود.",
      ],
      pathAngle: "automator",
      link: { label: "افتح /assistant-runtime", href: "/assistant-runtime" },
    },
  }
];
