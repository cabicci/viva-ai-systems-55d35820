export function intakeFixture() {
  return {
    schemaVersion: "masaarat-intake-v1",
    area: "technical",
    id: "fixture-course",
    title: { en: "Course" },
    locales: ["en"],
    source: { reference: "reviewed source", sha256: "a".repeat(64) },
    notesEnabled: true,
    stations: [
      {
        id: "station-one",
        title: { en: "Station" },
        steps: [
          {
            id: "step-one",
            title: { en: "Step" },
            content: {
              en: {
                assets: [],
                sections: [
                  {
                    id: "intro",
                    kind: "explanation",
                    title: "Read",
                    paragraphs: ["Grounded instruction"],
                    required: true,
                    completion: "read",
                  },
                  {
                    id: "quiz",
                    kind: "questions",
                    title: "Check",
                    questions: [{ id: "q-one", prompt: "Question?", options: ["A", "B"] }],
                    required: true,
                    completion: "pass",
                    passPercent: 75,
                  },
                  {
                    id: "task",
                    kind: "practice",
                    title: "Practice",
                    paragraphs: ["Perform the reviewed task"],
                    fields: [{ id: "response", label: "Evidence" }],
                    required: true,
                    completion: "review",
                  },
                ],
              },
            },
          },
        ],
      },
    ],
    assessmentKeys: [
      { lessonId: "step-one", locale: "en", keys: [{ questionId: "q-one", correctIndex: 1 }] },
    ],
  };
}
