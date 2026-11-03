import type { IntakeSection } from "./package";

/** Educational arithmetic only. This never grades, completes an activity or writes a result. */
export function trainingNumber(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const s = value
    .trim()
    .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)))
    .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
    .replace(/[٫,]/g, ".");
  if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || (n === 0 && /[1-9]/.test(s.split(/e/i)[0]))) return null;
  return n;
}
export type TrainingCheck = "invalid" | "prerequisite" | "mismatch" | "correct";
export function checkTraining(
  section: IntakeSection,
  values: Record<string, unknown>,
): TrainingCheck {
  const rules = section.training;
  if (!rules || section.kind !== "practice" || section.completion !== "review") return "invalid";
  const numbers = new Map<string, number>();
  for (const f of section.fields.filter((f) => f.input === "number")) {
    const n = trainingNumber(values[f.id]);
    if (
      n === null ||
      (f.minimum !== undefined && (f.exclusiveMinimum ? n <= f.minimum : n < f.minimum))
    )
      return "invalid";
    numbers.set(f.id, n);
  }
  if (rules.prerequisites.some((r) => values[r.field] !== r.value)) return "prerequisite";
  type Expression = (typeof rules.outputs)[number]["expression"];
  let nodes = 0;
  const calculate = (e: Expression, depth = 0): number => {
    if (++nodes > 200 || depth > 8) throw new Error("TRAINING_SCOPE");
    if (typeof e === "number") return e;
    if ("choice" in e) {
      const factor = e.factors.find((f) => f.value === values[e.choice])?.factor;
      if (factor === undefined || !Number.isFinite(factor) || factor <= 0)
        throw new Error("TRAINING_UNIT");
      return factor;
    }
    if ("field" in e) {
      const n = numbers.get(e.field);
      if (n === undefined) throw new Error("TRAINING_FIELD");
      return n;
    }
    const args = e.args.map((x) => calculate(x, depth + 1));
    let result: number;
    if (e.op === "add") result = args.reduce((a, b) => a + b, 0);
    else if (e.op === "multiply") result = args.reduce((a, b) => a * b, 1);
    else if (e.op === "divide" && args.length === 2 && args[1] !== 0) result = args[0] / args[1];
    else throw new Error("TRAINING_OPERATION");
    if (
      !Number.isFinite(result) ||
      (result === 0 &&
        ((e.op === "multiply" && args.every((x) => x !== 0)) ||
          (e.op === "divide" && args[0] !== 0)))
    )
      throw new Error("TRAINING_NUMBER");
    return result;
  };
  try {
    let matches = true;
    for (const o of rules.outputs) {
      const expected = calculate(o.expression),
        answer = numbers.get(o.field);
      if (
        answer === undefined ||
        (expected === 0 ? answer !== 0 : Math.abs(answer - expected) > Math.abs(expected) * 1e-8) ||
        (o.unitField && values[o.unitField] !== o.unitValue)
      )
        matches = false;
    }
    return matches ? "correct" : "mismatch";
  } catch {
    return "invalid";
  }
}
