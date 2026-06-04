import {
  Search,
  PlayCircle,
  Lightbulb,
  Scale,
  Rocket,
  Image as ImageIcon,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import automatorM1SpotPatternsScreenshot from "@/assets/lessons/unique/automator-m2-l2-spot-patterns.jpg";
/**
 * Automator · M1 · Lesson 02 — شوف الأنماط في يومك
 */
export const AUTOMATOR_M2_L2_SPOT_PATTERNS_BLOCKS: IntroLessonContent = [
  {
    icon: Search,
    eyebrow: "HERO",
    title: "الـ Automation بتبدأ من الملاحظة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "مش كل حاجة تستاهل تتأتمت.",
        "بس فيه أنماط بتنادي عليك.",
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
        { term: "Automation (أتمتة)", meaning: "إنك تخلي الشغل المتكرر يحصل لوحده آلياً عشان توفر وقتك ومجهودك.", example: "زي لما تخلي الإيميل يتبعت لوحده للعميل أول ما يطلب أوردر من غير ما تتدخل." },
        { term: "Time Audit (جرد الوقت)", meaning: "ورقة وقلم أو شيت بتسجل فيه يومك راح فين عشان تمسك \"الحرامي\" اللي بيسرق وقتك.", example: "محاسب بيسجل كل ربع ساعة بيعمل فيها إيه عشان يعرف أكتر حاجة بتضيع وقته." },
        { term: "Pattern (نمط)", meaning: "حاجة بتتكرر بنفس الطريقة، ودي بتبقى أول خيط يخليك تفكر تعمل لها أتمتة.", example: "تاجر لقى إنه بيبعت \"رقم الحساب\" لكل عميل بيسأل، ده نمط ينفع يتنفذ لوحده." },
        { term: "Trigger (المُشغل) activation", meaning: "الشرارة أو \"الزقة\" اللي بتبدأ الشغل الآلي، من غيرها مفيش حاجة هتتحرك.", example: "بوست نزل على الفيسبوك، ده \"الزقة\" اللي هتخلي السيستم يبدأ يبعت رسالة ترحيب للناس." },
        { term: "Make.com (ميك)", meaning: "الأداة اللي بنبني عليها خطوات الشغل الآلي من غير ما نكتب كود برمجة.", example: "موقع بنستخدمه عشان نربط البرامج ببعض (زي الإكسيل والواتساب) عشان يشتغلوا مع بعض لوحدهم." },
        { term: "Scenario / Flow", meaning: "خريطة الخطوات اللي بتمشي ورا بعضها عشان تخلص المهمة، وهي هي الـ Flow.", example: "سلسلة خطوات: العميل يسجل (Trigger) ← بياناته تروح شيت ← يتبعتله واتساب. كل ده اسمه Scenario." },
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
      caption: "إزاي تكتشف الـ patterns اللي بتستهلك وقتك من غير ما تحس.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "4 إشارات إن في pattern",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "التكرار — بتعمل نفس الخطوات أكتر من مرتين في الأسبوع.",
        "النقل — بتنسخ بيانات من مكان لمكان (من Form لـ Sheet، من Sheet لـ WhatsApp).",
        "القرار البسيط — بتاخد قرار بناءً على شرط واضح (لو كذا → اعمل كذا).",
        "الانتظار — بتفضل صاحي تستنّى حاجة تحصل عشان تتصرّف.",
        "تمرين الـ Time Audit: قسّم يومك لـ 24 سطر، اكتب كل ساعة عملت إيه، وحدّد بلون اللي فيه واحدة من الـ 4 إشارات. الملوّن = candidates للأتمتة.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "تقرير المنصة",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: automatorM1SpotPatternsScreenshot,
      alt: "سكرين شوت من المنصة",
      caption: "الـ Master Report بتاعنا = Time Audit أوتوماتيك للمتعلم. بيرصد كل نشاط ويستخرج الـ patterns: «إنت بتفتح المنصة الصبح»، «بتقضي وقت أطول في missions الكتابة». ده هو نفسه التمرين اللي هتعمله — بس على شغلك إنت، يدوي في الأول.",
      label: "من المنصة",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "أتمتة كل حاجة vs أتمتة الصح",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — بتأتمت أي حاجة",
        body: "بتشوف Flow حلو في يوتيوب وتبني نسخة منه. بعد شهر، عندك 20 Scenario في Make، 70% منهم مش بتستخدمهم، وبتدفع اشتراك على فاضي.",
      },
      right: {
        label: "RIGHT — بتأتمت الـ patterns بس",
        body: "بتبدأ من الـ audit. أي pattern بيوفّرلك 30 دقيقة في الأسبوع — يستاهل. اللي أقل — استنّى. الـ Automation هدفها وقتك، مش عدد الـ scenarios.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اعمل Time Audit ليوم",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m2-l2-spot-patterns-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "دينا بتشتغل Social Media Manager، كل يوم الصبح بتفتح تلاتة تابتس واحدة للـ Facebook وواحدة للـ Instagram وواحدة لـ LinkedIn عشان ترد على كل الكومنتات والرسائل. ده يعتبر أنهي نوع من الـ Patterns اللي ممكن يتدور عليها عشان الأتمتة؟",
          options: [
            "تكرار",
            "نقل",
            "قرار بسيط"
          ],
          correctIndex: 0,
          explanation: "دينا بتعمل نفس الخطوات (فتح تابتس والرد) كل يوم، وده تكرار واضح لأكتر من مرتين في الأسبوع."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "أحمد بيبعت عروض أسعار للعملاء. لو العميل وافق، أحمد بياخد بياناته من ملف الإكسل وبيحطها في سيستم الـ CRM. العملية دي بياخد فيها وقت ومجهود وممكن يغلط. دي أنهي إشارة من إشارات الأتمتة؟",
          options: [
            "انتظار",
            "نقل",
            "قرار بسيط"
          ],
          correctIndex: 1,
          explanation: "أحمد بينسخ بيانات من مكان (إكسل) لمكان تاني (CRM)، وده تعريف الـ 'نقل' اللي ممكن يتأتمت عشان يقلل الأخطاء ويوفر الوقت."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "منال عندها كورس أونلاين، وكل ما حد يحجز، بتدخل تبعتله إيميل ترحيب شخصي فيه بيانات الدخول للكورس. هي بتفكر تعمل ده أوتوماتيك. دي إشارة قوية لأن ده يعتبر إيه؟",
          options: [
            "قرار بسيط",
            "تكرار",
            "انتظار"
          ],
          correctIndex: 1,
          explanation: "كل حجز بيحصل، منال بتعمل نفس الإجراء: تبعت إيميل ترحيب ببيانات الدخول. ده تكرار لنفس الخطوات بشكل مستمر."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "اكتشف ٣ Patterns في شغلك تستحق أتمتة",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "Patterns = حركات بتعملها على autopilot من غير ما تحس. هترصدهم وتسجلهم.",
      prompt:
        "في تسليمك:\n\nPattern 1:\n- الـ trigger (ايه اللي بيشغّله؟):\n- الـ steps اللي بتعملها بنفس الترتيب:\n- مرات في الأسبوع:\n\nPattern 2: نفس الشكل\nPattern 3: نفس الشكل\n\nفي الآخر:\n- أنهي pattern فيهم تلاتة الـ trigger بتاعه واضح ومنتظم (يعني يمكن أتمتته)؟\n- أنهي pattern الـ steps فيه ثابتة (مش بتتغير حسب الموقف)؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "٣ patterns بـ trigger وsteps",
          weight: 60,
          criteria: [
            "كل pattern له trigger محدد ينطلق منه.",
            "Steps مكتوبة بترتيب مش كلام عام.",
          ],
        },
        {
          label: "تقييم القابلية",
          weight: 40,
          criteria: [
            "حدّدت pattern بـ trigger منتظم.",
            "حدّدت pattern بـ steps ثابتة.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "/system-state — بنكشف الـ patterns في تصرّف المتعلم",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "/system-state — بنكشف الـ patterns في تصرّف المتعلم",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Automator — نفس اللي بتتعلمه. صفحة /system-state بتوريك أنماط زي: «المتعلم بيفتح الدرس بس مش بيخلّص الـ mission» أو «أعلى drop-off في الـ module الثالث». الـ patterns دي بتقول لنا فين نأتمت.",
      bullets: [
        "بنحلّل learner_events تلقائي عشان نطلع الـ patterns.",
        "Pattern معناه: ٣+ متعلّمين بيعملوا نفس الحاجة في نفس النقطة.",
        "كل pattern موثّق → بيتحوّل لـ automation أو UX fix.",
      ],
      pathAngle: "automator",
      link: { label: "افتح /system-state", href: "/system-state" },
    },
  }
];