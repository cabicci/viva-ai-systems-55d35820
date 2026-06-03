import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import temperatureScreenshot from "@/assets/lessons/builder-m4-l8-parameters.jpg";

/**
 * Builder · M4 · Lesson 01 — Temperature
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 */
export const BUILDER_M4_TEMPERATURE_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "Temperature: زرار العشوائية",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "اتفرّجت على نفس الـ AI يرد على نفس السؤال مرتين بإجابتين مختلفتين تمامًا؟",
        "ده مش عيب — ده زرار اسمه Temperature، وانت اللي بتلفّه.",
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
        { term: "Determinism", meaning: "لما تخلي الـ AI ملوش رأي، يديك نفس الرد بالظبط كل مرة.", example: "لو كتبت بوست \"صباح الخير\" ومسحته، وبعت نفس الجملة هينزل هو هو بالظبط من غير أي تاتش جديد." },
        { term: "Temperature (زرار العشوائية)", meaning: "الزرار اللي بتحدد منه الـ AI يكون \"تقليدي وباصم\" ولا \"مبدع وصرصور\".", example: "التاتش اللي المحاسب بيضيفه على التقرير عشان ميبقاش مجرد أرقام صماء، ده اللي الـ Temperature بيعمله." },
        { term: "Sampling (التنقية)", meaning: "العملية اللي الـ AI بيختار بيها الكلمة الجاية من وسط احتمالات كتير.", example: "زي لما تاجر يختار بضاعة من كذا مورد، الـ AI بيختار الكلمة اللي عليها الدور." },
        { term: "Playground / Console (المعمل)", meaning: "موقع (زي المعمل) بتدخل تجرب فيه إعدادات الـ AI قبل ما تستخدمه.", example: "صاحب براند بيجرب كذا شكل للوجو في مسودة قبل ما يطبع الأكياس فعلاً." },
        { term: "Parameters (الإعدادات المخفية)", meaning: "إعدادات مش بتبان للمستخدم العادي، المبرمجين هما اللي بيظبطوها من ورا.", example: "لو شغال في شات جي بي تي العادي مش هتلاقي الزرار ده، لازم تدخل \"المعمل\" عشان تتحكم فيه." },
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
      caption: "إيه هي Temperature، وإمتى تخلّيها واطية وإمتى تعليها.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "من الثبات للعشوائية — برقم واحد",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كل ما الـ AI بيختار الكلمة الجاية، عنده list احتمالات. Temperature هي اللي بتقرّر: ياخد الأكثر ترشيحًا (ثبات)، ولا يفاجئنا (إبداع)؟",
        "Temperature واطية (0 – 0.3): إجابات ثابتة، متسقة، يمكن مكررة. مثالية للمهام اللي محتاجة دقة — أكواد، استخراج بيانات، تصنيف، ترجمة.",
        "Temperature متوسطة (0.4 – 0.7): توازن بين الدقة والتنوع. مناسبة للشرح، الإيميلات، المحادثات العادية.",
        "Temperature عالية (0.8 – 1.2+): إبداع، مفاجآت، تنوّع. مناسبة لـ brainstorming، عناوين تسويقية، شعر، أفكار محتوى.",
        "ملاحظة: المدى ده (0-2) خاص بـ OpenAI. Claude مداه 0-1، وGemini 0-2 بـ default مختلف — المبدأ واحد (صفر = ثبات، الرقم العالي = إبداع)، الأرقام الدقيقة بتختلف.",
        "القاعدة: لو محتاج \"الإجابة الصح\" — قلّلها. لو محتاج \"١٠ أفكار مختلفة\" — رفّعها.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "كروت الموديولات في خريطة المنهج",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: temperatureScreenshot,
      alt: "خريطة المنهج — كرت موديول Introduction بأربع دروس بنفس التنسيق المتطابق",
      caption:
        "بصّ على كرت \"ابدأ من هنا\": ٤ دروس، نفس الشكل، نفس الترتيب (رقم → عنوان → أيقونة حالة)، صفر مفاجآت بصرية. ده ناتج Temperature واطية (≈0.2) — لأنه structure، مش إبداع. لو الـ AI ولّد الكروت دي بـ Temperature 0.9، كان كل كرت جالك بترتيب مختلف وعنوان بأسلوب مختلف وممكن lessons تتلخبط — وكنت هتفقد القدرة تتنقّل في المنهج. في المقابل، اسم المسار نفسه \"Builder\" والـ tagline \"من فكرة إلى منتج SaaS حقيقي\" دول طلعوا من session بـ Temperature أعلى عشان عايزين شخصية، مش انتظام.",
      label: "من الموقع — صفحة /curriculum",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "نفس المهمة × Temperature غلط",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — Temperature غلط",
        body: "بتطلب من الـ AI يستخرج رقم فاتورة من إيميل، Temperature = 0.9. النتيجة: كل مرة بيرجّع رقم مختلف، وأحيانًا بيخترع. أو العكس: بتطلب ١٠ عناوين تسويقية بـ Temperature = 0.1، فبيرجّعلك ١٠ نسخ تقريبًا متطابقة.",
      },
      right: {
        label: "RIGHT — Temperature مناسبة للمهمة",
        body: "استخراج بيانات / كود / تصنيف → 0.1-0.3. شرح وكتابة عملية → 0.5-0.7. brainstorming وعناوين وأفكار → 0.9-1.2. القاعدة: اسأل نفسك \"عايز إجابة واحدة صح، ولا تنوّع؟\" والرقم بيتحدّد لوحده.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "جرّب الفرق بإيدك في 3 محاولات",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m4-l8-parameters-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو بتعمل كود برمجي مهم جدًا والمطلوب إن النتائج تكون دقيقة ومحدش يشك في صحتها، إيه الـ Temperature اللي هتختارها عشان تتأكد إن الكود بيشتغل صح ومبيطلعش أخطاء غريبة؟",
          options: [
            "Temperature واطية (0.0 - 0.3)",
            "Temperature متوسطة (0.4 - 0.7)",
            "Temperature عالية (0.8 - 1.2+)"
          ],
          correctIndex: 0,
          explanation: "لما بنبقى محتاجين دقة وثبات في النتائج، زي في حالة الأكواد البرمجية، بنقلل الـ Temperature عشان الموديل يختار الكلمات والرموز الأكثر ترشيحًا وميعملش أي مفاجآت."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "مديرك طلب منك تكتب خمس أفكار إعلانية مبدعة ومبتكرة لحملة تسويقية جديدة، وممنوع إن الأفكار تكون تقليدية أو مكررة. إيه الـ Temperature اللي هتستخدمها عشان تطلع بأفكار جريئة ومختلفة؟",
          options: [
            "Temperature واطية (0.0 - 0.3)",
            "Temperature متوسطة (0.4 - 0.7)",
            "Temperature عالية (0.8 - 1.2+)"
          ],
          correctIndex: 2,
          explanation: "الـ Temperature العالية بتزود الإبداع والمفاجآت والتنوع في إجابات الموديل، وده بيبقى مثالي لمهام زي الـ brainstorming أو توليد أفكار تسويقية مبتكرة."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "بتجهز إيميل رسمي لعميل مهم عشان تشرحله تفاصيل خدمة جديدة. عايز الإيميل يكون واضح ومفهوم بس في نفس الوقت يكون فيه لمسة شخصية وميخلكش ممل. إيه الـ Temperature اللي هتختارها؟",
          options: [
            "Temperature واطية (0.0 - 0.3)",
            "Temperature متوسطة (0.4 - 0.7)",
            "Temperature عالية (0.8 - 1.2+)"
          ],
          correctIndex: 1,
          explanation: "الـ Temperature المتوسطة بتعمل توازن كويس بين الدقة والتنوع، وده بيخليها مناسبة للمهام اللي محتاجة وضوح في المعلومات ولمسة من المرونة والإبداع زي كتابة الإيميلات أو الشرح."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "قارن نفس الـ Prompt بـ ٣ Temperatures",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "هتجرّب prompt واحد على ٣ درجات Temperature وتشوف الفرق العملي — مش نظري.",
      prompt:
        "في تسليمك:\n\n١) الـ Prompt الواحد (انسخه كامل):\n٢) رد بـ Temperature = 0 (انسخه):\n٣) رد بـ Temperature = 0.7 (انسخه):\n٤) رد بـ Temperature = 1.2 (انسخه):\n٥) أنهي رد هتستخدم في الإنتاج ولِيه؟ — مربوط بطبيعة الـ Prompt (factual vs creative).",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "٣ ردود فعلية",
          weight: 60,
          criteria: [
            "الـ ٣ ردود منسوخين بالكامل (مش تلخيص).",
            "الـ Prompt واحد ثابت بين الـ ٣ تجارب.",
          ],
        },
        {
          label: "قرار مبرر",
          weight: 40,
          criteria: [
            "الاختيار مربوط بطبيعة الـ Prompt (factual vs creative).",
            "استخدمت مصطلح من الدرس (determinism / randomness / sampling).",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "Temperature المساعد متظبّط على ٠.٤",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "Temperature المساعد متظبّط على ٠.٤",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. اخترنا 0.4 عن قصد — منخفض كفاية إن ردود الأسئلة التعليمية تبقى متّسقة، وعالي كفاية إن المساعد ميبقاش مكرّر. لو رفعناه لـ 1.2 هتلاقي ردود غريبة.",
      bullets: [
        "أسئلة الـ syntax (مثلاً «إزاي أكتب prompt؟») — Temperature واطية = إجابة موحّدة.",
        "Top-p ثابت على 0.95 لتقليل الكلام الـ off-topic.",
        "جرّب نفس السؤال مرتين في /ai-assistant — هتلاقي الردود قريبة جدًا.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /ai-assistant", href: "/ai-assistant" },
    },
  }
];
