import { Users, PlayCircle, Lightbulb, Trophy, Rocket, BookOpen, Compass, Sparkles } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

/** Business · M2 · Lesson 01 — Customer Journey Map — رسم رحلة العميل */
export const BUSINESS_M3_L1_CUSTOMER_LIFECYCLE_BLOCKS: IntroLessonContent = [
  {
    icon: Users,
    eyebrow: "HERO",
    title: "العميل مش صفقة — هو رحلة من 5 محطات",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أحمد، صاحب مطعمنا، كان شايف العميل = \"حد بياكل ويدفع ويمشي\". صرف 3000 جنيه إعلانات شهرياً عشان يجيب جداد. الناس بتيجي، تاكل، وما ترجعش. كان حاسس إنه شغّال صح بس الدرج فاضي.",
        "لمّا جلس مع AI ورسم رحلة العميل، اكتشف حاجة صدمته: 60% من اللي بيشتروا أول مرة ما بيرجعوش، لأن أحمد ما عندوش أي تواصل بعد الأكلة. ولا رسالة شكر، ولا متابعة، ولا تذكير. كان بيخسر العميل بعد كل صفقة.",
        "بعد ما عمل Customer Journey Map، صمّم touchpoint بسيط بعد كل أوردر. الـ Retention قفز من 18% لـ 47% في شهرين، وبقى محتاج إعلانات أقل بكتير.",
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
        { term: "Customer Journey", meaning: "كل المحطات اللي العميل بيعدّي عليها من أول ما يسمع عنك لحد ما يرشّحك لصحابه.", example: "أحمد: إعلان فيسبوك → كومنت → أوردر → أكل → رسالة بعد الأكل → ريڤيو." },
        { term: "Awareness", meaning: "العميل بدأ يعرف إنك موجود.", example: "حد شاف بوست المطعم على فيسبوك أو سمع من صاحبه." },
        { term: "Acquisition", meaning: "تحوّل من \"عارفك\" لـ \"اشترى منك\".", example: "حد طلب أوردر فعلاً." },
        { term: "Retention", meaning: "نسبة العملاء اللي بيرجعوا تاني.", example: "أحمد بعد التحسين: 47 من كل 100 عميل يرجعوا في الشهر." },
        { term: "Advocacy", meaning: "العميل بقى مرشّح ليك ببلاش.", example: "العميل بيقول لصحابه: \"المطعم ده تحفة، اطلبوا منهم\"." },
        { term: "Funnel Leak", meaning: "نقطة في الرحلة الناس بتقع منها وما تكمّلش.", example: "أحمد كان عنده leak كبير بين \"اشترى\" و \"رجع\" — 60% بيختفوا." },
        { term: "Touchpoint", meaning: "أي لحظة تلامس فيها العميل بعد البيع.", example: "رسالة واتساب شكر، تذكير بالمناسبة، عرض خاص." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "إزاي تشوف كل عميل كرحلة، مش كصفقة." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "الـ 5 محطات اللي لازم ترسمها",
    block: {
      kind: "numberedList",
      items: [
        "Awareness — إزاي العميل بيعرف بوجودك؟ (إعلان، صديق، Google).",
        "Acquisition — إيه اللي بيخلّيه يقرّر يجرّب أول مرة؟",
        "Activation — أول تجربة فعلية. هي إيجابية ولا سلبية؟",
        "Retention — هل في سبب يرجع تاني؟ لو لأ، هتفقده.",
        "Advocacy — هل في حاجة بتخلّيه يرشّحك؟ مش بيحصل لوحده.",
      ],
    },
  },
  {
    icon: Compass,
    eyebrow: "الـ Prompt القاتل",
    title: "Customer Journey Mapper",
    tone: "accent",
    block: {
      kind: "rule",
      statement: "\"عندي بيزنس [النوع، الموقع، نوع العميل]. عميلي النموذجي [وصف بشري: العمر، الدخل، الموقف اللي بيشتري فيه]. ارسملي Customer Journey بـ 5 stages (Awareness, Acquisition, Activation, Retention, Advocacy). في كل stage حدّدلي: ١) إيه اللي بيحصل فعلًا دلوقتي؟ ٢) إيه الـ leak المتوقّع؟ ٣) Touchpoint واحد رخيص ممكن أضيفه يقلّل الـ leak.\"",
    },
  },
  {
    icon: Trophy,
    eyebrow: "Build Along — قصة أحمد",
    title: "ارسم Journey Map بتاعك في 15 دقيقة",
    tone: "accent",
    block: {
      kind: "executionTask",
      title: "أحمد عمل ده على ورقة A4 واحدة وغيّر بيزنسه. دورك دلوقتي.",
      steps: [
        "افتح ورقة (أو Notion). ارسم 5 أعمدة: Awareness, Acquisition, Activation, Retention, Advocacy.",
        "افتح AI. الصق الـ Prompt القاتل وعبّيه ببياناتك إنت — مش أحمد.",
        "خد رد AI واملا الـ 5 أعمدة بـ: \"اللي بيحصل دلوقتي\" في كل محطة.",
        "تحت كل عمود اكتب: الـ Leak اللي AI افترضه + Touchpoint مقترح.",
        "اختار محطة واحدة فيها أكبر Leak. ده هيبقى مشروعك الأسبوع ده.",
        "اكتب جنبها: \"الـ Touchpoint اللي هضيفه = [محدّد]، التكلفة = [بالجنيه أو الوقت]، الميعاد = [تاريخ التطبيق].\"",
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
      lessonId: "business-m3-l1-customer-lifecycle-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "أحمد بيصرف 3000 ج إعلانات شهرياً ويجيب 100 عميل جديد. 18 بس بيرجعوا. خصص ميزانية إضافية، هتنصحه يصرفها على إيه؟",
          options: [
            "إعلانات أكتر — يجيب 150 عميل بدل 100.",
            "Touchpoint بعد الأوردر — يخلّي 18 يبقوا 40.",
            "تخفيض السعر — يجذب عملاء أكتر."
          ],
          correctIndex: 1,
          explanation: "خلّي العميل اللي عندك يرجع أرخص بكتير من جلب عميل جديد (قاعدة الـ 5x). لو رفعت الـ Retention من 18% لـ 40% بنفس الـ 100 عميل، ده زيادة أرباح بدون أي صرف إعلانات إضافي."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "في رحلة العميل، أحمد لاحظ إن 80% بيكومنتوا على البوست بس 20% بس بيطلبوا فعلًا. ده Leak فين؟",
          options: [
            "بين Awareness و Acquisition — في احتكاك يمنع التحوّل من اهتمام لشراء.",
            "بين Activation و Retention — العميل ما حبّش الأكلة.",
            "بين Acquisition و Advocacy — ما رشّحش حد."
          ],
          correctIndex: 0,
          explanation: "العميل عرف بوجودك (Awareness) واهتم (كومنت)، بس ما اشتراش (Acquisition). ده Leak بين أول محطتين. السبب ممكن يكون: عملية الطلب صعبة، السعر مش واضح، أو الرد بطيء. لازم تشتغل على المحطة دي بالذات."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "بعد ما رفع أحمد الـ Retention لـ 47%، عايز يخلّي العملاء يرشّحوه. إيه أذكى touchpoint يضيفه؟",
          options: [
            "يطلب من كل عميل يكتب ريڤيو على Google.",
            "يدّي العميل الراضي خصم لو جاب صاحبه + يدّي صاحبه خصم على أول طلب.",
            "يبعت رسالة \"رشّحنا لو عجبك\"."
          ],
          correctIndex: 1,
          explanation: "Advocacy ما بتحصلش لوحدها — لازم تصمّم سبب. الـ Win-Win (مكسب للعميل القديم + مكسب للصاحب الجديد) أقوى بكتير من طلب مباشر، لأنه بيدي العميل حافز فعلي وبيخلي الترشيح يبان كأنه هدية مش إعلان."
        }
      ]
    },
  },
  {
    icon: Sparkles,
    eyebrow: "Mission",
    title: "حدّد أكبر Leak في الرحلة وسدّه",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "Journey Map بدون فعل = رسم جميل. مهمتك تختار Leak واحد وتصمّم Touchpoint يقفله.",
      prompt:
        "في تسليمك اكتب:\n\n١) Customer Journey Map بتاعك (الـ 5 محطات + اللي بيحصل في كل واحدة بكلامك):\n٢) أكبر Leak — بين أي محطتين، ونسبة الـ drop التقديرية:\n٣) سبب محتمل واحد للـ Leak (بنّيت على إيه؟):\n٤) Touchpoint جديد هتضيفه — محدّد بالتفصيل (الرسالة، التوقيت، القناة):\n٥) المؤشّر اللي هتقيس بيه نجاح الـ Touchpoint بعد أسبوعين:",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "رسم وتشخيص",
          weight: 60,
          criteria: [
            "الـ 5 محطات موصوفة بسياق بيزنسك مش تعريفات عامة.",
            "الـ Leak محدّد برقم وبسبب.",
          ],
        },
        {
          label: "فعل مع قياس",
          weight: 40,
          criteria: [
            "في Touchpoint محدّد بالتفصيل.",
            "في مؤشّر قياس واضح للأسبوعين الجايين.",
          ],
        },
      ],
    },
  },
];
