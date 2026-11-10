import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LocaleProvider } from "@/lib/locale/locale-context";
import { getUiString } from "@/lib/locale/ui-strings";
import type { SupportedLocale } from "@/lib/locale/types";
import type { LocalizedLessonPackage } from "@/lib/locale-lessons/types";
import { LocalePackageLessonRenderer } from "./LocalePackageLessonRenderer";
const state = vi.hoisted(() => ({
  load: vi.fn(),
  has: vi.fn(),
  user: "learner-a",
  generation: { value: 1 },
}));
vi.mock("@/components/intro/lessons", () => ({
  hasIntroLessonContent: state.has,
  loadIntroLessonContent: state.load,
}));
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: state.user },
    authGeneration: state.generation,
    isAuthGenerationCurrent: (generation: object) => generation === state.generation,
  }),
}));
vi.mock("@/components/intro/IntroLessonRenderer", () => ({
  IntroLessonRenderer: (props: { lessonId: string; lessonTitle: string }) => (
    <section data-testid="rendered" data-lesson={props.lessonId}>
      {props.lessonTitle}
    </section>
  ),
}));
function pending() {
  let resolve!: (value: unknown) => void, reject!: (reason: Error) => void;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function pkg(
  id = "synthetic-a",
  locale: LocalizedLessonPackage["locale"] = "en",
): LocalizedLessonPackage {
  return {
    lessonId: id,
    locale,
    title: `Title ${id}`,
    canonicalVersion: "synthetic",
    sourceFile: "synthetic",
    generatedAt: "synthetic",
    sections: [
      {
        role: "orientation",
        heading: "Synthetic heading",
        contentMarkdown: "Synthetic explanation",
        bullets: [],
        tables: [],
      },
    ],
  };
}
function view(value: LocalizedLessonPackage, locale: SupportedLocale = "en") {
  return (
    <LocaleProvider initialLocale={locale} effectiveLocale={locale}>
      <LocalePackageLessonRenderer pkg={value} />
    </LocaleProvider>
  );
}
beforeEach(() => {
  state.load.mockReset();
  state.has.mockReset().mockReturnValue(true);
  state.user = "learner-a";
  state.generation = { value: 1 };
});
afterEach(cleanup);
it.each(["en", "ar-EG", "ar-MSA", "ar-Gulf"] as const)(
  "renders localized failure and a genuine retry in %s",
  async (locale) => {
    const first = pending(),
      retry = pending();
    state.load.mockReturnValueOnce(first.promise).mockReturnValueOnce(retry.promise);
    render(view(pkg(), locale));
    await act(async () => first.reject(new Error("synthetic missing chunk URL must stay private")));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      getUiString(locale, "learn.error.load"),
    );
    expect(screen.queryByText(/synthetic missing chunk URL/)).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: getUiString(locale, "learn.content.retry") }),
    );
    expect(screen.queryByRole("alert")).toBeNull();
    await waitFor(() => expect(state.load).toHaveBeenCalledTimes(2));
    expect(screen.getByRole("status")).toHaveTextContent(
      getUiString(locale, "learn.content.loading"),
    );
    await act(async () => retry.resolve([]));
    expect(await screen.findByTestId("rendered")).toHaveAttribute("data-lesson", "synthetic-a");
  },
);
it("uses a package with no canonical registry entry without claiming an import failed", async () => {
  state.has.mockReturnValue(false);
  render(view(pkg()));
  expect(await screen.findByTestId("rendered")).toBeVisible();
  expect(state.load).not.toHaveBeenCalled();
  expect(screen.queryByRole("alert")).toBeNull();
});
it.each(["lesson", "account", "session"])(
  "ignores reversed completion after changing %s",
  async (change) => {
    const first = pending(),
      next = pending();
    state.load.mockReturnValueOnce(first.promise).mockReturnValueOnce(next.promise);
    let value = pkg();
    const page = render(view(value));
    await act(async () => {});
    if (change === "lesson") value = pkg("synthetic-b");
    if (change === "account") {
      state.user = "learner-b";
      state.generation = { value: 2 };
    }
    if (change === "session") state.generation = { value: 2 };

    page.rerender(view(value));
    expect(screen.queryByTestId("rendered")).toBeNull();
    await act(async () => next.resolve([]));
    expect(await screen.findByTestId("rendered")).toHaveAttribute("data-lesson", value.lessonId);
    await act(async () => first.reject(new Error("late synthetic import failure")));
    expect(screen.getByTestId("rendered")).toHaveAttribute("data-lesson", value.lessonId);
    expect(screen.queryByRole("alert")).toBeNull();
  },
);
it("does not publish an import resolved after auth generation changes before rerender", async () => {
  const first = pending();
  state.load.mockReturnValue(first.promise);
  render(view(pkg()));
  await act(async () => {});
  state.generation = { value: 2 };
  await act(async () => first.resolve([]));
  expect(screen.queryByTestId("rendered")).toBeNull();
});
it.each(["resolve", "reject"])("ignores %s after unmount", async (kind) => {
  const first = pending();
  state.load.mockReturnValue(first.promise);
  const page = render(view(pkg()));
  await act(async () => {});
  page.unmount();
  await act(async () =>
    kind === "resolve" ? first.resolve([]) : first.reject(new Error("after unmount")),
  );
  expect(screen.queryByTestId("rendered")).toBeNull();
});
