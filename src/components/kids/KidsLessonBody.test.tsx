import "@testing-library/jest-dom/vitest";
import { StrictMode, type ComponentProps } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KidsLessonBody } from "./KidsLessonBody";

const mock = vi.hoisted(() => ({ invoke: vi.fn(), functionsRead: undefined as (() => void) | undefined,
  invokeRead: undefined as (() => void) | undefined, receiver: {} as object }));
vi.mock("@/components/journey/JourneyVisitRecorder", () => ({ JourneyVisitRecorder: () => null }));
vi.mock("@/components/journey/KidsStepCompletion", () => ({ KidsStepCompletion: () => null }));
vi.mock("@/components/assistant/CourseLessonAssistant", () => ({ CourseLessonAssistant: () => null }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { get functions() { mock.functionsRead?.();
    const receiver = { get invoke() { mock.invokeRead?.(); return mock.invoke; } };
    mock.receiver = receiver; return receiver;
  } },
}));

const lesson = {
  locale: "en" as const,
  title: "A protected lesson",
  hints: [{ question: "What next?", source: "concept" }],
};
const citation = {
  product: "kids",
  levelId: "level-2",
  lessonNumber: 2,
  locale: "en",
  sourceId: "concept",
};
const embedUrl =
  "https://player.mediadelivery.net/embed/761387/123e4567-e89b-12d3-a456-426614174000?token=test-token&expires=9999999999";

const initialContext = { incarnation: {}, kind: "kids_profile" as const, isCurrent: () => true };
beforeEach(() => { mock.invoke.mockReset(); mock.functionsRead = mock.invokeRead = undefined; });
afterEach(() => cleanup());

describe("Kids authored hint integration", () => {
  it("uses hint-1 as a request ID, then verifies the returned source-scene citation", async () => {
    mock.invoke.mockResolvedValue({
      data: { question: "What next?", answer: "Read the concept.", citation },
      error: null,
    });
    render(
      <KidsLessonBody
        actionContext={initialContext}
        lesson={lesson}
        embedUrl={embedUrl}
        locale="en"
        levelId="level-2"
        lessonNumber={2}
        profileId="parent-profile"
      />,
    );
    expect(screen.getByTitle("Watch step: A protected lesson")).toHaveAttribute(
      "src",
      `${embedUrl}&autoplay=false`,
    );
    fireEvent.click(screen.getByRole("button", { name: "What next?" }));
    expect(await screen.findByText("Read the concept.")).toBeInTheDocument();
    expect(mock.invoke).toHaveBeenCalledWith("kids-lesson-help", {
      body: {
        profileId: "parent-profile",
        levelId: "level-2",
        lessonNumber: 2,
        locale: "en",
        hintId: "hint-1",
      },
    });
  });

  it("hides an answer whose source citation does not match the authored hint", async () => {
    mock.invoke.mockResolvedValue({
      data: {
        question: "What next?",
        answer: "Wrong source",
        citation: { ...citation, sourceId: "other" },
      },
      error: null,
    });
    render(
      <KidsLessonBody
        actionContext={initialContext}
        lesson={lesson}
        embedUrl={embedUrl}
        locale="en"
        levelId="level-2"
        lessonNumber={2}
        profileId="parent-profile"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "What next?" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Wrong source")).not.toBeInTheDocument();
  });
});

type BodyProps = ComponentProps<typeof KidsLessonBody>;
type Reply = { data: unknown; error: unknown };
function deferred<T = Reply>() {
  let resolve!: (value: T) => void, reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
async function settle(work: () => void = () => undefined) {
  await act(async () => { work(); for (let n = 0; n < 12; n += 1) await Promise.resolve(); });
}
function saved(element: Element, key: "onClick" | "onChange") {
  const propsKey = Object.keys(element).find((name) => name.startsWith("__reactProps$"));
  if (!propsKey) throw new Error("Missing actual React event props");
  return (element as unknown as Record<string, Record<string, () => void>>)[propsKey][key];
}
function bodyFixture() {
  let auth: object | null = {}, parent = true;
  const fixture = {
    props: {
      lesson: { ...lesson, quiz: [{ id: "q1", question: "Choose one", options: ["Alpha", "Beta"] }] },
      embedUrl, locale: "en", levelId: "level-2", lessonNumber: 2, profileId: "same-id",
      actionContext: undefined,
    } as unknown as BodyProps,
    rotateAuth: () => { auth = {}; }, logout: () => { auth = null; },
    retireParent: () => { parent = false; },
    next(kind: BodyProps["actionContext"]["kind"] = "kids_profile") {
      const incarnation = {}, capturedAuth = auth;
      fixture.props = { ...fixture.props, actionContext: {
        incarnation, kind, isCurrent: () => auth !== null && auth === capturedAuth && parent &&
          fixture.props.actionContext.incarnation === incarnation && fixture.props.actionContext.kind === kind,
      } };
    },
  };
  fixture.next(); return fixture;
}
function hintReply(answer = "Current hint"): Reply {
  return { data: { question: "What next?", answer, citation: { ...citation } }, error: null };
}
function quizReply(explanation = "Current explanation"): Reply {
  return { data: { correct: true, explanation, citation: { ...citation } }, error: null };
}
const hintButton = () => screen.getByRole("button", { name: "What next?" });
const quizButton = () => screen.getByRole("button", { name: "Check answer" });
function choose() { fireEvent.click(screen.getByRole("radio", { name: "Alpha" })); }
function start(channel: "hint" | "quiz") {
  if (channel === "quiz") { choose(); fireEvent.click(quizButton()); }
  else fireEvent.click(hintButton());
}

describe("Kids body action boundary", () => {
  it("B01 keeps current quiz payload, method receiver, correctness and autoplay", async () => {
    const f = bodyFixture(); mock.invoke.mockImplementation(function (this: object) {
      expect(this).toBe(mock.receiver); return Promise.resolve(quizReply());
    });
    render(<KidsLessonBody {...f.props} />); start("quiz");
    expect(await screen.findByText("Current explanation")).toBeInTheDocument();
    expect(mock.invoke).toHaveBeenCalledExactlyOnceWith("kids-lesson-content", { body: {
      profileId: "same-id", levelId: "level-2", lessonNumber: 2, locale: "en",
      action: "quiz-check", questionId: "q1", selectedIndex: 0,
    } });
    expect(screen.getByTitle("Watch step: A protected lesson")).toHaveAttribute("src", embedUrl + "&autoplay=false");
    expect(quizButton()).toBeEnabled();
  });
  it("B02 preserves independent concurrent hint and quiz state", async () => {
    const f = bodyFixture(), h = deferred(), q = deferred();
    mock.invoke.mockImplementation((name: string) => name === "kids-lesson-help" ? h.promise : q.promise);
    render(<KidsLessonBody {...f.props} />); start("hint"); start("quiz");
    expect(hintButton()).toBeDisabled(); expect(quizButton()).toBeDisabled();
    await settle(() => q.resolve(quizReply()));
    expect(screen.getByText("Current explanation")).toBeInTheDocument();
    expect(hintButton()).toBeDisabled(); expect(quizButton()).toBeEnabled();
    await settle(() => h.resolve(hintReply()));
    expect(screen.getByText("Current hint")).toBeInTheDocument();
    expect(screen.getByText("Current explanation")).toBeInTheDocument();
  });
  it.each(["rotateAuth", "logout", "retireParent", "next"] as const)(
    "B03 live %s denies saved clicks and radio changes before cleanup", async (operation) => {
      const f = bodyFixture(); const page = render(<KidsLessonBody {...f.props} />); choose();
      const h = saved(hintButton(), "onClick"), q = saved(quizButton(), "onClick");
      const radio = saved(screen.getByRole("radio", { name: "Beta" }), "onChange");
      f[operation](); act(() => { h(); q(); radio(); });
      expect(mock.invoke).not.toHaveBeenCalled();
      page.rerender(<KidsLessonBody {...f.props} />);
      if (operation !== "next") expect(screen.queryByTitle(/Watch lesson/)).not.toBeInTheDocument();
      else expect(screen.getByRole("radio", { name: "Alpha" })).not.toBeChecked();
      await settle();
    });
  it.each(["lesson", "locale", "context"] as const)(
    "B04 %s ABA and preview to child equal ID retire saved callbacks", async (changed) => {
      const f = bodyFixture(); f.next("administrator_preview");
      const page = render(<KidsLessonBody {...f.props} />); choose();
      const old = saved(quizButton(), "onClick"), oldHint = saved(hintButton(), "onClick");
      const original = f.props;
      f.next("kids_profile");
      if (changed === "lesson") f.props = { ...f.props, lesson: { ...f.props.lesson, title: "Other" } };
      if (changed === "locale") f.props = { ...f.props, locale: "ar-EG" };
      page.rerender(<KidsLessonBody {...f.props} />);
      f.props = { ...original, actionContext: f.props.actionContext }; page.rerender(<KidsLessonBody {...f.props} />);
      act(() => { old(); oldHint(); }); expect(mock.invoke).not.toHaveBeenCalled();
      mock.invoke.mockResolvedValue(hintReply()); start("hint");
      expect(await screen.findByText("Current hint")).toBeInTheDocument();
    });
  for (const channel of ["hint", "quiz"] as const) {
    it.each(["success", "error", "reject"] as const)(
      "B05 " + channel + " stale %s/finally cannot clear fresh busy or overwrite outcome", async (outcome) => {
        const f = bodyFixture(), old = deferred(), fresh = deferred();
        mock.invoke.mockReturnValueOnce(old.promise).mockReturnValueOnce(fresh.promise);
        const page = render(<KidsLessonBody {...f.props} />); start(channel); await settle();
        f.next(); page.rerender(<KidsLessonBody {...f.props} />); start(channel); await settle();
        await settle(() => { if (outcome === "reject") old.reject(new Error("secret stale failure"));
          else old.resolve(outcome === "error" ? { data: null, error: new Error("secret") } :
            channel === "hint" ? hintReply("Stale hint") : quizReply("Stale quiz")); });
        expect(channel === "hint" ? hintButton() : quizButton()).toBeDisabled();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(screen.queryByText(/Stale hint|Stale quiz|secret/)).not.toBeInTheDocument();
        await settle(() => fresh.resolve(channel === "hint" ? hintReply() : quizReply()));
        expect(screen.getByText(channel === "hint" ? "Current hint" : "Current explanation")).toBeInTheDocument();
      });
  }
  it("B06 choice replacement defeats earlier quiz and detached choice callbacks; fresh retry works", async () => {
    const f = bodyFixture(), old = deferred(); mock.invoke.mockReturnValueOnce(old.promise).mockResolvedValue(quizReply());
    render(<KidsLessonBody {...f.props} />); choose();
    const oldRadio = saved(screen.getByRole("radio", { name: "Alpha" }), "onChange");
    fireEvent.click(quizButton()); await settle();
    const pendingRadio = saved(screen.getByRole("radio", { name: "Beta" }), "onChange");
    act(() => pendingRadio()); act(() => oldRadio());
    expect(screen.getByRole("radio", { name: "Beta" })).toBeChecked();
    fireEvent.click(quizButton()); await settle();
    await settle(() => old.resolve(quizReply("Obsolete choice")));
    expect(screen.queryByText("Obsolete choice")).not.toBeInTheDocument();
    expect(screen.getByText("Current explanation")).toBeInTheDocument();
    expect(mock.invoke.mock.calls[1][1].body.selectedIndex).toBe(1);
  });
  it.each(["hint", "quiz"] as const)("B07 duplicate saved %s dispatches once and fresh current retry is allowed", async (channel) => {
    const f = bodyFixture(), pending = deferred(); mock.invoke.mockReturnValueOnce(pending.promise).mockResolvedValue(channel === "hint" ? hintReply() : quizReply());
    render(<KidsLessonBody {...f.props} />); if (channel === "quiz") choose();
    const callback = saved(channel === "hint" ? hintButton() : quizButton(), "onClick");
    act(() => { callback(); callback(); }); await settle(); expect(mock.invoke).toHaveBeenCalledTimes(1);
    await settle(() => pending.reject(new Error("private failure")));
    expect(screen.getByRole("alert")).toBeInTheDocument(); expect(screen.queryByText("private failure")).not.toBeInTheDocument();
    fireEvent.click(channel === "hint" ? hintButton() : quizButton()); await settle();
    expect(mock.invoke).toHaveBeenCalledTimes(2); expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("B08 harmless callback identity changes retain current selection and answer", async () => {
    const f = bodyFixture(); mock.invoke.mockResolvedValue(quizReply()); const page = render(<KidsLessonBody {...f.props} />);
    start("quiz"); await settle(); const context = f.props.actionContext;
    f.props = { ...f.props, actionContext: { ...context, isCurrent: () => context.isCurrent() } };
    page.rerender(<KidsLessonBody {...f.props} />);
    expect(screen.getByRole("radio", { name: "Alpha" })).toBeChecked(); expect(screen.getByText("Current explanation")).toBeInTheDocument();
  });
  it.each(["functions", "method", "invoke", "queued", "then"] as const)(
    "B09 %s retirement blocks lazy adoption without losing receiver", async (boundary) => {
      const f = bodyFixture(); let reads = 0, dispatches = 0;
      const lazy = { get then() { reads += 1; if (boundary === "then") f.rotateAuth();
        return function (this: unknown, yes: (value: Reply) => void) { expect(this).toBe(lazy); dispatches += 1; yes(hintReply()); };
      } };
      mock.invoke.mockImplementation(() => { if (boundary === "invoke") f.rotateAuth(); return lazy; });
      if (boundary === "functions") mock.functionsRead = f.rotateAuth;
      if (boundary === "method") mock.invokeRead = f.rotateAuth;
      const page = render(<KidsLessonBody {...f.props} />); fireEvent.click(hintButton());
      if (boundary === "queued") f.rotateAuth(); await settle();
      expect(dispatches).toBe(0); expect(reads).toBe(boundary === "then" ? 1 : 0);
      expect(mock.invoke).toHaveBeenCalledTimes(boundary === "functions" || boundary === "method" ? 0 : 1);
      page.rerender(<KidsLessonBody {...f.props} />); expect(screen.queryByText("Current hint")).not.toBeInTheDocument();
    });
  it("B10 current lazy method is called exactly once with its original receiver", async () => {
    const f = bodyFixture(); let dispatches = 0;
    const lazy = { then(this: unknown, yes: (value: Reply) => void) {
      expect(this).toBe(lazy); dispatches += 1; yes(hintReply()); return Promise.reject(new Error("ignored derived"));
    } };
    mock.invoke.mockReturnValue(lazy); render(<KidsLessonBody {...f.props} />); start("hint"); await settle();
    expect(dispatches).toBe(1); expect(screen.getByText("Current hint")).toBeInTheDocument();
  });
  it.each(["invoke", "unmount"] as const)("B11 eager rejection after %s is observed quietly", async (when) => {
    const f = bodyFixture(), pending = deferred();
    mock.invoke.mockImplementation(() => { if (when === "invoke") f.logout(); return pending.promise; });
    const page = render(<StrictMode><KidsLessonBody {...f.props} /></StrictMode>); start("hint");
    if (when === "unmount") page.unmount(); await settle(() => pending.reject(new Error("abandoned eager")));
    expect(screen.queryByText(/abandoned eager/)).not.toBeInTheDocument();
  });
  it("B12 synchronous SDK throw stays localized and retry succeeds", async () => {
    const f = bodyFixture(); mock.invoke.mockImplementationOnce(() => { throw new Error("private SDK"); }).mockResolvedValue(hintReply());
    render(<KidsLessonBody {...f.props} />); start("hint"); await settle(); expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("private SDK")).not.toBeInTheDocument(); fireEvent.click(hintButton()); await settle();
    expect(screen.getByText("Current hint")).toBeInTheDocument();
  });
  it.each(["error", "data", "answer", "citation", "sourceId", "explanation"] as const)(
    "B13 reentrant %s response access retires publication and render", async (field) => {
      const f = bodyFixture(), p = deferred(); mock.invoke.mockReturnValue(p.promise);
      const page = render(<KidsLessonBody {...f.props} />); start(field === "explanation" ? "quiz" : "hint"); await settle();
      const response = field === "explanation" ? quizReply() : hintReply();
      const data = response.data as Record<string, unknown>;
      const target = field === "error" || field === "data" ? response : field === "sourceId" ? data.citation as object : data;
      const value = (target as Record<string, unknown>)[field];
      Object.defineProperty(target, field, { get() { f.rotateAuth(); return value; } });
      await settle(() => p.resolve(response)); page.rerender(<KidsLessonBody {...f.props} />);
      expect(screen.queryByText(/Current hint|Current explanation/)).not.toBeInTheDocument(); expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  it("B14 authored getter retirement denies dispatch", async () => {
    const f = bodyFixture(); render(<KidsLessonBody {...f.props} />);
    const source = f.props.lesson.hints![0].source;
    Object.defineProperty(f.props.lesson.hints![0], "source", { configurable: true, get() { f.retireParent(); return source; } });
    start("hint"); await settle(); expect(mock.invoke).not.toHaveBeenCalled();
    Object.defineProperty(f.props.lesson.hints![0], "source", { configurable: true, value: source });
  });
  for (const channel of ["hint", "quiz"] as const) {
    it.each(["product", "levelId", "lessonNumber", "locale", ...(channel === "hint" ? ["sourceId", "question", "answer"] : ["correct"])])(
      "B15 " + channel + " rejects mismatched %s and accepts a fresh retry", async (field) => {
        const f = bodyFixture(), bad = channel === "hint" ? hintReply("Do not expose") : quizReply("Do not expose");
        const data = bad.data as Record<string, unknown>;
        if (["question", "answer", "correct"].includes(field)) data[field] = field === "answer" ? " " : "mismatch";
        else (data.citation as Record<string, unknown>)[field] = "mismatch";
        mock.invoke.mockResolvedValueOnce(bad).mockResolvedValue(channel === "hint" ? hintReply() : quizReply());
        render(<KidsLessonBody {...f.props} />); start(channel); await settle();
        expect(screen.getByRole("alert")).toBeInTheDocument(); expect(screen.queryByText("Do not expose")).not.toBeInTheDocument();
        fireEvent.click(channel === "hint" ? hintButton() : quizButton()); await settle();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(screen.getByText(channel === "hint" ? "Current hint" : "Current explanation")).toBeInTheDocument();
      });
  }
  it("B16 missing required context has no success fallback", () => {
    const f = bodyFixture(); const props = { ...f.props, actionContext: undefined } as unknown as BodyProps;
    render(<KidsLessonBody {...props} />); expect(screen.queryByTitle(/Watch lesson/)).not.toBeInTheDocument(); expect(mock.invoke).not.toHaveBeenCalled();
  });
});

describe("Kids body action boundary final controls", () => {
  it("B17 preserves current authored request, source citation and actual iframe label", async () => {
    const f = bodyFixture(); mock.invoke.mockResolvedValue(hintReply("Read the concept."));
    render(<KidsLessonBody {...f.props} />);
    expect(screen.getByTitle("Watch step: A protected lesson")).toHaveAttribute("src", `${embedUrl}&autoplay=false`);
    start("hint"); expect(await screen.findByText("Read the concept.")).toBeInTheDocument();
    expect(mock.invoke).toHaveBeenCalledExactlyOnceWith("kids-lesson-help", { body: {
      profileId: "same-id", levelId: "level-2", lessonNumber: 2, locale: "en", hintId: "hint-1",
    } });
  });
  it("B18 authored render getter retirement masks the completed protected view", async () => {
    const f = bodyFixture(); mock.invoke.mockResolvedValue(hintReply()); const page = render(<KidsLessonBody {...f.props} />);
    start("hint"); await settle(); expect(screen.getByText("Current hint")).toBeInTheDocument();
    Object.defineProperty(f.props.lesson, "subtitle", { get() { f.retireParent(); return "Retired static content"; } });
    page.rerender(<KidsLessonBody {...f.props} />);
    expect(screen.queryByText("Current hint")).not.toBeInTheDocument();
    expect(screen.queryByText("Retired static content")).not.toBeInTheDocument();
  });
});
