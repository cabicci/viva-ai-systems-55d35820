import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
/**
 * Creator · M5 · Lesson 03 — قراءة Analytics بسيطة
 */
export const CREATOR_M5_ANALYTICS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "Views مش المقياس. ٣ أرقام بس بتفرق.",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أكتر فخ بيوقع فيه الصنّاع الجدد: يتعلّقوا بعدد الـ Views. فيديو بـ ١٠٠ ألف View ومحدّش حفظه أو تابع — أسوأ بكتير من فيديو بـ ٢ ألف View و٢٠٠ Save.",
        "Algorithm كل المنصات بيقرأ أكتر ٣ حاجات المنصات بتهتم بيها بجد: Watch Time، Save Rate، Follow Rate. ركّز عليهم وانسى الباقي.",
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
        { term: "الخُطّاف (Hook)", meaning: "أول ٣ ثواني في الفيديو اللي بيشدوا انتباه المشاهد.", example: "جملة بداية قوية أو حركة سريعة تخلي الواحد ميعملش سكرول." },
        { term: "Retention Rate", meaning: "نسبة الناس اللي كملت الفيديو للآخر.", example: "تقدر تعرف منها اللحظة اللي الناس زهقت فيها وقفلت الفيديو." },
        { term: "التفاعل الحقيقي", meaning: "أفعال بتدل إن المحتوى قدّم قيمة فعلية زي الـ Save والـ Share.", example: "لما المعلومة تكون مفيدة لدرجة إنك تحفظها عشان ترجع لها تاني." },
        { term: "Analytics", meaning: "عملية ترتيب وفهم الأرقام عشان ناخد قرارات صح في الشغل.", example: "لما صاحب مطعم يحلل فواتير الشهر عشان يعرف أكتر وجبة بتتباع والزباين بيحبوا إيه." },
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
      caption: "إزاي تقرأ الـ analytics بدل ما تخاف منها.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "٣ أرقام بس — والباقي ضوضاء",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "١. Average Watch Time / Completion Rate: قد إيه الناس قعدت تتفرّج. لو الفيديو ٦٠ ثانية ومتوسط المشاهدة ٢٠ ثانية = الـ Hook فشل أو الـ Pacing بطيء. الهدف: ٧٠٪+ من مدة الفيديو.",
        "٢. Save Rate (Saves ÷ Views): قد إيه الناس حسّت إن المحتوى يستحق الرجوع له. ده أقوى إشارة قيمة للـ Algorithm. الهدف: ١٪+ على Reels/TikTok.",
        "٣. Follow Rate (Follows ÷ Views): قد إيه الفيديو حوّل متفرّج عابر لمتابع. ده اللي بيكبّر الـ Audience فعلًا. الهدف: نص في المية للفيديوهات اللي بتظهر لناس لسه ميعرفوكش.",
        "الـ Shares و الـ Comments بييجوا بعديهم. الـ Likes أضعف إشارة على الإطلاق — تجاهلها.",
        "روتين أسبوعي: كل أحد، ادخل على Analytics واكتب الـ ٣ أرقام لأحسن وأسوأ فيديو في الأسبوع. اسأل نفسك: «إيه اللي مختلف بينهم؟» — ده اللي بيخليك تتطوّر.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "مثلث الأرقام — Watch Time × Save Rate × Follow Rate",
    tone: "primary",
    block: {
      kind: "diagram",
      id: "analytics-triangle",
      caption: "دي الأرقام التلاتة الوحيدة اللي لازم تتابعها أسبوعيًا. عدد المشاهدات رقم منظرة (فشنك) مش أكتر — بتتفرّج عليه لكن مش بيقول حاجة عن جودة المحتوى. لما الـ ٣ زوايا في المثلث ده يتحسّنوا، الـ Algorithm بيكافئك تلقائيًا والمتابعين بيزيدوا من غير ما تشحت.",
      label: "Analytics Triangle — ٣ أرقام بس",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "إزاي تقرأ الأرقام",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — «الفيديو جاب ٥٠ ألف View، يبقى ناجح»",
        body: "Views رقم Vanity. لو Watch Time ١٠٪ بس و٠ Saves، الـ Algorithm مش هيوصّل اللي بعده. وزياداتك في المتابعين هتكون صفر.",
      },
      right: {
        label: "RIGHT — «الفيديو جاب ٣ آلاف View بس Watch Time ٨٠٪ و Save Rate ٢٪»",
        body: "ده Signal قوي للـ Algorithm إن المحتوى ذو قيمة. الفيديو ده هيفضل يتوزّع لشهور والمتابعين الجداد هيكونوا نوعيين.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اعمل أول Weekly Review",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m5-analytics-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو نزّلت فيديو ولقيت الـ Analytics بتاعه بتقول إن الـ Watch Time المتوسط 15 ثانية بس من أصل دقيقة، و الـ Save Rate نص في المية (0.5%)، والـ Follow Rate بتاعك قليل جداً. إيه أول حاجة تركز عليها عشان تحسن أداء الفيديو ده المرة الجاية؟",
          options: [
            "أعمل محتوى تريند أكتر عشان اجيب Views كتير.",
            "أركّز على الـ Hook بتاع الفيديو وأخلي الـ Pacing أسرع في الأول.",
            "أطلب من الناس تعمل لايك وكومنت للفيديو في آخره."
          ],
          correctIndex: 1,
          explanation: "الـ Watch Time القليل بيشير إن المشاهدين بيزهقوا في الأول، وده معناه إن الـ Hook فشل أو الـ Pacing بطيء، محتاج أركز عليهم عشان الناس تكمل تتفرج."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "عندك فيديوهين: الأول جاب 50 ألف View، بس 0.2% Save Rate و 0.1% Follow Rate. التاني جاب 5 آلاف View، بس 2% Save Rate و 1% Follow Rate. لو انت عايز تكبر قناتك بشكل فعال وتوصل لناس مهتمة فعلاً، إيه الفيديو اللي المفروض تحاول تعمل زيه أكتر؟",
          options: [
            "الفيديو الأولاني اللي جاب 50 ألف View.",
            "الفيديو التاني اللي جاب 5 آلاف View.",
            "أشوف فيديو تاني جاب Likes كتير وأعمل زيه."
          ],
          correctIndex: 1,
          explanation: "الفيديو التاني رغم قلة الـ Views، أرقام الـ Save Rate و الـ Follow Rate بتاعته أعلى بكتير، وده بيدل على جودة المحتوى وقيمته للمشاهدين، وهي دي الإشارات اللي الـ Algorithm بيقراها وبيكبر بيها الـ Audience."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "لو بتعمل الروتين الأسبوعي بتاعك ولقيت إن أحسن فيديو عندك الأسبوع ده كان الـ Save Rate بتاعه هو أعلى حاجة وكمان الـ Follow Rate كويس، لكن أسوأ فيديو كان الـ Watch Time بتاعه قليل جداً و الـ Save Rate بتاعه تحت 0.1%. إيه السؤال اللي هتسأله لنفسك عشان تفهم الفرق وتتطور؟",
          options: [
            "هو أحسن فيديو اتصوّر بكاميرا أغلى؟",
            "إيه اللي كان مختلف في الـ Hook والمقدمة بتاعة أحسن فيديو وخلاه يشد الناس أكتر يحتفظوا بيه؟",
            "كام واحد عمل لايك لأحسن فيديو؟"
          ],
          correctIndex: 1,
          explanation: "الفرق بين الفيديو الكويس والوحش هنا في الـ Watch Time والـ Save Rate، وده بيشير لأهمية الـ Hook والمقدمة وجودة المحتوى اللي خلّت الناس تكمل تتفرج وتحفظه، فالتركيز على ده هو اللي هيخليك تتطور."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "اطلع أرقام آخر ٥ بوستات وحلّلهم بـ ٣ مقاييس بس",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "هتاخد آخر ٥ بوستات/Reels، تجيب لكل واحد ٣ أرقام بس، وتطلع منهم قرار واحد.",
      prompt:
        "في تسليمك اعمل جدول/قائمة:\n\nلكل بوست من الـ ٥ اكتب:\n   - اسم/موضوع البوست:\n   - Watch Time (أو Avg View Duration / Read Time):\n   - Save Rate (أو Bookmarks/Shares كبديل):\n   - Follow Rate (أو متابعين جداد من البوست):\n\nبعد الـ ٥:\n١) أعلى بوست في Save Rate — إيه المشترك بينه وبين أحسن بوست تاني؟\n٢) أوطى بوست في Watch Time — إيه السبب اللي تشكّ فيه؟\n٣) قرار واحد للأسبوع الجاي بناءً على الأرقام دي.",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "أرقام حقيقية من ٥ بوستات",
          weight: 60,
          criteria: [
            "جبت الأرقام الـ ٣ لكل بوست (مش Views فقط).",
            "قارنت أعلى/أوطى — مش بس عرضت الأرقام.",
          ],
        },
        {
          label: "قرار قابل للتنفيذ",
          weight: 40,
          criteria: [
            "القرار محدّد (نوع محتوى/طول/Hook)، مش «هحسّن المحتوى».",
            "القرار مربوط بأرقام، مش بإحساس عام.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "/analytics — بنتابع تقدّم المتعلمين بدل عدد المشاهدات",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "/analytics — بنتابع تقدّم المتعلمين بدل عدد المشاهدات",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Creator — نفس اللي بتتعلمه. Page views مش metric. اللي بيهمنا: كم درس اتخلص فعلًا؟ كم mission اتسلّمت؟ /analytics بيركز على completion rate و engagement depth — مش vanity metrics.",
      bullets: [
        "lesson_completion_rate per path = الـ KPI الرئيسي.",
        "mission_submission_count بيوضّح الـ depth.",
        "بنعدّل الدروس اللي completion rate تحت 40%.",
      ],
      pathAngle: "creator",
      link: { label: "افتح /analytics", href: "/analytics" },
    },
  }
];
