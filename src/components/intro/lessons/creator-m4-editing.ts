import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import editingImg from "@/assets/lessons/unique/creator-m4-editing.jpg";

export const CREATOR_M4_EDITING_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "المونتاج مش رفاهية — هو نص الفيديو",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "تصوير ١٠٠٪ + مونتاج صفر = ٢٠٪ فيديو.",
        "نفس اللقطة، مع cuts ذكية و captions و إيقاع موسيقى = فيديو ينتشر.",
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
        { term: "B-roll", meaning: "صور زيادة بتغطي كلامك عشان توضح الفكرة وتكسر الملل.", example: "تاجر بيبيع لبس بيعرض طقم، وفجأة تظهر صورة قريبة للقماشة والخياطة عشان توضح التفاصيل للزبون." },
        { term: "Algorithm (خوارزمية)", meaning: "نظام ذكي بيقرر يوري الفيديو لمين بناءً على اهتماماتهم.", example: "صاحب محل موبايلات بيلاحظ إن فيديوهاته بتظهر للناس اللي مهتمة بالتكنولوجيا بس، ده بسبب ذكاء المنصة." },
        { term: "16:9 (Aspect Ratio)", meaning: "شكل الفيديو العريض بتاع زمان (زي شاشة التلفزيون أو اللاب توب).", example: "مسوق بيعمل إعلان ليوتيوب، لازم يختار المقاس العريض ده عشان يملا الشاشة بالعرض." },
        { term: "Pacing (الإيقاع)", meaning: "سرعة تنقل اللقطات وتتابع الأحداث عشان المشاهد ميزهقش.", example: "محاسب بيعمل فيديو نصائح، بيقص كل حتة سكت فيها أو غلط عشان الفيديو يفضل \"سريع\"." },
        { term: "Beat", meaning: "خبطة أو \"دقة\" المزيكا اللي بتمشي معاها حركة الفيديو.", example: "صانع محتوى بيركب صورته وهو بينط مع خبطة الطبلة في المزيكا عشان يحمس الناس." },
        { term: "Hook frame", meaning: "أول لقطة في الفيديو، هدفها تشد انتباه الشخص اللي بيقلب.", example: "زي أول 3 ثواني في فيديو لمدرب جيم بيبدأ بـ \"خسيت 10 كيلو في أسبوع!\"." },
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
      caption: "مونتاج Reel كامل في ١٠ دقايق على CapCut — Step by step.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "٤ قواعد مونتاج Reels",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "١. اشيل أي سكتة أطول من ٠.٥ ثانية. كل «أه» و «يعني» و «اممم» = cut. الفيديو لازم يكون مضغوط جداً، خصوصاً أول ٥ ثواني.",
        "٢. Captions على كل كلمة. ٨٥٪ من الـ Reels بتتشاف بدون صوت. CapCut و Reels و TikTok عندهم Auto Captions في ٣٠ ثانية — استخدمها وراجعها بس.",
        "٣. غيّر اللقطة كل ٢-٣ ثواني. حتى لو نفس المكان، Zoom in، B-roll، Text overlay. السكون = scroll. الحركة = engagement.",
        "٤. الموسيقى هي العصب. ابدأ بـ Trending sound، حط الـ cuts على الـ beat. الـ Algorithm بيعطّل أولوية للـ Reels اللي بتستخدم Trending sounds.",
        "أداة واحدة بس تكفّي للبداية: CapCut Mobile (مجاني، فيه auto-captions، beat sync، و text styles). متبدأش بـ Premier ولا Final Cut — overkill.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "Timeline = قصة بصرية",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: editingImg,
      alt: "Mobile editing timeline — clips، captions، music waveform",
      caption:
        "لاحظ الـ Hook في أول ٣ ثواني عليه caption كبير. كل ٢-٣ ثواني فيه قطع. الموسيقى مرسومة كـ waveform عشان تظبط الـ cuts على الـ beats. ده شكل مونتاج Reel ناجح.",
      label: "Mobile Editing Timeline",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "نفس اللقطة — نتيجة مختلفة",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — Upload خام",
        body: "صوّرت نفسك بتشرح ٦٠ ثانية، رفعته زي ما هو. فيه ٤ سكتات و ٢ «اممم» و الصوت واطي و مفيش captions. الـ Retention تحت ١٥٪. السلام.",
      },
      right: {
        label: "RIGHT — مونتاج ١٥ دقيقة",
        body: "نفس الـ ٦٠ ثانية → اتقصّت لـ ٣٥ ثانية. كل سكتة اتشالت. Captions على كل كلمة بـ ألوان واضحة. Background music trending بـ beat synced cuts. الـ Retention ٧٥٪+. الـ Algorithm بيوزّعه.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اعمل أول Reel — مونتاج كامل",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m4-editing-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "صوّرت فيديو مدته ٦٠ ثانية عشان تشرح فيه فكرة، بس حسيت أنه طويل وممكن الناس تزهق من كتر الكلام أو السكتات، وعاوز تخليه أسرع وأكثر جذبًا. إيه أول حاجة تعملها عشان الفيديو يبقى 'مضغوط جداً' ومشدود وميخسرش من قيمته؟",
          options: [
            "أشيل أي سكتة أطول من ٠.٥ ثانية وكل 'أه' و 'يعني' و 'اممم' من أول الفيديو لآخره.",
            "أضيف مؤثرات صوتية كتير عشان أخلي الفيديو حماسي ويثير الانتباه.",
            "أقص نص الفيديو وأخلي الـ ٣٠ ثانية الأهم بس عشان محدش يزهق سريعًا."
          ],
          correctIndex: 0,
          explanation: "التركيز على إزالة السكتات والحشو بيخلي الفيديو مضغوط ومشدود ودي أول خطوة لزيادة الـ engagement خصوصًا في أول ٥ ثواني، زي ما الدرس بيقول 'الفيديو لازم يكون مضغوط جداً، خصوصاً أول ٥ ثواني'."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "عملت ريل عن منتج جديد، ولقيت إن الناس بتتفرج عليه بس مفيش تفاعل كبير، وكمان عدد كبير منهم مبيكملهوش للآخر. افتكرت نقطة مهمة في الدرس عن ٨٥٪ من الـ Reels اللي بتتشاف بدون صوت. إيه أهم حل للمشكلة دي عشان تخلي رسالتك توصل للناس مهما كانت ظروف مشاهدتهم؟",
          options: [
            "أضيف موسيقى تريند بصوت عالي جدًا عشان تجذب الانتباه.",
            "أحط Captions (ترجمة كتابية) لكل كلمة بتتقال في الفيديو.",
            "أكرر اللقطات اللي فيها المنتج كتير عشان الناس متنساهوش."
          ],
          correctIndex: 1,
          explanation: "'٨٥٪ من الـ Reels بتتشاف بدون صوت'، استخدام الـ Captions بيضمن إن رسالتك توصل للمشاهد حتى لو كان شايف الفيديو من غير صوت، وبالتالي بيزود فرص التفاعل والمشاهدة الكاملة."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "بتعمل فيديو تعليمي طويل شويه وحاسس إن فيه رتابة و'سكون' في لقطات معينة، ودي ممكن تخلي المشاهد يعمل 'scroll' بسرعة. إزاي تقدر تحافظ على اهتمام المشاهد وتخليه يستمر في المتابعة، خصوصًا لو الميزانية محدودة ومش هتقدر تصور لقطات B-roll جديدة كتير؟",
          options: [
            "أضيف موسيقى حماسية وصوتها عالي عشان تخلق جو من النشاط.",
            "أعمل Zoom in تدريجي أو أضيف text overlay بسيط على اللقطة عشان أكسر السكون وأحافظ على الحركة.",
            "أقص اللقطات اللي فيها سكون وأستخدم لقطات سريعة بس عشان أضخ حيوية في الفيديو."
          ],
          correctIndex: 1,
          explanation: "الدرس بيأكد إن 'السكون = scroll. الحركة = engagement.' وتغيير اللقطة كل ٢-٣ ثواني ضروري. استخدام 'Zoom in، B-roll، Text overlay' حلول فعالة لكسر الرتابة والحفاظ على الـ engagement حتى لو اللقطة هي هي."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "اعمل Checklist مونتاج Reel قبل النشر",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "كل Reel هينزل، يعدّي على نفس الـ Checklist. لو فشل بند واحد، الفيديو يرجع للمونتاج مش يتنشر.",
      prompt:
        "في تسليمك اكتب Checklist من ٧ بنود لازم تعدّي عليهم قبل نشر أي Reel، مرتبطة بالـ ٤ قواعد:\n\n١) Hook في أول ٣ ثواني — معيار النجاح:\n٢) Cuts متقاربة — كل كام ثانية cut؟\n٣) Captions على الشاشة — متى/مين/الخط؟\n٤) النهاية = CTA أو Loop؟\n٥) الصوت/الموسيقى — هل في غناء بيغطّي عليك؟\n٦) النسبة (٩:١٦) + الجودة — أقل دقة مقبولة؟\n٧) المدة — أقل من كام ثانية؟\n\nبعد كل بند، اكتب «نعم/لا» للـ Reel الجاي عندك.",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "كل بند له معيار محدّد",
          weight: 60,
          criteria: [
            "كل بند فيه رقم أو حد ملموس (مش «اعمله كويس»).",
            "الـ ٧ بنود بتغطّي الـ ٤ قواعد من الدرس.",
          ],
        },
        {
          label: "تطبيق ذاتي",
          weight: 40,
          criteria: [
            "جاوبت «نعم/لا» على كل بند للـ Reel الجاي.",
            "حدّدت بند واحد على الأقل لسه «لا» وايه التعديل.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "كل lesson عدّى بـ ٣-٥ مراجعات قبل النشر",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "كل lesson عدّى بـ ٣-٥ مراجعات قبل النشر",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Creator — نفس اللي بتتعلمه. أول draft للدرس بيكون ٣ ضعف الحجم النهائي. بنقص ونقص لحد ما يبقى essential بس. الـ editing هو اللي بيخلّي الدرس قابل للقراءة في ١٠ دقايق بدل ٣٠.",
      bullets: [
        "Draft 1: كل اللي في دماغنا عن الموضوع.",
        "Draft 2: شيل اللي مش بيخدم الـ mission.",
        "Draft 3: قصّر الجمل، شيل الكلام الزيادة.",
      ],
      pathAngle: "creator",
      link: { label: "افتح /roadmap", href: "/roadmap" },
    },
  }
];