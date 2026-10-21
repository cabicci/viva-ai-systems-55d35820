import { KIDS_LEVELS, KIDS_FREE_LESSONS_PER_LEVEL } from "@/lib/kids/catalogue";
import technicalCatalogue from "@/lib/technical-education/catalog.json";
import { assertPlatformOwnedCourse, normalizeCourse } from "@/lib/course-system/contract";
export type SourceLocator = { adapter: "kids"; levelId: string; lessonNumber: number }
  | { adapter: "technical"; lessonId: string };
export type RegisteredStep = { id: string; stationId: string; preview: boolean; source: SourceLocator };
export type RegisteredCard = { area: "kids" | "technical"; id: string; steps: RegisteredStep[] };

export function sourceIdentity(source: SourceLocator): string {
  return source.adapter === "kids" ? `kids:${source.levelId}:${source.lessonNumber}` : `technical:${source.lessonId}`;
}
/** One source has one card owner. A future card cannot reuse bare legacy IDs. */
export function validateCardRegistry(cards: RegisteredCard[]): RegisteredCard[] {
  const cardIds = new Set<string>();
  const sources = new Set<string>();
  for (const card of cards) {
    assertPlatformOwnedCourse(card, `${card.area}:${card.id}`);
    const key = `${card.area}:${card.id}`;
    if (!["kids", "technical"].includes(card.area) || !/^[a-z0-9-]{1,80}$/.test(card.id) || cardIds.has(key) || !card.steps.length) throw new Error("CARD_REGISTRY_COLLISION");
    cardIds.add(key);
    const steps = new Set<string>();
    for (const step of card.steps) {
      const source = sourceIdentity(step.source);
      if (!/^[a-zA-Z0-9-]{1,80}$/.test(step.id) || !/^[a-zA-Z0-9-]{1,80}$/.test(step.stationId) ||
        typeof step.preview !== "boolean" || steps.has(step.id) || sources.has(source) || step.source.adapter !== card.area)
        throw new Error("CARD_REGISTRY_COLLISION");
      if (step.source.adapter === "kids") {
        const locator = step.source;
        const sourceLevel = KIDS_LEVELS.find(level => level.id === locator.levelId);
        if (!sourceLevel || !Number.isInteger(step.source.lessonNumber) || step.source.lessonNumber < 1 || step.source.lessonNumber > sourceLevel.lessonCount)
          throw new Error("CARD_SOURCE_UNSUPPORTED");
      }
      if (step.source.adapter === "technical" && !/^M\d{2}-L\d{2}$/.test(step.source.lessonId)) throw new Error("CARD_SOURCE_UNSUPPORTED");
      steps.add(step.id); sources.add(source);
    }
    if (!card.steps.some(step => !step.preview)) throw new Error("CARD_PAID_SCOPE_REQUIRED");
    normalizeCourse({ area: card.area, id: card.id, stations: [...new Set(card.steps.map(step => step.stationId))]
      .map(stationId => ({ id: stationId, steps: card.steps.filter(step => step.stationId === stationId).map(step => ({ id: step.id })) })) });
  }
  return cards;
}
export const CARD_REGISTRY = validateCardRegistry([
  ...KIDS_LEVELS.map(level => ({ area: "kids" as const, id: level.id,
    steps: Array.from({ length: level.lessonCount }, (_, i) => ({ id: String(i + 1), stationId: level.id,
      preview: i < KIDS_FREE_LESSONS_PER_LEVEL, source: { adapter: "kids" as const, levelId: level.id, lessonNumber: i + 1 } })) })),
  { area: "technical", id: "furniture", steps: technicalCatalogue.lessons.map(lesson => ({ id: lesson.id,
    stationId: lesson.moduleId, preview: lesson.id === "M01-L01", source: { adapter: "technical", lessonId: lesson.id } })) },
]);
export function registeredCard(area: string, cardId: string): RegisteredCard {
  const card = CARD_REGISTRY.find(item => item.area === area && item.id === cardId);
  if (!card) throw new Error("CARD_SCOPE_INVALID");
  return card;
}
export function registeredStep(area: string, cardId: string, stepId: string): RegisteredStep {
  const step = registeredCard(area, cardId).steps.find(item => item.id === stepId);
  if (!step) throw new Error("CARD_SCOPE_INVALID");
  return step;
}
export function sourceOwner(source: SourceLocator): RegisteredCard {
  const id = sourceIdentity(source);
  const cards = CARD_REGISTRY.filter(card => card.steps.some(step => sourceIdentity(step.source) === id));
  if (cards.length !== 1) throw new Error("CARD_SCOPE_INVALID");
  return cards[0];
}
