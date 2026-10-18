import { expect, it } from "vitest";
import { withoutMatchingStepPrefix } from "./example-step";
it.each([
  ["Step 1: Identify the gap. 30 - 20 = 10.", 1, "Identify the gap. 30 - 20 = 10."],
  [
    "**Step 2: Compare options.**\n\nKeep both explanations.",
    2,
    "**Compare options.**\n\nKeep both explanations.",
  ],
  ["**الخطوة ١: حساب النسبة.** 4 ÷ 40 × 100 = 10%.", 1, "**حساب النسبة.** 4 ÷ 40 × 100 = 10%."],
  ["2. Analyze benefits and harms.", 2, "Analyze benefits and harms."],
  ["٢) احسب النسبة.", 2, "احسب النسبة."],
] as const)("removes the matching prefix and keeps all explanation: %s", (text, step, expected) => {
  expect(withoutMatchingStepPrefix(text, step)).toBe(expected);
});
it.each([
  ["Step 2: A different source number.", 1],
  ["30 - 20 = 10.", 1],
  ["1.5 hours are required.", 1],
  ["1 order costs 40.", 1],
  ["**Calculate 4 / 40 = 10%.**", 1],
  ["Step 1:", 1],
  ["Step 10: Keep the heading.", 1],
] as const)("preserves quantities, calculations and unmatched prefixes: %s", (text, step) => {
  expect(withoutMatchingStepPrefix(text, step)).toBe(text);
});
