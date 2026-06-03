import {
  Inbox,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import leadsScreenshot from "@/assets/lessons/unique/automator-m5-lead-capture.jpg";

/**
 * Automator · M5 · Lesson 01 — استقبال Leads من Creator
 */
export const AUTOMATOR_M5_LEAD_CAPTURE_BLOCKS: IntroLessonContent = [
  {
    icon: Inbox,
    eyebrow: "HERO",
    title: "من Views لـ Leads لـ DB",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "المحتوى جاب عين.",
        "هنا بنبني الجسر بين Views وشغلك.",
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
        { term: "Landing Page", meaning: "صفحة هدفها حاجة واحدة بس، زي إن الزبون يسجل بياناته.", example: "زي صفحة اشتراك في كورس، هدفها تخلي الزبون يسجل بياناته بس من غير ما يتشتت في المنيو." },
        { term: "Form (النموذج)", meaning: "الخانات اللي الزبون بيملاها ببياناته عشان يتواصل معاك.", example: "الخانات اللي العميل بيكتب فيها \"اسمه ورقم موبايله\" عشان يطلب أوردر أو يحجز استشارة." },
        { term: "Database / DB (قاعدة بيانات)", meaning: "المخزن اللي بتشيل فيه بيانات الزبائن وتكون مترتبة ومنظمة.", example: "شيت إكسيل كبير فيه أسماء وتليفونات وعناوين كل الناس اللي اشترت منك قبل كده." },
        { term: "CRM", meaning: "برنامج ذكي بتابع عليه علاقتك بالزبون من أول ما سجل لحد ما اشترى.", example: "برنامج بيعرفك الزبون ده اشترى إيه، وبعتله إيميل ولا لسه، ومحتاج مكالمة تانية ولا لأ." },
        { term: "UTM (علامة تتبع)", meaning: "كود صغير بتزوده في آخر اللينك عشان تعرف الزبون جالك منين.", example: "لما تعمل إعلان على فيسبوك، بتركب كلمة \"FB\" في آخر اللينك عشان تعرف العميل جالك منين بالظبط." },
        { term: "Webhook (المخبر)", meaning: "رسول بياخد البيانات من برنامج يوديها لبرنامج تاني في لحظتها.", example: "أول ما حد يملا الفورم، الويب هوك يبعت رسالة فوراً لموبايلك يقولك \"تنبيه: فيه عميل جديد\"." },
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
      caption: "إزاي تبني جسر بين المحتوى اللي جاب Views والـ automation اللي يستقبل Leads.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "المسار الكامل: Content → Landing Page → Form → DB → Automation",
    block: {
      kind: "numberedList",
      items: [
        "المحتوى (Creator M1-M4) بيجيب traffic.",
        "Landing Page بتخلي المشاهد ياخد خطوة فعلية واحدة (بريد/رقم/طلب).",
        "Form Submission بيروح لـ DB أو بيتبعت Webhook للـ automation tool.",
        "Automation بياخد الـ data: يرد فورًا (auto-reply)، يصنّف (qualify)، يسجّل (CRM)، يبعت تنبيه (فريق المبيعات).",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "من Views لـ Leads",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: leadsScreenshot,
      alt: "درس Creator عن تحويل Views لـ Leads",
      caption:
        "في Creator M5 شفنا إن Views لوحدهم مش هدف — الهدف Leads. هنا هنبني الـ automation اللي بيستقبلهم: trigger = form submission → filter = validate email/phone → router = qualify by intent → actions = CRM + auto-reply + notify sales.",
      label: "من المنصة — درس من Views لـ Leads في Creator",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "Form بيتبعت لـ email وخلاص vs Form بيدخل system",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — تستنّى الـ form تيجي في الإيميل",
        body: "كل lead بيوصلك إيميل. إنت بتفتح وتنسخ الـ data وتلصّقها في Excel. لو نزل 50 lead في يوم، بتقعد تنسخ وتلصّق لغاية ما تنام. فريق المبيعات بيدوخوا ويسألوا 'الـ leads منين؟'.",
      },
      right: {
        label: "RIGHT — Form → webhook → automation → CRM",
        body: "كل lead بيتسجّل فورًا في DB بتاعته UTM tagged. الـ automation بيرد على طول بإيميل/رسالة ترحيب. فريق المبيعات بيشوف في الـ CRM تاريخ كل lead ومصدره. مفيش نسخ ولا لصق.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اعمل Lead Capture Flow",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m5-lead-capture-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو بتعمل إعلان ممول على إنستجرام عشان الناس تسجل في كورس، وعايز تعرف بالظبط كام واحد جه من الإعلان ده، إيه أحسن حاجة ممكن تستخدمها عشان تتتبع المصدر ده؟",
          options: [
            "تحط لينك مباشر للكورس في الإعلان",
            "تستخدم UTM codes في اللينك بتاع الإعلان",
            "تطلب من كل واحد يسجل يقول هو عرف الكورس منين"
          ],
          correctIndex: 1,
          explanation: "استخدام الـ UTM codes هو الطريقة اللي بنعرف بيها إيه المصدر اللي جاب الـ lead، زي ما الدرس وضح إنها بتساعد نتبع مصدر الزيارات."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "مديرك طلب منك تعمل صفحة جديدة عشان تجمع إيميلات العملاء المهتمين بمنتج جديد، إيه أهم حاجة لازم تركز عليها في تصميم الصفحة دي عشان تحقق الهدف المطلوب؟",
          options: [
            "تحط كل تفاصيل المنتج والشركة في الصفحة",
            "تخلي الصفحة دي ليها هدف واحد بس وهو إن العميل يسجل بياناته",
            "تصمم الصفحة إنها تكون جزء من الموقع الرئيسي بتاعكم ومليانة لينكات تانية"
          ],
          correctIndex: 1,
          explanation: "الـ Landing Page لازم يكون الغرض منها 'action' واحد بس، وهنا هو تجميع الإيميلات، عشان كده التركيز على هدف واحد أهم حاجة."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "عميل مالى الفورم بتاعتك، واختار إن اهتمامه 'sales'، إزاي الـ automation system بتاعك هيتعامل مع الـ lead ده عشان تتأكد إن فريق المبيعات يجيله خبر بسرعة؟",
          options: [
            "الـ automation هيبعت إيميل تأكيد للعميل ويضيفه لقائمة عامة",
            "الـ automation هيعمل 'qualify' للـ lead وهيبلّغ فريق المبيعات أوتوماتيك",
            "هيبقى لازم حد من فريق التسويق يدخل على السيستم يدويًا ويبلّغ فريق المبيعات"
          ],
          correctIndex: 1,
          explanation: "الـ automation بياخد الـ data ويقدر يصنّف الـ leads (qualify) ويبعت تنبيه (فريق المبيعات) أوتوماتيك، وده بيضمن التعامل السريع مع الطلبات المهمة زي 'sales'."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "ابني Lead capture flow كامل من Form للـ DB",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "Lead capture = خط أول لاي business. هتصممه من الـ form للـ DB للـ notification للـ welcome.",
      prompt:
        "في تسليمك:\n\n١) المصدر — الفورم/الـ landing page + الـ fields:\n٢) Validation — إيه اللي هترفضه؟ (Bad emails / duplicates / spam)\n٣) Storage — هتستخدم قاعدة بيانات إيه؟ وإيه العواميد (الخانات) اللي هتسجل فيها البيانات؟\n٤) Notification — مين بيتبلّغ + إزاي + إمتى؟\n٥) Welcome message — هترسله إزاي؟ (Email / WhatsApp) + إيه فيه؟\n٦) Tag/Segment — Lead بيتصنف إزاي تلقائياً؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "Flow كامل ٦ خطوات",
          weight: 60,
          criteria: [
            "كل خطوة فيها tool/service محدد.",
            "Validation فيها أمثلة لرفض حقيقي.",
          ],
        },
        {
          label: "Notification + Tagging",
          weight: 40,
          criteria: [
            "Notification بشخص محدد ووقت محدد.",
            "Tagging strategy فعلية مش «هيتسجّل في كروم».",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "Signup form → user record → onboarding flow",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "Signup form → user record → onboarding flow",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Automator — نفس اللي بتتعلمه. كل lead جديد بيمر من signup form → auth.users record → trigger يعمل profile + user_streaks rows → بيتوجّه لـ /onboarding. الـ flow كله automated من ثانية الـ submit.",
      bullets: [
        "DB trigger handle_new_user() بيتنفّذ تلقائي.",
        "بينشئ profile + user_streaks في same transaction.",
        "Redirect لـ /onboarding بدل صفحة فاضية.",
      ],
      pathAngle: "automator",
      link: { label: "افتح /signup", href: "/signup" },
    },
  }
];
