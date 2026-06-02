import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import wireframeImg from "@/assets/lessons/unique/builder-m6-wireframe.jpg";

export const BUILDER_M6_WIREFRAME_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "ارسم قبل ما تبني",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أسرع طريقة تخسر يومين هي إنك تبدأ تبني من غير ما ترسم.",
        "Wireframe بيخدك ٢٠ دقيقة — وبيوفّرلك ساعات Iteration مع الـ AI.",
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
        { term: "Visual hierarchy", meaning: "ترتيب العناصر في الصفحة عشان العين تشوف الأهم الأول.", example: "زي التاجر اللي بيقسم الفاكهة في المحل، أهم حاجة في الوش والباقي ورا." },
        { term: "Above the fold", meaning: "أول جزء بيظهر في الصفحة من غير ما تنزل لتحت.", example: "زي السلعة \"اللقطة\" اللي التاجر بيحطها في واجهة المحل عشان تتشاف من بعيد." },
        { term: "Iteration (التكرار)", meaning: "إنك تعيد وتزيد في التصميم وتعدله كذا مرة عشان يتحسن.", example: "زي المحاسب اللي بيجرب يغير شكل الجدول كذا مرة لحد ما يظبط." },
        { term: "Component (مكون)", meaning: "جزء من التصميم (زي زرار أو قائمة) ينفع تستخدمه كذا مرة.", example: "زي \"آرمة\" المحل اللي مكتوب عليها الاسم، دي حتة واحدة بنكررها." },
        { term: "Wireframe", meaning: "رسم كروكي بسيط بـ \"بوكسات\" بيوضح مكان كل حاجة فين.", example: "زي لما ترسم تقسيم الشقة بتباشير على الأرض قبل ما تبني وتدهن." },
        { term: "Low-fidelity", meaning: "تصميم \"على الماشي\" مفيهوش ألوان ولا صور، هيكل وبس.", example: "زي المسوق اللي بيشخبط فكرة إعلان على منديل بسرعة عشان ما تنساش." },
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
      caption: "وريك إزاي ترسم Wireframe في ٢٠ دقيقة على ورقة — بدون أدوات.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "بوكسات + Labels — مش تصميم",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الـ Wireframe مش تصميم. مفيش ألوان، مفيش fonts، مفيش صور. مجرد مستطيلات بـ Labels جوّاها: «Header»، «Hero Image»، «CTA Button»، «3 Cards»، «Footer».",
        "هدفه يجاوبك على ٣ أسئلة قبل ما تكلّم AI: (١) إيه اللي فوق الـ Fold؟ (٢) فين الـ CTA الرئيسي؟ (٣) إيه ترتيب الـ Sections؟",
        "لما تيجي تكلّم Lovable، بدل ما تقول «ابنيلي صفحة عن مطعم»، هتقول «صفحة فيها: Hero بـ صورة طبق + عنوان + زرار حجز، تحته 3 cards للأطباق المميّزة، تحته form التواصل». ده الفرق بين رد رخم ورد دقيق.",
        "الورقة والقلم أسرع من Figma في المرحلة دي. لو فيلت تستخدم أداة، Excalidraw أبسط حاجة.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "Wireframe = هيكل بس",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: wireframeImg,
      alt: "Wireframe بقلم رصاص لصفحة موبايل — Header، كرتين، أيقونات Navigation",
      caption:
        "Wireframe زي ده، مرسوم في ١٠ دقايق، بيوفّرلك ٢ ساعة محاولات مع الـ AI. كل بوكس له اسم، كل اسم بيتحوّل لـ component في الـ prompt.",
      label: "Wireframe مرجعي",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "إزاي تتعامل مع أول صفحة",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — تطلب من AI «ابنيلي landing page»",
        body: "بدون wireframe، الـ AI بيطلّع تخمين عام. هتشوفه، مش هيعجبك، هترجع تطلب تعديل، يطلّع تخمين تاني. ٥ محاولات و٣ ساعات وانت لسه شايل.",
      },
      right: {
        label: "RIGHT — ترسم، بعدين تكتب prompt مفصّل",
        body: "ورقة + ٢٠ دقيقة → wireframe بـ ٧ بوكسات و asma. الـ prompt بيبقى: «صفحة فيها: [قائمة بـ ٧ section مع وصف سطر لكل واحد]». الـ AI بيطلّع حاجة قريبة جداً من اللي في دماغك من أول مرة.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "ارسم Wireframe لأول صفحة",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m6-wireframe-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "صاحب كافيه طلب منك تعمل أبليكيشن يوصل أوردرات. لما جيت تعمل الـ Wireframe لأول صفحة، لقيت نفسك رسمت قوائم الأكل بالتفاصيل وألوان الخلفية اللي متخيلها. هل اللي عملته ده صح وإيه البديل الأمثل في مرحلة الـ Wireframe؟",
          options: [
            "لا، المفروض أركز على بوكسات بسيطة ومجرد تسميات للعناصر زي 'صورة طبق'، 'اسم طبق'، 'سعر' بس.",
            "أيوه صح، كده أنا بوصل الصورة كاملة للعميل من الأول.",
            "لا، كان المفروض استخدم صور أطباق حقيقية بدل تخيلي."
          ],
          correctIndex: 0,
          explanation: "الـ Wireframe مش تصميم، مفيش ألوان، مفيش fonts، مفيش صور. هو مجرد مستطيلات بتوضح مكان وتسمية العناصر الأساسية بس، هدفه نحدد الهيكل والترتيب."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "بتعمل Wireframe لصفحة رئيسية لموقع مستشفى. بعد ما خلصت الرسم على الورق، لقيت نفسك محددتش زرار 'احجز موعد الآن' كـ CTA رئيسي وواضح. إيه المشكلة اللي ممكن تحصل لو سبت الزرار ده مش مميز؟",
          options: [
            "المستخدم هيتوه ومش هيعرف إيه أهم إجراء ياخده في الصفحة. وده ممكن يضيّع عليا حجوزات كتير.",
            "الصفحة هتحتاج إعادة تصميم كاملة بعد كده.",
            "الـ AI مش هيقدر يفهم قصدي لما أقوله 'صفحة مستشفى'."
          ],
          correctIndex: 0,
          explanation: "أحد أهداف الـ Wireframe هو تحديد الـ CTA الرئيسي، عشان المستخدم يركز عليه ويبقى واضح جداً. أي تأخير في إظهار الـ CTA بيأثر على هدف الصفحة."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "طلبت منك تعمل صفحة لمحل ورد. بعد ما رسمت الـ Wireframe، لقيت إنك حاطط معرض صور كبير لأنواع الورد في الجزء الـ 'Above the fold'. هل ده الاختيار الأفضل للمساحة دي؟",
          options: [
            "لا، الـ 'Above the fold' لازم يكون فيه أهم العناصر اللي تجاوب على سؤال 'إيه الصفحة دي وبتعمل إيه؟' وغالباً يكون فيها الـ CTA الرئيسي عشان اللي بيتفرج 3 ثواني يفهم.",
            "أيوه، معرض الصور مهم جداً عشان الناس تشوف أنواع الورد بأسرع وقت.",
            "مش هتفرق كتير، كده كده الناس بتـscroll عشان تشوف كل حاجة."
          ],
          correctIndex: 0,
          explanation: "هدف الـ Wireframe يجاوبك على إيه اللي فوق الـ Fold، وده لازم يكون أهم محتوى يجذب المستخدم ويوضحله هدف الصفحة، مش مجرد معرض صور."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "ارسم Wireframe نصي لصفحتين بـ Grid",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "Wireframe قبل أي styling. هتوصف صفحتين بـ ASCII grid يخلّيك تشوف البنية قبل اللون.",
      prompt:
        "في تسليمك:\n\nصفحة ١ — Wireframe:\n+----------------------+\n|   [Header / Nav]    |\n|   [Hero + CTA]      |\n|   ...               |\n+----------------------+\n\nصفحة ٢ — Wireframe بنفس الشكل\n\nبعدين:\n- إيه القاعدة البصرية المشتركة بين الـ ٢ صفحات؟\n- لو شاشة موبايل، إيه اللي هيتغير في كل صفحة؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "Wireframe فعلي للـ ٢",
          weight: 60,
          criteria: [
            "البنية واضحة في الـ ASCII (مش وصف عشوائي).",
            "العناصر بأسماء حقيقية مش [Box1] [Box2].",
          ],
        },
        {
          label: "Consistency + Mobile",
          weight: 40,
          criteria: [
            "حدّدت قاعدة بصرية مشتركة (header/spacing/grid).",
            "وصفت تغيّر الموبايل، مش «هيتعدل تلقائي».",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "كل صفحة في المنصة كانت wireframe قبل ما تتبني",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "كل صفحة في المنصة كانت wireframe قبل ما تتبني",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. قبل ما نبني /system-state، رسمنا wireframe بسيط — 3 panels جنب بعض. الكود جه بعد كده. لو بنينا على طول، كنا هنرجع نعيد ساعتين.",
      bullets: [
        "Wireframe على ورقة = ٥ دقايق. Refactor بعد كده = ساعتين.",
        "كل route جديد في src/routes/ كان معاه sketch قبل التنفيذ.",
        "افتح /system-state تشوف الـ layout اللي اترسم قبل ما يتكتب.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /system-state", href: "/system-state" },
    },
  }
];