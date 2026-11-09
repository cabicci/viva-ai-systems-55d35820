import * as React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MissionSubmission } from "@/lib/mission-evaluation";

const mocks = vi.hoisted(() => ({
  user: { id: "user-1" } as { id: string } | null,
  locale: "en",
  active: vi.fn(),
  evaluated: vi.fn(),
  skipped: vi.fn(),
  prepare: vi.fn(),
  submit: vi.fn(),
  evaluate: vi.fn(),
  reveal: vi.fn(),
  skip: vi.fn(),
  emit: vi.fn(),
  log: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("lucide-react", () =>
  Object.fromEntries(
    [
      "CheckCircle2",
      "ChevronDown",
      "ChevronUp",
      "ListChecks",
      "Loader2",
      "Lightbulb",
      "HelpCircle",
      "Send",
      "ClipboardCheck",
      "FileText",
      "SkipForward",
    ].map((name) => [name, () => null]),
  ),
);
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock("@/lib/locale/locale-context", () => ({
  useLocale: () => ({
    locale: mocks.locale,
    dir: mocks.locale === "en" ? "ltr" : "rtl",
  }),
}));
vi.mock("@/lib/mission-evaluation", () => ({
  getActiveSubmissionForMission: mocks.active,
  getLatestEvaluatedSubmissionForMission: mocks.evaluated,
  getSkippedSubmissionForMission: mocks.skipped,
  prepareSubmissionForAttempt: mocks.prepare,
  submitForEvaluation: mocks.submit,
}));
vi.mock("@/lib/mission-ai-evaluation.functions", () => ({
  evaluateMissionWithAI: mocks.evaluate,
  revealModelMissionAnswer: mocks.reveal,
}));
vi.mock("@/lib/mission-skip.functions", () => ({ skipMissionServer: mocks.skip }));
vi.mock("@/lib/mission-gate", () => ({ emitMissionPassed: mocks.emit }));
vi.mock("@/lib/learner-events", () => ({ logLearnerEvent: mocks.log }));
vi.mock("sonner", () => ({ toast: { success: mocks.success, error: mocks.error } }));

import { MissionRubricSection } from "@/components/intro/MissionRubricSubmit";

let sequence = 0;
const result = {
  overallScore: 90,
  passed: true,
  perCriterion: [{ label: "Evidence", score: 90, feedback: "Saved criterion feedback" }],
  summary: "The saved summary.",
  nextStep: "The saved next step.",
  socraticQuestion: "The saved question?",
};
function row(patch: Partial<MissionSubmission> = {}): MissionSubmission {
  return {
    id: "saved-evaluation",
    user_id: mocks.user!.id,
    mission_id: "shared-mission",
    lesson_id: "lesson-a",
    submission_text: "A previously successful answer with supporting evidence.",
    submission_url: null,
    submission_metadata: {
      perCriterion: result.perCriterion,
      nextStep: result.nextStep,
      socraticQuestion: result.socraticQuestion,
      evaluationVersion: "recorded-version",
    },
    status: "passed",
    feedback: result.summary,
    score: 90,
    attempt_count: 2,
    submitted_at: "2026-10-10T10:00:00Z",
    evaluated_at: "2026-10-10T10:01:00Z",
    created_at: "2026-10-10T10:00:00Z",
    updated_at: "2026-10-10T10:01:00Z",
    ...patch,
  };
}
function mission(lessonId = "lesson-a", missionId = "shared-mission") {
  return (
    <MissionRubricSection
      rubric={[{ label: "Evidence", weight: 100, criteria: ["Show the evidence"] }]}
      lessonId={lessonId}
      missionId={missionId}
      lessonTitle="Independent training fixture"
      missionPrompt="Explain your reasoning using the supplied teaching data."
    />
  );
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => {
    resolve = yes;
  });
  return { promise, resolve };
}
async function answerField() {
  const field = await screen.findByRole("textbox");
  expect(field).not.toHaveAttribute("readonly");
  return field;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.user = { id: "fixture-user-" + ++sequence };
  mocks.locale = "en";
  window.sessionStorage.clear();
  mocks.active.mockResolvedValue(null);
  mocks.evaluated.mockResolvedValue(null);
  mocks.skipped.mockResolvedValue(null);
  mocks.log.mockResolvedValue(undefined);
  mocks.prepare.mockResolvedValue({ id: "new-submission" });
  mocks.submit.mockResolvedValue({ attempt_count: 1 });
  mocks.evaluate.mockResolvedValue(result);
  mocks.skip.mockResolvedValue({id:"marker",outcome:"skipped"});
});
afterEach(cleanup);


import {getUiString} from "@/lib/locale/ui-strings";
const marker=()=>({id:"marker",user_id:mocks.user!.id,mission_id:"shared-mission",lesson_id:"lesson-a"});
it.each(["en","ar-EG","ar-MSA","ar-Gulf"] as const)("restores a durable skip in %s and lets learner retry without deleting marker",async locale=>{
 mocks.locale=locale;mocks.skipped.mockResolvedValue(marker());render(mission());
 expect(await screen.findByText(getUiString(locale,"mission.skipped.message"))).toBeVisible();
 expect(mocks.submit).not.toHaveBeenCalled();expect(mocks.evaluate).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole("button",{name:getUiString(locale,"mission.skip.retry")}));
 expect(await answerField()).toHaveValue("");expect(mocks.skip).not.toHaveBeenCalled();
});
it("restores skip even when an unsent local draft exists and preserves that draft for retry",async()=>{
 const v=render(mission());fireEvent.change(await answerField(),{target:{value:"Unsent work that must survive skip"}});v.unmount();
 mocks.skipped.mockResolvedValue(marker());render(mission());await screen.findByText(getUiString("en","mission.skipped.message"));
 fireEvent.click(screen.getByRole("button",{name:"Try the mission again"}));expect(await answerField()).toHaveValue("Unsent work that must survive skip");
});
it("real passed evaluation outranks a skip marker on reload",async()=>{
 mocks.skipped.mockResolvedValue(marker());mocks.evaluated.mockResolvedValue(row());render(mission());
 expect(await screen.findByDisplayValue(row().submission_text!)).toHaveAttribute("readonly");expect(screen.queryByText(getUiString("en","mission.skipped.message"))).toBeNull();expect(screen.getByText(result.summary)).toBeVisible();
});
it("skip failure does not claim continuation or discard the editable answer",async()=>{
 mocks.skip.mockRejectedValue(new Error("write failed"));render(mission());fireEvent.change(await answerField(),{target:{value:"Original work retained after failed skip"}});
 fireEvent.click(screen.getByRole("button",{name:getUiString("en","mission.skip.cta")}));await waitFor(()=>expect(mocks.error).toHaveBeenCalled());expect(await answerField()).toHaveValue("Original work retained after failed skip");expect(mocks.emit).not.toHaveBeenCalled();
});
it("already-passed RPC result restores grade without logging a skip",async()=>{
 mocks.skip.mockImplementation(async()=>{mocks.evaluated.mockResolvedValue(row());return {id:"saved-evaluation",outcome:"already-passed"};});render(mission());await answerField();
 fireEvent.click(screen.getByRole("button",{name:getUiString("en","mission.skip.cta")}));expect(await screen.findByDisplayValue(row().submission_text!)).toHaveAttribute("readonly");expect(mocks.log).not.toHaveBeenCalled();expect(screen.queryByText(getUiString("en","mission.skipped.message"))).toBeNull();
});
it("two immediate skip clicks dispatch one RPC and pending skip blocks submit",async()=>{
 const pending=deferred<{id:string;outcome:"skipped"}>();mocks.skip.mockReturnValue(pending.promise);render(mission());fireEvent.change(await answerField(),{target:{value:"A sufficiently long answer before skip"}});
 const skip=screen.getByRole("button",{name:getUiString("en","mission.skip.cta")});fireEvent.click(skip);fireEvent.click(skip);fireEvent.click(screen.getByRole("button",{name:/Submit and get feedback/i}));expect(mocks.skip).toHaveBeenCalledTimes(1);expect(mocks.prepare).not.toHaveBeenCalled();
 await act(async()=>pending.resolve({id:"marker",outcome:"skipped"}));expect(await screen.findByText(getUiString("en","mission.skipped.message"))).toBeVisible();
});
it("skip read failure is retryable and does not render a false empty form",async()=>{mocks.skipped.mockRejectedValueOnce(new Error("unavailable"));render(mission());expect(await screen.findByRole("alert")).toBeVisible();expect(screen.queryByRole("textbox")).toBeNull();fireEvent.click(screen.getByRole("button",{name:"Try again"}));expect(await answerField()).toHaveValue("");});
it("late skip completion after departure cannot affect another lesson",async()=>{
 const pending=deferred<{id:string;outcome:"skipped"}>();mocks.skip.mockReturnValue(pending.promise);const v=render(mission());await answerField();fireEvent.click(screen.getByRole("button",{name:getUiString("en","mission.skip.cta")}));v.rerender(mission("lesson-b"));await answerField();
 await act(async()=>pending.resolve({id:"marker",outcome:"skipped"}));expect(screen.queryByText(getUiString("en","mission.skipped.message"))).toBeNull();expect(mocks.emit).not.toHaveBeenCalled();
});
