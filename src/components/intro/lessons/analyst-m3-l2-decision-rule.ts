import { ArrowRightCircle, PlayCircle, Lightbulb, Scale, Rocket, BookOpen, ListChecks, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

export const ANALYST_M3_DECISION_RULE_BLOCKS: IntroLessonContent = [
  {
    icon: ArrowRightCircle,
    eyebrow: "HERO",
    title: "كل تفسير ينتهي بـ «إذًا هعمل…»",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "تفسير من غير قرار = وقت ضايع.",
        "كل insight لازم يطلّع action.",
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
        { term: "Insight", meaning: "فهم جديد وواضح طلعته من الأرقام بيعرفك الدنيا ماشية إزاي.", example: "زي ما تلاقي ربحك قل الشهر ده، دي معلومة خلتك تفهم إن في مشكلة." },
        { term: "Action", meaning: "القرار أو الخطوة اللي هتاخدها فعلياً بناءً على اللي فهمته.", example: "لما تلاقي الربح قل (Insight)، فتقرر تعمل خصم 20% عشان تبيع أكتر." },
        { term: "Metric", meaning: "حاجة بنقيس بيها الأداء، زي المسطرة اللي بنقيس بيها الشغل.", example: "لو إنت محاسب، الـ Metric بتاعك هو \"صافي الأرباح\" أو \"المصاريف\"." },
        { term: "Threshold", meaning: "الرقم \"الخط الأحمر\" اللي لو عديناه لازم ناخد تصرف فوراً.", example: "ممكن تقرر: لو المصاريف زادت عن 10 آلاف جنيه (Threshold) ابعتلي تنبيه." },
        { term: "UI/UX", meaning: "شكل الموقع أو التطبيق وإزاي الزبون بيستخدمه بسهولة.", example: "تصميم شكل المحل أو تطبيق الموبايل وطريقة تعامل الزبون معاه." },
        { term: "A/B Testing", meaning: "تجربة بنقارن فيها بين فكرتين عشان نشوف أنهي واحدة نتيجتها أحسن.", example: "تجرب تبعت إعلان بصورة لونه أحمر وإعلان بصورة أزرق وتشوف مين جاب زباين أكتر." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "إزاي تحوّل كل ملاحظة لقرار قابل للتنفيذ." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Insight → Action → Owner → Deadline",
    block: {
      kind: "numberedList",
      items: [
        "Insight: «٧٠٪ من العملاء بيسألوا عن السعر قبل المنتج».",
        "Action: «أضيف السعر في أول رسالة على WhatsApp».",
        "Owner: «أنا».",
        "Deadline: «الأربعاء».",
        "من غير الـ ٤ عناصر دي = القرار مش هيتنفّذ.",
      ],
    },
  },
  {
    icon: ListChecks,
    eyebrow: "شوف بنفسك",
    title: "Insight → Action → Owner → Deadline",
    block: {
      kind: "diagram",
      id: "decision-chain",
      caption: "مثال حقيقي بـ ٤ خانات — من غير الـ ٤ القرار مش هيتنفّذ.",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "تفسير ميّت vs قرار حي",
    block: {
      kind: "comparison",
      left: { label: "FAILURE — «إيه ده مثير للاهتمام»", body: "البيانات قالتلك حاجة. مفيش حد عمل حاجة. نفس المشكلة الأسبوع الجاي." },
      right: { label: "RIGHT — «إذًا الأربعاء أنا هعمل…»", body: "كل insight بيتحوّل لـ task لها owner و deadline. الأسبوع الجاي بتقيس الأثر." },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "حوّل ٣ insights لـ ٣ قرارات",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "analyst-m3-l2-decision-rule-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "أنت بتراجع أداء حملات التسويق الأسبوع اللي فات ولقيت إن 'عدد كبير من الإعلانات اللي بتوصل لعملاء جدد مفيش منها تفاعل'. إيه أحسن حاجة تعملها عشان تستغل المعلومة دي كـ insight حقيقي؟",
          options: [
            "أقول للمسؤول عن الإعلانات 'إذًا حملات العملاء الجدد محتاجة تتعدل بسرعة عشان نجيب تفاعل أكتر'.",
            "أسجل الملاحظة دي في تقرير الأسبوع وأعديها على مدير التسويق ياخد باله منها.",
            "أقول 'إذًا هعمل اجتماع مع تيم الإعلانات يوم الأحد اللي جاي عشان نراجع المحتوى ونقرر تغيير الاستهداف، أنا هبقى المسؤول عن المتابعة والقرار لازم يتنفذ قبل نهاية الأسبوع'."
          ],
          correctIndex: 2,
          explanation: "الإجابة دي هي الوحيدة اللي ترجمت الـ insight لـ action واضح، فيها Owner (أنا)، وDeadline (نهاية الأسبوع)، زي ما الدرس بيقول إن القرار لازم يكون فيه الأربع عناصر دول عشان يتنفّذ."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "مديرك إدالك ملاحظة مهمة: 'معظم شكاوى العملاء في الشهر اللي فات كانت بسبب تأخير في توصيل المنتجات'. طلب منك 'تطلع بحل سريع'. إيه الـ action اللي تقدر تقوله لمديرك يعكس إنك فهمت الدرس ده كويس؟",
          options: [
            "هقول لقسم التوصيل إن فيه شكاوى كتيرة متتعلقة بالتأخير.",
            "هراجع كل شكاوى التأخير مع فريق خدمة العملاء عشان نعرف الأسباب وأطلب منهم يطلعولي بحلول.",
            "هعمل اجتماع مع مسؤول التوصيل، قسم المخازن، وخدمة العملاء بكرة الساعة ١١ الصبح عشان نحدد أسباب التأخير ونطلع بحد أقصى ٣ حلول فورية، أنا هكون مسؤول عن متابعة التنفيذ حتى الأسبوع الجاي."
          ],
          correctIndex: 2,
          explanation: "الخيار ده هو الوحيد اللي حول الـ insight لـ action بناءً على أركان القرار الحي: تحديد إجراء ملموس، Owner (أنا)، وDeadline (حتى الأسبوع الجاي) لتطبيق الحلول."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "أنت عملت تحليل لبيانات استخدام الأبليكيشن بتاعكم ولقيت إن '٧٥٪ من المستخدمين بيسيبوا عملية التسجيل بعد ما يوصلوا لخطوة إضافة بيانات الدفع'. إيه الطريقة الصح عشان تحول الـ insight ده لقرار حي؟",
          options: [
            "المشكلة دي بتقولنا إن خطوة الدفع صعبة، يبقى نلغيها.",
            "هقول لتيم الـ UI/UX إن فيه مشكلة في خطوة الدفع عند ٧٥٪ من المستخدمين.",
            "بناءً على المشكلة دي، إذًا هطلب من تيم الـ UI/UX يعملوا اختبارات A/B على نسخ مختلفة من صفحة الدفع عشان يقللوا نسبة ترك المستخدمين بنسبة ٢٠٪ خلال الشهر الجاي، أنا هتابع تنفيذ الاختبارات والنتائج أول بأول."
          ],
          correctIndex: 2,
          explanation: "هنا الـ insight اتقال بوضوح، والـ action محدد وقابل للقياس (تقليل نسبة الترك ٢٠٪)، والـ Owner (أنا) واضح، بالإضافة للـ Deadline (خلال الشهر الجاي). كل ده بيخلي القرار حي وقابل للتنفيذ والمتابعة."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "اكتب Decision Rule واحدة شغّالة",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "Insight من غير rule بيتكرّر. اكتب قاعدة قرار جاهزة تتنفّذ أوتوماتيك المرة الجاية.",
      prompt:
        "في تسليمك اكتب:\n\n١) السياق/المشكلة المتكرّرة:\n٢) الـ Rule بالصيغة: لو [شرط بـ Metric + Threshold] في [Window]، يبقى [القرار/الفعل]:\n٣) مين/إيه اللي هينفّذ القرار (إنت/فريق/automation):\n٤) إزاي هتعرف إن الـ Rule شغّال (المؤشّر اللي بيتحرّك):\n٥) متى تعيد مراجعة الـ Rule (تاريخ أو شرط):",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "صياغة الـ Rule",
          weight: 70,
          criteria: [
            "الشرط مكتوب بـ Metric + Threshold + Window.",
            "القرار محدّد ومين بينفّذه واضح.",
          ],
        },
        {
          label: "حلقة مراجعة",
          weight: 30,
          criteria: [
            "في تاريخ/شرط لمراجعة الـ Rule نفسه.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "كل insight في /analytics جنبه action مقترح",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "كل insight في /analytics جنبه action مقترح",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Analyst — نفس اللي بتتعلمه. لو widget بيقول «درس X completion 30%»، جنبه action: «راجع المحتوى أو قصّر الـ mission». مفيش insight بدون قرار. ده الـ rule اللي اتعلّمته: تفسير بدون قرار = وقت ضايع.",
      bullets: [
        "كل widget له action واحد مقترح على الأقل.",
        "Actions بتظهر كزرار، مش كنص.",
        "بنتابع كم action اتنفّذ vs كم اتعرض.",
      ],
      pathAngle: "analyst",
      link: { label: "افتح /analytics", href: "/analytics" },
    },
  }
];