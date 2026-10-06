import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PathIntroduction } from "./PathIntroduction";
import { PathStory } from "./PathStory";
import { getPathStoryCopy } from "@/lib/path-story";

import { KidsCurriculum, TechnicalCurriculum, TechnicalCatalogue } from "./LineCurriculum";

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

describe("canonical learning path catalogues and contents", () => {
  it.each(SUPPORTED_LOCALES)(
    "gives visitors and admins identical Kids path cards in %s",
    (locale) => {
      state.locale = locale;
      const page = render(<KidsCurriculum />);
      const before = page.container.innerHTML;
      expect(screen.getAllByTestId("kids-course-card")).toHaveLength(3);
      expect(page.container.querySelectorAll('a[href^="/kids/level-"][href*="/1?"]')).toHaveLength(
        0,
      );
      expect(page.container.textContent).not.toContain(getPathStoryCopy(locale).stations);
      state.isAdmin = true;
      state.parent = "ready";
      state.profiles = [{ level_id: "level-1" }];
      page.rerender(<KidsCurriculum />);
      expect(page.container.innerHTML).toBe(before);
      expect(state.invoke).not.toHaveBeenCalled();
      if (locale === "en") expect(page.container.textContent).not.toMatch(/[\u0600-\u06ff]/);
    },
  );
  it.each(SUPPORTED_LOCALES)(
    "opens the furniture introduction before its 80 steps in %s",
    (locale) => {
      state.locale = locale;
      const view = render(<TechnicalCatalogue />);
      expect(screen.getByTestId("technical-course-card")).toHaveAttribute(
        "href",
        `/technical/courses/furniture?locale=${locale}`,
      );
      expect(view.container.querySelectorAll('a[href^="/technical/learn/"]')).toHaveLength(0);
      cleanup();
      const contents = render(<TechnicalCurriculum />);
      const stations = getTechnicalCurriculumPreview(locale).flatMap((s) => s.modules);
      expect(stations).toHaveLength(21);
      expect(stations.flatMap((s) => s.lessons)).toHaveLength(80);
      expect(contents.container.querySelectorAll('a[href^="/technical/learn/"]')).toHaveLength(80);
      expect(screen.getByRole("link", { name: getPathStoryCopy(locale).backPath })).toHaveAttribute(
        "href",
        `/technical/courses/furniture?locale=${locale}`,
      );
      expect(
        contents.container.querySelectorAll('a[href*="experiments"],video,iframe'),
      ).toHaveLength(0);
      if (locale === "en") expect(contents.container.textContent).not.toMatch(/[\u0600-\u06ff]/);
    },
  );
  it.each(SUPPORTED_LOCALES)(
    "uses contextual story, goals and a single contents destination in %s",
    (locale) => {
      state.locale = locale;
      for (const line of ["kids", "technical", "academic"] as const) {
        const href =
          line === "kids"
            ? "/kids/level-1/contents"
            : line === "technical"
              ? "/technical/courses/furniture/contents"
              : "/academic/courses/AC-BUS/contents";
        const view = render(<PathIntroduction line={line} ages="10–12" contentsHref={href} />);
        expect(
          screen.getAllByRole("link", { name: getPathStoryCopy(locale).content }),
        ).toHaveLength(1);
        expect(
          screen.getByRole("link", { name: getPathStoryCopy(locale).content }),
        ).toHaveAttribute("href", `${href}?locale=${locale}`);
        expect(view.container.querySelector('a[href*="/learn/"]')).toBeNull();
        if (locale === "en") expect(view.container.textContent).not.toMatch(/[\u0600-\u06ff]/);
        cleanup();
      }
      render(<PathStory full />);
      const c = getPathStoryCopy(locale);
      for (const title of [c.visionTitle, c.missionTitle, c.valuesTitle])
        expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    },
  );
  it("rejects another age, language, incomplete catalogue or wrong step numbering", () => {
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
