import {
  hasIntroLessonContent,
  loadIntroLessonContent,
} from "@/components/intro/lessons/lesson-registry";
import { PATHS } from "@/lib/curriculum-data";
import {
  adaptPackageMissionsFromSections,
  packageMissionId,
} from "@/lib/locale-lessons/adapt-package-to-live-mission";
import { loadLocalePackageLesson } from "@/lib/locale-lessons/load-locale-package-lesson";
import type {
  LessonPackageLocale,
  LocalizedLessonPackage,
} from "@/lib/locale-lessons/types";
import type { SupportedLocale } from "@/lib/locale/types";

export const MISSION_EVALUATION_LOCALES = [
  "ar-EG",
  "ar-MSA",
  "ar-Gulf",
  "en",
] as const satisfies readonly SupportedLocale[];

export type MissionEvaluationLocale =
  (typeof MISSION_EVALUATION_LOCALES)[number];

export type CanonicalMissionRubricCriterion = {
  label: string;
  weight: number;
  criteria: string[];
};

export type CanonicalMissionEvaluationSource = {
  lessonId: string;
  missionId: string;
  lessonTitle: string;
  missionPrompt: string;
  rubric: CanonicalMissionRubricCriterion[];
};

type RawRubric = ReadonlyArray<{
  label: string;
  weight: number;
  criteria: readonly string[];
}>;

function sourceError(reason: string): Error {
  return new Error(`mission-evaluation: canonical source ${reason}`);
}

function requireBoundedText(
  value: unknown,
  field: string,
  maxLength: number,
): string {
  if (typeof value !== "string") throw sourceError(`has invalid ${field}`);
  const text = value.trim();
  if (!text || text.length > maxLength) {
    throw sourceError(`has invalid ${field}`);
  }
  return text;
}

function normalizeRubric(rubric: RawRubric): CanonicalMissionRubricCriterion[] {
  if (!Array.isArray(rubric) || rubric.length < 1 || rubric.length > 6) {
    throw sourceError("has invalid rubric");
  }

  const normalized = rubric.map((row) => {
    const label = requireBoundedText(row.label, "rubric label", 120);
    if (
      typeof row.weight !== "number" ||
      !Number.isFinite(row.weight) ||
      row.weight <= 0 ||
      row.weight > 100
    ) {
      throw sourceError("has invalid rubric weight");
    }
    if (
      !Array.isArray(row.criteria) ||
      row.criteria.length < 1 ||
      row.criteria.length > 8
    ) {
      throw sourceError("has invalid rubric criteria");
    }

    return {
      label,
      weight: row.weight,
      criteria: row.criteria.map((criterion: string) =>
        requireBoundedText(criterion, "rubric criterion", 400),
      ),
    };
  });

  const totalWeight = normalized.reduce((sum, row) => sum + row.weight, 0);
  if (totalWeight !== 100) {
    throw sourceError(`rubric weights total ${totalWeight}, expected 100`);
  }
  return normalized;
}

function findCurriculumLessonTitle(lessonId: string): string {
  for (const path of PATHS) {
    for (const module of path.modules) {
      const lesson = module.lessons.find((candidate) => candidate.id === lessonId);
      if (lesson) return lesson.title;
    }
  }
  return lessonId;
}

function selectUniqueMission<T extends { missionId: string }>(
  missions: readonly T[],
  missionId: string,
): T {
  const matches = missions.filter((mission) => mission.missionId === missionId);
  if (matches.length !== 1) {
    throw sourceError(
      matches.length === 0
        ? "does not contain the requested mission"
        : "contains an ambiguous mission id",
    );
  }
  return matches[0]!;
}

async function resolveEgyptianMission(
  lessonId: string,
  missionId: string,
): Promise<CanonicalMissionEvaluationSource> {
  if (!hasIntroLessonContent(lessonId)) {
    throw sourceError("does not contain the requested lesson");
  }
  const content = await loadIntroLessonContent(lessonId);
  if (!content) throw sourceError("could not load the requested lesson");

  const missions = content.flatMap((section) => {
    if (section.block.kind !== "mission") return [];
    const block = section.block;
    const resolvedLessonId = block.lessonId ?? lessonId;
    if (resolvedLessonId !== lessonId) {
      throw sourceError("lesson id does not match the submitted lesson");
    }
    if (!block.rubric?.length) return [];
    return [{
      missionId: block.missionId ?? packageMissionId(lessonId),
      prompt: block.prompt,
      rubric: block.rubric,
    }];
  });

  const mission = selectUniqueMission(missions, missionId);
  return {
    lessonId,
    missionId,
    lessonTitle: requireBoundedText(
      findCurriculumLessonTitle(lessonId),
      "lesson title",
      200,
    ),
    missionPrompt: requireBoundedText(mission.prompt, "mission prompt", 4000),
    rubric: normalizeRubric(mission.rubric),
  };
}

async function resolveLocalizedMission(
  locale: LessonPackageLocale,
  lessonId: string,
  missionId: string,
): Promise<CanonicalMissionEvaluationSource> {
  const pkg: LocalizedLessonPackage | null = await loadLocalePackageLesson(
    locale,
    lessonId,
  );
  if (!pkg || pkg.lessonId !== lessonId || pkg.locale !== locale) {
    throw sourceError("does not contain the requested localized lesson");
  }

  const mission = selectUniqueMission(
    adaptPackageMissionsFromSections(pkg.lessonId, pkg.sections),
    missionId,
  );
  return {
    lessonId,
    missionId,
    lessonTitle: requireBoundedText(pkg.title, "lesson title", 200),
    missionPrompt: requireBoundedText(mission.prompt, "mission prompt", 4000),
    rubric: normalizeRubric(mission.rubric),
  };
}

export async function resolveCanonicalMissionEvaluationSource(input: {
  locale: MissionEvaluationLocale;
  lessonId: string;
  missionId: string;
}): Promise<CanonicalMissionEvaluationSource> {
  const lessonId = requireBoundedText(input.lessonId, "lesson id", 200);
  const missionId = requireBoundedText(input.missionId, "mission id", 200);
  if (input.locale === "ar-EG") {
    return resolveEgyptianMission(lessonId, missionId);
  }
  if (
    input.locale === "ar-MSA" ||
    input.locale === "ar-Gulf" ||
    input.locale === "en"
  ) {
    return resolveLocalizedMission(input.locale, lessonId, missionId);
  }
  throw sourceError("uses an unsupported locale");
}
