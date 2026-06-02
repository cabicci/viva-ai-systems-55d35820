import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import firstPromptImg from "@/assets/lessons/unique/builder-m6-first-prompt.jpg";

export const BUILDER_M6_FIRST_PROMPT_TO_LOVABLE_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "أول prompt بتكتبه لـ Lovable",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الـ AI بيبني اللي بتطلبه — مش اللي في دماغك.",
        "أول prompt محدّد = صفحة قريبة من الهدف من أول محاولة.",
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
        { term: "Lovable", meaning: "المنصة اللي بتنفذ أوامر الذكاء الاصطناعي وبتحوله لكود وبرنامج شغال.", example: "زي ما الواتساب برنامج جواه ذكاء اصطناعي، لوفابل منصة بتستخدم الذكاء الاصطناعي عشان تبني برامج." },
        { term: "Arabic Display", meaning: "أسلوب كتابة الخط العربي؛ بيكون لونه وشكله واضح ومناسب للعناوين.", example: "تاجر ملابس بيختار 'خط عريض' لاسم المحل عشان يبان فخم ويجذب الزبائن من بعيد." },
        { term: "Wireframe (واير فريم)", meaning: "رسمة كروكي سريعة (بالإيد أو برنامج) بتحدد مكان العناصر في الصفحة.", example: "محاسب بيخطط شكل الفاتورة على ورق قبل ما يبرمجها عشان يعرف الأرقام هتتحط فين." },
        { term: "Reference (المرجع)", meaning: "صورة أو موقع بتبعته عشان تقول 'أنا عايز حاجة شبه دي'.", example: "مرجع بصري لصفحة دفع، زي لما تورّي المصمم صورة أوردر من أمازون وتقول له 'عايز زي ده'." },
        { term: "Scope (السكوب)", meaning: "المساحة اللي هتتحرك فيها؛ يعني هتعمل إيه بالظبط ومش هتعمل إيه.", example: "لو بتعمل سيستم للعيادة، هتقول 'أنا عايز حجز الكشف بس'.. ده هو حدودك دلوقتي." },
        { term: "Stack (الستاك)", meaning: "الأدوات والبرامج اللي لوفابل بيستخدمها في الخلفية عشان يبني موقعك.", example: "زي طباخ بيحدد هيستخدم (بوتاجاز غاز ولا كهرباء) عشان يطلع الأكلة، بس لوفابل بيشيل عنك الحيرة." },
        { term: "Spec (المواصفات)", meaning: "روشتة فيها التفاصيل التقنية اللي إنت عايزها تظهر في المنتج بتاعك.", example: "لو مسوّق عقارات بيوصف صفحة البيع: 'لازم يكون فيها لوكيشن العقار وسعره وزرار للاتصال'." },
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
      caption: "مثال حي — prompt قصير vs prompt مفصّل، والفرق في الناتج.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Anatomy of a great first prompt",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Prompt كويس ليه ٥ أجزاء: (١) Goal — إنت بتبني إيه ولمين، (٢) Scope — صفحة واحدة بس، (٣) Sections — قائمة من الـ wireframe بتاع M6.2، (٤) Style — كلمتين عن المزاج (مثلاً: «دافي، عربي RTL، tones بنّية»)، (٥) Constraints — حاجات تجنّبها (مفيش login، مفيش form، إلخ).",
        "ابدأ صغير. صفحة واحدة. قسم واحد فيها بالظبط زي ما رسمته. لما تشتغل صح، روح للقسم اللي بعده. مش كل المنتج في prompt واحد.",
        "متفترضش الـ AI شايف الـ wireframe. اوصفه بالكلمات: «section أول: hero بـ صورة على اليمين، عنوان بخط كبير وزرار CTA على الشمال». الكلام بدل الرسم.",
        "لو فيه مرجع بصري (موقع شبيه)، الصق الـ link. الـ AI ميقدرش يفتحه بس بيفهم النية لو وصفت إنت اللي شدّك فيه: «زي stripe.com في النظافة، بس بألوان دافية».",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "Prompt بسيط، نتيجة قريبة",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: firstPromptImg,
      alt: "مثال لواجهة Lovable — prompt على الشمال، preview على اليمين",
      caption:
        "لاحظ الـ prompt مش «اعملي موقع». مكتوب فيه نوع الصفحة (landing page)، النشاط (coffee shop)، والـ sections المطلوبة (hero, menu, contact). الناتج على اليمين قريب جداً من المتوقّع. ده شكل أول prompt كويس.",
      label: "Lovable — مثال أول prompt",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "نفس الفكرة، Prompt مختلف",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — «اعمل موقع لكافيه»",
        body: "٧ كلمات. الـ AI هيخمّن: ألوان عشوائية، sections مش اللي عايزها، صور stock مش متعلقة. هترجع ٦ مرات تعدّل. كل تعديل = ضياع وقت + ضياع focus.",
      },
      right: {
        label: "RIGHT — Spec من ٥ أجزاء",
        body: "«Landing page لكافيه في القاهرة (Goal). صفحة واحدة بس (Scope). Sections: Hero بـ صورة وزرار حجز، Menu بـ ٦ أطباق في grid، Contact بـ form و map (Sections). Style: دافي، tones بنّية وبيج، خط Arabic Display (Style). متعملش login ولا cart (Constraints).» ده prompt يطلّع نتيجة قابلة للنشر.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اكتب أول prompt من Wireframe",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m6-first-prompt-to-lovable-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو بتستخدم Lovable وعايز تبني صفحة لشركة عقارات، بس عايز الـ Lovable يفهم إنك عايز صفحة رئيسية (Homepage) مش صفحة تواصل. إيه أحسن صياغة للـ Scope عشان توضح ده للـ AI؟",
          options: [
            "هابدأ بصفحة واحدة بس وهي Home Page",
            "ابنيلي صفحة رئيسية لشركة عقارات وبس",
            "الصفحة دي عن شركة عقارات، خليها كويسة"
          ],
          correctIndex: 0,
          explanation: "الدرس بيأكد إن لازم نحدد الـ scope بوضوح ونقول 'صفحة واحدة بس وهي...' عشان الـ AI يركز على المطلوب تحديداً."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "الـ Designer بتاعك بعتلك wireframe لصفحة وعايزك تبنيها بـ Lovable. إنت محتاج توصف الـ sections لـ Lovable. إيه أحسن طريقة توصف بيها أول section اللي هو عبارة عن صورة كبيرة على الشمال وعنوان رئيسي وزرار تسجيل دخول على اليمين؟",
          options: [
            "section أول:hero، صورة شمال وعنوان وزرار تسجيل دخول يمين.",
            "section أول: hero بـ صورة على الشمال، عنوان رئيسي وزرار تسجيل دخول على اليمين.",
            "section أول: صورة كبيرة وعنوان وزرار."
          ],
          correctIndex: 1,
          explanation: "الدرس بيقول نوصف الـ sections بالكلمات بالتفصيل، زي 'section أول: hero بـ صورة على الشمال، عنوان بخط كبير وزرار CTA على اليمين' عشان الـ AI يفهم كويس."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "إنت عايز تبني صفحة لشركة أكل صحي، وعايز الـ Lovable يتجنب دلوقتي أي حاجة ليها علاقة بالدفع أو الطلبات عشان لسه مش هتعملها. إيه أنسب 'Constraints' تكتبها في الـ prompt بتاعك؟",
          options: [
            "مفيش دفع أو طلبات دلوقتي",
            "مفيش payment أو order form في الـ build ده.",
            "اتجنب صفحات الدفع والطلبات."
          ],
          correctIndex: 1,
          explanation: "الدرس بيوصي بالوضوح وتحديد اللي مش عايزينه بدقة، زي 'مفيش login، مفيش form، إلخ' عشان الـ AI يفهم حدود الطلب صح."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "اكتب أول Prompt لـ Lovable يبني شاشة كاملة",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "أول Prompt بيحدّد ٧٠٪ من جودة المشروع. هتكتب Prompt متكامل: Goal + Stack + Design + Sections.",
      prompt:
        "في تسليمك Prompt كامل بالبنية دي:\n\nGoal: [جملة واحدة]\nWho is this for: [الجمهور]\nStack/Stage: [Landing? App? Auth?]\nDesign direction: [نبرة بصرية + ٢-٣ ألوان أو مرجع]\nSections (بالترتيب):\n  1) ...\n  2) ...\n  3) ...\nCTAs:\n  - Primary: ...\n  - Secondary: ...\nMust avoid: [حاجات مرفوضة]",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "بنية الـ Prompt كاملة",
          weight: 60,
          criteria: [
            "كل قسم من الـ ٧ موجود ومش فاضي.",
            "Sections بترتيب + CTAs محددين.",
          ],
        },
        {
          label: "Design + Must avoid",
          weight: 40,
          criteria: [
            "Design direction فيه ألوان/مرجع، مش «modern».",
            "Must avoid بحاجات حقيقية، مش «حاجة وحشة».",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "الـ prompt اللي بدأنا بيه المنصة دي",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "الـ prompt اللي بدأنا بيه المنصة دي",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. أول prompt كتبناه لـ Lovable كان جملتين: «منصة تعليم AI بالعربي، الصفحة الرئيسية فيها hero و 5 paths». اللي شفته جالنا في 30 ثانية — وكمّلنا من هناك.",
      bullets: [
        "بدأنا بـ scope صغير: الـ landing page بس.",
        "كل feature بعد كده اتبنت بـ prompt واحد منفصل.",
        "تقدر تشوف كل النسخ الأولى في git history للمشروع.",
      ],
      pathAngle: "builder",
      link: { label: "افتح الصفحة الرئيسية", href: "/" },
    },
  }
];