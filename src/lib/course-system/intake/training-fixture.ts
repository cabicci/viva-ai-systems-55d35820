import { validateIntake } from "./package";
import { intakeFixture } from "./test-fixture";
/** Synthetic fixture; never a real course or upload binding. */
export function trainingFixture() {
  const p = validateIntake(intakeFixture());
  const practice = p.stations[0].steps[0].content.en!.sections[2];
  practice.id = "numeric-practice";
  practice.fields = [
    { id: "concentration", label: "Concentration", input: "number", minimum: 0 },
    { id: "mass", label: "Food mass", input: "number", minimum: 0 },
    { id: "body", label: "Body weight", input: "number", minimum: 0, exclusiveMinimum: true },
    { id: "answer", label: "Intake", input: "number", minimum: 0 },
    {
      id: "unit",
      label: "Answer unit",
      input: "choice",
      options: [
        { id: "intake-unit", label: "mg/kg body/day" },
        { id: "food-unit", label: "mg/kg food" },
      ],
    },
    {
      id: "identity",
      label: "Same substance?",
      input: "choice",
      options: [
        { id: "verified", label: "Checked" },
        { id: "unknown", label: "Unknown" },
      ],
    },
    { id: "reason", label: "Explain the limits" },
  ];
  practice.training = {
    outputs: [
      {
        field: "answer",
        expression: {
          op: "divide",
          args: [
            { op: "multiply", args: [{ field: "concentration" }, { field: "mass" }] },
            { field: "body" },
          ],
        },
        unitField: "unit",
        unitValue: "intake-unit",
      },
    ],
    prerequisites: [{ field: "identity", value: "verified" }],
    support: "Check mass and time denominators. This is educational arithmetic only.",
  };
  p.assessmentKeys[0].rubrics = [
    {
      sectionId: practice.id,
      fieldId: "reason",
      criterion: "SYNTHETIC_PRIVATE_REVIEW_CRITERION",
      critical: true,
    },
  ];
  return validateIntake(p);
}
