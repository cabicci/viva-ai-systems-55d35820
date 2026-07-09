import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type {
  LessonPackageLocale,
  LocalizedLessonPackage,
} from "@/lib/locale-lessons/types";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

const APPROVED: Record<
  LessonPackageLocale,
  Record<
    string,
    {
      intro: string;
      delivery: string[];
      rubricCriteria?: [string, string];
    }
  >
> = {
  "ar-MSA": {
    "automator-m3-testing-automation": {
      intro:
        "أنشئ قائمة تحقق لاختبار أتمتة واحدة قبل تشغيلها فعليًا. يجب أن تغطي اختبار خطوة واحدة، واختبار المسار كاملًا ببيانات تجريبية، وثلاث حالات استثنائية، ومراجعة يدوية نهائية.",
      delivery: [
        "اسم الأتمتة والنتيجة المتوقعة منها.",
        "اختبار خطوة واحدة يوضح المدخل والنتيجة المتوقعة.",
        "اختبار للمسار كاملًا ببيانات تجريبية مع تحديد النتيجة النهائية المتوقعة.",
        "ثلاث حالات استثنائية: بيانات فارغة، بيانات غير صحيحة، ومدخل مكرر، مع السلوك المتوقع لكل حالة.",
        "تحديد من ينفذ المراجعة اليدوية وما الذي يراجعه قبل التشغيل.",
      ],
    },
    "automator-m5-l1-llm-in-flow": {
      intro:
        "صمّم خطوة LLM واحدة داخل مسار عمل حقيقي. حدّد بدقة ما تستقبله الخطوة، والمهمة التي تنفذها، والمخرجات المنظمة التي تعيدها، وكيف تستخدم الخطوة التالية هذه المخرجات.",
      delivery: [
        "ارسم أو اكتب المسار: المُشغّل → المدخل → خطوة LLM → المخرجات المنظمة → الخطوة التالية.",
        "حدّد المدخل الفعلي الذي يصل إلى خطوة LLM.",
        "حدّد مهمة واحدة واضحة: تصنيف أو تلخيص أو استخراج.",
        "حدّد أسماء حقول المخرجات المنظمة، مع قيمة مثال لكل حقل.",
        "اشرح كيف تستخدم الخطوة التالية هذه الحقول.",
      ],
      rubricCriteria: [
        "يحدد المدخل، ومهمة LLM الواحدة، وحقول المخرجات المنظمة بوضوح، ولا يكتفي بوصف عام مثل «الذكاء الاصطناعي يفهم».",
        "يوضح موضع خطوة LLM داخل المسار وكيف تستخدم الخطوة التالية المخرجات المنظمة لتنفيذ إجراء محدد.",
      ],
    },
  },
  "ar-Gulf": {
    "automator-m3-testing-automation": {
      intro:
        "جهّز قائمة تحقق لاختبار أتمتة وحدة قبل تشغّلها فعليًا. لازم تغطي اختبار خطوة وحدة، واختبار التدفق كامل ببيانات تجريبية، وثلاث حالات استثنائية، ومراجعة يدوية أخيرة.",
      delivery: [
        "اسم الأتمتة والنتيجة اللي تتوقعها منها.",
        "اختبار لخطوة وحدة يوضح المدخل والنتيجة المتوقعة.",
        "اختبار للتدفق كامل ببيانات تجريبية مع تحديد النتيجة النهائية المتوقعة.",
        "ثلاث حالات استثنائية: بيانات فاضية، بيانات غلط، ومدخل مكرر، مع السلوك المتوقع لكل حالة.",
        "حدّد مين يسوي المراجعة اليدوية ووش يراجع قبل التشغيل.",
      ],
    },
    "automator-m5-l1-llm-in-flow": {
      intro:
        "صمّم خطوة LLM وحدة داخل مسار عمل فعلي. حدّد بالضبط وش يدخل لها، وش تسوي، وش الحقول المنظمة اللي ترجعها، وكيف تستخدم الخطوة اللي بعدها هالحقول.",
      delivery: [
        "اكتب أو ارسم المسار: المُشغّل → المدخل → خطوة LLM → المخرجات المنظمة → الخطوة اللي بعدها.",
        "حدّد المدخل الفعلي اللي يصل إلى خطوة LLM.",
        "حدّد مهمة وحدة واضحة: تصنيف أو تلخيص أو استخراج.",
        "حدّد أسماء حقول المخرجات المنظمة، مع قيمة مثال لكل حقل.",
        "وضّح كيف تستخدم الخطوة اللي بعدها هالحقول.",
      ],
      rubricCriteria: [
        "يحدد المدخل، ومهمة LLM الوحدة، وحقول المخرجات المنظمة بوضوح، وما يكتفي بوصف عام مثل «الذكاء الاصطناعي يفهم».",
        "يوضح مكان خطوة LLM في المسار وكيف تستخدم الخطوة اللي بعدها المخرجات المنظمة لتنفيذ إجراء محدد.",
      ],
    },
  },
  en: {
    "automator-m3-testing-automation": {
      intro:
        "Create a pre-launch test checklist for one automation. Cover a unit test, a full-flow test with test data, three edge cases, and a final manual review.",
      delivery: [
        "Name the automation and its expected result.",
        "Define one unit test with its input and expected output.",
        "Define one full-flow test using test data and state the expected final result.",
        "Define three edge cases: empty data, invalid data, and a duplicate input, including the expected behavior for each.",
        "Identify who performs the manual review and what they must check before launch.",
      ],
    },
    "automator-m5-l1-llm-in-flow": {
      intro:
        "Design one LLM step inside a real workflow. Define exactly what the step receives, the task it performs, the structured output it returns, and how the next step uses that output.",
      delivery: [
        "Draw or write the workflow: trigger → input → LLM step → structured output → next step.",
        "Define the exact input sent to the LLM step.",
        "Define one clear task: classification, summarization, or extraction.",
        "List the structured output fields and provide one example value for each field.",
        "Explain how the next step uses those fields.",
      ],
      rubricCriteria: [
        'Clearly defines the input, one LLM task, and the structured output fields; it does not rely on a vague statement such as "the AI understands."',
        "Clearly shows where the LLM step belongs in the workflow and how the next step uses its structured output to perform a specific action.",
      ],
    },
  },
};

function readRecovered(
  locale: LessonPackageLocale,
  lessonId: string,
): LocalizedLessonPackage {
  const filePath = path.join(
    REPO_ROOT,
    "src/lib/locale-lessons/ar-MSA/reports/phase13b-recovered-packages",
    locale,
    `${lessonId}.json`,
  );
  return JSON.parse(readFileSync(filePath, "utf8")) as LocalizedLessonPackage;
}

function readRuntime(
  locale: LessonPackageLocale,
  lessonId: string,
): LocalizedLessonPackage {
  const filePath = path.join(
    REPO_ROOT,
    "src/lib/locale-lessons",
    locale,
    "lessons",
    `${lessonId}.json`,
  );
  return JSON.parse(readFileSync(filePath, "utf8")) as LocalizedLessonPackage;
}

describe("Stage 2.3A Scientific Review approved mission packages", () => {
  for (const locale of ["ar-MSA", "ar-Gulf", "en"] as const) {
    for (const [lessonId, approved] of Object.entries(APPROVED[locale])) {
      it(`recovered ${locale}/${lessonId} matches approved mission fields`, () => {
        const pkg = readRecovered(locale, lessonId);
        const mission = pkg.sections.find((section) => section.mission)?.mission;
        expect(mission?.intro).toBe(approved.intro);
        expect(mission?.delivery).toEqual(approved.delivery);
        if (approved.rubricCriteria) {
          expect(mission?.rubric[0]?.criteria).toBe(approved.rubricCriteria[0]);
          expect(mission?.rubric[1]?.criteria).toBe(approved.rubricCriteria[1]);
        }
      });

      it(`runtime ${locale}/${lessonId} matches recovered mission fields`, () => {
        const recovered = readRecovered(locale, lessonId);
        const runtime = readRuntime(locale, lessonId);
        const recoveredMission = recovered.sections.find((section) => section.mission)?.mission;
        const runtimeMission = runtime.sections.find((section) => section.mission)?.mission;
        expect(runtimeMission).toEqual(recoveredMission);
      });
    }
  }
});
