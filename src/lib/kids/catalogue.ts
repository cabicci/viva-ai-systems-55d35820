/**
 * Kids is a separate product. These are product decisions, not billing activation.
 * No Kids lesson may be added to adult PATHS or inferred from an adult entitlement.
 */
export const KIDS_LEVELS = [
  { id: "level-1", ages: "10–12", lessonCount: 12 },
  { id: "level-2", ages: "12–14", lessonCount: 12 },
  { id: "level-3", ages: "14–16", lessonCount: 12 },
] as const;

export const KIDS_FREE_LESSONS_PER_LEVEL = 2;
export const KIDS_BUNDLE_DISCOUNT_PERCENT = 10;

export type KidsLevelId = (typeof KIDS_LEVELS)[number]["id"];
export type AdultPaidTier = "pro" | "pro_plus";

/** An adult subscription never grants Kids access by itself. */
export function isKidsFreeLesson(level: KidsLevelId, lessonNumber: number): boolean {
  return (
    KIDS_LEVELS.some((entry) => entry.id === level) &&
    Number.isInteger(lessonNumber) &&
    lessonNumber >= 1 &&
    lessonNumber <= KIDS_FREE_LESSONS_PER_LEVEL
  );
}

/**
 * Calculates a combined invoice amount only after two independently priced
 * products are present. Never use this helper as an access check or a checkout.
 * The discount applies to the sum of the two subscription prices.
 */
export function bundleTotalMinor(
  adultTier: AdultPaidTier,
  adultPriceMinor: number,
  kidsPriceMinor: number,
): number {
  if (adultTier !== "pro" && adultTier !== "pro_plus") {
    throw new Error("Paid adult subscription required for the bundle");
  }
  if (
    !Number.isSafeInteger(adultPriceMinor) ||
    !Number.isSafeInteger(kidsPriceMinor) ||
    adultPriceMinor < 0 ||
    kidsPriceMinor < 0
  ) {
    throw new Error("Expected non-negative prices in minor currency units");
  }
  const combined = adultPriceMinor + kidsPriceMinor;
  if (!Number.isSafeInteger(combined)) throw new Error("Bundle price exceeds safe integer range");
  return Math.round((combined * (100 - KIDS_BUNDLE_DISCOUNT_PERCENT)) / 100);
}
