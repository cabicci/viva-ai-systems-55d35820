import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import creatorWhyContentScreenshot from "@/assets/lessons/creator-m1-l1-why-content.jpg";

/**
 * Creator · M1 · Lesson 01 (v2 — unified 5-part rhythm)
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 */
export const CREATOR_M1_WHY_CONTENT_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "المحتوى مش Posting",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "النشر مش محتوى.",
        "المحتوى = نظام تأثير مقصود.",
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
        { term: "Posting", meaning: "إنك تنزل أي حاجة وخلاص من غير هدف أو خطة واضحة.", example: "صاحب محل هدوم بينزل صور قميص كل يوم من غير ما يشرح ده لمين ولا فايدته إيه." },
        { term: "Content System", meaning: "خطة بتحدد بتكلم مين وليه، عشان البوستات تجيب مفعول.", example: "تاجر شطّار بيحدد: هيكلم العرايس، هيقدم نصايح فرش، وهدفه يبيع طقم السرير." },
        { term: "Audience", meaning: "الشخص المعين اللي إنت مستهدفه وعايز تحل له مشكلته.", example: "محاسب بيعمل فيديوهات بيشرح فيها للشركات الصغيرة إزاي توفر في الضرائب." },
        { term: "Leads", meaning: "زبائن مهتمة بجد بدأت تسأل وتتفاعل معاك مش مجرد لايك.", example: "واحدة بتبيع كيك، والناس بدأت تبعتلها \"بكام ده؟\" و \"بتوصلوا فين؟\" في الرسايل." },
        { term: "Manifesto (بيان تأسيسي)", meaning: "كلمتين بكتبهم لنفسي بحدد فيهم أنا ليه بعمل محتوى وعايز إيه.", example: "مسوق بيقرر: \"أنا هنا عشان أعلم الناس التسويق ببساطة بعيد عن التعقيد\"." },
        { term: "Outcome", meaning: "الهدف أو التأثير اللي عايز توصله للناس بعد ما يشوفوا البوست." },
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
      caption: "الفرق بين اللي بيـ«ينزل» واللي بيبني نظام تأثير.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "نشر vs نظام",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "النشر العشوائي بيجيب Views مؤقتة بتيجي وتروح، ومحدش بيفتكرك بعدها.",
        "المحتوى كنظام بيبني سلسلة واضحة: انتباه ← ثقة ← جمهور ← Leads ← نمو حقيقي للبيزنس.",
        "كل قطعة محتوى ليها هدف (Purpose)، جمهور محدّد (Audience)، رسالة واحدة (Message)، ونتيجة متوقعة (Outcome) مكتوبة قبل ما تتنشر.",
        "الفرق مش في عدد البوستات — الفرق إن في خلفها قرار.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "خريطة المنظومة",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: creatorWhyContentScreenshot,
      alt: "صفحة خريطة المنهج — مسارات متتابعة، دروس مترتّبة، وتقدّم محسوب.",
      caption:
        "المنصة نفسها مثال حي. كل عنوان، كل مسار، كل درس — اتحطّ بقرار.",
      label: "من الموقع — صفحة /curriculum",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "إزاي تفكّر في المحتوى صح",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — بتنشر عشان تفضل ظاهر",
        body: "بتدوّر على فكرة كل يوم، تنزل أي حاجة، وتقيس النجاح بعدد البوستات. الناس بتشوفك بس مش بتفتكرك.",
      },
      right: {
        label: "RIGHT — بتنشر عشان تبني تأثير",
        body: "قبل أي محتوى بتسأل: لمين؟ ليه؟ ايه الرسالة؟ وايه النتيجة المتوقعة؟ كل قطعة بتضيف لطوبة في بناء أكبر.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اكتب Manifesto المحتوى في 5 سطور",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m1-l1-why-content-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "ولاء عندها بيزنيس صغير لمنتجات العناية بالبشرة الطبيعية. قررت تعمل صفحة على فيسبوك عشان تزود مبيعاتها. بتنزل بوست كل يوم الصبح فيه صور لمنتجاتها وبسعرها. بعد شهر، عدد المتابعين زاد شوية بس مفيش مبيعات كتير ولا حد بيتفاعل. إيه الغلطة الأساسية اللي ولاء وقعت فيها بناءً على اللي درسته؟",
          options: [
            "بتعمل posting بس مش بتعمل content system.",
            "مبتستخدمش صور حلوة لمنتجاتها.",
            "مبتردش على الكومنتات بسرعة."
          ],
          correctIndex: 0,
          explanation: "ولاء بتنزل محتوى عشوائي بدون خطة واضحة لمين بتتكلم وليه وده يعتبر posting مش content. المحتوى الصح لازم يكون ليه هدف وجمهور ورسالة واضحة."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "أحمد بيقدم محتوى عن تطوير الذات على يوتيوب. بعد كل حلقة بينزلها، بيلاقي ناس كتير بتشوف الفيديو بس مفيش منهم اللي بيشترك في الكورس المدفوع بتاعه. إيه النتيجة اللي أحمد محتاج يركز عليها أكتر في المحتوى بتاعه عشان يحقق هدفه؟",
          options: [
            "عدد المشاهدات (Views) تزيد أكتر.",
            "العملاء المحتملين (Leads) اللي يسجلوا في الكورس يزيدوا.",
            "يقضي وقت أطول في المونتاج عشان الفيديو يبقى احترافي."
          ],
          correctIndex: 1,
          explanation: "أحمد محتاج يركز على الـ Outcome وهو تحويل المهتمين لعملاء محتملين (Leads). المشاهدات لوحدها مش بتوصل للنمو الحقيقي للبيزنس."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "منى عايزة تبدأ قناة على إنستجرام عشان تعلم الأمهات إزاي يوفقوا بين شغلهم ورعاية أطفالهم. قبل ما تنزل أول بوست، قعدت تكتب في ورقة مين الأمهات دول؟ إيه مشاكلهم؟ وإيه اللي هي عايزاهم يحسوا بيه أو يعملوه بعد ما يشوفوا البوستات بتاعتها. التصرف ده بيعبر عن إيه؟",
          options: [
            "بتبني Manifesto خاص بيها قبل ما تبدأ.",
            "بتضيع وقت كتير في التخطيط اللي ممكن يتعمل بعدين.",
            "بتعمل بحث عن المنافسين بس."
          ],
          correctIndex: 0,
          explanation: "منى بتعمل اللي بيسموه Manifesto أو بيان تأسيسي ليها. وده عبارة عن ٥ سطور بتحدد ليه بتعمل محتوى ولمين وإيه النتيجة اللي عايزة توصلها، وده أساس لأي Content System ناجح."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "اكتب Manifesto المحتوى بتاعك في ٥ سطور",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "قبل أول بوست، اتفق مع نفسك إنت بتنشر ليه. هتكتب Manifesto صغير يقود كل قرار محتوى جاي.",
      prompt:
        "في تسليمك اكتب:\n\n١) لمين بتعمل المحتوى ده؟ (جمهور محدّد، مش «الناس»)\n٢) ليه؟ — الرسالة اللي عايز توصلها في جملة\n٣) إيه التحوّل اللي عايز يحصل للمتابع بعد ٣ شهور من متابعتك؟\n٤) إيه اللي مش هتعمله مهما حصل؟ (خط أحمر)\n٥) لو حد سألك «بتعمل إيه؟» — رد في جملة واحدة من ٨ كلمات أو أقل.",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "الجمهور + الرسالة",
          weight: 50,
          criteria: [
            "الجمهور محدّد بصفة مهنة/مرحلة/مشكلة (مش «الكل» أو «الشباب»).",
            "الرسالة في جملة واضحة، مش وصف عام للمحتوى.",
          ],
        },
        {
          label: "الخط الأحمر + الجملة الواحدة",
          weight: 50,
          criteria: [
            "كتبت خط أحمر فعلي (نوع محتوى/أسلوب/موضوع رافضه).",
            "الجملة الواحدة ≤ ٨ كلمات وبتوصّف وعد واضح.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "/dashboard و /curriculum — محتوى منظّم بهدف",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "/dashboard و /curriculum — محتوى منظّم بهدف",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Creator — نفس اللي بتتعلمه. كل قطعة محتوى في المنصة (درس، video، diagram) متبنية عشان توصلك لـ outcome محدد. مش بنحط دروس عشان نقول إن المنصة كبيرة — كل درس له mission تطبيقي.",
      bullets: [
        "كل lesson فيه quiz + mission — مفيش محتوى استهلاكي.",
        "/dashboard بيوريك إنت فين والـ outcome إيه.",
        "حذفنا ١٢ درس مكنش لهم mission واضح خلال آخر شهرين.",
      ],
      pathAngle: "creator",
      link: { label: "افتح /dashboard", href: "/dashboard" },
    },
  }
];
