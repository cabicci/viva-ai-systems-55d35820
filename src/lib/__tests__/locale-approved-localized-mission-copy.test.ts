import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  adaptPackageMissionToLiveShape,
  deliveryToPrompt,
} from "@/lib/locale-lessons/adapt-package-to-live-mission";
import type {
  LessonPackageLocale,
  LocalizedLessonPackage,
} from "@/lib/locale-lessons/types";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

const TARGET_LESSONS = [
  "automator-m4-l3-error-handling",
  "intro-m1-l5-ai-vs-software",
] as const;

const APPROVED: Record<
  LessonPackageLocale,
  Record<
    (typeof TARGET_LESSONS)[number],
    {
      intro: string;
      delivery: string[];
      rubric: Array<{ dimension: string; weight: number; criteria: string }>;
      yamlIntent: string;
      yamlType: string;
      changePaths: Array<"mission.intro" | "mission.delivery">;
    }
  >
> = {
  "ar-MSA": {
    "automator-m4-l3-error-handling": {
      intro:
        "صمّم قاعدة تنبيه واحدة لمسار عمل حقيقي. لا يلزم بناء الأتمتة؛ حدّد نقطة الفشل، وخطة إعادة المحاولة، ومن يتلقى التنبيه، وما الذي يُسجَّل عند الفشل. يمكن للذكاء الاصطناعي أن يقترح، لكن القرار النهائي لك.",
      delivery: [
        "حدّد خطوة واحدة في مسار العمل قد تفشل، واذكر سببًا واقعيًا للفشل.",
        "حدّد عدد محاولات إعادة المحاولة، ومتى تُعاد المحاولة، ومتى تتوقف.",
        "حدّد الشخص أو الفريق الذي سيتلقى التنبيه، وقناة التنبيه المستخدمة.",
        "حدّد البيانات التي ستُسجَّل عند الفشل، مثل اسم الخطوة، ووقت الفشل، ورسالة الخطأ، ومعرّف العملية أو السجل.",
        "اكتب القاعدة النهائية بصيغة: إذا فشلت [الخطوة] بعد [عدد] محاولات، فأرسل [التنبيه] إلى [المستلم] وسجّل [البيانات].",
      ],
      rubric: [
        {
          dimension: "خطوة وسبب",
          weight: 40,
          criteria: "خطوة فشل محدّدة؛ سبب واقعي",
        },
        {
          dimension: "قاعدة تنبيه",
          weight: 60,
          criteria: "مين + كيف + ماذا يُسجَّل؛ **Retry** واضح",
        },
      ],
      yamlIntent: "Write one alert rule: if step fails → who gets notified how",
      yamlType: "practice",
      changePaths: ["mission.intro", "mission.delivery"],
    },
    "intro-m1-l5-ai-vs-software": {
      intro:
        "اختر ٣ مهام صغيرة وحقيقية من حياتك أو عملك. حدد لكل واحدة: AI / Software / الاثنين — مع سبب واضح.",
      delivery: [
        "اكتب ثلاث مهام صغيرة وحقيقية من حياتك أو عملك.",
        "حدّد لكل مهمة الأداة الأنسب: AI، أو Software، أو الاثنان معًا.",
        "اكتب سببًا واضحًا لكل اختيار يربط طبيعة المهمة بالأداة: دقة وتكرار، أو لغة ومرونة، أو الجمع بينهما.",
      ],
      rubric: [
        {
          dimension: "اختيار منطقي",
          weight: 70,
          criteria: "٣ مهام مع أداة مناسبة لكل واحدة",
        },
        {
          dimension: "مهام حقيقية",
          weight: 30,
          criteria: "المهام من حياتك أو عملك — لا أمثلة عامة فارغة",
        },
      ],
      yamlIntent:
        "Pick 3 small real tasks; assign AI / Software / both with one-line why each",
      yamlType: "practice",
      changePaths: ["mission.delivery"],
    },
  },
  "ar-Gulf": {
    "automator-m4-l3-error-handling": {
      intro:
        "صمّم قاعدة تنبيه وحدة لمسار عمل فعلي. مو مطلوب تبني الأتمتة؛ حدّد وين ممكن تفشل، وخطة إعادة المحاولة، ومين يوصله التنبيه، ووش ينحفظ عند الفشل. الذكاء الاصطناعي ممكن يقترح، لكن القرار الأخير لك.",
      delivery: [
        "حدّد خطوة وحدة في مسار العمل ممكن تفشل، واذكر سبب واقعي للفشل.",
        "حدّد عدد مرات إعادة المحاولة، ومتى تعيد المحاولة، ومتى توقف.",
        "حدّد مين يستلم التنبيه وبأي قناة، مثل البريد أو واتساب.",
        "حدّد البيانات اللي تنحفظ عند الفشل، مثل اسم الخطوة، ووقت الفشل، ورسالة الخطأ، ومعرّف العملية أو السجل.",
        "اكتب القاعدة النهائية بالشكل: إذا فشلت [الخطوة] بعد [عدد] محاولات، أرسل [التنبيه] إلى [المستلم] وسجّل [البيانات].",
      ],
      rubric: [
        {
          dimension: "خطوة وسبب",
          weight: 40,
          criteria: "خطوة فشل محدّدة؛ سبب واقعي",
        },
        {
          dimension: "قاعدة تنبيه",
          weight: 60,
          criteria: "مين + كيف + وش يُسجَّل؛ **Retry** واضح",
        },
      ],
      yamlIntent: "Write one alert rule: if step fails → who gets notified how",
      yamlType: "practice",
      changePaths: ["mission.intro", "mission.delivery"],
    },
    "intro-m1-l5-ai-vs-software": {
      intro:
        "اختر ٣ مهام صغيرة وحقيقية من حياتك أو عملك. حدد لكل واحدة: ذكاء اصطناعي / برنامج / الاثنين — مع سبب واضح.",
      delivery: [
        "اكتب ٣ مهام صغيرة وحقيقية من حياتك أو عملك.",
        "حدّد لكل مهمة الأداة الأنسب: ذكاء اصطناعي، أو برنامج، أو الاثنين مع بعض.",
        "اكتب سبب واضح لكل اختيار يربط طبيعة المهمة بالأداة: دقة وتكرار، أو لغة ومرونة، أو الجمع بينهم.",
      ],
      rubric: [
        {
          dimension: "اختيار منطقي",
          weight: 70,
          criteria: "٣ مهام مع أداة مناسبة لكل واحدة",
        },
        {
          dimension: "مهام حقيقية",
          weight: 30,
          criteria: "المهام من حياتك أو عملك — مو أمثلة عامة فارغة",
        },
      ],
      yamlIntent:
        "Pick 3 small real tasks; assign AI / Software / both with one-line why each",
      yamlType: "practice",
      changePaths: ["mission.delivery"],
    },
  },
  en: {
    "automator-m4-l3-error-handling": {
      intro:
        "Design one alert rule for a real workflow. You do not need to build the automation. Define the failure point, retry plan, alert recipient and channel, and the information that must be logged. AI may suggest options, but you make the final decision.",
      delivery: [
        "Identify one workflow step that could fail and give one realistic cause of failure.",
        "Define the retry count, when a retry should happen, and when retries should stop.",
        "Identify the person or team that receives the alert and the notification channel.",
        "Define the information logged after failure, such as the step name, failure time, error message, and process or record ID.",
        "Write the final rule in this format: If [step] fails after [number] retries, send [alert] to [recipient] and log [data].",
      ],
      rubric: [
        {
          dimension: "Step and Reason",
          weight: 40,
          criteria: "Specific failed step; realistic reason",
        },
        {
          dimension: "Alert Rule",
          weight: 60,
          criteria: "Who + how + what is logged; clear **Retry**",
        },
      ],
      yamlIntent: "Write one alert rule: if step fails → who gets notified how",
      yamlType: "practice",
      changePaths: ["mission.intro", "mission.delivery"],
    },
    "intro-m1-l5-ai-vs-software": {
      intro:
        "Choose 3 small, real tasks from your life or work. Identify for each one: AI / Software / both — with a clear reason.",
      delivery: [
        "List three small, real tasks from your life or work.",
        "Choose the most suitable tool for each task: AI, software, or both.",
        "Give one clear reason for each choice based on the task: accuracy and repetition, language and flexibility, or a combination of both.",
      ],
      rubric: [
        {
          dimension: "Logical Choice",
          weight: 70,
          criteria: "3 tasks with a suitable tool for each",
        },
        {
          dimension: "Real Tasks",
          weight: 30,
          criteria: "Tasks from your life or work — no empty general examples",
        },
      ],
      yamlIntent:
        "Pick 3 small real tasks; assign AI / Software / both with one-line why each",
      yamlType: "practice",
      changePaths: ["mission.delivery"],
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

function missionSection(pkg: LocalizedLessonPackage) {
  const section = pkg.sections.find((entry) => entry.mission);
  expect(section).toBeTruthy();
  return section!;
}

describe("Approved localized mission copy — six packages", () => {
  for (const locale of ["ar-MSA", "ar-Gulf", "en"] as const) {
    for (const lessonId of TARGET_LESSONS) {
      const approved = APPROVED[locale][lessonId];

      it(`recovered ${locale}/${lessonId} matches approved mission contract`, () => {
        const section = missionSection(readRecovered(locale, lessonId));
        const mission = section.mission!;

        expect(mission.intro).toBe(approved.intro);
        expect(mission.delivery).toEqual(approved.delivery);
        expect(mission.rubric).toEqual(approved.rubric);
        expect(mission.yamlIntent).toBe(approved.yamlIntent);
        expect(mission.yamlType).toBe(approved.yamlType);
        expect(mission.intro).not.toMatch(/\| البعد \||\| Dimension \|/);
      });

      it(`runtime ${locale}/${lessonId} matches recovered mission fields`, () => {
        const recovered = missionSection(readRecovered(locale, lessonId)).mission;
        const runtime = missionSection(readRuntime(locale, lessonId)).mission;
        expect(runtime).toEqual(recovered);
      });

      it(`adapter accepts ${locale}/${lessonId} and uses delivery[] as prompt`, () => {
        const pkg = readRuntime(locale, lessonId);
        const section = missionSection(pkg);
        const live = adaptPackageMissionToLiveShape(pkg.lessonId, section, 0);

        expect(live.intro).toBe(approved.intro);
        expect(live.delivery).toEqual(approved.delivery);
        expect(live.prompt).toBe(deliveryToPrompt(approved.delivery));
        expect(live.prompt).not.toContain("**Delivery:**");
        expect(live.missionId).toBe(`${lessonId}::mission`);
      });
    }
  }

  it("delivery counts are 5/5/5 for automator-m4-l3 and 3/3/3 for intro-m1-l5", () => {
    for (const locale of ["ar-MSA", "ar-Gulf", "en"] as const) {
      expect(
        missionSection(readRecovered(locale, "automator-m4-l3-error-handling"))
          .mission!.delivery,
      ).toHaveLength(5);
      expect(
        missionSection(readRecovered(locale, "intro-m1-l5-ai-vs-software")).mission!
          .delivery,
      ).toHaveLength(3);
    }
  });
});
