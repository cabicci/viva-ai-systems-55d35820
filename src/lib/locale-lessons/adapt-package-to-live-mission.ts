import type { MissionRubric } from "@/components/intro/MissionRubricSubmit";
import type {
  LocalizedLessonMission,
  LocalizedLessonRubricRow,
  LocalizedLessonSection,
} from "./types";

const DELIVERY_SECTION_PATTERNS = [
  /\*\*(?:Delivery|Submission|Deliverable|التسليم)(?:[^*]*)?:?\*\*:?\s*/i,
  /^(?:Delivery|Submission|Deliverable|التسليم)(?:[^:]*):?\s*/im,
];

const EVALUATION_SECTION_PATTERNS = [
  /\*\*(?:Evaluation Criteria|معايير التقييم)\*\*/i,
  /^(?:Evaluation Criteria|معايير التقييم)/im,
];

export class InvalidPackageMissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPackageMissionError";
  }
}

export type LiveMissionShape = {
  missionId: string;
  intro: string;
  prompt: string;
  delivery: readonly string[];
  rubric: MissionRubric;
};

/** Stable deterministic id for package mission attempts and learner events. */
export function packageMissionId(
  lessonId: string,
  missionIndex = 0,
): string {
  return missionIndex === 0
    ? `${lessonId}::mission`
    : `${lessonId}::mission::${missionIndex}`;
}

/** Derive delivery lines from same-section markdown only (no cross-locale fallback). */
export function deriveDeliveryFromContentMarkdown(
  contentMarkdown: string,
): string[] {
  const numbered = extractNumberedDeliveryLines(contentMarkdown);
  if (numbered.length > 0) return numbered;

  const inlineBlock = extractInlineSubmissionBlock(contentMarkdown);
  if (inlineBlock) return [inlineBlock];

  return [];
}

function extractNumberedDeliveryLines(contentMarkdown: string): string[] {
  const lines: string[] = [];
  let inDelivery = false;

  for (const line of contentMarkdown.split("\n")) {
    const trimmed = line.trim();
    if (!inDelivery) {
      if (DELIVERY_SECTION_PATTERNS.some((re) => re.test(trimmed))) {
        inDelivery = true;
        const remainder = stripDeliveryHeader(trimmed);
        if (remainder) lines.push(remainder);
      } else {
        continue;
      }
    } else if (EVALUATION_SECTION_PATTERNS.some((re) => re.test(trimmed))) {
      break;
    } else if (!trimmed || trimmed.startsWith("|")) {
      continue;
    } else {
      const numbered = trimmed.match(/^\d+\.\s+(.+)$/);
      if (numbered?.[1]) {
        lines.push(numbered[1].trim());
        continue;
      }
      if (trimmed.startsWith("- ")) {
        lines.push(trimmed.slice(2).trim());
      }
    }
  }

  return lines.filter((line) => line.length > 0);
}

function stripDeliveryHeader(line: string): string {
  for (const pattern of DELIVERY_SECTION_PATTERNS) {
    const next = line.replace(pattern, "").trim();
    if (next !== line.trim()) return next;
  }
  return "";
}

function extractInlineSubmissionBlock(contentMarkdown: string): string | null {
  const blockLines: string[] = [];
  let inDelivery = false;

  for (const line of contentMarkdown.split("\n")) {
    const trimmed = line.trim();
    if (!inDelivery) {
      if (DELIVERY_SECTION_PATTERNS.some((re) => re.test(trimmed))) {
        inDelivery = true;
        const remainder = stripDeliveryHeader(trimmed);
        if (remainder) blockLines.push(remainder);
      }
      continue;
    }
    if (EVALUATION_SECTION_PATTERNS.some((re) => re.test(trimmed))) break;
    if (!trimmed || trimmed.startsWith("|")) continue;
    blockLines.push(trimmed);
  }

  const block = blockLines.join("\n").trim();
  return block.length > 0 ? block : null;
}

/** Join delivery lines into the learner prompt without rewriting text. */
export function deliveryToPrompt(delivery: readonly string[]): string {
  if (delivery.length === 0) return "";
  return delivery.join("\n\n");
}

function normalizeCriteria(criteria: string): string[] {
  const trimmed = criteria.trim();
  if (!trimmed) return [];
  return [criteria];
}

function normalizeRubricRow(
  row: LocalizedLessonRubricRow,
  lessonId: string,
  missionIndex: number,
  rowIndex: number,
): MissionRubric[number] {
  const label = row.dimension?.trim() ?? "";
  if (!label) {
    throw new InvalidPackageMissionError(
      `${lessonId} mission ${missionIndex} rubric[${rowIndex}]: missing dimension label`,
    );
  }

  const criteria = normalizeCriteria(row.criteria ?? "");
  if (criteria.length === 0) {
    throw new InvalidPackageMissionError(
      `${lessonId} mission ${missionIndex} rubric[${rowIndex}]: empty criteria`,
    );
  }

  const weight = row.weight;
  if (
    typeof weight !== "number" ||
    !Number.isFinite(weight) ||
    weight <= 0
  ) {
    throw new InvalidPackageMissionError(
      `${lessonId} mission ${missionIndex} rubric[${rowIndex}]: invalid weight ${String(weight)}`,
    );
  }

  return { label, weight, criteria };
}

function resolveDelivery(
  mission: LocalizedLessonMission,
  contentMarkdown: string,
): string[] {
  const explicit = mission.delivery ?? [];
  if (explicit.length > 0) {
    return [...explicit];
  }
  return deriveDeliveryFromContentMarkdown(contentMarkdown);
}

export function adaptPackageMissionToLiveShape(
  lessonId: string,
  section: LocalizedLessonSection,
  missionIndex = 0,
): LiveMissionShape {
  const mission = section.mission;
  if (!mission) {
    throw new InvalidPackageMissionError(
      `${lessonId} mission ${missionIndex}: section has no mission`,
    );
  }

  const intro = mission.intro?.trim() ?? "";
  if (!intro) {
    throw new InvalidPackageMissionError(
      `${lessonId} mission ${missionIndex}: missing intro`,
    );
  }

  const delivery = resolveDelivery(mission, section.contentMarkdown);
  const prompt = deliveryToPrompt(delivery);
  if (!prompt.trim()) {
    throw new InvalidPackageMissionError(
      `${lessonId} mission ${missionIndex}: unusable prompt`,
    );
  }

  const rubricRows = mission.rubric ?? [];
  if (rubricRows.length === 0) {
    throw new InvalidPackageMissionError(
      `${lessonId} mission ${missionIndex}: empty rubric`,
    );
  }

  const rubric = rubricRows.map((row, rowIndex) =>
    normalizeRubricRow(row, lessonId, missionIndex, rowIndex),
  );

  const totalWeight = rubric.reduce((sum, row) => sum + row.weight, 0);
  if (totalWeight !== 100) {
    throw new InvalidPackageMissionError(
      `${lessonId} mission ${missionIndex}: rubric weights total ${totalWeight}, expected 100`,
    );
  }

  return {
    missionId: packageMissionId(lessonId, missionIndex),
    intro,
    prompt,
    delivery,
    rubric,
  };
}

export function adaptPackageMissionsFromSections(
  lessonId: string,
  sections: ReadonlyArray<LocalizedLessonSection>,
): LiveMissionShape[] {
  const items: LiveMissionShape[] = [];
  let missionIndex = 0;
  for (const section of sections) {
    if (!section.mission) continue;
    items.push(adaptPackageMissionToLiveShape(lessonId, section, missionIndex));
    missionIndex += 1;
  }
  return items;
}
