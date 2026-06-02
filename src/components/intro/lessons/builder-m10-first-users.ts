import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import firstUsersScreenshot from "@/assets/lessons/builder-m10-first-users.jpg";

/**
 * Builder · M10 · Lesson 02 — أول مستخدمين + Iteration
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 *
 * الدرس الأخير في مسار Builder. التطبيق live، دلوقتي بنحوّله لمنتج عنده مستخدمين فعليين.
 */
export const BUILDER_M10_FIRST_USERS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "أول ١٠ مستخدمين أهم من أول ١٠٠٠",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "التطبيق live (M10.1)، الـ URL شغّال، كل حاجة تمام تقنيًا. بس مفيش حد بيستخدمه — وده مش launch.",
        "أول ١٠ مستخدمين بيحدّدوا مستقبل المنتج: هما اللي يقولوك إنت بتحلّ مشكلة فعلًا، ولا بتبني حاجة محدش محتاجها.",
        "هدفك مش traffic ولا virality. هدفك ٥-١٠ مستخدمين بتعرفهم بالاسم، بتسمعهم كل أسبوع، وبتعدّل المنتج بناءً عليهم.",
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
        { term: "Funnel", meaning: "المشوار اللي بيمشيه الزبون من أول ما يشوف إعلانك لحد ما يشتري منك.", example: "زي الزبون اللي بيدخل محل هدوم يقيس بس ويمشي، أو يشتري ويخرج.. دي رحلته من أول الباب لحد الكاشير." },
        { term: "North Star Metric", meaning: "أهم رقم في مشروعك بيعرفك إنت بتكبر فعلاً ولا بتضيع وقتك.", example: "زي سواق التاكسي، أهم رقم عنده هو \"صافي الربح\" يومياً، ده اللي بيعرفه هو ماشي صح ولا غلط." },
        { term: "Early Adopters (أول ناس)", meaning: "أول ناس بيجربوا فكرتك وهي لسه \"عضم\" وبيستحملوا عيوبها عشان حابينها.", example: "لو بتفتح مطعم، دول قرايبك وصحابك اللي هيجوا ياكلوا ويجربوا أول يوم والفرن لسه بيطلع دخان." },
        { term: "Feedback Loop (لفة الرأي)", meaning: "تاخد رأي الناس، تعدل فوراً، وترجع توريهم اللي عملته عشان تتطور بسرعة.", example: "زي صاحب محل الموبايلات لما ياخد رأي الزبون في الجراب، ويغير النوع المرة الجاية عشان يرضيه." },
        { term: "Onboarding (ترحيب)", meaning: "شطارتك في إنك ترحب بالمستخدم وتعرفه يستخدم تطبيقك إزاي في أول دقائق.", example: "زي أول ما الزبون يدخل محلك وتعرفه العروض فين وتريحه عشان يحب المكان." },
        { term: "Retention (الاستمرارية)", meaning: "إن الزبون \"يعلّق\" معاك ويرجعلك تاني بدل ما يمسح التطبيق بعد مرة.", example: "لو عندك جيم، العبرة مش باللي اشتركوا، العبرة بكام واحد بجد بيجي يتمرن كل يوم." },
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
      caption: "إزاي تجيب أول مستخدمين بدون marketing، وإزاي تعرف لو المنتج بيشتغل فعلًا.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Acquisition → Activation → Retention → Iteration",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "1) Acquisition — منين بييجوا؟ في البداية، مش من Google ولا Ads. من ٣ مصادر: شبكتك المباشرة (واتساب، أصحاب)، communities متخصّصة (Discord, Reddit, مجموعات فيسبوك بتاعة المجال)، و DMs شخصية لناس قلت لنفسك \"دي بالظبط مين هيستفيد\". ١٠ DMs مدروسة > ١٠٠٠ منشور عام.",
        "2) Activation — بيوصلوا، بيعملوا الـ \"aha moment\"؟ كل منتج فيه فعل واحد لو المستخدم عمله = هيرجع. لـ Twitter: بيـ follow ٥ ناس. لـ Slack: بيبعت ٢ message. لـ تطبيقك: حدّده. قس نسبة المستخدمين اللي بيوصلوا للفعل ده في أول session. لو أقل من ٥٠٪، الـ onboarding بايظ.",
        "3) Retention — بيرجعوا تاني؟ ده الميزان الحقيقي للقيمة. متابع W1 (نسبة اللي رجعوا في الأسبوع التاني) أهم من عدد signups. لو ١٠٠ مستخدم signup و٠ رجعوا = منتج وحش. لو ١٠ signup و٧ رجعوا = منتج ممتاز عند مستخدمين قليلين، اعرف ليه.",
        "4) Iteration — اعمل Talk-to-User loop: كل أسبوع، كلّم ٣ مستخدمين (call ١٥ دقيقة). أسئلة محدّدة: \"إيه آخر مرة استخدمت التطبيق؟ ليه ساعتها؟ إيه اللي حاولت تعمله ومنفعش؟ لو التطبيق وقف بكرة، هيوحشك في إيه؟\". ٣ ساعات calls/أسبوع = ٣٠ insight قوي/شهر — مش هتلاقيهم في analytics.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "كل عداد في dashboard المتعلم = retention metric",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: firstUsersScreenshot,
      alt: "صفحة /dashboard — هيدر مرحبًا صديقي، ٣ كروت: السلسلة 0 يوم (ابدأ أول مهمة)، دروس مكتملة 0/30 (عبر كل المسارات)، Introduction 0/4 (ابدأ من هنا)، تحتها قوائم المسارات Builder/Creator/Automator/Analyst",
      caption:
        "الـ dashboard ده مش بيعرض أرقام عشوائية — كل كرت بيقيس نقطة في funnel الـ Activation/Retention. \"السلسلة 0 يوم\" = streak metric (لو بقت >٧، اليوزر بيرجع). \"دروس مكتملة 0/30\" = depth of engagement. \"Introduction 4/0\" = activation funnel — لو معديش الأربع دروس دي، اليوزر مرشّح يخرج. التطبيق ذكي بيستخدم نفس الأسلوب: يخلّي اليوزر يشوف تقدّمه بصريًا، لأن الأرقام دي بتحرّك سلوكه. لما تـ launch منتجك، كل feature لازم لها metric واضح إنت بتتابعه — مش مهم تعرف \"كم زائر\"، مهم تعرف \"كم وصلوا للقيمة وكم رجعوا\".",
      label: "من الموقع — صفحة /dashboard",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "Build & Pray vs Build → Talk → Iterate",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — تطلق وتستنّى الناس تيجي",
        body: "تـ launch على Product Hunt، تعمل tweet، تستنّى. تجيب ٥٠٠ زائر في يوم، ٢٠ signup، صفر رجعوا. تفسير غلط: \"Marketing ضعيف\". تضيف Ads. النتيجة نفسها بـ ١٠× التكلفة. مش بتعرف ليه مش راجعين، مش بتعرف مين هما، مش بتعرف إيه اللي مش شغّال. تضيف features عشوائية أملًا في إن واحدة تضرب — بس الـ core value مش واضح من الأساس.",
      },
      right: {
        label: "RIGHT — ١٠ مستخدمين، ٣ calls/أسبوع، تعديل واحد/أسبوع",
        body: "تجيب ١٠ مستخدمين من شبكتك. كل أسبوع تكلّم ٣ منهم ١٥ دقيقة. تسجّل: إيه عمله، فين علّق، إيه ضايقه. تختار عقدة واحدة بس وتحلّها هذا الأسبوع. تـ deploy. تخبّر المستخدم: \"اللي قلتلي عليه اتعمل\". تكرّر ٤ أسابيع. النتيجة: المنتج بيطوّر للمستخدمين الفعليين، الـ retention بيرتفع، وبتفهم بالظبط مين عميلك المثالي قبل ما تبدأ marketing.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "خطة launch من ٤ أسابيع — وحدّد الـ metric الواحد",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m10-first-users-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "بعد ما عملت تطبيق جديد بيساعد الناس تلاقي كتب نادرة بسهولة، حددت الـ North Star Metric بتاعك إنه يكون 'عدد المستخدمين اللي بيشتري كتاب واحد على الأقل كل أسبوع'. في الأسبوع الأول من الـ Acquisition، بعت لـ 10 أصحابك DM شخصي عشان يجربوا التطبيق. كام يوزر المفروض يكونوا جربوا التطبيق وكملوا الـ onboarding عشان تعتبر الأسبوع ده ناجح بناءً على الخطة؟",
          options: [
            "5 يجرّبوا، منهم 3 يكملوا onboarding",
            "10 يجرّبوا، منهم 7 يكملوا onboarding",
            "3 يجرّبوا، منهم 1 يكمل onboarding"
          ],
          correctIndex: 0,
          explanation: "الخطة بتقول إن في أسبوع الـ Acquisition، الهدف يكون 5 يجرّبوا التطبيق، منهم 3 يكملوا خطوات الـ onboarding."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "في الأسبوع التاني، عملت أول 3 مكالمات مع المستخدمين اللي جربوا التطبيق. واحد منهم قال: 'التطبيق عجبني بس لما باجي أدور على اسم كتاب معين، ساعات كتير بلاقي نتائج مش ليها علاقة خالص باللي ببحث عنه'. بناءً على الخطة، إيه أول حاجة مفروض تعملها بعد المكالمات دي؟",
          options: [
            "تحل مشكلة البحث دي فورًا وتخليها أولويتك القصوى الأسبوع ده.",
            "تجمع كل المشاكل اللي اتقالت وتحاول تحل أكتر من مشكلة في نفس الوقت.",
            "تتجاهل المشكلة دي وتطلب منهم يحاولوا يجربوا خطوات تانية في التطبيق."
          ],
          correctIndex: 0,
          explanation: "الخطة بتقول إن بعد مكالمات الأسبوع التاني، تختار مشكلة واحدة بس من اللي اتقالت وتحلها في نفس الأسبوع."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "بعد ما نفذت خطة الـ 4 أسابيع، جيت تقيّم موقف الـ retention. لقيت إن من الـ 10 مستخدمين الأوائل، 4 بس اللي رجعوا واستخدموا المنتج في الأسبوع الرابع. بناءً على 'قرار التوسع' إيه الخطوة الجاية اللي مفروض تاخدها؟",
          options: [
            "تبدأ تسوق للمنتج وتجيب 10 مستخدمين تانيين عشان تزود العدد.",
            "ترجع تتكلم مع المستخدمين عشان تحدد المشكلة الأساسية وتحلها قبل ما تزود مستخدمين جدد.",
            "تكتفي بالمستخدمين دول وتعتبر إن المنتج حاليًا مش مناسب للتوسع."
          ],
          correctIndex: 1,
          explanation: "الخطة بتقول لو نسبة الـ retention أقل من 50% (يعني لو أقل من 5 من الـ 10 رجعوا)، مينفعش تروّج، والمفروض ترجع تتكلم مع المستخدمين عشان تحدد العقدة الكبيرة وتحلها قبل ما تجيب ناس جديدة."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صمّم خطة جلب أول ١٠ مستخدمين",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "أول ١٠ مستخدمين مش من Ads. هم من ايديك. هتصمم خطة محددة فيها channels + ask + قياس.",
      prompt:
        "في تسليمك:\n\n١) المنتج في سطر + المشكلة اللي بيحلها:\n٢) أول ١٠ مستخدمين — مين بالاسم/الصفة؟ (مش «الجمهور المستهدف»)\n٣) ٣ Channels غير الـ Ads (مثال: WhatsApp groups, Reddit, LinkedIn DMs):\n٤) The Ask — هتكتب لهم بالظبط ايه؟ (انسخ نص رسالة الـ outreach)\n٥) Success metric لأول أسبوع — ايه الرقم اللي بيقول «شغّال»؟\n٦) لو ٧/١٠ رفضوا، هتغيّر إيه؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "خطة محددة",
          weight: 60,
          criteria: [
            "١٠ مستخدمين بأسماء/صفات حقيقية.",
            "الـ Ask فيه نص outreach حقيقي.",
          ],
        },
        {
          label: "Metric + Iteration",
          weight: 40,
          criteria: [
            "Metric قابل للقياس برقم.",
            "خطة الـ pivot لو رفضوا واقعية.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "WelcomeChecklist و /onboarding — أول تجربة للمستخدم",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "WelcomeChecklist و /onboarding — أول تجربة للمستخدم",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. أول ١٠ مستخدمين علّمونا حاجات ميقدرش يقولها لك analytics: الناس بتسيب في step 3 من /onboarding. ضفنا checklist في الـ dashboard عشان الناس متضيعش.",
      bullets: [
        "/onboarding 4 خطوات بس — اختصرناهم من 7 بعد ما لاحظنا التسرّب.",
        "WelcomeChecklist بيظهر في /dashboard لأول مستخدم لحد ما يخلص ٣ مهام.",
        "كل تعديل اتعمل بناءً على ١٠ feedbacks فعلية — مش حدس.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /onboarding", href: "/onboarding" },
    },
  }
];
