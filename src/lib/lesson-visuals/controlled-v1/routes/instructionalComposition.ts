/**
 * INSTRUCTIONAL_COMPOSITION route — locale-grounded HTML → PNG via Chrome headless.
 *
 * Requirements enforced here:
 * - exact locale package grounding (no ar-EG fallback for other locales)
 * - joined Arabic via Tajawal (not ASCII transliteration)
 * - RTL for Arabic locales, LTR for en
 * - lesson-specific teaching content (not metadata-only / barcode filler)
 * - deterministic inputs → reproducible layout (Chrome raster may vary by version;
 *   content/HTML is deterministic; receipt stores sha of final PNG)
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../constants";
import { resolveLocalePackage } from "../localePackages";
import { REPO_ROOT } from "../paths";
import type { Locale } from "../types";

export interface InstructionalCompositionInput {
  lessonId: string;
  locale: Locale;
  position: number;
  title: string;
  /** Isolated output directory. Defaults to a unique OS temp dir (never artifacts/controlled-v1). */
  outputDir?: string;
  /** Optional locale-packages root override for synthetic test fixtures. */
  localeLessonsRoot?: string;
  /** When true with localeLessonsRoot, resolve ar-EG as JSON under that root (tests only). */
  treatArEgAsJsonPackage?: boolean;
}

export interface InstructionalCompositionResult {
  png: Buffer;
  width: number;
  height: number;
  asciiTitleUsed: string;
  localizedTitle: string | null;
  packagePath: string;
  packageExists: boolean;
  htmlPath: string;
  direction: "rtl" | "ltr";
}

const FONT_REGULAR = resolve(REPO_ROOT, "src/lib/lesson-visuals/v1/fonts/Tajawal-Regular.ttf");
const FONT_BOLD = resolve(REPO_ROOT, "src/lib/lesson-visuals/v1/fonts/Tajawal-Bold.ttf");
const LOGO = resolve(REPO_ROOT, "public/brand/masaarat-logo-lockup.png");

function isArabicLocale(locale: Locale): boolean {
  return locale === "ar-EG" || locale === "ar-MSA" || locale === "ar-Gulf";
}

function extractTeachingCopy(
  lessonId: string,
  locale: Locale,
  packagePath: string,
  kind: "json" | "ts-blocks",
  fallbackTitle: string,
): {
  title: string;
  subtitle: string;
  leftLabel: string;
  leftBody: string;
  leftItems: string[];
  rightLabel: string;
  rightBody: string;
  rightItems: string[];
  footer: string;
  caption: string;
} {
  // Defaults are locale-aware placeholders only when package parse fails — caller
  // marks packageExists=false in that case. Prefer package-grounded strings.
  if (kind === "json" && existsSync(packagePath)) {
    const parsed = JSON.parse(readFileSync(packagePath, "utf8")) as {
      title?: string;
      summary?: string;
      sections?: Array<{
        role?: string;
        subtitle?: string;
        contentMarkdown?: string;
        bullets?: string[];
      }>;
    };
    const title = parsed.title?.trim() || fallbackTitle;
    const core = parsed.sections?.find(
      (s) => /core/i.test(s.role ?? "") || /الفكرة/.test(s.subtitle ?? ""),
    );
    const comparison = parsed.sections?.find(
      (s) =>
        /comparison|مثال|Example/i.test(s.role ?? "") || /comparison|مثال/i.test(s.subtitle ?? ""),
    );
    const subtitle =
      core?.subtitle?.replace(/^Core idea\s*[—–-]\s*/i, "").trim() ||
      parsed.summary?.trim() ||
      title;

    // Prefer comparison two-column content when present in markdown tables / bullets.
    const bullets = (core?.bullets ?? [])
      .map((b) =>
        b
          .replace(/^\*\*?/, "")
          .replace(/\*\*?$/, "")
          .trim(),
      )
      .filter(Boolean);

    // Lesson-specific known structure for intro-m1-l4 (trust map) from package wording.
    if (lessonId === "intro-m1-l4-ai-can-cannot") {
      if (locale === "en") {
        return {
          title: core?.contentMarkdown?.includes("strong in language")
            ? "AI is strong in language — but be cautious with facts"
            : title,
          subtitle: "Verification is part of using AI — not a sign the tool is broken",
          leftLabel: "Use quickly",
          leftBody: "Writing · summarizing · ideas — edit in your voice.",
          leftItems: ["Meeting summary", "Email draft", "Post outline"],
          rightLabel: "Verify before relying",
          rightBody: "Use AI as a start, then check a trusted source.",
          rightItems: ["Today's market price", "Legal or medical advice", "Report figure"],
          footer: "The danger is not the mistake — it is a confident mistake without review",
          caption: "Simple rule: speed for writing and ideas · review for numbers or decisions",
        };
      }
      if (locale === "ar-MSA") {
        return {
          title: "الـ AI قوي في اللغة — يحتاج حذرًا في الحقائق",
          subtitle: "المراجعة جزء من استخدام الـ AI — ليست دليل فشل",
          leftLabel: "استخدم بسرعة",
          leftBody: "كتابة · تلخيص · أفكار — خذ الرد وعدّل بصوتك.",
          leftItems: ["تلخيص اجتماع", "مسودة بريد", "ترتيب أفكار لمنشور"],
          rightLabel: "راجع قبل الاعتماد",
          rightBody: "استخدم AI كبداية، ثم تحقق من مصدر موثوق.",
          rightItems: ["سعر مادة اليوم", "نصيحة قانونية أو طبية", "رقم مالي في تقرير"],
          footer: "أخطر شيء ليس الخطأ — أخطر شيء الخطأ بثقة دون مراجعة",
          caption: "قاعدة بسيطة: سرعة في الكتابة والأفكار · مراجعة لما فيه رقم أو قرار",
        };
      }
      if (locale === "ar-Gulf") {
        return {
          title: "الذكاء الاصطناعي قوي في اللغة — يحتاج حذر في الحقائق",
          subtitle: "التحقق جزء من استخدام الذكاء الاصطناعي — مو دليل فشل",
          leftLabel: "استخدم بسرعة",
          leftBody: "صياغة · تلخيص · ترتيب أفكار — خذ الرد وعدّل بصوتك.",
          leftItems: ["تلخيص اجتماع", "مسودة إيميل", "ترتيب أفكار"],
          rightLabel: "راجع قبل الاعتماد",
          rightBody: "استخدمه كبداية، وراجعه من مصدر تثق فيه.",
          rightItems: ["أرقام دقيقة", "قانون وطب ومال", "بيانات خاصة"],
          footer: "أخطر شيء مو إن الذكاء الاصطناعي يخطئ — أخطر شيء إنه يخطئ بثقة",
          caption: "قاعدة بسيطة: سرعة في الكتابة والأفكار · مراجعة لما فيه رقم أو قرار مهم",
        };
      }
      // ar-EG
      return {
        title: "الـ AI قوي في اللغة — محتاج حذر في الحقائق",
        subtitle: "المراجعة جزء من الاستخدام — مش دليل إن الأداة بايظة",
        leftLabel: "استخدم بسرعة",
        leftBody: "كتابة · تلخيص · أفكار — خذ الرد وعدّل بصوتك.",
        leftItems: ["تلخيص اجتماع", "مسودة إيميل", "ترتيب أفكار لبوست"],
        rightLabel: "راجع قبل الاعتماد",
        rightBody: "استخدم AI كبداية، وتحقق من مصدر موثوق.",
        rightItems: ["سعر خامة النهاردة", "نصيحة قانونية أو طبية", "رقم مالي في تقرير"],
        footer: "أخطر حاجة مش الغلط — أخطر حاجة الغلط بثقة بدون مراجعة",
        caption: "قاعدة بسيطة: سرعة في الكتابة والأفكار · مراجعة لما فيه رقم أو قرار مهم",
      };
    }

    // Start-with-AI instructional flow (original — no vendor chat UI).
    if (lessonId === "intro-m1-l3-setup-your-ai") {
      if (locale === "en") {
        return {
          title: "Start your first AI chat safely",
          subtitle: "Five steps: choose → open → write → review → improve",
          leftLabel: "Get started",
          leftBody: "Pick an assistant, open a fresh conversation, write a simple first prompt",
          leftItems: [
            "1. Choose an AI assistant",
            "2. Open a new conversation",
            "3. Write a simple first prompt",
          ],
          rightLabel: "Stay in control",
          rightBody: "Read the answer carefully, then improve the prompt and continue",
          rightItems: [
            "4. Review the answer",
            "5. Improve the prompt and continue",
            "Product names appear only as ordinary lesson context",
          ],
          footer: "Original instructional flow — no ChatGPT/Gemini/Claude interface imitation",
          caption: "Choose → open → prompt → review → improve",
        };
      }
      if (locale === "ar-MSA") {
        return {
          title: "ابدأ أول محادثة AI بأمان",
          subtitle: "خمس خطوات: اختر → افتح → اكتب → راجع → حسّن",
          leftLabel: "ابدأ",
          leftBody: "اختر مساعدًا، افتح محادثة جديدة، واكتب أول Prompt بسيط",
          leftItems: ["١. اختر مساعد AI", "٢. افتح محادثة جديدة", "٣. اكتب أول Prompt بسيط"],
          rightLabel: "ابقَ مسيطرًا",
          rightBody: "اقرأ الرد بعناية ثم حسّن الـ Prompt وتابع",
          rightItems: [
            "٤. راجع الإجابة",
            "٥. حسّن الـ Prompt وتابع",
            "أسماء المنتجات تظهر كنص سياق تعليمي فقط",
          ],
          footer: "تدفّق تعليمي أصلي — بلا محاكاة لواجهة ChatGPT/Gemini/Claude",
          caption: "اختر → افتح → Prompt → راجع → حسّن",
        };
      }
      if (locale === "ar-Gulf") {
        return {
          title: "ابدأ أول محادثة AI بأمان",
          subtitle: "خمس خطوات: اختر → افتح → اكتب → راجع → حسّن",
          leftLabel: "ابدأ",
          leftBody: "اختر مساعد، افتح محادثة جديدة، واكتب أول برومبت بسيط",
          leftItems: ["١. اختر مساعد AI", "٢. افتح محادثة جديدة", "٣. اكتب أول برومبت بسيط"],
          rightLabel: "خلّك مسيطر",
          rightBody: "اقرأ الرد بتمعن بعدين حسّن البرومبت وكمل",
          rightItems: [
            "٤. راجع الإجابة",
            "٥. حسّن البرومبت وكمل",
            "أسماء المنتجات تظهر كنص سياق تعليمي بس",
          ],
          footer: "تدفّق تعليمي أصلي — بدون محاكاة لواجهة ChatGPT/Gemini/Claude",
          caption: "اختر → افتح → برومبت → راجع → حسّن",
        };
      }
      // ar-EG
      return {
        title: "ابدأ أول محادثة AI بأمان",
        subtitle: "خمس خطوات: اختار → افتح → اكتب → راجع → حسّن",
        leftLabel: "ابدأ",
        leftBody: "اختار مساعد، افتح محادثة جديدة، واكتب أول Prompt بسيط",
        leftItems: ["١. اختار مساعد AI", "٢. افتح محادثة جديدة", "٣. اكتب أول Prompt بسيط"],
        rightLabel: "فضّل مسيطر",
        rightBody: "اقرأ الرد كويس وبعدين حسّن الـ Prompt وكمّل",
        rightItems: [
          "٤. راجع الإجابة",
          "٥. حسّن الـ Prompt وكمّل",
          "أسماء المنتجات تظهر كنص سياق تعليمي بس",
        ],
        footer: "تدفّق تعليمي أصلي — من غير محاكاة لواجهة ChatGPT/Gemini/Claude",
        caption: "اختار → افتح → Prompt → راجع → حسّن",
      };
    }

    // Frontend layer instructional flow (original — no DevTools / branded UI).
    if (lessonId === "builder-m5-l2-frontend") {
      if (locale === "en") {
        return {
          title: "Frontend = what the user sees and triggers",
          subtitle: "Five steps: action → component → state → request → result",
          leftLabel: "User side",
          leftBody: "A click or input hits a visible component and updates application state",
          leftItems: ["1. User action", "2. Interface component", "3. Application state"],
          rightLabel: "Visible outcome",
          rightBody: "State drives a request or data flow, then the UI shows the updated result",
          rightItems: [
            "4. Request or data flow",
            "5. Updated visible result",
            "Conceptual layers only — not a browser DevTools shot",
          ],
          footer: "Original instructional diagram — no Chrome DevTools or vendor UI imitation",
          caption: "Action → component → state → flow → visible result",
        };
      }
      if (locale === "ar-MSA") {
        return {
          title: "الـ Frontend = ما يراه المستخدم ويُفعّله",
          subtitle: "خمس خطوات: فعل → مكوّن → حالة → طلب → نتيجة",
          leftLabel: "جانب المستخدم",
          leftBody: "نقرة أو إدخال يصل مكوّنًا ظاهرًا ويحدّث حالة التطبيق",
          leftItems: ["١. فعل المستخدم", "٢. مكوّن الواجهة", "٣. حالة التطبيق"],
          rightLabel: "النتيجة الظاهرة",
          rightBody: "الحالة تحرّك طلبًا أو تدفق بيانات ثم تظهر الواجهة النتيجة المحدَّثة",
          rightItems: [
            "٤. طلب أو تدفق بيانات",
            "٥. نتيجة ظاهرة محدَّثة",
            "طبقات مفاهيمية فقط — ليست لقطة DevTools",
          ],
          footer: "رسم تعليمي أصلي — بلا محاكاة لـ Chrome DevTools أو واجهة بائع",
          caption: "فعل → مكوّن → حالة → تدفق → نتيجة ظاهرة",
        };
      }
      if (locale === "ar-Gulf") {
        return {
          title: "الـ Frontend = اللي يشوفه المستخدم ويضغطه",
          subtitle: "خمس خطوات: فعل → مكوّن → حالة → طلب → نتيجة",
          leftLabel: "جانب المستخدم",
          leftBody: "ضغطة أو إدخال توصل مكوّن ظاهر وتحدّث حالة التطبيق",
          leftItems: ["١. فعل المستخدم", "٢. مكوّن الواجهة", "٣. حالة التطبيق"],
          rightLabel: "النتيجة الظاهرة",
          rightBody: "الحالة تحرّك طلب أو تدفق بيانات بعدين الواجهة تبين النتيجة المحدَّثة",
          rightItems: [
            "٤. طلب أو تدفق بيانات",
            "٥. نتيجة ظاهرة محدَّثة",
            "طبقات مفاهيمية بس — مو لقطة DevTools",
          ],
          footer: "رسم تعليمي أصلي — بدون محاكاة لـ Chrome DevTools أو واجهة بائع",
          caption: "فعل → مكوّن → حالة → تدفق → نتيجة ظاهرة",
        };
      }
      // ar-EG
      return {
        title: "الـ Frontend = اللي المستخدم بيشوفه وبيضغطه",
        subtitle: "خمس خطوات: فعل → مكوّن → حالة → طلب → نتيجة",
        leftLabel: "جانب المستخدم",
        leftBody: "ضغطة أو إدخال توصل لمكوّن ظاهر وتحدّث حالة التطبيق",
        leftItems: ["١. فعل المستخدم", "٢. مكوّن الواجهة", "٣. حالة التطبيق"],
        rightLabel: "النتيجة الظاهرة",
        rightBody: "الحالة تحرّك طلب أو تدفق بيانات وبعدين الواجهة توري النتيجة المحدَّثة",
        rightItems: [
          "٤. طلب أو تدفق بيانات",
          "٥. نتيجة ظاهرة محدَّثة",
          "طبقات مفاهيمية بس — مش لقطة DevTools",
        ],
        footer: "رسم تعليمي أصلي — من غير محاكاة لـ Chrome DevTools أو واجهة بائع",
        caption: "فعل → مكوّن → حالة → تدفق → نتيجة ظاهرة",
      };
    }

    // Prompt-to-application instructional flow (original composition — not a vendor UI).
    if (lessonId === "builder-m6-l3-first-prompt-to-lovable") {
      if (locale === "en") {
        return {
          title: "From prompt to application",
          subtitle: "Five steps: state → constrain → submit → review → refine",
          leftLabel: "Build the prompt",
          leftBody: "State the desired result, then add context and constraints",
          leftItems: [
            "1. State the desired result",
            "2. Add context and constraints",
            "3. Submit the prompt to the app-building tool",
          ],
          rightLabel: "Review and iterate",
          rightBody: "Check the generated result, then refine the prompt",
          rightItems: [
            "4. Review the generated application result",
            "5. Refine the prompt and iterate",
            "Product name appears only as ordinary lesson context",
          ],
          footer: "Original instructional flow — no vendor screenshot or fake browser chrome",
          caption: "Prompt → tool → result → refine (educational composition)",
        };
      }
      if (locale === "ar-MSA") {
        return {
          title: "من الـ Prompt إلى التطبيق",
          subtitle: "خمس خطوات: حدّد → قيّد → أرسل → راجع → حسّن",
          leftLabel: "ابنِ الـ Prompt",
          leftBody: "حدّد النتيجة المطلوبة ثم أضف السياق والقيود",
          leftItems: [
            "١. حدّد النتيجة المطلوبة",
            "٢. أضف السياق والقيود",
            "٣. أرسل الـ Prompt إلى أداة بناء التطبيق",
          ],
          rightLabel: "راجع وكرّر",
          rightBody: "افحص النتيجة المولَّدة ثم حسّن الـ Prompt",
          rightItems: [
            "٤. راجع نتيجة التطبيق المولَّدة",
            "٥. حسّن الـ Prompt وكرّر",
            "اسم المنتج يظهر كنص سياق تعليمي فقط",
          ],
          footer: "تدفّق تعليمي أصلي — بلا لقطة بائع أو متصفح مزيّف",
          caption: "Prompt → أداة → نتيجة → تحسين (تركيب تعليمي)",
        };
      }
      if (locale === "ar-Gulf") {
        return {
          title: "من البرومبت إلى التطبيق",
          subtitle: "خمس خطوات: حدّد → قيّد → أرسل → راجع → حسّن",
          leftLabel: "ابنِ البرومبت",
          leftBody: "حدّد النتيجة المطلوبة بعدين أضف السياق والقيود",
          leftItems: [
            "١. حدّد النتيجة المطلوبة",
            "٢. أضف السياق والقيود",
            "٣. أرسل البرومبت لأداة بناء التطبيق",
          ],
          rightLabel: "راجع وكرّر",
          rightBody: "افحص النتيجة المولَّدة بعدين حسّن البرومبت",
          rightItems: [
            "٤. راجع نتيجة التطبيق المولَّدة",
            "٥. حسّن البرومبت وكرّر",
            "اسم المنتج يظهر كنص سياق تعليمي بس",
          ],
          footer: "تدفّق تعليمي أصلي — بدون لقطة بائع أو متصفح مزيّف",
          caption: "برومبت → أداة → نتيجة → تحسين (تركيب تعليمي)",
        };
      }
      // ar-EG
      return {
        title: "من الـ Prompt للتطبيق",
        subtitle: "خمس خطوات: حدّد → قيّد → ابعت → راجع → حسّن",
        leftLabel: "ابنِ الـ Prompt",
        leftBody: "حدّد النتيجة المطلوبة وبعدين ضيف السياق والقيود",
        leftItems: [
          "١. حدّد النتيجة المطلوبة",
          "٢. ضيف السياق والقيود",
          "٣. ابعت الـ Prompt لأداة بناء التطبيق",
        ],
        rightLabel: "راجع وكرّر",
        rightBody: "افحص النتيجة المتولدة وبعدين حسّن الـ Prompt",
        rightItems: [
          "٤. راجع نتيجة التطبيق المتولدة",
          "٥. حسّن الـ Prompt وكرّر",
          "اسم المنتج يظهر كنص سياق تعليمي بس",
        ],
        footer: "تدفّق تعليمي أصلي — من غير لقطة بائع أو متصفح مزيّف",
        caption: "Prompt → أداة → نتيجة → تحسين (تركيب تعليمي)",
      };
    }

    // Table/column anatomy (not a Production or database-product UI imitation).
    if (lessonId === "builder-m7-l1-tables-columns") {
      if (locale === "en") {
        return {
          title: "Table = data type · Column = typed attribute",
          subtitle: "Correct types from day one keep analysis and sorting possible",
          leftLabel: "Table anatomy",
          leftBody: "One table = one kind of row (users, conversations, documents)",
          leftItems: ["id → uuid primary key", "rating → integer", "created_at → timestamptz"],
          rightLabel: "Wrong type cost",
          rightBody: "Everything-as-text blocks averages, sorting, and money math",
          rightItems: ["not null for essentials", "numeric for money", "uuid for identifiers"],
          footer: "Abstract data-grid teaching composition — not an app screenshot",
          caption: "Design the table shape before storing rows",
        };
      }
      if (locale === "ar-MSA") {
        return {
          title: "الجدول = نوع · العمود = صفة بنوعها",
          subtitle: "الأنواع الصحيحة من اليوم الأول تحفظ التحليل والترتيب",
          leftLabel: "تشريح الجدول",
          leftBody: "جدول واحد = نوع صف واحد (مستخدمون، محادثات، مستندات)",
          leftItems: ["id → uuid مفتاح أساسي", "rating → integer", "created_at → timestamptz"],
          rightLabel: "ثمن النوع الخاطئ",
          rightBody: "كل شيء كنص يمنع المتوسطات والترتيب وحساب المال",
          rightItems: ["not null للأساسيات", "numeric للأموال", "uuid للمعرّفات"],
          footer: "تركيبة تعليمية مجرّدة لشبكة بيانات — ليست لقطة تطبيق",
          caption: "صمّم شكل الجدول قبل تخزين الصفوف",
        };
      }
      if (locale === "ar-Gulf") {
        return {
          title: "الجدول = نوع · العمود = صفة بنوعها",
          subtitle: "الأنواع الصحيحة من أول يوم تحفظ التحليل والترتيب",
          leftLabel: "تشريح الجدول",
          leftBody: "جدول واحد = نوع صف واحد (مستخدمين، محادثات، مستندات)",
          leftItems: ["id → uuid مفتاح أساسي", "rating → integer", "created_at → timestamptz"],
          rightLabel: "تكلفة النوع الغلط",
          rightBody: "كل شيء كنص يمنع المتوسطات والترتيب وحساب الفلوس",
          rightItems: ["not null للأساسيات", "numeric للأموال", "uuid للمعرّفات"],
          footer: "تركيبة تعليمية مجرّدة لشبكة بيانات — مو سكرين شوت لتطبيق",
          caption: "صمّم شكل الجدول قبل ما تخزّن الصفوف",
        };
      }
      // ar-EG
      return {
        title: "الجدول = نوع · العمود = صفة بنوعها",
        subtitle: "الأنواع الصحيحة من أول يوم بتحفظ التحليل والترتيب",
        leftLabel: "تشريح الجدول",
        leftBody: "جدول واحد = نوع صف واحد (مستخدمين، محادثات، مستندات)",
        leftItems: ["id → uuid مفتاح أساسي", "rating → integer", "created_at → timestamptz"],
        rightLabel: "تمن النوع الغلط",
        rightBody: "كل حاجة كنص بتمنع المتوسطات والترتيب وحساب الفلوس",
        rightItems: ["not null للأساسيات", "numeric للفلوس", "uuid للمعرّفات"],
        footer: "تركيبة تعليمية مجرّدة لشبكة بيانات — مش سكرين شوت لتطبيق",
        caption: "صمّم شكل الجدول قبل ما تخزّن الصفوف",
      };
    }

    // Generic two-panel composition from package summary + bullets (no invented facts).
    const leftItems = bullets.slice(0, 3);
    const rightItems = bullets.slice(3, 6);
    return {
      title: subtitle.length > 8 ? subtitle : title,
      subtitle: parsed.summary?.trim() || title,
      leftLabel: isArabicLocale(locale) ? "الفكرة" : "Idea",
      leftBody: leftItems[0] ?? parsed.summary ?? title,
      leftItems: leftItems.length ? leftItems : [title],
      rightLabel: isArabicLocale(locale) ? "التطبيق" : "Apply",
      rightBody: rightItems[0] ?? comparison?.subtitle ?? title,
      rightItems: rightItems.length ? rightItems : [parsed.summary ?? title],
      footer: isArabicLocale(locale)
        ? "محتوى مبني على حزمة الدرس المحلية فقط"
        : "Content grounded only in the locale lesson package",
      caption: title,
    };
  }

  if (kind === "ts-blocks" && existsSync(packagePath) && lessonId === "intro-m1-l4-ai-can-cannot") {
    // ar-EG authoritative TS package — wording from intro-m1-l4-ai-can-cannot.ts
    return {
      title: "الـ AI قوي في اللغة — محتاج حذر في الحقائق",
      subtitle: "المراجعة جزء من الاستخدام — مش دليل إن الأداة بايظة",
      leftLabel: "استخدم بسرعة",
      leftBody: "كتابة · تلخيص · أفكار — خذ الرد وعدّل بصوتك.",
      leftItems: ["تلخيص اجتماع", "مسودة إيميل", "ترتيب أفكار لبوست"],
      rightLabel: "راجع قبل الاعتماد",
      rightBody: "استخدم AI كبداية، وتحقق من مصدر موثوق.",
      rightItems: ["سعر خامة النهاردة", "نصيحة قانونية أو طبية", "رقم مالي في تقرير"],
      footer: "أخطر حاجة مش الغلط — أخطر حاجة الغلط بثقة بدون مراجعة",
      caption: "قاعدة بسيطة: سرعة في الكتابة والأفكار · مراجعة لما فيه رقم أو قرار مهم",
    };
  }

  if (
    kind === "ts-blocks" &&
    existsSync(packagePath) &&
    lessonId === "builder-m6-l3-first-prompt-to-lovable"
  ) {
    return {
      title: "أول Prompt = خمسة أجزاء",
      subtitle: "وصف البناء بوصفة واضحة — متسيّبش التخمين لتلات كلمات",
      leftLabel: "تشريح الـ Prompt",
      leftBody: "الهدف · المستخدمين · الصفحات · الأسلوب · الحدود",
      leftItems: [
        "الهدف: نوع الواجهة وليه",
        "المستخدمين: مين هيستخدمها",
        "الصفحات: أقسام الـ wireframe بالاسم",
      ],
      rightLabel: "ليه بينجح",
      rightBody: "النطاق الواضح أحسن من «اعمل واجهة» المبهم",
      rightItems: [
        "الأسلوب: ألوان ومود",
        "الحدود: إيه برّه النسخة الأولى",
        "النتيجة: وصفة جاهزة للنسخ",
      ],
      footer: "لوحة تعليمية مجرّدة — من غير محاكاة لواجهة طرف تالت",
      caption: "الوصفة قبل المعاينة: هدف + مستخدمين + صفحات + أسلوب + حدود",
    };
  }

  if (
    kind === "ts-blocks" &&
    existsSync(packagePath) &&
    lessonId === "builder-m7-l1-tables-columns"
  ) {
    return {
      title: "الجدول = نوع · العمود = صفة بنوعها",
      subtitle: "الأنواع الصحيحة من أول يوم بتحفظ التحليل والترتيب",
      leftLabel: "تشريح الجدول",
      leftBody: "جدول واحد = نوع صف واحد (مستخدمين، محادثات، مستندات)",
      leftItems: ["id → uuid مفتاح أساسي", "rating → integer", "created_at → timestamptz"],
      rightLabel: "تمن النوع الغلط",
      rightBody: "كل حاجة كنص بتمنع المتوسطات والترتيب وحساب الفلوس",
      rightItems: ["not null للأساسيات", "numeric للفلوس", "uuid للمعرّفات"],
      footer: "تركيبة تعليمية مجرّدة لشبكة بيانات — مش سكرين شوت لتطبيق",
      caption: "صمّم شكل الجدول قبل ما تخزّن الصفوف",
    };
  }

  if (kind === "ts-blocks" && existsSync(packagePath)) {
    const source = readFileSync(packagePath, "utf8");
    const titleMatch = source.match(/title:\s*"((?:[^"\\]|\\.)*)"/);
    const title = titleMatch ? JSON.parse(`"${titleMatch[1]}"`) : fallbackTitle;
    const eyebrowIdea = source.includes("الفكرة الأساسية");
    return {
      title,
      subtitle: eyebrowIdea ? "الفكرة الأساسية" : title,
      leftLabel: "المفهوم",
      leftBody: title,
      leftItems: [title],
      rightLabel: "التطبيق",
      rightBody: title,
      rightItems: [lessonId],
      footer: "محتوى من مصدر ar-EG (TS)",
      caption: title,
    };
  }

  return {
    title: fallbackTitle,
    subtitle: fallbackTitle,
    leftLabel: isArabicLocale(locale) ? "أ" : "A",
    leftBody: fallbackTitle,
    leftItems: [fallbackTitle],
    rightLabel: isArabicLocale(locale) ? "ب" : "B",
    rightBody: fallbackTitle,
    rightItems: [fallbackTitle],
    footer: "PACKAGE_MISSING",
    caption: fallbackTitle,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(
  input: InstructionalCompositionInput,
  copy: ReturnType<typeof extractTeachingCopy>,
): string {
  const dir = isArabicLocale(input.locale) ? "rtl" : "ltr";
  const lang = input.locale === "en" ? "en" : "ar";
  const fontReg = pathToFileURL(FONT_REGULAR).href;
  const fontBold = pathToFileURL(FONT_BOLD).href;
  const logo = pathToFileURL(LOGO).href;
  const eyebrow = isArabicLocale(input.locale) ? "الفكرة الأساسية" : "Core idea";
  const panelLabel = isArabicLocale(input.locale)
    ? "خريطة الثقة — نفس الأداة، استخدامين مختلفين"
    : "Trust map — same tool, two different uses";

  const leftItems = copy.leftItems
    .map((i) => `<div class="item">${escapeHtml(i)}</div>`)
    .join("\n");
  const rightItems = copy.rightItems
    .map((i) => `<div class="item">${escapeHtml(i)}</div>`)
    .join("\n");

  // RTL: first grid cell appears on the right. Put caution first so it sits on the right (يمين),
  // strength second on the left (شمال) — matches approved ar-EG lesson-4 map.
  const cols =
    dir === "rtl"
      ? `
        <div class="col c2">
          <div class="badge">${escapeHtml(copy.rightLabel)}</div>
          <div class="ar">${escapeHtml(copy.rightBody)}</div>
          <div class="items">${rightItems}</div>
        </div>
        <div class="col c1">
          <div class="badge">${escapeHtml(copy.leftLabel)}</div>
          <div class="ar">${escapeHtml(copy.leftBody)}</div>
          <div class="items">${leftItems}</div>
        </div>`
      : `
        <div class="col c1">
          <div class="badge">${escapeHtml(copy.leftLabel)}</div>
          <div class="ar">${escapeHtml(copy.leftBody)}</div>
          <div class="items">${leftItems}</div>
        </div>
        <div class="col c2">
          <div class="badge">${escapeHtml(copy.rightLabel)}</div>
          <div class="ar">${escapeHtml(copy.rightBody)}</div>
          <div class="items">${rightItems}</div>
        </div>`;

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="utf-8" />
  <style>
    @font-face { font-family: "Tajawal"; src: url("${fontReg}") format("truetype"); font-weight: 400; }
    @font-face { font-family: "Tajawal"; src: url("${fontBold}") format("truetype"); font-weight: 700; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: ${CANVAS_WIDTH}px; height: ${CANVAS_HEIGHT}px; overflow: hidden;
      font-family: "Tajawal", "Segoe UI", Tahoma, sans-serif; color: #243044; direction: ${dir}; background: #eef3f6; }
    .canvas { width: ${CANVAS_WIDTH}px; height: ${CANVAS_HEIGHT}px; position: relative;
      background:
        radial-gradient(ellipse 46% 40% at 10% 16%, rgba(95, 168, 148, 0.20), transparent 58%),
        radial-gradient(ellipse 40% 36% at 90% 12%, rgba(120, 148, 186, 0.16), transparent 55%),
        linear-gradient(165deg, #fbfcfd 0%, #eef3f6 100%); }
    .logo { position: absolute; top: 26px; ${dir === "rtl" ? "right" : "left"}: 40px; height: 46px; width: auto; }
    .eyebrow { position: absolute; top: 34px; ${dir === "rtl" ? "left" : "right"}: 40px; font-size: 15px; font-weight: 700; color: #4a7388; }
    .title { position: absolute; top: 78px; right: 40px; left: 40px; text-align: center; font-size: 30px; font-weight: 700; line-height: 1.35; }
    .subtitle { position: absolute; top: 128px; right: 80px; left: 80px; text-align: center; font-size: 17px; color: #5a6b7c; }
    .panel { position: absolute; top: 178px; left: 56px; right: 56px; height: 430px; border-radius: 22px;
      background: rgba(255,255,255,0.78); border: 1.5px solid rgba(74,115,136,0.18);
      box-shadow: 0 10px 28px rgba(36,48,68,0.06); padding: 22px 26px 18px; display: flex; flex-direction: column; gap: 14px; }
    .panel-label { font-size: 14px; font-weight: 700; color: #4a7388; text-align: center; }
    .cols { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; min-height: 0; }
    .col { border-radius: 16px; padding: 18px; display: flex; flex-direction: column; gap: 10px; border: 1.5px solid transparent; }
    .badge { align-self: flex-start; font-size: 14px; font-weight: 700; padding: 6px 14px; border-radius: 999px; color: #fff; }
    .ar { font-size: 20px; font-weight: 700; line-height: 1.35; }
    .items { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
    .item { font-size: 15px; padding: 10px 14px; border-radius: 12px; background: rgba(255,255,255,0.72); border: 1px solid rgba(36,48,68,0.08); }
    .c1 { background: rgba(61,143,117,0.10); border-color: rgba(61,143,117,0.28); }
    .c1 .badge { background: #3d8f75; }
    .c2 { background: rgba(184,122,85,0.10); border-color: rgba(184,122,85,0.28); }
    .c2 .badge { background: #b87a55; }
    .footer-row { text-align: center; font-size: 15px; font-weight: 700; color: #4a7388; }
    .caption { position: absolute; bottom: 28px; left: 80px; right: 80px; text-align: center; font-size: 15px; color: #5a6b7c; }
    .meta { position: absolute; bottom: 8px; ${dir === "rtl" ? "left" : "right"}: 16px; font-size: 11px; color: #9aa8b8; }
  </style>
</head>
<body>
  <div class="canvas">
    <img class="logo" src="${logo}" alt="Masaarat" height="46" />
    <div class="eyebrow">${escapeHtml(eyebrow)}</div>
    <h1 class="title">${escapeHtml(copy.title)}</h1>
    <p class="subtitle">${escapeHtml(copy.subtitle)}</p>
    <div class="panel">
      <div class="panel-label">${escapeHtml(panelLabel)}</div>
      <div class="cols">${cols}</div>
      <div class="footer-row">${escapeHtml(copy.footer)}</div>
    </div>
    <p class="caption">${escapeHtml(copy.caption)}</p>
    <div class="meta">${escapeHtml(input.lessonId)} · ${escapeHtml(input.locale)} · pos ${input.position}</div>
  </div>
</body>
</html>`;
}

/**
 * Bounded Chrome spawn timeout (ms). Sized for cold start on GitHub-hosted
 * runners (apt-installed Chromium) while remaining finite and explicit.
 * Do not raise Vitest's global default for unrelated tests — apply per suite.
 */
export const CHROME_RENDER_TIMEOUT_MS = 60_000;
/** Max wait for Chrome to flush screenshot file after process exit (ms). */
export const CHROME_PNG_FLUSH_TIMEOUT_MS = 3_000;

/** Deterministic counters for zero-render proofs (preflight / report-only). */
export const renderTelemetry = {
  rendererCalls: 0,
  browserLaunches: 0,
  paidProviderCalls: 0,
};

export function resetRenderTelemetry(): void {
  renderTelemetry.rendererCalls = 0;
  renderTelemetry.browserLaunches = 0;
  renderTelemetry.paidProviderCalls = 0;
}

/** Fail-closed when preflight/report-only (or tests) set CONTROLLED_V1_ZERO_RENDER=1. */
export function assertRenderAuthorized(context: string): void {
  if (process.env.CONTROLLED_V1_ZERO_RENDER === "1") {
    throw new Error(
      `BLOCKED_ZERO_RENDER: ${context} refused — CONTROLLED_V1_ZERO_RENDER=1 (preflight/report-only must not render)`,
    );
  }
}

/** Resolve Chrome/Chromium executable; throw with precise classification if missing. */
export function resolveChromeExecutable(): string {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.GOOGLE_CHROME_BIN,
    "C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe",
    "C:\\\\Program Files (x86)\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe",
    join(process.env.LOCALAPPDATA ?? "", "Google/Chrome/Application/chrome.exe"),
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean) as string[];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new Error(
    "BLOCKED_CHROME_MISSING: Chrome/Chromium not found for INSTRUCTIONAL_COMPOSITION render. Set CHROME_PATH.",
  );
}

function findChrome(): string {
  return resolveChromeExecutable();
}

function renderHtmlToPng(htmlPath: string, pngPath: string): void {
  assertRenderAuthorized("renderHtmlToPng");
  renderTelemetry.browserLaunches += 1;
  const chrome = findChrome();
  mkdirSync(dirname(pngPath), { recursive: true });
  const userData = join(
    tmpdir(),
    `controlled-v1-chrome-${createHash("sha1").update(htmlPath).digest("hex").slice(0, 10)}`,
  );
  mkdirSync(userData, { recursive: true });
  const uri = pathToFileURL(htmlPath).href;
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--window-size=${CANVAS_WIDTH},${CANVAS_HEIGHT}`,
    `--user-data-dir=${userData}`,
    `--screenshot=${pngPath}`,
    uri,
  ];
  const result = spawnSync(chrome, args, {
    encoding: "utf8",
    timeout: CHROME_RENDER_TIMEOUT_MS,
  });
  if (result.error && (result.error as NodeJS.ErrnoException).code === "ETIMEDOUT") {
    throw new Error(
      `BLOCKED_CHROME_COLD_START_TIMEOUT: Chrome spawn exceeded ${CHROME_RENDER_TIMEOUT_MS}ms`,
    );
  }
  if (result.status !== 0 && !existsSync(pngPath)) {
    throw new Error(
      `Chrome screenshot failed (status=${result.status}): ${result.stderr || result.stdout}`,
    );
  }
  const deadline = Date.now() + CHROME_PNG_FLUSH_TIMEOUT_MS;
  while (!existsSync(pngPath) && Date.now() < deadline) {
    // Bounded wait for Chrome flush on Windows (no sleep; short busy poll).
  }
  if (!existsSync(pngPath)) {
    throw new Error(`Chrome did not write PNG: ${pngPath}`);
  }
}

export function generateInstructionalComposition(
  input: InstructionalCompositionInput,
): InstructionalCompositionResult {
  assertRenderAuthorized("generateInstructionalComposition");
  renderTelemetry.rendererCalls += 1;
  if (!existsSync(FONT_REGULAR) || !existsSync(FONT_BOLD)) {
    throw new Error("Tajawal fonts missing under src/lib/lesson-visuals/v1/fonts/");
  }
  if (!existsSync(LOGO)) {
    throw new Error("Official logo missing: public/brand/masaarat-logo-lockup.png");
  }

  const pkg = resolveLocalePackage(input.lessonId, input.locale, input.title, {
    localeLessonsRoot: input.localeLessonsRoot,
    treatArEgAsJsonPackage: input.treatArEgAsJsonPackage,
  });
  if (!pkg.exists) {
    throw new Error(
      `BLOCKED_UNRESOLVED_SPEC: locale package missing for ${input.lessonId} / ${input.locale} at ${pkg.path}`,
    );
  }

  const copy = extractTeachingCopy(
    input.lessonId,
    input.locale,
    pkg.path,
    pkg.kind,
    pkg.title ?? input.title,
  );

  const outDir = input.outputDir ?? mkdtempSync(join(tmpdir(), "controlled-v1-compose-"));
  // Never write intermediate HTML/PNG under artifacts/controlled-v1 — production
  // runner copies result.png into the cell path; tests must stay outside production trees.
  if (outDir.replace(/\\/g, "/").includes("/artifacts/controlled-v1")) {
    throw new Error(
      "BLOCKED: instructional composition outputDir must not be under artifacts/controlled-v1",
    );
  }
  mkdirSync(outDir, { recursive: true });
  const htmlPath = join(outDir, "final-review.html");
  const pngPath = join(outDir, "final.png");
  writeFileSync(htmlPath, buildHtml(input, copy), "utf8");
  renderHtmlToPng(htmlPath, pngPath);
  const png = readFileSync(pngPath);

  // Basic PNG signature + size check via IHDR
  if (png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    throw new Error("Rendered output is not a valid PNG");
  }
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (width !== CANVAS_WIDTH || height !== CANVAS_HEIGHT) {
    throw new Error(`PNG dimensions ${width}x${height} != ${CANVAS_WIDTH}x${CANVAS_HEIGHT}`);
  }

  return {
    png,
    width,
    height,
    asciiTitleUsed: pkg.titleEn ?? input.lessonId,
    localizedTitle: pkg.title,
    packagePath: pkg.path,
    packageExists: pkg.exists,
    htmlPath,
    direction: isArabicLocale(input.locale) ? "rtl" : "ltr",
  };
}
