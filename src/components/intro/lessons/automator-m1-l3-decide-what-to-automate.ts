import {
  GitBranch,
  PlayCircle,
  Lightbulb,
  Scale,
  Rocket,
  Image as ImageIcon,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import automatorM1DecideWhatToAutomateScreenshot from "@/assets/lessons/unique/automator-m1-l3-decide-what-to-automate.jpg";
/**
 * Automator · M1 · Lesson 03 — قرّر إيه يتأتمت
 */
export const AUTOMATOR_M1_DECIDE_WHAT_TO_AUTOMATE_BLOCKS: IntroLessonContent = [
  {
    icon: GitBranch,
    eyebrow: "HERO",
    title: "مش كل pattern يستاهل",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "في حاجات لو أتمتّها = توفير حقيقي.",
        "وفي حاجات لو أتمتّها = هدر وقت أكبر.",
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
        { term: "ROI (Return on Investment)", meaning: "المكسب اللي بيرجعلك في جيبك بعد ما تشيل التكاليف اللي صرفتها.", example: "لو صرفت ألف جنيه على إعلان وجالك مبيعات بألفين، يبقى المكسب اللي طلع هو ده الـ ROI." },
        { term: "Free Tier", meaning: "دي النسخة \"الببلاش\" في أي برنامج، بتجربها قبل ما تدفع اشتراك.", example: "زي ما بتعمل أكونت فيسبوك ببلاش، الأدوات دي بتديك جزء من خدماتها من غير دفع." },
        { term: "Database / Inventory", meaning: "المكان اللي بتخزن فيه بياناتك ومنظمها عشان ترجعلها وقت ما تعوز.", example: "لو إنت محاسب وبتحط فواتيرك في \"شيت إكسيل\"، الإكسيل هنا هو الـ Database بتاعتك." },
        { term: "Task Candidate", meaning: "أي مهمة في شغلك بنفكر وبندرس ينفع نخلي الجهاز يعملها بدلنا ولا لأ.", example: "بدل ما ترد على رسايل العملاء واحد واحد، دي \"مهمة مرشحة\" إننا نخلي الكمبيوتر يعملها أوتوماتيك." },
        { term: "Workflow / Behavior Architecture", meaning: "خريطة بتوصف خط سير المهمة، مين بيعمل إيه، وإيه بيسلم لمين.", example: "خط سير الطلب من أول ما العميل يطلب أوردر لحد ما يوصل لبيته وعاوزين ننظم الخطوات دي." },
        { term: "Make / Zapier / n8n", meaning: "أدوات سهلة بتخلي البرامج تكلم بعضها وتنفذ مهام لوحدها.", example: "برامج زي \"المكوجي\" اللي بيربط الهدوم ببعض، دول بيربطوا \"إيميلك\" بـ \"الإكسيل\" من غير برمجة." },
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
      caption: "إزاي تختار الـ candidates الصح للأتمتة.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "معادلة ROI الأتمتة",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "المعادلة: (الوقت اللي بيتوفّر × عدد المرات في الشهر) ÷ (وقت بناء الـ Flow + تكلفته) = هل يستاهل؟",
        "Pattern: كل ما حد يملا الـ contact form، بتنسخ بياناته يدوي لـ Google Sheet وبعدين تبعتله WhatsApp ترحيب.",
        "الوقت يدوي: 4 دقايق × 30 مرة في الشهر = 120 دقيقة (ساعتين).",
        "وقت بناء Flow في Make: 30 دقيقة مرة واحدة. التكلفة: مجاني في الـ free tier.",
        "النتيجة: استثمار 30 دقيقة عشان توفّر ساعتين شهريًا للأبد. يستاهل بضرب.",
        "Counter-example: كتابة Email شخصي لشريك business مرة كل شهرين. ده مش pattern — ده شغل بشري. سيبه.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "صفحة /behavior-architecture",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: automatorM1DecideWhatToAutomateScreenshot,
      alt: "سكرين شوت من المنصة",
      caption: "صفحة /behavior-architecture بتاعتنا = مكتبة قرارات الأتمتة. كل قاعدة فيها بتجاوب على نفس السؤال اللي بتسأله إنت: «الـ pattern ده يستاهل أتمتة، ولا الإنسان لازم يتدخّل؟». بنفس المنطق ده اختار candidates من الـ audit بتاعك.",
      label: "من المنصة — صفحة /behavior-architecture",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "Speed vs Quality vs Cost",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — بتقرّر بالحماس",
        body: "«ده هيبقى cool لو أتمت». بتفتح Make وتبدأ تبني. بعد 3 ساعات، Flow يشتغل مرة واحدة في الشهر ومحدش بيستفيد منه.",
      },
      right: {
        label: "RIGHT — بتقرّر بالمعادلة",
        body: "كل candidate من الـ audit، بتحسب ROI. لو الـ payback أقل من شهرين — ابني. لو أكتر — استنّى pattern أحسن. القرار بأرقام، مش حماس.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "حدّد أول 3 Flows هتبنيهم",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m1-l3-decide-what-to-automate-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "أنت مدير مشروع جديد، وعايز توفّر وقت فريقك. لقيت إنهم بيقضوا ساعة كل يوم الصبح بيجمعوا تقارير المبيعات من ٥ مصادر مختلفة (كل مصدر بياخد 10 دقايق) ويحطوها في إيميل واحد. لو عملت أتمتة للموضوع ده، هتاخد منك ٥ ساعات شغل مرة واحدة. تفتكر الاستثمار ده يستاهل ولا لأ على المدى الطويل؟",
          options: [
            "يستاهل جدًا، هتوفر ساعات كتير كل يوم على الفريق.",
            "ما يستاهلش، ٥ ساعات شغل مرة واحدة كتيرة عشان توفر ساعة كل يوم.",
            "يستاهل لو التقارير دي مهمة جدًا بس مش أكتر من كده."
          ],
          correctIndex: 0,
          explanation: "بالحسبة، توفير ساعة يوميًا يعني 20 ساعة عمل شهريًا (لو 20 يوم عمل). استثمار 5 ساعات مرة واحدة عشان توفر 20 ساعة كل شهر ده ROI عالي جدًا ويستاهل."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "عندك موقع الكتروني، وكل أسبوعين بتكتب مقال جديد يدوي وتبعته لإيميل العملاء بنفسك، الموضوع بياخد منك نص ساعة. فكرت تعمل أتمتة للموضوع ده عن طريق أداة هتاخد منك ٤ ساعات عشان تبني الـ Flow وممكن تكلفك ١٠ دولار شهريًا. تفتكر الأتمتة دي هتكون استثمار كويس ولا لأ؟",
          options: [
            "استثمار ممتاز، هتوفر نص ساعة كل أسبوعين وده وقت كبير.",
            "مش مستاهلة خالص، الوقت اللي بتوفره قليل جداً مقارنة بالوقت والتكلفة.",
            "ممكن تستاهل لو عدد العملاء كبير أوي بس."
          ],
          correctIndex: 1,
          explanation: "توفير نص ساعة كل أسبوعين يعني ساعة واحدة بس في الشهر. استثمار 4 ساعات و10 دولار شهريًا عشان توفر ساعة واحدة مش ROI كويس خالص، وده يعتبر هدر وقت أكبر."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "العملاء عندك كل ما بيسجلوا في المنتدى، بتبعتلهم إيميل ترحيبي personalised بالاسم يدوي. الموضوع بياخد دقيقة لكل عميل، وبيجيلك حوالي ٥٠ عميل جديد في الشهر. لو بنيت Flow في Make عشان يعمل ده أوتوماتيك، هياخد منك ساعة ونص شغل مرة واحدة، وهتستخدم الـ Free Tier. تفتكر دي فرصة كويسة للأتمتة؟",
          options: [
            "لا، الإيميل الـ personalised أهم إنه يكون مكتوب يدوي عشان الإحساس الشخصي.",
            "آه طبعًا، هتستثمر ساعة ونص مرة واحدة عشان توفر ٥٠ دقيقة كل شهر للأبد وببلاش.",
            "مش لازم خالص، دقيقة لكل عميل مش رقم كبير ومش مستاهل أتمتة."
          ],
          correctIndex: 1,
          explanation: "توفير 50 دقيقة شهريًا مقابل استثمار ساعة ونص مرة واحدة وبدون تكلفة إضافية (Free Tier) ده ROI ممتاز، ويوضح إن ده 'pattern' يستاهل الأتمتة."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "طبّق مصفوفة Decide على ٣ tasks من شغلك",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "مش كل task يستحق أتمتة. هتطبق ٤ معايير (Frequency / Time / Error rate / Joy) على ٣ tasks.",
      prompt:
        "لكل task من ٣ في شغلك، اعمل جدول:\n\n| Task | Frequency | Time saved/week | Error rate | Joy (1-5) | Score |\n\nبعدين:\n١) أنهي task فاز بأعلى score؟\n٢) أنهي task المفروض ما تأتمتش رغم إنه متكرّر (joy عالي)؟\n٣) لو الـ ROI للـ task الفايز هيكون بعد ٣ شهور، هتأتمته؟ ولّا هتختار الـ runner-up؟\n٤) في سطرين: ايه القاعدة اللي طلعت بيها لتقييم أي task جاي؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "جدول كامل لـ ٣ tasks",
          weight: 60,
          criteria: [
            "كل خانة معبّاة بقيمة حقيقية مش X.",
            "Score محسوب (مش تقدير غامض).",
          ],
        },
        {
          label: "Joy + قاعدة",
          weight: 40,
          criteria: [
            "استثنيت task بسبب joy عالي بمنطق.",
            "استخرجت قاعدة قابلة للتطبيق على tasks جاية.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "أتمتنا تقييم المهام — مش الردود الـ creative",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "أتمتنا تقييم المهام — مش الردود الـ creative",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Automator — نفس اللي بتتعلمه. تقييم mission submission = pattern متكرر (ROI عالي). فأتمتناه بـ AI evaluation. كتابة feedback لمتعلم اتعب في mission معيّن = creative (ROI منخفض للأتمتة) — سبناه يدوي.",
      bullets: [
        "mission_evaluation.functions — أتمتة كاملة للتقييم.",
        "Feedback نصّي للحالات الصعبة = manual.",
        "القاعدة: أتمت اللي بيتكرّر، اترك اللي بيحتاج حكم.",
      ],
      pathAngle: "automator",
      link: { label: "افتح /assistant-runtime", href: "/assistant-runtime" },
    },
  }
];