import { cleanup, render, screen, act, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AcademicOverviewPage } from "@/components/academic-education/AcademicOverviewPage";
import { getAcademicOverviewCopy } from "@/lib/academic-education/overview-copy";
import { LineOverview } from "./LineOverview";
import { KidsCurriculum, TechnicalCurriculum, TechnicalCatalogue } from "./LineCurriculum";
import { CurriculumLayout } from "./CurriculumLayout";
import { getLineCopy } from "@/lib/learning-lines";
import { getLineOverviewCopy } from "@/lib/line-overview-copy";
import { getTechnicalCurriculumPreview } from "@/lib/technical-track-preview";
import { parseKidsCatalogueTitles } from "@/lib/kids/use-curriculum-titles";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/locale/types";

const state = vi.hoisted(() => ({
  locale: "en" as SupportedLocale,
  parent: "signed-out",
  isAdmin: false,
  profiles: [] as { level_id: string }[],
  invoke: vi.fn(),
}));
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/lib/entitlements", () => ({ useEntitlement: () => ({ isAdmin: state.isAdmin }) }));
vi.mock("@/lib/technical-education/client", () => ({
  useTechnicalProgress: () => ({ progress: {}, paid: false }),
}));
vi.mock("@/components/site/Navbar", () => ({ Navbar: () => <header>Navigation</header> }));
vi.mock("@/components/site/Footer", () => ({ Footer: () => <footer>Footer</footer> }));
vi.mock("@/components/kids/KidsReleaseNotice", () => ({ KidsReleaseNotice: () => null }));
vi.mock("@/lib/locale/locale-context", () => ({
  useLocale: () => ({ locale: state.locale, dir: state.locale === "en" ? "ltr" : "rtl" }),
}));
vi.mock("@/lib/locale/use-locale-link-search", () => ({
  useLocaleLinkSearch: () => () => ({ locale: state.locale }),
}));
vi.mock("@/lib/kids/parent-state", () => ({
  useKidsParentState: () => ({ state: state.parent, profiles: state.profiles }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: state.invoke } },
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    search,
    children,
    ...props
  }: {
    to: string;
    params?: Record<string, string>;
    search?: Record<string, string>;
    children: React.ReactNode;
  }) => {
    let path = to;
    for (const [name, value] of Object.entries(params ?? {}))
      path = path.replace(`$${name}`, value);
    return (
      <a href={`${path}?${new URLSearchParams(search).toString()}`} {...props}>
        {children}
      </a>
    );
  },
}));
const response = (levelId: string, locale: SupportedLocale) => ({
  levelId,
  locale,
  titles: Array.from({ length: 12 }, (_, i) => ({
    lessonNumber: i + 1,
    title: `${locale} ${levelId} lesson ${i + 1}`,
  })),
});
beforeEach(() => {
  state.locale = "en";
  state.parent = "signed-out";
  state.isAdmin = false;
  state.profiles = [];
  state.invoke.mockReset();
  state.invoke.mockImplementation(async (_name, { body }) => ({
    data: response(body.levelId, body.locale),
    error: null,
  }));
});
afterEach(cleanup);

describe("line-specific overviews and curricula", () => {
  it.each(SUPPORTED_LOCALES)(
    "opens the Technical catalogue before its course contents in %s",
    (locale) => {
      state.locale = locale;
      const view = render(<TechnicalCatalogue />);
      expect(screen.getAllByTestId("technical-course-card")).toHaveLength(1);
      expect(screen.getByTestId("technical-course-card")).toHaveAttribute(
        "href",
        `/technical/courses/furniture?locale=${locale}`,
      );
      expect(view.container.querySelectorAll('a[href^="/technical/learn/"]')).toHaveLength(0);
    },
  );

  it.each(SUPPORTED_LOCALES)(
    "keeps the Academic overview separate from its course catalogue in %s",
    (locale) => {
      state.locale = locale;
      const view = render(<AcademicOverviewPage />);
      const c = getAcademicOverviewCopy(locale);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        getLineCopy(locale).academic,
      );
      expect(screen.getByRole("heading", { name: c.title })).toBeInTheDocument();
      expect(screen.getAllByRole("link", { name: c.browse })).toHaveLength(1);
      expect(screen.getByRole("link", { name: getLineCopy(locale).paths })).toHaveAttribute(
        "href",
        `/academic/curriculum?locale=${locale}`,
      );
      expect(screen.getByRole("link", { name: getLineCopy(locale).plans })).toHaveAttribute(
        "href",
        `/academic/pricing?locale=${locale}`,
      );
      for (const link of screen.getAllByRole("link", { name: c.browse }))
        expect(link).toHaveAttribute("href", `/academic/curriculum?locale=${locale}`);
      expect(view.container.querySelector('[data-testid="academic-course-card"]')).toBeNull();
      expect(view.container.querySelector('a[href^="/academic/learn/"]')).toBeNull();
      expect(state.invoke).not.toHaveBeenCalled();
      if (locale === "en") expect(view.container.textContent).not.toMatch(/[\u0600-\u06ff]/);
    },
  );
  it.each(SUPPORTED_LOCALES)(
    "opens all 36 Kids lesson links for administrators without child profiles in %s",
    async (locale) => {
      state.locale = locale;
      state.isAdmin = true;
      state.parent = "pending";
      const page = render(<KidsCurriculum />);
      await waitFor(() =>
        expect(page.container.querySelectorAll('a[href^="/kids/level-"]')).toHaveLength(36),
      );
      expect(page.container.querySelector('a[href^="/kids/family"]')).toBeNull();
    },
  );
  it.each(SUPPORTED_LOCALES)(
    "renders both overviews and the shared three-line curriculum shell in %s",
    (locale) => {
      state.locale = locale;
      for (const line of ["kids", "technical"] as const) {
        const view = render(<LineOverview line={line} />);
        const copy = getLineOverviewCopy(locale, line);
        expect(screen.getByRole("heading", { name: copy.ecosystemTitle })).toBeInTheDocument();
        expect(
          Array.from(view.container.querySelectorAll("section")).map((section) => section.id),
        ).toEqual(["ecosystem", "journey", "philosophy", "line-start"]);
        expect(screen.getByRole("link", { name: getLineCopy(locale).paths })).toHaveAttribute(
          "href",
          `/${line}/curriculum?locale=${locale}`,
        );
        if (line === "technical") {
          expect(screen.getByText(getLineCopy(locale).technicalPrice)).toBeInTheDocument();
          expect(screen.queryByText(getLineCopy(locale).unavailable)).not.toBeInTheDocument();
        }
        if (locale === "en") expect(view.container.textContent).not.toMatch(/[\u0600-\u06ff]/);
        cleanup();
      }
      for (const line of ["ai", "kids", "technical"] as const) {
        render(
          <CurriculumLayout line={line} subtitle="description">
            <p>Curriculum content</p>
          </CurriculumLayout>,
        );
        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
          getLineCopy(locale).paths,
        );
        expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
        expect(screen.getByRole("banner")).toBeInTheDocument();
        cleanup();
      }
    },
  );
  it.each(SUPPORTED_LOCALES)(
    "shows the whole furniture outline without advertising lesson access in %s",
    (locale) => {
      state.locale = locale;
      const view = render(<TechnicalCurriculum />);
      const modules = getTechnicalCurriculumPreview(locale).flatMap((section) => section.modules);
      expect(modules).toHaveLength(21);
      expect(modules.flatMap((module) => module.lessons)).toHaveLength(80);
      expect(view.container.querySelectorAll("a[href^='/technical/learn/']")).toHaveLength(80);
      expect(view.container.querySelectorAll("a[href*='experiments'], video, iframe")).toHaveLength(
        0,
      );
      expect(screen.getByRole("link", { name: getLineCopy(locale).plans })).toHaveAttribute(
        "href",
        `/technical/pricing?locale=${locale}`,
      );
      if (locale === "en") expect(view.container.textContent).not.toMatch(/[\u0600-\u06ff]/);
    },
  );
  it("keeps all 36 Kids lessons closed to visitors and opens links only for a ready matching profile", async () => {
    const view = render(<KidsCurriculum />);
    await screen.findByText("en level-1 lesson 1");
    expect(view.container.querySelectorAll("li")).toHaveLength(36);
    expect(view.container.querySelectorAll("a[href^='/kids/level-']")).toHaveLength(0);
    state.parent = "ready";
    state.profiles = [{ level_id: "level-1" }];
    view.rerender(<KidsCurriculum />);
    expect(view.container.querySelectorAll("a[href^='/kids/level-1/']")).toHaveLength(12);
    expect(
      view.container.querySelectorAll("a[href^='/kids/level-2/'], a[href^='/kids/level-3/']"),
    ).toHaveLength(0);
    state.parent = "consent-required";
    view.rerender(<KidsCurriculum />);
    expect(view.container.querySelectorAll("a[href^='/kids/level-']")).toHaveLength(0);
  });
  it("removes old language titles while reloading and ignores late responses", async () => {
    const pending: Array<() => void> = [];
    state.invoke.mockImplementation(
      (_name, { body }) =>
        new Promise((resolve) =>
          pending.push(() => resolve({ data: response(body.levelId, body.locale), error: null })),
        ),
    );
    const view = render(<KidsCurriculum />);
    state.locale = "ar-MSA";
    view.rerender(<KidsCurriculum />);
    await act(async () => {
      pending.slice(0, 3).forEach((finish) => finish());
    });
    expect(screen.queryByText("en level-1 lesson 1")).not.toBeInTheDocument();
    await act(async () => {
      pending.slice(3).forEach((finish) => finish());
    });
    await waitFor(() => expect(screen.getByText("ar-MSA level-1 lesson 1")).toBeInTheDocument());
  });
  it("rejects another level, language, incomplete catalogue or wrong lesson numbering", () => {
    const valid = response("level-1", "en");
    expect(parseKidsCatalogueTitles(valid, "level-1", "en")).toHaveLength(12);
    expect(parseKidsCatalogueTitles(valid, "level-2", "en")).toBeNull();
    expect(parseKidsCatalogueTitles(valid, "level-1", "ar-EG")).toBeNull();
    expect(
      parseKidsCatalogueTitles({ ...valid, titles: valid.titles.slice(1) }, "level-1", "en"),
    ).toBeNull();
    valid.titles[0].lessonNumber = 2;
    expect(parseKidsCatalogueTitles(valid, "level-1", "en")).toBeNull();
  });
});
