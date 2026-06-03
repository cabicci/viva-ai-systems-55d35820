import {
  GitBranch,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import automatorM2FiltersRoutersScreenshot from "@/assets/lessons/unique/automator-m2-filters-routers.jpg";
/**
 * Automator · M2 · Lesson 03 — Filters & Routers
 */
export const AUTOMATOR_M2_FILTERS_ROUTERS_BLOCKS: IntroLessonContent = [
  {
    icon: GitBranch,
    eyebrow: "HERO",
    title: "Filters & Routers",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "مش كل البيانات الجاية لازم تتعالج بنفس الطريقة.",
        "هنا بييجي دور الفلاتر والمسارات.",
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
        { term: "Workflow (طريقة العمل)", meaning: "سلسلة خطوات ورا بعض بتخلص شغلانة معينة من غير تدخل منك.", example: "زي خطوات أوتوماتيكية بتبدأ من أول ما الزبون يطلب أوردر لحد ما يوصله تأكيد بالموبايل." },
        { term: "Trigger (المُشغل)", meaning: "الشرارة أو \"الزناد\" اللي بيخلي الـ Workflow يبدأ يشتغل أوتوماتيك.", example: "لما يجيلك إيميل جديد (الزناد) السيستم يتحرك ويبدأ ينفذ الخطوات اللي إنت ظبطتها." },
        { term: "Router (المُوزع)", meaning: "بوابة بتوزع الشغل على كذا طريق حسب شروط إنت اللي محددها.", example: "لو العميل من \"القاهرة\" ابعتله منديوب شحن كذا، لو من \"إسكندرية\" ابعت التاني." },
        { term: "Filter (الفلتر)", meaning: "بوابة بتسمح للبيانات تعدي أو تترفض بناءً على شرط معين.", example: "لو العميل اشترى بأكتر من 1000 جنيه، دخلّه في مسار \"الخصم\"، غير كده وقّفه." },
        { term: "Fallback Path (المسار الاحتياطي)", meaning: "الطريق الاحتياطي اللي البيانات بتمشي فيه لو مفيش أي شرط تاني نفع.", example: "عملت مَسارين للعملاء (VIP) و(جديد)، طب لو عميل مش متسجل؟ هيروح في \"الاحتياطي\"." },
        { term: "Overlap (التداخل)", meaning: "لما البيانات ينطبق عليها أكتر من شرط في نفس الوقت وتمشي فيهم.", example: "لو العميل (VIP) وكمان (اشترى بـ 2000 جنيه)، كده الـ Router هيشغّل المسارين مع بعض." },
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
      caption: "الفرق بين Filter و Router وإمتى تستخدم كل واحد.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Filter = بوّابة. Router = مفترق طرق",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Filter بيشتغل كبوّابة: لو الشرط اتحقّق، البيانات بتعدّي. لو لأ، الـ workflow بيقف هنا.",
        "مثال: 'لو الرسالة فيها كلمة سعر → كمّل. غير كده → اوقف'.",
        "Router بيشتغل كمفترق طرق: نفس الـ trigger، بس بيتقسم على مسارات مختلفة حسب الشرط.",
        "مثال: لو العميل من مصر → ابعت رد بالعربي + سعر بالجنيه. لو من السعودية → عربي + ريال. غير كده → إنجليزي + دولار.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "Onboarding في المنصة",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: automatorM2FiltersRoutersScreenshot,
      alt: "سكرين شوت من المنصة",
      caption:
        "صفحة الـ /onboarding دي عبارة عن router بالظبط: لو المستخدم اختار Creator → خد المسار ده. اختار Builder → مسار تاني. اختار Automator → مسار ثالث. نفس الـ trigger (المستخدم لسه داخل)، بس Routes مختلفة حسب القرار.",
      label: "من المنصة — صفحة /onboarding",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "إمتى Filter وإمتى Router",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — workflow واحد لكل الحالات",
        body: "بتعمل scenario واحد بيتعامل مع كل الـ leads بنفس الطريقة — حد بيسأل عن السعر زي حد بيشتكي زي حد بيعمل follow-up. الردود بتطلع غريبة وعامة.",
      },
      right: {
        label: "RIGHT — Router بيوزّع، Filter بينضّف",
        body: "Filter في الأول بيرمي spam. Router بعد كده بيوزّع: استفسار سعر → مسار المبيعات. شكوى → مسار الدعم. متابعة → مسار CRM. كل حالة بتاخد رد مناسب ليها.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "ارسم Router لـ leads بتاعتك",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m2-filters-routers-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "مدير الماركتنج في شركتك عايز يعمل أوتوميشن لإيميلات العملاء. لو العميل اشترى منتج غالي (فوق 5000 جنيه)، يجيله إيميل شكر خاص من المدير. أما لو اشترى منتج عادي (5000 جنيه أو أقل)، يجيله إيميل شكر أوتوماتيكي عادي. إيه الأسلوب الأنسب عشان تحقق ده؟",
          options: [
            "أستخدم Router يفرّق بين قيمة الشراء.",
            "أستخدم Filter يوقّف الإيميلات للعملاء العاديين.",
            "أستخدم Filter يوقّف الإيميلات للعملاء اللي اشتروا منتجات غالية."
          ],
          correctIndex: 0,
          explanation: "الـ Router هو الأنسب هنا لأننا محتاجين نوجه البيانات لمسارين مختلفين (إيميل خاص أو إيميل عادي) بناءً على شرط واحد وهو قيمة الشراء، ومفيش حاجة هتتوقف."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "تطبيق مطعم عايز يتأكد إن كل الأوردرات الجديدة اللي بتوصل فيها رقم تليفون العميل عشان يقدروا يوصلوا ليه. لو مفيش رقم تليفون، الأوردر المفروض ميتعديش مرحلة الدفع وتظهر رسالة للعميل. إيه الأداة اللي تحقق الشرط ده بكفاءة؟",
          options: [
            "أستخدم Router يوجّه الأوردرات اللي فيها رقم تليفون لمسار واللي مفيهوش لمسار تاني.",
            "أستخدم Filter يمنع الأوردرات اللي مفيهوش رقم تليفون من إنها تكمل.",
            "أضيف Fallback Path عشان الأوردرات اللي مفيهوش رقم تليفون."
          ],
          correctIndex: 1,
          explanation: "الـ Filter هو الأداة المثالية هنا لأنه بيشتغل كبوّابة: لو الشرط (وجود رقم تليفون) اتحقّق، الأوردر بيكمل. لو لأ، الـ workflow بيقف عند النقطة دي."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "أنت بتدير خدمة عملاء أوتوماتيكية للرد على استفسارات العملاء. لو العميل سأل عن 'أسعار المنتجات'، السيستم يرد بقائمة الأسعار. لو سأل عن 'طرق الدفع'، السيستم يرد بطرق الدفع. لو استفساره مش من الاتنين دول، السيستم يحوله لدعم فني. إيه أفضل طريقة لتصميم الـ workflow ده؟",
          options: [
            "أستخدم 3 Filters كل واحد بيشوف نوع الاستفسار.",
            "أستخدم Router بـ 3 مسارات: مسار للأسعار، مسار لطرق الدفع، ومسار Fallback للدعم الفني.",
            "أستخدم Filter واحد بيوقف كل الاستفسارات اللي مش عن الأسعار والدفع."
          ],
          correctIndex: 1,
          explanation: "الـ Router هو الأنسب لأنه بيسمح للبيانات تتقسم على أكتر من مسار حسب شرط (نوع الاستفسار) مع وجود Fallback Path للحالات اللي مفيش ليها مسار محدد، وهو ده مفهوم نقطة التفرّع."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صمّم Router بـ ٣ Branches لـ Workflow",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "Router = القرار في الـ workflow. هتاخد use case وتصمم ٣ branches بـ conditions واضحة.",
      prompt:
        "في تسليمك:\n\n١) الـ Use case (مثال: routing رسايل WhatsApp حسب النوع):\n٢) Router conditions:\n   - Branch 1: condition + action:\n   - Branch 2: condition + action:\n   - Branch 3 (default/fallback): condition + action:\n٣) لو رسالة جت بتطابق branch 1 و branch 2 — أنهي يفوز؟ كتبت قاعدة الـ precedence إزاي؟\n٤) Test cases — اكتب ٣ inputs مختلفة + أنهي branch هتتطابق مع كل واحد.",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "Router + branches",
          weight: 60,
          criteria: [
            "٣ branches بـ conditions منفصلة فعلاً.",
            "فيه fallback/default branch.",
          ],
        },
        {
          label: "Precedence + Tests",
          weight: 40,
          criteria: [
            "قاعدة الـ precedence واضحة للـ overlaps.",
            "الـ ٣ test cases مغطّيين الـ branches الـ ٣.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "Filters في كل query — مش كل البيانات لكل request",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "Filters في كل query — مش كل البيانات لكل request",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Automator — نفس اللي بتتعلمه. لما /dashboard بيطلب lesson_progress، مش بيجيب كل التقدّم لكل المستخدمين. RLS + WHERE clauses بتفلتر للـ user الحالي بس. ده الـ Filter في أبسط صوره.",
      bullets: [
        "RLS policy = filter تلقائي على مستوى الـ DB.",
        "WHERE user_id = auth.uid() في كل query.",
        "بدون filters: 1000 صف. مع filters: 50 صف — أسرع 20 مرة.",
      ],
      pathAngle: "automator",
      link: { label: "افتح /dashboard", href: "/dashboard" },
    },
  }
];
