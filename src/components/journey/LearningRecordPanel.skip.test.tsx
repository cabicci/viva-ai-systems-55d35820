import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getUiString } from "@/lib/locale/ui-strings";
import { learningCopy } from "@/lib/learning/copy";
const fixture = vi.hoisted(() => ({
  locale: "en",
  evidence: {} as Record<string, unknown>,
  command: vi.fn(),
  reports: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: "synthetic-owner" },
    loading: false,
    authGeneration: 1,
    isAuthGenerationCurrent: () => true,
  }),
}));
vi.mock("@/lib/locale/locale-context", () => ({ useLocale: () => ({ locale: fixture.locale }) }));
vi.mock("@/lib/kids/parent-state", () => ({ useKidsParentStateSource: () => ({ profiles: [] }) }));
vi.mock("@/lib/learning-lines", () => ({ getLineCopy: () => ({ ai: "Training", kids: "Child" }) }));
vi.mock("@/lib/locale-curriculum/resolve-curriculum-label", () => ({
  getCurriculumLessonLabel: () => "Synthetic lesson",
}));
vi.mock("@/lib/learning/client", () => ({
  learningCommand: fixture.command,
  learningReports: fixture.reports,
}));
vi.mock("@/lib/learning/reports.functions", () => ({ createLearningReport: vi.fn() }));
import { LearningRecordPanel } from "./LearningRecordPanel";
const clients: QueryClient[] = [];
beforeEach(() => {
  vi.clearAllMocks();
  fixture.locale = "en";
  fixture.evidence = {};
  fixture.reports.mockResolvedValue({ sources: [], reports: [] });
  fixture.command.mockImplementation(async (operation: string) =>
    operation === "records"
      ? [{ id: "r", subject_id: "s", area: "ai", title: "Synthetic course" }]
      : {
          events: [
            {
              id: "e",
              kind: "mission",
              origin: "mission_submissions",
              lesson: "l",
              recorded_at: "2026-11-01T00:00:00Z",
              content_version: "v1",
              evidence: fixture.evidence,
            },
          ],
          notes: [],
          enrollments: [],
          hasMore: false,
        },
  );
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((c) => c.clear());
});
function mount() {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  clients.push(c);
  render(
    <QueryClientProvider client={c}>
      <LearningRecordPanel />
    </QueryClientProvider>,
  );
}
it.each(["en", "ar-EG", "ar-MSA", "ar-Gulf"] as const)(
  "renders legacy and current skip as ungraded in %s",
  async (locale) => {
    fixture.locale = locale;
    fixture.evidence = {
      submission_metadata: { skipped: true },
      status: "passed",
      score: 0,
      submission_text: "Old answer must not be presented as a skipped submission",
    };
    mount();
    const message = await screen.findByText(getUiString(locale, "mission.skipped.message"));
    const event = within(message.closest("li")!);
    expect(event.queryByText(new RegExp(learningCopy(locale).grade + ":"))).toBeNull();
    expect(event.queryByText(/Old answer/)).toBeNull();
    expect(event.queryByText(learningCopy(locale).submission)).toBeNull();
  },
);
it("keeps a real graded answer visible", async () => {
  fixture.evidence = {
    submission_metadata: { skipped: false },
    score: 83,
    submission_text: "Actual independently graded answer",
  };
  mount();
  expect(await screen.findByText("Actual independently graded answer")).toBeInTheDocument();
  expect(screen.getByText(new RegExp(learningCopy("en").grade + ": 83"))).toBeVisible();
  expect(screen.queryByText(getUiString("en", "mission.skipped.message"))).toBeNull();
});
