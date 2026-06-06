import { LayoutDashboard, PlayCircle, Lightbulb, Trophy, Rocket, BookOpen, Compass, Sparkles } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

/** Business · M4 · Lesson 05 — الـ Business OS Dashboard — تجميع كل اللي بنيته */
export const BUSINESS_M4_L5_BUSINESS_OS_DASHBOARD_BLOCKS: IntroLessonContent = [
  {
    icon: LayoutDashboard,
    eyebrow: "HERO",
    title: "النظام بتاعك الشخصي خلص — دي اللحظة اللي بتغيّر كل حاجة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "على مدار 15 درس، بنيت قطعة وراء قطعة. Decision Framework. Customer Journey Map. Retention Flow. Pricing Calculator. SOPs. JD Templates. Weekly Review Ritual. كل واحدة لوحدها أداة — لما تتجمع، بقت نظام تشغيل كامل.",
        "أحمد لما جمعهم في dashboard واحد، كل صباح بقى بيفتح صفحة واحدة بتقوله: الأرقام النهارده، أول قرار محتاج يتاخد، أحدث feedback من عميل، حالة الـ team. 10 دقايق وبقى عارف يعمل إيه في يومه كله.",
        "النهارده هتعمل الـ Dashboard ده. هيبقى صفحتك المرجعية لكل قرار، كل أسبوع، كل تخطيط. ده اللي بيخلّيك Leader مش Operator — نظام بدالك مش عقلك بس.",
        "لو لسه مبتدئ:\nDashboard مبسّط بـ ٣ أقسام يكفي:\nقرارات — أرقام اليوم — ملاحظات.\nGoogle Doc أو ورقة مقبولين.",
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
        { term: "Business OS", meaning: "نظام تشغيل شخصي للبيزنس — مكان واحد بيجمع كل قراراتك وأرقامك وأنظمتك.", example: "بدل 10 ملفات متفرقة، صفحة واحدة فيها كل حاجة بتحتاجها." },
        { term: "Dashboard", meaning: "لوحة بصرية بتعرض أهم الأرقام والمؤشرات بشكل فوري.", example: "أحمد بيفتح Notion صباحاً يلاقي: المبيعات أمبارح، أعلى منتج، عدد الـ leads، أحدث شكوى." },
        { term: "Single Source of Truth", meaning: "مرجع وحيد لكل المعلومات — لا تكرار ولا تضارب.", example: "السعر مكتوب في مكان واحد. لو تغيّر، يتغيّر في مكان واحد. باقي النظام يأخذ منه." },
        { term: "Decision Cadence", meaning: "إيقاع ثابت لاتخاذ القرارات — يومي، أسبوعي، شهري.", example: "كل يوم: 10 دقايق صباحاً. كل أسبوع: ساعة جمعة. كل شهر: نص يوم آخر شهر." },
        { term: "Compound System", meaning: "نظام بيكبر قيمته مع الوقت لأن كل جزء بيغذّي الباقي.", example: "الـ feedback من العملاء يغذّي الـ SOPs. الـ SOPs تغذّي الـ hiring. الـ hiring يغذّي الـ scaling." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "إزاي تجمع كل اللي بنيته في نظام تشغيل واحد." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "٥ Sections لازم تكون في الـ Dashboard بتاعك",
    block: {
      kind: "numberedList",
      items: [
        "Numbers Today — أهم 4 أرقام بتاريخ اليوم (مبيعات، leads، شكاوى، cash).",
        "Decisions Pending — القرارات اللي محتاجة تتاخد + الـ Decision Framework جنب كل واحد.",
        "Systems & SOPs — لينكات لكل الـ SOPs والـ templates اللي بنيتها.",
        "Customer Pulse — آخر 5 feedback + الـ retention flow status.",
        "Team & Hiring — حالة الـ team + الـ JDs الجاهزة لأي توظيف.",
      ],
    },
  },
  {
    icon: Compass,
    eyebrow: "الـ Prompt القاتل",
    title: "Dashboard Architect Prompt",
    tone: "accent",
    block: {
      kind: "rule",
      statement: "\"عندي بيزنس [النوع، الحجم، عدد الموظفين]. عندي الأنظمة دي جاهزة: [list من اللي بنيته في المسار]. عايز أعمل Notion Dashboard مفرد. اقترحلي: ١) Layout بـ 5 sections، ٢) إيه يدخل لكل section، ٣) إيه التحديث المطلوب يومي/أسبوعي/شهري، ٤) إزاي أربط الأنظمة مع بعض عشان مكررش بيانات.\"",
    },
  },
  {
    icon: Trophy,
    eyebrow: "Build Along — القطعة الأخيرة في الـ Business OS",
    title: "اجمع كل اللي بنيته في Dashboard واحد",
    tone: "accent",
    block: {
      kind: "executionTask",
      title: "النهارده هتطلع بصفحة Notion (أو أي tool زيه) فيها كل النظام بتاعك. ده الـ output النهائي للمسار.",
      steps: [
        "افتح Notion. اعمل صفحة جديدة اسمها \"My Business OS\".",
        "Section 1: \"Numbers Today\" — اعمل 4 boxes كبيرة لأهم 4 أرقام. (يدوي دلوقتي، تربطه بـ sheets بعدين.)",
        "Section 2: \"Decisions Pending\" — اعمل list. كل قرار جنبه لينك للـ Decision Framework اللي عملته في درس M1-L3.",
        "Section 3: \"Systems & SOPs\" — اعمل toggle list. حط لينكات لكل اللي بنيته: Customer Journey, Retention Flow, Pricing Calculator, SOPs, JD Templates.",
        "Section 4: \"Customer Pulse\" — اربط بالـ Retention Flow اللي بنيته في M2-L2. ضيف \"آخر 5 feedback\".",
        "Section 5: \"Team & Hiring\" — لينكات للـ Hiring System اللي بنيته في M3-L4.",
        "في آخر الصفحة: \"Decision Cadence\" — يومي 10 دقايق، أسبوعي ساعة جمعة، شهري نص يوم آخر شهر.",
        "احفظ اللينك. ده هيبقى الصفحة الأولى اللي تفتحها كل يوم.",
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اختبر فهمك",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "business-m4-l5-business-os-dashboard-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "بعد ما عملت الـ Dashboard، لاحظت إن السعر بتاع منتج موجود في 3 أماكن مختلفة. إيه المشكلة؟",
          options: [
            "مش مشكلة، التكرار بيخلّي البيانات متاحة.",
            "مشكلة كبيرة — مفيش Single Source of Truth. لو السعر اتغيّر، هتنسى مكان من التلاتة.",
            "مشكلة في الـ design.",
          ],
          correctIndex: 1,
          explanation: "ده أكبر سبب لانهيار الأنظمة. لازم يكون كل معلومة في مكان واحد، والباقي يلينكلها. بدون كده، النظام بيكون متضارب وبيفقد قيمته بسرعة."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "أحمد بقاله أسبوعين بيفتح الـ Dashboard كل صباح. لاحظ إنه بيتعامل مع نفس النوع من القرارات أسبوعياً. إيه الخطوة الأذكى؟",
          options: [
            "يتجاهل اللي بيتكرر.",
            "ياخد القرارات المتكررة ويحوّلها لـ SOPs، فيتفرّغ للقرارات الجديدة.",
            "يلغي الـ Dashboard.",
          ],
          correctIndex: 1,
          explanation: "ده الـ Compound System شغّال. الـ Dashboard مش بس بيعرض، هو بيكشفلك الـ patterns. اللي بيتكرر = يستحق نظام، مش قرار يومي."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "بعد شهر من استخدام الـ Dashboard، الفلوس زادت 15% والشغل بإيدك قل 30%. إيه السبب الأساسي؟",
          options: [
            "صدفة.",
            "الأنظمة بتشتغل بدالك في الـ background، إنت بقيت تركّز على القرارات بدل التنفيذ.",
            "السوق اتحسن.",
          ],
          correctIndex: 1,
          explanation: "ده الهدف الكامل من المسار. الـ Operator بيشغّل بإيده. الـ Leader بيدير النظام. الـ Dashboard بقى عقلك التاني — والـ Decision Framework بقى أداتك الأساسية."
        }
      ]
    },
  },
  {
    icon: Sparkles,
    eyebrow: "Final Mission — الـ Capstone",
    title: "شغّل الـ Business OS — نسخة مبسّطة أو أسبوع كامل",
    tone: "accent",
    block: {
      kind: "mission",
      intro: "وثّق تجربتك مع الـ Business OS.\n\nلو لسه مبتدئ: Dashboard بـ ٣ أقسام (قرارات / أرقام اليوم / ملاحظات) في Google Doc أو ورقة — تسليم مبسّط مقبول، مش لازم أسبوع كامل.\n\nلو متقدم: شغّله أسبوع كامل وتوثّق التجربة.",
      prompt: "في تسليمك — اختَر مستوى واحد:\n\n【تسليم مبسّط — مقبول بالكامل】\n١) لينك أو screenshot لـ Dashboard بـ ٣ أقسام: قرارات / أرقام اليوم / ملاحظات (Google Doc أو ورقة).\n٢) كام قرار سجّلته الأسبوع ده؟\n٣) إيه أكبر فرق حسيته؟\n\n【تسليم كامل — اختياري】\n٤) Dashboard بـ ٥ sections + أسبوع استخدام حقيقي.\n٥) كام حاجة اكتشفت إنها بقت في الـ SOPs؟\n٦) إيه القطعة الجاية للـ Business OS بناءً على تجربتك؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "النظام شغّال فعلاً",
          weight: 50,
          criteria: [
            "التسليم المبسّط: ٣ أقسام (قرارات / أرقام اليوم / ملاحظات) — مقبول بالكامل.",
            "التسليم الكامل (اختياري): Dashboard بـ ٥ sections + استخدام حقيقي لأسبوع.",
          ],
        },
        {
          label: "تأمل + خطوة جاية",
          weight: 50,
          criteria: [
            "التسليم المبسّط: فرق أو ملاحظة واحدة على الأقل — مقبول.",
            "التسليم الكامل (اختياري): فرق ملموس + خطوة تطوير للأسبوع الجاي.",
          ],
        },
      ],
    },
  },
];
