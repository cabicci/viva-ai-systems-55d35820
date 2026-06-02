import {
  ShieldAlert,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import automatorM3ErrorHandlingScreenshot from "@/assets/lessons/unique/automator-m3-error-handling.jpg";
/**
 * Automator · M3 · Lesson 03 — Error Handling
 */
export const AUTOMATOR_M3_ERROR_HANDLING_BLOCKS: IntroLessonContent = [
  {
    icon: ShieldAlert,
    eyebrow: "HERO",
    title: "الـ Error هو القاعدة، مش الاستثناء",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الأنظمة الشغّالة 24/7 لازم يحصلها أخطاء.",
        "السؤال مش 'هل'، السؤال 'إزاي هتتعامل معاها'.",
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
        { term: "Payload", meaning: "البيانات أو \"الشيلة\" اللي مبعوتة جوه الـ Request.", example: "لو العميل بعت لك شيت إكسيل فيه بياناته، الشيت ده باللي جواه هو الـ Payload." },
        { term: "Retry", meaning: "إننا نخلي الأوتوميشن يحاول ينفذ الخطوة تاني لما تفشل.", example: "لما نت كافيه يفصل ويرجع يحمل الصفحة لوحده تاني." },
        { term: "Dead Letter Queue (DLQ)", meaning: "مكان (زي درج) بتترمي فيه الطلبات اللي فشلت بعد كذا محاولة.", example: "لما السيستم يبعت الإيميلات اللي فشلت لجدول إكسيل لوحده عشان تراجعهم يدوي." },
        { term: "Error Handler / Catch", meaning: "خطة بديلة (طريق طوارئ) بيمشي فيها الأوتوميشن لو حصلت غلطة.", example: "لو الـ Route الرئيسية باظت، بنفتح سكة تانية تبعت تنبيه للمدير فوراً." },
        { term: "Idempotent", meaning: "إنك تكرر الأكشن كذا مرة بنفس النتيجة من غير لخبطة.", example: "زي دفع الفاتورة؛ لو دوست \"دفع\" مرتين بالغلط، السيستم يسحب الفلوس مرة واحدة بس." },
        { term: "Context", meaning: "كل المعلومات والبيانات اللي محيطة بالخطوة اللي شغالة دلوقتي.", example: "لو محاسب بيراجع فاتورة، الـ Context هو كل بيانات العميل اللي جابت الفاتورة دي." },
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
      caption: "إزاي تحوّل الأخطاء من كوارث لـ events متوقّعة.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "3 طبقات حماية لكل scenario",
    block: {
      kind: "numberedList",
      items: [
        "Retry — جرّب تاني تلقائيًا. كتير من الأخطاء مؤقتة (rate limit، timeout).",
        "Catch / Error Handler — لو فشل بعد الـ retries، نفّذ مسار بديل (سجّل الـ error + ابعت تنبيه).",
        "Logs + Alerts — كل error بيتسجّل، والـ errors المهمة بتبعت notification فورًا (Slack/Email/WhatsApp).",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "الطبقات التشغيلية",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: automatorM3ErrorHandlingScreenshot,
      alt: "سكرين شوت من المنصة",
      caption:
        "كل طبقة في الـ /operational-layers بتاعتنا فيها error handling خاص بيها. لو الـ Retrieval Layer فشلت تجيب context، النظام مش بيقف — بيرجع لرد افتراضي وبيلوج الـ error. ده اللي هتعمله في الـ workflows بتاعتك بالظبط.",
      label: "من المنصة — صفحة /operational-layers",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "Error = Silence vs Signal",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — الـ scenario بيقف صامت",
        body: "API فشل، الـ scenario توقّف، ومحدش عرف. بعد أسبوع تكتشف إن 200 عميل ملقوش رد. الـ error حصل من غير صوت.",
      },
      right: {
        label: "RIGHT — Error بيحوّل لإشارة",
        body: "Retry 3 مرات → لو فشل، الـ payload بيتخزّن في جدول 'failed_jobs' + رسالة WhatsApp بتيجيلك. تقدر تراجع وتصلّح يدوي وترجّع تشغّل.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "أضف Error Handler لأي scenario عندك",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m3-error-handling-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "أنت بتبني Integration بياخد بيانات العملاء من صفحة هبوط (Landing Page) ويحطها في CRM. أوقات كتير الـ API بتاع الـ CRM بيرجع Internal Server Error (500) لمدة ثواني بسيطة. إيه أحسن طريقة تتعامل بيها مع المشكلة دي عشان تضمن إن معظم بيانات العملاء توصل صح؟",
          options: [
            "تظبط الـ Retries على الـ HTTP node الخاص بالـ CRM إنه يحاول تلات مرات كل دقيقة، وتزود Error Handler يبلغك باللي فشل بعد الـ retries.",
            "تخلي الـ Integration يسجل كل العملاء اللي فشلوا في Google Sheet وبعدين تراجعهم يدويًا كل فترة.",
            "تضيف شرط (Condition) قبل ما تكلم الـ CRM بحيث تتأكد إن الـ API سليم الأول، ولو مش سليم ترجع للعميل رسالة خطأ."
          ],
          correctIndex: 0,
          explanation: "الـ Retries (إعادة المحاولة) هي الحل الأمثل للأخطاء المؤقتة زي الـ 500 error، لأنها غالبًا بتكون مشكلة لحظية بتتحل لوحدها. الـ Error Handler بيكمل الشغل لو فشلت الـ retries."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "تخيل إنك بتعمل Automation بيحجز منتجات للعملاء في المخزن. الـ API بتاع المخزن ساعات بيرجع 'Product out of stock' لو المنتج خلص، وده مش خطأ برمجي، دي معلومة مهمة لازم تعرفها. إزاي تفرق بين الخطأ اللي محتاج تتصرف فيه تلقائيًا والخطأ اللي محتاج تدخل بشري عشان تاخد قرار بيه؟",
          options: [
            "تستخدم Error Handler يلقط كل الـ errors، وتكتب Logic جواه يفحص رسالة الـ error: لو 'Product out of stock' تبعت للـ sales team، ولو أي حاجة تانية تعمل retry.",
            "تعتمد على الـ Retries فقط، لأنها كفيلة إنها تحل كل المشاكل تلقائيًا.",
            "تقفل الـ Retries وتخلي Integration يقف عند أي خطأ عشان تراجع بنفسك كل مرة."
          ],
          correctIndex: 0,
          explanation: "الـ Error Handler مش بس بيلقط الأخطاء، ده ممكن كمان يتعامل معاها بناءً على نوع الخطأ أو رسالته. ده بيخليك تتصرف أوتوماتيكي مع الأخطاء المؤقتة، وتنبه أصحاب الشأن للأخطاء اللي محتاجة قرار."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "أنت عامل Workflow بيبعت فواتير للعملاء عن طريق مزود خدمة رسائل (SMS/Email). لو مزود الخدمة ده الـ API بتاعه فشل تمامًا بعد كل محاولات الـ Retries. إيه الإجراء المنطقي اللي لازم تعمله عشان تضمن إن العملاء دول ميتنسوش خالص وإنك تقدر تتعامل معاهم بعدين؟",
          options: [
            "تخلي الـ Error Handler يعمل Dead Letter Queue يسجل فيها معلومات الفواتير اللي فشلت، وترفعها على Google Sheet عشان تراجعها يدويًا وتبعتهالهم بطريقة تانية.",
            "تخلي الـ Scenario يقف تمامًا، وتبعت لنفسك إيميل تحذيري عشان تدخل وتصلح المشكلة بنفسك فورًا.",
            "تعيد تشغيل الـ Workflow من الأول كل ساعة لحد ما كل الفواتير توصل."
          ],
          correctIndex: 0,
          explanation: "استخدام Dead Letter Queue (قائمة الأخطاء النهائية) أو ما شابهها لتوثيق الـ requests اللي فشلت تمامًا بعد الـ retries والـ error handling بيمكنك من مراجعة الحالات دي يدويًا ومعالجتها عشان تتجنب أي فقد في البيانات أو عدم إتمام خدمة."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صمّم Error Handling لـ Workflow بـ ٣ failure points",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "Workflow بدون error handling = ساعة قنبلة. هتاخد workflow وتحدّد ٣ failure points وتصمم رد فعل لكل واحد.",
      prompt:
        "في تسليمك:\n\n١) Workflow في سطرين (Trigger + ٣-٤ actions):\n٢) Failure point 1 — أنهي step + ليه ممكن يفشل:\n   - Detection (إزاي بنعرف فشل):\n   - Recovery (Retry / Skip / Notify / Rollback):\n   - Notification (مين بيتبلّغ + إزاي):\n٣) Failure point 2: نفس الشكل\n٤) Failure point 3: نفس الشكل\n٥) Logging — ايه اللي بتسجّله لكل step؟ فين؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "٣ failure points متنوعين",
          weight: 60,
          criteria: [
            "كل failure معاه detection + recovery + notification.",
            "الـ ٣ مختلفين فعلاً (مش كلهم retry).",
          ],
        },
        {
          label: "Logging strategy",
          weight: 40,
          criteria: [
            "Logs محددة بـ data وdestination.",
            "الـ Logs تكفي لـ debug من غير ما تعيد التشغيل.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "client_error_logs — كل error بيتسجّل",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "client_error_logs — كل error بيتسجّل",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Automator — نفس اللي بتتعلمه. في الـ Frontend، error capture script بيلتقط أي uncaught exception ويبعتها لـ /api/log-error → جدول client_error_logs. مش بنخفي الـ errors — بنجمعهم عشان نصلّحهم.",
      bullets: [
        "Window.onerror + unhandledrejection بيسجّلوا تلقائي.",
        "Stack trace + URL + user_agent مع كل log.",
        "بنراجع أعلى ٣ errors أسبوعيًا.",
      ],
      pathAngle: "automator",
      link: { label: "افتح /build-logs", href: "/build-logs" },
    },
  }
];
